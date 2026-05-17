package com.produs.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AICapabilityConfigRepository extends JpaRepository<AICapabilityConfig, UUID> {
    List<AICapabilityConfig> findAllByOrderBySortOrderAscNameAsc();
    Optional<AICapabilityConfig> findBySlug(String slug);
}
