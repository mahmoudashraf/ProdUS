package com.produs.scanner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ScannerScheduleRepository extends JpaRepository<ScannerSchedule, UUID> {
    List<ScannerSchedule> findByProductProfileIdOrderByCreatedAtDesc(UUID productProfileId);
    List<ScannerSchedule> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
    List<ScannerSchedule> findTop20ByActiveTrueAndNextRunAtLessThanEqualOrderByNextRunAtAsc(LocalDateTime now);
}
