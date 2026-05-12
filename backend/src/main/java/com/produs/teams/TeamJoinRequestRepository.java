package com.produs.teams;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamJoinRequestRepository extends JpaRepository<TeamJoinRequest, UUID> {
    List<TeamJoinRequest> findByTeamIdOrderByCreatedAtDesc(UUID teamId);
    List<TeamJoinRequest> findByRequesterIdOrderByCreatedAtDesc(UUID requesterId);
    Optional<TeamJoinRequest> findByTeamIdAndRequesterId(UUID teamId, UUID requesterId);
}
