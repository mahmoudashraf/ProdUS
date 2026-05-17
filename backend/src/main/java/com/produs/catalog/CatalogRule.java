package com.produs.catalog;

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
@Table(name = "catalog_rules")
public class CatalogRule extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String slug;

    @Enumerated(EnumType.STRING)
    @Column(name = "rule_type", nullable = false)
    private RuleType ruleType = RuleType.SERVICE_SELECTED;

    @Column(name = "trigger_key")
    private String triggerKey;

    @ManyToOne
    @JoinColumn(name = "source_module_id")
    private ServiceModule sourceModule;

    @ManyToOne(optional = false)
    @JoinColumn(name = "recommended_module_id", nullable = false)
    private ServiceModule recommendedModule;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ServiceDependency.DependencySeverity severity = ServiceDependency.DependencySeverity.RECOMMENDED;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "rule_metadata", columnDefinition = "TEXT")
    private String ruleMetadata;

    @Column(name = "human_review_required", nullable = false)
    private boolean humanReviewRequired = true;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    public enum RuleType {
        SERVICE_SELECTED,
        GOAL_KEYWORD,
        PRODUCT_STAGE,
        RISK_SIGNAL,
        ALWAYS
    }
}
