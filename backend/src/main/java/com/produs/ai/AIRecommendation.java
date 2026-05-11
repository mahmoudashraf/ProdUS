package com.produs.ai;

import com.produs.entity.User;
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
@Table(name = "ai_recommendations")
public class AIRecommendation extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "recommendation_type", nullable = false)
    private String recommendationType;

    @Column(name = "source_entity_type")
    private String sourceEntityType;

    @Column(name = "source_entity_id")
    private String sourceEntityId;

    @Column(name = "prompt_version")
    private String promptVersion;

    @Column
    private Double confidence;

    @Column(columnDefinition = "TEXT")
    private String rationale;

    @Column(name = "output_json", columnDefinition = "TEXT")
    private String outputJson;

    @Column(name = "human_feedback", columnDefinition = "TEXT")
    private String humanFeedback;
}
