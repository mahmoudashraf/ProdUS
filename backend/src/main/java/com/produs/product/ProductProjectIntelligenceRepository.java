package com.produs.product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProductProjectIntelligenceRepository extends JpaRepository<ProductProjectIntelligence, UUID> {
    Optional<ProductProjectIntelligence> findByProductProfileId(UUID productProfileId);
}
