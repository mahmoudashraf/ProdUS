package com.produs.engine;

import com.produs.commerce.SupportSubscription;
import com.produs.entity.User;
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

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "product_health_reviews")
public class ProductHealthReview extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private ProjectWorkspace workspace;

    @ManyToOne
    @JoinColumn(name = "support_subscription_id")
    private SupportSubscription supportSubscription;

    @ManyToOne(optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "period_start")
    private LocalDate periodStart;

    @Column(name = "period_end")
    private LocalDate periodEnd;

    @Column(name = "health_score", nullable = false)
    private Integer healthScore = 70;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String risks;

    @Column(columnDefinition = "TEXT")
    private String actions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReviewStatus status = ReviewStatus.DRAFT;

    public enum ReviewStatus {
        DRAFT,
        PUBLISHED,
        ARCHIVED
    }
}
