package com.produs.commerce;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SupportRequestRepository extends JpaRepository<SupportRequest, UUID> {
    List<SupportRequest> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
    List<SupportRequest> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<SupportRequest> findByTeamManagerIdOrderByCreatedAtDesc(UUID managerId);
    List<SupportRequest> findByTeamIdOrderByCreatedAtDesc(UUID teamId);
}
