package com.produs.scanner;

import com.produs.catalog.ServiceModule;
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

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "normalized_findings")
public class NormalizedFinding extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_profile_id", nullable = false)
    private ProductProfile productProfile;

    @ManyToOne
    @JoinColumn(name = "workspace_id")
    private ProjectWorkspace workspace;

    @ManyToOne(optional = false)
    @JoinColumn(name = "scan_run_id", nullable = false)
    private ScanRun scanRun;

    @ManyToOne(optional = false)
    @JoinColumn(name = "tool_run_id", nullable = false)
    private ToolRun toolRun;

    @Column(nullable = false)
    private String fingerprint;

    @Column(name = "source_tool", nullable = false)
    private String sourceTool;

    @Column(name = "source_rule_id")
    private String sourceRuleId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FindingSeverity severity = FindingSeverity.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FindingStatus status = FindingStatus.OPEN;

    @Column(name = "affected_component", length = 1000)
    private String affectedComponent;

    @ManyToOne
    @JoinColumn(name = "evidence_item_id")
    private ScannerEvidenceItem evidenceItem;

    @ManyToOne
    @JoinColumn(name = "recommended_module_id")
    private ServiceModule recommendedModule;

    @Column(name = "confidence_basis", columnDefinition = "TEXT")
    private String confidenceBasis;

    @Column(name = "risk_acceptance_reason", columnDefinition = "TEXT")
    private String riskAcceptanceReason;

    @Column(name = "risk_review_due_on")
    private LocalDate riskReviewDueOn;

    @ManyToOne
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    public enum FindingSeverity {
        INFO,
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    public enum FindingStatus {
        NEW,
        OPEN,
        RESOLVED,
        REGRESSED,
        ACCEPTED_RISK,
        FALSE_POSITIVE,
        INSUFFICIENT_EVIDENCE
    }
}
