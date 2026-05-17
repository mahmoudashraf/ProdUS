package com.produs.scanner;

import com.produs.entity.User;
import com.produs.product.ProductProfile;
import com.produs.shared.BaseEntity;
import com.produs.workspace.Milestone;
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
@Table(name = "scanner_evidence_items")
public class ScannerEvidenceItem extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_profile_id", nullable = false)
    private ProductProfile productProfile;

    @ManyToOne
    @JoinColumn(name = "workspace_id")
    private ProjectWorkspace workspace;

    @ManyToOne
    @JoinColumn(name = "milestone_id")
    private Milestone milestone;

    @ManyToOne
    @JoinColumn(name = "finding_id")
    private NormalizedFinding finding;

    @ManyToOne
    @JoinColumn(name = "scan_run_id")
    private ScanRun scanRun;

    @ManyToOne
    @JoinColumn(name = "tool_run_id")
    private ToolRun toolRun;

    @Enumerated(EnumType.STRING)
    @Column(name = "evidence_type", nullable = false)
    private EvidenceType evidenceType = EvidenceType.SCAN_RESULT;

    @Column(nullable = false)
    private String source;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "artifact_ref", length = 1000)
    private String artifactRef;

    @Column(name = "storage_key", length = 1000)
    private String storageKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "redaction_status", nullable = false)
    private RedactionStatus redactionStatus = RedactionStatus.NONE;

    @Enumerated(EnumType.STRING)
    @Column(name = "confidence_level", nullable = false)
    private ConfidenceLevel confidenceLevel = ConfidenceLevel.HIGH;

    @ManyToOne(optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    public enum EvidenceType {
        SCAN_RESULT,
        CI_RUN,
        PULL_REQUEST,
        COMMIT,
        DEPLOYMENT_LOG,
        SCREENSHOT,
        URL_CHECK,
        RUNBOOK,
        MANUAL_NOTE
    }

    public enum RedactionStatus {
        NONE,
        REDACTED,
        SENSITIVE_HIDDEN
    }

    public enum ConfidenceLevel {
        LOW,
        MEDIUM,
        HIGH
    }
}
