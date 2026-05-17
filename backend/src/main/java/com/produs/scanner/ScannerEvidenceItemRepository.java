package com.produs.scanner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ScannerEvidenceItemRepository extends JpaRepository<ScannerEvidenceItem, UUID> {
    List<ScannerEvidenceItem> findByProductProfileIdOrderByCreatedAtDesc(UUID productProfileId);
    List<ScannerEvidenceItem> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
    List<ScannerEvidenceItem> findByMilestoneIdOrderByCreatedAtDesc(UUID milestoneId);
    List<ScannerEvidenceItem> findByFindingIdOrderByCreatedAtDesc(UUID findingId);
}
