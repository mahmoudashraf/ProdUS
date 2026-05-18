package com.produs.scanner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ScannerEvidenceExportBundleRepository extends JpaRepository<ScannerEvidenceExportBundle, UUID> {
    List<ScannerEvidenceExportBundle> findByProductProfileIdOrderByCreatedAtDesc(UUID productProfileId);
}
