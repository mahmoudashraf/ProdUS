package com.produs.scanner;

import com.produs.entity.User;
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
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "scanner_artifact_deletions")
public class ScannerArtifactDeletion extends BaseEntity {

    @Column(name = "storage_key", nullable = false, length = 1000)
    private String storageKey;

    @Column(name = "source_type", nullable = false, length = 120)
    private String sourceType;

    @Column(name = "source_id")
    private UUID sourceId;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeletionStatus status = DeletionStatus.REQUESTED;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "failure_summary", columnDefinition = "TEXT")
    private String failureSummary;

    @ManyToOne
    @JoinColumn(name = "requested_by")
    private User requestedBy;

    public enum DeletionStatus {
        REQUESTED,
        DELETED,
        FAILED
    }
}
