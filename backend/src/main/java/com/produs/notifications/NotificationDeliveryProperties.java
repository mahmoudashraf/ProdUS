package com.produs.notifications;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.notifications.delivery")
public class NotificationDeliveryProperties {
    private boolean enabled = true;
    private boolean schedulerEnabled = true;
    private boolean emailEnabled = false;
    private boolean pushEnabled = false;
    private DeliveryProvider emailProvider = DeliveryProvider.AUDIT_LOG;
    private DeliveryProvider pushProvider = DeliveryProvider.AUDIT_LOG;
    private String emailWebhookUrl;
    private String pushWebhookUrl;
    private String webhookSecret;
    private long webhookTimeoutMs = 2500;
    private int batchSize = 50;
    private int maxAttempts = 3;
    private long retryDelaySeconds = 300;

    public DeliveryProvider providerFor(NotificationDelivery.DeliveryChannel channel) {
        return switch (channel) {
            case EMAIL -> emailProvider == null ? DeliveryProvider.AUDIT_LOG : emailProvider;
            case PUSH -> pushProvider == null ? DeliveryProvider.AUDIT_LOG : pushProvider;
        };
    }

    public String webhookUrlFor(NotificationDelivery.DeliveryChannel channel) {
        return switch (channel) {
            case EMAIL -> emailWebhookUrl;
            case PUSH -> pushWebhookUrl;
        };
    }

    public enum DeliveryProvider {
        AUDIT_LOG("audit-log"),
        WEBHOOK("webhook");

        private final String providerName;

        DeliveryProvider(String providerName) {
            this.providerName = providerName;
        }

        public String providerName() {
            return providerName;
        }
    }
}
