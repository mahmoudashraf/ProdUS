package com.produs.engine;

import com.produs.scanner.NormalizedFinding;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ScannerFindingClassifierTest {

    private final ScannerFindingClassifier classifier = new ScannerFindingClassifier();

    @Test
    void mapsSecretSignalsToSecretsScan() {
        NormalizedFinding finding = finding("Gitleaks", "generic-api-key", "Database URL exposed in environment sample", "Potential credential leak");

        ScannerFindingClassifier.ScannerFindingClassification result = classifier.classify(finding);

        assertThat(result.category()).isEqualTo("SECRET_EXPOSURE");
        assertThat(result.serviceModuleCode()).isEqualTo("security.secrets_scan");
        assertThat(result.evidenceRequired()).containsIgnoringCase("rotate");
    }

    @Test
    void mapsDependencySignalsToDependencyReview() {
        NormalizedFinding finding = finding("OSV-Scanner", "CVE-2026-1234", "Vulnerable dependency detected", "Package has a known CVE");

        ScannerFindingClassifier.ScannerFindingClassification result = classifier.classify(finding);

        assertThat(result.category()).isEqualTo("DEPENDENCY_VULNERABILITY");
        assertThat(result.serviceModuleCode()).isEqualTo("security.dependency_review");
    }

    @Test
    void mapsCiSignalsToPipelineSetup() {
        NormalizedFinding finding = finding("GitHub Actions", "workflow", "Release workflow has no required checks", "CI pipeline does not gate deployment");

        ScannerFindingClassifier.ScannerFindingClassification result = classifier.classify(finding);

        assertThat(result.category()).isEqualTo("RELEASE_PIPELINE_GAP");
        assertThat(result.serviceModuleCode()).isEqualTo("cloud.cicd_setup");
    }

    @Test
    void mapsSemgrepApiSignalsToApiReview() {
        NormalizedFinding finding = finding("Semgrep", "js/sql-injection", "Unsanitized API input reaches SQL query", "Injection risk in API handler");

        ScannerFindingClassifier.ScannerFindingClassification result = classifier.classify(finding);

        assertThat(result.category()).isEqualTo("API_SECURITY");
        assertThat(result.serviceModuleCode()).isEqualTo("security.api_review");
    }

    @Test
    void mapsTrivyContainerSignalsToDeploymentSetup() {
        NormalizedFinding finding = finding("Trivy", "CVE-2026-4567", "Container image uses vulnerable base image", "Docker runtime package is vulnerable");

        ScannerFindingClassifier.ScannerFindingClassification result = classifier.classify(finding);

        assertThat(result.category()).isEqualTo("DEPLOYMENT_RUNTIME_RISK");
        assertThat(result.serviceModuleCode()).isEqualTo("cloud.deployment_setup");
    }

    @Test
    void mapsCheckovIacSignalsToDeploymentSetup() {
        NormalizedFinding finding = finding("Checkov", "CKV_AWS_20", "Public S3 bucket allows full read access", "Terraform storage bucket is public");

        ScannerFindingClassifier.ScannerFindingClassification result = classifier.classify(finding);

        assertThat(result.category()).isEqualTo("INFRASTRUCTURE_EXPOSURE");
        assertThat(result.serviceModuleCode()).isEqualTo("cloud.deployment_setup");
    }

    @Test
    void mapsLighthouseSignalsToPerformanceAudit() {
        NormalizedFinding finding = finding("Lighthouse", "lighthouse-performance", "Lighthouse performance score is below launch threshold", "Largest Contentful Paint is slow");

        ScannerFindingClassifier.ScannerFindingClassification result = classifier.classify(finding);

        assertThat(result.category()).isEqualTo("PERFORMANCE_READINESS");
        assertThat(result.serviceModuleCode()).isEqualTo("scale.performance_audit");
    }

    @Test
    void mapsMonitoringSignalsToMonitoringSetup() {
        NormalizedFinding finding = finding("Datadog", "monitoring-gap", "No alerts configured for production sync failures", "Observability and incident ownership are missing");

        ScannerFindingClassifier.ScannerFindingClassification result = classifier.classify(finding);

        assertThat(result.category()).isEqualTo("MONITORING_GAP");
        assertThat(result.serviceModuleCode()).isEqualTo("cloud.monitoring_setup");
    }

    @Test
    void mapsTestingSignalsToTestStrategy() {
        NormalizedFinding finding = finding("JUnit", "coverage-gap", "Critical checkout path has low test coverage", "Flaky tests and coverage gaps block release confidence");

        ScannerFindingClassifier.ScannerFindingClassification result = classifier.classify(finding);

        assertThat(result.category()).isEqualTo("TESTING_GAP");
        assertThat(result.serviceModuleCode()).isEqualTo("quality.test_strategy");
    }

    @Test
    void mapsLaunchSignalsToReadinessReview() {
        NormalizedFinding finding = finding("Runbook", "launch-checklist", "Go-live runbook is missing rollback steps", "Support handoff documentation is incomplete");

        ScannerFindingClassifier.ScannerFindingClassification result = classifier.classify(finding);

        assertThat(result.category()).isEqualTo("LAUNCH_READINESS_GAP");
        assertThat(result.serviceModuleCode()).isEqualTo("launch.readiness_review");
    }

    @Test
    void leavesUnknownSignalsForHumanReview() {
        NormalizedFinding finding = finding("Custom", "misc", "Unexpected scanner note", "Needs review");

        ScannerFindingClassifier.ScannerFindingClassification result = classifier.classify(finding);

        assertThat(result.category()).isEqualTo("UNMAPPED");
        assertThat(result.serviceModuleCode()).isNull();
        assertThat(result.confidence()).isLessThan(0.5);
    }

    private static NormalizedFinding finding(String tool, String rule, String title, String description) {
        NormalizedFinding finding = new NormalizedFinding();
        finding.setSourceTool(tool);
        finding.setSourceRuleId(rule);
        finding.setTitle(title);
        finding.setDescription(description);
        return finding;
    }
}
