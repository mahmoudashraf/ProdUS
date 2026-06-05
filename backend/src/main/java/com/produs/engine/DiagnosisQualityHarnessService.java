package com.produs.engine;

import com.produs.catalog.ServiceModule;
import com.produs.catalog.ServiceModuleRepository;
import com.produs.scanner.NormalizedFinding;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DiagnosisQualityHarnessService {

    private static final List<String> GENERIC_PHRASES = List.of(
            "follow best practices",
            "improve security",
            "add tests",
            "optimize performance",
            "consider monitoring",
            "review the code",
            "make it scalable",
            "production ready",
            "no specific evidence",
            "general recommendation"
    );

    private final ScannerFindingClassifier scannerFindingClassifier;
    private final ServiceModuleRepository serviceModuleRepository;

    public List<FixtureSummary> fixtures() {
        return fixtureDefinitions().stream()
                .map(fixture -> new FixtureSummary(
                        fixture.id(),
                        fixture.name(),
                        fixture.sourceApp(),
                        fixture.prototypeType(),
                        fixture.description(),
                        fixture.findings().size(),
                        fixture.expectedServiceCodes(),
                        fixture.expectedReadinessAreas()
                ))
                .toList();
    }

    public HarnessRunResponse run(HarnessRunRequest request) {
        Set<String> requestedIds = request == null || request.fixtureIds() == null
                ? Set.of()
                : new HashSet<>(request.fixtureIds());
        boolean includeBadExamples = request == null || !Boolean.FALSE.equals(request.includeBadExamples());
        List<FixtureDefinition> selected = fixtureDefinitions().stream()
                .filter(fixture -> requestedIds.isEmpty() || requestedIds.contains(fixture.id()))
                .toList();
        if (!requestedIds.isEmpty() && selected.size() != requestedIds.size()) {
            Set<String> known = new HashSet<>(selected.stream().map(FixtureDefinition::id).toList());
            List<String> missing = requestedIds.stream().filter(id -> !known.contains(id)).sorted().toList();
            if (!missing.isEmpty()) {
                throw new IllegalArgumentException("Unknown diagnosis quality fixture(s): " + String.join(", ", missing));
            }
        }

        List<FixtureRunResult> results = selected.stream()
                .map(fixture -> evaluateFixture(fixture, includeBadExamples))
                .toList();
        int averageScore = results.isEmpty()
                ? 0
                : (int) Math.round(results.stream().mapToInt(FixtureRunResult::overallScore).average().orElse(0));
        int passCount = (int) results.stream().filter(result -> result.status() == HarnessStatus.PASS).count();
        int warnCount = (int) results.stream().filter(result -> result.status() == HarnessStatus.WARN).count();
        int failCount = (int) results.stream().filter(result -> result.status() == HarnessStatus.FAIL).count();
        int totalExpectedServices = results.stream().mapToInt(result -> result.expectedServiceCodes().size()).sum();
        int totalMatchedServices = results.stream().mapToInt(result -> result.matchedServiceCodes().size()).sum();
        int unresolvedCatalogCodes = results.stream().mapToInt(result -> result.unresolvedCatalogCodes().size()).sum();

        HarnessStatus status = failCount > 0 ? HarnessStatus.FAIL : warnCount > 0 ? HarnessStatus.WARN : HarnessStatus.PASS;
        return new HarnessRunResponse(
                LocalDateTime.now(),
                status,
                averageScore,
                passCount,
                warnCount,
                failCount,
                totalExpectedServices,
                totalMatchedServices,
                unresolvedCatalogCodes,
                selected.size(),
                results,
                nextActions(results)
        );
    }

    private FixtureRunResult evaluateFixture(FixtureDefinition fixture, boolean includeBadExamples) {
        List<FindingRunResult> findingResults = fixture.findings().stream()
                .map(this::evaluateFinding)
                .toList();

        Set<String> actualCategories = new HashSet<>();
        Set<String> actualReadinessAreas = new HashSet<>();
        Set<String> actualServiceCodes = new HashSet<>();
        Set<String> matchedServiceCodes = new HashSet<>();
        Set<String> unresolvedCatalogCodes = new HashSet<>();
        for (FindingRunResult result : findingResults) {
            actualCategories.add(result.actualCategory());
            if (result.actualReadinessArea() != null && !result.actualReadinessArea().isBlank()) {
                actualReadinessAreas.add(result.actualReadinessArea());
            }
            if (result.actualServiceCode() != null && !result.actualServiceCode().isBlank()) {
                actualServiceCodes.add(result.actualServiceCode());
                if (result.catalogResolved()) {
                    matchedServiceCodes.add(result.actualServiceCode());
                } else {
                    unresolvedCatalogCodes.add(result.actualServiceCode());
                }
            }
        }

        int categoryScore = percent(
                (int) findingResults.stream().filter(FindingRunResult::categoryMatched).count(),
                findingResults.size()
        );
        int serviceMappingScore = percent(
                (int) fixture.expectedServiceCodes().stream().filter(actualServiceCodes::contains).count(),
                fixture.expectedServiceCodes().size()
        );
        int expectedServiceMatches = (int) fixture.expectedServiceCodes().stream().filter(actualServiceCodes::contains).count();
        int resolvedExpectedServiceMatches = (int) fixture.expectedServiceCodes().stream().filter(matchedServiceCodes::contains).count();
        int catalogResolutionScore = percent(
                resolvedExpectedServiceMatches,
                expectedServiceMatches
        );
        String generatedDiagnosis = generatedDiagnosis(fixture, findingResults);
        List<String> genericIssues = genericDiagnosisIssues(generatedDiagnosis, fixture);
        int nonGenericScore = Math.max(0, 100 - (genericIssues.size() * 18));
        int specificityScore = specificityScore(generatedDiagnosis, fixture.requiredKeywords());
        List<BadDiagnosisResult> badDiagnosisResults = includeBadExamples
                ? fixture.badDiagnosisExamples().stream()
                        .map(example -> {
                            List<String> issues = genericDiagnosisIssues(example, fixture);
                            return new BadDiagnosisResult(example, issues.size() >= 2, issues);
                        })
                        .toList()
                : List.of();
        int badExampleScore = badDiagnosisResults.isEmpty()
                ? 100
                : percent((int) badDiagnosisResults.stream().filter(BadDiagnosisResult::caught).count(), badDiagnosisResults.size());
        int overallScore = weightedAverage(Map.of(
                "category", new WeightedScore(categoryScore, 22),
                "service", new WeightedScore(serviceMappingScore, 26),
                "catalog", new WeightedScore(catalogResolutionScore, 14),
                "specificity", new WeightedScore(specificityScore, 18),
                "nonGeneric", new WeightedScore(nonGenericScore, 12),
                "badExamples", new WeightedScore(badExampleScore, 8)
        ));
        HarnessStatus status = overallScore >= 86 && unresolvedCatalogCodes.isEmpty()
                ? HarnessStatus.PASS
                : overallScore >= 72
                        ? HarnessStatus.WARN
                        : HarnessStatus.FAIL;

        return new FixtureRunResult(
                fixture.id(),
                fixture.name(),
                fixture.sourceApp(),
                fixture.prototypeType(),
                status,
                overallScore,
                categoryScore,
                serviceMappingScore,
                catalogResolutionScore,
                specificityScore,
                nonGenericScore,
                badExampleScore,
                fixture.expectedServiceCodes(),
                fixture.expectedReadinessAreas(),
                actualServiceCodes.stream().sorted().toList(),
                actualReadinessAreas.stream().sorted().toList(),
                matchedServiceCodes.stream().sorted().toList(),
                unresolvedCatalogCodes.stream().sorted().toList(),
                generatedDiagnosis,
                genericIssues,
                findingResults,
                badDiagnosisResults,
                fixture.recommendedReviewerNotes()
        );
    }

    private FindingRunResult evaluateFinding(FindingFixture finding) {
        NormalizedFinding normalizedFinding = new NormalizedFinding();
        normalizedFinding.setSourceTool(finding.sourceTool());
        normalizedFinding.setSourceRuleId(finding.sourceRuleId());
        normalizedFinding.setTitle(finding.title());
        normalizedFinding.setDescription(finding.description());
        normalizedFinding.setSeverity(finding.severity());
        normalizedFinding.setAffectedComponent(finding.affectedComponent());

        ScannerFindingClassifier.ScannerFindingClassification classification = scannerFindingClassifier.classify(normalizedFinding);
        Optional<ServiceModule> resolvedModule = resolveServiceModule(classification.serviceModuleCode());
        boolean categoryMatched = finding.expectedCategory().equals(classification.category());
        boolean serviceMatched = finding.expectedServiceCode() == null
                ? classification.serviceModuleCode() == null
                : finding.expectedServiceCode().equals(classification.serviceModuleCode());
        return new FindingRunResult(
                finding.title(),
                finding.sourceTool(),
                finding.severity().name(),
                finding.expectedCategory(),
                classification.category(),
                categoryMatched,
                finding.expectedServiceCode(),
                classification.serviceModuleCode(),
                serviceMatched,
                resolvedModule.isPresent(),
                resolvedModule.map(ServiceModule::getName).orElse(null),
                classification.readinessArea(),
                classification.businessRisk(),
                classification.evidenceRequired(),
                classification.mappingReason(),
                classification.confidence()
        );
    }

    private Optional<ServiceModule> resolveServiceModule(String serviceModuleCode) {
        if (serviceModuleCode == null || serviceModuleCode.isBlank()) {
            return Optional.empty();
        }
        String fallbackSlug = serviceModuleCode.contains(".")
                ? serviceModuleCode.substring(serviceModuleCode.indexOf('.') + 1).replace('_', '-')
                : serviceModuleCode.replace('_', '-');
        Optional<ServiceModule> byCode = serviceModuleRepository.findByStableCode(serviceModuleCode);
        return byCode.isPresent() ? byCode : serviceModuleRepository.findBySlug(fallbackSlug);
    }

    private String generatedDiagnosis(FixtureDefinition fixture, List<FindingRunResult> findingResults) {
        List<String> risks = findingResults.stream()
                .sorted(Comparator.comparing(FindingRunResult::severity).reversed())
                .limit(4)
                .map(result -> result.actualReadinessArea() + ": " + result.businessRisk())
                .toList();
        List<String> services = findingResults.stream()
                .map(FindingRunResult::actualServiceCode)
                .filter(code -> code != null && !code.isBlank())
                .distinct()
                .toList();
        List<String> proof = findingResults.stream()
                .map(FindingRunResult::evidenceRequired)
                .filter(value -> value != null && !value.isBlank())
                .limit(3)
                .toList();
        return "Prototype fixture " + fixture.name() + " from " + fixture.sourceApp()
                + " is a " + fixture.prototypeType() + " for " + fixture.targetUsers() + ". "
                + "Detected project signals: " + String.join(", ", fixture.requiredKeywords()) + ". "
                + "Top production blockers: " + String.join(" | ", risks) + ". "
                + "Recommended ProdUS service modules: " + String.join(", ", services) + ". "
                + "Proof needed before launch: " + String.join(" | ", proof) + ".";
    }

    private List<String> genericDiagnosisIssues(String text, FixtureDefinition fixture) {
        List<String> issues = new ArrayList<>();
        String normalized = normalize(text);
        if (normalized.length() < 220) {
            issues.add("Too short to explain the prototype, evidence, service path, and proof needed.");
        }
        long vaguePhraseCount = GENERIC_PHRASES.stream().filter(phrase -> normalized.contains(normalize(phrase))).count();
        if (vaguePhraseCount >= 2) {
            issues.add("Uses multiple generic readiness phrases without enough concrete project evidence.");
        }
        if (!containsAny(normalized, fixture.requiredKeywords())) {
            issues.add("Does not mention fixture-specific product, repo, domain, or scanner terms.");
        }
        if (!containsAny(normalized, fixture.expectedServiceCodes())) {
            issues.add("Does not mention expected catalog service module codes.");
        }
        if (!containsAny(normalized, fixture.expectedReadinessAreas())) {
            issues.add("Does not mention expected readiness areas.");
        }
        if (!normalized.contains("proof") && !normalized.contains("evidence")) {
            issues.add("Does not explain proof or evidence needed before launch.");
        }
        return issues;
    }

    private int specificityScore(String diagnosisText, List<String> requiredKeywords) {
        return percent((int) requiredKeywords.stream().filter(keyword -> normalize(diagnosisText).contains(normalize(keyword))).count(), requiredKeywords.size());
    }

    private List<String> nextActions(List<FixtureRunResult> results) {
        List<String> actions = new ArrayList<>();
        long failed = results.stream().filter(result -> result.status() == HarnessStatus.FAIL).count();
        long unresolved = results.stream().mapToLong(result -> result.unresolvedCatalogCodes().size()).sum();
        long unmapped = results.stream()
                .flatMap(result -> result.findings().stream())
                .filter(result -> "UNMAPPED".equals(result.actualCategory()))
                .count();
        if (failed > 0) {
            actions.add("Review failed fixtures before changing scanner prompts or catalog mapping.");
        }
        if (unresolved > 0) {
            actions.add("Seed or alias missing service module codes so recommendations can be stored safely.");
        }
        if (unmapped > 0) {
            actions.add("Add classifier rules for unmapped scanner signals or document why they require human review.");
        }
        actions.add("Run this harness before staging demos that claim prototype-to-production diagnosis quality.");
        return actions;
    }

    private static int percent(int numerator, int denominator) {
        if (denominator <= 0) {
            return 100;
        }
        int raw = (int) Math.round((numerator * 100.0) / denominator);
        return Math.max(0, Math.min(100, raw));
    }

    private static int weightedAverage(Map<String, WeightedScore> scores) {
        int weighted = scores.values().stream().mapToInt(score -> score.score() * score.weight()).sum();
        int weight = scores.values().stream().mapToInt(WeightedScore::weight).sum();
        return weight == 0 ? 0 : Math.round((float) weighted / weight);
    }

    private static boolean containsAny(String normalizedText, List<String> values) {
        return values.stream()
                .map(DiagnosisQualityHarnessService::normalize)
                .filter(value -> !value.isBlank())
                .anyMatch(normalizedText::contains);
    }

    private static String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.toLowerCase(Locale.ROOT).replace('_', ' ').replace('-', ' ');
    }

    private static List<FixtureDefinition> fixtureDefinitions() {
        return List.of(
                new FixtureDefinition(
                        "ecommerce-launch-risk",
                        "E-commerce checkout launch risk",
                        "Real_Apps/ecommerce-store",
                        "startup commerce MVP",
                        "A small commerce app with checkout, order APIs, and runtime orchestration that needs a safe customer pilot.",
                        "founder-led commerce team",
                        List.of("cloud.monitoring_setup", "cloud.cicd_setup", "scale.performance_audit", "security.api_review"),
                        List.of("Monitoring and operations", "Release pipeline", "Performance and scale", "API and integration security"),
                        List.of("checkout", "orders", "commerce", "monitoring", "pipeline", "performance", "webhook"),
                        List.of(
                                finding("Datadog", "monitoring-gap", "No alerts configured for checkout failures", "Order and payment failures have no alert route or incident owner.", NormalizedFinding.FindingSeverity.HIGH, "checkout worker", "MONITORING_GAP", "cloud.monitoring_setup"),
                                finding("GitHub Actions", "workflow-no-gates", "Checkout release workflow has no required checks", "CI/CD pipeline does not gate production deployment for cart and order APIs.", NormalizedFinding.FindingSeverity.HIGH, ".github/workflows/deploy.yml", "RELEASE_PIPELINE_GAP", "cloud.cicd_setup"),
                                finding("Lighthouse", "lighthouse-performance", "Checkout page is slower than pilot threshold", "Largest Contentful Paint is slow and bundle size blocks conversion readiness.", NormalizedFinding.FindingSeverity.MEDIUM, "frontend checkout", "PERFORMANCE_READINESS", "scale.performance_audit"),
                                finding("Semgrep", "webhook-signature", "Payment webhook lacks signature verification", "Webhook endpoint accepts provider payloads without verification.", NormalizedFinding.FindingSeverity.CRITICAL, "/api/payments/webhook", "API_SECURITY", "security.api_review")
                        ),
                        List.of(
                                "The app should improve security and add tests before production.",
                                "Review the code, optimize performance, and follow best practices for launch."
                        ),
                        "Focus on whether checkout risk is described as customer-impacting, not only technical debt."
                ),
                new FixtureDefinition(
                        "ai-support-action-bot",
                        "IT support action bot readiness",
                        "Real_Apps/it-support-action-bot",
                        "AI-built internal support prototype",
                        "An action bot that can create, assign, close, and escalate support tickets through provider-only orchestration.",
                        "ops lead and support agents",
                        List.of("security.auth_review", "security.api_review", "quality.test_strategy", "launch.readiness_review"),
                        List.of("Authentication and access control", "API and integration security", "Testing and quality", "Launch readiness"),
                        List.of("ticket", "agent", "support", "action bot", "rbac", "webhook", "runbook"),
                        List.of(
                                finding("Semgrep", "rbac-missing", "Ticket action endpoint does not verify agent role", "Authentication and authorization checks are missing before ticket close and escalation actions.", NormalizedFinding.FindingSeverity.CRITICAL, "/api/tickets/actions", "AUTH_ACCESS_CONTROL", "security.auth_review"),
                                finding("Semgrep", "rate-limit", "Action API has no rate limiting", "API automation path can be abused by repeated create or escalate requests.", NormalizedFinding.FindingSeverity.HIGH, "/api/actions/execute", "API_SECURITY", "security.api_review"),
                                finding("JUnit", "coverage-gap", "No tests cover ticket escalation workflow", "Critical support handoff flow has no automated test or acceptance proof.", NormalizedFinding.FindingSeverity.MEDIUM, "TicketActionService", "TESTING_GAP", "quality.test_strategy"),
                                finding("Runbook", "handoff-missing", "Support runbook missing operator rollback steps", "Launch documentation does not explain safe recovery from mistaken action execution.", NormalizedFinding.FindingSeverity.MEDIUM, "README", "LAUNCH_READINESS_GAP", "launch.readiness_review")
                        ),
                        List.of(
                                "This bot is close to production. Add tests and review permissions.",
                                "Make the system scalable and secure with standard best practices."
                        ),
                        "The diagnosis must connect action execution to role safety and operator recovery."
                ),
                new FixtureDefinition(
                        "smart-faq-rag-mvp",
                        "Smart FAQ assistant pilot",
                        "Real_Apps/smart-faq-assistant",
                        "AI FAQ prototype",
                        "A FAQ assistant with local search and optional contextual answer generation for support content.",
                        "customer support lead",
                        List.of("security.dependency_review", "quality.test_strategy", "launch.readiness_review", "cloud.monitoring_setup"),
                        List.of("Dependency and supply-chain risk", "Testing and quality", "Launch readiness", "Monitoring and operations"),
                        List.of("faq", "rag", "article", "support", "reindex", "dependency", "monitoring"),
                        List.of(
                                finding("OSV-Scanner", "CVE-2026-FAQ", "Vulnerable search dependency detected", "Known CVE in semantic search dependency used by FAQ indexing.", NormalizedFinding.FindingSeverity.HIGH, "pom.xml", "DEPENDENCY_VULNERABILITY", "security.dependency_review"),
                                finding("JUnit", "coverage-gap", "No regression tests for reindex and ask flow", "FAQ reindexing and generated-answer fallback lack automated verification.", NormalizedFinding.FindingSeverity.MEDIUM, "FaqAskService", "TESTING_GAP", "quality.test_strategy"),
                                finding("Runbook", "launch-checklist", "No content freshness runbook", "Support team lacks a launch checklist for article updates, stale answers, and human escalation.", NormalizedFinding.FindingSeverity.MEDIUM, "docs/support-runbook.md", "LAUNCH_READINESS_GAP", "launch.readiness_review"),
                                finding("Datadog", "monitoring-gap", "No alert for failed FAQ indexing", "Reindex failures can silently leave stale support answers online.", NormalizedFinding.FindingSeverity.HIGH, "ArticleIndexJob", "MONITORING_GAP", "cloud.monitoring_setup")
                        ),
                        List.of(
                                "Add monitoring and keep knowledge up to date.",
                                "The FAQ app should be reviewed for production readiness."
                        ),
                        "The diagnosis should identify stale knowledge and reindex failures as launch risks."
                ),
                new FixtureDefinition(
                        "subscription-billing-pilot",
                        "Subscription billing pilot risk",
                        "Real_Apps/sub-management-hub",
                        "subscription management MVP",
                        "A billing and subscription management hub preparing for real customer payments and admin operations.",
                        "technical founder and finance operator",
                        List.of("security.secrets_scan", "security.api_review", "cloud.deployment_setup", "launch.readiness_review"),
                        List.of("Security and secrets", "API and integration security", "Deployment runtime", "Launch readiness"),
                        List.of("subscription", "billing", "stripe", "webhook", "docker", "rollback", "runbook"),
                        List.of(
                                finding("Gitleaks", "stripe-secret", "Stripe test secret appears in environment sample", "Potential credential leak in billing configuration sample.", NormalizedFinding.FindingSeverity.CRITICAL, ".env.example", "SECRET_EXPOSURE", "security.secrets_scan"),
                                finding("Semgrep", "webhook-signature", "Billing webhook signature is not enforced", "Subscription update endpoint accepts unsigned provider events.", NormalizedFinding.FindingSeverity.CRITICAL, "/api/billing/webhook", "API_SECURITY", "security.api_review"),
                                finding("Trivy", "container-cve", "Container image uses outdated base layer", "Docker runtime package has a known vulnerability.", NormalizedFinding.FindingSeverity.HIGH, "Dockerfile", "DEPLOYMENT_RUNTIME_RISK", "cloud.deployment_setup"),
                                finding("Runbook", "rollback-missing", "No rollback steps for failed billing migration", "Operator documentation lacks recovery steps for failed subscription migration.", NormalizedFinding.FindingSeverity.HIGH, "DEPLOYMENT.md", "LAUNCH_READINESS_GAP", "launch.readiness_review")
                        ),
                        List.of(
                                "The billing app needs security improvements and deployment hardening.",
                                "Fix secrets, webhooks, and containers before launching."
                        ),
                        "This fixture should be strict: payment and billing prototypes need strong blocker language."
                ),
                new FixtureDefinition(
                        "customer-privacy-support",
                        "Privacy-first support portal",
                        "Real_Apps/privacy-first-customer-facing-support",
                        "customer-facing support MVP",
                        "A customer support portal that handles private user questions, support context, and account-level visibility.",
                        "customer success owner",
                        List.of("security.auth_review", "security.secrets_scan", "cloud.monitoring_setup", "quality.test_strategy"),
                        List.of("Authentication and access control", "Security and secrets", "Monitoring and operations", "Testing and quality"),
                        List.of("privacy", "customer", "support", "account", "pii", "auth", "alert"),
                        List.of(
                                finding("Semgrep", "tenant-access", "Account support endpoint lacks tenant boundary check", "Authentication and authorization gap can expose another customer's support context.", NormalizedFinding.FindingSeverity.CRITICAL, "/api/support/accounts/{id}", "AUTH_ACCESS_CONTROL", "security.auth_review"),
                                finding("Gitleaks", "pii-log", "Customer email appears in debug log fixture", "Sensitive customer identifiers are stored in support debug logs.", NormalizedFinding.FindingSeverity.HIGH, "logs/debug-support.log", "SECRET_EXPOSURE", "security.secrets_scan"),
                                finding("Datadog", "monitoring-gap", "No alert for failed support handoff", "Support escalation failures are not observable by the owner.", NormalizedFinding.FindingSeverity.MEDIUM, "SupportEscalationJob", "MONITORING_GAP", "cloud.monitoring_setup"),
                                finding("JUnit", "coverage-gap", "No tests for account visibility boundaries", "Critical privacy flow lacks automated verification.", NormalizedFinding.FindingSeverity.HIGH, "SupportAccountController", "TESTING_GAP", "quality.test_strategy")
                        ),
                        List.of(
                                "Review privacy and add automated tests.",
                                "Make the support portal production ready with monitoring."
                        ),
                        "The diagnosis should avoid vague privacy wording and name tenant/account boundary risk."
                ),
                new FixtureDefinition(
                        "catalog-migration-ready",
                        "Migration-enabled product catalog",
                        "Real_Apps/migration-enabled-product-catalog",
                        "data-backed catalog prototype",
                        "A product catalog with migrations and data lifecycle concerns that needs confidence before customer data is loaded.",
                        "product owner and backend engineer",
                        List.of("cloud.cicd_setup", "quality.test_strategy", "cloud.deployment_setup", "launch.readiness_review"),
                        List.of("Release pipeline", "Testing and quality", "Deployment runtime", "Launch readiness"),
                        List.of("migration", "catalog", "database", "ci", "rollback", "data", "release"),
                        List.of(
                                finding("GitHub Actions", "migration-not-gated", "Database migration is not gated in release workflow", "CI/CD pipeline does not prove migration safety before deployment.", NormalizedFinding.FindingSeverity.HIGH, ".github/workflows/release.yml", "RELEASE_PIPELINE_GAP", "cloud.cicd_setup"),
                                finding("JUnit", "migration-coverage", "No automated test covers catalog migration rollback", "Migration rollback and data integrity are not verified.", NormalizedFinding.FindingSeverity.HIGH, "CatalogMigrationTest", "TESTING_GAP", "quality.test_strategy"),
                                finding("Trivy", "runtime-config", "Runtime image lacks non-root deployment proof", "Container runtime configuration does not show production-safe user and patch posture.", NormalizedFinding.FindingSeverity.MEDIUM, "Dockerfile", "DEPLOYMENT_RUNTIME_RISK", "cloud.deployment_setup"),
                                finding("Runbook", "data-restore", "No data restore runbook for failed catalog release", "Owner lacks recovery steps for failed migration or bad catalog import.", NormalizedFinding.FindingSeverity.HIGH, "README", "LAUNCH_READINESS_GAP", "launch.readiness_review")
                        ),
                        List.of(
                                "Add migration testing and deployment checks.",
                                "The catalog should be made ready for production."
                        ),
                        "The diagnosis should treat migration proof as a launch confidence issue, not only a backend chore."
                )
        );
    }

    private static FindingFixture finding(
            String sourceTool,
            String sourceRuleId,
            String title,
            String description,
            NormalizedFinding.FindingSeverity severity,
            String affectedComponent,
            String expectedCategory,
            String expectedServiceCode
    ) {
        return new FindingFixture(sourceTool, sourceRuleId, title, description, severity, affectedComponent, expectedCategory, expectedServiceCode);
    }

    private record WeightedScore(int score, int weight) {}

    private record FixtureDefinition(
            String id,
            String name,
            String sourceApp,
            String prototypeType,
            String description,
            String targetUsers,
            List<String> expectedServiceCodes,
            List<String> expectedReadinessAreas,
            List<String> requiredKeywords,
            List<FindingFixture> findings,
            List<String> badDiagnosisExamples,
            String recommendedReviewerNotes
    ) {}

    private record FindingFixture(
            String sourceTool,
            String sourceRuleId,
            String title,
            String description,
            NormalizedFinding.FindingSeverity severity,
            String affectedComponent,
            String expectedCategory,
            String expectedServiceCode
    ) {}

    public record HarnessRunRequest(List<String> fixtureIds, Boolean includeBadExamples) {}
    public record FixtureSummary(String id, String name, String sourceApp, String prototypeType, String description, int findingCount, List<String> expectedServiceCodes, List<String> expectedReadinessAreas) {}
    public record HarnessRunResponse(LocalDateTime generatedAt, HarnessStatus status, int averageScore, int passCount, int warnCount, int failCount, int totalExpectedServices, int totalMatchedServices, int unresolvedCatalogCodeCount, int fixtureCount, List<FixtureRunResult> fixtures, List<String> nextActions) {}
    public record FixtureRunResult(String fixtureId, String name, String sourceApp, String prototypeType, HarnessStatus status, int overallScore, int categoryScore, int serviceMappingScore, int catalogResolutionScore, int specificityScore, int nonGenericScore, int badExampleScore, List<String> expectedServiceCodes, List<String> expectedReadinessAreas, List<String> actualServiceCodes, List<String> actualReadinessAreas, List<String> matchedServiceCodes, List<String> unresolvedCatalogCodes, String generatedDiagnosis, List<String> genericIssues, List<FindingRunResult> findings, List<BadDiagnosisResult> badDiagnosisExamples, String reviewerNotes) {}
    public record FindingRunResult(String title, String sourceTool, String severity, String expectedCategory, String actualCategory, boolean categoryMatched, String expectedServiceCode, String actualServiceCode, boolean serviceMatched, boolean catalogResolved, String resolvedServiceName, String actualReadinessArea, String businessRisk, String evidenceRequired, String mappingReason, double mappingConfidence) {}
    public record BadDiagnosisResult(String text, boolean caught, List<String> issues) {}

    public enum HarnessStatus {
        PASS,
        WARN,
        FAIL
    }
}
