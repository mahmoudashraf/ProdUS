package com.produs.commerce;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.integrations.webhooks")
public class WebhookProperties {
    private ProviderWebhookProperties payments = new ProviderWebhookProperties();
    private ProviderWebhookProperties signatures = new ProviderWebhookProperties();

    @Getter
    @Setter
    public static class ProviderWebhookProperties {
        private String secret = "";
    }
}
