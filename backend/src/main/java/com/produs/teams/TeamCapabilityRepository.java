package com.produs.teams;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TeamCapabilityRepository extends JpaRepository<TeamCapability, UUID> {
    List<TeamCapability> findByTeamId(UUID teamId);
}
