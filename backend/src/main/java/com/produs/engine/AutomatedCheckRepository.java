package com.produs.engine;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AutomatedCheckRepository extends JpaRepository<AutomatedCheck, UUID> {
    List<AutomatedCheck> findByCriterionIdOrderByCreatedAtDesc(UUID criterionId);
    List<AutomatedCheck> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
    Optional<AutomatedCheck> findTopByWorkspaceIdAndCheckTypeAndExternalRefOrderByCreatedAtDesc(UUID workspaceId, String checkType, String externalRef);
}
