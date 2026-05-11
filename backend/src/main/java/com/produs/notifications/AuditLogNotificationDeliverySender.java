package com.produs.notifications;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
public class AuditLogNotificationDeliverySender implements NotificationDeliverySender {

    @Override
    public NotificationDeliveryProperties.DeliveryProvider provider() {
        return NotificationDeliveryProperties.DeliveryProvider.AUDIT_LOG;
    }

    @Override
    public NotificationDeliverySendResult send(NotificationDelivery delivery) {
        String notificationId = delivery.getNotification() == null ? null : delivery.getNotification().getId().toString();
        log.info(
                "Notification delivery recorded channel={} destination={} notificationId={}",
                delivery.getChannel(),
                delivery.getDestination(),
                notificationId
        );
        return new NotificationDeliverySendResult(provider().providerName(), UUID.randomUUID().toString());
    }
}
