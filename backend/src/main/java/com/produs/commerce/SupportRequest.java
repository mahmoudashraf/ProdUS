package com.produs.commerce;

import com.produs.entity.User;
import com.produs.shared.BaseEntity;
import com.produs.teams.Team;
import com.produs.workspace.ProjectWorkspace;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "support_requests",
        indexes = {
                @Index(name = "idx_support_requests_workspace", columnList = "workspace_id, status, due_on"),
                @Index(name = "idx_support_requests_team", columnList = "team_id, status, due_on"),
                @Index(name = "idx_support_requests_owner", columnList = "owner_id, status, due_on")
        }
)
public class SupportRequest extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private ProjectWorkspace workspace;

    @ManyToOne
    @JoinColumn(name = "support_subscription_id")
    private SupportSubscription supportSubscription;

    @ManyToOne(optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(optional = false)
    @JoinColumn(name = "opened_by", nullable = false)
    private User openedBy;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SupportPriority priority = SupportPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SupportStatus status = SupportStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(name = "sla_status", nullable = false)
    private SlaStatus slaStatus = SlaStatus.ON_TRACK;

    @Column(name = "due_on")
    private LocalDate dueOn;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "escalated_at")
    private LocalDateTime escalatedAt;

    @Column(name = "last_sla_check_at")
    private LocalDateTime lastSlaCheckAt;

    @Column(name = "escalation_count", nullable = false)
    private int escalationCount = 0;

    @Column(columnDefinition = "TEXT")
    private String resolution;

    public enum SupportPriority {
        LOW,
        MEDIUM,
        HIGH,
        URGENT
    }

    public enum SupportStatus {
        OPEN,
        ACKNOWLEDGED,
        IN_PROGRESS,
        WAITING_ON_OWNER,
        RESOLVED,
        CANCELLED
    }

    public enum SlaStatus {
        ON_TRACK,
        DUE_SOON,
        OVERDUE,
        ESCALATED,
        RESOLVED
    }
}
