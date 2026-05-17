package com.produs.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CatalogRuleRepository extends JpaRepository<CatalogRule, UUID> {
    List<CatalogRule> findByActiveTrueOrderBySortOrderAscSlugAsc();
    Optional<CatalogRule> findBySlug(String slug);
}
