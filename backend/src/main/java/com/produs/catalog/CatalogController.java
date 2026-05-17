package com.produs.catalog;

import com.produs.dto.PlatformDtos.AICapabilityConfigResponse;
import com.produs.dto.PlatformDtos.CatalogRuleEvaluationResponse;
import com.produs.dto.PlatformDtos.CatalogRuleResponse;
import com.produs.dto.PlatformDtos.CatalogTemplateDefinitionResponse;
import com.produs.dto.PlatformDtos.PackageTemplateResponse;
import com.produs.dto.PlatformDtos.ServiceCategoryResponse;
import com.produs.dto.PlatformDtos.ServiceDependencyResponse;
import com.produs.dto.PlatformDtos.ServiceModuleResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import static com.produs.dto.PlatformDtos.toServiceCategoryResponse;
import static com.produs.dto.PlatformDtos.toAICapabilityConfigResponse;
import static com.produs.dto.PlatformDtos.toCatalogRuleResponse;
import static com.produs.dto.PlatformDtos.toCatalogTemplateDefinitionResponse;
import static com.produs.dto.PlatformDtos.toPackageTemplateResponse;
import static com.produs.dto.PlatformDtos.toServiceDependencyResponse;
import static com.produs.dto.PlatformDtos.toServiceModuleResponse;

@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final ServiceCategoryRepository categoryRepository;
    private final ServiceModuleRepository moduleRepository;
    private final ServiceDependencyRepository dependencyRepository;
    private final PackageTemplateRepository packageTemplateRepository;
    private final PackageTemplateModuleRepository packageTemplateModuleRepository;
    private final CatalogRuleRepository catalogRuleRepository;
    private final CatalogTemplateDefinitionRepository templateDefinitionRepository;
    private final AICapabilityConfigRepository aiCapabilityConfigRepository;
    private final CatalogRuleEngine catalogRuleEngine;

    @GetMapping("/categories")
    public List<ServiceCategoryResponse> categories() {
        return categoryRepository.findByActiveTrueOrderBySortOrderAscNameAsc().stream()
                .map(category -> toServiceCategoryResponse(category))
                .toList();
    }

    @GetMapping("/modules")
    public List<ServiceModuleResponse> modules(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String layer,
            @RequestParam(defaultValue = "true") boolean visibleOnly
    ) {
        if (categoryId != null) {
            return moduleRepository.findByCategoryIdAndActiveTrueOrderBySortOrderAscNameAsc(categoryId).stream()
                    .filter(module -> !visibleOnly || module.isVisible())
                    .map(module -> toServiceModuleResponse(module))
                    .toList();
        }
        if (layer != null && !layer.isBlank()) {
            return moduleRepository.findByServiceLayerAndActiveTrueOrderBySortOrderAscNameAsc(layer).stream()
                    .filter(module -> !visibleOnly || module.isVisible())
                    .map(module -> toServiceModuleResponse(module))
                    .toList();
        }
        if (visibleOnly) {
            return moduleRepository.findByActiveTrueAndVisibleTrueOrderBySortOrderAscNameAsc().stream()
                    .map(module -> toServiceModuleResponse(module))
                    .toList();
        }
        return moduleRepository.findByActiveTrueOrderBySortOrderAscNameAsc().stream()
                .map(module -> toServiceModuleResponse(module))
                .toList();
    }

    @GetMapping("/dependencies")
    public List<ServiceDependencyResponse> dependencies(@RequestParam(required = false) UUID moduleId) {
        if (moduleId == null) {
            return dependencyRepository.findAll().stream()
                    .sorted(Comparator
                            .comparing((ServiceDependency dependency) -> dependency.getSourceModule().getSortOrder())
                            .thenComparing(dependency -> dependency.getSourceModule().getName())
                            .thenComparing(dependency -> dependency.getDependsOnModule().getSortOrder())
                            .thenComparing(dependency -> dependency.getDependsOnModule().getName()))
                    .map(dependency -> toServiceDependencyResponse(dependency))
                    .toList();
        }
        return dependencyRepository.findBySourceModuleId(moduleId).stream()
                .map(dependency -> toServiceDependencyResponse(dependency))
                .toList();
    }

    @GetMapping("/package-templates")
    public List<PackageTemplateResponse> packageTemplates() {
        return packageTemplateRepository.findByActiveTrueOrderBySortOrderAscNameAsc().stream()
                .map(template -> toPackageTemplateResponse(
                        template,
                        packageTemplateModuleRepository.findByTemplateIdOrderBySequenceOrderAsc(template.getId())
                ))
                .toList();
    }

    @GetMapping("/rules")
    public List<CatalogRuleResponse> rules() {
        return catalogRuleRepository.findByActiveTrueOrderBySortOrderAscSlugAsc().stream()
                .map(rule -> toCatalogRuleResponse(rule))
                .toList();
    }

    @PostMapping("/rules/evaluate")
    public CatalogRuleEvaluationResponse evaluateRules(@RequestBody RuleEvaluationRequest request) {
        return catalogRuleEngine.evaluate(request.moduleIds(), request.businessGoal());
    }

    @GetMapping("/template-definitions")
    public List<CatalogTemplateDefinitionResponse> templateDefinitions() {
        return templateDefinitionRepository.findByActiveTrueOrderBySortOrderAscNameAsc().stream()
                .map(definition -> toCatalogTemplateDefinitionResponse(definition))
                .toList();
    }

    @GetMapping("/ai-capabilities")
    public List<AICapabilityConfigResponse> aiCapabilities() {
        return aiCapabilityConfigRepository.findAllByOrderBySortOrderAscNameAsc().stream()
                .map(config -> toAICapabilityConfigResponse(config))
                .toList();
    }

    public record RuleEvaluationRequest(List<UUID> moduleIds, String businessGoal) {}
}
