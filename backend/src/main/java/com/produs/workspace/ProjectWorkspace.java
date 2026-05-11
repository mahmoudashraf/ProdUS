package com.produs.workspace;

import com.produs.entity.User;
import com.produs.packages.PackageInstance;
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
@Table(name = "project_workspaces")
public class ProjectWorkspace extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "package_instance_id", nullable = false)
    private PackageInstance packageInstance;

    @ManyToOne(optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkspaceStatus status = WorkspaceStatus.DRAFT_PACKAGE;

    public enum WorkspaceStatus {
        DRAFT_PACKAGE,
        AWAITING_TEAM_PROPOSAL,
        SCOPE_NEGOTIATION,
        ACTIVE_DELIVERY,
        BLOCKED,
        MILESTONE_REVIEW,
        DELIVERED,
        SUPPORT_HANDOFF,
        CLOSED
    }
}
