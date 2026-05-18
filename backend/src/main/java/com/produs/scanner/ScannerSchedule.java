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
@Table(name = "scanner_schedules")
public class ScannerSchedule extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_profile_id", nullable = false)
    private ProductProfile productProfile;

    @ManyToOne
    @JoinColumn(name = "workspace_id")
    private ProjectWorkspace workspace;

    @ManyToOne(optional = false)
    @JoinColumn(name = "scan_source_id", nullable = false)
    private ScanSource scanSource;

    @ManyToOne(optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ScanRun.ScanDepth depth = ScanRun.ScanDepth.SAFE_STATIC;

    @Column(name = "tool_keys", columnDefinition = "TEXT")
    private String toolKeys;

    @Column(name = "branch_ref")
    private String branchRef;

    @Column(name = "runtime_target_url", length = 1000)
    private String runtimeTargetUrl;

    @Column(name = "container_image_ref", length = 1000)
    private String containerImageRef;

    @Column(name = "interval_days", nullable = false)
    private int intervalDays = 7;

    @Column(name = "next_run_at", nullable = false)
    private LocalDateTime nextRunAt = LocalDateTime.now();

    @Column(name = "last_run_at")
    private LocalDateTime lastRunAt;

    @Column(name = "last_scan_run_id")
    private UUID lastScanRunId;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;
}
