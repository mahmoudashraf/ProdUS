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

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "dispute_cases")
public class DisputeCase extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private ProjectWorkspace workspace;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;

    @ManyToOne(optional = false)
    @JoinColumn(name = "opened_by", nullable = false)
    private User openedBy;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DisputeSeverity severity = DisputeSeverity.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DisputeStatus status = DisputeStatus.OPEN;

    @Column(name = "response_due_on")
    private LocalDate responseDueOn;

    @Column(columnDefinition = "TEXT")
    private String resolution;

    public enum DisputeSeverity {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    public enum DisputeStatus {
        OPEN,
        UNDER_REVIEW,
        OWNER_RESPONSE_NEEDED,
        TEAM_RESPONSE_NEEDED,
        RESOLVED,
        CANCELLED
    }
}
