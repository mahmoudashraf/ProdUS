package com.produs.engine;

import com.produs.catalog.ServiceModule;
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

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "affected_layer")
    private String affectedLayer;

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
