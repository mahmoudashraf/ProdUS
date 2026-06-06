package com.produs.engine;

import com.produs.entity.User;
import com.produs.product.ProductProfile;
import com.produs.shared.BaseEntity;
import com.produs.workspace.ProjectWorkspace;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "launch_readiness_reports")
public class LaunchReadinessReport extends BaseEntity {

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "product_profile_id", nullable = false)
    private ProductProfile productProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id")
    private ProjectWorkspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_diagnosis_id")
    private ProductDiagnosis sourceDiagnosis;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by", nullable = false)
    private User generatedBy;

    @Column(name = "report_version", nullable = false)
    private int reportVersion = 1;

    @Column(nullable = false)
    private String title;

    @Column(name = "ship_confidence_score", nullable = false)
    private int shipConfidenceScore;

    @Column(name = "status_label", nullable = false)
    private String statusLabel;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(name = "ready_summary", columnDefinition = "TEXT")
    private String readySummary;

    @Column(name = "risk_summary", columnDefinition = "TEXT")
    private String riskSummary;

    @Column(name = "next_owner_decision", columnDefinition = "TEXT")
    private String nextOwnerDecision;

    @Column(name = "ready_items_json", columnDefinition = "TEXT")
    private String readyItemsJson = "[]";

    @Column(name = "risk_items_json", columnDefinition = "TEXT")
    private String riskItemsJson = "[]";

    @Column(name = "selected_services_json", columnDefinition = "TEXT")
    private String selectedServicesJson = "[]";

    @Column(name = "proof_collected_json", columnDefinition = "TEXT")
    private String proofCollectedJson = "[]";

    @Column(name = "proof_missing_json", columnDefinition = "TEXT")
    private String proofMissingJson = "[]";

    @Column(name = "source_snapshot_json", columnDefinition = "TEXT")
    private String sourceSnapshotJson = "{}";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.GENERATED;

    public enum ReportStatus {
        GENERATED,
        SHARED,
        ARCHIVED
    }
}
