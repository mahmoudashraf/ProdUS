package com.produs.scanner;

import com.produs.entity.User;
import com.produs.product.ProductProfile;
import com.produs.shared.BaseEntity;
import com.produs.workspace.ProjectWorkspace;
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
@Table(name = "scanner_evidence_export_bundles")
public class ScannerEvidenceExportBundle extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_profile_id", nullable = false)
    private ProductProfile productProfile;

    @ManyToOne
    @JoinColumn(name = "workspace_id")
    private ProjectWorkspace workspace;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExportStatus status = ExportStatus.REQUESTED;

    @Column(name = "artifact_ref", length = 1000)
    private String artifactRef;

    @Column(name = "storage_key", length = 1000)
    private String storageKey;

    @Column(name = "finding_count", nullable = false)
    private int findingCount;

    @Column(name = "evidence_count", nullable = false)
    private int evidenceCount;

    @Column(name = "tool_run_count", nullable = false)
    private int toolRunCount;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "failure_summary", columnDefinition = "TEXT")
    private String failureSummary;

    @ManyToOne(optional = false)
    @JoinColumn(name = "requested_by", nullable = false)
    private User requestedBy;

    public enum ExportStatus {
        REQUESTED,
        COMPLETED,
        FAILED
    }
}
