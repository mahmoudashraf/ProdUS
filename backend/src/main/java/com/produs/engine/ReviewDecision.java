package com.produs.engine;

import com.produs.entity.User;
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
@Table(name = "review_decisions")
public class ReviewDecision extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "milestone_id", nullable = false)
    private Milestone milestone;

    @ManyToOne
    @JoinColumn(name = "criterion_id")
    private AcceptanceCriterion criterion;

    @ManyToOne(optional = false)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Decision decision = Decision.COMMENT;

    @Column(columnDefinition = "TEXT")
    private String note;

    public enum Decision {
        APPROVE,
        REQUEST_CHANGES,
        REJECT,
        COMMENT
    }
}
