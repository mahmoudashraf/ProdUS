package com.produs.notifications;

public record NotificationDeliverySendResult(
        String provider,
        String providerMessageId
) {}
