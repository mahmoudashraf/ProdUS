package com.produs.catalog;

import com.produs.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "service_modules")
public class ServiceModule extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private ServiceCategory category;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(name = "stable_code", unique = true)
    private String stableCode;

    @Column(name = "service_layer")
    private String serviceLayer;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "owner_outcome", columnDefinition = "TEXT")
    private String ownerOutcome;

    @Column(name = "required_inputs", columnDefinition = "TEXT")
    private String requiredInputs;

    @Column(name = "expected_deliverables", columnDefinition = "TEXT")
    private String expectedDeliverables;

    @Column(name = "acceptance_criteria", columnDefinition = "TEXT")
    private String acceptanceCriteria;

    @Column(name = "timeline_range")
    private String timelineRange;

    @Column(name = "price_range")
    private String priceRange;

    @Column(name = "workflow_steps", columnDefinition = "TEXT")
    private String workflowSteps;

    @Column(name = "required_evidence_types", columnDefinition = "TEXT")
    private String requiredEvidenceTypes;

    @Column(name = "suggested_team_roles", columnDefinition = "TEXT")
    private String suggestedTeamRoles;

    @Column(name = "ai_assistance_tags", columnDefinition = "TEXT")
    private String aiAssistanceTags;

    @Column(name = "human_review_required", nullable = false)
    private boolean humanReviewRequired = true;

    @Column(name = "visible", nullable = false)
    private boolean visible = true;

    @Column(name = "release_stage")
    private String releaseStage;

    @Column(name = "maturity_level")
    private String maturityLevel;

    @Column(name = "source_aliases", columnDefinition = "TEXT")
    private String sourceAliases;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(nullable = false)
    private boolean active = true;
}
