package com.produs.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PackageTemplateRepository extends JpaRepository<PackageTemplate, UUID> {
    List<PackageTemplate> findByActiveTrueOrderBySortOrderAscNameAsc();
    Optional<PackageTemplate> findBySlug(String slug);
}
