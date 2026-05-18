package com.produs.scanner;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.produs.audit.AuditEvent;
import com.produs.entity.User;
import com.produs.exception.ResourceNotFoundException;
import com.produs.product.ProductProfile;
import com.produs.product.ProductProfileRepository;
import com.produs.service.AuditService;
import com.produs.service.S3Service;
import com.produs.workspace.ProjectWorkspace;
import com.produs.workspace.ProjectWorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ScannerStorageGovernanceService {

    private final ScannerStorageProperties storageProperties;
    private final ProductProfileRepository productRepository;
    private final ProjectWorkspaceRepository workspaceRepository;
    private final ScannerEvidenceItemRepository evidenceRepository;
    private final NormalizedFindingRepository findingRepository;
    private final ScanRunRepository scanRunRepository;
    private final ToolRunRepository toolRunRepository;
    private final ScannerImportRunRepository importRunRepository;
    private final ScannerEvidenceExportBundleRepository exportBundleRepository;
    private final ScannerArtifactDeletionRepository deletionRepository;
    private final S3Service s3Service;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public SignedArtifactResponse signedEvidenceArtifact(User actor, UUID evidenceId) {
        ScannerEvidenceItem evidence = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new ResourceNotFoundException("Scanner evidence item not found"));
        requireProductRead(actor, evidence.getProductProfile(), evidence.getWorkspace());
        if (blank(evidence.getStorageKey())) {
            throw new IllegalArgumentException("This evidence item has no stored artifact");
        }
        return new SignedArtifactResponse(
                evidence.getId(),
                "SCANNER_EVIDENCE",
                evidence.getStorageKey(),
                s3Service.generatePresignedDownloadUrl(evidence.getStorageKey()),
                storageProperties.getSignedUrlDurationSeconds()
        );
    }

    @Transactional
    public EvidenceExportBundleResponse createEvidenceExport(User actor, CreateEvidenceExportRequest request) {
        ProductProfile product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product profile not found"));
        ProjectWorkspace workspace = request.workspaceId() == null ? null : workspaceRepository.findById(request.workspaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Project workspace not found"));
        requireProductRead(actor, product, workspace);
        if (!storageProperties.isExportEnabled()) {
            throw new IllegalStateException("Scanner evidence exports are disabled");
        }

        ScannerEvidenceExportBundle bundle = new ScannerEvidenceExportBundle();
        bundle.setProductProfile(product);
        bundle.setWorkspace(workspace);
        bundle.setRequestedBy(actor);
        bundle = exportBundleRepository.save(bundle);

        try {
            List<NormalizedFinding> findings = findingRepository.findByProductProfileIdOrderBySeverityDescCreatedAtDesc(product.getId());
            List<ScannerEvidenceItem> evidence = workspace == null
                    ? evidenceRepository.findByProductProfileIdOrderByCreatedAtDesc(product.getId())
                    : evidenceRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspace.getId());
            List<ScanRun> runs = scanRunRepository.findByProductProfileIdOrderByCreatedAtDesc(product.getId());
            List<ToolRun> toolRuns = runs.isEmpty()
                    ? List.of()
                    : toolRunRepository.findByScanRunIdInOrderByCreatedAtAsc(runs.stream().map(ScanRun::getId).toList());
            ObjectNode manifest = buildExportManifest(product, workspace, findings, evidence, runs, toolRuns);
            String payload = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(manifest);
            String storageKey = s3Service.generateFileKey(
                    "scanner-exports/%s%s".formatted(product.getId(), workspace == null ? "" : "/" + workspace.getId()),
                    "scanner-evidence-export.json"
            );
            String artifactRef = s3Service.uploadFile(storageKey, payload.getBytes(StandardCharsets.UTF_8), "application/json");
            bundle.setStatus(ScannerEvidenceExportBundle.ExportStatus.COMPLETED);
            bundle.setFindingCount(findings.size());
            bundle.setEvidenceCount(evidence.size());
            bundle.setToolRunCount(toolRuns.size());
            bundle.setStorageKey(storageKey);
            bundle.setArtifactRef(artifactRef);
            bundle.setCompletedAt(LocalDateTime.now());
            ScannerEvidenceExportBundle saved = exportBundleRepository.save(bundle);
            audit(actor, "SCANNER_EVIDENCE_EXPORT_CREATED", "SCANNER_EVIDENCE_EXPORT", saved.getId(), AuditEvent.RiskLevel.MEDIUM,
                    "Created scanner evidence export for product " + product.getId());
            return toBundleResponse(saved, true);
        } catch (Exception ex) {
            bundle.setStatus(ScannerEvidenceExportBundle.ExportStatus.FAILED);
            bundle.setFailureSummary(ex.getMessage());
            ScannerEvidenceExportBundle failed = exportBundleRepository.save(bundle);
            audit(actor, "SCANNER_EVIDENCE_EXPORT_FAILED", "SCANNER_EVIDENCE_EXPORT", failed.getId(), AuditEvent.RiskLevel.HIGH,
                    "Scanner evidence export failed for product " + product.getId());
            throw new IllegalStateException("Unable to create scanner evidence export", ex);
        }
    }

    @Transactional(readOnly = true)
    public List<EvidenceExportBundleResponse> listEvidenceExports(User actor, UUID productId) {
        ProductProfile product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product profile not found"));
        requireProductRead(actor, product, null);
        return exportBundleRepository.findByProductProfileIdOrderByCreatedAtDesc(productId).stream()
                .map(bundle -> toBundleResponse(bundle, false))
                .toList();
    }

    @Transactional
    public RetentionRunResponse runRetention(User actor, RetentionRunRequest request) {
        if (actor.getRole() != User.UserRole.ADMIN) {
            throw new AccessDeniedException("Scanner storage retention is available to admins only");
        }
        boolean dryRun = request == null || request.dryRun() == null || request.dryRun();
        LocalDateTime rawCutoff = LocalDateTime.now().minusDays(Math.max(1, storageProperties.getRawArtifactRetentionDays()));
        LocalDateTime importCutoff = LocalDateTime.now().minusDays(Math.max(1, storageProperties.getImportPayloadRetentionDays()));
        LocalDateTime evidenceCutoff = LocalDateTime.now().minusDays(Math.max(1, storageProperties.getEvidenceArtifactRetentionDays()));
        List<RetentionCandidate> candidates = new ArrayList<>();
        toolRunRepository.findByCreatedAtBeforeAndStorageKeyIsNotNull(rawCutoff).forEach(tool -> candidates.add(new RetentionCandidate("TOOL_RUN", tool.getId(), tool.getStorageKey())));
        importRunRepository.findByCreatedAtBeforeAndStorageKeyIsNotNull(importCutoff).forEach(importRun -> candidates.add(new RetentionCandidate("SCANNER_IMPORT", importRun.getId(), importRun.getStorageKey())));
        evidenceRepository.findByCreatedAtBeforeAndStorageKeyIsNotNull(evidenceCutoff).forEach(evidence -> candidates.add(new RetentionCandidate("SCANNER_EVIDENCE", evidence.getId(), evidence.getStorageKey())));
        if (!dryRun) {
            for (RetentionCandidate candidate : candidates) {
                deleteStorageKey(actor, candidate.storageKey(), candidate.sourceType(), candidate.sourceId(), "Retention cleanup");
            }
            clearDeletedToolRefs(candidates);
            clearDeletedImportRefs(candidates);
            clearDeletedEvidenceRefs(candidates);
        }
        audit(actor, dryRun ? "SCANNER_RETENTION_DRY_RUN" : "SCANNER_RETENTION_EXECUTED", "SCANNER_STORAGE", null, AuditEvent.RiskLevel.MEDIUM,
                "Scanner retention %s found %d candidates".formatted(dryRun ? "dry run" : "execution", candidates.size()));
        return new RetentionRunResponse(dryRun, candidates.size(), candidates);
    }

    @Transactional
    public void deleteStorageKey(User actor, String storageKey, String sourceType, UUID sourceId, String reason) {
        if (blank(storageKey)) {
            return;
        }
        ScannerArtifactDeletion deletion = new ScannerArtifactDeletion();
        deletion.setStorageKey(storageKey);
        deletion.setSourceType(sourceType);
        deletion.setSourceId(sourceId);
        deletion.setReason(reason);
        deletion.setRequestedBy(actor);
        deletion = deletionRepository.save(deletion);
        try {
            s3Service.deleteFile(storageKey);
            deletion.setStatus(ScannerArtifactDeletion.DeletionStatus.DELETED);
            deletion.setDeletedAt(LocalDateTime.now());
            deletionRepository.save(deletion);
        } catch (RuntimeException ex) {
            deletion.setStatus(ScannerArtifactDeletion.DeletionStatus.FAILED);
            deletion.setFailureSummary(ex.getMessage());
            deletionRepository.save(deletion);
            throw ex;
        }
    }

    private ObjectNode buildExportManifest(ProductProfile product, ProjectWorkspace workspace, List<NormalizedFinding> findings, List<ScannerEvidenceItem> evidence, List<ScanRun> runs, List<ToolRun> toolRuns) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("generatedAt", LocalDateTime.now().toString());
        root.put("productId", product.getId().toString());
        root.put("productName", product.getName());
        if (workspace != null) {
            root.put("workspaceId", workspace.getId().toString());
            root.put("workspaceName", workspace.getName());
        }
        ArrayNode findingNodes = root.putArray("findings");
        findings.forEach(finding -> findingNodes.addObject()
                .put("id", finding.getId().toString())
                .put("severity", finding.getSeverity().name())
                .put("status", finding.getStatus().name())
                .put("title", finding.getTitle())
                .put("sourceTool", finding.getSourceTool())
                .put("fingerprint", finding.getFingerprint()));
        ArrayNode evidenceNodes = root.putArray("evidence");
        evidence.forEach(item -> evidenceNodes.addObject()
                .put("id", item.getId().toString())
                .put("title", item.getTitle())
                .put("source", item.getSource())
                .put("redactionStatus", item.getRedactionStatus().name())
                .put("artifactAvailable", !blank(item.getStorageKey())));
        ArrayNode runNodes = root.putArray("scanRuns");
        runs.forEach(run -> runNodes.addObject()
                .put("id", run.getId().toString())
                .put("status", run.getStatus().name())
                .put("depth", run.getDepth().name())
                .put("triggerType", run.getTriggerType().name()));
        ArrayNode toolNodes = root.putArray("toolRuns");
        toolRuns.forEach(tool -> toolNodes.addObject()
                .put("id", tool.getId().toString())
                .put("toolKey", tool.getToolKey())
                .put("toolName", tool.getToolName())
                .put("status", tool.getStatus().name())
                .put("normalizedCount", tool.getNormalizedCount()));
        return root;
    }

    private void clearDeletedToolRefs(List<RetentionCandidate> candidates) {
        candidates.stream().filter(candidate -> "TOOL_RUN".equals(candidate.sourceType())).forEach(candidate ->
                toolRunRepository.findById(candidate.sourceId()).ifPresent(tool -> {
                    tool.setStorageKey(null);
                    tool.setRawArtifactRef(null);
                    toolRunRepository.save(tool);
                })
        );
    }

    private void clearDeletedImportRefs(List<RetentionCandidate> candidates) {
        candidates.stream().filter(candidate -> "SCANNER_IMPORT".equals(candidate.sourceType())).forEach(candidate ->
                importRunRepository.findById(candidate.sourceId()).ifPresent(importRun -> {
                    importRun.setStorageKey(null);
                    importRun.setArtifactRef(null);
                    importRunRepository.save(importRun);
                })
        );
    }

    private void clearDeletedEvidenceRefs(List<RetentionCandidate> candidates) {
        candidates.stream().filter(candidate -> "SCANNER_EVIDENCE".equals(candidate.sourceType())).forEach(candidate ->
                evidenceRepository.findById(candidate.sourceId()).ifPresent(evidence -> {
                    evidence.setStorageKey(null);
                    evidence.setArtifactRef(null);
                    evidenceRepository.save(evidence);
                })
        );
    }

    private EvidenceExportBundleResponse toBundleResponse(ScannerEvidenceExportBundle bundle, boolean includeSignedUrl) {
        String signedUrl = includeSignedUrl && !blank(bundle.getStorageKey())
                ? s3Service.generatePresignedDownloadUrl(bundle.getStorageKey())
                : null;
        return new EvidenceExportBundleResponse(
                bundle.getId(),
                bundle.getCreatedAt(),
                bundle.getProductProfile().getId(),
                bundle.getWorkspace() == null ? null : bundle.getWorkspace().getId(),
                bundle.getStatus(),
                bundle.getArtifactRef(),
                bundle.getStorageKey(),
                signedUrl,
                storageProperties.getSignedUrlDurationSeconds(),
                bundle.getFindingCount(),
                bundle.getEvidenceCount(),
                bundle.getToolRunCount(),
                bundle.getCompletedAt(),
                bundle.getFailureSummary(),
                bundle.getRequestedBy().getEmail()
        );
    }

    private void requireProductRead(User actor, ProductProfile product, ProjectWorkspace workspace) {
        if (actor.getRole() == User.UserRole.ADMIN || product.getOwner().getId().equals(actor.getId())) {
            return;
        }
        if (workspace != null && workspace.getOwner().getId().equals(actor.getId())) {
            return;
        }
        throw new AccessDeniedException("You do not have access to this scanner evidence");
    }

    private void audit(User actor, String action, String entityType, UUID entityId, AuditEvent.RiskLevel riskLevel, String details) {
        auditService.logAction(actor == null ? null : actor.getId(), action, entityType, entityId, riskLevel, details);
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    public record SignedArtifactResponse(UUID entityId, String entityType, String storageKey, String signedUrl, int expiresInSeconds) {}

    public record CreateEvidenceExportRequest(UUID productId, UUID workspaceId) {}

    public record EvidenceExportBundleResponse(
            UUID id,
            LocalDateTime createdAt,
            UUID productProfileId,
            UUID workspaceId,
            ScannerEvidenceExportBundle.ExportStatus status,
            String artifactRef,
            String storageKey,
            String signedUrl,
            int signedUrlExpiresInSeconds,
            int findingCount,
            int evidenceCount,
            int toolRunCount,
            LocalDateTime completedAt,
            String failureSummary,
            String requestedByEmail
    ) {}

    public record RetentionRunRequest(Boolean dryRun) {}

    public record RetentionRunResponse(boolean dryRun, int candidateCount, List<RetentionCandidate> candidates) {}

    public record RetentionCandidate(String sourceType, UUID sourceId, String storageKey) {}
}
