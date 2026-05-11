package com.produs.notifications;

import com.produs.entity.User;
import com.produs.shared.BaseEntity;
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

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "platform_notifications",
        indexes = {
                @Index(name = "idx_platform_notifications_recipient", columnList = "recipient_id, status, created_at"),
                @Index(name = "idx_platform_notifications_source", columnList = "source_type, source_id")
        }
)
public class PlatformNotification extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @ManyToOne
    @JoinColumn(name = "actor_id")
    private User actor;

    @ManyToOne
    @JoinColumn(name = "workspace_id")
    private ProjectWorkspace workspace;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationPriority priority = NotificationPriority.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationStatus status = NotificationStatus.UNREAD;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(name = "action_url")
    private String actionUrl;

    @Column(name = "source_type", nullable = false)
    private String sourceType;

    @Column(name = "source_id", nullable = false)
    private UUID sourceId;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    public enum NotificationType {
        PROPOSAL_SUBMITTED,
        PROPOSAL_STATUS_CHANGED,
        CONTRACT_CREATED,
        CONTRACT_STATUS_CHANGED,
        CONTRACT_SIGNED,
        INVOICE_ISSUED,
        INVOICE_STATUS_CHANGED,
        INVOICE_PAID,
        SUPPORT_SUBSCRIPTION_CREATED,
        SUPPORT_SUBSCRIPTION_STATUS_CHANGED,
        SUPPORT_REQUEST_OPENED,
        SUPPORT_REQUEST_UPDATED,
        SUPPORT_REQUEST_SLA_DUE_SOON,
        SUPPORT_REQUEST_SLA_ESCALATED,
        DISPUTE_OPENED,
        DISPUTE_UPDATED,
        EVIDENCE_ATTACHED,
        SYSTEM
    }

    public enum NotificationPriority {
        LOW,
        NORMAL,
        HIGH,
        CRITICAL
    }

    public enum NotificationStatus {
        UNREAD,
        READ,
        ARCHIVED
    }
}
