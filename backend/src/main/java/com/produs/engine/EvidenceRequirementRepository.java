package com.produs.engine;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EvidenceRequirementRepository extends JpaRepository<EvidenceRequirement, UUID> {
    List<EvidenceRequirement> findByCriterionIdOrderByCreatedAtAsc(UUID criterionId);
    List<EvidenceRequirement> findByMilestoneIdOrderByCreatedAtAsc(UUID milestoneId);
}
