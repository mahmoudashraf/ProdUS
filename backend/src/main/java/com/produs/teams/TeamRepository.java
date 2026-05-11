package com.produs.teams;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TeamRepository extends JpaRepository<Team, UUID> {
    List<Team> findByActiveTrueOrderByCreatedAtDesc();
    List<Team> findByManagerIdOrderByCreatedAtDesc(UUID managerId);
}
