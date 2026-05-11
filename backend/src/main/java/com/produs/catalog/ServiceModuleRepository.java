package com.produs.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ServiceModuleRepository extends JpaRepository<ServiceModule, UUID> {
    List<ServiceModule> findByActiveTrueOrderBySortOrderAscNameAsc();
    List<ServiceModule> findByCategoryIdAndActiveTrueOrderBySortOrderAscNameAsc(UUID categoryId);
    Optional<ServiceModule> findBySlug(String slug);
}
