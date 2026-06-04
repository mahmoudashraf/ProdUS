package com.produs.engine;

import com.produs.catalog.ServiceModule;
import com.produs.scanner.NormalizedFinding;
import com.produs.scanner.ScannerEvidenceItem;
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

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "product_findings")
public class ProductFinding extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "diagnosis_id", nullable = false)
    private ProductDiagnosis diagnosis;

    @ManyToOne
    @JoinColumn(name = "recommended_module_id")
    private ServiceModule recommendedModule;

    @ManyToOne
    @JoinColumn(name = "normalized_finding_id")
    private NormalizedFinding normalizedFinding;

    @ManyToOne
    @JoinColumn(name = "scanner_evidence_item_id")
    private ScannerEvidenceItem scannerEvidenceItem;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "affected_layer")
    private String affectedLayer;

    @Column(name = "readiness_area")
    private String readinessArea;

    @Column(name = "business_risk", columnDefinition = "TEXT")
    private String businessRisk;

    @Column(name = "owner_decision", columnDefinition = "TEXT")
    private String ownerDecision;

    @Column(name = "evidence_required", columnDefinition = "TEXT")
    private String evidenceRequired;

    @Column(name = "mapping_reason", columnDefinition = "TEXT")
    private String mappingReason;

    @Column(name = "mapping_confidence")
    private Double mappingConfidence;

    @Column(name = "mapping_source")
    private String mappingSource;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FindingSeverity severity = FindingSeverity.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "confidence_level", nullable = false)
    private ConfidenceLevel confidenceLevel = ConfidenceLevel.MEDIUM;

    @Column(name = "confidence_basis", columnDefinition = "TEXT")
    private String confidenceBasis;

    @Column(name = "source_signal", columnDefinition = "TEXT")
    private String sourceSignal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FindingStatus status = FindingStatus.OPEN;

    public enum FindingSeverity {
        INFO,
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    public enum ConfidenceLevel {
        LOW,
        MEDIUM,
        HIGH
    }

    public enum FindingStatus {
        OPEN,
        SERVICE_SELECTED,
        ACCEPTED_RISK,
        RESOLVED,
        DISMISSED
    }
}
