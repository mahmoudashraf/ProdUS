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
import jakarta.persistence.FetchType;
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
@Table(name = "scanner_risk_threads")
public class ScannerRiskThread extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_profile_id", nullable = false)
    private ProductProfile productProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id")
    private ProjectWorkspace workspace;

    @Column(nullable = false)
    private String fingerprint;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NormalizedFinding.FindingSeverity severity = NormalizedFinding.FindingSeverity.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_state", nullable = false)
    private RiskState currentState = RiskState.NEW;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "first_seen_scan_run_id")
    private ScanRun firstSeenScanRun;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_seen_scan_run_id")
    private ScanRun lastSeenScanRun;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_fixed_scan_run_id")
    private ScanRun lastFixedScanRun;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_finding_id")
    private NormalizedFinding currentFinding;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommended_module_id")
    private ServiceModule recommendedModule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scanner_suggested_module_id")
    private ServiceModule scannerSuggestedModule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_mapping_changed_by_id")
    private User serviceMappingChangedBy;

    @Column(name = "service_mapping_changed_at")
    private LocalDateTime serviceMappingChangedAt;

    @Column(name = "service_mapping_note", columnDefinition = "TEXT")
    private String serviceMappingNote;

    @Column(name = "source_tool")
    private String sourceTool;

    @Column(name = "source_rule_id")
    private String sourceRuleId;

    @Column(name = "affected_component", length = 1000)
    private String affectedComponent;

    @Column(name = "readiness_area")
    private String readinessArea;

    @Column(name = "business_risk", columnDefinition = "TEXT")
    private String businessRisk;

    @Column(name = "evidence_required", columnDefinition = "TEXT")
    private String evidenceRequired;

    @Column(name = "accepted_reason", columnDefinition = "TEXT")
    private String acceptedReason;

    @Column(name = "review_due_on")
    private LocalDate reviewDueOn;

    public enum RiskState {
        NEW,
        STILL_OPEN,
        READY_TO_CHECK,
        FIXED_BY_LATEST_SCAN,
        RETURNED,
        ACCEPTED_RISK,
        FALSE_POSITIVE,
        NEEDS_PROOF,
        INCOMPLETE_CHECK
    }
}
