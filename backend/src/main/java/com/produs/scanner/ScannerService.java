package com.produs.scanner;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.audit.AuditEvent;
import com.produs.catalog.ServiceModule;
import com.produs.catalog.ServiceModuleRepository;
import com.produs.dto.PlatformDtos.ProductProfileResponse;
import com.produs.dto.PlatformDtos.ServiceModuleResponse;
import com.produs.entity.User;
import com.produs.exception.ResourceNotFoundException;
import com.produs.product.ProductProfile;
import com.produs.product.ProductProfileRepository;
import com.produs.service.AuditService;
import com.produs.service.S3Service;
import com.produs.workspace.Milestone;
import com.produs.workspace.MilestoneRepository;
import com.produs.workspace.ProjectWorkspace;
import com.produs.workspace.ProjectWorkspaceRepository;
import com.produs.workspace.WorkspaceParticipant;
import com.produs.workspace.WorkspaceParticipantRepository;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import static com.produs.dto.PlatformDtos.toProductProfileResponse;
import static com.produs.dto.PlatformDtos.toServiceModuleResponse;

@Service
@RequiredArgsConstructor
public class ScannerService {

    private static final int MAX_EVIDENCE_PAYLOAD_BYTES = 2_000_000;
    private static final Pattern SECRET_PATTERN = Pattern.compile(
            "(?i)(sk_(live|test)_[a-z0-9_\\-]{8,}|ghp_[a-z0-9_]{16,}|(api[_-]?key|access[_-]?key|secret|token|password|private[_-]?key)\\s*[:=]\\s*[\\\"']?[^\\s\\\"',;]{8,})"
    );

    private final ProductProfileRepository productRepository;
    private final ProjectWorkspaceRepository workspaceRepository;
    private final WorkspaceParticipantRepository participantRepository;
    private final MilestoneRepository milestoneRepository;
    private final ServiceModuleRepository moduleRepository;
    private final ScanSourceRepository sourceRepository;
    private final ScanRunRepository scanRunRepository;
    private final ToolRunRepository toolRunRepository;
    private final ScannerJobRepository scannerJobRepository;
    private final ScannerEvidenceItemRepository evidenceRepository;
    private final NormalizedFindingRepository findingRepository;
    private final S3Service s3Service;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final ScannerProperties scannerProperties;
    private final ScannerProcessRunner scannerProcessRunner;

    @Transactional
    public ScanSourceResponse createSource(User actor, CreateScanSourceRequest request) {
        ProductProfile product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product profile not found"));
        requireProductOwnerOrAdmin(actor, product);
        ProjectWorkspace workspace = resolveWorkspace(request.workspaceId(), product);

        ScanSource source = new ScanSource();
        source.setOwner(product.getOwner());
        source.setProductProfile(product);
        source.setWorkspace(workspace);
        source.setProviderType(request.providerType() == null ? ScanSource.ProviderType.CI_UPLOAD : request.providerType());
        source.setDisplayName(cleanRequired(request.displayName(), "Source display name is required"));
        source.setExternalReference(trimToNull(request.externalReference()));
        source.setAuthorizationStatus(request.authorizationStatus() == null ? ScanSource.AuthorizationStatus.AUTHORIZED : request.authorizationStatus());
        source.setScopeNote(trimToNull(request.scopeNote()));
        source.setCreatedBy(actor);
        ScanSource saved = sourceRepository.save(source);
        audit(actor, "SCANNER_SOURCE_CREATED", "SCAN_SOURCE", saved.getId(), AuditEvent.RiskLevel.MEDIUM,
                "Created scanner source " + saved.getDisplayName() + " for product " + product.getId());
        return toSourceResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ScanSourceResponse> listSources(User actor, UUID productId, UUID workspaceId) {
        if (productId == null && workspaceId == null) {
            throw new IllegalArgumentException("productId or workspaceId is required");
        }
        if (workspaceId != null) {
            ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
            requireWorkspaceRead(actor, workspace);
            return sourceRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream()
                    .map(this::toSourceResponse)
                    .toList();
        }
        ProductProfile product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product profile not found"));
        requireProductOwnerOrAdmin(actor, product);
        return sourceRepository.findByProductProfileIdOrderByCreatedAtDesc(productId).stream()
                .map(this::toSourceResponse)
                .toList();
    }

    @Transactional
    public ScanRunResponse uploadCiEvidence(User actor, CiEvidenceUploadRequest request) {
        ProductProfile product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product profile not found"));
        ProjectWorkspace workspace = resolveWorkspace(request.workspaceId(), product);
        requireProductOrWorkspaceWrite(actor, product, workspace);
        Milestone milestone = resolveMilestone(request.milestoneId(), workspace);

        String payload = cleanRequired(request.artifactPayload(), "Evidence payload is required");
        if (payload.getBytes(StandardCharsets.UTF_8).length > MAX_EVIDENCE_PAYLOAD_BYTES) {
            throw new IllegalArgumentException("Evidence payload exceeds the 2MB API upload limit");
        }

        ScanSource source = resolveOrCreateUploadSource(actor, product, workspace, request.sourceId());
        ScanRun scanRun = new ScanRun();
        scanRun.setScanSource(source);
        scanRun.setProductProfile(product);
        scanRun.setWorkspace(workspace);
        scanRun.setTriggerType(ScanRun.TriggerType.CI_UPLOAD);
        scanRun.setDepth(ScanRun.ScanDepth.CI_EVIDENCE);
        scanRun.setStatus(ScanRun.RunStatus.RUNNING);
        scanRun.setRequestedBy(actor);
        scanRun.setStartedAt(LocalDateTime.now());
        ScanRun savedRun = scanRunRepository.save(scanRun);

        ToolRun toolRun = new ToolRun();
        toolRun.setScanRun(savedRun);
        toolRun.setToolName(defaultString(request.toolName(), "CI evidence upload"));
        toolRun.setToolVersion(trimToNull(request.toolVersion()));
        toolRun.setStatus(ToolRun.ToolStatus.RUNNING);
        toolRun.setStartedAt(LocalDateTime.now());
        ToolRun savedTool = toolRunRepository.save(toolRun);

        try {
            String artifactName = defaultString(request.artifactFileName(), defaultArtifactName(request.format()));
            String storageKey = s3Service.generateFileKey("scanner/%s/%s".formatted(product.getId(), savedRun.getId()), artifactName);
            String artifactRef = s3Service.uploadFile(storageKey, payload.getBytes(StandardCharsets.UTF_8), contentTypeFor(request.format()));
            savedTool.setRawArtifactRef(artifactRef);
            savedTool.setStorageKey(storageKey);

            List<ParsedFinding> parsedFindings = parseEvidencePayload(request.format(), payload, savedTool.getToolName());
            int normalizedCount = 0;
            if (parsedFindings.isEmpty()) {
                ScannerEvidenceItem evidence = baseEvidence(actor, product, workspace, milestone, savedRun, savedTool);
                evidence.setTitle("Scanner evidence uploaded");
                evidence.setSummary("No normalized findings were detected in this upload.");
                evidence.setSource(savedTool.getToolName());
                evidence.setArtifactRef(artifactRef);
                evidence.setStorageKey(storageKey);
                evidenceRepository.save(evidence);
            } else {
                for (ParsedFinding parsed : parsedFindings) {
                    NormalizedRecord normalized = normalizeFinding(parsed, savedTool.getToolName());
                    ScannerEvidenceItem evidence = baseEvidence(actor, product, workspace, milestone, savedRun, savedTool);
                    evidence.setTitle(normalized.title());
                    evidence.setSummary(normalized.description());
                    evidence.setSource(normalized.sourceTool());
                    evidence.setArtifactRef(artifactRef);
                    evidence.setStorageKey(storageKey);
                    evidence.setRedactionStatus(normalized.redacted() ? ScannerEvidenceItem.RedactionStatus.REDACTED : ScannerEvidenceItem.RedactionStatus.NONE);
                    evidence.setConfidenceLevel(confidenceFor(normalized.severity()));
                    ScannerEvidenceItem savedEvidence = evidenceRepository.save(evidence);

                    NormalizedFinding finding = new NormalizedFinding();
                    finding.setProductProfile(product);
                    finding.setWorkspace(workspace);
                    finding.setScanRun(savedRun);
                    finding.setToolRun(savedTool);
                    finding.setFingerprint(fingerprint(product.getId(), normalized));
                    finding.setSourceTool(normalized.sourceTool());
                    finding.setSourceRuleId(normalized.ruleId());
                    finding.setTitle(normalized.title());
                    finding.setDescription(normalized.description());
                    finding.setSeverity(normalized.severity());
                    finding.setStatus(NormalizedFinding.FindingStatus.OPEN);
                    finding.setAffectedComponent(normalized.affectedComponent());
                    finding.setEvidenceItem(savedEvidence);
                    finding.setRecommendedModule(recommendServiceModule(normalized));
                    finding.setConfidenceBasis(normalized.confidenceBasis());
                    NormalizedFinding savedFinding = findingRepository.save(finding);
                    savedEvidence.setFinding(savedFinding);
                    evidenceRepository.save(savedEvidence);
                    normalizedCount++;
                }
            }

            savedTool.setNormalizedCount(normalizedCount);
            savedTool.setCompletedAt(LocalDateTime.now());
            savedTool.setStatus(ToolRun.ToolStatus.COMPLETED);
            toolRunRepository.save(savedTool);

            savedRun.setCompletedAt(LocalDateTime.now());
            savedRun.setStatus(ScanRun.RunStatus.COMPLETED);
            scanRunRepository.save(savedRun);
            audit(actor, "SCANNER_EVIDENCE_UPLOADED", "SCAN_RUN", savedRun.getId(), AuditEvent.RiskLevel.MEDIUM,
                    "Uploaded %s evidence for product %s with %d normalized findings".formatted(request.format(), product.getId(), normalizedCount));
            return toScanRunResponse(savedRun, List.of(savedTool));
        } catch (RuntimeException ex) {
            savedTool.setStatus(ToolRun.ToolStatus.FAILED);
            savedTool.setErrorSummary(safeFailure(ex));
            savedTool.setCompletedAt(LocalDateTime.now());
            toolRunRepository.save(savedTool);
            savedRun.setStatus(ScanRun.RunStatus.FAILED);
            savedRun.setFailureSummary(safeFailure(ex));
            savedRun.setCompletedAt(LocalDateTime.now());
            scanRunRepository.save(savedRun);
            audit(actor, "SCANNER_EVIDENCE_FAILED", "SCAN_RUN", savedRun.getId(), AuditEvent.RiskLevel.HIGH,
                    "Scanner evidence upload failed for product " + product.getId() + ": " + safeFailure(ex));
            throw ex;
        }
    }

    @Transactional
    public ScanRunResponse startHostedScan(User actor, StartHostedScanRequest request) {
        ProductProfile product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product profile not found"));
        ProjectWorkspace workspace = resolveWorkspace(request.workspaceId(), product);
        requireProductOrWorkspaceWrite(actor, product, workspace);
        ScanRun.ScanDepth depth = request.depth() == null ? ScanRun.ScanDepth.SAFE_STATIC : request.depth();
        if (depth == ScanRun.ScanDepth.CI_EVIDENCE) {
            throw new IllegalArgumentException("CI_EVIDENCE runs must use the CI upload endpoint");
        }
        if (!request.authorizationConfirmed()) {
            throw new IllegalArgumentException("Hosted scans require explicit repository, image, or URL authorization confirmation");
        }
        if (scanRunRepository.existsByProductProfileIdAndDepthAndStatusIn(
                product.getId(),
                depth,
                List.of(ScanRun.RunStatus.QUEUED, ScanRun.RunStatus.RUNNING)
        )) {
            throw new IllegalStateException("A scan at this depth is already queued or running for this product");
        }

        ScanSource source = resolveHostedSource(actor, product, workspace, request, depth);
        List<String> toolKeys = selectedToolKeys(request.toolKeys(), depth);
        validateToolKeys(toolKeys);
        ScanRun run = new ScanRun();
        run.setScanSource(source);
        run.setProductProfile(product);
        run.setWorkspace(workspace);
        run.setTriggerType(ScanRun.TriggerType.HOSTED_SCAN);
        run.setStatus(ScanRun.RunStatus.QUEUED);
        run.setDepth(depth);
        run.setRequestedBy(actor);
        run.setBranchRef(trimToNull(request.branchRef()));
        run.setRuntimeTargetUrl(resolveRuntimeTarget(product, source, request, depth));
        run.setContainerImageRef(trimToNull(request.containerImageRef()));
        run.setComparisonBaseRunId(request.comparisonBaseRunId());
        run.setScanPlan(scanPlan(depth, toolKeys, source, request.reason()));
        ScanRun savedRun = scanRunRepository.save(run);

        for (String toolKey : toolKeys) {
            ScannerProperties.ToolProperties tool = scannerProperties.tool(toolKey);
            ToolRun toolRun = new ToolRun();
            toolRun.setScanRun(savedRun);
            toolRun.setToolKey(toolKey);
            toolRun.setToolName(tool == null || isBlank(tool.getDisplayName()) ? toolKey : tool.getDisplayName());
            toolRun.setStatus(ToolRun.ToolStatus.QUEUED);
            toolRunRepository.save(toolRun);
        }

        ScannerJob job = new ScannerJob();
        job.setScanRun(savedRun);
        job.setStatus(ScannerJob.JobStatus.QUEUED);
        job.setMaxAttempts(Math.max(1, scannerProperties.getMaxAttempts()));
        job.setNextRunAt(LocalDateTime.now());
        scannerJobRepository.save(job);
        audit(actor, "SCANNER_HOSTED_SCAN_QUEUED", "SCAN_RUN", savedRun.getId(), AuditEvent.RiskLevel.MEDIUM,
                "Queued %s scan for product %s using tools %s".formatted(depth, product.getId(), toolKeys));
        return toScanRunResponse(savedRun, toolRunRepository.findByScanRunIdOrderByCreatedAtAsc(savedRun.getId()));
    }

    @Transactional
    public ScanRunResponse cancelScanRun(User actor, UUID runId, ScanCancelRequest request) {
        ScanRun run = scanRunRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("Scan run not found"));
        requireProductOrWorkspaceWrite(actor, run.getProductProfile(), run.getWorkspace());
        if (run.getStatus() == ScanRun.RunStatus.COMPLETED || run.getStatus() == ScanRun.RunStatus.FAILED || run.getStatus() == ScanRun.RunStatus.CANCELED) {
            return toScanRunResponse(run, toolRunRepository.findByScanRunIdOrderByCreatedAtAsc(runId));
        }
        run.setCancelRequested(true);
        run.setFailureSummary(trimToNull(request == null ? null : request.reason()));
        if (run.getStatus() == ScanRun.RunStatus.QUEUED) {
            run.setStatus(ScanRun.RunStatus.CANCELED);
            run.setCompletedAt(LocalDateTime.now());
            toolRunRepository.findByScanRunIdOrderByCreatedAtAsc(runId).forEach(tool -> {
                if (tool.getStatus() == ToolRun.ToolStatus.QUEUED) {
                    tool.setStatus(ToolRun.ToolStatus.CANCELED);
                    tool.setErrorSummary("Scan canceled before execution.");
                    tool.setCompletedAt(LocalDateTime.now());
                    toolRunRepository.save(tool);
                }
            });
            scannerJobRepository.findByScanRunId(runId).ifPresent(job -> {
                job.setStatus(ScannerJob.JobStatus.CANCELED);
                job.setCompletedAt(LocalDateTime.now());
                job.setFailureSummary("Scan canceled before execution.");
                scannerJobRepository.save(job);
            });
        }
        ScanRun saved = scanRunRepository.save(run);
        audit(actor, "SCANNER_SCAN_CANCELED", "SCAN_RUN", saved.getId(), AuditEvent.RiskLevel.MEDIUM,
                "Canceled scanner run for product " + saved.getProductProfile().getId());
        return toScanRunResponse(saved, toolRunRepository.findByScanRunIdOrderByCreatedAtAsc(runId));
    }

    @Transactional
    public ScanRunResponse rescan(User actor, UUID runId, RescanRequest request) {
        ScanRun previous = scanRunRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("Scan run not found"));
        requireProductOrWorkspaceWrite(actor, previous.getProductProfile(), previous.getWorkspace());
        StartHostedScanRequest start = new StartHostedScanRequest(
                previous.getProductProfile().getId(),
                previous.getWorkspace() == null ? null : previous.getWorkspace().getId(),
                previous.getScanSource().getId(),
                previous.getDepth(),
                request == null ? null : request.toolKeys(),
                previous.getBranchRef(),
                previous.getRuntimeTargetUrl(),
                previous.getContainerImageRef(),
                true,
                previous.getDepth() == ScanRun.ScanDepth.RUNTIME_BASELINE,
                defaultString(request == null ? null : request.reason(), "Rescan requested from previous run " + previous.getId()),
                previous.getId()
        );
        return startHostedScan(actor, start);
    }

    @Transactional(readOnly = true)
    public ScannerAdminHealthResponse adminHealth(User actor) {
        if (actor.getRole() != User.UserRole.ADMIN) {
            throw new AccessDeniedException("Scanner operations health is available to admins only");
        }
        List<ScannerJob> jobs = scannerJobRepository.findByStatusInOrderByCreatedAtAsc(List.of(ScannerJob.JobStatus.QUEUED, ScannerJob.JobStatus.RUNNING));
        List<ToolHealthResponse> tools = scannerProperties.getTools().entrySet().stream()
                .map(entry -> {
                    ScannerProperties.ToolProperties tool = entry.getValue();
                    String executable = firstCommandToken(tool.getCommand());
                    boolean available = tool.isEnabled() && executable != null && scannerProcessRunner.isExecutableAvailable(executable);
                    return new ToolHealthResponse(entry.getKey(), tool.getDisplayName(), tool.isEnabled(), executable, available, tool.getTargetType(), tool.isRequiresIac(), tool.getTimeoutSeconds());
                })
                .toList();
        return new ScannerAdminHealthResponse(
                scannerProperties.isWorkerEnabled(),
                scannerProperties.isSchedulerEnabled(),
                jobs.stream().filter(job -> job.getStatus() == ScannerJob.JobStatus.QUEUED).count(),
                jobs.stream().filter(job -> job.getStatus() == ScannerJob.JobStatus.RUNNING).count(),
                tools
        );
    }

    @Transactional(readOnly = true)
    public ProductScannerSummaryResponse getProductSummary(User actor, UUID productId) {
        ProductProfile product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product profile not found"));
        requireProductOwnerOrAdmin(actor, product);
        List<ScanSourceResponse> sources = sourceRepository.findByProductProfileIdOrderByCreatedAtDesc(productId).stream()
                .map(this::toSourceResponse)
                .toList();
        List<ScanRunResponse> runs = scanRunRepository.findByProductProfileIdOrderByCreatedAtDesc(productId).stream()
                .limit(8)
                .map(run -> toScanRunResponse(run, toolRunRepository.findByScanRunIdOrderByCreatedAtAsc(run.getId())))
                .toList();
        List<NormalizedFindingResponse> findings = findingRepository.findByProductProfileIdOrderBySeverityDescCreatedAtDesc(productId).stream()
                .limit(30)
                .map(this::toFindingResponse)
                .toList();
        List<ScannerEvidenceItemResponse> evidence = evidenceRepository.findByProductProfileIdOrderByCreatedAtDesc(productId).stream()
                .limit(20)
                .map(this::toEvidenceResponse)
                .toList();
        ScannerSummaryCounts counts = counts(findingRepository.findByProductProfileIdOrderBySeverityDescCreatedAtDesc(productId));
        return new ProductScannerSummaryResponse(
                toProductProfileResponse(product),
                readinessScore(counts),
                counts,
                sources,
                runs,
                findings,
                evidence
        );
    }

    @Transactional(readOnly = true)
    public ScanRunResponse getRun(User actor, UUID runId) {
        ScanRun run = scanRunRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("Scan run not found"));
        requireProductOrWorkspaceRead(actor, run.getProductProfile(), run.getWorkspace());
        return toScanRunResponse(run, toolRunRepository.findByScanRunIdOrderByCreatedAtAsc(runId));
    }

    @Transactional(readOnly = true)
    public List<ToolRunResponse> listToolRuns(User actor, UUID runId) {
        ScanRun run = scanRunRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("Scan run not found"));
        requireProductOrWorkspaceRead(actor, run.getProductProfile(), run.getWorkspace());
        return toolRunRepository.findByScanRunIdOrderByCreatedAtAsc(runId).stream()
                .map(this::toToolRunResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NormalizedFindingResponse> listRunFindings(User actor, UUID runId) {
        ScanRun run = scanRunRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("Scan run not found"));
        requireProductOrWorkspaceRead(actor, run.getProductProfile(), run.getWorkspace());
        return findingRepository.findByScanRunIdOrderBySeverityDescCreatedAtDesc(runId).stream()
                .map(this::toFindingResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public NormalizedFindingResponse getFinding(User actor, UUID findingId) {
        NormalizedFinding finding = findingRepository.findById(findingId)
                .orElseThrow(() -> new ResourceNotFoundException("Finding not found"));
        requireProductOrWorkspaceRead(actor, finding.getProductProfile(), finding.getWorkspace());
        return toFindingResponse(finding);
    }

    @Transactional
    public NormalizedFindingResponse updateFindingStatus(User actor, UUID findingId, FindingStatusRequest request) {
        NormalizedFinding finding = findingRepository.findById(findingId)
                .orElseThrow(() -> new ResourceNotFoundException("Finding not found"));
        requireProductOrWorkspaceWrite(actor, finding.getProductProfile(), finding.getWorkspace());
        NormalizedFinding.FindingStatus status = request.status();
        if (status == null) {
            throw new IllegalArgumentException("Finding status is required");
        }
        boolean riskDecision = status == NormalizedFinding.FindingStatus.ACCEPTED_RISK
                || status == NormalizedFinding.FindingStatus.FALSE_POSITIVE
                || status == NormalizedFinding.FindingStatus.INSUFFICIENT_EVIDENCE;
        if (riskDecision) {
            requireProductOwnerOrAdmin(actor, finding.getProductProfile());
        }
        if (status == NormalizedFinding.FindingStatus.ACCEPTED_RISK) {
            finding.setRiskAcceptanceReason(cleanRequired(request.reason(), "Risk acceptance reason is required"));
            if (request.reviewDueOn() == null) {
                throw new IllegalArgumentException("Risk review due date is required");
            }
            finding.setRiskReviewDueOn(request.reviewDueOn());
        } else if (status == NormalizedFinding.FindingStatus.RESOLVED) {
            finding.setRiskAcceptanceReason(cleanRequired(request.reason(), "Resolution evidence note is required"));
            finding.setRiskReviewDueOn(null);
        } else {
            finding.setRiskAcceptanceReason(trimToNull(request.reason()));
            finding.setRiskReviewDueOn(request.reviewDueOn());
        }
        finding.setStatus(status);
        finding.setReviewedBy(actor);
        finding.setReviewedAt(LocalDateTime.now());
        NormalizedFinding saved = findingRepository.save(finding);
        audit(actor, "SCANNER_FINDING_STATUS_CHANGED", "NORMALIZED_FINDING", saved.getId(), AuditEvent.RiskLevel.MEDIUM,
                "Changed finding status to " + saved.getStatus() + " for product " + saved.getProductProfile().getId());
        return toFindingResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ScannerEvidenceItemResponse> listEvidence(User actor, UUID productId, UUID workspaceId, UUID milestoneId, UUID findingId) {
        if (findingId != null) {
            NormalizedFinding finding = findingRepository.findById(findingId)
                    .orElseThrow(() -> new ResourceNotFoundException("Finding not found"));
            requireProductOrWorkspaceRead(actor, finding.getProductProfile(), finding.getWorkspace());
            return evidenceRepository.findByFindingIdOrderByCreatedAtDesc(findingId).stream().map(this::toEvidenceResponse).toList();
        }
        if (milestoneId != null) {
            Milestone milestone = milestoneRepository.findById(milestoneId)
                    .orElseThrow(() -> new ResourceNotFoundException("Milestone not found"));
            requireWorkspaceRead(actor, milestone.getWorkspace());
            return evidenceRepository.findByMilestoneIdOrderByCreatedAtDesc(milestoneId).stream().map(this::toEvidenceResponse).toList();
        }
        if (workspaceId != null) {
            ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
            requireWorkspaceRead(actor, workspace);
            return evidenceRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream().map(this::toEvidenceResponse).toList();
        }
        if (productId != null) {
            ProductProfile product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product profile not found"));
            requireProductOwnerOrAdmin(actor, product);
            return evidenceRepository.findByProductProfileIdOrderByCreatedAtDesc(productId).stream().map(this::toEvidenceResponse).toList();
        }
        throw new IllegalArgumentException("At least one evidence filter is required");
    }

    @Transactional
    public void markToolRunning(UUID toolRunId, String toolVersion) {
        ToolRun toolRun = toolRunRepository.findById(toolRunId)
                .orElseThrow(() -> new ResourceNotFoundException("Tool run not found"));
        toolRun.setStatus(ToolRun.ToolStatus.RUNNING);
        toolRun.setToolVersion(truncate(trimToNull(toolVersion), 255));
        toolRun.setStartedAt(LocalDateTime.now());
        toolRunRepository.save(toolRun);
    }

    @Transactional
    public void markToolFailed(UUID toolRunId, String error, Integer exitCode, Long durationMs, String logs) {
        ToolRun toolRun = toolRunRepository.findById(toolRunId)
                .orElseThrow(() -> new ResourceNotFoundException("Tool run not found"));
        toolRun.setStatus(ToolRun.ToolStatus.FAILED);
        toolRun.setCompletedAt(LocalDateTime.now());
        toolRun.setErrorSummary(safeScannerFailure(error));
        toolRun.setExitCode(exitCode);
        toolRun.setDurationMs(durationMs);
        toolRun.setLogExcerpt(truncate(redactScannerText(logs), 2000));
        toolRunRepository.save(toolRun);
        audit(toolRun.getScanRun().getRequestedBy(), "SCANNER_TOOL_FAILED", "TOOL_RUN", toolRun.getId(), AuditEvent.RiskLevel.HIGH,
                "%s failed for scan %s: %s".formatted(toolRun.getToolName(), toolRun.getScanRun().getId(), toolRun.getErrorSummary()));
    }

    @Transactional
    public void markToolSkipped(UUID toolRunId, String reason) {
        ToolRun toolRun = toolRunRepository.findById(toolRunId)
                .orElseThrow(() -> new ResourceNotFoundException("Tool run not found"));
        toolRun.setStatus(ToolRun.ToolStatus.SKIPPED);
        toolRun.setCompletedAt(LocalDateTime.now());
        toolRun.setErrorSummary(safeScannerFailure(reason));
        toolRunRepository.save(toolRun);
    }

    @Transactional
    public void markToolCanceled(UUID toolRunId, String reason) {
        ToolRun toolRun = toolRunRepository.findById(toolRunId)
                .orElseThrow(() -> new ResourceNotFoundException("Tool run not found"));
        toolRun.setStatus(ToolRun.ToolStatus.CANCELED);
        toolRun.setCompletedAt(LocalDateTime.now());
        toolRun.setErrorSummary(safeScannerFailure(reason));
        toolRunRepository.save(toolRun);
    }

    @Transactional
    public void recordToolOutput(
            User actor,
            UUID toolRunId,
            CiEvidenceFormat format,
            String artifactFileName,
            String payload,
            Integer exitCode,
            Long durationMs,
            String logExcerpt
    ) {
        ToolRun toolRun = toolRunRepository.findById(toolRunId)
                .orElseThrow(() -> new ResourceNotFoundException("Tool run not found"));
        ScanRun scanRun = toolRun.getScanRun();
        ProductProfile product = scanRun.getProductProfile();
        ProjectWorkspace workspace = scanRun.getWorkspace();
        String cleanPayload = defaultString(payload, "");
        if (cleanPayload.getBytes(StandardCharsets.UTF_8).length > MAX_EVIDENCE_PAYLOAD_BYTES) {
            throw new IllegalArgumentException("Scanner output exceeds the 2MB API upload limit");
        }

        String artifactName = defaultString(artifactFileName, defaultArtifactName(format));
        String storageKey = s3Service.generateFileKey("scanner/%s/%s".formatted(product.getId(), scanRun.getId()), artifactName);
        String artifactRef = s3Service.uploadFile(storageKey, cleanPayload.getBytes(StandardCharsets.UTF_8), contentTypeFor(format));
        List<ParsedFinding> parsedFindings = parseEvidencePayload(format, cleanPayload, toolRun.getToolName());
        int normalizedCount = 0;
        if (parsedFindings.isEmpty()) {
            ScannerEvidenceItem evidence = baseEvidence(actor, product, workspace, null, scanRun, toolRun);
            evidence.setTitle(toolRun.getToolName() + " completed");
            evidence.setSummary("The scanner completed without normalized findings.");
            evidence.setSource(toolRun.getToolName());
            evidence.setArtifactRef(artifactRef);
            evidence.setStorageKey(storageKey);
            evidenceRepository.save(evidence);
        } else {
            for (ParsedFinding parsed : parsedFindings) {
                NormalizedRecord normalized = normalizeFinding(parsed, toolRun.getToolName());
                ScannerEvidenceItem evidence = baseEvidence(actor, product, workspace, null, scanRun, toolRun);
                evidence.setTitle(normalized.title());
                evidence.setSummary(normalized.description());
                evidence.setSource(normalized.sourceTool());
                evidence.setArtifactRef(artifactRef);
                evidence.setStorageKey(storageKey);
                evidence.setRedactionStatus(normalized.redacted() ? ScannerEvidenceItem.RedactionStatus.REDACTED : ScannerEvidenceItem.RedactionStatus.NONE);
                evidence.setConfidenceLevel(confidenceFor(normalized.severity()));
                ScannerEvidenceItem savedEvidence = evidenceRepository.save(evidence);

                NormalizedFinding finding = new NormalizedFinding();
                finding.setProductProfile(product);
                finding.setWorkspace(workspace);
                finding.setScanRun(scanRun);
                finding.setToolRun(toolRun);
                finding.setFingerprint(fingerprint(product.getId(), normalized));
                finding.setSourceTool(normalized.sourceTool());
                finding.setSourceRuleId(normalized.ruleId());
                finding.setTitle(normalized.title());
                finding.setDescription(normalized.description());
                finding.setSeverity(normalized.severity());
                finding.setStatus(initialFindingStatus(scanRun, finding.getFingerprint()));
                finding.setAffectedComponent(normalized.affectedComponent());
                finding.setEvidenceItem(savedEvidence);
                finding.setRecommendedModule(recommendServiceModule(normalized));
                finding.setConfidenceBasis(normalized.confidenceBasis());
                NormalizedFinding savedFinding = findingRepository.save(finding);
                savedEvidence.setFinding(savedFinding);
                evidenceRepository.save(savedEvidence);
                normalizedCount++;
            }
        }

        toolRun.setRawArtifactRef(artifactRef);
        toolRun.setStorageKey(storageKey);
        toolRun.setExitCode(exitCode);
        toolRun.setDurationMs(durationMs);
        toolRun.setLogExcerpt(truncate(redactScannerText(logExcerpt), 2000));
        toolRun.setNormalizedCount(normalizedCount);
        toolRun.setStatus(ToolRun.ToolStatus.COMPLETED);
        toolRun.setCompletedAt(LocalDateTime.now());
        toolRunRepository.save(toolRun);
        audit(actor, "SCANNER_TOOL_COMPLETED", "TOOL_RUN", toolRun.getId(), AuditEvent.RiskLevel.MEDIUM,
                "%s completed for scan %s with %d normalized findings".formatted(toolRun.getToolName(), scanRun.getId(), normalizedCount));
    }

    @Transactional
    public void completeHostedScanRun(UUID runId) {
        ScanRun run = scanRunRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("Scan run not found"));
        List<ToolRun> tools = toolRunRepository.findByScanRunIdOrderByCreatedAtAsc(runId);
        boolean failed = tools.stream().anyMatch(tool -> tool.getStatus() == ToolRun.ToolStatus.FAILED);
        boolean canceled = run.isCancelRequested() || tools.stream().allMatch(tool -> tool.getStatus() == ToolRun.ToolStatus.CANCELED);
        if (canceled) {
            run.setStatus(ScanRun.RunStatus.CANCELED);
            run.setFailureSummary(defaultString(run.getFailureSummary(), "Scan canceled by request."));
        } else if (failed) {
            run.setStatus(ScanRun.RunStatus.FAILED);
            run.setFailureSummary(scannerFailureSummary(tools));
        } else {
            run.setStatus(ScanRun.RunStatus.COMPLETED);
            run.setFailureSummary(null);
        }
        run.setCompletedAt(LocalDateTime.now());
        scanRunRepository.save(run);
        audit(run.getRequestedBy(), "SCANNER_RUN_FINISHED", "SCAN_RUN", run.getId(), failed ? AuditEvent.RiskLevel.HIGH : AuditEvent.RiskLevel.MEDIUM,
                "Scanner run finished with status " + run.getStatus());
    }

    @Transactional
    public void failHostedScanRun(UUID runId, String failure) {
        ScanRun run = scanRunRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("Scan run not found"));
        run.setStatus(run.isCancelRequested() ? ScanRun.RunStatus.CANCELED : ScanRun.RunStatus.FAILED);
        run.setFailureSummary(safeScannerFailure(failure));
        run.setCompletedAt(LocalDateTime.now());
        scanRunRepository.save(run);
        audit(run.getRequestedBy(), "SCANNER_RUN_FAILED", "SCAN_RUN", run.getId(), AuditEvent.RiskLevel.HIGH,
                "Scanner run failed: " + run.getFailureSummary());
    }

    public String redactScannerText(String value) {
        return redact(value).value();
    }

    public String safeScannerFailure(Throwable ex) {
        return safeScannerFailure(ex == null ? null : ex.getMessage());
    }

    public String safeScannerFailure(String value) {
        return truncate(defaultString(redactScannerText(value), "Scanner execution failed"), 500);
    }

    private ScannerEvidenceItem baseEvidence(
            User actor,
            ProductProfile product,
            ProjectWorkspace workspace,
            Milestone milestone,
            ScanRun scanRun,
            ToolRun toolRun
    ) {
        ScannerEvidenceItem evidence = new ScannerEvidenceItem();
        evidence.setProductProfile(product);
        evidence.setWorkspace(workspace);
        evidence.setMilestone(milestone);
        evidence.setScanRun(scanRun);
        evidence.setToolRun(toolRun);
        evidence.setEvidenceType(ScannerEvidenceItem.EvidenceType.SCAN_RESULT);
        evidence.setConfidenceLevel(ScannerEvidenceItem.ConfidenceLevel.HIGH);
        evidence.setCreatedBy(actor);
        return evidence;
    }

    private List<ParsedFinding> parseEvidencePayload(CiEvidenceFormat format, String payload, String fallbackToolName) {
        if (format == CiEvidenceFormat.LOG) {
            return parseLog(payload, fallbackToolName);
        }
        try {
            JsonNode root = objectMapper.readTree(payload);
            if (format == CiEvidenceFormat.SARIF || root.has("runs")) {
                return parseSarif(root, fallbackToolName);
            }
            return parseGenericJson(root, fallbackToolName);
        } catch (Exception ex) {
            if (format == CiEvidenceFormat.JSON || format == CiEvidenceFormat.SARIF) {
                throw new IllegalArgumentException("Evidence payload is not valid " + format + " JSON");
            }
            return parseLog(payload, fallbackToolName);
        }
    }

    private List<ParsedFinding> parseSarif(JsonNode root, String fallbackToolName) {
        List<ParsedFinding> findings = new ArrayList<>();
        JsonNode runs = root.path("runs");
        if (!runs.isArray()) {
            return findings;
        }
        for (JsonNode run : runs) {
            String toolName = firstText(run.path("tool").path("driver"), "name", "fullName");
            String effectiveTool = defaultString(toolName, fallbackToolName);
            Map<String, String> ruleSeverity = sarifRuleSeverities(run.path("tool").path("driver").path("rules"));
            JsonNode results = run.path("results");
            if (!results.isArray()) {
                continue;
            }
            for (JsonNode result : results) {
                String ruleId = firstText(result, "ruleId", "ruleIndex");
                String message = firstText(result.path("message"), "text", "markdown");
                String title = defaultString(message, defaultString(ruleId, "Scanner finding"));
                String severityText = firstText(result.path("properties"), "security-severity", "severity", "problem.severity");
                if (isBlank(severityText) && ruleId != null) {
                    severityText = ruleSeverity.get(ruleId);
                }
                if (isBlank(severityText)) {
                    severityText = firstText(result, "level", "kind");
                }
                String affected = sarifLocation(result.path("locations"));
                findings.add(new ParsedFinding(
                        effectiveTool,
                        ruleId,
                        title,
                        defaultString(message, title),
                        severityText,
                        affected,
                        "SARIF result normalized from CI evidence"
                ));
            }
        }
        return findings;
    }

    private Map<String, String> sarifRuleSeverities(JsonNode rules) {
        java.util.HashMap<String, String> severities = new java.util.HashMap<>();
        if (!rules.isArray()) {
            return severities;
        }
        for (JsonNode rule : rules) {
            String id = firstText(rule, "id", "name");
            String severity = firstText(rule.path("properties"), "security-severity", "severity", "problem.severity");
            if (!isBlank(id) && !isBlank(severity)) {
                severities.put(id, severity);
            }
        }
        return severities;
    }

    private String sarifLocation(JsonNode locations) {
        if (!locations.isArray() || locations.isEmpty()) {
            return null;
        }
        JsonNode physical = locations.get(0).path("physicalLocation");
        String uri = firstText(physical.path("artifactLocation"), "uri", "uriBaseId");
        int line = physical.path("region").path("startLine").asInt(0);
        if (isBlank(uri)) {
            return null;
        }
        return line > 0 ? uri + ":" + line : uri;
    }

    private List<ParsedFinding> parseGenericJson(JsonNode root, String fallbackToolName) {
        List<ParsedFinding> toolSpecific = parseToolSpecificJson(root, fallbackToolName);
        if (!toolSpecific.isEmpty()) {
            return toolSpecific;
        }
        JsonNode findingsNode = root.isArray()
                ? root
                : firstArray(root, "findings", "issues", "results", "vulnerabilities", "alerts");
        List<ParsedFinding> findings = new ArrayList<>();
        if (!findingsNode.isArray()) {
            return findings;
        }
        for (JsonNode node : findingsNode) {
            String ruleId = firstText(node, "ruleId", "rule", "id", "code", "check_id", "cve");
            String title = firstText(node, "title", "name", "message", "summary");
            String description = firstText(node, "description", "details", "body", "message", "summary");
            String severity = firstText(node, "severity", "level", "priority", "risk");
            String affected = firstText(node, "affectedComponent", "component", "path", "file", "package", "resource");
            findings.add(new ParsedFinding(
                    fallbackToolName,
                    ruleId,
                    defaultString(title, defaultString(ruleId, "Scanner finding")),
                    defaultString(description, defaultString(title, "Scanner finding")),
                    severity,
                    affected,
                    "JSON result normalized from CI evidence"
            ));
        }
        return findings;
    }

    private List<ParsedFinding> parseToolSpecificJson(JsonNode root, String fallbackToolName) {
        String tool = defaultString(fallbackToolName, "").toLowerCase(Locale.ROOT);
        if (tool.contains("gitleaks")) {
            return parseGitleaks(root, fallbackToolName);
        }
        if (tool.contains("semgrep")) {
            return parseSemgrep(root, fallbackToolName);
        }
        if (tool.contains("osv")) {
            return parseOsv(root, fallbackToolName);
        }
        if (tool.contains("trivy")) {
            return parseTrivy(root, fallbackToolName);
        }
        if (tool.contains("checkov")) {
            return parseCheckov(root, fallbackToolName);
        }
        if (tool.contains("grype")) {
            return parseGrype(root, fallbackToolName);
        }
        if (tool.contains("lighthouse")) {
            return parseLighthouse(root, fallbackToolName);
        }
        if (tool.contains("zap")) {
            return parseZap(root, fallbackToolName);
        }
        return List.of();
    }

    private List<ParsedFinding> parseGitleaks(JsonNode root, String toolName) {
        JsonNode array = root.isArray() ? root : firstArray(root, "findings", "leaks", "results");
        List<ParsedFinding> findings = new ArrayList<>();
        if (!array.isArray()) return findings;
        for (JsonNode node : array) {
            String file = firstText(node, "File", "file", "Path", "path");
            String line = firstText(node, "StartLine", "line");
            findings.add(new ParsedFinding(
                    toolName,
                    firstText(node, "RuleID", "ruleId", "rule"),
                    defaultString(firstText(node, "Description", "description"), "Potential secret detected"),
                    defaultString(firstText(node, "Description", "description", "Secret", "secret"), "Gitleaks detected a potential secret."),
                    "high",
                    location(file, line),
                    "Gitleaks secret detection"
            ));
        }
        return findings;
    }

    private List<ParsedFinding> parseSemgrep(JsonNode root, String toolName) {
        JsonNode results = firstArray(root, "results");
        List<ParsedFinding> findings = new ArrayList<>();
        if (!results.isArray()) return findings;
        for (JsonNode node : results) {
            JsonNode extra = node.path("extra");
            String message = firstText(extra, "message", "metadata");
            String severity = firstText(extra, "severity");
            String path = firstText(node, "path");
            String line = firstText(node.path("start"), "line");
            findings.add(new ParsedFinding(
                    toolName,
                    firstText(node, "check_id", "ruleId"),
                    defaultString(message, defaultString(firstText(node, "check_id"), "Semgrep finding")),
                    defaultString(message, "Semgrep static analysis finding."),
                    severity,
                    location(path, line),
                    "Semgrep static analysis result"
            ));
        }
        return findings;
    }

    private List<ParsedFinding> parseOsv(JsonNode root, String toolName) {
        List<ParsedFinding> findings = new ArrayList<>();
        JsonNode results = firstArray(root, "results");
        if (!results.isArray()) return findings;
        for (JsonNode result : results) {
            JsonNode packages = firstArray(result, "packages");
            for (JsonNode pkg : packages) {
                String packageName = firstText(pkg.path("package"), "name", "version");
                JsonNode vulnerabilities = firstArray(pkg, "vulnerabilities");
                for (JsonNode vuln : vulnerabilities) {
                    String id = firstText(vuln, "id", "aliases");
                    String summary = firstText(vuln, "summary", "details");
                    findings.add(new ParsedFinding(
                            toolName,
                            id,
                            defaultString(summary, defaultString(id, "Dependency vulnerability")),
                            defaultString(firstText(vuln, "details", "summary"), "OSV reported a dependency vulnerability."),
                            firstText(vuln.path("database_specific"), "severity"),
                            packageName,
                            "OSV vulnerability database match"
                    ));
                }
            }
        }
        return findings;
    }

    private List<ParsedFinding> parseTrivy(JsonNode root, String toolName) {
        List<ParsedFinding> findings = new ArrayList<>();
        JsonNode results = firstArray(root, "Results");
        if (!results.isArray()) return findings;
        for (JsonNode result : results) {
            String target = firstText(result, "Target", "Class", "Type");
            for (JsonNode vuln : firstArray(result, "Vulnerabilities")) {
                findings.add(new ParsedFinding(
                        toolName,
                        firstText(vuln, "VulnerabilityID", "PkgID"),
                        defaultString(firstText(vuln, "Title"), defaultString(firstText(vuln, "VulnerabilityID"), "Vulnerability detected")),
                        defaultString(firstText(vuln, "Description", "Title"), "Trivy reported a vulnerability."),
                        firstText(vuln, "Severity"),
                        defaultString(firstText(vuln, "PkgName"), target),
                        "Trivy vulnerability result"
                ));
            }
            for (JsonNode misconfig : firstArray(result, "Misconfigurations")) {
                findings.add(new ParsedFinding(
                        toolName,
                        firstText(misconfig, "ID", "AVDID"),
                        defaultString(firstText(misconfig, "Title"), "Configuration misconfiguration"),
                        defaultString(firstText(misconfig, "Description", "Message", "Resolution"), "Trivy reported a misconfiguration."),
                        firstText(misconfig, "Severity"),
                        defaultString(firstText(misconfig, "CauseMetadata"), target),
                        "Trivy misconfiguration result"
                ));
            }
            for (JsonNode secret : firstArray(result, "Secrets")) {
                findings.add(new ParsedFinding(
                        toolName,
                        firstText(secret, "RuleID", "Category"),
                        defaultString(firstText(secret, "Title"), "Secret detected"),
                        defaultString(firstText(secret, "Match", "Title"), "Trivy reported a secret."),
                        firstText(secret, "Severity"),
                        target,
                        "Trivy secret result"
                ));
            }
        }
        return findings;
    }

    private List<ParsedFinding> parseCheckov(JsonNode root, String toolName) {
        JsonNode failed = root.path("results").path("failed_checks");
        if (!failed.isArray()) {
            failed = firstArray(root, "failed_checks");
        }
        List<ParsedFinding> findings = new ArrayList<>();
        if (!failed.isArray()) return findings;
        for (JsonNode node : failed) {
            findings.add(new ParsedFinding(
                    toolName,
                    firstText(node, "check_id", "bc_check_id"),
                    defaultString(firstText(node, "check_name"), "IaC policy failure"),
                    defaultString(firstText(node, "guideline", "check_name"), "Checkov reported an IaC policy failure."),
                    firstText(node, "severity"),
                    location(firstText(node, "file_path"), firstText(node, "file_line_range")),
                    "Checkov IaC policy result"
            ));
        }
        return findings;
    }

    private List<ParsedFinding> parseGrype(JsonNode root, String toolName) {
        JsonNode matches = firstArray(root, "matches");
        List<ParsedFinding> findings = new ArrayList<>();
        if (!matches.isArray()) return findings;
        for (JsonNode match : matches) {
            JsonNode vuln = match.path("vulnerability");
            JsonNode artifact = match.path("artifact");
            findings.add(new ParsedFinding(
                    toolName,
                    firstText(vuln, "id"),
                    defaultString(firstText(vuln, "id"), "SBOM vulnerability"),
                    defaultString(firstText(vuln, "description"), "Grype reported an SBOM or image vulnerability."),
                    firstText(vuln, "severity"),
                    firstText(artifact, "name", "version", "type"),
                    "Grype vulnerability match"
            ));
        }
        return findings;
    }

    private List<ParsedFinding> parseLighthouse(JsonNode root, String toolName) {
        List<ParsedFinding> findings = new ArrayList<>();
        JsonNode categories = root.path("categories");
        categories.fields().forEachRemaining(entry -> {
            JsonNode category = entry.getValue();
            double score = category.path("score").asDouble(1.0);
            if (score < 0.8) {
                findings.add(new ParsedFinding(
                        toolName,
                        "lighthouse-" + entry.getKey(),
                        defaultString(firstText(category, "title"), "Lighthouse score below threshold"),
                        "Lighthouse category score is " + Math.round(score * 100) + "/100.",
                        score < 0.5 ? "high" : "medium",
                        entry.getKey(),
                        "Lighthouse web quality audit"
                ));
            }
        });
        return findings;
    }

    private List<ParsedFinding> parseZap(JsonNode root, String toolName) {
        List<ParsedFinding> findings = new ArrayList<>();
        JsonNode sites = firstArray(root, "site", "sites");
        if (!sites.isArray()) return findings;
        for (JsonNode site : sites) {
            JsonNode alerts = firstArray(site, "alerts");
            for (JsonNode alert : alerts) {
                findings.add(new ParsedFinding(
                        toolName,
                        firstText(alert, "pluginid", "alertRef"),
                        defaultString(firstText(alert, "alert", "name"), "Runtime security alert"),
                        defaultString(firstText(alert, "desc", "description", "solution"), "ZAP baseline reported an alert."),
                        firstText(alert, "riskdesc", "riskcode", "confidence"),
                        firstText(site, "name", "@name"),
                        "OWASP ZAP baseline alert"
                ));
            }
        }
        return findings;
    }

    private String location(String file, String line) {
        if (isBlank(file)) {
            return null;
        }
        if (isBlank(line)) {
            return file;
        }
        String normalized = line.replace("[", "").replace("]", "").split(",")[0].trim();
        return normalized.isBlank() ? file : file + ":" + normalized;
    }

    private List<ParsedFinding> parseLog(String payload, String fallbackToolName) {
        List<ParsedFinding> findings = new ArrayList<>();
        String[] lines = payload.split("\\R");
        for (int i = 0; i < lines.length && findings.size() < 50; i++) {
            String line = lines[i].trim();
            if (line.length() < 8) {
                continue;
            }
            String lower = line.toLowerCase(Locale.ROOT);
            if (lower.contains("critical") || lower.contains("error") || lower.contains("warning") || lower.contains("failed")) {
                findings.add(new ParsedFinding(
                        fallbackToolName,
                        "log-line-" + (i + 1),
                        truncate(line, 160),
                        line,
                        lower.contains("critical") ? "critical" : lower.contains("error") || lower.contains("failed") ? "high" : "medium",
                        "line " + (i + 1),
                        "Log evidence normalized from CI output"
                ));
            }
        }
        return findings;
    }

    private NormalizedRecord normalizeFinding(ParsedFinding parsed, String fallbackToolName) {
        Redaction title = redact(defaultString(parsed.title(), "Scanner finding"));
        Redaction description = redact(defaultString(parsed.description(), parsed.title()));
        Redaction component = redact(parsed.affectedComponent());
        NormalizedFinding.FindingSeverity severity = normalizeSeverity(parsed.severity());
        String sourceTool = defaultString(parsed.sourceTool(), fallbackToolName);
        String confidenceBasis = "%s. Severity=%s. Component=%s".formatted(
                defaultString(parsed.confidenceBasis(), "Normalized scanner result"),
                severity,
                defaultString(component.value(), "not supplied")
        );
        return new NormalizedRecord(
                sourceTool,
                trimToNull(parsed.ruleId()),
                truncate(title.value(), 255),
                description.value(),
                severity,
                truncate(component.value(), 1000),
                confidenceBasis,
                title.redacted() || description.redacted() || component.redacted()
        );
    }

    private NormalizedFinding.FindingSeverity normalizeSeverity(String raw) {
        if (isBlank(raw)) {
            return NormalizedFinding.FindingSeverity.INFO;
        }
        String value = raw.toLowerCase(Locale.ROOT);
        if (value.matches("\\d+(\\.\\d+)?")) {
            double score = Double.parseDouble(value);
            if (score >= 9) return NormalizedFinding.FindingSeverity.CRITICAL;
            if (score >= 7) return NormalizedFinding.FindingSeverity.HIGH;
            if (score >= 4) return NormalizedFinding.FindingSeverity.MEDIUM;
            if (score > 0) return NormalizedFinding.FindingSeverity.LOW;
            return NormalizedFinding.FindingSeverity.INFO;
        }
        if (value.contains("critical") || value.equals("blocker")) return NormalizedFinding.FindingSeverity.CRITICAL;
        if (value.contains("high") || value.equals("error") || value.equals("failed") || value.equals("failure")) return NormalizedFinding.FindingSeverity.HIGH;
        if (value.contains("medium") || value.equals("warning") || value.equals("warn") || value.equals("major")) return NormalizedFinding.FindingSeverity.MEDIUM;
        if (value.contains("low") || value.equals("note") || value.equals("minor")) return NormalizedFinding.FindingSeverity.LOW;
        return NormalizedFinding.FindingSeverity.INFO;
    }

    private ServiceModule recommendServiceModule(NormalizedRecord finding) {
        String haystack = (finding.title() + " " + finding.description() + " " + defaultString(finding.affectedComponent(), "") + " " + defaultString(finding.ruleId(), "")).toLowerCase(Locale.ROOT);
        List<String> candidates;
        if (haystack.contains("secret") || haystack.contains("token") || haystack.contains("password") || haystack.contains("key")) {
            candidates = List.of("api-security-review", "auth-access-control-review", "security.secrets_scan", "security.dependency_review");
        } else if (haystack.contains("cve") || haystack.contains("dependency") || haystack.contains("vulnerab") || haystack.contains("package")) {
            candidates = List.of("api-security-review", "security.dependency_review", "dependency-review");
        } else if (haystack.contains("docker") || haystack.contains("container") || haystack.contains("kubernetes") || haystack.contains("terraform") || haystack.contains("iac")) {
            candidates = List.of("cloud-deployment", "ci-cd-setup", "cloud.devops");
        } else if (haystack.contains("coverage") || haystack.contains("test")) {
            candidates = List.of("test-coverage-boost", "quality.testing");
        } else if (haystack.contains("performance") || haystack.contains("latency") || haystack.contains("load")) {
            candidates = List.of("performance-audit", "scaling.performance");
        } else if (haystack.contains("database") || haystack.contains("backup") || haystack.contains("query")) {
            candidates = List.of("database-redesign", "backup-restore", "database");
        } else {
            candidates = List.of("launch-readiness", "validation.readiness");
        }
        for (String candidate : candidates) {
            Optional<ServiceModule> bySlug = moduleRepository.findBySlug(candidate);
            if (bySlug.isPresent()) {
                return bySlug.get();
            }
            Optional<ServiceModule> byStableCode = moduleRepository.findByStableCode(candidate);
            if (byStableCode.isPresent()) {
                return byStableCode.get();
            }
        }
        return null;
    }

    private ScannerEvidenceItem.ConfidenceLevel confidenceFor(NormalizedFinding.FindingSeverity severity) {
        return switch (severity) {
            case CRITICAL, HIGH -> ScannerEvidenceItem.ConfidenceLevel.HIGH;
            case MEDIUM -> ScannerEvidenceItem.ConfidenceLevel.MEDIUM;
            case LOW, INFO -> ScannerEvidenceItem.ConfidenceLevel.LOW;
        };
    }

    private String fingerprint(UUID productId, NormalizedRecord finding) {
        String input = productId + "|" + finding.sourceTool() + "|" + defaultString(finding.ruleId(), "") + "|" +
                defaultString(finding.affectedComponent(), "") + "|" + finding.title().toLowerCase(Locale.ROOT);
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to fingerprint scanner finding", ex);
        }
    }

    private ScanSource resolveOrCreateUploadSource(User actor, ProductProfile product, ProjectWorkspace workspace, UUID sourceId) {
        if (sourceId != null) {
            ScanSource source = sourceRepository.findById(sourceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Scan source not found"));
            if (!source.getProductProfile().getId().equals(product.getId())) {
                throw new IllegalArgumentException("Scan source belongs to another product");
            }
            if (workspace != null && source.getWorkspace() != null && !source.getWorkspace().getId().equals(workspace.getId())) {
                throw new IllegalArgumentException("Scan source belongs to another workspace");
            }
            return source;
        }
        return sourceRepository.findFirstByProductProfileIdAndProviderTypeOrderByCreatedAtDesc(product.getId(), ScanSource.ProviderType.CI_UPLOAD)
                .orElseGet(() -> {
                    ScanSource source = new ScanSource();
                    source.setOwner(product.getOwner());
                    source.setProductProfile(product);
                    source.setWorkspace(workspace);
                    source.setProviderType(ScanSource.ProviderType.CI_UPLOAD);
                    source.setDisplayName("CI evidence upload");
                    source.setAuthorizationStatus(ScanSource.AuthorizationStatus.AUTHORIZED);
                    source.setScopeNote("Created automatically for CI artifact imports and manually uploaded scan evidence.");
                    source.setCreatedBy(actor);
                    return sourceRepository.save(source);
                });
    }

    private ScanSource resolveHostedSource(User actor, ProductProfile product, ProjectWorkspace workspace, StartHostedScanRequest request, ScanRun.ScanDepth depth) {
        if (request.sourceId() != null) {
            ScanSource source = sourceRepository.findById(request.sourceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Scan source not found"));
            if (!source.getProductProfile().getId().equals(product.getId())) {
                throw new IllegalArgumentException("Scan source belongs to another product");
            }
            if (source.getAuthorizationStatus() != ScanSource.AuthorizationStatus.AUTHORIZED) {
                throw new IllegalArgumentException("Scan source must be authorized before hosted execution");
            }
            return source;
        }
        if (depth == ScanRun.ScanDepth.RUNTIME_BASELINE) {
            String target = trimToNull(request.runtimeTargetUrl());
            if (isBlank(target)) {
                target = trimToNull(product.getProductUrl());
            }
            if (isBlank(target)) {
                throw new IllegalArgumentException("Runtime scan requires an authorized product URL");
            }
            ScanSource source = new ScanSource();
            source.setOwner(product.getOwner());
            source.setProductProfile(product);
            source.setWorkspace(workspace);
            source.setProviderType(ScanSource.ProviderType.RUNTIME_URL);
            source.setDisplayName("Authorized runtime URL");
            source.setExternalReference(target);
            source.setAuthorizationStatus(ScanSource.AuthorizationStatus.AUTHORIZED);
            source.setScopeNote("Runtime URL authorized by " + actor.getEmail());
            source.setCreatedBy(actor);
            return sourceRepository.save(source);
        }
        if (depth == ScanRun.ScanDepth.DEPENDENCY_CONTAINER) {
            if (isBlank(request.containerImageRef())) {
                throw new IllegalArgumentException("Dependency/container scan requires a container image reference");
            }
            ScanSource source = new ScanSource();
            source.setOwner(product.getOwner());
            source.setProductProfile(product);
            source.setWorkspace(workspace);
            source.setProviderType(ScanSource.ProviderType.EXTERNAL_TOOL);
            source.setDisplayName("Container image source");
            source.setExternalReference(request.containerImageRef());
            source.setAuthorizationStatus(ScanSource.AuthorizationStatus.AUTHORIZED);
            source.setScopeNote("Container image authorized for dependency and SBOM scanning.");
            source.setCreatedBy(actor);
            return sourceRepository.save(source);
        }
        String repo = trimToNull(product.getRepositoryUrl());
        if (isBlank(repo)) {
            throw new IllegalArgumentException("Hosted static scan requires a repository source or product repository URL");
        }
        ScanSource source = new ScanSource();
        source.setOwner(product.getOwner());
        source.setProductProfile(product);
        source.setWorkspace(workspace);
        source.setProviderType(repo.toLowerCase(Locale.ROOT).contains("gitlab") ? ScanSource.ProviderType.GITLAB : ScanSource.ProviderType.GITHUB);
        source.setDisplayName("Product repository");
        source.setExternalReference(repo);
        source.setAuthorizationStatus(ScanSource.AuthorizationStatus.AUTHORIZED);
        source.setScopeNote("Repository authorized for safe static scanner execution.");
        source.setCreatedBy(actor);
        return sourceRepository.save(source);
    }

    private List<String> selectedToolKeys(List<String> requested, ScanRun.ScanDepth depth) {
        List<String> defaults = switch (depth) {
            case SAFE_STATIC -> List.of("gitleaks", "osv-scanner", "semgrep", "trivy-fs", "checkov");
            case DEPENDENCY_CONTAINER -> List.of("syft", "grype", "trivy-image");
            case RUNTIME_BASELINE -> List.of("lighthouse", "zap-baseline");
            case DEEP_REVIEW -> List.of("gitleaks", "osv-scanner", "semgrep", "trivy-fs", "checkov", "syft", "grype");
            case CI_EVIDENCE -> List.of();
        };
        List<String> keys = requested == null || requested.isEmpty() ? defaults : requested;
        return keys.stream()
                .filter(key -> key != null && !key.isBlank())
                .map(key -> key.trim().toLowerCase(Locale.ROOT))
                .distinct()
                .toList();
    }

    private void validateToolKeys(List<String> toolKeys) {
        if (toolKeys.isEmpty()) {
            throw new IllegalArgumentException("At least one scanner tool is required");
        }
        Set<String> known = scannerProperties.getTools().keySet();
        List<String> unknown = toolKeys.stream().filter(key -> !known.contains(key)).toList();
        if (!unknown.isEmpty()) {
            throw new IllegalArgumentException("Unsupported scanner tools: " + unknown);
        }
    }

    private String resolveRuntimeTarget(ProductProfile product, ScanSource source, StartHostedScanRequest request, ScanRun.ScanDepth depth) {
        if (depth != ScanRun.ScanDepth.RUNTIME_BASELINE) {
            return null;
        }
        if (!request.runtimeAuthorizationConfirmed()) {
            throw new IllegalArgumentException("Runtime baseline scan requires explicit URL/domain authorization");
        }
        String target = trimToNull(request.runtimeTargetUrl());
        if (isBlank(target)) {
            target = trimToNull(source.getExternalReference());
        }
        if (isBlank(target)) {
            target = trimToNull(product.getProductUrl());
        }
        if (isBlank(target) || !(target.startsWith("https://") || target.startsWith("http://"))) {
            throw new IllegalArgumentException("Runtime baseline scan requires an http(s) URL");
        }
        return target;
    }

    private String scanPlan(ScanRun.ScanDepth depth, List<String> toolKeys, ScanSource source, String reason) {
        Map<String, Object> plan = new LinkedHashMap<>();
        plan.put("depth", depth.name());
        plan.put("toolKeys", toolKeys);
        plan.put("sourceType", source.getProviderType().name());
        plan.put("source", source.getDisplayName());
        plan.put("reason", trimToNull(reason));
        try {
            return objectMapper.writeValueAsString(plan);
        } catch (Exception ex) {
            return "depth=%s tools=%s source=%s".formatted(depth, toolKeys, source.getDisplayName());
        }
    }

    private NormalizedFinding.FindingStatus initialFindingStatus(ScanRun scanRun, String fingerprint) {
        if (scanRun.getComparisonBaseRunId() == null) {
            return NormalizedFinding.FindingStatus.OPEN;
        }
        Optional<NormalizedFinding> previous = findingRepository.findByScanRunIdOrderBySeverityDescCreatedAtDesc(scanRun.getComparisonBaseRunId()).stream()
                .filter(finding -> finding.getFingerprint().equals(fingerprint))
                .findFirst();
        if (previous.isEmpty()) {
            return NormalizedFinding.FindingStatus.NEW;
        }
        if (previous.get().getStatus() == NormalizedFinding.FindingStatus.RESOLVED) {
            return NormalizedFinding.FindingStatus.REGRESSED;
        }
        return NormalizedFinding.FindingStatus.OPEN;
    }

    private String scannerFailureSummary(List<ToolRun> tools) {
        List<String> failed = tools.stream()
                .filter(tool -> tool.getStatus() == ToolRun.ToolStatus.FAILED)
                .map(tool -> tool.getToolName() + ": " + defaultString(tool.getErrorSummary(), "failed"))
                .toList();
        return truncate(String.join("; ", failed), 500);
    }

    private String firstCommandToken(String command) {
        return scannerProcessRunner.renderCommand(command, Map.of()).stream().findFirst().orElse(null);
    }

    private ProjectWorkspace resolveWorkspace(UUID workspaceId, ProductProfile product) {
        if (workspaceId == null) {
            return null;
        }
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        if (!workspace.getPackageInstance().getProductProfile().getId().equals(product.getId())) {
            throw new IllegalArgumentException("Workspace belongs to another product");
        }
        return workspace;
    }

    private Milestone resolveMilestone(UUID milestoneId, ProjectWorkspace workspace) {
        if (milestoneId == null) {
            return null;
        }
        if (workspace == null) {
            throw new IllegalArgumentException("workspaceId is required when attaching evidence to a milestone");
        }
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found"));
        if (!milestone.getWorkspace().getId().equals(workspace.getId())) {
            throw new IllegalArgumentException("Milestone belongs to another workspace");
        }
        return milestone;
    }

    private void requireProductOwnerOrAdmin(User actor, ProductProfile product) {
        if (actor.getRole() == User.UserRole.ADMIN || product.getOwner().getId().equals(actor.getId())) {
            return;
        }
        throw new AccessDeniedException("Product scanner records are private to the owner");
    }

    private void requireProductOrWorkspaceRead(User actor, ProductProfile product, ProjectWorkspace workspace) {
        if (actor.getRole() == User.UserRole.ADMIN || product.getOwner().getId().equals(actor.getId())) {
            return;
        }
        if (workspace != null && participantRepository.existsByWorkspaceIdAndUserIdAndActiveTrue(workspace.getId(), actor.getId())) {
            return;
        }
        throw new AccessDeniedException("Scanner records are not available to this user");
    }

    private void requireProductOrWorkspaceWrite(User actor, ProductProfile product, ProjectWorkspace workspace) {
        if (actor.getRole() == User.UserRole.ADMIN || product.getOwner().getId().equals(actor.getId())) {
            return;
        }
        if (workspace != null) {
            Optional<WorkspaceParticipant> participant = participantRepository.findByWorkspaceIdAndUserIdAndActiveTrue(workspace.getId(), actor.getId());
            if (participant.isPresent() && participant.get().getRole() != WorkspaceParticipant.ParticipantRole.VIEWER) {
                return;
            }
        }
        throw new AccessDeniedException("Scanner records cannot be changed by this user");
    }

    private void requireWorkspaceRead(User actor, ProjectWorkspace workspace) {
        if (actor.getRole() == User.UserRole.ADMIN || workspace.getOwner().getId().equals(actor.getId())
                || participantRepository.existsByWorkspaceIdAndUserIdAndActiveTrue(workspace.getId(), actor.getId())) {
            return;
        }
        throw new AccessDeniedException("Workspace scanner records are not available to this user");
    }

    private ScannerSummaryCounts counts(List<NormalizedFinding> findings) {
        long open = findings.stream().filter(finding -> finding.getStatus() == NormalizedFinding.FindingStatus.OPEN
                || finding.getStatus() == NormalizedFinding.FindingStatus.NEW
                || finding.getStatus() == NormalizedFinding.FindingStatus.REGRESSED).count();
        return new ScannerSummaryCounts(
                findings.size(),
                open,
                findings.stream().filter(finding -> finding.getStatus() == NormalizedFinding.FindingStatus.RESOLVED).count(),
                findings.stream().filter(finding -> finding.getStatus() == NormalizedFinding.FindingStatus.ACCEPTED_RISK).count(),
                findings.stream().filter(finding -> finding.getSeverity() == NormalizedFinding.FindingSeverity.CRITICAL).count(),
                findings.stream().filter(finding -> finding.getSeverity() == NormalizedFinding.FindingSeverity.HIGH).count(),
                findings.stream().filter(finding -> finding.getSeverity() == NormalizedFinding.FindingSeverity.MEDIUM).count(),
                findings.stream().filter(finding -> finding.getSeverity() == NormalizedFinding.FindingSeverity.LOW).count(),
                findings.stream().filter(finding -> finding.getSeverity() == NormalizedFinding.FindingSeverity.INFO).count()
        );
    }

    private int readinessScore(ScannerSummaryCounts counts) {
        long penalty = counts.critical() * 18 + counts.high() * 10 + counts.medium() * 5 + counts.low() * 2;
        long resolvedCredit = Math.min(12, counts.resolved() * 2);
        return (int) Math.max(0, Math.min(100, 100 - penalty + resolvedCredit));
    }

    private ScanSourceResponse toSourceResponse(ScanSource source) {
        return new ScanSourceResponse(
                source.getId(),
                source.getCreatedAt(),
                source.getUpdatedAt(),
                source.getProductProfile().getId(),
                source.getWorkspace() == null ? null : source.getWorkspace().getId(),
                source.getProviderType(),
                source.getDisplayName(),
                source.getExternalReference(),
                source.getAuthorizationStatus(),
                source.getScopeNote(),
                source.getCreatedBy().getEmail()
        );
    }

    private ScanRunResponse toScanRunResponse(ScanRun run, List<ToolRun> toolRuns) {
        return new ScanRunResponse(
                run.getId(),
                run.getCreatedAt(),
                run.getUpdatedAt(),
                run.getScanSource().getId(),
                run.getProductProfile().getId(),
                run.getWorkspace() == null ? null : run.getWorkspace().getId(),
                run.getTriggerType(),
                run.getStatus(),
                run.getDepth(),
                run.getStartedAt(),
                run.getCompletedAt(),
                run.getRequestedBy().getEmail(),
                run.getFailureSummary(),
                run.isCancelRequested(),
                run.getScanPlan(),
                run.getBranchRef(),
                run.getRuntimeTargetUrl(),
                run.getContainerImageRef(),
                run.getComparisonBaseRunId(),
                toolRuns.stream().map(this::toToolRunResponse).toList()
        );
    }

    private ToolRunResponse toToolRunResponse(ToolRun toolRun) {
        return new ToolRunResponse(
                toolRun.getId(),
                toolRun.getCreatedAt(),
                toolRun.getUpdatedAt(),
                toolRun.getScanRun().getId(),
                toolRun.getToolName(),
                toolRun.getToolKey(),
                toolRun.getToolVersion(),
                toolRun.getStatus(),
                toolRun.getStartedAt(),
                toolRun.getCompletedAt(),
                toolRun.getRawArtifactRef(),
                toolRun.getStorageKey(),
                toolRun.getNormalizedCount(),
                toolRun.getErrorSummary(),
                toolRun.getExitCode(),
                toolRun.getDurationMs(),
                toolRun.getLogExcerpt()
        );
    }

    private NormalizedFindingResponse toFindingResponse(NormalizedFinding finding) {
        return new NormalizedFindingResponse(
                finding.getId(),
                finding.getCreatedAt(),
                finding.getUpdatedAt(),
                finding.getProductProfile().getId(),
                finding.getWorkspace() == null ? null : finding.getWorkspace().getId(),
                finding.getScanRun().getId(),
                finding.getToolRun().getId(),
                finding.getFingerprint(),
                finding.getSourceTool(),
                finding.getSourceRuleId(),
                finding.getTitle(),
                finding.getDescription(),
                finding.getSeverity(),
                finding.getStatus(),
                finding.getAffectedComponent(),
                finding.getEvidenceItem() == null ? null : finding.getEvidenceItem().getId(),
                toServiceModuleResponse(finding.getRecommendedModule()),
                finding.getConfidenceBasis(),
                finding.getRiskAcceptanceReason(),
                finding.getRiskReviewDueOn(),
                finding.getReviewedBy() == null ? null : finding.getReviewedBy().getEmail(),
                finding.getReviewedAt()
        );
    }

    private ScannerEvidenceItemResponse toEvidenceResponse(ScannerEvidenceItem evidence) {
        return new ScannerEvidenceItemResponse(
                evidence.getId(),
                evidence.getCreatedAt(),
                evidence.getUpdatedAt(),
                evidence.getProductProfile().getId(),
                evidence.getWorkspace() == null ? null : evidence.getWorkspace().getId(),
                evidence.getMilestone() == null ? null : evidence.getMilestone().getId(),
                evidence.getFinding() == null ? null : evidence.getFinding().getId(),
                evidence.getScanRun() == null ? null : evidence.getScanRun().getId(),
                evidence.getToolRun() == null ? null : evidence.getToolRun().getId(),
                evidence.getEvidenceType(),
                evidence.getSource(),
                evidence.getTitle(),
                evidence.getSummary(),
                evidence.getArtifactRef(),
                evidence.getStorageKey(),
                evidence.getRedactionStatus(),
                evidence.getConfidenceLevel(),
                evidence.getCreatedBy().getEmail()
        );
    }

    private Redaction redact(String value) {
        if (value == null) {
            return new Redaction(null, false);
        }
        String redacted = SECRET_PATTERN.matcher(value).replaceAll("[REDACTED_SECRET]");
        return new Redaction(redacted, !redacted.equals(value));
    }

    private JsonNode firstArray(JsonNode root, String... names) {
        for (String name : names) {
            JsonNode node = root.path(name);
            if (node.isArray()) {
                return node;
            }
        }
        return objectMapper.createArrayNode();
    }

    private String firstText(JsonNode node, String... names) {
        for (String name : names) {
            JsonNode value = node.path(name);
            if (value.isTextual() && !value.asText().isBlank()) {
                return value.asText();
            }
            if (value.isNumber() || value.isBoolean()) {
                return value.asText();
            }
        }
        return null;
    }

    private String contentTypeFor(CiEvidenceFormat format) {
        return switch (format) {
            case SARIF, JSON -> "application/json";
            case JUNIT -> "application/xml";
            case LOG -> "text/plain";
        };
    }

    private String defaultArtifactName(CiEvidenceFormat format) {
        return switch (format) {
            case SARIF -> "scanner-results.sarif";
            case JSON -> "scanner-results.json";
            case JUNIT -> "scanner-results.xml";
            case LOG -> "scanner-results.log";
        };
    }

    private String safeFailure(RuntimeException ex) {
        return truncate(defaultString(ex.getMessage(), ex.getClass().getSimpleName()), 500);
    }

    private String cleanRequired(String value, String message) {
        if (isBlank(value)) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String defaultString(String value, String fallback) {
        return isBlank(value) ? fallback : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String truncate(String value, int max) {
        if (value == null || value.length() <= max) {
            return value;
        }
        return value.substring(0, Math.max(0, max - 1)).trim();
    }

    private void audit(User actor, String action, String entityType, UUID entityId, AuditEvent.RiskLevel riskLevel, String details) {
        auditService.logAction(actor == null ? null : actor.getId(), action, entityType, entityId, riskLevel, details);
    }

    public enum CiEvidenceFormat {
        SARIF,
        JSON,
        JUNIT,
        LOG
    }

    public record CreateScanSourceRequest(
            @NotNull UUID productId,
            UUID workspaceId,
            ScanSource.ProviderType providerType,
            @NotBlank String displayName,
            String externalReference,
            ScanSource.AuthorizationStatus authorizationStatus,
            String scopeNote
    ) {}

    public record CiEvidenceUploadRequest(
            @NotNull UUID productId,
            UUID workspaceId,
            UUID sourceId,
            @NotBlank String toolName,
            String toolVersion,
            @NotNull CiEvidenceFormat format,
            String artifactFileName,
            @NotBlank @Size(max = MAX_EVIDENCE_PAYLOAD_BYTES) String artifactPayload,
            String externalReference,
            UUID milestoneId
    ) {}

    public record StartHostedScanRequest(
            @NotNull UUID productId,
            UUID workspaceId,
            UUID sourceId,
            ScanRun.ScanDepth depth,
            List<String> toolKeys,
            String branchRef,
            String runtimeTargetUrl,
            String containerImageRef,
            boolean authorizationConfirmed,
            boolean runtimeAuthorizationConfirmed,
            String reason,
            UUID comparisonBaseRunId
    ) {}

    public record ScanCancelRequest(String reason) {}

    public record RescanRequest(List<String> toolKeys, String reason) {}

    public record FindingStatusRequest(
            @NotNull NormalizedFinding.FindingStatus status,
            String reason,
            LocalDate reviewDueOn
    ) {}

    public record ScannerAdminHealthResponse(
            boolean workerEnabled,
            boolean schedulerEnabled,
            long queuedJobs,
            long runningJobs,
            List<ToolHealthResponse> tools
    ) {}

    public record ToolHealthResponse(
            String key,
            String displayName,
            boolean enabled,
            String executable,
            boolean executableAvailable,
            String targetType,
            boolean requiresIac,
            int timeoutSeconds
    ) {}

    public record ProductScannerSummaryResponse(
            ProductProfileResponse product,
            int readinessScore,
            ScannerSummaryCounts counts,
            List<ScanSourceResponse> sources,
            List<ScanRunResponse> recentRuns,
            List<NormalizedFindingResponse> findings,
            List<ScannerEvidenceItemResponse> evidence
    ) {}

    public record ScannerSummaryCounts(
            long total,
            long open,
            long resolved,
            long acceptedRisk,
            long critical,
            long high,
            long medium,
            long low,
            long info
    ) {}

    public record ScanSourceResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            UUID productProfileId,
            UUID workspaceId,
            ScanSource.ProviderType providerType,
            String displayName,
            String externalReference,
            ScanSource.AuthorizationStatus authorizationStatus,
            String scopeNote,
            String createdByEmail
    ) {}

    public record ScanRunResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            UUID scanSourceId,
            UUID productProfileId,
            UUID workspaceId,
            ScanRun.TriggerType triggerType,
            ScanRun.RunStatus status,
            ScanRun.ScanDepth depth,
            LocalDateTime startedAt,
            LocalDateTime completedAt,
            String requestedByEmail,
            String failureSummary,
            boolean cancelRequested,
            String scanPlan,
            String branchRef,
            String runtimeTargetUrl,
            String containerImageRef,
            UUID comparisonBaseRunId,
            List<ToolRunResponse> toolRuns
    ) {}

    public record ToolRunResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            UUID scanRunId,
            String toolName,
            String toolKey,
            String toolVersion,
            ToolRun.ToolStatus status,
            LocalDateTime startedAt,
            LocalDateTime completedAt,
            String rawArtifactRef,
            String storageKey,
            int normalizedCount,
            String errorSummary,
            Integer exitCode,
            Long durationMs,
            String logExcerpt
    ) {}

    public record NormalizedFindingResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            UUID productProfileId,
            UUID workspaceId,
            UUID scanRunId,
            UUID toolRunId,
            String fingerprint,
            String sourceTool,
            String sourceRuleId,
            String title,
            String description,
            NormalizedFinding.FindingSeverity severity,
            NormalizedFinding.FindingStatus status,
            String affectedComponent,
            UUID evidenceItemId,
            ServiceModuleResponse recommendedModule,
            String confidenceBasis,
            String riskAcceptanceReason,
            LocalDate riskReviewDueOn,
            String reviewedByEmail,
            LocalDateTime reviewedAt
    ) {}

    public record ScannerEvidenceItemResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            UUID productProfileId,
            UUID workspaceId,
            UUID milestoneId,
            UUID findingId,
            UUID scanRunId,
            UUID toolRunId,
            ScannerEvidenceItem.EvidenceType evidenceType,
            String source,
            String title,
            String summary,
            String artifactRef,
            String storageKey,
            ScannerEvidenceItem.RedactionStatus redactionStatus,
            ScannerEvidenceItem.ConfidenceLevel confidenceLevel,
            String createdByEmail
    ) {}

    private record ParsedFinding(
            String sourceTool,
            String ruleId,
            String title,
            String description,
            String severity,
            String affectedComponent,
            String confidenceBasis
    ) {}

    private record NormalizedRecord(
            String sourceTool,
            String ruleId,
            String title,
            String description,
            NormalizedFinding.FindingSeverity severity,
            String affectedComponent,
            String confidenceBasis,
            boolean redacted
    ) {}

    private record Redaction(String value, boolean redacted) {}
}
