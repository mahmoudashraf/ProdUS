package com.produs.teams;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamRepository extends JpaRepository<Team, UUID> {
    List<Team> findByActiveTrueOrderByCreatedAtDesc();
    Optional<Team> findByIdAndActiveTrue(UUID id);
    List<Team> findByManagerIdOrderByCreatedAtDesc(UUID managerId);
}
