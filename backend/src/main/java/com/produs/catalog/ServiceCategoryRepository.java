package com.produs.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, UUID> {
    List<ServiceCategory> findByActiveTrueOrderBySortOrderAscNameAsc();
    Optional<ServiceCategory> findBySlug(String slug);
}
