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
