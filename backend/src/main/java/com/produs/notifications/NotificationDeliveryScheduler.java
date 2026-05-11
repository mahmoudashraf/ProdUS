package com.produs.notifications;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.notifications.delivery", name = "scheduler-enabled", havingValue = "true", matchIfMissing = true)
public class NotificationDeliveryScheduler {

    private final NotificationDeliveryService deliveryService;
    private final NotificationDeliveryProperties properties;

    @Scheduled(fixedDelayString = "${app.notifications.delivery.dispatch-fixed-delay-ms:60000}")
    void dispatchPendingNotifications() {
        if (properties.isEnabled()) {
            deliveryService.dispatchPending();
        }
    }
}
