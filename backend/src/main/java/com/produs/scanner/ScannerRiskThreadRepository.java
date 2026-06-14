package com.produs.scanner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ScannerRiskThreadRepository extends JpaRepository<ScannerRiskThread, UUID> {
    Optional<ScannerRiskThread> findByProductProfileIdAndFingerprint(UUID productProfileId, String fingerprint);
    List<ScannerRiskThread> findByProductProfileIdOrderBySeverityDescUpdatedAtDesc(UUID productProfileId);
    List<ScannerRiskThread> findByWorkspaceIdOrderBySeverityDescUpdatedAtDesc(UUID workspaceId);
    List<ScannerRiskThread> findByIdIn(Collection<UUID> ids);
}
