package com.produs.scanner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ScanRunRepository extends JpaRepository<ScanRun, UUID> {
    List<ScanRun> findByProductProfileIdOrderByCreatedAtDesc(UUID productProfileId);
    List<ScanRun> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
    boolean existsByProductProfileIdAndDepthAndStatusIn(UUID productProfileId, ScanRun.ScanDepth depth, Collection<ScanRun.RunStatus> statuses);
}
