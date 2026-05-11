package com.produs.workspace;

import com.produs.entity.User;
import com.produs.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "workspace_participants",
        uniqueConstraints = @UniqueConstraint(name = "uk_workspace_participants_workspace_user", columnNames = {"workspace_id", "user_id"})
)
public class WorkspaceParticipant extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private ProjectWorkspace workspace;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "added_by")
    private User addedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ParticipantRole role = ParticipantRole.VIEWER;

    @Column(nullable = false)
    private boolean active = true;

    public enum ParticipantRole {
        OWNER,
        COORDINATOR,
        TEAM_LEAD,
        SPECIALIST,
        ADVISOR,
        VIEWER
    }
}
