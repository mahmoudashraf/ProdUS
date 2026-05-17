package com.produs.scanner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ScannerJobRepository extends JpaRepository<ScannerJob, UUID> {
    Optional<ScannerJob> findTopByStatusAndNextRunAtLessThanEqualOrderByCreatedAtAsc(ScannerJob.JobStatus status, LocalDateTime now);
    Optional<ScannerJob> findByScanRunId(UUID scanRunId);
    List<ScannerJob> findByStatusInOrderByCreatedAtAsc(Collection<ScannerJob.JobStatus> statuses);
    List<ScannerJob> findTop12ByOrderByCreatedAtDesc();
}
