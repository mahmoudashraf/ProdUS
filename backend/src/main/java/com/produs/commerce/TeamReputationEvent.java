package com.produs.commerce;

import com.produs.entity.User;
import com.produs.shared.BaseEntity;
import com.produs.teams.Team;
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

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "team_reputation_events")
public class TeamReputationEvent extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne
    @JoinColumn(name = "workspace_id")
    private ProjectWorkspace workspace;

    @ManyToOne(optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private ReputationEventType eventType = ReputationEventType.WORKSPACE_REVIEW;

    @Column(nullable = false)
    private Integer rating = 5;

    @Column(nullable = false)
    private boolean verified = true;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public enum ReputationEventType {
        MILESTONE_ACCEPTED,
        DELIVERABLE_REVIEW,
        CONTRACT_COMPLETED,
        SUPPORT_REVIEW,
        WORKSPACE_REVIEW,
        DISPUTE
    }
}
