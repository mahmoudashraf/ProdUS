package com.produs.exception;

import com.produs.dto.PlatformDtos.CatalogRuleEvaluationResponse;
import com.produs.dto.PlatformDtos.CatalogRuleItemResponse;
import com.produs.catalog.ServiceDependency;

import java.util.List;
import java.util.UUID;

public class CatalogDependencyBlockedException extends IllegalArgumentException {

    private final List<MissingCatalogService> missingServices;
    private final List<String> nextBestActions;

    public CatalogDependencyBlockedException(CatalogRuleEvaluationResponse evaluation) {
        super("Add the required lifecycle services before starting the project workspace.");
        this.missingServices = evaluation == null
                ? List.of()
                : evaluation.recommendations().stream()
                        .filter(item -> item.severity() == ServiceDependency.DependencySeverity.BLOCKER)
                        .filter(item -> !item.alreadySelected())
                        .map(CatalogDependencyBlockedException::toMissingService)
                        .toList();
        this.nextBestActions = evaluation == null ? List.of() : evaluation.nextBestActions();
    }

    public List<MissingCatalogService> getMissingServices() {
        return missingServices;
    }

    public List<String> getNextBestActions() {
        return nextBestActions;
    }

    private static MissingCatalogService toMissingService(CatalogRuleItemResponse item) {
        var module = item.recommendedModule();
        return new MissingCatalogService(
                module.id(),
                module.name(),
                module.stableCode(),
                module.category() == null ? "" : module.category().name(),
                item.reason(),
                item.source(),
                item.required()
        );
    }

    public record MissingCatalogService(
            UUID id,
            String name,
            String stableCode,
            String category,
            String reason,
            String source,
            boolean required
    ) {}
}
