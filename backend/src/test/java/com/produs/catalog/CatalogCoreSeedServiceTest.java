package com.produs.catalog;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class CatalogCoreSeedServiceTest {

    @Autowired
    private CatalogCoreSeedService seedService;

    @Autowired
    private ServiceCategoryRepository categoryRepository;

    @Autowired
    private ServiceModuleRepository moduleRepository;

    @Autowired
    private ServiceDependencyRepository dependencyRepository;

    @Autowired
    private PackageTemplateRepository packageTemplateRepository;

    @Autowired
    private PackageTemplateModuleRepository packageTemplateModuleRepository;

    @Autowired
    private CatalogRuleRepository ruleRepository;

    @Autowired
    private CatalogTemplateDefinitionRepository templateDefinitionRepository;

    @Autowired
    private AICapabilityConfigRepository aiCapabilityConfigRepository;

    @Test
    void seedsProductTestingPackAsSelectableAiReadyCatalogCapability() {
        seedService.seedCoreCatalog();

        ServiceCategory testing = categoryRepository.findBySlug("quality-testing").orElseThrow();
        assertThat(testing.getName()).isEqualTo("Quality / Testing");
        assertThat(testing.isActive()).isTrue();

        ServiceModule strategy = moduleRepository.findByStableCode("quality.test_strategy").orElseThrow();
        ServiceModule e2e = moduleRepository.findByStableCode("quality.e2e_testing").orElseThrow();
        ServiceModule releaseAcceptance = moduleRepository.findByStableCode("quality.release_acceptance_testing").orElseThrow();
        assertThat(strategy.getCategory().getId()).isEqualTo(testing.getId());
        assertThat(e2e.getAiAssistanceTags()).contains("testing");
        assertThat(releaseAcceptance.getRequiredEvidenceTypes()).contains("Acceptance report");

        PackageTemplate productTestingPack = packageTemplateRepository.findBySlug("product-testing-pack").orElseThrow();
        List<PackageTemplateModule> productTestingModules = packageTemplateModuleRepository.findByTemplateIdOrderBySequenceOrderAsc(productTestingPack.getId());
        assertThat(productTestingModules)
                .extracting(item -> item.getServiceModule().getStableCode())
                .containsExactly(
                        "quality.test_strategy",
                        "quality.smoke_testing",
                        "quality.regression_testing",
                        "quality.e2e_testing",
                        "quality.defect_triage",
                        "quality.release_acceptance_testing"
                );

        PackageTemplate automationFoundation = packageTemplateRepository.findBySlug("test-automation-foundation").orElseThrow();
        assertThat(packageTemplateModuleRepository.findByTemplateIdOrderBySequenceOrderAsc(automationFoundation.getId()))
                .extracting(item -> item.getServiceModule().getStableCode())
                .contains("quality.test_automation_setup", "quality.api_testing", "quality.coverage_boost", "cloud.cicd_setup");

        assertThat(dependencyRepository.findBySourceModuleId(releaseAcceptance.getId()))
                .anySatisfy(dependency -> {
                    assertThat(dependency.getDependsOnModule().getStableCode()).isEqualTo("quality.test_strategy");
                    assertThat(dependency.getSeverity()).isEqualTo(ServiceDependency.DependencySeverity.BLOCKER);
                    assertThat(dependency.isRequired()).isTrue();
                });
        assertThat(dependencyRepository.findBySourceModuleId(e2e.getId()))
                .anySatisfy(dependency -> {
                    assertThat(dependency.getDependsOnModule().getStableCode()).isEqualTo("cloud.staging_setup");
                    assertThat(dependency.getSeverity()).isEqualTo(ServiceDependency.DependencySeverity.WARNING);
                });

        assertThat(ruleRepository.findBySlug("goal-qa-testing")).isPresent();
        assertThat(ruleRepository.findBySlug("selected-frontend-e2e")).isPresent();
        assertThat(templateDefinitionRepository.findBySlug("testing-evidence-v1")).isPresent();

        AICapabilityConfig testingAssist = aiCapabilityConfigRepository.findBySlug("testing-pack-assist").orElseThrow();
        assertThat(testingAssist.getCapabilityType()).isEqualTo("TESTING_READINESS");
        assertThat(testingAssist.getForbiddenClaims()).contains("No legal");
        assertThat(testingAssist.isHumanReviewRequired()).isTrue();
    }
}
