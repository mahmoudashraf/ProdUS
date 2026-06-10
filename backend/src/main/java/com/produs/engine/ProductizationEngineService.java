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
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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

    private static final String SCANNER_CRITERION_MARKER = "Scanner finding ID: ";
    private static final String SCANNER_EVIDENCE_MARKER = "Scanner evidence ID: ";
    private static final String SCANNER_READINESS_CHECK_TYPE = "scanner-readiness-map";

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
    private final LaunchReadinessReportRepository launchReadinessReportRepository;
    private final ScannerFindingClassifier scannerFindingClassifier;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

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
                "Deterministic product diagnosis for " + product.getName() + ". Findings are based on owner-provided product context, access signals, and catalog rules. No AI execution was performed."
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

    @Transactional(readOnly = true)
    public ShipConfidenceHistoryResponse productShipConfidence(User user, UUID productId) {
        ProductProfile product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        requireProductOwner(user, product);
        List<ProductDiagnosis> diagnoses = diagnosisRepository.findByProductProfileIdOrderByCreatedAtDesc(productId);
        return buildShipConfidenceHistory(product, null, diagnoses);
    }

    @Transactional(readOnly = true)
    public LaunchReadinessReportResponse latestProductLaunchReadinessReport(User user, UUID productId) {
        ProductProfile product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        requireProductOwner(user, product);
        LaunchReadinessReport report = launchReadinessReportRepository.findFirstByProductProfileIdOrderByCreatedAtDesc(productId)
                .orElseThrow(() -> new IllegalArgumentException("No launch readiness report has been generated yet"));
        return toLaunchReadinessReportResponse(report);
    }

    @Transactional
    public LaunchReadinessReportResponse generateProductLaunchReadinessReport(User user, UUID productId, LaunchReadinessReportRequest request) {
        ProductProfile product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        requireProductOwner(user, product);
        ProjectWorkspace workspace = null;
        if (request != null && request.workspaceId() != null) {
            workspace = workspaceRepository.findById(request.workspaceId())
                    .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
            if (!workspace.getPackageInstance().getProductProfile().getId().equals(productId)) {
                throw new IllegalArgumentException("Workspace belongs to another product");
            }
            requireWorkspaceViewer(user, workspace);
        }
        LaunchReadinessReport saved = buildAndSaveLaunchReadinessReport(user, product, workspace, request == null ? null : request.focus());
        auditService.logAction(user.getId(), "GENERATE_LAUNCH_READINESS_REPORT", "LAUNCH_READINESS_REPORT", saved.getId(), AuditEvent.RiskLevel.MEDIUM,
                "Generated launch readiness report for product " + product.getId());
        return toLaunchReadinessReportResponse(saved);
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
        ProductDiagnosis existing = scanRun.getWorkspace() == null
                ? diagnosisRepository.findByProductProfileIdAndDiagnosisSourceAndGeneratedFromScanRunIds(
                        scanRun.getProductProfile().getId(),
                        ProductDiagnosis.DiagnosisSource.SCANNER_READINESS,
                        generatedFromScanRunIds
                ).orElse(null)
                : diagnosisRepository.findByProductProfileIdAndWorkspaceIdAndDiagnosisSourceAndGeneratedFromScanRunIds(
                        scanRun.getProductProfile().getId(),
                        scanRun.getWorkspace().getId(),
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
        if (scanRun.getWorkspace() != null) {
            ProductDiagnosis diagnosis = diagnosisRepository.findById(response.id())
                    .orElseThrow(() -> new IllegalStateException("Scanner diagnosis was not stored"));
            List<ProductFinding> productFindings = findingRepository.findByDiagnosisIdOrderByCreatedAtAsc(diagnosis.getId());
            enrichWorkspaceFromScannerDiagnosis(actor, scanRun.getWorkspace(), productFindings, true);
        }
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

    @Transactional(readOnly = true)
    public WorkspaceScannerReadinessResponse workspaceScannerReadiness(User user, UUID workspaceId) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceViewer(user, workspace);
        return buildWorkspaceScannerReadiness(workspace);
    }

    @Transactional(readOnly = true)
    public ShipConfidenceHistoryResponse workspaceShipConfidence(User user, UUID workspaceId) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceViewer(user, workspace);
        ProductProfile product = workspaceProduct(workspace);
        List<ProductDiagnosis> diagnoses = diagnosisRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        return buildShipConfidenceHistory(product, workspace, diagnoses);
    }

    @Transactional(readOnly = true)
    public LaunchReadinessReportResponse latestWorkspaceLaunchReadinessReport(User user, UUID workspaceId) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceViewer(user, workspace);
        LaunchReadinessReport report = launchReadinessReportRepository.findFirstByWorkspaceIdOrderByCreatedAtDesc(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("No launch readiness report has been generated yet"));
        return toLaunchReadinessReportResponse(report);
    }

    @Transactional
    public LaunchReadinessReportResponse generateWorkspaceLaunchReadinessReport(User user, UUID workspaceId, LaunchReadinessReportRequest request) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceViewer(user, workspace);
        ProductProfile product = workspaceProduct(workspace);
        if (product == null) {
            throw new IllegalArgumentException("Workspace is not attached to a product");
        }
        LaunchReadinessReport saved = buildAndSaveLaunchReadinessReport(user, product, workspace, request == null ? null : request.focus());
        auditService.logAction(user.getId(), "GENERATE_WORKSPACE_LAUNCH_READINESS_REPORT", "LAUNCH_READINESS_REPORT", saved.getId(), AuditEvent.RiskLevel.MEDIUM,
                "Generated launch readiness report for workspace " + workspace.getId());
        return toLaunchReadinessReportResponse(saved);
    }

    @Transactional
    public WorkspaceScannerReadinessResponse enrichWorkspaceScannerReadiness(User user, UUID workspaceId, WorkspaceScannerReadinessRequest request) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceCoordinator(user, workspace);
        if (workspace.getPackageInstance() == null || workspace.getPackageInstance().getProductProfile() == null) {
            throw new IllegalArgumentException("Workspace is not attached to a product service plan");
        }

        ProductProfile product = workspace.getPackageInstance().getProductProfile();
        boolean includeAcceptedRisk = Boolean.TRUE.equals(request.includeAcceptedRisk());
        boolean createServiceRecommendations = !Boolean.FALSE.equals(request.createServiceRecommendations());
        List<NormalizedFinding> scannerFindings = normalizedFindingRepository
                .findByProductProfileIdAndWorkspaceIdOrderBySeverityDescCreatedAtDesc(product.getId(), workspace.getId());
        DiagnosisResponse diagnosis = createOrReuseWorkspaceScannerDiagnosis(
                user,
                product,
                workspace,
                scannerFindings,
                includeAcceptedRisk,
                createServiceRecommendations,
                request.summary()
        );
        ProductDiagnosis diagnosisEntity = diagnosisRepository.findById(diagnosis.id())
                .orElseThrow(() -> new IllegalStateException("Workspace scanner diagnosis was not stored"));
        List<ProductFinding> productFindings = findingRepository.findByDiagnosisIdOrderByCreatedAtAsc(diagnosisEntity.getId());
        int createdArtifacts = enrichWorkspaceFromScannerDiagnosis(
                user,
                workspace,
                productFindings,
                !Boolean.FALSE.equals(request.createCriteria())
        );
        auditService.logAction(user.getId(), "ENRICH_WORKSPACE_SCANNER_READINESS", "PROJECT_WORKSPACE", workspace.getId(), AuditEvent.RiskLevel.HIGH,
                "Scanner readiness enrichment created " + createdArtifacts + " workspace artifact(s)");
        return buildWorkspaceScannerReadiness(workspace);
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

    private DiagnosisResponse createOrReuseWorkspaceScannerDiagnosis(
            User actor,
            ProductProfile product,
            ProjectWorkspace workspace,
            List<NormalizedFinding> findings,
            boolean includeAcceptedRisk,
            boolean createServiceRecommendations,
            String summary
    ) {
        List<NormalizedFinding> activeFindings = findings.stream()
                .filter(finding -> includeAcceptedRisk || activeScannerFinding(finding))
                .toList();
        String generatedFromScanRunIds = activeFindings.stream()
                .map(NormalizedFinding::getScanRun)
                .filter(scanRun -> scanRun != null && scanRun.getId() != null)
                .map(scanRun -> scanRun.getId().toString())
                .distinct()
                .reduce((left, right) -> left + "," + right)
                .orElse("");
        ProductDiagnosis existing = generatedFromScanRunIds.isBlank()
                ? null
                : diagnosisRepository.findByProductProfileIdAndWorkspaceIdAndDiagnosisSourceAndGeneratedFromScanRunIds(
                        product.getId(),
                        workspace.getId(),
                        ProductDiagnosis.DiagnosisSource.SCANNER_READINESS,
                        generatedFromScanRunIds
                ).orElse(null);
        if (existing != null) {
            return toDiagnosisResponse(existing, findingRepository.findByDiagnosisIdOrderByCreatedAtAsc(existing.getId()));
        }
        return createScannerReadinessDiagnosisFromFindings(
                actor,
                product,
                workspace,
                findings,
                includeAcceptedRisk,
                createServiceRecommendations,
                firstNonBlank(summary, "Workspace scanner findings were mapped into milestone readiness work."),
                null,
                true
        );
    }

    private int enrichWorkspaceFromScannerDiagnosis(User actor, ProjectWorkspace workspace, List<ProductFinding> productFindings, boolean createCriteria) {
        if (!createCriteria || productFindings.isEmpty()) {
            return 0;
        }
        int created = 0;
        List<Milestone> milestones = milestoneRepository.findByWorkspaceIdOrderByCreatedAtAsc(workspace.getId());
        for (ProductFinding finding : productFindings) {
            if (finding.getNormalizedFinding() == null || scannerCriterionExists(workspace, finding.getNormalizedFinding().getId())) {
                continue;
            }
            Milestone milestone = resolveScannerMilestone(workspace, milestones, finding, true);
            PackageModule packageModule = matchPackageModuleForService(workspace, finding.getRecommendedModule());

            AcceptanceCriterion criterion = new AcceptanceCriterion();
            criterion.setMilestone(milestone);
            criterion.setPackageModule(packageModule);
            criterion.setServiceModule(finding.getRecommendedModule());
            criterion.setTitle("Scanner blocker: " + firstNonBlank(finding.getReadinessArea(), finding.getTitle()));
            criterion.setDescription(scannerCriterionDescription(finding));
            criterion.setRequired(true);
            criterion.setHumanReviewRequired(true);
            criterion.setStatus(severe(finding.getSeverity())
                    ? AcceptanceCriterion.CriterionStatus.FAILED
                    : AcceptanceCriterion.CriterionStatus.PENDING);
            criterion = criterionRepository.save(criterion);
            created++;

            created += createScannerEvidenceRequirements(milestone, criterion, finding);
            created += createScannerAutomatedCheck(workspace, milestone, criterion, finding);
            if (severe(finding.getSeverity())) {
                milestone.setStatus(Milestone.MilestoneStatus.BLOCKED);
                milestoneRepository.save(milestone);
            }
        }
        if (created > 0) {
            auditService.logAction(actor.getId(), "CREATE_SCANNER_WORKSPACE_EVIDENCE_TASKS", "PROJECT_WORKSPACE", workspace.getId(), AuditEvent.RiskLevel.HIGH,
                    "Created scanner-backed milestone evidence tasks");
        }
        return created;
    }

    private boolean scannerCriterionExists(ProjectWorkspace workspace, UUID normalizedFindingId) {
        if (normalizedFindingId == null) {
            return false;
        }
        String marker = SCANNER_CRITERION_MARKER + normalizedFindingId;
        return milestoneRepository.findByWorkspaceIdOrderByCreatedAtAsc(workspace.getId()).stream()
                .flatMap(milestone -> criterionRepository.findByMilestoneIdOrderByCreatedAtAsc(milestone.getId()).stream())
                .anyMatch(criterion -> criterion.getDescription() != null && criterion.getDescription().contains(marker));
    }

    private Milestone resolveScannerMilestone(ProjectWorkspace workspace, List<Milestone> milestones, ProductFinding finding, boolean createIfMissing) {
        if (milestones.isEmpty()) {
            if (!createIfMissing) {
                return null;
            }
            Milestone milestone = new Milestone();
            milestone.setWorkspace(workspace);
            milestone.setTitle("Scanner readiness review");
            milestone.setDescription("Scanner-backed remediation, evidence capture, and owner readiness decisions.");
            milestone.setStatus(Milestone.MilestoneStatus.IN_PROGRESS);
            Milestone saved = milestoneRepository.save(milestone);
            milestones.add(saved);
            return saved;
        }

        String moduleSignal = normalize(
                (finding.getRecommendedModule() == null ? "" : finding.getRecommendedModule().getName())
                        + " "
                        + (finding.getRecommendedModule() == null ? "" : finding.getRecommendedModule().getStableCode())
                        + " "
                        + (finding.getRecommendedModule() == null ? "" : finding.getRecommendedModule().getSlug())
        );
        for (Milestone milestone : milestones) {
            String text = normalize(milestone.getTitle() + " " + firstNonBlank(milestone.getDescription(), ""));
            if (!moduleSignal.isBlank() && (moduleSignal.contains(text) || text.contains(moduleSignal)
                    || containsOverlap(text, moduleSignal))) {
                return milestone;
            }
        }

        String area = normalize(firstNonBlank(finding.getReadinessArea(), finding.getTitle()));
        for (Milestone milestone : milestones) {
            String text = normalize(milestone.getTitle() + " " + firstNonBlank(milestone.getDescription(), ""));
            if ((area.contains("security") || area.contains("secret") || area.contains("auth")) && contains(text, "security", "secure", "risk")) {
                return milestone;
            }
            if ((area.contains("deployment") || area.contains("monitoring") || area.contains("launch")) && contains(text, "launch", "deploy", "stabilize", "readiness")) {
                return milestone;
            }
            if (area.contains("testing") && contains(text, "test", "quality", "validate")) {
                return milestone;
            }
        }
        return milestones.get(0);
    }

    private PackageModule matchPackageModuleForService(ProjectWorkspace workspace, ServiceModule serviceModule) {
        if (workspace.getPackageInstance() == null || serviceModule == null) {
            return null;
        }
        return packageModuleRepository.findByPackageInstanceIdOrderBySequenceOrderAsc(workspace.getPackageInstance().getId()).stream()
                .filter(module -> module.getServiceModule() != null && module.getServiceModule().getId().equals(serviceModule.getId()))
                .findFirst()
                .orElse(null);
    }

    private String scannerCriterionDescription(ProductFinding finding) {
        String normalizedFindingId = finding.getNormalizedFinding() == null ? "unknown" : finding.getNormalizedFinding().getId().toString();
        String scannerEvidenceId = finding.getScannerEvidenceItem() == null ? null : finding.getScannerEvidenceItem().getId().toString();
        return joined(
                finding.getDescription(),
                "Business risk: " + firstNonBlank(finding.getBusinessRisk(), "Scanner signal may block production readiness."),
                "Recommended service: " + (finding.getRecommendedModule() == null ? "Needs service mapping review" : finding.getRecommendedModule().getName()),
                "Owner decision: " + firstNonBlank(finding.getOwnerDecision(), "Decide whether to remediate, accept risk, or request a service mapping review."),
                "Evidence required: " + firstNonBlank(finding.getEvidenceRequired(), "Attach remediation proof and a clean scanner rerun."),
                SCANNER_CRITERION_MARKER + normalizedFindingId,
                scannerEvidenceId == null ? null : SCANNER_EVIDENCE_MARKER + scannerEvidenceId
        );
    }

    private int createScannerEvidenceRequirements(Milestone milestone, AcceptanceCriterion criterion, ProductFinding finding) {
        List<EvidenceRequirement> existing = evidenceRequirementRepository.findByCriterionIdOrderByCreatedAtAsc(criterion.getId());
        if (!existing.isEmpty()) {
            return 0;
        }
        int created = 0;
        EvidenceRequirement source = new EvidenceRequirement();
        source.setMilestone(milestone);
        source.setCriterion(criterion);
        source.setEvidenceType("Scanner source evidence");
        source.setDescription("Original normalized scanner evidence that produced this readiness blocker.");
        source.setRequired(true);
        source.setStatus(finding.getScannerEvidenceItem() == null ? EvidenceRequirement.EvidenceStatus.MISSING : EvidenceRequirement.EvidenceStatus.ATTACHED);
        source.setEvidenceReference(finding.getScannerEvidenceItem() == null ? null : "scanner-evidence:" + finding.getScannerEvidenceItem().getId());
        evidenceRequirementRepository.save(source);
        created++;

        EvidenceRequirement remediation = new EvidenceRequirement();
        remediation.setMilestone(milestone);
        remediation.setCriterion(criterion);
        remediation.setEvidenceType("Remediation proof");
        remediation.setDescription(firstNonBlank(finding.getEvidenceRequired(), "Attach implementation evidence showing the blocker has been remediated or accepted with owner review."));
        remediation.setRequired(true);
        evidenceRequirementRepository.save(remediation);
        created++;

        EvidenceRequirement rerun = new EvidenceRequirement();
        rerun.setMilestone(milestone);
        rerun.setCriterion(criterion);
        rerun.setEvidenceType("Clean scanner rerun");
        rerun.setDescription("Attach a follow-up scan or CI evidence showing the finding is resolved or risk-reviewed.");
        rerun.setRequired(true);
        evidenceRequirementRepository.save(rerun);
        created++;
        return created;
    }

    private int createScannerAutomatedCheck(ProjectWorkspace workspace, Milestone milestone, AcceptanceCriterion criterion, ProductFinding finding) {
        String externalRef = finding.getNormalizedFinding() == null ? finding.getId().toString() : finding.getNormalizedFinding().getId().toString();
        if (automatedCheckRepository.findTopByWorkspaceIdAndCheckTypeAndExternalRefOrderByCreatedAtDesc(
                workspace.getId(),
                SCANNER_READINESS_CHECK_TYPE,
                externalRef
        ).isPresent()) {
            return 0;
        }
        AutomatedCheck check = new AutomatedCheck();
        check.setWorkspace(workspace);
        check.setMilestone(milestone);
        check.setCriterion(criterion);
        check.setCheckType(SCANNER_READINESS_CHECK_TYPE);
        check.setProvider(firstNonBlank(finding.getSourceSignal(), "ProdUS Scanner"));
        check.setExternalRef(externalRef);
        check.setStatus(severe(finding.getSeverity())
                ? AutomatedCheck.CheckStatus.FAILED
                : AutomatedCheck.CheckStatus.WARNING);
        check.setSummary(firstNonBlank(finding.getMappingReason(), "Scanner finding mapped to workspace readiness evidence."));
        check.setRawPayload("{\"findingId\":\"" + externalRef + "\",\"severity\":\"" + finding.getSeverity()
                + "\",\"recommendedModule\":\"" + jsonEscape(finding.getRecommendedModule() == null ? "" : finding.getRecommendedModule().getStableCode()) + "\"}");
        check.setObservedAt(LocalDateTime.now());
        automatedCheckRepository.save(check);
        return 1;
    }

    private WorkspaceScannerReadinessResponse buildWorkspaceScannerReadiness(ProjectWorkspace workspace) {
        ProductDiagnosis diagnosis = diagnosisRepository
                .findByWorkspaceIdAndDiagnosisSourceOrderByCreatedAtDesc(workspace.getId(), ProductDiagnosis.DiagnosisSource.SCANNER_READINESS)
                .stream()
                .findFirst()
                .orElse(null);
        List<ProductFinding> findings = diagnosis == null
                ? List.of()
                : findingRepository.findByDiagnosisIdOrderByCreatedAtAsc(diagnosis.getId());
        List<ScannerEvidenceItem> evidenceItems = scannerEvidenceItemRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspace.getId());
        List<Milestone> milestones = milestoneRepository.findByWorkspaceIdOrderByCreatedAtAsc(workspace.getId());
        List<AcceptanceCriterion> scannerCriteria = milestones.stream()
                .flatMap(milestone -> criterionRepository.findByMilestoneIdOrderByCreatedAtAsc(milestone.getId()).stream())
                .filter(this::scannerCriterion)
                .toList();
        int missingEvidence = scannerCriteria.stream()
                .flatMap(criterion -> evidenceRequirementRepository.findByCriterionIdOrderByCreatedAtAsc(criterion.getId()).stream())
                .filter(requirement -> requirement.isRequired() && requirement.getStatus() == EvidenceRequirement.EvidenceStatus.MISSING)
                .toList()
                .size();
        List<MilestoneRiskResponse> milestoneRisks = milestones.stream()
                .map(milestone -> toMilestoneRiskResponse(workspace, milestone, findings))
                .filter(risk -> risk.scannerFindingCount() > 0 || risk.missingEvidenceCount() > 0)
                .toList();
        long mappedCount = findings.stream().filter(finding -> finding.getRecommendedModule() != null).count();
        long blockerCount = findings.stream().filter(finding -> severe(finding.getSeverity())).count();
        DiagnosisResponse diagnosisResponse = diagnosis == null
                ? null
                : toDiagnosisResponse(diagnosis, findings);
        ProductProfile product = workspaceProduct(workspace);
        return new WorkspaceScannerReadinessResponse(
                workspace.getId(),
                product == null ? null : product.getId(),
                diagnosisResponse,
                (int) mappedCount,
                diagnosis == null ? 0 : diagnosis.getUnmappedFindingCount(),
                evidenceItems.size(),
                missingEvidence,
                (int) blockerCount,
                scannerCriteria.size(),
                milestoneRisks
        );
    }

    private ShipConfidenceHistoryResponse buildShipConfidenceHistory(
            ProductProfile product,
            ProjectWorkspace workspace,
            List<ProductDiagnosis> diagnoses
    ) {
        List<DiagnosisSnapshotResponse> snapshots = new ArrayList<>();
        for (int index = 0; index < diagnoses.size(); index++) {
            ProductDiagnosis diagnosis = diagnoses.get(index);
            Integer previousScore = index + 1 < diagnoses.size()
                    ? diagnoses.get(index + 1).getReadinessScore()
                    : null;
            snapshots.add(toDiagnosisSnapshotResponse(diagnosis, previousScore));
        }
        DiagnosisSnapshotResponse latest = snapshots.isEmpty() ? null : snapshots.get(0);
        Integer previousScore = snapshots.size() > 1 ? snapshots.get(1).shipConfidenceScore() : null;
        Integer delta = latest == null || previousScore == null ? null : latest.shipConfidenceScore() - previousScore;
        return new ShipConfidenceHistoryResponse(
                product == null ? null : product.getId(),
                product == null ? "Unknown product" : product.getName(),
                workspace == null ? null : workspace.getId(),
                workspace == null ? null : workspace.getName(),
                latest,
                previousScore,
                delta,
                trendSummary(latest, delta),
                snapshots
        );
    }

    private LaunchReadinessReport buildAndSaveLaunchReadinessReport(
            User user,
            ProductProfile product,
            ProjectWorkspace workspace,
            String focus
    ) {
        List<ProductDiagnosis> diagnoses = workspace == null
                ? diagnosisRepository.findByProductProfileIdOrderByCreatedAtDesc(product.getId())
                : diagnosisRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspace.getId());
        ProductDiagnosis latestDiagnosis = diagnoses.isEmpty() ? null : diagnoses.get(0);
        List<ProductFinding> findings = latestDiagnosis == null
                ? List.of()
                : findingRepository.findByDiagnosisIdOrderByCreatedAtAsc(latestDiagnosis.getId());
        ShipConfidenceHistoryResponse confidence = buildShipConfidenceHistory(product, workspace, diagnoses);
        DiagnosisSnapshotResponse latestSnapshot = confidence.latest();
        List<ScannerEvidenceItem> evidenceItems = workspace == null
                ? scannerEvidenceItemRepository.findByProductProfileIdOrderByCreatedAtDesc(product.getId())
                : scannerEvidenceItemRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspace.getId());
        List<String> selectedServices = launchReportSelectedServices(product, workspace, findings);
        List<String> readyItems = launchReportReadyItems(product, workspace, latestSnapshot, evidenceItems, selectedServices);
        List<String> riskItems = launchReportRiskItems(findings, latestDiagnosis);
        List<String> proofCollected = launchReportProofCollected(workspace, evidenceItems);
        List<String> proofMissing = launchReportProofMissing(workspace, findings);
        String nextDecision = launchReportNextDecision(latestSnapshot, riskItems, proofMissing, selectedServices);

        LaunchReadinessReport report = new LaunchReadinessReport();
        report.setProductProfile(product);
        report.setWorkspace(workspace);
        report.setSourceDiagnosis(latestDiagnosis);
        report.setGeneratedBy(user);
        report.setReportVersion((int) launchReadinessReportRepository.countByProductProfileId(product.getId()) + 1);
        report.setTitle((workspace == null ? product.getName() : workspace.getName()) + " launch readiness report");
        report.setShipConfidenceScore(latestSnapshot == null ? 0 : latestSnapshot.shipConfidenceScore());
        report.setStatusLabel(latestSnapshot == null ? "Needs first diagnosis" : latestSnapshot.statusLabel());
        report.setSummary(launchReportSummary(product, workspace, latestSnapshot, focus));
        report.setReadySummary(readyItems.isEmpty()
                ? "ProdUS has not collected enough proof yet to mark a launch area as supported."
                : "Current proof supports " + readyItems.size() + " launch-readiness signal(s).");
        report.setRiskSummary(riskItems.isEmpty()
                ? "No open high-priority launch blockers are visible in the latest diagnosis."
                : riskItems.size() + " risk item(s) should be reviewed before the next user-facing launch.");
        report.setNextOwnerDecision(nextDecision);
        report.setReadyItemsJson(toJson(readyItems));
        report.setRiskItemsJson(toJson(riskItems));
        report.setSelectedServicesJson(toJson(selectedServices));
        report.setProofCollectedJson(toJson(proofCollected));
        report.setProofMissingJson(toJson(proofMissing));
        report.setSourceSnapshotJson(toJson(Map.of(
                "productId", product.getId().toString(),
                "workspaceId", workspace == null ? "" : workspace.getId().toString(),
                "diagnosisId", latestDiagnosis == null ? "" : latestDiagnosis.getId().toString(),
                "diagnosisSource", latestDiagnosis == null ? "" : latestDiagnosis.getDiagnosisSource().name(),
                "scannerEvidenceCount", evidenceItems.size(),
                "selectedServiceCount", selectedServices.size(),
                "generatedFrom", "ProdUS deterministic readiness snapshot"
        )));
        return launchReadinessReportRepository.save(report);
    }

    private List<String> launchReportSelectedServices(
            ProductProfile product,
            ProjectWorkspace workspace,
            List<ProductFinding> findings
    ) {
        LinkedHashMap<String, String> services = new LinkedHashMap<>();
        if (workspace != null && workspace.getPackageInstance() != null) {
            packageModuleRepository.findByPackageInstanceIdOrderBySequenceOrderAsc(workspace.getPackageInstance().getId()).stream()
                    .map(PackageModule::getServiceModule)
                    .filter(module -> module != null)
                    .forEach(module -> services.putIfAbsent(firstNonBlank(module.getStableCode(), module.getSlug(), module.getName()), module.getName()));
        }
        if (product != null) {
            serviceRecommendationRepository.findByProductProfileIdOrderBySequenceNumberAscCreatedAtAsc(product.getId()).stream()
                    .map(ProductServiceRecommendation::getServiceModule)
                    .filter(module -> module != null)
                    .forEach(module -> services.putIfAbsent(firstNonBlank(module.getStableCode(), module.getSlug(), module.getName()), module.getName()));
        }
        findings.stream()
                .map(ProductFinding::getRecommendedModule)
                .filter(module -> module != null)
                .forEach(module -> services.putIfAbsent(firstNonBlank(module.getStableCode(), module.getSlug(), module.getName()), module.getName()));
        return services.values().stream().limit(12).toList();
    }

    private List<String> launchReportReadyItems(
            ProductProfile product,
            ProjectWorkspace workspace,
            DiagnosisSnapshotResponse latestSnapshot,
            List<ScannerEvidenceItem> evidenceItems,
            List<String> selectedServices
    ) {
        List<String> items = new ArrayList<>();
        if (product.getRepositoryUrl() != null && !product.getRepositoryUrl().isBlank()) {
            items.add("Repository source is attached for scanner-backed review.");
        }
        if (product.getProductUrl() != null && !product.getProductUrl().isBlank()) {
            items.add("Product URL is recorded for launch context.");
        }
        if (!selectedServices.isEmpty()) {
            items.add("Lifecycle services are selected: " + String.join(", ", selectedServices.stream().limit(4).toList()) + ".");
        }
        if (!evidenceItems.isEmpty()) {
            items.add(evidenceItems.size() + " scanner or evidence item(s) are attached.");
        }
        if (workspace != null) {
            long acceptedMilestones = milestoneRepository.findByWorkspaceIdOrderByCreatedAtAsc(workspace.getId()).stream()
                    .filter(milestone -> milestone.getStatus() == Milestone.MilestoneStatus.ACCEPTED)
                    .count();
            if (acceptedMilestones > 0) {
                items.add(acceptedMilestones + " milestone(s) are accepted.");
            }
        }
        if (latestSnapshot != null && latestSnapshot.priorityFixCount() == 0 && latestSnapshot.shipConfidenceScore() >= 65) {
            items.add("Latest ship-confidence checkpoint has no critical priority fixes.");
        }
        return items.stream().limit(8).toList();
    }

    private List<String> launchReportRiskItems(List<ProductFinding> findings, ProductDiagnosis latestDiagnosis) {
        List<String> items = findings.stream()
                .filter(finding -> finding.getStatus() != ProductFinding.FindingStatus.RESOLVED
                        && finding.getStatus() != ProductFinding.FindingStatus.DISMISSED)
                .sorted(Comparator.comparing((ProductFinding finding) -> productFindingSeverityRank(finding.getSeverity())).reversed())
                .limit(8)
                .map(finding -> finding.getTitle() + " (" + finding.getSeverity() + "): "
                        + firstNonBlank(finding.getBusinessRisk(), finding.getDescription(), "Review before launch."))
                .toList();
        if (items.isEmpty() && latestDiagnosis != null && latestDiagnosis.getUnmappedFindingCount() > 0) {
            return List.of(latestDiagnosis.getUnmappedFindingCount() + " finding(s) still need service mapping review.");
        }
        return items;
    }

    private List<String> launchReportProofCollected(ProjectWorkspace workspace, List<ScannerEvidenceItem> evidenceItems) {
        LinkedHashMap<String, String> proof = new LinkedHashMap<>();
        evidenceItems.stream()
                .limit(8)
                .forEach(item -> proof.putIfAbsent(item.getId().toString(),
                        item.getTitle() + " (" + item.getEvidenceType() + ", " + item.getConfidenceLevel() + " confidence)"));
        if (workspace != null) {
            automatedCheckRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspace.getId()).stream()
                    .filter(check -> check.getStatus() == AutomatedCheck.CheckStatus.PASSED)
                    .limit(6)
                    .forEach(check -> proof.putIfAbsent(check.getId().toString(),
                            firstNonBlank(check.getSummary(), check.getCheckType()) + " (passed check)"));
        }
        return proof.values().stream().limit(10).toList();
    }

    private List<String> launchReportProofMissing(ProjectWorkspace workspace, List<ProductFinding> findings) {
        LinkedHashMap<String, String> missing = new LinkedHashMap<>();
        findings.stream()
                .filter(finding -> finding.getEvidenceRequired() != null && !finding.getEvidenceRequired().isBlank())
                .filter(finding -> finding.getStatus() != ProductFinding.FindingStatus.RESOLVED
                        && finding.getStatus() != ProductFinding.FindingStatus.DISMISSED)
                .limit(8)
                .forEach(finding -> missing.putIfAbsent(finding.getId().toString(),
                        finding.getTitle() + ": " + finding.getEvidenceRequired()));
        if (workspace != null) {
            milestoneRepository.findByWorkspaceIdOrderByCreatedAtAsc(workspace.getId()).stream()
                    .flatMap(milestone -> evidenceRequirementRepository.findByMilestoneIdOrderByCreatedAtAsc(milestone.getId()).stream())
                    .filter(requirement -> requirement.isRequired() && requirement.getStatus() == EvidenceRequirement.EvidenceStatus.MISSING)
                    .limit(8)
                    .forEach(requirement -> missing.putIfAbsent(requirement.getId().toString(),
                            requirement.getMilestone().getTitle() + ": " + firstNonBlank(requirement.getDescription(), requirement.getEvidenceType())));
        }
        return missing.values().stream().limit(10).toList();
    }

    private static String launchReportSummary(
            ProductProfile product,
            ProjectWorkspace workspace,
            DiagnosisSnapshotResponse latestSnapshot,
            String focus
    ) {
        String context = workspace == null
                ? product.getName()
                : workspace.getName() + " for " + product.getName();
        String score = latestSnapshot == null
                ? "No ship-confidence checkpoint exists yet"
                : "Ship confidence is " + latestSnapshot.shipConfidenceScore() + "/100 (" + latestSnapshot.statusLabel() + ")";
        return context + " is being reviewed for prototype-to-product readiness. " + score + ". "
                + firstNonBlank(focus, "Use this report to decide the next practical fix before exposing the product to more users.");
    }

    private static String launchReportNextDecision(
            DiagnosisSnapshotResponse latestSnapshot,
            List<String> riskItems,
            List<String> proofMissing,
            List<String> selectedServices
    ) {
        if (!riskItems.isEmpty()) {
            return "Decide which top risk must be fixed before the next pilot, demo, or customer-facing launch.";
        }
        if (!proofMissing.isEmpty()) {
            return "Attach the missing proof, then rerun scanner/readiness checks before expanding usage.";
        }
        if (selectedServices.isEmpty()) {
            return "Select the smallest useful service plan so the next launch step has an owner and deliverable.";
        }
        if (latestSnapshot != null && latestSnapshot.shipConfidenceScore() >= 80) {
            return "Prepare a controlled launch or pilot checkpoint with support and rollback notes.";
        }
        return "Run a scanner or refresh the fix path to turn this report into a sharper launch decision.";
    }

    private LaunchReadinessReportResponse toLaunchReadinessReportResponse(LaunchReadinessReport report) {
        ProductProfile product = report.getProductProfile();
        ProjectWorkspace workspace = report.getWorkspace();
        ProductDiagnosis diagnosis = report.getSourceDiagnosis();
        return new LaunchReadinessReportResponse(
                report.getId(),
                report.getCreatedAt(),
                product == null ? null : product.getId(),
                product == null ? "Unknown product" : product.getName(),
                workspace == null ? null : workspace.getId(),
                workspace == null ? null : workspace.getName(),
                diagnosis == null ? null : diagnosis.getId(),
                report.getReportVersion(),
                report.getTitle(),
                report.getShipConfidenceScore(),
                report.getStatusLabel(),
                report.getSummary(),
                report.getReadySummary(),
                report.getRiskSummary(),
                report.getNextOwnerDecision(),
                readStringList(report.getReadyItemsJson()),
                readStringList(report.getRiskItemsJson()),
                readStringList(report.getSelectedServicesJson()),
                readStringList(report.getProofCollectedJson()),
                readStringList(report.getProofMissingJson()),
                report.getSourceSnapshotJson(),
                report.getStatus()
        );
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            return value instanceof List<?> ? "[]" : "{}";
        }
    }

    private List<String> readStringList(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException ex) {
            return List.of();
        }
    }

    private DiagnosisSnapshotResponse toDiagnosisSnapshotResponse(ProductDiagnosis diagnosis, Integer previousScore) {
        ProductProfile product = firstNonNull(diagnosis.getProductProfile(), workspaceProduct(diagnosis.getWorkspace()));
        List<ProductFinding> findings = findingRepository.findByDiagnosisIdOrderByCreatedAtAsc(diagnosis.getId());
        int mappedFindingCount = (int) findings.stream().filter(finding -> finding.getRecommendedModule() != null).count();
        int priorityFixCount = Math.max(
                diagnosis.getTopBlockerCount(),
                (int) findings.stream()
                        .filter(finding -> severe(finding.getSeverity()))
                        .filter(finding -> finding.getStatus() == ProductFinding.FindingStatus.OPEN
                                || finding.getStatus() == ProductFinding.FindingStatus.SERVICE_SELECTED)
                        .count()
        );
        int proofGapCount = (int) findings.stream()
                .filter(finding -> finding.getEvidenceRequired() != null && !finding.getEvidenceRequired().isBlank())
                .filter(finding -> finding.getScannerEvidenceItem() == null)
                .filter(finding -> finding.getStatus() != ProductFinding.FindingStatus.RESOLVED
                        && finding.getStatus() != ProductFinding.FindingStatus.DISMISSED)
                .count();
        List<ProductServiceRecommendation> recommendations = product == null
                ? List.of()
                : serviceRecommendationRepository.findByProductProfileIdOrderBySequenceNumberAscCreatedAtAsc(product.getId());
        List<String> recommendedServices = recommendedServiceNames(findings, recommendations);
        List<String> recommendedServiceCodes = recommendedServiceCodes(findings, recommendations);
        String trendDirection = trendDirection(diagnosis.getReadinessScore(), previousScore);
        return new DiagnosisSnapshotResponse(
                diagnosis.getId(),
                diagnosis.getCreatedAt(),
                product == null ? null : product.getId(),
                product == null ? "Unknown product" : product.getName(),
                diagnosis.getWorkspace() == null ? null : diagnosis.getWorkspace().getId(),
                diagnosis.getWorkspace() == null ? null : diagnosis.getWorkspace().getName(),
                diagnosis.getDiagnosisSource(),
                diagnosis.getReadinessScore(),
                shipConfidenceLabel(diagnosis.getReadinessScore(), priorityFixCount, proofGapCount),
                diagnosis.getSummary(),
                priorityFixCount,
                mappedFindingCount,
                diagnosis.getUnmappedFindingCount(),
                proofGapCount,
                recommendedServices.size(),
                recommendedServices,
                recommendedServiceCodes,
                suggestedNextStep(diagnosis, priorityFixCount, mappedFindingCount, proofGapCount, recommendedServices),
                trendDirection
        );
    }

    private static List<String> recommendedServiceNames(
            List<ProductFinding> findings,
            List<ProductServiceRecommendation> recommendations
    ) {
        LinkedHashMap<String, String> services = new LinkedHashMap<>();
        findings.stream()
                .map(ProductFinding::getRecommendedModule)
                .filter(module -> module != null)
                .forEach(module -> services.putIfAbsent(module.getStableCode(), module.getName()));
        recommendations.stream()
                .map(ProductServiceRecommendation::getServiceModule)
                .filter(module -> module != null)
                .forEach(module -> services.putIfAbsent(module.getStableCode(), module.getName()));
        return services.values().stream().limit(10).toList();
    }

    private static List<String> recommendedServiceCodes(
            List<ProductFinding> findings,
            List<ProductServiceRecommendation> recommendations
    ) {
        LinkedHashMap<String, String> services = new LinkedHashMap<>();
        findings.stream()
                .map(ProductFinding::getRecommendedModule)
                .filter(module -> module != null)
                .forEach(module -> services.putIfAbsent(module.getStableCode(), module.getStableCode()));
        recommendations.stream()
                .map(recommendation -> firstNonBlank(recommendation.getModuleCode(), recommendation.getServiceModule().getStableCode()))
                .filter(code -> code != null && !code.isBlank())
                .forEach(code -> services.putIfAbsent(code, code));
        return services.values().stream().limit(10).toList();
    }

    private static String shipConfidenceLabel(int score, int priorityFixCount, int proofGapCount) {
        if (priorityFixCount > 0) {
            return "Needs key fixes";
        }
        if (proofGapCount > 0) {
            return "Needs proof";
        }
        if (score >= 85) {
            return "Nearly ready";
        }
        if (score >= 65) {
            return "Promising";
        }
        return "Early signal";
    }

    private static String suggestedNextStep(
            ProductDiagnosis diagnosis,
            int priorityFixCount,
            int mappedFindingCount,
            int proofGapCount,
            List<String> recommendedServices
    ) {
        if (priorityFixCount > 0 && !recommendedServices.isEmpty()) {
            return "Add the highest-priority service and decide what must be fixed before the next user-facing launch.";
        }
        if (mappedFindingCount > 0 && !recommendedServices.isEmpty()) {
            return "Review the mapped service recommendations and add the work that helps this prototype ship safely.";
        }
        if (diagnosis.getUnmappedFindingCount() > 0) {
            return "Review unmapped scanner signals so ProdUS can turn them into a clear service path.";
        }
        if (proofGapCount > 0) {
            return "Attach lightweight proof or run a fresh scan so the owner can trust the next decision.";
        }
        if (diagnosis.getDiagnosisSource() == ProductDiagnosis.DiagnosisSource.SCANNER_READINESS) {
            return "Keep scanner proof fresh and move the next fix into the workspace.";
        }
        return "Run a scanner or add repository proof to turn the diagnosis into a concrete fix path.";
    }

    private static String trendDirection(Integer currentScore, Integer previousScore) {
        if (currentScore == null || previousScore == null) {
            return "NEW";
        }
        int delta = currentScore - previousScore;
        if (delta >= 3) {
            return "UP";
        }
        if (delta <= -3) {
            return "DOWN";
        }
        return "FLAT";
    }

    private static String trendSummary(DiagnosisSnapshotResponse latest, Integer delta) {
        if (latest == null) {
            return "No diagnosis history yet. Run a diagnosis or scanner to create the first ship-confidence checkpoint.";
        }
        if (delta == null) {
            return "First ship-confidence checkpoint captured. Re-run after fixes to show movement.";
        }
        if (delta > 0) {
            return "Ship confidence improved by " + delta + " points. Keep closing the highest-priority fixes.";
        }
        if (delta < 0) {
            return "Ship confidence dropped by " + Math.abs(delta) + " points. Review the newest scanner signals before starting more work.";
        }
        return "Ship confidence is steady. Use the next suggested fix to create movement.";
    }

    private MilestoneRiskResponse toMilestoneRiskResponse(ProjectWorkspace workspace, Milestone milestone, List<ProductFinding> findings) {
        List<AcceptanceCriterion> scannerCriteria = criterionRepository.findByMilestoneIdOrderByCreatedAtAsc(milestone.getId()).stream()
                .filter(this::scannerCriterion)
                .toList();
        List<ProductFinding> matched = findings.stream()
                .filter(finding -> finding.getNormalizedFinding() != null)
                .filter(finding -> {
                    String marker = SCANNER_CRITERION_MARKER + finding.getNormalizedFinding().getId();
                    return scannerCriteria.stream().anyMatch(criterion -> criterion.getDescription() != null && criterion.getDescription().contains(marker));
                })
                .toList();
        int missingEvidence = scannerCriteria.stream()
                .flatMap(criterion -> evidenceRequirementRepository.findByCriterionIdOrderByCreatedAtAsc(criterion.getId()).stream())
                .filter(requirement -> requirement.isRequired() && requirement.getStatus() == EvidenceRequirement.EvidenceStatus.MISSING)
                .toList()
                .size();
        String highestSeverity = matched.stream()
                .map(ProductFinding::getSeverity)
                .max(Comparator.comparingInt(ProductizationEngineService::productFindingSeverityRank))
                .map(Enum::name)
                .orElse(null);
        List<String> services = matched.stream()
                .map(ProductFinding::getRecommendedModule)
                .filter(module -> module != null)
                .map(ServiceModule::getName)
                .distinct()
                .limit(6)
                .toList();
        return new MilestoneRiskResponse(
                milestone.getId(),
                milestone.getTitle(),
                milestone.getStatus(),
                matched.size(),
                services.size(),
                highestSeverity,
                missingEvidence,
                services
        );
    }

    private boolean scannerCriterion(AcceptanceCriterion criterion) {
        return criterion.getDescription() != null && criterion.getDescription().contains(SCANNER_CRITERION_MARKER);
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
                        .map(NormalizedFinding::getScanRun)
                        .filter(scanRun -> scanRun != null && scanRun.getId() != null)
                        .map(ScanRun::getId)
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
                        ? "No active scanner findings are currently blocking launch. Keep scheduled evidence refresh enabled before launch decisions."
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

    private static int productFindingSeverityRank(ProductFinding.FindingSeverity severity) {
        return switch (severity) {
            case CRITICAL -> 5;
            case HIGH -> 4;
            case MEDIUM -> 3;
            case LOW -> 2;
            case INFO -> 1;
        };
    }

    private static boolean severe(ProductFinding.FindingSeverity severity) {
        return severity == ProductFinding.FindingSeverity.CRITICAL || severity == ProductFinding.FindingSeverity.HIGH;
    }

    private static boolean containsOverlap(String left, String right) {
        if (left.isBlank() || right.isBlank()) {
            return false;
        }
        Set<String> leftWords = new HashSet<>(List.of(left.split("\\s+")));
        return List.of(right.split("\\s+")).stream()
                .filter(word -> word.length() >= 5)
                .anyMatch(leftWords::contains);
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
            addSeed(seeds, "database", "db.review", "Database readiness risk", "Schema, migration, data integrity, and query behavior need review before launch.", ProductFinding.FindingSeverity.MEDIUM, "Owner context mentioned data or database concerns.");
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
        ProductProfile product = firstNonNull(diagnosis.getProductProfile(), workspaceProduct(diagnosis.getWorkspace()));
        return new DiagnosisResponse(
                diagnosis.getId(),
                diagnosis.getCreatedAt(),
                product == null ? null : product.getId(),
                product == null ? "Unknown product" : product.getName(),
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

    private ProductProfile workspaceProduct(ProjectWorkspace workspace) {
        if (workspace == null || workspace.getPackageInstance() == null) {
            return null;
        }
        return workspace.getPackageInstance().getProductProfile();
    }

    private static <T> T firstNonNull(T primary, T fallback) {
        return primary != null ? primary : fallback;
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
    public record DiagnosisSnapshotResponse(UUID id, LocalDateTime createdAt, UUID productId, String productName, UUID workspaceId, String workspaceName, ProductDiagnosis.DiagnosisSource source, int shipConfidenceScore, String statusLabel, String summary, int priorityFixCount, int mappedFindingCount, int unmappedFindingCount, int proofGapCount, int recommendedServiceCount, List<String> recommendedServices, List<String> recommendedServiceCodes, String suggestedNextStep, String trendDirection) {}
    public record ShipConfidenceHistoryResponse(UUID productId, String productName, UUID workspaceId, String workspaceName, DiagnosisSnapshotResponse latest, Integer previousScore, Integer delta, String trendSummary, List<DiagnosisSnapshotResponse> snapshots) {}
    public record FindingResponse(UUID id, String title, String description, String affectedLayer, String readinessArea, String businessRisk, String ownerDecision, String evidenceRequired, String mappingReason, Double mappingConfidence, String mappingSource, ProductFinding.FindingSeverity severity, ProductFinding.ConfidenceLevel confidenceLevel, String confidenceBasis, String sourceSignal, ProductFinding.FindingStatus status, UUID normalizedFindingId, UUID scannerEvidenceItemId, UUID recommendedModuleId, String recommendedModuleName, String recommendedModuleCode) {}
    public record CriterionResponse(UUID id, UUID milestoneId, UUID packageModuleId, String serviceName, String title, String description, boolean required, AcceptanceCriterion.CriterionStatus status, boolean humanReviewRequired, List<EvidenceRequirementResponse> evidenceRequirements, List<AutomatedCheckResponse> automatedChecks, List<ReviewDecisionResponse> reviews) {}
    public record EvidenceRequirementRequest(EvidenceRequirement.EvidenceStatus status, String evidenceReference) {}
    public record EvidenceRequirementResponse(UUID id, UUID criterionId, String evidenceType, String description, boolean required, EvidenceRequirement.EvidenceStatus status, String evidenceReference) {}
    public record AutomatedCheckRequest(String checkType, String provider, String externalRef, AutomatedCheck.CheckStatus status, String summary, String rawPayload, LocalDateTime observedAt) {}
    public record AutomatedCheckResponse(UUID id, UUID workspaceId, UUID milestoneId, UUID criterionId, String checkType, String provider, String externalRef, AutomatedCheck.CheckStatus status, String summary, String rawPayload, LocalDateTime observedAt) {}
    public record ReviewDecisionRequest(ReviewDecision.Decision decision, String note) {}
    public record ReviewDecisionResponse(UUID id, UUID milestoneId, UUID criterionId, String reviewerEmail, ReviewDecision.Decision decision, String note, LocalDateTime createdAt) {}
    public record WorkspaceGovernanceResponse(UUID workspaceId, String workspaceName, List<CriterionResponse> criteria, List<AutomatedCheckResponse> automatedChecks, List<HandoffResponse> handoffs, List<HealthReviewResponse> healthReviews, List<IntegrationConnectionResponse> integrations) {}
    public record WorkspaceScannerReadinessRequest(Boolean createCriteria, Boolean createServiceRecommendations, Boolean includeAcceptedRisk, String summary) {}
    public record WorkspaceScannerReadinessResponse(UUID workspaceId, UUID productId, DiagnosisResponse diagnosis, int mappedFindingCount, int unmappedFindingCount, int scannerEvidenceCount, int missingEvidenceCount, int blockerCount, int enrichedCriterionCount, List<MilestoneRiskResponse> milestoneRisks) {}
    public record MilestoneRiskResponse(UUID milestoneId, String milestoneTitle, Milestone.MilestoneStatus milestoneStatus, int scannerFindingCount, int mappedServiceCount, String highestSeverity, int missingEvidenceCount, List<String> mappedServices) {}
    public record LaunchReadinessReportRequest(UUID workspaceId, String focus) {}
    public record LaunchReadinessReportResponse(UUID id, LocalDateTime createdAt, UUID productId, String productName, UUID workspaceId, String workspaceName, UUID sourceDiagnosisId, int reportVersion, String title, int shipConfidenceScore, String statusLabel, String summary, String readySummary, String riskSummary, String nextOwnerDecision, List<String> readyItems, List<String> riskItems, List<String> selectedServices, List<String> proofCollected, List<String> proofMissing, String sourceSnapshotJson, LaunchReadinessReport.ReportStatus status) {}
    public record HandoffRequest(String title, String runbook, String accessChecklist, String knownIssues, String supportScope, HandoffDocument.HandoffStatus status) {}
    public record HandoffResponse(UUID id, UUID workspaceId, String title, String runbook, String accessChecklist, String knownIssues, String supportScope, HandoffDocument.HandoffStatus status) {}
    public record HealthReviewRequest(UUID supportSubscriptionId, LocalDate periodStart, LocalDate periodEnd, Integer healthScore, String summary, String risks, String actions, ProductHealthReview.ReviewStatus status) {}
    public record HealthReviewResponse(UUID id, UUID workspaceId, LocalDate periodStart, LocalDate periodEnd, Integer healthScore, String summary, String risks, String actions, ProductHealthReview.ReviewStatus status) {}
    public record IntegrationConnectionRequest(IntegrationConnection.ProviderType providerType, String name, String externalRef, String scopedAccessNote, IntegrationConnection.ConnectionStatus status) {}
    public record IntegrationConnectionResponse(UUID id, UUID workspaceId, IntegrationConnection.ProviderType providerType, String name, String externalRef, String scopedAccessNote, IntegrationConnection.ConnectionStatus status, LocalDateTime lastCheckedAt, List<IntegrationSignalResponse> signals) {}
    public record IntegrationSignalRequest(UUID milestoneId, UUID criterionId, String signalType, IntegrationSignal.SignalStatus status, String summary, String evidencePayload, LocalDateTime recordedAt) {}
    public record IntegrationSignalResponse(UUID id, UUID connectionId, UUID workspaceId, UUID milestoneId, UUID criterionId, String signalType, IntegrationSignal.SignalStatus status, String summary, String evidencePayload, LocalDateTime recordedAt) {}
}
