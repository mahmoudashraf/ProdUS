package com.produs.scanner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NormalizedFindingRepository extends JpaRepository<NormalizedFinding, UUID> {
    List<NormalizedFinding> findByProductProfileIdOrderBySeverityDescCreatedAtDesc(UUID productProfileId);
    List<NormalizedFinding> findByProductProfileIdAndWorkspaceIdOrderBySeverityDescCreatedAtDesc(UUID productProfileId, UUID workspaceId);
    List<NormalizedFinding> findByScanRunIdOrderBySeverityDescCreatedAtDesc(UUID scanRunId);
    Optional<NormalizedFinding> findTopByProductProfileIdAndFingerprintOrderByCreatedAtDesc(UUID productProfileId, String fingerprint);
}
