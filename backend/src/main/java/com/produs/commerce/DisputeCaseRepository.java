package com.produs.commerce;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DisputeCaseRepository extends JpaRepository<DisputeCase, UUID> {
    List<DisputeCase> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
    List<DisputeCase> findByWorkspaceOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<DisputeCase> findByTeamManagerIdOrderByCreatedAtDesc(UUID managerId);
    List<DisputeCase> findByTeamIdOrderByCreatedAtDesc(UUID teamId);
}
