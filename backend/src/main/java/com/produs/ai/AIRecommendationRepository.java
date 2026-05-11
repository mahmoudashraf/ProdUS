package com.produs.ai;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AIRecommendationRepository extends JpaRepository<AIRecommendation, UUID> {
    List<AIRecommendation> findBySourceEntityTypeAndSourceEntityIdOrderByCreatedAtDesc(String sourceEntityType, String sourceEntityId);
    List<AIRecommendation> findByCreatedByIdOrderByCreatedAtDesc(UUID createdById);
}
