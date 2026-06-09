package com.produs.product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductServiceRecommendationRepository extends JpaRepository<ProductServiceRecommendation, UUID> {
    List<ProductServiceRecommendation> findByProductProfileIdOrderBySequenceNumberAscCreatedAtAsc(UUID productProfileId);
    Optional<ProductServiceRecommendation> findByProductProfileIdAndServiceModuleId(UUID productProfileId, UUID serviceModuleId);
    long deleteByProductProfileIdAndCreatedByAiTrue(UUID productProfileId);
}
