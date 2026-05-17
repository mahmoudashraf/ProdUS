package com.produs.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CatalogTemplateDefinitionRepository extends JpaRepository<CatalogTemplateDefinition, UUID> {
    List<CatalogTemplateDefinition> findByActiveTrueOrderBySortOrderAscNameAsc();
    Optional<CatalogTemplateDefinition> findBySlug(String slug);
}
