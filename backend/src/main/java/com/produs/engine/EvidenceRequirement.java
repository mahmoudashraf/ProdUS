package com.produs.engine;

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
@Table(name = "evidence_requirements")
public class EvidenceRequirement extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "milestone_id", nullable = false)
    private Milestone milestone;

    @ManyToOne(optional = false)
    @JoinColumn(name = "criterion_id", nullable = false)
    private AcceptanceCriterion criterion;

    @Column(name = "evidence_type", nullable = false)
    private String evidenceType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private boolean required = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EvidenceStatus status = EvidenceStatus.MISSING;

    @Column(name = "evidence_reference", columnDefinition = "TEXT")
    private String evidenceReference;

    public enum EvidenceStatus {
        MISSING,
        ATTACHED,
        VERIFIED,
        WAIVED
    }
}
