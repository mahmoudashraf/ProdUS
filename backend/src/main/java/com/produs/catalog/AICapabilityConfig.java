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
@Table(name = "catalog_ai_capability_configs")
public class AICapabilityConfig extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String name;

    @Column(name = "capability_type", nullable = false)
    private String capabilityType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "input_contract", columnDefinition = "TEXT")
    private String inputContract;

    @Column(name = "output_contract", columnDefinition = "TEXT")
    private String outputContract;

    @Column(name = "allowed_sources", columnDefinition = "TEXT")
    private String allowedSources;

    @Column(name = "forbidden_claims", columnDefinition = "TEXT")
    private String forbiddenClaims;

    @Column(name = "human_review_required", nullable = false)
    private boolean humanReviewRequired = true;

    @Column(nullable = false)
    private boolean enabled = false;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
