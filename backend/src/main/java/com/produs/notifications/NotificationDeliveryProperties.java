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
    private int batchSize = 50;
    private int maxAttempts = 3;
    private long retryDelaySeconds = 300;
}
