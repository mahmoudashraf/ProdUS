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
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "scan_runs")
public class ScanRun extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "scan_source_id", nullable = false)
    private ScanSource scanSource;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_profile_id", nullable = false)
    private ProductProfile productProfile;

    @ManyToOne
    @JoinColumn(name = "workspace_id")
    private ProjectWorkspace workspace;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false)
    private TriggerType triggerType = TriggerType.CI_UPLOAD;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RunStatus status = RunStatus.QUEUED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ScanDepth depth = ScanDepth.CI_EVIDENCE;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @ManyToOne(optional = false)
    @JoinColumn(name = "requested_by", nullable = false)
    private User requestedBy;

    @Column(name = "failure_summary", columnDefinition = "TEXT")
    private String failureSummary;

    @Column(name = "cancel_requested", nullable = false)
    private boolean cancelRequested;

    @Column(name = "scan_plan", columnDefinition = "TEXT")
    private String scanPlan;

    @Column(name = "branch_ref")
    private String branchRef;

    @Column(name = "runtime_target_url", length = 1000)
    private String runtimeTargetUrl;

    @Column(name = "container_image_ref", length = 1000)
    private String containerImageRef;

    @Column(name = "comparison_base_run_id")
    private UUID comparisonBaseRunId;

    public enum TriggerType {
        MANUAL_UPLOAD,
        CI_UPLOAD,
        SCHEDULED,
        HOSTED_SCAN,
        EXTERNAL_IMPORT
    }

    public enum RunStatus {
        QUEUED,
        RUNNING,
        COMPLETED,
        FAILED,
        CANCELED
    }

    public enum ScanDepth {
        CI_EVIDENCE,
        SAFE_STATIC,
        DEPENDENCY_CONTAINER,
        RUNTIME_BASELINE,
        DEEP_REVIEW
    }
}
