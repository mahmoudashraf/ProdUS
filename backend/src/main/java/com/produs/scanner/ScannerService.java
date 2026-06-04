package com.produs.scanner;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.audit.AuditEvent;
import com.produs.catalog.ServiceModule;
import com.produs.catalog.ServiceModuleRepository;
import com.produs.dto.PlatformDtos.ProductProfileResponse;
import com.produs.dto.PlatformDtos.ServiceModuleResponse;
import com.produs.engine.ProductizationEngineService;
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
            "(?i)(https://x-access-token:[^@\\s]+@github\\.com|sk_(live|test)_[a-z0-9_\\-]{8,}|gh[pousr]_[a-z0-9_]{16,}|(api[_-]?key|access[_-]?key|secret|token|password|private[_-]?key)\\s*[:=]\\s*[\\\"']?[^\\s\\\"',;]{8,})"
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
    private final ScannerScheduleRepository scannerScheduleRepository;
    private final ScannerImportRunRepository importRunRepository;
    private final ScannerEvidenceItemRepository evidenceRepository;
    private final NormalizedFindingRepository findingRepository;
    private final S3Service s3Service;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final ScannerProperties scannerProperties;
    private final ScannerProcessRunner scannerProcessRunner;
    private final ProductizationEngineService productizationEngineService;

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
        source.setExternalInstallationId(trimToNull(request.externalInstallationId()));
        source.setExternalRepositoryFullName(trimToNull(request.externalRepositoryFullName()));
        source.setDefaultBranch(trimToNull(request.defaultBranch()));
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
    public ScanSourceResponse disconnectSource(User actor, UUID sourceId, DisconnectScanSourceRequest request) {
        ScanSource source = sourceRepository.findById(sourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Scanner source not found"));
        requireProductOrWorkspaceWrite(actor, source.getProductProfile(), source.getWorkspace());
        source.setAuthorizationStatus(ScanSource.AuthorizationStatus.REVOKED);
        source.setScopeNote(defaultString(trimToNull(request == null ? null : request.reason()), "Disconnected by " + actor.getEmail()));
        ScanSource saved = sourceRepository.save(source);
        int deletedArtifacts = 0;
        if (request != null && Boolean.TRUE.equals(request.deleteArtifacts())) {
            deletedArtifacts = deleteStoredArtifactsForSource(actor, saved);
        }
        audit(actor, "SCANNER_SOURCE_DISCONNECTED", "SCAN_SOURCE", saved.getId(), AuditEvent.RiskLevel.MEDIUM,
                "Disconnected scanner source %s for product %s. Deleted artifacts=%d".formatted(saved.getDisplayName(), saved.getProductProfile().getId(), deletedArtifacts));
        return toSourceResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ConnectorPermissionResponse> listConnectorPermissions() {
        return List.of(
                new ConnectorPermissionResponse(
                        ScanSource.ProviderType.GITHUB,
                        "GitHub repository",
                        "Used for repository metadata, branch selection, safe static scans, and optional GitHub security result imports.",
                        List.of("Repository contents: read", "Metadata: read", "Code scanning alerts: read when enabled", "Dependabot alerts: read when enabled", "Secret scanning alerts: read when enabled"),
                        "Use a GitHub App installation for private repositories. Dev/manual sources may use a repository URL only when the owner has confirmed authorization.",
                        true
                ),
                new ConnectorPermissionResponse(
                        ScanSource.ProviderType.GITLAB,
                        "GitLab repository",
                        "Used for repository metadata, branch selection, GitLab security report imports, and customer-owned CI evidence.",
                        List.of("Project repository: read", "Security reports: read", "Pipeline artifacts: read"),
                        "GitLab connector sync is a near-term expansion path. Current production-safe path supports customer-owned import payloads and CI templates.",
                        true
                ),
                new ConnectorPermissionResponse(
                        ScanSource.ProviderType.RUNTIME_URL,
                        "Authorized runtime URL",
                        "Used for Lighthouse and passive ZAP baseline checks against owner-authorized public or staging URLs.",
                        List.of("URL/domain authorization confirmation", "Passive baseline scan scope", "No active production DAST by default"),
                        "Runtime scans require explicit URL/domain confirmation for every run.",
                        false
                ),
                new ConnectorPermissionResponse(
                        ScanSource.ProviderType.CI_UPLOAD,
                        "Customer-owned CI evidence",
                        "Used when the customer runs scanners inside their own CI and uploads SARIF, JSON, JUnit, or logs to ProdUS.",
                        List.of("ProdUS upload token", "Product/workspace-scoped target", "No source code upload required"),
                        "Recommended for privacy-sensitive teams and enterprise accounts.",
                        false
                ),
                new ConnectorPermissionResponse(
                        ScanSource.ProviderType.EXTERNAL_TOOL,
                        "External scanner platform",
                        "Used for Snyk, SonarQube, SonarCloud, Semgrep Platform, GitHub security exports, and generic scanner JSON/SARIF imports.",
                        List.of("Provider project/run reference", "Exported findings payload", "Timestamp/source metadata"),
                        "Connector sync imports are audited and normalized; paid-provider credentials remain customer-controlled unless explicitly connected.",
                        false
                )
        );
    }

    @Transactional(readOnly = true)
    public List<ScannerImportRunResponse> listImportRuns(User actor, UUID productId, UUID workspaceId, UUID sourceId) {
        List<ScannerImportRun> imports;
        if (sourceId != null) {
            ScanSource source = sourceRepository.findById(sourceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Scanner source not found"));
            requireProductOrWorkspaceRead(actor, source.getProductProfile(), source.getWorkspace());
            imports = importRunRepository.findByScanSourceIdOrderByCreatedAtDesc(sourceId);
        } else if (workspaceId != null) {
            ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
            requireWorkspaceRead(actor, workspace);
            imports = importRunRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        } else if (productId != null) {
            ProductProfile product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product profile not found"));
            requireProductOwnerOrAdmin(actor, product);
            imports = importRunRepository.findByProductProfileIdOrderByCreatedAtDesc(productId);
        } else {
            throw new IllegalArgumentException("productId, workspaceId, or sourceId is required");
        }
        return imports.stream().map(this::toImportRunResponse).toList();
    }

    @Transactional(readOnly = true)
    public CiTemplateResponse getCiTemplate(User actor, CiTemplateType type, UUID productId, UUID workspaceId, UUID sourceId) {
        ProductProfile product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product profile not found"));
        ProjectWorkspace workspace = resolveWorkspace(workspaceId, product);
        requireProductOrWorkspaceRead(actor, product, workspace);
        String apiBaseUrl = "${PRODUS_API_BASE_URL:-https://api.produs.com}";
        String tokenEnv = "PRODUS_CI_UPLOAD_TOKEN";
        String shellUpload = """
                if [ -z "${%s:-}" ]; then
                  echo "Missing %s; skipping ProdUS evidence upload."
                  exit 0
                fi
                if ! command -v jq >/dev/null 2>&1; then
                  echo "jq is required to build the ProdUS upload payload."
                  exit 1
                fi
                test -s "${PRODUS_EVIDENCE_FILE}"
                PRODUS_UPLOAD_PAYLOAD="$(jq -n \\
                  --arg productId "%s" \\
                  --arg workspaceId "%s" \\
                  --arg sourceId "%s" \\
                  --arg toolName "${PRODUS_SCANNER_TOOL:-external-scanner}" \\
                  --arg toolVersion "${PRODUS_SCANNER_VERSION:-customer-owned}" \\
                  --arg format "${PRODUS_EVIDENCE_FORMAT:-JSON}" \\
                  --arg artifactFileName "${PRODUS_EVIDENCE_FILE}" \\
                  --arg externalReference "${CI_COMMIT_SHA:-${GITHUB_SHA:-manual}}" \\
                  --rawfile artifactPayload "${PRODUS_EVIDENCE_FILE}" \\
                  '{
                    productId: $productId,
                    toolName: $toolName,
                    toolVersion: $toolVersion,
                    format: $format,
                    artifactFileName: $artifactFileName,
                    externalReference: $externalReference,
                    artifactPayload: $artifactPayload
                  }
                  + (if $workspaceId == "" then {} else {workspaceId: $workspaceId} end)
                  + (if $sourceId == "" then {} else {sourceId: $sourceId} end)')"
                curl --fail --show-error --silent \\
                  -X POST "${PRODUS_API_BASE_URL:-https://api.produs.com}/api/scanner/runs/ci-upload" \\
                  -H "Authorization: Bearer ${%s}" \\
                  -H "Content-Type: application/json" \\
                  --data-binary "${PRODUS_UPLOAD_PAYLOAD}"
                """.formatted(
                tokenEnv,
                tokenEnv,
                product.getId(),
                workspace == null ? "" : workspace.getId(),
                sourceId == null ? "" : sourceId,
                tokenEnv
        );
        String template = switch (type == null ? CiTemplateType.GITHUB_ACTIONS : type) {
            case GITHUB_ACTIONS -> githubActionsTemplate(shellUpload);
            case GITLAB_CI -> gitlabCiTemplate(shellUpload);
            case GENERIC_CURL -> shellUpload;
        };
        return new CiTemplateResponse(
                type == null ? CiTemplateType.GITHUB_ACTIONS : type,
                product.getId(),
                workspace == null ? null : workspace.getId(),
                sourceId,
                tokenEnv,
                apiBaseUrl,
                template
        );
    }

    @Transactional
    public ScannerImportRunResponse importExternalEvidence(User actor, ExternalImportRequest request) {
        ProductProfile product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product profile not found"));
        ProjectWorkspace workspace = resolveWorkspace(request.workspaceId(), product);
        requireProductOrWorkspaceWrite(actor, product, workspace);
        Milestone milestone = resolveMilestone(request.milestoneId(), workspace);
        String payload = cleanRequired(request.artifactPayload(), "Import payload is required");
        if (payload.getBytes(StandardCharsets.UTF_8).length > MAX_EVIDENCE_PAYLOAD_BYTES) {
            throw new IllegalArgumentException("Import payload exceeds the 2MB API upload limit");
        }
        ScannerImportRun.ExternalProvider provider = request.provider() == null ? ScannerImportRun.ExternalProvider.GENERIC_JSON : request.provider();
        ScanSource source = resolveExternalImportSource(actor, product, workspace, request, provider);
        if (source.getAuthorizationStatus() != ScanSource.AuthorizationStatus.AUTHORIZED) {
            throw new IllegalArgumentException("External imports require an authorized scanner source");
        }

        ScannerImportRun importRun = new ScannerImportRun();
        importRun.setProductProfile(product);
        importRun.setWorkspace(workspace);
        importRun.setScanSource(source);
        importRun.setProvider(provider);
        importRun.setImportMethod(request.importMethod() == null ? ScannerImportRun.ImportMethod.MANUAL_API_IMPORT : request.importMethod());
        importRun.setStatus(ScannerImportRun.ImportStatus.RUNNING);
        importRun.setExternalReference(trimToNull(request.externalReference()));
        importRun.setSourceRecordedAt(request.sourceRecordedAt());
        importRun.setStartedAt(LocalDateTime.now());
        importRun.setRequestedBy(actor);
        ScannerImportRun savedImport = importRunRepository.save(importRun);

        ScanRun scanRun = new ScanRun();
        scanRun.setScanSource(source);
        scanRun.setProductProfile(product);
        scanRun.setWorkspace(workspace);
        scanRun.setTriggerType(ScanRun.TriggerType.EXTERNAL_IMPORT);
        scanRun.setDepth(ScanRun.ScanDepth.CI_EVIDENCE);
        scanRun.setStatus(ScanRun.RunStatus.RUNNING);
        scanRun.setRequestedBy(actor);
        scanRun.setStartedAt(LocalDateTime.now());
        scanRun.setScanPlan("External import from %s by %s. Reference=%s".formatted(provider, savedImport.getImportMethod(), defaultString(savedImport.getExternalReference(), "not supplied")));
        ScanRun savedRun = scanRunRepository.save(scanRun);
        savedImport.setScanRun(savedRun);
        importRunRepository.save(savedImport);

        ToolRun toolRun = new ToolRun();
        toolRun.setScanRun(savedRun);
        toolRun.setToolKey(provider.name().toLowerCase(Locale.ROOT).replace('_', '-'));
        toolRun.setToolName(defaultString(request.toolName(), displayNameFor(provider)));
        toolRun.setToolVersion(trimToNull(request.toolVersion()));
        toolRun.setStatus(ToolRun.ToolStatus.RUNNING);
        toolRun.setStartedAt(LocalDateTime.now());
        ToolRun savedTool = toolRunRepository.save(toolRun);

        try {
            String artifactName = defaultString(request.artifactFileName(), defaultArtifactName(request.format()));
            String storageKey = s3Service.generateFileKey("scanner/imports/%s/%s".formatted(product.getId(), savedImport.getId()), artifactName);
            String artifactRef = s3Service.uploadFile(storageKey, payload.getBytes(StandardCharsets.UTF_8), contentTypeFor(request.format()));
            List<ParsedFinding> parsedFindings = parseExternalProviderPayload(provider, request.format(), payload, savedTool.getToolName());
            int normalizedCount = persistParsedFindings(actor, product, workspace, milestone, savedRun, savedTool, artifactRef, storageKey, parsedFindings, true);

            savedTool.setRawArtifactRef(artifactRef);
            savedTool.setStorageKey(storageKey);
            savedTool.setNormalizedCount(normalizedCount);
            savedTool.setStatus(ToolRun.ToolStatus.COMPLETED);
            savedTool.setCompletedAt(LocalDateTime.now());
            toolRunRepository.save(savedTool);

            savedRun.setStatus(ScanRun.RunStatus.COMPLETED);
            savedRun.setCompletedAt(LocalDateTime.now());
            scanRunRepository.save(savedRun);

            savedImport.setStatus(ScannerImportRun.ImportStatus.COMPLETED);
            savedImport.setCompletedAt(LocalDateTime.now());
            savedImport.setImportedCount(normalizedCount);
            savedImport.setSkippedCount(parsedFindings.isEmpty() ? 1 : 0);
            savedImport.setArtifactRef(artifactRef);
            savedImport.setStorageKey(storageKey);
            ScannerImportRun completedImport = importRunRepository.save(savedImport);
            productizationEngineService.syncScannerReadinessDiagnosisForScanRun(actor, savedRun.getId());
            audit(actor, "SCANNER_EXTERNAL_IMPORT_COMPLETED", "SCANNER_IMPORT_RUN", completedImport.getId(), AuditEvent.RiskLevel.MEDIUM,
                    "Imported %s evidence for product %s with %d normalized findings".formatted(provider, product.getId(), normalizedCount));
            return toImportRunResponse(completedImport);
        } catch (RuntimeException ex) {
            savedTool.setStatus(ToolRun.ToolStatus.FAILED);
            savedTool.setErrorSummary(safeFailure(ex));
            savedTool.setCompletedAt(LocalDateTime.now());
            toolRunRepository.save(savedTool);
            savedRun.setStatus(ScanRun.RunStatus.FAILED);
            savedRun.setFailureSummary(safeFailure(ex));
            savedRun.setCompletedAt(LocalDateTime.now());
            scanRunRepository.save(savedRun);
            savedImport.setStatus(ScannerImportRun.ImportStatus.FAILED);
            savedImport.setErrorSummary(safeFailure(ex));
            savedImport.setCompletedAt(LocalDateTime.now());
            ScannerImportRun failedImport = importRunRepository.save(savedImport);
            audit(actor, "SCANNER_EXTERNAL_IMPORT_FAILED", "SCANNER_IMPORT_RUN", failedImport.getId(), AuditEvent.RiskLevel.HIGH,
                    "External scanner import failed for product " + product.getId() + ": " + safeFailure(ex));
            throw ex;
        }
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
            productizationEngineService.syncScannerReadinessDiagnosisForScanRun(actor, savedRun.getId());
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
                tools,
                scannerJobRepository.findTop12ByOrderByCreatedAtDesc().stream()
                        .map(this::toScannerJobResponse)
                        .toList(),
                importRunRepository.findTop12ByOrderByCreatedAtDesc().stream()
                        .map(this::toImportRunResponse)
                        .toList()
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
        List<ScannerImportRunResponse> imports = importRunRepository.findByProductProfileIdOrderByCreatedAtDesc(productId).stream()
                .limit(8)
                .map(this::toImportRunResponse)
                .toList();
        List<ScannerScheduleResponse> schedules = scannerScheduleRepository.findByProductProfileIdOrderByCreatedAtDesc(productId).stream()
                .limit(8)
                .map(this::toScheduleResponse)
                .toList();
        ScannerSummaryCounts counts = counts(findingRepository.findByProductProfileIdOrderBySeverityDescCreatedAtDesc(productId));
        return new ProductScannerSummaryResponse(
                toProductProfileResponse(product),
                readinessScore(counts),
                counts,
                sources,
                runs,
                findings,
                evidence,
                imports,
                schedules
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
    public ScannerScheduleResponse createSchedule(User actor, CreateScannerScheduleRequest request) {
        ProductProfile product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product profile not found"));
        ProjectWorkspace workspace = resolveWorkspace(request.workspaceId(), product);
        requireProductOrWorkspaceWrite(actor, product, workspace);
        ScanSource source = sourceRepository.findById(request.sourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Scan source not found"));
        if (!source.getProductProfile().getId().equals(product.getId())) {
            throw new IllegalArgumentException("Scan source belongs to another product");
        }
        if (source.getAuthorizationStatus() != ScanSource.AuthorizationStatus.AUTHORIZED) {
            throw new IllegalArgumentException("Only authorized scanner sources can be scheduled");
        }
        ScanRun.ScanDepth depth = request.depth() == null ? ScanRun.ScanDepth.SAFE_STATIC : request.depth();
        if (depth == ScanRun.ScanDepth.CI_EVIDENCE) {
            throw new IllegalArgumentException("CI evidence upload cannot be scheduled by ProdUS workers");
        }
        int intervalDays = request.intervalDays() == null ? 7 : request.intervalDays();
        if (intervalDays < 1 || intervalDays > 90) {
            throw new IllegalArgumentException("Schedule interval must be between 1 and 90 days");
        }
        List<String> toolKeys = selectedToolKeys(request.toolKeys(), depth);
        validateToolKeys(toolKeys);

        ScannerSchedule schedule = new ScannerSchedule();
        schedule.setProductProfile(product);
        schedule.setWorkspace(workspace);
        schedule.setScanSource(source);
        schedule.setCreatedBy(actor);
        schedule.setDepth(depth);
        schedule.setToolKeys(String.join(",", toolKeys));
        schedule.setBranchRef(trimToNull(request.branchRef()));
        schedule.setRuntimeTargetUrl(trimToNull(request.runtimeTargetUrl()));
        schedule.setContainerImageRef(trimToNull(request.containerImageRef()));
        schedule.setIntervalDays(intervalDays);
        schedule.setNextRunAt(request.nextRunAt() == null ? LocalDateTime.now().plusDays(intervalDays) : request.nextRunAt());
        schedule.setActive(request.active() == null || request.active());
        schedule.setReason(defaultString(trimToNull(request.reason()), "Scheduled scanner run for productization readiness."));
        ScannerSchedule saved = scannerScheduleRepository.save(schedule);
        audit(actor, "SCANNER_SCHEDULE_CREATED", "SCANNER_SCHEDULE", saved.getId(), AuditEvent.RiskLevel.MEDIUM,
                "Created %s scanner schedule for product %s every %d days".formatted(depth, product.getId(), intervalDays));
        return toScheduleResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ScannerScheduleResponse> listSchedules(User actor, UUID productId, UUID workspaceId) {
        if (productId == null && workspaceId == null) {
            throw new IllegalArgumentException("productId or workspaceId is required");
        }
        if (workspaceId != null) {
            ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
            requireWorkspaceRead(actor, workspace);
            return scannerScheduleRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream()
                    .map(this::toScheduleResponse)
                    .toList();
        }
        ProductProfile product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product profile not found"));
        requireProductOwnerOrAdmin(actor, product);
        return scannerScheduleRepository.findByProductProfileIdOrderByCreatedAtDesc(productId).stream()
                .map(this::toScheduleResponse)
                .toList();
    }

    @Transactional
    public ScannerScheduleResponse updateSchedule(User actor, UUID scheduleId, UpdateScannerScheduleRequest request) {
        ScannerSchedule schedule = scannerScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Scanner schedule not found"));
        requireProductOrWorkspaceWrite(actor, schedule.getProductProfile(), schedule.getWorkspace());
        if (request.active() != null) {
            schedule.setActive(request.active());
        }
        if (request.intervalDays() != null) {
            if (request.intervalDays() < 1 || request.intervalDays() > 90) {
                throw new IllegalArgumentException("Schedule interval must be between 1 and 90 days");
            }
            schedule.setIntervalDays(request.intervalDays());
        }
        if (request.nextRunAt() != null) {
            schedule.setNextRunAt(request.nextRunAt());
        }
        if (request.reason() != null) {
            schedule.setReason(trimToNull(request.reason()));
        }
        ScannerSchedule saved = scannerScheduleRepository.save(schedule);
        audit(actor, "SCANNER_SCHEDULE_UPDATED", "SCANNER_SCHEDULE", saved.getId(), AuditEvent.RiskLevel.MEDIUM,
                "Updated scanner schedule active=" + saved.isActive() + " nextRunAt=" + saved.getNextRunAt());
        return toScheduleResponse(saved);
    }

    @Transactional
    public int enqueueDueSchedules() {
        List<ScannerSchedule> due = scannerScheduleRepository.findTop20ByActiveTrueAndNextRunAtLessThanEqualOrderByNextRunAtAsc(LocalDateTime.now());
        int queued = 0;
        for (ScannerSchedule schedule : due) {
            try {
                StartHostedScanRequest request = new StartHostedScanRequest(
                        schedule.getProductProfile().getId(),
                        schedule.getWorkspace() == null ? null : schedule.getWorkspace().getId(),
                        schedule.getScanSource().getId(),
                        schedule.getDepth(),
                        parseToolKeys(schedule.getToolKeys()),
                        schedule.getBranchRef(),
                        schedule.getRuntimeTargetUrl(),
                        schedule.getContainerImageRef(),
                        true,
                        schedule.getDepth() == ScanRun.ScanDepth.RUNTIME_BASELINE,
                        defaultString(schedule.getReason(), "Scheduled scanner execution"),
                        null
                );
                ScanRunResponse run = startHostedScan(schedule.getCreatedBy(), request);
                schedule.setLastRunAt(LocalDateTime.now());
                schedule.setLastScanRunId(run.id());
                schedule.setNextRunAt(LocalDateTime.now().plusDays(Math.max(1, schedule.getIntervalDays())));
                scannerScheduleRepository.save(schedule);
                queued++;
            } catch (RuntimeException ex) {
                schedule.setNextRunAt(LocalDateTime.now().plusHours(6));
                schedule.setReason(defaultString(schedule.getReason(), "Scheduled scanner execution") + "\nLast enqueue failure: " + safeScannerFailure(ex));
                scannerScheduleRepository.save(schedule);
                audit(schedule.getCreatedBy(), "SCANNER_SCHEDULE_ENQUEUE_FAILED", "SCANNER_SCHEDULE", schedule.getId(), AuditEvent.RiskLevel.HIGH,
                        "Scheduled scan enqueue failed for product " + schedule.getProductProfile().getId() + ": " + safeScannerFailure(ex));
            }
        }
        return queued;
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
        if (run.getStatus() == ScanRun.RunStatus.COMPLETED) {
            productizationEngineService.syncScannerReadinessDiagnosisForScanRun(run.getRequestedBy(), run.getId());
        }
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

    private int persistParsedFindings(
            User actor,
            ProductProfile product,
            ProjectWorkspace workspace,
            Milestone milestone,
            ScanRun scanRun,
            ToolRun toolRun,
            String artifactRef,
            String storageKey,
            List<ParsedFinding> parsedFindings,
            boolean externalImport
    ) {
        if (parsedFindings.isEmpty()) {
            ScannerEvidenceItem evidence = baseEvidence(actor, product, workspace, milestone, scanRun, toolRun);
            evidence.setTitle(externalImport ? "External scanner evidence imported" : toolRun.getToolName() + " completed");
            evidence.setSummary(externalImport ? "No normalized findings were detected in this external import." : "The scanner completed without normalized findings.");
            evidence.setSource(toolRun.getToolName());
            evidence.setArtifactRef(artifactRef);
            evidence.setStorageKey(storageKey);
            evidenceRepository.save(evidence);
            return 0;
        }
        int normalizedCount = 0;
        for (ParsedFinding parsed : parsedFindings) {
            NormalizedRecord normalized = normalizeFinding(parsed, toolRun.getToolName());
            ScannerEvidenceItem evidence = baseEvidence(actor, product, workspace, milestone, scanRun, toolRun);
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
            finding.setStatus(externalImport ? initialFindingStatus(scanRun, finding.getFingerprint()) : NormalizedFinding.FindingStatus.OPEN);
            finding.setAffectedComponent(normalized.affectedComponent());
            finding.setEvidenceItem(savedEvidence);
            finding.setRecommendedModule(recommendServiceModule(normalized));
            finding.setConfidenceBasis(normalized.confidenceBasis());
            NormalizedFinding savedFinding = findingRepository.save(finding);
            savedEvidence.setFinding(savedFinding);
            evidenceRepository.save(savedEvidence);
            normalizedCount++;
        }
        return normalizedCount;
    }

    private ScanSource resolveExternalImportSource(
            User actor,
            ProductProfile product,
            ProjectWorkspace workspace,
            ExternalImportRequest request,
            ScannerImportRun.ExternalProvider provider
    ) {
        if (request.sourceId() != null) {
            ScanSource source = sourceRepository.findById(request.sourceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Scanner source not found"));
            if (!source.getProductProfile().getId().equals(product.getId())) {
                throw new IllegalArgumentException("Scanner source does not belong to the product");
            }
            if (workspace != null && source.getWorkspace() != null && !source.getWorkspace().getId().equals(workspace.getId())) {
                throw new IllegalArgumentException("Scanner source does not belong to the workspace");
            }
            return source;
        }
        ScanSource source = new ScanSource();
        source.setOwner(product.getOwner());
        source.setProductProfile(product);
        source.setWorkspace(workspace);
        source.setProviderType(sourceProviderFor(provider));
        source.setDisplayName(displayNameFor(provider));
        source.setExternalReference(trimToNull(request.externalReference()));
        source.setAuthorizationStatus(ScanSource.AuthorizationStatus.AUTHORIZED);
        source.setScopeNote(defaultString(trimToNull(request.scopeNote()), "Customer-owned external scanner import source."));
        source.setCreatedBy(actor);
        return sourceRepository.save(source);
    }

    private ScanSource.ProviderType sourceProviderFor(ScannerImportRun.ExternalProvider provider) {
        return switch (provider) {
            case GITHUB_CODE_SCANNING, GITHUB_DEPENDABOT, GITHUB_SECRET_SCANNING -> ScanSource.ProviderType.GITHUB;
            case GITLAB_SECURITY -> ScanSource.ProviderType.GITLAB;
            default -> ScanSource.ProviderType.EXTERNAL_TOOL;
        };
    }

    private String displayNameFor(ScannerImportRun.ExternalProvider provider) {
        return switch (provider) {
            case GITHUB_CODE_SCANNING -> "GitHub Code Scanning";
            case GITHUB_DEPENDABOT -> "GitHub Dependabot";
            case GITHUB_SECRET_SCANNING -> "GitHub Secret Scanning";
            case GITLAB_SECURITY -> "GitLab Security";
            case SNYK -> "Snyk";
            case SONARQUBE -> "SonarQube";
            case SONARCLOUD -> "SonarCloud";
            case SEMGREP_PLATFORM -> "Semgrep Platform";
            case SARIF -> "SARIF Import";
            case GENERIC_JSON -> "External Scanner JSON";
        };
    }

    private String githubActionsTemplate(String shellUpload) {
        return """
                name: ProdUS evidence upload

                on:
                  push:
                    branches: [ main ]
                  pull_request:
                  workflow_dispatch:

                jobs:
                  produs-evidence:
                    runs-on: ubuntu-latest
                    permissions:
                      contents: read
                    steps:
                      - uses: actions/checkout@v4
                      - name: Run customer-owned scanner
                        shell: bash
                        run: |
                          set -euo pipefail
                          PRODUS_SCANNER_TOOL="${PRODUS_SCANNER_TOOL:-semgrep}"
                          PRODUS_EVIDENCE_FORMAT="${PRODUS_EVIDENCE_FORMAT:-SARIF}"
                          PRODUS_EVIDENCE_FILE="${PRODUS_EVIDENCE_FILE:-produs-evidence.sarif}"
                          semgrep scan --sarif --output "${PRODUS_EVIDENCE_FILE}" || true
                          if [ ! -s "${PRODUS_EVIDENCE_FILE}" ]; then
                            echo '{"runs":[]}' > "${PRODUS_EVIDENCE_FILE}"
                          fi
                      - name: Upload evidence to ProdUS
                        shell: bash
                        env:
                          PRODUS_CI_UPLOAD_TOKEN: ${{ secrets.PRODUS_CI_UPLOAD_TOKEN }}
                          PRODUS_API_BASE_URL: ${{ vars.PRODUS_API_BASE_URL }}
                        run: |
                %s
                """.formatted(indent(shellUpload, 10));
    }

    private String gitlabCiTemplate(String shellUpload) {
        return """
                produs_evidence_upload:
                  stage: test
                  image: returntocorp/semgrep:latest
                  variables:
                    PRODUS_SCANNER_TOOL: semgrep
                    PRODUS_EVIDENCE_FORMAT: SARIF
                    PRODUS_EVIDENCE_FILE: produs-evidence.sarif
                  script:
                    - semgrep scan --sarif --output "${PRODUS_EVIDENCE_FILE}" || true
                    - if [ ! -s "${PRODUS_EVIDENCE_FILE}" ]; then echo '{"runs":[]}' > "${PRODUS_EVIDENCE_FILE}"; fi
                    - |
                %s
                  artifacts:
                    when: always
                    paths:
                      - produs-evidence.sarif
                """.formatted(indent(shellUpload, 6));
    }

    private String indent(String value, int spaces) {
        String prefix = " ".repeat(spaces);
        return prefix + defaultString(value, "").replace("\n", "\n" + prefix);
    }

    private List<ParsedFinding> parseExternalProviderPayload(
            ScannerImportRun.ExternalProvider provider,
            CiEvidenceFormat format,
            String payload,
            String fallbackToolName
    ) {
        if (provider == ScannerImportRun.ExternalProvider.SARIF || format == CiEvidenceFormat.SARIF || format == CiEvidenceFormat.LOG) {
            return parseEvidencePayload(format, payload, fallbackToolName);
        }
        try {
            JsonNode root = objectMapper.readTree(payload);
            List<ParsedFinding> providerFindings = switch (provider) {
                case GITHUB_CODE_SCANNING -> parseGithubCodeScanning(root, fallbackToolName);
                case GITHUB_DEPENDABOT -> parseGithubDependabot(root, fallbackToolName);
                case GITHUB_SECRET_SCANNING -> parseGithubSecretScanning(root, fallbackToolName);
                case GITLAB_SECURITY -> parseGitlabSecurity(root, fallbackToolName);
                case SNYK -> parseSnyk(root, fallbackToolName);
                case SONARQUBE, SONARCLOUD -> parseSonar(root, fallbackToolName);
                case SEMGREP_PLATFORM -> parseSemgrepPlatform(root, fallbackToolName);
                case SARIF, GENERIC_JSON -> List.of();
            };
            return providerFindings.isEmpty() ? parseGenericJson(root, fallbackToolName) : providerFindings;
        } catch (Exception ex) {
            throw new IllegalArgumentException("External import payload is not valid JSON for " + provider);
        }
    }

    private List<ParsedFinding> parseGithubCodeScanning(JsonNode root, String toolName) {
        JsonNode alerts = root.isArray() ? root : firstArray(root, "alerts", "code_scanning_alerts", "items");
        List<ParsedFinding> findings = new ArrayList<>();
        if (!alerts.isArray()) return findings;
        for (JsonNode alert : alerts) {
            JsonNode rule = alert.path("rule");
            JsonNode instance = alert.path("most_recent_instance");
            String path = firstText(instance.path("location"), "path");
            String line = firstText(instance.path("location"), "start_line", "line");
            findings.add(new ParsedFinding(
                    toolName,
                    firstText(rule, "id", "name"),
                    defaultString(firstText(rule, "description", "name"), "GitHub code scanning alert"),
                    defaultString(firstText(instance, "message"), defaultString(firstText(rule, "full_description", "description"), "GitHub Code Scanning reported an alert.")),
                    firstText(rule, "security_severity_level", "severity"),
                    location(path, line),
                    "GitHub Code Scanning external alert"
            ));
        }
        return findings;
    }

    private List<ParsedFinding> parseGithubDependabot(JsonNode root, String toolName) {
        JsonNode alerts = root.isArray() ? root : firstArray(root, "alerts", "dependabot_alerts", "items");
        List<ParsedFinding> findings = new ArrayList<>();
        if (!alerts.isArray()) return findings;
        for (JsonNode alert : alerts) {
            JsonNode advisory = alert.path("security_advisory");
            JsonNode dependency = alert.path("dependency");
            String packageName = firstText(dependency.path("package"), "name", "ecosystem");
            String cve = firstText(advisory, "cve_id", "ghsa_id");
            findings.add(new ParsedFinding(
                    toolName,
                    defaultString(cve, firstText(advisory, "ghsa_id")),
                    defaultString(firstText(advisory, "summary"), defaultString(packageName, "Dependabot vulnerability")),
                    defaultString(firstText(advisory, "description", "summary"), "GitHub Dependabot reported a dependency advisory."),
                    firstText(advisory, "severity", "cvss"),
                    packageName,
                    "GitHub Dependabot external alert"
            ));
        }
        return findings;
    }

    private List<ParsedFinding> parseGithubSecretScanning(JsonNode root, String toolName) {
        JsonNode alerts = root.isArray() ? root : firstArray(root, "alerts", "secret_scanning_alerts", "items");
        List<ParsedFinding> findings = new ArrayList<>();
        if (!alerts.isArray()) return findings;
        for (JsonNode alert : alerts) {
            findings.add(new ParsedFinding(
                    toolName,
                    firstText(alert, "secret_type", "secret_type_display_name", "number"),
                    defaultString(firstText(alert, "secret_type_display_name", "secret_type"), "Secret scanning alert"),
                    "GitHub Secret Scanning reported a secret exposure. The secret value is intentionally not stored in ProdUS.",
                    "high",
                    firstText(alert, "locations_url", "html_url"),
                    "GitHub Secret Scanning external alert"
            ));
        }
        return findings;
    }

    private List<ParsedFinding> parseGitlabSecurity(JsonNode root, String toolName) {
        JsonNode vulnerabilities = root.isArray() ? root : firstArray(root, "vulnerabilities", "findings", "alerts");
        List<ParsedFinding> findings = new ArrayList<>();
        if (!vulnerabilities.isArray()) return findings;
        for (JsonNode vulnerability : vulnerabilities) {
            JsonNode location = vulnerability.path("location");
            findings.add(new ParsedFinding(
                    toolName,
                    firstText(vulnerability, "id", "cve", "identifier"),
                    defaultString(firstText(vulnerability, "name", "message"), "GitLab security finding"),
                    defaultString(firstText(vulnerability, "description", "message", "solution"), "GitLab security report included a finding."),
                    firstText(vulnerability, "severity", "confidence"),
                    defaultString(firstText(location, "file", "image", "dependency", "class"), firstText(vulnerability, "location")),
                    "GitLab security report import"
            ));
        }
        return findings;
    }

    private List<ParsedFinding> parseSnyk(JsonNode root, String toolName) {
        JsonNode issues = root.isArray() ? root : firstArray(root, "issues", "vulnerabilities", "data", "results");
        List<ParsedFinding> findings = new ArrayList<>();
        if (!issues.isArray()) return findings;
        for (JsonNode issue : issues) {
            JsonNode attributes = issue.path("attributes").isMissingNode() ? issue : issue.path("attributes");
            JsonNode pkg = attributes.path("package");
            findings.add(new ParsedFinding(
                    toolName,
                    firstText(attributes, "id", "issueId", "snykId"),
                    defaultString(firstText(attributes, "title", "name"), "Snyk issue"),
                    defaultString(firstText(attributes, "description", "details", "summary"), "Snyk reported an issue."),
                    firstText(attributes, "severity", "priority"),
                    defaultString(firstText(pkg, "name", "version"), firstText(attributes, "packageName", "from")),
                    "Snyk external issue import"
            ));
        }
        return findings;
    }

    private List<ParsedFinding> parseSonar(JsonNode root, String toolName) {
        JsonNode issues = root.isArray() ? root : firstArray(root, "issues", "hotspots", "components");
        List<ParsedFinding> findings = new ArrayList<>();
        if (!issues.isArray()) return findings;
        for (JsonNode issue : issues) {
            findings.add(new ParsedFinding(
                    toolName,
                    firstText(issue, "rule", "key"),
                    defaultString(firstText(issue, "message", "name"), "Sonar quality issue"),
                    defaultString(firstText(issue, "message", "description"), "Sonar reported a quality or security issue."),
                    firstText(issue, "severity", "vulnerabilityProbability", "status"),
                    firstText(issue, "component", "project", "file"),
                    "Sonar external quality/security import"
            ));
        }
        return findings;
    }

    private List<ParsedFinding> parseSemgrepPlatform(JsonNode root, String toolName) {
        List<ParsedFinding> semgrep = parseSemgrep(root, toolName);
        if (!semgrep.isEmpty()) return semgrep;
        JsonNode findingsNode = root.isArray() ? root : firstArray(root, "findings", "results", "data");
        List<ParsedFinding> findings = new ArrayList<>();
        if (!findingsNode.isArray()) return findings;
        for (JsonNode finding : findingsNode) {
            JsonNode attributes = finding.path("attributes").isMissingNode() ? finding : finding.path("attributes");
            findings.add(new ParsedFinding(
                    toolName,
                    firstText(attributes, "rule_name", "ruleId", "check_id"),
                    defaultString(firstText(attributes, "title", "message"), "Semgrep platform finding"),
                    defaultString(firstText(attributes, "message", "description"), "Semgrep platform reported a finding."),
                    firstText(attributes, "severity", "confidence"),
                    firstText(attributes, "path", "file"),
                    "Semgrep platform external finding import"
            ));
        }
        return findings;
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

    private List<String> parseToolKeys(String toolKeys) {
        if (isBlank(toolKeys)) {
            return List.of();
        }
        return java.util.Arrays.stream(toolKeys.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .toList();
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

    private int deleteStoredArtifactsForSource(User actor, ScanSource source) {
        List<ScanRun> runs = scanRunRepository.findByScanSourceIdOrderByCreatedAtDesc(source.getId());
        List<UUID> runIds = runs.stream().map(ScanRun::getId).toList();
        List<ToolRun> toolRuns = runIds.isEmpty() ? List.of() : toolRunRepository.findByScanRunIdInOrderByCreatedAtAsc(runIds);
        List<ScannerEvidenceItem> evidenceItems = runIds.isEmpty() ? List.of() : evidenceRepository.findByScanRunIdInOrderByCreatedAtDesc(runIds);
        List<ScannerImportRun> imports = importRunRepository.findByScanSourceIdOrderByCreatedAtDesc(source.getId());

        List<String> storageKeys = new ArrayList<>();
        toolRuns.stream().map(ToolRun::getStorageKey).filter(key -> !isBlank(key)).forEach(storageKeys::add);
        evidenceItems.stream().map(ScannerEvidenceItem::getStorageKey).filter(key -> !isBlank(key)).forEach(storageKeys::add);
        imports.stream().map(ScannerImportRun::getStorageKey).filter(key -> !isBlank(key)).forEach(storageKeys::add);
        List<String> uniqueKeys = storageKeys.stream().distinct().toList();
        if (!uniqueKeys.isEmpty()) {
            s3Service.deleteFiles(uniqueKeys);
        }

        toolRuns.forEach(toolRun -> {
            toolRun.setRawArtifactRef(null);
            toolRun.setStorageKey(null);
            toolRunRepository.save(toolRun);
        });
        evidenceItems.forEach(evidence -> {
            evidence.setArtifactRef(null);
            evidence.setStorageKey(null);
            evidence.setRedactionStatus(ScannerEvidenceItem.RedactionStatus.SENSITIVE_HIDDEN);
            evidenceRepository.save(evidence);
        });
        imports.forEach(importRun -> {
            importRun.setArtifactRef(null);
            importRun.setStorageKey(null);
            importRunRepository.save(importRun);
        });
        audit(actor, "SCANNER_SOURCE_ARTIFACTS_DELETED", "SCAN_SOURCE", source.getId(), AuditEvent.RiskLevel.HIGH,
                "Deleted " + uniqueKeys.size() + " scanner artifact objects for source " + source.getDisplayName());
        return uniqueKeys.size();
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
                source.getExternalInstallationId(),
                source.getExternalRepositoryFullName(),
                source.getDefaultBranch(),
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

    private ScannerImportRunResponse toImportRunResponse(ScannerImportRun importRun) {
        ScanRun run = importRun.getScanRun();
        return new ScannerImportRunResponse(
                importRun.getId(),
                importRun.getCreatedAt(),
                importRun.getUpdatedAt(),
                importRun.getProductProfile().getId(),
                importRun.getWorkspace() == null ? null : importRun.getWorkspace().getId(),
                importRun.getScanSource().getId(),
                run == null ? null : run.getId(),
                importRun.getProvider(),
                importRun.getImportMethod(),
                importRun.getStatus(),
                importRun.getExternalReference(),
                importRun.getSourceRecordedAt(),
                importRun.getStartedAt(),
                importRun.getCompletedAt(),
                importRun.getImportedCount(),
                importRun.getSkippedCount(),
                importRun.getArtifactRef(),
                importRun.getStorageKey(),
                importRun.getErrorSummary(),
                importRun.getRequestedBy().getEmail(),
                run == null ? null : toScanRunResponse(run, toolRunRepository.findByScanRunIdOrderByCreatedAtAsc(run.getId()))
        );
    }

    private ScannerJobResponse toScannerJobResponse(ScannerJob job) {
        ScanRun run = job.getScanRun();
        return new ScannerJobResponse(
                job.getId(),
                job.getCreatedAt(),
                job.getUpdatedAt(),
                run == null ? null : run.getId(),
                run == null ? null : run.getProductProfile().getId(),
                run == null || run.getWorkspace() == null ? null : run.getWorkspace().getId(),
                job.getStatus(),
                job.getAttemptCount(),
                job.getMaxAttempts(),
                job.getNextRunAt(),
                job.getLockedAt(),
                job.getLockOwner(),
                job.getStartedAt(),
                job.getCompletedAt(),
                job.getFailureSummary(),
                run == null ? null : toScanRunResponse(run, toolRunRepository.findByScanRunIdOrderByCreatedAtAsc(run.getId()))
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
                finding.getFindingCategory(),
                finding.getReadinessArea(),
                finding.getBusinessRisk(),
                finding.getEvidenceRequired(),
                finding.getMappingReason(),
                finding.getMappingConfidence(),
                finding.getMappingSource(),
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

    private ScannerScheduleResponse toScheduleResponse(ScannerSchedule schedule) {
        return new ScannerScheduleResponse(
                schedule.getId(),
                schedule.getCreatedAt(),
                schedule.getUpdatedAt(),
                schedule.getProductProfile().getId(),
                schedule.getWorkspace() == null ? null : schedule.getWorkspace().getId(),
                schedule.getScanSource().getId(),
                schedule.getDepth(),
                parseToolKeys(schedule.getToolKeys()),
                schedule.getBranchRef(),
                schedule.getRuntimeTargetUrl(),
                schedule.getContainerImageRef(),
                schedule.getIntervalDays(),
                schedule.getNextRunAt(),
                schedule.getLastRunAt(),
                schedule.getLastScanRunId(),
                schedule.isActive(),
                schedule.getReason(),
                schedule.getCreatedBy().getEmail()
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
            String externalInstallationId,
            String externalRepositoryFullName,
            String defaultBranch,
            ScanSource.AuthorizationStatus authorizationStatus,
            String scopeNote
    ) {}

    public record DisconnectScanSourceRequest(String reason, Boolean deleteArtifacts) {}

    public record CreateScannerScheduleRequest(
            @NotNull UUID productId,
            UUID workspaceId,
            @NotNull UUID sourceId,
            ScanRun.ScanDepth depth,
            List<String> toolKeys,
            String branchRef,
            String runtimeTargetUrl,
            String containerImageRef,
            Integer intervalDays,
            LocalDateTime nextRunAt,
            Boolean active,
            String reason
    ) {}

    public record UpdateScannerScheduleRequest(
            Boolean active,
            Integer intervalDays,
            LocalDateTime nextRunAt,
            String reason
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

    public record ExternalImportRequest(
            @NotNull UUID productId,
            UUID workspaceId,
            UUID sourceId,
            @NotNull ScannerImportRun.ExternalProvider provider,
            ScannerImportRun.ImportMethod importMethod,
            @NotBlank String toolName,
            String toolVersion,
            @NotNull CiEvidenceFormat format,
            String artifactFileName,
            @NotBlank @Size(max = MAX_EVIDENCE_PAYLOAD_BYTES) String artifactPayload,
            String externalReference,
            LocalDateTime sourceRecordedAt,
            UUID milestoneId,
            String scopeNote
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
            List<ToolHealthResponse> tools,
            List<ScannerJobResponse> recentJobs,
            List<ScannerImportRunResponse> recentImports
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

    public record ScannerJobResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            UUID scanRunId,
            UUID productProfileId,
            UUID workspaceId,
            ScannerJob.JobStatus status,
            int attemptCount,
            int maxAttempts,
            LocalDateTime nextRunAt,
            LocalDateTime lockedAt,
            String lockOwner,
            LocalDateTime startedAt,
            LocalDateTime completedAt,
            String failureSummary,
            ScanRunResponse scanRun
    ) {}

    public enum CiTemplateType {
        GITHUB_ACTIONS,
        GITLAB_CI,
        GENERIC_CURL
    }

    public record CiTemplateResponse(
            CiTemplateType type,
            UUID productId,
            UUID workspaceId,
            UUID sourceId,
            String tokenEnvironmentVariable,
            String apiBaseUrlExpression,
            String template
    ) {}

    public record ScannerImportRunResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            UUID productProfileId,
            UUID workspaceId,
            UUID scanSourceId,
            UUID scanRunId,
            ScannerImportRun.ExternalProvider provider,
            ScannerImportRun.ImportMethod importMethod,
            ScannerImportRun.ImportStatus status,
            String externalReference,
            LocalDateTime sourceRecordedAt,
            LocalDateTime startedAt,
            LocalDateTime completedAt,
            int importedCount,
            int skippedCount,
            String artifactRef,
            String storageKey,
            String errorSummary,
            String requestedByEmail,
            ScanRunResponse scanRun
    ) {}

    public record ProductScannerSummaryResponse(
            ProductProfileResponse product,
            int readinessScore,
            ScannerSummaryCounts counts,
            List<ScanSourceResponse> sources,
            List<ScanRunResponse> recentRuns,
            List<NormalizedFindingResponse> findings,
            List<ScannerEvidenceItemResponse> evidence,
            List<ScannerImportRunResponse> imports,
            List<ScannerScheduleResponse> schedules
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
            String externalInstallationId,
            String externalRepositoryFullName,
            String defaultBranch,
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
            String findingCategory,
            String readinessArea,
            String businessRisk,
            String evidenceRequired,
            String mappingReason,
            Double mappingConfidence,
            String mappingSource,
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

    public record ScannerScheduleResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            UUID productProfileId,
            UUID workspaceId,
            UUID scanSourceId,
            ScanRun.ScanDepth depth,
            List<String> toolKeys,
            String branchRef,
            String runtimeTargetUrl,
            String containerImageRef,
            int intervalDays,
            LocalDateTime nextRunAt,
            LocalDateTime lastRunAt,
            UUID lastScanRunId,
            boolean active,
            String reason,
            String createdByEmail
    ) {}

    public record ConnectorPermissionResponse(
            ScanSource.ProviderType providerType,
            String label,
            String purpose,
            List<String> permissions,
            String operatingNote,
            boolean appConnectorPreferred
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
