package com.produs.catalog;

import com.produs.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "catalog_package_templates")
public class PackageTemplate extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "target_product_stage")
    private String targetProductStage;

    @Column(name = "customer_fit", columnDefinition = "TEXT")
    private String customerFit;

    @Column(name = "timeline_range")
    private String timelineRange;

    @Column(name = "budget_range")
    private String budgetRange;

    @Column(name = "outcome_summary", columnDefinition = "TEXT")
    private String outcomeSummary;

    @Column(name = "ai_readiness_notes", columnDefinition = "TEXT")
    private String aiReadinessNotes;

    @Column(name = "human_review_required", nullable = false)
    private boolean humanReviewRequired = true;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
