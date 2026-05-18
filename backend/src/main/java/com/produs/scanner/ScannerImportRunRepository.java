package com.produs.scanner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ScannerImportRunRepository extends JpaRepository<ScannerImportRun, UUID> {
    List<ScannerImportRun> findByProductProfileIdOrderByCreatedAtDesc(UUID productProfileId);
    List<ScannerImportRun> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
    List<ScannerImportRun> findByScanSourceIdOrderByCreatedAtDesc(UUID scanSourceId);
    List<ScannerImportRun> findTop12ByOrderByCreatedAtDesc();
    List<ScannerImportRun> findByCreatedAtBeforeAndStorageKeyIsNotNull(LocalDateTime cutoff);
}
