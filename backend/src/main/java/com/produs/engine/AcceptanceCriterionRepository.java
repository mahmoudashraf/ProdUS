package com.produs.engine;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AcceptanceCriterionRepository extends JpaRepository<AcceptanceCriterion, UUID> {
    List<AcceptanceCriterion> findByMilestoneIdOrderByCreatedAtAsc(UUID milestoneId);
    boolean existsByMilestoneId(UUID milestoneId);
}
