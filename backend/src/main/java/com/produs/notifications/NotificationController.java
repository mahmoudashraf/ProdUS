package com.produs.notifications;

import com.produs.dto.PlatformDtos.NotificationDeliveryResponse;
import com.produs.dto.PlatformDtos.NotificationDeliveryRunResponse;
import com.produs.dto.PlatformDtos.NotificationSummaryResponse;
import com.produs.dto.PlatformDtos.PlatformNotificationResponse;
import com.produs.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

import static com.produs.dto.PlatformDtos.toNotificationDeliveryResponse;
import static com.produs.dto.PlatformDtos.toPlatformNotificationResponse;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationDeliveryService deliveryService;

    @GetMapping
    public List<PlatformNotificationResponse> notifications(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) PlatformNotification.NotificationStatus status
    ) {
        return notificationService.list(user, status).stream()
                .map(notification -> toPlatformNotificationResponse(notification))
                .toList();
    }

    @GetMapping("/summary")
    public NotificationSummaryResponse summary(@AuthenticationPrincipal User user) {
        return new NotificationSummaryResponse(
                notificationService.unreadCount(user),
                notificationService.latest(user).stream()
                        .map(notification -> toPlatformNotificationResponse(notification))
                        .toList()
        );
    }

    @PutMapping("/{notificationId}/read")
    public PlatformNotificationResponse markRead(
            @AuthenticationPrincipal User user,
            @PathVariable UUID notificationId
    ) {
        return toPlatformNotificationResponse(notificationService.markRead(user, notificationId));
    }

    @PutMapping("/read-all")
    public NotificationSummaryResponse markAllRead(@AuthenticationPrincipal User user) {
        notificationService.markAllRead(user);
        return summary(user);
    }

    @GetMapping("/deliveries")
    public List<NotificationDeliveryResponse> deliveries(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) NotificationDelivery.DeliveryStatus status
    ) {
        requireAdmin(user);
        return deliveryService.recent(status).stream()
                .map(delivery -> toNotificationDeliveryResponse(delivery))
                .toList();
    }

    @PostMapping("/deliveries/dispatch")
    public NotificationDeliveryRunResponse dispatchDeliveries(@AuthenticationPrincipal User user) {
        requireAdmin(user);
        NotificationDeliveryService.DeliveryDispatchResult result = deliveryService.dispatchPending();
        return new NotificationDeliveryRunResponse(
                result.scannedCount(),
                result.sentCount(),
                result.failedCount(),
                result.skippedCount()
        );
    }

    private void requireAdmin(User user) {
        if (user.getRole() != User.UserRole.ADMIN) {
            throw new AccessDeniedException("Only admins can manage notification deliveries");
        }
    }
}
