package com.produs.engine;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReviewDecisionRepository extends JpaRepository<ReviewDecision, UUID> {
    List<ReviewDecision> findByCriterionIdOrderByCreatedAtDesc(UUID criterionId);
    List<ReviewDecision> findByMilestoneIdOrderByCreatedAtDesc(UUID milestoneId);
}
