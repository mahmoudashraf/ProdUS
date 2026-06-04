package com.produs.engine;

import com.produs.audit.AuditEvent;
import com.produs.catalog.ServiceModule;
import com.produs.catalog.ServiceModuleRepository;
import com.produs.commerce.SupportSubscription;
import com.produs.commerce.SupportSubscriptionRepository;
import com.produs.entity.User;
import com.produs.packages.PackageModule;
import com.produs.packages.PackageModuleRepository;
import com.produs.product.ProductProfile;
import com.produs.product.ProductProfileRepository;
import com.produs.product.ProductServiceRecommendation;
import com.produs.product.ProductServiceRecommendationRepository;
import com.produs.requirements.RequirementIntake;
import com.produs.requirements.RequirementIntakeRepository;
import com.produs.scanner.NormalizedFinding;
import com.produs.scanner.NormalizedFindingRepository;
import com.produs.scanner.ScanRun;
import com.produs.scanner.ScanRunRepository;
import com.produs.scanner.ScannerEvidenceItem;
import com.produs.scanner.ScannerEvidenceItemRepository;
import com.produs.service.AuditService;
import com.produs.workspace.Milestone;
import com.produs.workspace.MilestoneRepository;
import com.produs.workspace.ProjectWorkspace;
import com.produs.workspace.ProjectWorkspaceRepository;
import com.produs.workspace.WorkspaceParticipant;
import com.produs.workspace.WorkspaceParticipantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductizationEngineService {

    private final ProductProfileRepository productRepository;
    private final RequirementIntakeRepository requirementRepository;
    private final ProductDiagnosisRepository diagnosisRepository;
    private final ProductFindingRepository findingRepository;
    private final ServiceModuleRepository moduleRepository;
    private final ProjectWorkspaceRepository workspaceRepository;
    private final WorkspaceParticipantRepository participantRepository;
    private final PackageModuleRepository packageModuleRepository;
    private final MilestoneRepository milestoneRepository;
    private final AcceptanceCriterionRepository criterionRepository;
    private final EvidenceRequirementRepository evidenceRequirementRepository;
    private final AutomatedCheckRepository automatedCheckRepository;
    private final ReviewDecisionRepository reviewDecisionRepository;
    private final HandoffDocumentRepository handoffDocumentRepository;
    private final ProductHealthReviewRepository healthReviewRepository;
    private final SupportSubscriptionRepository supportSubscriptionRepository;
    private final IntegrationConnectionRepository integrationConnectionRepository;
    private final IntegrationSignalRepository integrationSignalRepository;
    private final NormalizedFindingRepository normalizedFindingRepository;
    private final ScannerEvidenceItemRepository scannerEvidenceItemRepository;
    private final ScanRunRepository scanRunRepository;
    private final ProductServiceRecommendationRepository serviceRecommendationRepository;
    private final ScannerFindingClassifier scannerFindingClassifier;
    private final AuditService auditService;

    @Transactional
    public DiagnosisResponse createDiagnosis(User user, UUID productId, DiagnosisRequest request) {
        ProductProfile product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        requireProductOwner(user, product);
        RequirementIntake intake = null;
        if (request.requirementIntakeId() != null) {
            intake = requirementRepository.findById(request.requirementIntakeId())
                    .orElseThrow(() -> new IllegalArgumentException("Requirement intake not found"));
            if (!intake.getProductProfile().getId().equals(productId)) {
                throw new IllegalArgumentException("Requirement intake belongs to another product");
            }
        }

        String combinedSignal = joined(
                product.getSummary(),
                product.getTechStack(),
                product.getRiskProfile(),
                request.businessGoal(),
                request.currentProblems(),
                request.accessSignals(),
                intake == null ? null : intake.getBusinessGoal(),
                intake == null ? null : intake.getCurrentProblems(),
                intake == null ? null : intake.getRiskSignals()
        );

        ProductDiagnosis diagnosis = new ProductDiagnosis();
        diagnosis.setProductProfile(product);
        diagnosis.setRequirementIntake(intake);
        diagnosis.setCreatedBy(user);
        diagnosis.setAccessSignals(request.accessSignals());
        diagnosis.setSummary(firstNonBlank(
                request.summary(),
                "Deterministic productization diagnosis for " + product.getName() + ". Findings are based on owner-provided product context, access signals, and catalog rules. No AI execution was performed."
        ));
        diagnosis.setReadinessScore(readinessScore(product, combinedSignal));
        diagnosis.setAiReady(true);
        diagnosis.setAiExecuted(false);
        diagnosis = diagnosisRepository.save(diagnosis);

        List<ProductFinding> findings = seedFindings(diagnosis, combinedSignal);
        auditService.logAction(user.getId(), "CREATE_DIAGNOSIS", "PRODUCT_DIAGNOSIS", diagnosis.getId(), AuditEvent.RiskLevel.MEDIUM,
                "Created diagnosis with " + findings.size() + " deterministic findings for product " + product.getName());
        return toDiagnosisResponse(diagnosis, findings);
    }

    @Transactional(readOnly = true)
    public List<DiagnosisResponse> diagnoses(User user, UUID productId) {
        ProductProfile product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        requireProductOwner(user, product);
        return diagnosisRepository.findByProductProfileIdOrderByCreatedAtDesc(productId).stream()
                .map(diagnosis -> toDiagnosisResponse(diagnosis, findingRepository.findByDiagnosisIdOrderByCreatedAtAsc(diagnosis.getId())))
                .toList();
    }

    @Transactional
    public DiagnosisResponse createScannerReadinessDiagnosis(User user, UUID productId, ScannerReadinessDiagnosisRequest request) {
        ProductProfile product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        requireProductOwner(user, product);

        ProjectWorkspace workspace = null;
        if (request.workspaceId() != null) {
            workspace = workspaceRepository.findById(request.workspaceId())
                    .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
            if (!workspace.getPackageInstance().getProductProfile().getId().equals(productId)) {
                throw new IllegalArgumentException("Workspace belongs to another product");
            }
            requireWorkspaceViewer(user, workspace);
        }

        boolean includeAcceptedRisk = Boolean.TRUE.equals(request.includeAcceptedRisk());
        boolean createServiceRecommendations = !Boolean.FALSE.equals(request.createServiceRecommendations());
        List<NormalizedFinding> scannerFindings = request.workspaceId() == null
                ? normalizedFindingRepository.findByProductProfileIdOrderBySeverityDescCreatedAtDesc(productId)
                : normalizedFindingRepository.findByProductProfileIdAndWorkspaceIdOrderBySeverityDescCreatedAtDesc(productId, request.workspaceId());
        DiagnosisResponse response = createScannerReadinessDiagnosisFromFindings(
                user,
                product,
                workspace,
                scannerFindings,
                includeAcceptedRisk,
                createServiceRecommendations,
                request.summary(),
                null,
                true
        );
        auditService.logAction(user.getId(), "CREATE_SCANNER_READINESS_DIAGNOSIS", "PRODUCT_DIAGNOSIS", response.id(), AuditEvent.RiskLevel.HIGH,
                "Refreshed scanner readiness mapping for product " + product.getId());
        return response;
    }

    @Transactional
    public DiagnosisResponse syncScannerReadinessDiagnosisForScanRun(User actor, UUID scanRunId) {
        ScanRun scanRun = scanRunRepository.findById(scanRunId)
                .orElseThrow(() -> new IllegalArgumentException("Scan run not found"));
        if (scanRun.getStatus() != ScanRun.RunStatus.COMPLETED) {
            throw new IllegalStateException("Scanner readiness mapping can only be generated for completed scan runs");
        }
        String generatedFromScanRunIds = scanRun.getId().toString();
        ProductDiagnosis existing = diagnosisRepository.findByProductProfileIdAndDiagnosisSourceAndGeneratedFromScanRunIds(
                scanRun.getProductProfile().getId(),
                ProductDiagnosis.DiagnosisSource.SCANNER_READINESS,
                generatedFromScanRunIds
        ).orElse(null);
        if (existing != null) {
            return toDiagnosisResponse(existing, findingRepository.findByDiagnosisIdOrderByCreatedAtAsc(existing.getId()));
        }

        List<NormalizedFinding> scannerFindings = normalizedFindingRepository.findByScanRunIdOrderBySeverityDescCreatedAtDesc(scanRunId);
        DiagnosisResponse response = createScannerReadinessDiagnosisFromFindings(
                actor,
                scanRun.getProductProfile(),
                scanRun.getWorkspace(),
                scannerFindings,
                false,
                true,
                "Scanner findings were mapped automatically after scan completion.",
                List.of(scanRun.getId()),
                false
        );
        auditService.logAction(actor.getId(), "SYNC_SCANNER_READINESS_MAPPING", "SCAN_RUN", scanRun.getId(), AuditEvent.RiskLevel.MEDIUM,
                "Stored scanner readiness mapping for completed scan " + scanRun.getId());
        return response;
    }

    @Transactional
    public List<CriterionResponse> generateCriteria(User user, UUID milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found"));
        requireWorkspaceCoordinator(user, milestone.getWorkspace());
        if (!criterionRepository.existsByMilestoneId(milestoneId)) {
            PackageModule module = matchPackageModule(milestone);
            List<String> criterionTexts = splitStatements(module == null ? null : module.getAcceptanceCriteria());
            if (criterionTexts.isEmpty()) {
                criterionTexts = List.of("Evidence proves the milestone objective has been completed and is ready for owner review.");
            }
            int index = 1;
            for (String text : criterionTexts) {
                AcceptanceCriterion criterion = new AcceptanceCriterion();
                criterion.setMilestone(milestone);
                criterion.setPackageModule(module);
                criterion.setServiceModule(module == null ? null : module.getServiceModule());
                criterion.setTitle("Criterion " + index);
                criterion.setDescription(text);
                criterion.setRequired(true);
                criterion.setHumanReviewRequired(true);
                criterion = criterionRepository.save(criterion);
                createEvidenceRequirements(milestone, criterion, module);
                index++;
            }
        }
        auditService.logAction(user.getId(), "GENERATE_ACCEPTANCE_CRITERIA", "MILESTONE", milestoneId, AuditEvent.RiskLevel.MEDIUM,
                "Generated or loaded milestone acceptance criteria");
        return criteria(user, milestoneId);
    }

    @Transactional(readOnly = true)
    public List<CriterionResponse> criteria(User user, UUID milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found"));
        requireWorkspaceViewer(user, milestone.getWorkspace());
        return criterionRepository.findByMilestoneIdOrderByCreatedAtAsc(milestoneId).stream()
                .map(this::toCriterionResponse)
                .toList();
    }

    @Transactional
    public EvidenceRequirementResponse updateEvidenceRequirement(User user, UUID requirementId, EvidenceRequirementRequest request) {
        EvidenceRequirement requirement = evidenceRequirementRepository.findById(requirementId)
                .orElseThrow(() -> new IllegalArgumentException("Evidence requirement not found"));
        requireWorkspaceCoordinator(user, requirement.getMilestone().getWorkspace());
        if (request.status() != null) {
            requirement.setStatus(request.status());
        }
        if (request.evidenceReference() != null) {
            requirement.setEvidenceReference(request.evidenceReference());
        }
        EvidenceRequirement saved = evidenceRequirementRepository.save(requirement);
        auditService.logAction(user.getId(), "UPDATE_EVIDENCE_REQUIREMENT", "EVIDENCE_REQUIREMENT", saved.getId(), AuditEvent.RiskLevel.MEDIUM,
                "Evidence requirement set to " + saved.getStatus());
        return toEvidenceRequirementResponse(saved);
    }

    @Transactional
    public AutomatedCheckResponse createCheck(User user, UUID criterionId, AutomatedCheckRequest request) {
        AcceptanceCriterion criterion = criterionRepository.findById(criterionId)
                .orElseThrow(() -> new IllegalArgumentException("Acceptance criterion not found"));
        requireWorkspaceCoordinator(user, criterion.getMilestone().getWorkspace());
        AutomatedCheck check = new AutomatedCheck();
        check.setWorkspace(criterion.getMilestone().getWorkspace());
        check.setMilestone(criterion.getMilestone());
        check.setCriterion(criterion);
        check.setCheckType(firstNonBlank(request.checkType(), "manual-check"));
        check.setProvider(firstNonBlank(request.provider(), "manual"));
        check.setExternalRef(request.externalRef());
        check.setStatus(request.status() == null ? AutomatedCheck.CheckStatus.PENDING : request.status());
        check.setSummary(request.summary());
        check.setRawPayload(request.rawPayload());
        check.setObservedAt(request.observedAt() == null ? LocalDateTime.now() : request.observedAt());
        AutomatedCheck saved = automatedCheckRepository.save(check);
        auditService.logAction(user.getId(), "CREATE_AUTOMATED_CHECK", "AUTOMATED_CHECK", saved.getId(), AuditEvent.RiskLevel.MEDIUM,
                "Recorded " + saved.getStatus() + " check for criterion " + criterion.getId());
        return toAutomatedCheckResponse(saved);
    }

    @Transactional
    public ReviewDecisionResponse reviewCriterion(User user, UUID criterionId, ReviewDecisionRequest request) {
        AcceptanceCriterion criterion = criterionRepository.findById(criterionId)
                .orElseThrow(() -> new IllegalArgumentException("Acceptance criterion not found"));
        requireWorkspaceCoordinator(user, criterion.getMilestone().getWorkspace());
        ReviewDecision decision = new ReviewDecision();
        decision.setMilestone(criterion.getMilestone());
        decision.setCriterion(criterion);
        decision.setReviewer(user);
        decision.setDecision(request.decision() == null ? ReviewDecision.Decision.COMMENT : request.decision());
        decision.setNote(request.note());

        if (decision.getDecision() == ReviewDecision.Decision.APPROVE) {
            ensureEvidenceStateComplete(criterion);
            criterion.setStatus(AcceptanceCriterion.CriterionStatus.PASSED);
        } else if (decision.getDecision() == ReviewDecision.Decision.REQUEST_CHANGES
                || decision.getDecision() == ReviewDecision.Decision.REJECT) {
            criterion.setStatus(AcceptanceCriterion.CriterionStatus.FAILED);
            criterion.getMilestone().setStatus(Milestone.MilestoneStatus.BLOCKED);
        } else {
            criterion.setStatus(AcceptanceCriterion.CriterionStatus.IN_REVIEW);
        }

        criterionRepository.save(criterion);
        updateMilestoneAcceptanceState(criterion.getMilestone());
        ReviewDecision saved = reviewDecisionRepository.save(decision);
        auditService.logAction(user.getId(), "REVIEW_ACCEPTANCE_CRITERION", "ACCEPTANCE_CRITERION", criterion.getId(), AuditEvent.RiskLevel.HIGH,
                "Decision: " + saved.getDecision());
        return toReviewDecisionResponse(saved);
    }

    @Transactional(readOnly = true)
    public WorkspaceGovernanceResponse workspaceGovernance(User user, UUID workspaceId) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceViewer(user, workspace);
        List<Milestone> milestones = milestoneRepository.findByWorkspaceIdOrderByCreatedAtAsc(workspaceId);
        List<CriterionResponse> criteria = milestones.stream()
                .flatMap(milestone -> criterionRepository.findByMilestoneIdOrderByCreatedAtAsc(milestone.getId()).stream())
                .map(this::toCriterionResponse)
                .toList();
        List<AutomatedCheckResponse> checks = automatedCheckRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream()
                .map(this::toAutomatedCheckResponse)
                .toList();
        List<HandoffResponse> handoffs = handoffDocumentRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream()
                .map(this::toHandoffResponse)
                .toList();
        List<HealthReviewResponse> healthReviews = healthReviewRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream()
                .map(this::toHealthReviewResponse)
                .toList();
        List<IntegrationConnectionResponse> integrations = integrationConnectionRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream()
                .map(this::toIntegrationConnectionResponse)
                .toList();
        return new WorkspaceGovernanceResponse(workspace.getId(), workspace.getName(), criteria, checks, handoffs, healthReviews, integrations);
    }

    @Transactional
    public HandoffResponse upsertHandoff(User user, UUID workspaceId, HandoffRequest request) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceCoordinator(user, workspace);
        HandoffDocument handoff = handoffDocumentRepository.findTopByWorkspaceIdOrderByCreatedAtDesc(workspaceId)
                .orElseGet(HandoffDocument::new);
        if (handoff.getId() == null) {
            handoff.setWorkspace(workspace);
            handoff.setCreatedBy(user);
        }
        handoff.setTitle(firstNonBlank(request.title(), workspace.getName() + " handoff"));
        handoff.setRunbook(request.runbook());
        handoff.setAccessChecklist(request.accessChecklist());
        handoff.setKnownIssues(request.knownIssues());
        handoff.setSupportScope(request.supportScope());
        if (request.status() != null) {
            handoff.setStatus(request.status());
            if (request.status() == HandoffDocument.HandoffStatus.ACCEPTED) {
                workspace.setStatus(ProjectWorkspace.WorkspaceStatus.SUPPORT_HANDOFF);
                workspaceRepository.save(workspace);
            }
        }
        HandoffDocument saved = handoffDocumentRepository.save(handoff);
        auditService.logAction(user.getId(), "UPSERT_HANDOFF", "HANDOFF_DOCUMENT", saved.getId(), AuditEvent.RiskLevel.HIGH,
                "Handoff status: " + saved.getStatus());
        return toHandoffResponse(saved);
    }

    @Transactional
    public HealthReviewResponse createHealthReview(User user, UUID workspaceId, HealthReviewRequest request) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceCoordinator(user, workspace);
        ProductHealthReview review = new ProductHealthReview();
        review.setWorkspace(workspace);
        review.setCreatedBy(user);
        if (request.supportSubscriptionId() != null) {
            SupportSubscription subscription = supportSubscriptionRepository.findById(request.supportSubscriptionId())
                    .orElseThrow(() -> new IllegalArgumentException("Support subscription not found"));
            if (!subscription.getWorkspace().getId().equals(workspaceId)) {
                throw new IllegalArgumentException("Support subscription belongs to another workspace");
            }
            review.setSupportSubscription(subscription);
        }
        review.setPeriodStart(request.periodStart());
        review.setPeriodEnd(request.periodEnd());
        review.setHealthScore(clamp(request.healthScore() == null ? 70 : request.healthScore(), 0, 100));
        review.setSummary(firstNonBlank(request.summary(), "Workspace health review"));
        review.setRisks(request.risks());
        review.setActions(request.actions());
        if (request.status() != null) {
            review.setStatus(request.status());
        }
        ProductHealthReview saved = healthReviewRepository.save(review);
        auditService.logAction(user.getId(), "CREATE_HEALTH_REVIEW", "PRODUCT_HEALTH_REVIEW", saved.getId(), AuditEvent.RiskLevel.MEDIUM,
                "Health score: " + saved.getHealthScore());
        return toHealthReviewResponse(saved);
    }

    @Transactional
    public IntegrationConnectionResponse createIntegration(User user, UUID workspaceId, IntegrationConnectionRequest request) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceCoordinator(user, workspace);
        IntegrationConnection connection = new IntegrationConnection();
        connection.setOwner(workspace.getOwner());
        connection.setWorkspace(workspace);
        connection.setProductProfile(workspace.getPackageInstance() == null ? null : workspace.getPackageInstance().getProductProfile());
        connection.setProviderType(request.providerType() == null ? IntegrationConnection.ProviderType.OTHER : request.providerType());
        connection.setName(firstNonBlank(request.name(), connection.getProviderType().name()));
        connection.setExternalRef(request.externalRef());
        connection.setScopedAccessNote(request.scopedAccessNote());
        if (request.status() != null) {
            connection.setStatus(request.status());
        }
        connection.setLastCheckedAt(LocalDateTime.now());
        IntegrationConnection saved = integrationConnectionRepository.save(connection);
        auditService.logAction(user.getId(), "CREATE_INTEGRATION_CONNECTION", "INTEGRATION_CONNECTION", saved.getId(), AuditEvent.RiskLevel.HIGH,
                "Provider: " + saved.getProviderType());
        return toIntegrationConnectionResponse(saved);
    }

    @Transactional
    public IntegrationSignalResponse createIntegrationSignal(User user, UUID connectionId, IntegrationSignalRequest request) {
        IntegrationConnection connection = integrationConnectionRepository.findById(connectionId)
                .orElseThrow(() -> new IllegalArgumentException("Integration connection not found"));
        ProjectWorkspace workspace = connection.getWorkspace();
        if (workspace == null) {
            throw new IllegalArgumentException("Integration connection is not workspace-scoped");
        }
        requireWorkspaceCoordinator(user, workspace);
        Milestone milestone = null;
        if (request.milestoneId() != null) {
            milestone = milestoneRepository.findById(request.milestoneId())
                    .orElseThrow(() -> new IllegalArgumentException("Milestone not found"));
            if (!milestone.getWorkspace().getId().equals(workspace.getId())) {
                throw new IllegalArgumentException("Milestone belongs to another workspace");
            }
        }
        AcceptanceCriterion criterion = null;
        if (request.criterionId() != null) {
            criterion = criterionRepository.findById(request.criterionId())
                    .orElseThrow(() -> new IllegalArgumentException("Acceptance criterion not found"));
            if (!criterion.getMilestone().getWorkspace().getId().equals(workspace.getId())) {
                throw new IllegalArgumentException("Criterion belongs to another workspace");
            }
            milestone = criterion.getMilestone();
        }

        IntegrationSignal signal = new IntegrationSignal();
        signal.setConnection(connection);
        signal.setWorkspace(workspace);
        signal.setMilestone(milestone);
        signal.setCriterion(criterion);
        signal.setSignalType(firstNonBlank(request.signalType(), "integration-signal"));
        signal.setStatus(request.status() == null ? IntegrationSignal.SignalStatus.INFO : request.status());
        signal.setSummary(request.summary());
        signal.setEvidencePayload(request.evidencePayload());
        signal.setRecordedAt(request.recordedAt() == null ? LocalDateTime.now() : request.recordedAt());
        signal = integrationSignalRepository.save(signal);
        connection.setLastCheckedAt(LocalDateTime.now());
        connection.setStatus(signal.getStatus() == IntegrationSignal.SignalStatus.FAILED
                ? IntegrationConnection.ConnectionStatus.NEEDS_ATTENTION
                : IntegrationConnection.ConnectionStatus.ACTIVE);
        integrationConnectionRepository.save(connection);

        if (criterion != null) {
            AutomatedCheck check = new AutomatedCheck();
            check.setWorkspace(workspace);
            check.setMilestone(criterion.getMilestone());
            check.setCriterion(criterion);
            check.setCheckType(signal.getSignalType());
            check.setProvider(connection.getProviderType().name());
            check.setExternalRef(connection.getExternalRef());
            check.setStatus(toCheckStatus(signal.getStatus()));
            check.setSummary(signal.getSummary());
            check.setRawPayload(signal.getEvidencePayload());
            check.setObservedAt(signal.getRecordedAt());
            automatedCheckRepository.save(check);
        }

        auditService.logAction(user.getId(), "CREATE_INTEGRATION_SIGNAL", "INTEGRATION_SIGNAL", signal.getId(), AuditEvent.RiskLevel.MEDIUM,
                "Signal status: " + signal.getStatus());
        return toIntegrationSignalResponse(signal);
    }

    private DiagnosisResponse createScannerReadinessDiagnosisFromFindings(
            User actor,
            ProductProfile product,
            ProjectWorkspace workspace,
            List<NormalizedFinding> findings,
            boolean includeAcceptedRisk,
            boolean createServiceRecommendations,
            String summary,
            List<UUID> forcedScanRunIds,
            boolean manualRefresh
    ) {
        List<NormalizedFinding> scannerFindings = findings.stream()
                .filter(finding -> includeAcceptedRisk || activeScannerFinding(finding))
                .sorted(Comparator
                        .comparingInt((NormalizedFinding finding) -> severityRank(finding.getSeverity())).reversed()
                        .thenComparing(NormalizedFinding::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        List<UUID> scanRunIds = forcedScanRunIds != null
                ? forcedScanRunIds.stream().distinct().toList()
                : scannerFindings.stream()
                        .map(finding -> finding.getScanRun().getId())
                        .distinct()
                        .toList();
        String generatedFromScanRunIds = scanRunIds.stream()
                .map(UUID::toString)
                .reduce((left, right) -> left + "," + right)
                .orElse("");
        List<ScannerEvidenceItem> evidenceItems = scanRunIds.isEmpty()
                ? List.of()
                : scannerEvidenceItemRepository.findByScanRunIdInOrderByCreatedAtDesc(scanRunIds);
        List<ScanRun> scanRuns = scanRunIds.isEmpty()
                ? List.of()
                : scanRunRepository.findAllById(scanRunIds);

        ProductDiagnosis diagnosis = new ProductDiagnosis();
        diagnosis.setProductProfile(product);
        diagnosis.setWorkspace(workspace);
        diagnosis.setCreatedBy(actor);
        diagnosis.setDiagnosisSource(ProductDiagnosis.DiagnosisSource.SCANNER_READINESS);
        diagnosis.setAiReady(true);
        diagnosis.setAiExecuted(false);
        diagnosis.setReadinessScore(scannerReadinessScore(scannerFindings));
        diagnosis.setGeneratedFromScanRunIds(generatedFromScanRunIds);
        diagnosis.setTopBlockerCount((int) scannerFindings.stream()
                .filter(finding -> finding.getSeverity() == NormalizedFinding.FindingSeverity.CRITICAL || finding.getSeverity() == NormalizedFinding.FindingSeverity.HIGH)
                .count());
        diagnosis.setEvidenceCount(evidenceItems.size());
        diagnosis.setAccessSignals("Scanner-backed diagnosis from " + scanRuns.size() + " scan run(s), " + evidenceItems.size()
                + " evidence item(s), and " + scannerFindings.size() + " active finding(s).");
        diagnosis.setSummary(firstNonBlank(
                summary,
                scannerFindings.isEmpty()
                        ? "No active scanner findings are currently blocking productization. Keep scheduled evidence refresh enabled before launch decisions."
                        : (manualRefresh
                                ? "Scanner findings were refreshed against the current production-readiness catalog."
                                : "Scanner findings were mapped automatically to production-readiness areas, evidence needs, and catalog services.")
        ));
        diagnosis = diagnosisRepository.save(diagnosis);

        List<ProductFinding> productFindings = new ArrayList<>();
        Map<ServiceModule, List<NormalizedFinding>> findingsByModule = new LinkedHashMap<>();
        int unmappedCount = 0;
        for (NormalizedFinding scannerFinding : scannerFindings) {
            ScannerFindingClassifier.ScannerFindingClassification classification = scannerFindingClassifier.classify(scannerFinding);
            ServiceModule mappedModule = classification.serviceModuleCode() == null ? null : findModule(classification.serviceModuleCode());
            if (mappedModule == null) {
                unmappedCount++;
            } else {
                findingsByModule.computeIfAbsent(mappedModule, ignored -> new ArrayList<>()).add(scannerFinding);
            }
            persistScannerClassification(scannerFinding, classification, mappedModule);
            productFindings.add(createScannerProductFinding(diagnosis, scannerFinding, classification, mappedModule));
        }
        diagnosis.setUnmappedFindingCount(unmappedCount);
        diagnosisRepository.save(diagnosis);

        int recommendationsCreated = createServiceRecommendations
                ? createScannerServiceRecommendations(product, findingsByModule)
                : 0;
        if (!manualRefresh) {
            auditService.logAction(actor.getId(), "STORE_SCANNER_READINESS_DIAGNOSIS", "PRODUCT_DIAGNOSIS", diagnosis.getId(), AuditEvent.RiskLevel.MEDIUM,
                    "Stored scanner readiness map from " + scanRunIds.size() + " scan run(s), "
                            + scannerFindings.size() + " active finding(s), and " + recommendationsCreated + " service recommendation(s)");
        }
        return toDiagnosisResponse(diagnosis, productFindings);
    }

    private void persistScannerClassification(
            NormalizedFinding scannerFinding,
            ScannerFindingClassifier.ScannerFindingClassification classification,
            ServiceModule mappedModule
    ) {
        scannerFinding.setFindingCategory(classification.category());
        scannerFinding.setReadinessArea(classification.readinessArea());
        scannerFinding.setBusinessRisk(classification.businessRisk());
        scannerFinding.setEvidenceRequired(classification.evidenceRequired());
        scannerFinding.setMappingReason(classification.mappingReason());
        scannerFinding.setMappingConfidence(classification.confidence());
        scannerFinding.setMappingSource("RULE_BASED_SCANNER_CATALOG");
        scannerFinding.setRecommendedModule(mappedModule);
        scannerFinding.setConfidenceBasis(firstNonBlank(scannerFinding.getConfidenceBasis(), classification.mappingReason()));
        normalizedFindingRepository.save(scannerFinding);
    }

    private ProductFinding createScannerProductFinding(
            ProductDiagnosis diagnosis,
            NormalizedFinding scannerFinding,
            ScannerFindingClassifier.ScannerFindingClassification classification,
            ServiceModule mappedModule
    ) {
        ProductFinding productFinding = new ProductFinding();
        productFinding.setDiagnosis(diagnosis);
        productFinding.setNormalizedFinding(scannerFinding);
        productFinding.setScannerEvidenceItem(scannerFinding.getEvidenceItem());
        productFinding.setRecommendedModule(mappedModule);
        productFinding.setTitle(scannerFinding.getTitle());
        productFinding.setDescription(scannerFinding.getDescription());
        productFinding.setAffectedLayer(firstNonBlank(
                mappedModule == null ? null : mappedModule.getServiceLayer(),
                classification.readinessArea(),
                scannerFinding.getAffectedComponent()
        ));
        productFinding.setReadinessArea(classification.readinessArea());
        productFinding.setBusinessRisk(classification.businessRisk());
        productFinding.setOwnerDecision(ownerDecisionFor(scannerFinding, mappedModule));
        productFinding.setEvidenceRequired(classification.evidenceRequired());
        productFinding.setMappingReason(classification.mappingReason());
        productFinding.setMappingConfidence(classification.confidence());
        productFinding.setMappingSource("RULE_BASED_SCANNER_CATALOG");
        productFinding.setSeverity(ProductFinding.FindingSeverity.valueOf(scannerFinding.getSeverity().name()));
        productFinding.setConfidenceLevel(classification.confidence() >= 0.85
                ? ProductFinding.ConfidenceLevel.HIGH
                : ProductFinding.ConfidenceLevel.MEDIUM);
        productFinding.setConfidenceBasis(classification.mappingReason());
        productFinding.setSourceSignal(scannerFinding.getSourceTool()
                + (scannerFinding.getSourceRuleId() == null ? "" : " / " + scannerFinding.getSourceRuleId()));
        return findingRepository.save(productFinding);
    }

    private int createScannerServiceRecommendations(ProductProfile product, Map<ServiceModule, List<NormalizedFinding>> findingsByModule) {
        int sequence = serviceRecommendationRepository.findByProductProfileIdOrderBySequenceNumberAscCreatedAtAsc(product.getId()).size() + 1;
        int created = 0;
        for (Map.Entry<ServiceModule, List<NormalizedFinding>> entry : findingsByModule.entrySet()) {
            ServiceModule module = entry.getKey();
            if (serviceRecommendationRepository.findByProductProfileIdAndServiceModuleId(product.getId(), module.getId()).isPresent()) {
                continue;
            }
            List<NormalizedFinding> findings = entry.getValue();
            ProductServiceRecommendation recommendation = new ProductServiceRecommendation();
            recommendation.setProductProfile(product);
            recommendation.setServiceModule(module);
            recommendation.setModuleCode(firstNonBlank(module.getStableCode(), module.getSlug()));
            recommendation.setPriority(recommendationPriority(findings));
            recommendation.setSequenceNumber(sequence++);
            recommendation.setReason("Scanner readiness mapping found " + findings.size() + " active finding(s) that need " + module.getName()
                    + ". Top signal: " + findings.get(0).getTitle() + ".");
            recommendation.setEvidenceBasisJson(scannerEvidenceBasisJson(findings));
            recommendation.setExpectedOutcome(firstNonBlank(module.getOwnerOutcome(), "Evidence-backed remediation is ready for owner review."));
            recommendation.setConfidence(findings.stream().anyMatch(finding -> finding.getSeverity() == NormalizedFinding.FindingSeverity.CRITICAL
                    || finding.getSeverity() == NormalizedFinding.FindingSeverity.HIGH) ? 0.88 : 0.78);
            recommendation.setCreatedByAi(false);
            serviceRecommendationRepository.save(recommendation);
            created++;
        }
        return created;
    }

    private static String ownerDecisionFor(NormalizedFinding finding, ServiceModule mappedModule) {
        if (mappedModule == null) {
            return "Decide whether this scanner signal blocks launch, should be accepted as risk, or needs a new catalog service mapping.";
        }
        if (finding.getSeverity() == NormalizedFinding.FindingSeverity.CRITICAL || finding.getSeverity() == NormalizedFinding.FindingSeverity.HIGH) {
            return "Choose whether " + mappedModule.getName() + " must be added before workspace kickoff or whether the risk is formally accepted.";
        }
        return "Decide whether to include " + mappedModule.getName() + " now or track it as a later readiness improvement.";
    }

    private static String recommendationPriority(List<NormalizedFinding> findings) {
        boolean severe = findings.stream().anyMatch(finding -> finding.getSeverity() == NormalizedFinding.FindingSeverity.CRITICAL
                || finding.getSeverity() == NormalizedFinding.FindingSeverity.HIGH);
        boolean medium = findings.stream().anyMatch(finding -> finding.getSeverity() == NormalizedFinding.FindingSeverity.MEDIUM);
        if (severe) return "MUST";
        if (medium) return "SHOULD";
        return "COULD";
    }

    private static String scannerEvidenceBasisJson(List<NormalizedFinding> findings) {
        return "[" + findings.stream()
                .limit(8)
                .map(finding -> "{\"findingId\":\"" + finding.getId() + "\",\"severity\":\"" + finding.getSeverity()
                        + "\",\"title\":\"" + jsonEscape(finding.getTitle()) + "\"}")
                .reduce((left, right) -> left + "," + right)
                .orElse("") + "]";
    }

    private static boolean activeScannerFinding(NormalizedFinding finding) {
        return finding.getStatus() == NormalizedFinding.FindingStatus.NEW
                || finding.getStatus() == NormalizedFinding.FindingStatus.OPEN
                || finding.getStatus() == NormalizedFinding.FindingStatus.REGRESSED
                || finding.getStatus() == NormalizedFinding.FindingStatus.INSUFFICIENT_EVIDENCE;
    }

    private static int scannerReadinessScore(List<NormalizedFinding> findings) {
        int score = 100;
        Set<String> categories = new HashSet<>();
        for (NormalizedFinding finding : findings) {
            score -= switch (finding.getSeverity()) {
                case CRITICAL -> 18;
                case HIGH -> 11;
                case MEDIUM -> 6;
                case LOW -> 3;
                case INFO -> 1;
            };
            if (finding.getFindingCategory() != null) {
                categories.add(finding.getFindingCategory());
            }
        }
        score -= Math.max(0, categories.size() - 3) * 2;
        return clamp(score, 0, 100);
    }

    private static int severityRank(NormalizedFinding.FindingSeverity severity) {
        return switch (severity) {
            case CRITICAL -> 5;
            case HIGH -> 4;
            case MEDIUM -> 3;
            case LOW -> 2;
            case INFO -> 1;
        };
    }

    private List<ProductFinding> seedFindings(ProductDiagnosis diagnosis, String combinedSignal) {
        Map<String, FindingSeed> seeds = new LinkedHashMap<>();
        addSeed(seeds, "baseline", "validation.product_readiness", "Production readiness baseline", "Confirm the product has an evidence-backed readiness view before teams scope delivery.", ProductFinding.FindingSeverity.MEDIUM, "Product context requires a baseline diagnosis.");
        String text = normalize(combinedSignal);
        if (contains(text, "secret", "credential", "env var")) {
            addSeed(seeds, "secrets", "security.secrets_scan", "Secrets exposure risk", "Sensitive credentials or environment configuration need review before production use.", ProductFinding.FindingSeverity.CRITICAL, "Owner context mentioned secrets, credentials, or environment risk.");
        }
        if (contains(text, "auth", "login", "session", "rbac", "role")) {
            addSeed(seeds, "auth", "security.auth_review", "Authentication and access-control risk", "Authentication, sessions, and role boundaries need review before real users depend on the product.", ProductFinding.FindingSeverity.HIGH, "Owner context mentioned auth or role-sensitive workflows.");
        }
        if (contains(text, "api", "webhook", "integration")) {
            addSeed(seeds, "api", "security.api_review", "API and integration hardening", "API, webhook, and integration paths need hardening evidence.", ProductFinding.FindingSeverity.HIGH, "Owner context mentioned APIs, webhooks, or integrations.");
        }
        if (contains(text, "deploy", "production", "staging", "hosting", "ci", "cd")) {
            addSeed(seeds, "deploy", "cloud.deployment_setup", "Deployment readiness gap", "Deployment flow needs staging, repeatable release checks, and owner-visible evidence.", ProductFinding.FindingSeverity.HIGH, "Owner context mentioned deployment or production readiness.");
            addSeed(seeds, "cicd", "cloud.cicd_setup", "Release pipeline gap", "Build, test, and deployment checks should gate production releases.", ProductFinding.FindingSeverity.MEDIUM, "Deployment context implies repeatable CI/CD is needed.");
        }
        if (contains(text, "monitor", "alert", "log", "observability")) {
            addSeed(seeds, "monitoring", "cloud.monitoring_setup", "Monitoring and alerting gap", "Production paths need monitoring, alert ownership, and incident visibility.", ProductFinding.FindingSeverity.HIGH, "Owner context mentioned monitoring, alerts, logs, or observability.");
        }
        if (contains(text, "database", "data", "schema", "migration", "query")) {
            addSeed(seeds, "database", "db.review", "Database readiness risk", "Schema, migration, data integrity, and query behavior need review before productization.", ProductFinding.FindingSeverity.MEDIUM, "Owner context mentioned data or database concerns.");
        }
        if (contains(text, "payment", "billing", "subscription", "checkout")) {
            addSeed(seeds, "payments", "launch.payment_setup", "Payment launch readiness", "Payment, billing, and subscription flows need implementation and verification evidence.", ProductFinding.FindingSeverity.HIGH, "Owner context mentioned payment or revenue workflows.");
            addSeed(seeds, "payment-security", "security.payment_review", "Payment security risk", "Payment event handling and entitlements need security review.", ProductFinding.FindingSeverity.HIGH, "Payment context requires security verification.");
        }
        if (contains(text, "slow", "performance", "scale", "latency")) {
            addSeed(seeds, "performance", "scale.performance_audit", "Performance and scale risk", "Performance bottlenecks should be measured before scaling work is scoped.", ProductFinding.FindingSeverity.MEDIUM, "Owner context mentioned performance or scaling.");
        }
        if (contains(text, "support", "handoff", "runbook", "documentation", "docs")) {
            addSeed(seeds, "handoff", "support.handoff", "Handoff and support gap", "Operational ownership, runbooks, and support scope need to be clear before delivery closes.", ProductFinding.FindingSeverity.MEDIUM, "Owner context mentioned support, docs, or handoff.");
        }
        if (contains(text, "no-code", "nocode", "airtable", "zapier")) {
            addSeed(seeds, "no-code", "code.no_code_migration", "No-code migration path", "No-code workflows need extraction, migration planning, and custom-product ownership.", ProductFinding.FindingSeverity.HIGH, "Owner context mentioned no-code tooling.");
        }
        if (contains(text, "ai-generated", "generated code", "ai built", "vibe code")) {
            addSeed(seeds, "ai-code", "code.ai_cleanup", "AI-built code ownership risk", "Generated code needs cleanup, ownership boundaries, and maintainability evidence.", ProductFinding.FindingSeverity.HIGH, "Owner context mentioned generated code.");
        }

        List<ProductFinding> findings = new ArrayList<>();
        for (FindingSeed seed : seeds.values()) {
            ProductFinding finding = new ProductFinding();
            finding.setDiagnosis(diagnosis);
            finding.setRecommendedModule(findModule(seed.serviceCode()));
            finding.setTitle(seed.title());
            finding.setDescription(seed.description());
            finding.setAffectedLayer(finding.getRecommendedModule() == null ? null : finding.getRecommendedModule().getServiceLayer());
            finding.setSeverity(seed.severity());
            finding.setConfidenceLevel(ProductFinding.ConfidenceLevel.HIGH);
            finding.setConfidenceBasis(seed.basis());
            finding.setSourceSignal(seed.basis());
            findings.add(findingRepository.save(finding));
        }
        return findings;
    }

    private void createEvidenceRequirements(Milestone milestone, AcceptanceCriterion criterion, PackageModule module) {
        List<String> types = splitCsv(module == null || module.getServiceModule() == null ? null : module.getServiceModule().getRequiredEvidenceTypes());
        if (types.isEmpty()) {
            types = List.of("Owner review note", "Implementation evidence");
        }
        for (String type : types) {
            EvidenceRequirement requirement = new EvidenceRequirement();
            requirement.setMilestone(milestone);
            requirement.setCriterion(criterion);
            requirement.setEvidenceType(type);
            requirement.setDescription("Required proof for " + criterion.getTitle() + ": " + type);
            requirement.setRequired(true);
            evidenceRequirementRepository.save(requirement);
        }
    }

    private void ensureEvidenceStateComplete(AcceptanceCriterion criterion) {
        List<EvidenceRequirement> requirements = evidenceRequirementRepository.findByCriterionIdOrderByCreatedAtAsc(criterion.getId());
        boolean missingRequired = requirements.stream()
                .anyMatch(requirement -> requirement.isRequired() && requirement.getStatus() == EvidenceRequirement.EvidenceStatus.MISSING);
        if (missingRequired) {
            throw new IllegalArgumentException("Required evidence must be attached, verified, or waived before approval");
        }
    }

    private void updateMilestoneAcceptanceState(Milestone milestone) {
        List<AcceptanceCriterion> criteria = criterionRepository.findByMilestoneIdOrderByCreatedAtAsc(milestone.getId());
        if (!criteria.isEmpty() && criteria.stream().filter(AcceptanceCriterion::isRequired)
                .allMatch(criterion -> criterion.getStatus() == AcceptanceCriterion.CriterionStatus.PASSED
                        || criterion.getStatus() == AcceptanceCriterion.CriterionStatus.WAIVED)) {
            milestone.setStatus(Milestone.MilestoneStatus.ACCEPTED);
            milestoneRepository.save(milestone);
        }
    }

    private PackageModule matchPackageModule(Milestone milestone) {
        ProjectWorkspace workspace = milestone.getWorkspace();
        if (workspace.getPackageInstance() == null) {
            return null;
        }
        List<PackageModule> modules = packageModuleRepository.findByPackageInstanceIdOrderBySequenceOrderAsc(workspace.getPackageInstance().getId());
        String milestoneText = normalize(milestone.getTitle() + " " + firstNonBlank(milestone.getDescription(), ""));
        return modules.stream()
                .filter(module -> milestoneText.contains(normalize(module.getServiceModule().getName()))
                        || milestoneText.contains(normalize(module.getServiceModule().getSlug())))
                .findFirst()
                .orElse(modules.isEmpty() ? null : modules.get(0));
    }

    private void requireProductOwner(User user, ProductProfile product) {
        if (user.getRole() == User.UserRole.ADMIN || product.getOwner().getId().equals(user.getId())) {
            return;
        }
        throw new AccessDeniedException("Product belongs to another owner");
    }

    private void requireWorkspaceViewer(User user, ProjectWorkspace workspace) {
        if (user.getRole() == User.UserRole.ADMIN || workspace.getOwner().getId().equals(user.getId())) {
            return;
        }
        if (participantRepository.existsByWorkspaceIdAndUserIdAndActiveTrue(workspace.getId(), user.getId())) {
            return;
        }
        throw new AccessDeniedException("Workspace is not available to this user");
    }

    private void requireWorkspaceCoordinator(User user, ProjectWorkspace workspace) {
        if (user.getRole() == User.UserRole.ADMIN || workspace.getOwner().getId().equals(user.getId())) {
            return;
        }
        WorkspaceParticipant participant = participantRepository.findByWorkspaceIdAndUserIdAndActiveTrue(workspace.getId(), user.getId())
                .orElseThrow(() -> new AccessDeniedException("Workspace cannot be changed by this user"));
        if (participant.getRole() == WorkspaceParticipant.ParticipantRole.OWNER
                || participant.getRole() == WorkspaceParticipant.ParticipantRole.COORDINATOR
                || participant.getRole() == WorkspaceParticipant.ParticipantRole.TEAM_LEAD) {
            return;
        }
        throw new AccessDeniedException("Workspace cannot be changed by this user");
    }

    private DiagnosisResponse toDiagnosisResponse(ProductDiagnosis diagnosis, List<ProductFinding> findings) {
        ProductProfile product = diagnosis.getProductProfile();
        return new DiagnosisResponse(
                diagnosis.getId(),
                diagnosis.getCreatedAt(),
                product.getId(),
                product.getName(),
                diagnosis.getReadinessScore(),
                diagnosis.getSummary(),
                diagnosis.getAccessSignals(),
                diagnosis.getWorkspace() == null ? null : diagnosis.getWorkspace().getId(),
                diagnosis.getDiagnosisSource(),
                diagnosis.getGeneratedFromScanRunIds(),
                diagnosis.getTopBlockerCount(),
                diagnosis.getEvidenceCount(),
                diagnosis.getUnmappedFindingCount(),
                diagnosis.getStatus(),
                diagnosis.isAiReady(),
                diagnosis.isAiExecuted(),
                findings.stream().map(this::toFindingResponse).toList()
        );
    }

    private FindingResponse toFindingResponse(ProductFinding finding) {
        ServiceModule module = finding.getRecommendedModule();
        return new FindingResponse(
                finding.getId(),
                finding.getTitle(),
                finding.getDescription(),
                finding.getAffectedLayer(),
                finding.getReadinessArea(),
                finding.getBusinessRisk(),
                finding.getOwnerDecision(),
                finding.getEvidenceRequired(),
                finding.getMappingReason(),
                finding.getMappingConfidence(),
                finding.getMappingSource(),
                finding.getSeverity(),
                finding.getConfidenceLevel(),
                finding.getConfidenceBasis(),
                finding.getSourceSignal(),
                finding.getStatus(),
                finding.getNormalizedFinding() == null ? null : finding.getNormalizedFinding().getId(),
                finding.getScannerEvidenceItem() == null ? null : finding.getScannerEvidenceItem().getId(),
                module == null ? null : module.getId(),
                module == null ? null : module.getName(),
                module == null ? null : module.getStableCode()
        );
    }

    private CriterionResponse toCriterionResponse(AcceptanceCriterion criterion) {
        return new CriterionResponse(
                criterion.getId(),
                criterion.getMilestone().getId(),
                criterion.getPackageModule() == null ? null : criterion.getPackageModule().getId(),
                criterion.getServiceModule() == null ? null : criterion.getServiceModule().getName(),
                criterion.getTitle(),
                criterion.getDescription(),
                criterion.isRequired(),
                criterion.getStatus(),
                criterion.isHumanReviewRequired(),
                evidenceRequirementRepository.findByCriterionIdOrderByCreatedAtAsc(criterion.getId()).stream().map(this::toEvidenceRequirementResponse).toList(),
                automatedCheckRepository.findByCriterionIdOrderByCreatedAtDesc(criterion.getId()).stream().map(this::toAutomatedCheckResponse).toList(),
                reviewDecisionRepository.findByCriterionIdOrderByCreatedAtDesc(criterion.getId()).stream().map(this::toReviewDecisionResponse).toList()
        );
    }

    private EvidenceRequirementResponse toEvidenceRequirementResponse(EvidenceRequirement requirement) {
        return new EvidenceRequirementResponse(
                requirement.getId(),
                requirement.getCriterion().getId(),
                requirement.getEvidenceType(),
                requirement.getDescription(),
                requirement.isRequired(),
                requirement.getStatus(),
                requirement.getEvidenceReference()
        );
    }

    private AutomatedCheckResponse toAutomatedCheckResponse(AutomatedCheck check) {
        return new AutomatedCheckResponse(
                check.getId(),
                check.getWorkspace().getId(),
                check.getMilestone() == null ? null : check.getMilestone().getId(),
                check.getCriterion() == null ? null : check.getCriterion().getId(),
                check.getCheckType(),
                check.getProvider(),
                check.getExternalRef(),
                check.getStatus(),
                check.getSummary(),
                check.getRawPayload(),
                check.getObservedAt()
        );
    }

    private ReviewDecisionResponse toReviewDecisionResponse(ReviewDecision decision) {
        return new ReviewDecisionResponse(
                decision.getId(),
                decision.getMilestone().getId(),
                decision.getCriterion() == null ? null : decision.getCriterion().getId(),
                decision.getReviewer().getEmail(),
                decision.getDecision(),
                decision.getNote(),
                decision.getCreatedAt()
        );
    }

    private HandoffResponse toHandoffResponse(HandoffDocument handoff) {
        return new HandoffResponse(
                handoff.getId(),
                handoff.getWorkspace().getId(),
                handoff.getTitle(),
                handoff.getRunbook(),
                handoff.getAccessChecklist(),
                handoff.getKnownIssues(),
                handoff.getSupportScope(),
                handoff.getStatus()
        );
    }

    private HealthReviewResponse toHealthReviewResponse(ProductHealthReview review) {
        return new HealthReviewResponse(
                review.getId(),
                review.getWorkspace().getId(),
                review.getPeriodStart(),
                review.getPeriodEnd(),
                review.getHealthScore(),
                review.getSummary(),
                review.getRisks(),
                review.getActions(),
                review.getStatus()
        );
    }

    private IntegrationConnectionResponse toIntegrationConnectionResponse(IntegrationConnection connection) {
        return new IntegrationConnectionResponse(
                connection.getId(),
                connection.getWorkspace() == null ? null : connection.getWorkspace().getId(),
                connection.getProviderType(),
                connection.getName(),
                connection.getExternalRef(),
                connection.getScopedAccessNote(),
                connection.getStatus(),
                connection.getLastCheckedAt(),
                integrationSignalRepository.findByConnectionIdOrderByCreatedAtDesc(connection.getId()).stream()
                        .limit(5)
                        .map(this::toIntegrationSignalResponse)
                        .toList()
        );
    }

    private IntegrationSignalResponse toIntegrationSignalResponse(IntegrationSignal signal) {
        return new IntegrationSignalResponse(
                signal.getId(),
                signal.getConnection().getId(),
                signal.getWorkspace() == null ? null : signal.getWorkspace().getId(),
                signal.getMilestone() == null ? null : signal.getMilestone().getId(),
                signal.getCriterion() == null ? null : signal.getCriterion().getId(),
                signal.getSignalType(),
                signal.getStatus(),
                signal.getSummary(),
                signal.getEvidencePayload(),
                signal.getRecordedAt()
        );
    }

    private ServiceModule findModule(String stableCode) {
        if (stableCode == null || stableCode.isBlank()) {
            return null;
        }
        String fallbackSlug = stableCode.contains(".")
                ? stableCode.substring(stableCode.indexOf('.') + 1).replace('_', '-')
                : stableCode.replace('_', '-');
        return moduleRepository.findByStableCode(stableCode)
                .orElseGet(() -> moduleRepository.findBySlug(fallbackSlug).orElse(null));
    }

    private void addSeed(Map<String, FindingSeed> seeds, String key, String serviceCode, String title, String description, ProductFinding.FindingSeverity severity, String basis) {
        seeds.putIfAbsent(key, new FindingSeed(serviceCode, title, description, severity, basis));
    }

    private int readinessScore(ProductProfile product, String text) {
        int score = switch (product.getBusinessStage()) {
            case IDEA -> 42;
            case PROTOTYPE -> 58;
            case VALIDATED -> 68;
            case LIVE -> 74;
            case SCALING -> 78;
        };
        String normalized = normalize(text);
        if (contains(normalized, "secret", "credential", "critical", "blocked")) score -= 16;
        if (contains(normalized, "no monitoring", "manual deploy", "no backup", "no tests")) score -= 12;
        if (contains(normalized, "production", "launch", "customer", "payment")) score += 6;
        return clamp(score, 0, 100);
    }

    private AutomatedCheck.CheckStatus toCheckStatus(IntegrationSignal.SignalStatus status) {
        return switch (status) {
            case PASSED -> AutomatedCheck.CheckStatus.PASSED;
            case WARNING -> AutomatedCheck.CheckStatus.WARNING;
            case FAILED -> AutomatedCheck.CheckStatus.FAILED;
            case INFO -> AutomatedCheck.CheckStatus.PENDING;
        };
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private static String joined(String... values) {
        List<String> parts = new ArrayList<>();
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                parts.add(value.trim());
            }
        }
        return String.join(" ", parts);
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }

    private static String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.toLowerCase(Locale.ROOT).replace('-', ' ').replace('_', ' ');
    }

    private static boolean contains(String value, String... needles) {
        String normalized = normalize(value);
        for (String needle : needles) {
            if (normalized.contains(normalize(needle))) {
                return true;
            }
        }
        return false;
    }

    private static String jsonEscape(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    private static List<String> splitStatements(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return List.of(value.split("[.;\\n]")).stream()
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .limit(6)
                .toList();
    }

    private static List<String> splitCsv(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return List.of(value.split(",")).stream()
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .limit(8)
                .toList();
    }

    private record FindingSeed(String serviceCode, String title, String description, ProductFinding.FindingSeverity severity, String basis) {}

    public record DiagnosisRequest(UUID requirementIntakeId, String businessGoal, String currentProblems, String accessSignals, String summary) {}
    public record ScannerReadinessDiagnosisRequest(UUID workspaceId, Boolean createServiceRecommendations, Boolean includeAcceptedRisk, String summary) {}
    public record DiagnosisResponse(UUID id, LocalDateTime createdAt, UUID productId, String productName, Integer readinessScore, String summary, String accessSignals, UUID workspaceId, ProductDiagnosis.DiagnosisSource diagnosisSource, String generatedFromScanRunIds, int topBlockerCount, int evidenceCount, int unmappedFindingCount, ProductDiagnosis.DiagnosisStatus status, boolean aiReady, boolean aiExecuted, List<FindingResponse> findings) {}
    public record FindingResponse(UUID id, String title, String description, String affectedLayer, String readinessArea, String businessRisk, String ownerDecision, String evidenceRequired, String mappingReason, Double mappingConfidence, String mappingSource, ProductFinding.FindingSeverity severity, ProductFinding.ConfidenceLevel confidenceLevel, String confidenceBasis, String sourceSignal, ProductFinding.FindingStatus status, UUID normalizedFindingId, UUID scannerEvidenceItemId, UUID recommendedModuleId, String recommendedModuleName, String recommendedModuleCode) {}
    public record CriterionResponse(UUID id, UUID milestoneId, UUID packageModuleId, String serviceName, String title, String description, boolean required, AcceptanceCriterion.CriterionStatus status, boolean humanReviewRequired, List<EvidenceRequirementResponse> evidenceRequirements, List<AutomatedCheckResponse> automatedChecks, List<ReviewDecisionResponse> reviews) {}
    public record EvidenceRequirementRequest(EvidenceRequirement.EvidenceStatus status, String evidenceReference) {}
    public record EvidenceRequirementResponse(UUID id, UUID criterionId, String evidenceType, String description, boolean required, EvidenceRequirement.EvidenceStatus status, String evidenceReference) {}
    public record AutomatedCheckRequest(String checkType, String provider, String externalRef, AutomatedCheck.CheckStatus status, String summary, String rawPayload, LocalDateTime observedAt) {}
    public record AutomatedCheckResponse(UUID id, UUID workspaceId, UUID milestoneId, UUID criterionId, String checkType, String provider, String externalRef, AutomatedCheck.CheckStatus status, String summary, String rawPayload, LocalDateTime observedAt) {}
    public record ReviewDecisionRequest(ReviewDecision.Decision decision, String note) {}
    public record ReviewDecisionResponse(UUID id, UUID milestoneId, UUID criterionId, String reviewerEmail, ReviewDecision.Decision decision, String note, LocalDateTime createdAt) {}
    public record WorkspaceGovernanceResponse(UUID workspaceId, String workspaceName, List<CriterionResponse> criteria, List<AutomatedCheckResponse> automatedChecks, List<HandoffResponse> handoffs, List<HealthReviewResponse> healthReviews, List<IntegrationConnectionResponse> integrations) {}
    public record HandoffRequest(String title, String runbook, String accessChecklist, String knownIssues, String supportScope, HandoffDocument.HandoffStatus status) {}
    public record HandoffResponse(UUID id, UUID workspaceId, String title, String runbook, String accessChecklist, String knownIssues, String supportScope, HandoffDocument.HandoffStatus status) {}
    public record HealthReviewRequest(UUID supportSubscriptionId, LocalDate periodStart, LocalDate periodEnd, Integer healthScore, String summary, String risks, String actions, ProductHealthReview.ReviewStatus status) {}
    public record HealthReviewResponse(UUID id, UUID workspaceId, LocalDate periodStart, LocalDate periodEnd, Integer healthScore, String summary, String risks, String actions, ProductHealthReview.ReviewStatus status) {}
    public record IntegrationConnectionRequest(IntegrationConnection.ProviderType providerType, String name, String externalRef, String scopedAccessNote, IntegrationConnection.ConnectionStatus status) {}
    public record IntegrationConnectionResponse(UUID id, UUID workspaceId, IntegrationConnection.ProviderType providerType, String name, String externalRef, String scopedAccessNote, IntegrationConnection.ConnectionStatus status, LocalDateTime lastCheckedAt, List<IntegrationSignalResponse> signals) {}
    public record IntegrationSignalRequest(UUID milestoneId, UUID criterionId, String signalType, IntegrationSignal.SignalStatus status, String summary, String evidencePayload, LocalDateTime recordedAt) {}
    public record IntegrationSignalResponse(UUID id, UUID connectionId, UUID workspaceId, UUID milestoneId, UUID criterionId, String signalType, IntegrationSignal.SignalStatus status, String summary, String evidencePayload, LocalDateTime recordedAt) {}
}
