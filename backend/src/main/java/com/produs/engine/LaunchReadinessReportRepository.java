package com.produs.engine;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface LaunchReadinessReportRepository extends JpaRepository<LaunchReadinessReport, UUID> {
    Optional<LaunchReadinessReport> findFirstByProductProfileIdOrderByCreatedAtDesc(UUID productProfileId);
    Optional<LaunchReadinessReport> findFirstByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
    long countByProductProfileId(UUID productProfileId);
}
