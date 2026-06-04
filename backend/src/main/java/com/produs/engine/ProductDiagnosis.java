package com.produs.engine;

import com.produs.entity.User;
import com.produs.product.ProductProfile;
import com.produs.requirements.RequirementIntake;
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

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "product_diagnoses")
public class ProductDiagnosis extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_profile_id", nullable = false)
    private ProductProfile productProfile;

    @ManyToOne
    @JoinColumn(name = "requirement_intake_id")
    private RequirementIntake requirementIntake;

    @ManyToOne
    @JoinColumn(name = "workspace_id")
    private ProjectWorkspace workspace;

    @ManyToOne(optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "readiness_score", nullable = false)
    private Integer readinessScore = 50;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(name = "access_signals", columnDefinition = "TEXT")
    private String accessSignals;

    @Enumerated(EnumType.STRING)
    @Column(name = "diagnosis_source", nullable = false)
    private DiagnosisSource diagnosisSource = DiagnosisSource.MANUAL_DETERMINISTIC;

    @Column(name = "generated_from_scan_run_ids", columnDefinition = "TEXT")
    private String generatedFromScanRunIds;

    @Column(name = "top_blocker_count", nullable = false)
    private int topBlockerCount = 0;

    @Column(name = "evidence_count", nullable = false)
    private int evidenceCount = 0;

    @Column(name = "unmapped_finding_count", nullable = false)
    private int unmappedFindingCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DiagnosisStatus status = DiagnosisStatus.READY;

    @Column(name = "ai_ready", nullable = false)
    private boolean aiReady = true;

    @Column(name = "ai_executed", nullable = false)
    private boolean aiExecuted = false;

    public enum DiagnosisStatus {
        DRAFT,
        READY,
        FINDINGS_REVIEWED,
        SERVICE_PLAN_CREATED,
        ARCHIVED
    }

    public enum DiagnosisSource {
        MANUAL_DETERMINISTIC,
        SCANNER_READINESS
    }
}
