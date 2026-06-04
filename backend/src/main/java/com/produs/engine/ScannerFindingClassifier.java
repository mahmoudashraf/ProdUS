package com.produs.engine;

import com.produs.scanner.NormalizedFinding;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;

@Component
public class ScannerFindingClassifier {

    public ScannerFindingClassification classify(NormalizedFinding finding) {
        String signal = normalize(String.join(" ",
                safe(finding.getSourceTool()),
                safe(finding.getSourceRuleId()),
                safe(finding.getTitle()),
                safe(finding.getDescription()),
                safe(finding.getAffectedComponent())
        ));

        if (contains(signal, "gitleaks", "secret", "api key", "access token", "private key", "password", "credential", "env var")) {
            return classification(
                    "SECRET_EXPOSURE",
                    "Security and secrets",
                    "security.secrets_scan",
                    "A leaked or weakly handled credential can compromise production systems, customer data, or deployment access.",
                    "Rotate or invalidate exposed credentials, move secrets into approved storage, and attach a clean scanner rerun.",
                    "Secrets wording or scanner source matched credential exposure signals.",
                    0.94
            );
        }
        if (contains(signal, "jwt", "session", "oauth", "login", "authentication", "authorization", "rbac", "role", "privilege")) {
            return classification(
                    "AUTH_ACCESS_CONTROL",
                    "Authentication and access control",
                    "security.auth_review",
                    "Authentication or authorization gaps can let users reach data or actions outside their intended role.",
                    "Attach role matrix, protected-route/API tests, and evidence of session/auth configuration review.",
                    "Auth and access-control terms were found in scanner finding content.",
                    0.86
            );
        }
        if (contains(signal, "osv", "cve", "vulnerab", "dependency", "package", "supply chain", "npm audit", "maven", "gradle")) {
            return classification(
                    "DEPENDENCY_VULNERABILITY",
                    "Dependency and supply-chain risk",
                    "security.dependency_review",
                    "Known vulnerable dependencies can become launch blockers or enterprise review failures.",
                    "Attach dependency scan output, patch plan, upgraded lockfile/build evidence, or explicit owner risk acceptance.",
                    "Dependency scanner or vulnerability identifiers were present.",
                    0.9
            );
        }
        if (contains(signal, "semgrep", "injection", "xss", "csrf", "ssrf", "deserialization", "rate limit", "tenant", "webhook", "api security")) {
            return classification(
                    "API_SECURITY",
                    "API and integration security",
                    "security.api_review",
                    "API or webhook weaknesses can expose product data, break integrations, or create unsafe automation paths.",
                    "Attach API inventory, validation/rate-limit checks, webhook verification, and remediation evidence.",
                    "API security and code-analysis terms matched.",
                    0.84
            );
        }
        if (contains(signal, "trivy", "container", "docker", "image", "runtime", "base image", "kubernetes", "helm")) {
            return classification(
                    "DEPLOYMENT_RUNTIME_RISK",
                    "Deployment runtime",
                    "cloud.deployment_setup",
                    "Runtime or container gaps can make releases hard to repeat, observe, patch, or roll back.",
                    "Attach staging/prod deployment notes, container scan results, rollback path, and owner-visible release evidence.",
                    "Container or runtime scanner signals matched deployment readiness risk.",
                    0.82
            );
        }
        if (contains(signal, "checkov", "terraform", "iam", "s3", "bucket", "public", "security group", "iac", "network", "cloudformation")) {
            return classification(
                    "INFRASTRUCTURE_EXPOSURE",
                    "Cloud and infrastructure",
                    "cloud.deployment_setup",
                    "Infrastructure misconfiguration can expose services or leave production controls incomplete.",
                    "Attach infrastructure scan evidence, least-privilege review, network/storage access notes, and remediation proof.",
                    "IaC or cloud exposure terms were present.",
                    0.82
            );
        }
        if (contains(signal, "ci", "cd", "pipeline", "workflow", "github actions", "gitlab ci", "build failed", "release gate")) {
            return classification(
                    "RELEASE_PIPELINE_GAP",
                    "Release pipeline",
                    "cloud.cicd_setup",
                    "Without repeatable build, test, and deployment checks, owners cannot trust release readiness.",
                    "Attach CI/CD workflow, required checks, failed-check triage, and successful release evidence.",
                    "Pipeline and release-gate terms matched.",
                    0.78
            );
        }
        if (contains(signal, "monitoring", "alert", "logging", "observability", "synthetic", "uptime", "incident")) {
            return classification(
                    "MONITORING_GAP",
                    "Monitoring and operations",
                    "cloud.monitoring_setup",
                    "Missing monitoring hides production failures until customers or owners find them.",
                    "Attach dashboards, alert routes, synthetic checks, log examples, and escalation ownership.",
                    "Monitoring and observability terms matched.",
                    0.83
            );
        }
        if (contains(signal, "lighthouse", "performance", "latency", "slow", "largest contentful", "cumulative layout", "bundle", "cache")) {
            return classification(
                    "PERFORMANCE_READINESS",
                    "Performance and scale",
                    "scale.performance_audit",
                    "Performance risk can block launch confidence, user adoption, or high-traffic readiness.",
                    "Attach benchmark traces, target thresholds, bottleneck list, and remediation plan.",
                    "Performance scanner or browser metric terms matched.",
                    0.82
            );
        }
        if (contains(signal, "test", "coverage", "junit", "playwright", "cypress", "flaky", "assertion", "qa")) {
            return classification(
                    "TESTING_GAP",
                    "Testing and quality",
                    "quality.test_strategy",
                    "Testing gaps make release decisions fragile because critical flows lack proof.",
                    "Attach test strategy, critical-path coverage, automation results, and release acceptance evidence.",
                    "Testing and quality terms matched.",
                    0.8
            );
        }
        if (contains(signal, "launch", "go live", "go/no-go", "runbook", "handoff", "support", "documentation", "docs")) {
            return classification(
                    "LAUNCH_READINESS_GAP",
                    "Launch readiness",
                    "launch.readiness_review",
                    "Launch readiness gaps leave owners without a clear go/no-go decision or operational handoff.",
                    "Attach launch checklist, runbook, owner approval record, and support/handoff evidence.",
                    "Launch, runbook, documentation, or handoff terms matched.",
                    0.76
            );
        }

        return classification(
                "UNMAPPED",
                "Unmapped scanner signal",
                null,
                "This scanner signal needs human classification before it can drive a production-readiness service.",
                "Record the affected area, decide whether it blocks launch, and map it to a lifecycle service or risk exception.",
                "No catalog mapping rule matched with enough confidence.",
                0.35
        );
    }

    private static ScannerFindingClassification classification(
            String category,
            String readinessArea,
            String serviceModuleCode,
            String businessRisk,
            String evidenceRequired,
            String mappingReason,
            double confidence
    ) {
        return new ScannerFindingClassification(
                category,
                readinessArea,
                serviceModuleCode,
                businessRisk,
                evidenceRequired,
                mappingReason,
                confidence
        );
    }

    private static boolean contains(String value, String... needles) {
        return List.of(needles).stream().anyMatch(needle -> value.contains(normalize(needle)));
    }

    private static String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.toLowerCase(Locale.ROOT).replace('-', ' ').replace('_', ' ');
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }

    public record ScannerFindingClassification(
            String category,
            String readinessArea,
            String serviceModuleCode,
            String businessRisk,
            String evidenceRequired,
            String mappingReason,
            double confidence
    ) {}
}
