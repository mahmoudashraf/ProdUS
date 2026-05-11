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
@Table(name = "support_subscriptions")
public class SupportSubscription extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private ProjectWorkspace workspace;

    @ManyToOne(optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "plan_name", nullable = false)
    private String planName;

    @Column(columnDefinition = "TEXT")
    private String sla;

    @Column(name = "monthly_amount_cents", nullable = false)
    private Long monthlyAmountCents = 0L;

    @Column(nullable = false, length = 3)
    private String currency = "USD";

    @Column(name = "starts_on")
    private LocalDate startsOn;

    @Column(name = "renews_on")
    private LocalDate renewsOn;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionStatus status = SubscriptionStatus.PROPOSED;

    public enum SubscriptionStatus {
        PROPOSED,
        ACTIVE,
        PAUSED,
        CANCELLED
    }
}
