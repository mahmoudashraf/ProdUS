package com.produs.commerce;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SupportSubscriptionRepository extends JpaRepository<SupportSubscription, UUID> {
    List<SupportSubscription> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<SupportSubscription> findByTeamManagerIdOrderByCreatedAtDesc(UUID managerId);
    List<SupportSubscription> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
}
