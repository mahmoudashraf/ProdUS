package com.produs.workspace;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceParticipantRepository extends JpaRepository<WorkspaceParticipant, UUID> {
    List<WorkspaceParticipant> findByWorkspaceIdOrderByCreatedAtAsc(UUID workspaceId);
    List<WorkspaceParticipant> findByUserIdAndActiveTrueOrderByCreatedAtDesc(UUID userId);
    Optional<WorkspaceParticipant> findByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);
    Optional<WorkspaceParticipant> findByWorkspaceIdAndUserIdAndActiveTrue(UUID workspaceId, UUID userId);
    boolean existsByWorkspaceIdAndUserIdAndActiveTrue(UUID workspaceId, UUID userId);
}
