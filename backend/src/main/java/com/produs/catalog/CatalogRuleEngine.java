package com.produs.catalog;

import com.produs.dto.PlatformDtos.CatalogRuleEvaluationResponse;
import com.produs.dto.PlatformDtos.CatalogRuleItemResponse;
import com.produs.dto.PlatformDtos.ServiceModuleResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.produs.dto.PlatformDtos.toServiceModuleResponse;

@Service
@RequiredArgsConstructor
public class CatalogRuleEngine {

    private final ServiceModuleRepository moduleRepository;
    private final ServiceDependencyRepository dependencyRepository;
    private final CatalogRuleRepository ruleRepository;

    @Transactional(readOnly = true)
    public CatalogRuleEvaluationResponse evaluate(List<UUID> moduleIds, String businessGoal) {
        List<UUID> selectedIds = moduleIds == null ? List.of() : moduleIds.stream().distinct().toList();
        List<ServiceModule> selectedModules = selectedIds.isEmpty() ? List.of() : moduleRepository.findAllById(selectedIds);
        Set<UUID> selectedModuleIds = selectedModules.stream().map(ServiceModule::getId).collect(Collectors.toSet());
        Set<String> selectedCodes = selectedModules.stream()
                .flatMap(module -> List.of(module.getStableCode(), module.getSlug()).stream())
                .filter(value -> value != null && !value.isBlank())
                .map(value -> value.toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());

        Map<UUID, CatalogRuleItemResponse> recommendations = new LinkedHashMap<>();
        if (!selectedIds.isEmpty()) {
            dependencyRepository.findBySourceModuleIdIn(selectedIds).stream()
                    .filter(dependency -> dependency.getDependsOnModule() != null)
                    .forEach(dependency -> {
                        ServiceModule recommended = dependency.getDependsOnModule();
                        boolean alreadySelected = selectedModuleIds.contains(recommended.getId());
                        CatalogRuleItemResponse item = new CatalogRuleItemResponse(
                                "REQUIRED_DEPENDENCY",
                                toServiceModuleResponse(dependency.getSourceModule()),
                                toServiceModuleResponse(recommended),
                                firstNonBlank(dependency.getMessage(), dependency.getReason(), "Required for a production-ready service plan."),
                                dependency.getSeverity(),
                                dependency.isRequired(),
                                alreadySelected
                        );
                        mergeRecommendation(recommendations, recommended.getId(), item);
                    });
        }

        String goal = businessGoal == null ? "" : businessGoal.toLowerCase(Locale.ROOT);
        for (CatalogRule rule : ruleRepository.findByActiveTrueOrderBySortOrderAscSlugAsc()) {
            if (!ruleApplies(rule, selectedModuleIds, selectedCodes, goal)) {
                continue;
            }
            ServiceModule recommended = rule.getRecommendedModule();
            boolean alreadySelected = selectedModuleIds.contains(recommended.getId());
            CatalogRuleItemResponse item = new CatalogRuleItemResponse(
                    rule.getRuleType().name(),
                    toServiceModuleResponse(rule.getSourceModule()),
                    toServiceModuleResponse(recommended),
                    firstNonBlank(rule.getMessage(), "Recommended by catalog governance rules."),
                    rule.getSeverity(),
                    false,
                    alreadySelected
            );
            mergeRecommendation(recommendations, recommended.getId(), item);
        }

        List<CatalogRuleItemResponse> openRecommendations = recommendations.values().stream()
                .filter(item -> !item.alreadySelected())
                .sorted(Comparator
                        .comparing((CatalogRuleItemResponse item) -> severityRank(item.severity()))
                        .thenComparing(item -> item.recommendedModule().sortOrder())
                        .thenComparing(item -> item.recommendedModule().name()))
                .toList();
        int blockers = (int) openRecommendations.stream()
                .filter(item -> item.severity() == ServiceDependency.DependencySeverity.BLOCKER)
                .count();
        int warnings = (int) openRecommendations.stream()
                .filter(item -> item.severity() == ServiceDependency.DependencySeverity.WARNING)
                .count();
        List<String> nextBestActions = buildNextActions(openRecommendations);
        List<ServiceModuleResponse> selected = selectedModules.stream()
                .sorted(Comparator.comparing(ServiceModule::getSortOrder).thenComparing(ServiceModule::getName))
                .map(module -> toServiceModuleResponse(module))
                .toList();

        return new CatalogRuleEvaluationResponse(
                selected,
                openRecommendations,
                blockers,
                warnings,
                nextBestActions,
                true,
                false
        );
    }

    private boolean ruleApplies(
            CatalogRule rule,
            Set<UUID> selectedModuleIds,
            Set<String> selectedCodes,
            String goal
    ) {
        if (rule.getRuleType() == CatalogRule.RuleType.ALWAYS) {
            return true;
        }
        if (rule.getRuleType() == CatalogRule.RuleType.SERVICE_SELECTED) {
            if (rule.getSourceModule() != null && selectedModuleIds.contains(rule.getSourceModule().getId())) {
                return true;
            }
            String key = normalize(rule.getTriggerKey());
            return key != null && selectedCodes.contains(key);
        }
        if (rule.getRuleType() == CatalogRule.RuleType.GOAL_KEYWORD
                || rule.getRuleType() == CatalogRule.RuleType.RISK_SIGNAL
                || rule.getRuleType() == CatalogRule.RuleType.PRODUCT_STAGE) {
            String key = normalize(rule.getTriggerKey());
            return key != null && !goal.isBlank() && goal.contains(key);
        }
        return false;
    }

    private void mergeRecommendation(
            Map<UUID, CatalogRuleItemResponse> recommendations,
            UUID moduleId,
            CatalogRuleItemResponse candidate
    ) {
        CatalogRuleItemResponse existing = recommendations.get(moduleId);
        if (existing == null || severityRank(candidate.severity()) < severityRank(existing.severity())) {
            recommendations.put(moduleId, candidate);
        }
    }

    private List<String> buildNextActions(List<CatalogRuleItemResponse> recommendations) {
        List<String> actions = new ArrayList<>();
        long blockers = recommendations.stream().filter(item -> item.severity() == ServiceDependency.DependencySeverity.BLOCKER).count();
        if (blockers > 0) {
            actions.add("Resolve blocker dependencies before converting the draft into a project workspace.");
        }
        recommendations.stream()
                .limit(3)
                .map(item -> "Add " + item.recommendedModule().name() + " to strengthen the service plan.")
                .forEach(actions::add);
        if (actions.isEmpty()) {
            actions.add("The selected services are dependency-complete for the current catalog rules.");
        }
        return actions;
    }

    private int severityRank(ServiceDependency.DependencySeverity severity) {
        if (severity == ServiceDependency.DependencySeverity.BLOCKER) {
            return 0;
        }
        if (severity == ServiceDependency.DependencySeverity.WARNING) {
            return 1;
        }
        if (severity == ServiceDependency.DependencySeverity.RECOMMENDED) {
            return 2;
        }
        return 3;
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }
}
