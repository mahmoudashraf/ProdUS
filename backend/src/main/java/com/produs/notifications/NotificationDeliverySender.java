package com.produs.notifications;

public interface NotificationDeliverySender {

    NotificationDeliveryProperties.DeliveryProvider provider();

    NotificationDeliverySendResult send(NotificationDelivery delivery);
}
