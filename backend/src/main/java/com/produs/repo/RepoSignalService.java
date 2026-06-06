package com.produs.repo;

import com.produs.entity.User;
import com.produs.exception.ResourceNotFoundException;
import com.produs.product.ProductProfile;
import com.produs.product.ProductProfileRepository;
import com.produs.scanner.NormalizedFinding;
import com.produs.scanner.NormalizedFindingRepository;
import com.produs.scanner.ScanRun;
import com.produs.scanner.ScanRunRepository;
import com.produs.scanner.ScanSource;
import com.produs.scanner.ScanSourceRepository;
import com.produs.workspace.ProjectWorkspace;
import com.produs.workspace.ProjectWorkspaceRepository;
import com.produs.workspace.WorkspaceParticipantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RepoSignalService {

    private static final int MAX_STORED_FINDING_SIGNALS = 12;
    private static final int MAX_SAFE_TEXT = 420;

    private final RepoSignalRepository repoSignalRepository;
    private final ProductProfileRepository productProfileRepository;
    private final ProjectWorkspaceRepository workspaceRepository;
    private final WorkspaceParticipantRepository participantRepository;
    private final ScanSourceRepository scanSourceRepository;
    private final ScanRunRepository scanRunRepository;
    private final NormalizedFindingRepository findingRepository;

    @Transactional(readOnly = true)
    public RepoSignalSummaryResponse getProductSignals(User actor, UUID productId) {
        ProductProfile product = productProfileRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product profile not found"));
        requireProductOrWorkspaceRead(actor, product, null);
        return summarize(product, null, repoSignalRepository.findByProductProfileIdAndWorkspaceIsNullOrderByCreatedAtDesc(productId));
    }

    @Transactional
    public RepoSignalSummaryResponse refreshProductSignals(User actor, UUID productId) {
        ProductProfile product = productProfileRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product profile not found"));
        requireProductOrWorkspaceWrite(actor, product, null);
        repoSignalRepository.deleteByProductProfileIdAndWorkspaceIsNull(productId);
        List<RepoSignal> signals = buildSignals(
                product,
                null,
                scanSourceRepository.findByProductProfileIdOrderByCreatedAtDesc(productId),
                scanRunRepository.findByProductProfileIdOrderByCreatedAtDesc(productId),
                findingRepository.findByProductProfileIdOrderBySeverityDescCreatedAtDesc(productId)
        );
        return summarize(product, null, repoSignalRepository.saveAll(signals));
    }

    @Transactional(readOnly = true)
    public RepoSignalSummaryResponse getWorkspaceSignals(User actor, UUID workspaceId) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        ProductProfile product = workspace.getPackageInstance().getProductProfile();
        requireProductOrWorkspaceRead(actor, product, workspace);
        return summarize(product, workspace, repoSignalRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId));
    }

    @Transactional
    public RepoSignalSummaryResponse refreshWorkspaceSignals(User actor, UUID workspaceId) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        ProductProfile product = workspace.getPackageInstance().getProductProfile();
        requireProductOrWorkspaceWrite(actor, product, workspace);
        repoSignalRepository.deleteByWorkspaceId(workspaceId);
        List<RepoSignal> signals = buildSignals(
                product,
                workspace,
                scanSourceRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId),
                scanRunRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId),
                findingRepository.findByProductProfileIdAndWorkspaceIdOrderBySeverityDescCreatedAtDesc(product.getId(), workspaceId)
        );
        return summarize(product, workspace, repoSignalRepository.saveAll(signals));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> compactAiFactsForProduct(User actor, UUID productId) {
        return getProductSignals(actor, productId).aiContextFacts();
    }

    private List<RepoSignal> buildSignals(
            ProductProfile product,
            ProjectWorkspace workspace,
            List<ScanSource> sources,
            List<ScanRun> runs,
            List<NormalizedFinding> findings
    ) {
        SignalAccumulator accumulator = new SignalAccumulator(product, workspace);
        addProductProfileSignals(accumulator, product);
        addScanSourceSignals(accumulator, sources);
        addScanRunSignals(accumulator, runs);
        addFindingSignals(accumulator, findings);
        addUnknownSignals(accumulator);
        return accumulator.signals();
    }

    private void addProductProfileSignals(SignalAccumulator accumulator, ProductProfile product) {
        if (hasText(product.getRepositoryUrl())) {
            String repositoryLabel = repositoryLabel(product.getRepositoryUrl());
            accumulator.add(
                    RepoSignal.SignalType.REPOSITORY_SOURCE,
                    repositoryLabel,
                    0.92,
                    RepoSignal.SignalSource.PRODUCT_PROFILE,
                    null,
                    product.getRepositoryUrl(),
                    RepoSignal.EvidenceKind.OWNER_PROVIDED,
                    "Owner provided a repository URL for this product."
            );
        }
        if (hasText(product.getProductUrl())) {
            accumulator.add(
                    RepoSignal.SignalType.PRODUCT_URL,
                    product.getProductUrl().trim(),
                    0.88,
                    RepoSignal.SignalSource.PRODUCT_PROFILE,
                    null,
                    product.getProductUrl(),
                    RepoSignal.EvidenceKind.OWNER_PROVIDED,
                    "Owner provided an application or product URL."
            );
        }
        if (hasText(product.getTechStack())) {
            accumulator.add(
                    RepoSignal.SignalType.DECLARED_TECH_STACK,
                    safe(product.getTechStack(), 220),
                    0.72,
                    RepoSignal.SignalSource.PRODUCT_PROFILE,
                    null,
                    null,
                    RepoSignal.EvidenceKind.OWNER_PROVIDED,
                    "Owner-provided stack note. Validate with scanner or repository evidence before treating it as proven."
            );
            addStackSignals(accumulator, product.getTechStack(), RepoSignal.SignalSource.PRODUCT_PROFILE, RepoSignal.EvidenceKind.OWNER_PROVIDED);
        }
        addStackSignals(accumulator, product.getRepositoryUrl(), RepoSignal.SignalSource.BACKEND_INFERENCE, RepoSignal.EvidenceKind.INFERRED);
    }

    private void addScanSourceSignals(SignalAccumulator accumulator, List<ScanSource> sources) {
        sources.stream()
                .sorted(Comparator.comparing(ScanSource::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(6)
                .forEach(source -> {
                    String repoName = firstNonBlank(source.getExternalRepositoryFullName(), repositoryLabel(source.getExternalReference()), source.getDisplayName());
                    if (hasText(repoName)) {
                        accumulator.add(
                                RepoSignal.SignalType.REPOSITORY_SOURCE,
                                repoName,
                                source.getAuthorizationStatus() == ScanSource.AuthorizationStatus.AUTHORIZED ? 0.97 : 0.65,
                                RepoSignal.SignalSource.SCAN_SOURCE,
                                source.getProviderType().name(),
                                source.getExternalReference(),
                                source.getAuthorizationStatus() == ScanSource.AuthorizationStatus.AUTHORIZED
                                        ? RepoSignal.EvidenceKind.AUTHORIZED_CONNECTOR
                                        : RepoSignal.EvidenceKind.INFERRED,
                                "Repository source is attached through " + source.getProviderType().name() + " with status " + source.getAuthorizationStatus().name() + "."
                        );
                    }
                    accumulator.add(
                            RepoSignal.SignalType.SOURCE_AUTHORIZATION,
                            source.getProviderType().name() + " " + source.getAuthorizationStatus().name(),
                            source.getAuthorizationStatus() == ScanSource.AuthorizationStatus.AUTHORIZED ? 0.95 : 0.55,
                            RepoSignal.SignalSource.SCAN_SOURCE,
                            source.getProviderType().name(),
                            source.getExternalReference(),
                            source.getAuthorizationStatus() == ScanSource.AuthorizationStatus.AUTHORIZED
                                    ? RepoSignal.EvidenceKind.AUTHORIZED_CONNECTOR
                                    : RepoSignal.EvidenceKind.UNKNOWN,
                            "Scanner source authorization state is " + source.getAuthorizationStatus().name() + "."
                    );
                    if (hasText(source.getDefaultBranch())) {
                        accumulator.add(
                                RepoSignal.SignalType.DEFAULT_BRANCH,
                                source.getDefaultBranch().trim(),
                                0.9,
                                RepoSignal.SignalSource.SCAN_SOURCE,
                                source.getProviderType().name(),
                                source.getExternalReference(),
                                RepoSignal.EvidenceKind.AUTHORIZED_CONNECTOR,
                                "Default branch was supplied by the connected source."
                        );
                    }
                    addStackSignals(accumulator, source.getScopeNote(), RepoSignal.SignalSource.SCAN_SOURCE, RepoSignal.EvidenceKind.INFERRED);
                });
    }

    private void addScanRunSignals(SignalAccumulator accumulator, List<ScanRun> runs) {
        runs.stream()
                .sorted(Comparator.comparing(ScanRun::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(8)
                .forEach(run -> {
                    String value = run.getDepth().name() + " " + run.getStatus().name();
                    String evidence = "Scanner run " + run.getDepth().name() + " is " + run.getStatus().name().toLowerCase(Locale.ROOT) + ".";
                    if (run.getCompletedAt() != null) {
                        evidence += " Completed at " + run.getCompletedAt() + ".";
                    }
                    accumulator.add(
                            RepoSignal.SignalType.SCANNER_STATUS,
                            value,
                            run.getStatus() == ScanRun.RunStatus.COMPLETED ? 0.96 : 0.72,
                            RepoSignal.SignalSource.SCAN_RUN,
                            run.getTriggerType().name(),
                            firstNonBlank(run.getBranchRef(), run.getRuntimeTargetUrl(), run.getContainerImageRef()),
                            RepoSignal.EvidenceKind.SCANNER_RESULT,
                            evidence
                    );
                    if (hasText(run.getBranchRef())) {
                        accumulator.add(
                                RepoSignal.SignalType.DEFAULT_BRANCH,
                                run.getBranchRef().trim(),
                                0.72,
                                RepoSignal.SignalSource.SCAN_RUN,
                                run.getTriggerType().name(),
                                run.getBranchRef(),
                                RepoSignal.EvidenceKind.SCANNER_RESULT,
                                "Scanner run used branch/ref " + run.getBranchRef().trim() + "."
                        );
                    }
                    if (hasText(run.getRuntimeTargetUrl())) {
                        accumulator.add(
                                RepoSignal.SignalType.RUNTIME,
                                run.getRuntimeTargetUrl().trim(),
                                0.82,
                                RepoSignal.SignalSource.SCAN_RUN,
                                run.getTriggerType().name(),
                                run.getRuntimeTargetUrl(),
                                RepoSignal.EvidenceKind.RUNTIME_TARGET,
                                "Runtime target URL was included in scanner execution."
                        );
                    }
                    if (hasText(run.getContainerImageRef())) {
                        accumulator.add(
                                RepoSignal.SignalType.DEPLOYMENT,
                                "Container image configured",
                                0.78,
                                RepoSignal.SignalSource.SCAN_RUN,
                                run.getTriggerType().name(),
                                run.getContainerImageRef(),
                                RepoSignal.EvidenceKind.SCANNER_RESULT,
                                "Scanner run referenced a container image for deployment checks."
                        );
                    }
                    addStackSignals(accumulator, run.getScanPlan(), RepoSignal.SignalSource.SCAN_RUN, RepoSignal.EvidenceKind.INFERRED);
                });
    }

    private void addFindingSignals(SignalAccumulator accumulator, List<NormalizedFinding> findings) {
        findings.stream()
                .filter(this::isOpenFinding)
                .limit(MAX_STORED_FINDING_SIGNALS)
                .forEach(finding -> {
                    RepoSignal.SignalType signalType = signalTypeForFinding(finding);
                    String value = finding.getSeverity().name() + ": " + finding.getTitle();
                    String sourceTool = firstNonBlank(finding.getSourceTool(), finding.getSourceRuleId(), "scanner");
                    String evidence = firstNonBlank(
                            finding.getBusinessRisk(),
                            finding.getEvidenceRequired(),
                            finding.getDescription(),
                            "Scanner finding requires owner review."
                    );
                    accumulator.add(
                            signalType,
                            safe(value, 220),
                            confidenceForFinding(finding),
                            RepoSignal.SignalSource.SCANNER_FINDING,
                            sourceTool,
                            firstNonBlank(finding.getAffectedComponent(), finding.getSourceRuleId()),
                            RepoSignal.EvidenceKind.SCANNER_RESULT,
                            safe(evidence, MAX_SAFE_TEXT)
                    );
                    accumulator.add(
                            RepoSignal.SignalType.SCANNER_FINDING,
                            safe(value, 220),
                            confidenceForFinding(finding),
                            RepoSignal.SignalSource.SCANNER_FINDING,
                            sourceTool,
                            firstNonBlank(finding.getAffectedComponent(), finding.getSourceRuleId()),
                            RepoSignal.EvidenceKind.SCANNER_RESULT,
                            safe(evidence, MAX_SAFE_TEXT)
                    );
                });
    }

    private void addUnknownSignals(SignalAccumulator accumulator) {
        if (!accumulator.hasType(RepoSignal.SignalType.REPOSITORY_SOURCE)) {
            accumulator.addUnknown("Repository source is missing", "Add a GitHub/GitLab source or repository URL before trusting scanner coverage.");
        }
        if (!accumulator.hasType(RepoSignal.SignalType.SCANNER_STATUS)) {
            accumulator.addUnknown("No scanner run has been recorded", "Run a safe static scan or import CI scanner evidence to ground the diagnosis.");
        }
        if (!accumulator.hasType(RepoSignal.SignalType.CI_CD)) {
            accumulator.addUnknown("CI/CD proof is unknown", "ProdUS has not seen build/test/deploy pipeline evidence yet.");
        }
        if (!accumulator.hasType(RepoSignal.SignalType.TESTING)) {
            accumulator.addUnknown("Test coverage proof is unknown", "No test strategy, coverage, or test execution evidence has been detected.");
        }
        if (!accumulator.hasType(RepoSignal.SignalType.DEPLOYMENT)) {
            accumulator.addUnknown("Deployment path is unknown", "No repeatable deployment, container, or release target evidence has been detected.");
        }
    }

    private RepoSignalSummaryResponse summarize(ProductProfile product, ProjectWorkspace workspace, List<RepoSignal> signals) {
        List<RepoSignalResponse> responses = signals.stream()
                .sorted(Comparator.comparing(RepoSignal::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toResponse)
                .toList();
        List<RepoSignalResponse> stack = responses.stream().filter(this::isStackSignal).toList();
        List<RepoSignalResponse> scannerFacts = responses.stream().filter(this::isScannerFact).toList();
        List<RepoSignalResponse> unknowns = responses.stream().filter(signal -> signal.signalType() == RepoSignal.SignalType.UNKNOWN).toList();
        String sourceStatus = sourceStatus(responses);
        List<String> nextActions = nextActions(responses, unknowns);
        return new RepoSignalSummaryResponse(
                product.getId(),
                workspace == null ? null : workspace.getId(),
                latestDetectedAt(signals),
                sourceStatus,
                responses,
                stack,
                scannerFacts,
                unknowns,
                nextActions,
                aiContextFacts(product, workspace, sourceStatus, responses, stack, scannerFacts, unknowns, nextActions)
        );
    }

    private RepoSignalResponse toResponse(RepoSignal signal) {
        return new RepoSignalResponse(
                signal.getId(),
                signal.getCreatedAt(),
                signal.getUpdatedAt(),
                signal.getSignalType(),
                signal.getSignalValue(),
                signal.getConfidence(),
                signal.getSource(),
                signal.getSourceTool(),
                signal.getSourcePath(),
                signal.getEvidenceKind(),
                signal.getOwnerSafeEvidence(),
                signal.getDetectedAt()
        );
    }

    private Map<String, Object> aiContextFacts(
            ProductProfile product,
            ProjectWorkspace workspace,
            String sourceStatus,
            List<RepoSignalResponse> signals,
            List<RepoSignalResponse> stack,
            List<RepoSignalResponse> scannerFacts,
            List<RepoSignalResponse> unknowns,
            List<String> nextActions
    ) {
        Map<String, Object> facts = new LinkedHashMap<>();
        facts.put("productId", product.getId());
        facts.put("workspaceId", workspace == null ? null : workspace.getId());
        facts.put("productName", product.getName());
        facts.put("sourceStatus", sourceStatus);
        facts.put("repository", firstSignalValue(signals, RepoSignal.SignalType.REPOSITORY_SOURCE));
        facts.put("defaultBranch", firstSignalValue(signals, RepoSignal.SignalType.DEFAULT_BRANCH));
        facts.put("runtimeTarget", firstSignalValue(signals, RepoSignal.SignalType.RUNTIME));
        facts.put("detectedStack", stack.stream().map(RepoSignalResponse::signalValue).distinct().limit(10).toList());
        facts.put("scannerFacts", scannerFacts.stream().map(this::safeAiFact).limit(12).toList());
        facts.put("unknowns", unknowns.stream().map(RepoSignalResponse::signalValue).distinct().limit(8).toList());
        facts.put("nextActions", nextActions);
        return facts;
    }

    private Map<String, Object> safeAiFact(RepoSignalResponse signal) {
        Map<String, Object> fact = new LinkedHashMap<>();
        fact.put("type", signal.signalType().name());
        fact.put("value", signal.signalValue());
        fact.put("confidence", signal.confidence());
        fact.put("evidenceKind", signal.evidenceKind().name());
        fact.put("ownerSafeEvidence", signal.ownerSafeEvidence());
        return fact;
    }

    private List<String> nextActions(List<RepoSignalResponse> signals, List<RepoSignalResponse> unknowns) {
        List<String> actions = new ArrayList<>();
        Set<String> unknownValues = unknowns.stream().map(RepoSignalResponse::signalValue).collect(LinkedHashSet::new, Set::add, Set::addAll);
        if (unknownValues.contains("Repository source is missing")) {
            actions.add("Attach the repository source so ProdUS can ground the readiness diagnosis.");
        }
        if (unknownValues.contains("No scanner run has been recorded")) {
            actions.add("Run a safe static scanner or import CI evidence before choosing final lifecycle services.");
        }
        if (unknownValues.contains("CI/CD proof is unknown") || unknownValues.contains("Deployment path is unknown")) {
            actions.add("Add CI/CD and deployment proof before opening a production workspace.");
        }
        boolean hasCriticalOrHigh = signals.stream()
                .filter(signal -> signal.signalType() == RepoSignal.SignalType.SCANNER_FINDING || signal.signalType() == RepoSignal.SignalType.SECURITY)
                .anyMatch(signal -> containsAny(signal.signalValue(), "CRITICAL", "HIGH"));
        if (hasCriticalOrHigh) {
            actions.add("Review critical/high scanner findings and map them to the service plan.");
        }
        if (actions.isEmpty()) {
            actions.add(signals.isEmpty()
                    ? "Refresh the repo readout after adding a repository or running a scanner."
                    : "Use these repo facts to refine diagnosis, selected services, and scanner focus areas.");
        }
        return actions.stream().distinct().toList();
    }

    private String sourceStatus(List<RepoSignalResponse> signals) {
        if (signals.isEmpty()) {
            return "NOT_REFRESHED";
        }
        boolean authorized = signals.stream()
                .anyMatch(signal -> signal.signalType() == RepoSignal.SignalType.SOURCE_AUTHORIZATION
                        && containsAny(signal.signalValue(), "AUTHORIZED"));
        if (authorized) {
            return "AUTHORIZED_SOURCE";
        }
        boolean ownerProvided = signals.stream().anyMatch(signal -> signal.signalType() == RepoSignal.SignalType.REPOSITORY_SOURCE);
        return ownerProvided ? "OWNER_PROVIDED_SOURCE" : "SOURCE_UNKNOWN";
    }

    private LocalDateTime latestDetectedAt(List<RepoSignal> signals) {
        return signals.stream()
                .map(RepoSignal::getDetectedAt)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);
    }

    private boolean isStackSignal(RepoSignalResponse signal) {
        return signal.signalType() == RepoSignal.SignalType.DECLARED_TECH_STACK
                || signal.signalType() == RepoSignal.SignalType.LANGUAGE
                || signal.signalType() == RepoSignal.SignalType.FRAMEWORK
                || signal.signalType() == RepoSignal.SignalType.DATABASE
                || signal.signalType() == RepoSignal.SignalType.AUTH;
    }

    private boolean isScannerFact(RepoSignalResponse signal) {
        return signal.signalType() == RepoSignal.SignalType.SCANNER_STATUS
                || signal.signalType() == RepoSignal.SignalType.SCANNER_FINDING
                || signal.signalType() == RepoSignal.SignalType.SECURITY
                || signal.signalType() == RepoSignal.SignalType.CI_CD
                || signal.signalType() == RepoSignal.SignalType.TESTING
                || signal.signalType() == RepoSignal.SignalType.DEPLOYMENT
                || signal.signalType() == RepoSignal.SignalType.DEPENDENCY
                || signal.signalType() == RepoSignal.SignalType.RUNTIME
                || signal.signalType() == RepoSignal.SignalType.DOCUMENTATION
                || signal.signalType() == RepoSignal.SignalType.REPOSITORY_SOURCE
                || signal.signalType() == RepoSignal.SignalType.SOURCE_AUTHORIZATION
                || signal.signalType() == RepoSignal.SignalType.DEFAULT_BRANCH;
    }

    private void addStackSignals(SignalAccumulator accumulator, String text, RepoSignal.SignalSource source, RepoSignal.EvidenceKind evidenceKind) {
        if (!hasText(text)) {
            return;
        }
        String lower = text.toLowerCase(Locale.ROOT);
        addIfContains(accumulator, lower, source, evidenceKind, RepoSignal.SignalType.LANGUAGE, "Java", "java", "spring");
        addIfContains(accumulator, lower, source, evidenceKind, RepoSignal.SignalType.LANGUAGE, "TypeScript", "typescript", "tsx", "next.js", "nextjs");
        addIfContains(accumulator, lower, source, evidenceKind, RepoSignal.SignalType.LANGUAGE, "Python", "python", "fastapi", "django");
        addIfContains(accumulator, lower, source, evidenceKind, RepoSignal.SignalType.FRAMEWORK, "Spring Boot", "spring boot", "spring-boot");
        addIfContains(accumulator, lower, source, evidenceKind, RepoSignal.SignalType.FRAMEWORK, "Next.js", "next.js", "nextjs");
        addIfContains(accumulator, lower, source, evidenceKind, RepoSignal.SignalType.FRAMEWORK, "React", "react", "tsx");
        addIfContains(accumulator, lower, source, evidenceKind, RepoSignal.SignalType.DATABASE, "PostgreSQL", "postgres", "postgresql");
        addIfContains(accumulator, lower, source, evidenceKind, RepoSignal.SignalType.DATABASE, "Supabase", "supabase");
        addIfContains(accumulator, lower, source, evidenceKind, RepoSignal.SignalType.AUTH, "Supabase Auth", "supabase auth");
        addIfContains(accumulator, lower, source, evidenceKind, RepoSignal.SignalType.AUTH, "JWT/Auth", "jwt", "oauth", "oidc", "auth");
        addIfContains(accumulator, lower, source, evidenceKind, RepoSignal.SignalType.CI_CD, "GitHub Actions", "github actions", ".github/workflows", "ci/cd", "pipeline");
        addIfContains(accumulator, lower, source, evidenceKind, RepoSignal.SignalType.TESTING, "Test evidence", "jest", "playwright", "junit", "pytest", "coverage", "test");
        addIfContains(accumulator, lower, source, evidenceKind, RepoSignal.SignalType.DEPLOYMENT, "Docker/deployment path", "docker", "dockerfile", "deploy", "coolify", "railway");
        addIfContains(accumulator, lower, source, evidenceKind, RepoSignal.SignalType.DOCUMENTATION, "Documentation evidence", "readme", "docs/", "runbook", "brd");
    }

    private void addIfContains(
            SignalAccumulator accumulator,
            String haystack,
            RepoSignal.SignalSource source,
            RepoSignal.EvidenceKind evidenceKind,
            RepoSignal.SignalType type,
            String value,
            String... needles
    ) {
        if (containsAny(haystack, needles)) {
            accumulator.add(type, value, 0.7, source, null, null, evidenceKind, "Detected from bounded owner-safe metadata and scanner context.");
        }
    }

    private RepoSignal.SignalType signalTypeForFinding(NormalizedFinding finding) {
        String text = lower(firstNonBlank(finding.getFindingCategory(), finding.getReadinessArea(), finding.getTitle(), finding.getDescription(), finding.getSourceRuleId(), finding.getSourceTool()));
        if (containsAny(text, "secret", "auth", "token", "credential", "security", "vulnerab", "cve")) {
            return RepoSignal.SignalType.SECURITY;
        }
        if (containsAny(text, "test", "coverage", "qa", "assertion")) {
            return RepoSignal.SignalType.TESTING;
        }
        if (containsAny(text, "deploy", "release", "container", "runtime", "staging")) {
            return RepoSignal.SignalType.DEPLOYMENT;
        }
        if (containsAny(text, "ci", "pipeline", "workflow", "build")) {
            return RepoSignal.SignalType.CI_CD;
        }
        if (containsAny(text, "dependency", "dependencies", "supply", "package", "npm", "maven")) {
            return RepoSignal.SignalType.DEPENDENCY;
        }
        if (containsAny(text, "monitor", "observability", "alert", "log")) {
            return RepoSignal.SignalType.RUNTIME;
        }
        if (containsAny(text, "doc", "runbook", "readme")) {
            return RepoSignal.SignalType.DOCUMENTATION;
        }
        return RepoSignal.SignalType.SCANNER_FINDING;
    }

    private double confidenceForFinding(NormalizedFinding finding) {
        if (finding.getSeverity() == NormalizedFinding.FindingSeverity.CRITICAL || finding.getSeverity() == NormalizedFinding.FindingSeverity.HIGH) {
            return 0.92;
        }
        if (finding.getSeverity() == NormalizedFinding.FindingSeverity.MEDIUM) {
            return 0.84;
        }
        return 0.72;
    }

    private boolean isOpenFinding(NormalizedFinding finding) {
        return finding.getStatus() == NormalizedFinding.FindingStatus.NEW
                || finding.getStatus() == NormalizedFinding.FindingStatus.OPEN
                || finding.getStatus() == NormalizedFinding.FindingStatus.REGRESSED
                || finding.getStatus() == NormalizedFinding.FindingStatus.INSUFFICIENT_EVIDENCE;
    }

    private String firstSignalValue(List<RepoSignalResponse> signals, RepoSignal.SignalType type) {
        return signals.stream()
                .filter(signal -> signal.signalType() == type)
                .map(RepoSignalResponse::signalValue)
                .filter(this::hasText)
                .findFirst()
                .orElse(null);
    }

    private void requireProductOrWorkspaceRead(User actor, ProductProfile product, ProjectWorkspace workspace) {
        if (actor.getRole() == User.UserRole.ADMIN || product.getOwner().getId().equals(actor.getId())) {
            return;
        }
        if (workspace != null && participantRepository.existsByWorkspaceIdAndUserIdAndActiveTrue(workspace.getId(), actor.getId())) {
            return;
        }
        throw new AccessDeniedException("Repo signals are not available to this user");
    }

    private void requireProductOrWorkspaceWrite(User actor, ProductProfile product, ProjectWorkspace workspace) {
        if (actor.getRole() == User.UserRole.ADMIN || product.getOwner().getId().equals(actor.getId())) {
            return;
        }
        if (workspace != null && participantRepository.existsByWorkspaceIdAndUserIdAndActiveTrue(workspace.getId(), actor.getId())) {
            return;
        }
        throw new AccessDeniedException("Repo signals cannot be refreshed by this user");
    }

    private String repositoryLabel(String value) {
        if (!hasText(value)) {
            return "";
        }
        String trimmed = value.trim();
        try {
            URI uri = URI.create(trimmed);
            String host = uri.getHost();
            String path = uri.getPath();
            if (hasText(host) && hasText(path)) {
                String normalizedPath = path.replaceFirst("^/", "").replaceFirst("\\.git$", "");
                if (host.contains("github.com") || host.contains("gitlab.com")) {
                    String[] parts = normalizedPath.split("/");
                    if (parts.length >= 2) {
                        return parts[0] + "/" + parts[1];
                    }
                }
                return host + "/" + normalizedPath;
            }
        } catch (IllegalArgumentException ignored) {
            // Keep the raw label below when the owner entered a non-URL repository reference.
        }
        return trimmed;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (hasText(value)) {
                return value.trim();
            }
        }
        return "";
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String safe(String value, int maxLength) {
        if (!hasText(value)) {
            return "";
        }
        String cleaned = value.replaceAll("[\\r\\n\\t]+", " ").replaceAll("\\s{2,}", " ").trim();
        if (cleaned.length() <= maxLength) {
            return cleaned;
        }
        return cleaned.substring(0, Math.max(0, maxLength - 1)).trim() + "…";
    }

    private String lower(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }

    private boolean containsAny(String value, String... needles) {
        if (!hasText(value)) {
            return false;
        }
        String lower = value.toLowerCase(Locale.ROOT);
        for (String needle : needles) {
            if (needle != null && !needle.isBlank() && lower.contains(needle.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private final class SignalAccumulator {
        private final ProductProfile product;
        private final ProjectWorkspace workspace;
        private final List<RepoSignal> signals = new ArrayList<>();
        private final Set<String> keys = new LinkedHashSet<>();

        private SignalAccumulator(ProductProfile product, ProjectWorkspace workspace) {
            this.product = product;
            this.workspace = workspace;
        }

        private void add(
                RepoSignal.SignalType type,
                String value,
                double confidence,
                RepoSignal.SignalSource source,
                String sourceTool,
                String sourcePath,
                RepoSignal.EvidenceKind evidenceKind,
                String ownerSafeEvidence
        ) {
            if (!hasText(value)) {
                return;
            }
            String normalizedValue = safe(value, 500);
            String key = type.name() + "::" + normalizedValue.toLowerCase(Locale.ROOT);
            if (!keys.add(key)) {
                return;
            }
            RepoSignal signal = new RepoSignal();
            signal.setProductProfile(product);
            signal.setWorkspace(workspace);
            signal.setSignalType(type);
            signal.setSignalValue(normalizedValue);
            signal.setConfidence(Math.max(0.0, Math.min(1.0, confidence)));
            signal.setSource(source);
            signal.setSourceTool(hasText(sourceTool) ? safe(sourceTool, 255) : null);
            signal.setSourcePath(hasText(sourcePath) ? safe(sourcePath, 1000) : null);
            signal.setEvidenceKind(evidenceKind);
            signal.setOwnerSafeEvidence(safe(ownerSafeEvidence, MAX_SAFE_TEXT));
            signal.setDetectedAt(LocalDateTime.now());
            signals.add(signal);
        }

        private void addUnknown(String value, String evidence) {
            add(
                    RepoSignal.SignalType.UNKNOWN,
                    value,
                    0.4,
                    RepoSignal.SignalSource.BACKEND_INFERENCE,
                    null,
                    null,
                    RepoSignal.EvidenceKind.UNKNOWN,
                    evidence
            );
        }

        private boolean hasType(RepoSignal.SignalType type) {
            return signals.stream().anyMatch(signal -> signal.getSignalType() == type);
        }

        private List<RepoSignal> signals() {
            return signals;
        }
    }

    public record RepoSignalResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            RepoSignal.SignalType signalType,
            String signalValue,
            double confidence,
            RepoSignal.SignalSource source,
            String sourceTool,
            String sourcePath,
            RepoSignal.EvidenceKind evidenceKind,
            String ownerSafeEvidence,
            LocalDateTime detectedAt
    ) {
    }

    public record RepoSignalSummaryResponse(
            UUID productId,
            UUID workspaceId,
            LocalDateTime refreshedAt,
            String sourceStatus,
            List<RepoSignalResponse> signals,
            List<RepoSignalResponse> detectedStack,
            List<RepoSignalResponse> scannerFacts,
            List<RepoSignalResponse> unknowns,
            List<String> nextActions,
            Map<String, Object> aiContextFacts
    ) {
    }
}
