package com.produs.scanner;

import com.produs.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "tool_runs")
public class ToolRun extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "scan_run_id", nullable = false)
    private ScanRun scanRun;

    @Column(name = "tool_name", nullable = false)
    private String toolName;

    @Column(name = "tool_version")
    private String toolVersion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ToolStatus status = ToolStatus.RUNNING;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "raw_artifact_ref", length = 1000)
    private String rawArtifactRef;

    @Column(name = "storage_key", length = 1000)
    private String storageKey;

    @Column(name = "normalized_count", nullable = false)
    private int normalizedCount;

    @Column(name = "error_summary", columnDefinition = "TEXT")
    private String errorSummary;

    public enum ToolStatus {
        QUEUED,
        RUNNING,
        COMPLETED,
        FAILED,
        CANCELED
    }
}
