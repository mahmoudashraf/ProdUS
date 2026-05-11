package com.produs.notifications;

import com.produs.dto.PlatformDtos.NotificationSummaryResponse;
import com.produs.dto.PlatformDtos.PlatformNotificationResponse;
import com.produs.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

import static com.produs.dto.PlatformDtos.toPlatformNotificationResponse;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

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
}
