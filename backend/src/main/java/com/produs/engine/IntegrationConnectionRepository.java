package com.produs.engine;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface IntegrationConnectionRepository extends JpaRepository<IntegrationConnection, UUID> {
    List<IntegrationConnection> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
    List<IntegrationConnection> findByProductProfileIdOrderByCreatedAtDesc(UUID productProfileId);
}
