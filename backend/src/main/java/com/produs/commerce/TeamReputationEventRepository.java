package com.produs.commerce;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TeamReputationEventRepository extends JpaRepository<TeamReputationEvent, UUID> {
    List<TeamReputationEvent> findByTeamIdOrderByCreatedAtDesc(UUID teamId);
    List<TeamReputationEvent> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
}
