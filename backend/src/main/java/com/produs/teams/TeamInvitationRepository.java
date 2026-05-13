package com.produs.teams;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamInvitationRepository extends JpaRepository<TeamInvitation, UUID> {
    List<TeamInvitation> findByTeamIdOrderByCreatedAtDesc(UUID teamId);
    List<TeamInvitation> findByEmailOrderByCreatedAtDesc(String email);
    Optional<TeamInvitation> findByTeamIdAndEmail(UUID teamId, String email);
}
