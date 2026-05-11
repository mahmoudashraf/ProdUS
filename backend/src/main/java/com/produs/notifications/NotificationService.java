package com.produs.notifications;

import com.produs.entity.User;
import com.produs.workspace.ProjectWorkspace;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final PlatformNotificationRepository notificationRepository;
    private final NotificationDeliveryService deliveryService;

    @Transactional(readOnly = true)
    public List<PlatformNotification> list(User user, PlatformNotification.NotificationStatus status) {
        List<PlatformNotification> notifications = status == null
                ? notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId())
                : notificationRepository.findByRecipientIdAndStatusOrderByCreatedAtDesc(user.getId(), status);
        return notifications.stream().limit(50).toList();
    }

    @Transactional(readOnly = true)
    public List<PlatformNotification> latest(User user) {
        return notificationRepository.findTop20ByRecipientIdOrderByCreatedAtDesc(user.getId());
    }

    @Transactional(readOnly = true)
    public long unreadCount(User user) {
        return notificationRepository.countByRecipientIdAndStatus(user.getId(), PlatformNotification.NotificationStatus.UNREAD);
    }

    @Transactional
    public PlatformNotification notify(
            User recipient,
            User actor,
            PlatformNotification.NotificationType type,
            PlatformNotification.NotificationPriority priority,
            String title,
            String body,
            String actionUrl,
            String sourceType,
            UUID sourceId,
            ProjectWorkspace workspace
    ) {
        if (recipient == null || sourceId == null) {
            return null;
        }
        if (actor != null && recipient.getId().equals(actor.getId())) {
            return null;
        }

        PlatformNotification notification = new PlatformNotification();
        notification.setRecipient(recipient);
        notification.setActor(actor);
        notification.setType(type);
        notification.setPriority(priority == null ? PlatformNotification.NotificationPriority.NORMAL : priority);
        notification.setTitle(title);
        notification.setBody(body);
        notification.setActionUrl(actionUrl);
        notification.setSourceType(sourceType);
        notification.setSourceId(sourceId);
        notification.setWorkspace(workspace);
        PlatformNotification saved = notificationRepository.save(notification);
        deliveryService.enqueue(saved);
        return saved;
    }

    @Transactional
    public void notifyAll(
            Collection<User> recipients,
            User actor,
            PlatformNotification.NotificationType type,
            PlatformNotification.NotificationPriority priority,
            String title,
            String body,
            String actionUrl,
            String sourceType,
            UUID sourceId,
            ProjectWorkspace workspace
    ) {
        Map<UUID, User> uniqueRecipients = new LinkedHashMap<>();
        for (User recipient : recipients) {
            if (recipient != null) {
                uniqueRecipients.putIfAbsent(recipient.getId(), recipient);
            }
        }
        uniqueRecipients.values().forEach(recipient -> notify(
                recipient,
                actor,
                type,
                priority,
                title,
                body,
                actionUrl,
                sourceType,
                sourceId,
                workspace
        ));
    }

    @Transactional
    public PlatformNotification markRead(User user, UUID notificationId) {
        PlatformNotification notification = notificationRepository.findByIdAndRecipientId(notificationId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        notification.setStatus(PlatformNotification.NotificationStatus.READ);
        notification.setReadAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }

    @Transactional
    public int markAllRead(User user) {
        List<PlatformNotification> notifications = notificationRepository.findByRecipientIdAndStatusOrderByCreatedAtDesc(
                user.getId(),
                PlatformNotification.NotificationStatus.UNREAD
        );
        LocalDateTime readAt = LocalDateTime.now();
        notifications.forEach(notification -> {
            notification.setStatus(PlatformNotification.NotificationStatus.READ);
            notification.setReadAt(readAt);
        });
        notificationRepository.saveAll(notifications);
        return notifications.size();
    }
}
