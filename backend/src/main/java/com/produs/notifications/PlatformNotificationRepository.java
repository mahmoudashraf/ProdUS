package com.produs.notifications;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlatformNotificationRepository extends JpaRepository<PlatformNotification, UUID> {
    List<PlatformNotification> findTop20ByRecipientIdOrderByCreatedAtDesc(UUID recipientId);
    List<PlatformNotification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId);
    List<PlatformNotification> findByRecipientIdAndStatusOrderByCreatedAtDesc(UUID recipientId, PlatformNotification.NotificationStatus status);
    Optional<PlatformNotification> findByIdAndRecipientId(UUID id, UUID recipientId);
    long countByRecipientIdAndStatus(UUID recipientId, PlatformNotification.NotificationStatus status);
}
