package com.produs.requirements;

import com.produs.catalog.ServiceModule;
import com.produs.product.ProductProfile;
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
@Table(name = "requirement_intakes")
public class RequirementIntake extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_profile_id", nullable = false)
    private ProductProfile productProfile;

    @ManyToOne
    @JoinColumn(name = "requested_service_module_id")
    private ServiceModule requestedServiceModule;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String businessGoal;

    @Column(name = "current_problems", columnDefinition = "TEXT")
    private String currentProblems;

    @Column(columnDefinition = "TEXT")
    private String constraints;

    @Column(name = "risk_signals", columnDefinition = "TEXT")
    private String riskSignals;

    @Column(name = "requirement_brief", columnDefinition = "TEXT")
    private String requirementBrief;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequirementStatus status = RequirementStatus.DRAFT;

    public enum RequirementStatus {
        DRAFT,
        SUBMITTED,
        PACKAGE_RECOMMENDED,
        CLOSED
    }
}
