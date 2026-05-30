package com.produs.product;

import com.produs.shared.BaseEntity;
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
@Table(name = "product_readiness_tasks")
public class ProductReadinessTask extends BaseEntity {

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "product_profile_id", nullable = false)
    private ProductProfile productProfile;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String source = "AI_PROJECT_ANALYSIS";

    @Column(name = "source_analysis_field")
    private String sourceAnalysisField;

    @Column(nullable = false)
    private String priority = "MEDIUM";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.OPEN;

    @Column(name = "created_by_ai", nullable = false)
    private boolean createdByAi = true;

    public enum Status {
        OPEN,
        IN_PROGRESS,
        DONE,
        SKIPPED
    }
}
