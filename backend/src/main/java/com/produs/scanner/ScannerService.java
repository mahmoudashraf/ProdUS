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
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
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
    private final ScannerEvidenceItemRepository evidenceRepository;
    private final NormalizedFindingRepository findingRepository;
    private final S3Service s3Service;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

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
                toolRun.getToolVersion(),
                toolRun.getStatus(),
                toolRun.getStartedAt(),
                toolRun.getCompletedAt(),
                toolRun.getRawArtifactRef(),
                toolRun.getStorageKey(),
                toolRun.getNormalizedCount(),
                toolRun.getErrorSummary()
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

    public record FindingStatusRequest(
            @NotNull NormalizedFinding.FindingStatus status,
            String reason,
            LocalDate reviewDueOn
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
            List<ToolRunResponse> toolRuns
    ) {}

    public record ToolRunResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            UUID scanRunId,
            String toolName,
            String toolVersion,
            ToolRun.ToolStatus status,
            LocalDateTime startedAt,
            LocalDateTime completedAt,
            String rawArtifactRef,
            String storageKey,
            int normalizedCount,
            String errorSummary
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
