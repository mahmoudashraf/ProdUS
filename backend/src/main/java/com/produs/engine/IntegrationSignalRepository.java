package com.produs.engine;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface IntegrationSignalRepository extends JpaRepository<IntegrationSignal, UUID> {
    List<IntegrationSignal> findByConnectionIdOrderByCreatedAtDesc(UUID connectionId);
    List<IntegrationSignal> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
}
