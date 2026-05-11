package com.produs.notifications;

import com.produs.entity.User;
import com.produs.shared.BaseEntity;
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

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "notification_deliveries",
        indexes = {
                @Index(name = "idx_notification_deliveries_status", columnList = "status, next_attempt_at, created_at"),
                @Index(name = "idx_notification_deliveries_notification", columnList = "notification_id"),
                @Index(name = "idx_notification_deliveries_recipient", columnList = "recipient_id, created_at")
        }
)
public class NotificationDelivery extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "notification_id", nullable = false)
    private PlatformNotification notification;

    @ManyToOne(optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryChannel channel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryStatus status = DeliveryStatus.PENDING;

    @Column(nullable = false)
    private String destination;

    private String provider;

    @Column(name = "provider_message_id")
    private String providerMessageId;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount = 0;

    @Column(name = "next_attempt_at")
    private LocalDateTime nextAttemptAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    public enum DeliveryChannel {
        EMAIL,
        PUSH
    }

    public enum DeliveryStatus {
        PENDING,
        SENT,
        FAILED,
        SKIPPED
    }
}
