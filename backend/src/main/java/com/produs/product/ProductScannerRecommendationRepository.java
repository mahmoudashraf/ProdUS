package com.produs.product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductScannerRecommendationRepository extends JpaRepository<ProductScannerRecommendation, UUID> {
    List<ProductScannerRecommendation> findByProductProfileIdOrderByCreatedAtAsc(UUID productProfileId);
}
