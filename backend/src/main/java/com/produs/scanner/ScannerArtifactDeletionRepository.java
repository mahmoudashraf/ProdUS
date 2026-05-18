package com.produs.scanner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ScannerArtifactDeletionRepository extends JpaRepository<ScannerArtifactDeletion, UUID> {
    List<ScannerArtifactDeletion> findTop25ByOrderByCreatedAtDesc();
}
