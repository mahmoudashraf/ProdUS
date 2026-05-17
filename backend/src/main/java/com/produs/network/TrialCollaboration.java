package com.produs.network;

import com.produs.entity.User;
import com.produs.shared.BaseEntity;
import com.produs.teams.Team;
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
@Table(name = "network_trial_collaborations")
public class TrialCollaboration extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "initiated_by", nullable = false)
    private User initiatedBy;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String scope;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TrialStatus status = TrialStatus.PROPOSED;

    @Column(name = "proposed_start_date")
    private LocalDate proposedStartDate;

    @Column(name = "proposed_end_date")
    private LocalDate proposedEndDate;

    public enum TrialStatus {
        PROPOSED,
        NEGOTIATING,
        ACCEPTED,
        ACTIVE,
        MILESTONE_REVIEW,
        COMPLETED,
        FORM_TEAM_PROPOSED,
        TEAM_FORMED,
        CANCELLED
    }
}
