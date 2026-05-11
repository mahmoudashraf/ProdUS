package com.produs.teams;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamMemberRepository extends JpaRepository<TeamMember, UUID> {
    List<TeamMember> findByTeamIdOrderByCreatedAtAsc(UUID teamId);
    List<TeamMember> findByUserIdAndActiveTrueOrderByCreatedAtDesc(UUID userId);
    Optional<TeamMember> findByTeamIdAndUserId(UUID teamId, UUID userId);
    boolean existsByTeamIdAndUserIdAndActiveTrue(UUID teamId, UUID userId);
}
