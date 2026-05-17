package com.produs.engine;

import com.produs.catalog.ServiceModule;
import com.produs.packages.PackageModule;
import com.produs.shared.BaseEntity;
import com.produs.workspace.Milestone;
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
@Table(name = "acceptance_criteria")
public class AcceptanceCriterion extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "milestone_id", nullable = false)
    private Milestone milestone;

    @ManyToOne
    @JoinColumn(name = "package_module_id")
    private PackageModule packageModule;

    @ManyToOne
    @JoinColumn(name = "service_module_id")
    private ServiceModule serviceModule;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private boolean required = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CriterionStatus status = CriterionStatus.PENDING;

    @Column(name = "human_review_required", nullable = false)
    private boolean humanReviewRequired = true;

    public enum CriterionStatus {
        PENDING,
        IN_REVIEW,
        PASSED,
        FAILED,
        WAIVED
    }
}
