package com.produs.scanner;

import com.produs.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "scanner_jobs")
public class ScannerJob extends BaseEntity {

    @OneToOne(optional = false)
    @JoinColumn(name = "scan_run_id", nullable = false)
    private ScanRun scanRun;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobStatus status = JobStatus.QUEUED;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount;

    @Column(name = "max_attempts", nullable = false)
    private int maxAttempts = 1;

    @Column(name = "next_run_at", nullable = false)
    private LocalDateTime nextRunAt = LocalDateTime.now();

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;

    @Column(name = "lock_owner")
    private String lockOwner;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "failure_summary", columnDefinition = "TEXT")
    private String failureSummary;

    public enum JobStatus {
        QUEUED,
        RUNNING,
        COMPLETED,
        FAILED,
        CANCELED
    }
}
