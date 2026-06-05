package com.produs.engine;

import com.produs.catalog.ServiceModule;
import com.produs.catalog.ServiceModuleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DiagnosisQualityHarnessServiceTest {

    private DiagnosisQualityHarnessService service;

    @BeforeEach
    void setUp() {
        ServiceModuleRepository moduleRepository = mock(ServiceModuleRepository.class);
        Set<String> knownCodes = Set.of(
                "cloud.monitoring_setup",
                "cloud.cicd_setup",
                "scale.performance_audit",
                "security.api_review",
                "security.auth_review",
                "quality.test_strategy",
                "launch.readiness_review",
                "security.dependency_review",
                "security.secrets_scan",
                "cloud.deployment_setup"
        );
        when(moduleRepository.findByStableCode(anyString())).thenAnswer(invocation -> {
            String code = invocation.getArgument(0);
            if (!knownCodes.contains(code)) {
                return Optional.empty();
            }
            ServiceModule module = new ServiceModule();
            module.setStableCode(code);
            module.setName(code.replace('.', ' ').replace('_', ' '));
            return Optional.of(module);
        });
        when(moduleRepository.findBySlug(anyString())).thenReturn(Optional.empty());
        service = new DiagnosisQualityHarnessService(new ScannerFindingClassifier(), moduleRepository);
    }

    @Test
    void listsCuratedPrototypeFixtures() {
        assertThat(service.fixtures())
                .hasSizeGreaterThanOrEqualTo(6)
                .anySatisfy(fixture -> {
                    assertThat(fixture.id()).isEqualTo("ecommerce-launch-risk");
                    assertThat(fixture.expectedServiceCodes()).contains("security.api_review", "cloud.monitoring_setup");
                });
    }

    @Test
    void scoresAllFixturesAgainstClassifierAndCatalog() {
        DiagnosisQualityHarnessService.HarnessRunResponse response = service.run(new DiagnosisQualityHarnessService.HarnessRunRequest(null, true));

        assertThat(response.status()).isEqualTo(DiagnosisQualityHarnessService.HarnessStatus.PASS);
        assertThat(response.averageScore()).isGreaterThanOrEqualTo(86);
        assertThat(response.totalExpectedServices()).isGreaterThan(0);
        assertThat(response.totalMatchedServices()).isEqualTo(response.totalExpectedServices());
        assertThat(response.unresolvedCatalogCodeCount()).isZero();
        assertThat(response.fixtures()).allSatisfy(fixture -> {
            assertThat(fixture.generatedDiagnosis()).contains("Recommended ProdUS service modules");
            assertThat(fixture.badDiagnosisExamples()).allSatisfy(example -> assertThat(example.caught()).isTrue());
            assertThat(fixture.findings()).allSatisfy(finding -> {
                assertThat(finding.categoryMatched()).isTrue();
                assertThat(finding.serviceMatched()).isTrue();
                assertThat(finding.catalogResolved()).isTrue();
            });
        });
    }

    @Test
    void canRunOneFixtureById() {
        DiagnosisQualityHarnessService.HarnessRunResponse response = service.run(new DiagnosisQualityHarnessService.HarnessRunRequest(
                java.util.List.of("subscription-billing-pilot"),
                true
        ));

        assertThat(response.fixtureCount()).isEqualTo(1);
        assertThat(response.fixtures().getFirst().fixtureId()).isEqualTo("subscription-billing-pilot");
        assertThat(response.fixtures().getFirst().actualServiceCodes()).contains("security.secrets_scan", "security.api_review");
    }

    @Test
    void rejectsUnknownFixtureIds() {
        assertThatThrownBy(() -> service.run(new DiagnosisQualityHarnessService.HarnessRunRequest(
                java.util.List.of("missing-fixture"),
                true
        )))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown diagnosis quality fixture");
    }
}
