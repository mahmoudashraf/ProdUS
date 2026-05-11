package com.produs.notifications;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.entity.User;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class WebhookNotificationDeliverySender implements NotificationDeliverySender {

    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final String SIGNATURE_PREFIX = "sha256=";

    private final NotificationDeliveryProperties properties;
    private final ObjectMapper objectMapper;

    @Override
    public NotificationDeliveryProperties.DeliveryProvider provider() {
        return NotificationDeliveryProperties.DeliveryProvider.WEBHOOK;
    }

    @Override
    public NotificationDeliverySendResult send(NotificationDelivery delivery) {
        String webhookUrl = properties.webhookUrlFor(delivery.getChannel());
        if (!hasText(webhookUrl)) {
            throw new NotificationDeliveryException("Webhook URL is not configured for " + delivery.getChannel(), false);
        }
        if (!hasText(properties.getWebhookSecret())) {
            throw new NotificationDeliveryException("Webhook secret is required for signed notification delivery", false);
        }

        try {
            String body = objectMapper.writeValueAsString(payload(delivery));
            String timestamp = Instant.now().toString();
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(webhookUrl.trim()))
                    .timeout(Duration.ofMillis(Math.max(1, properties.getWebhookTimeoutMs())))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .header("User-Agent", "ProdUS-NotificationDelivery/1.0")
                    .header("X-ProdUS-Delivery-ID", stringId(delivery))
                    .header("X-ProdUS-Notification-ID", stringId(delivery.getNotification()))
                    .header("X-ProdUS-Delivery-Channel", delivery.getChannel().name())
                    .header("X-ProdUS-Delivery-Timestamp", timestamp)
                    .header("X-ProdUS-Delivery-Signature", sign(timestamp + "." + body, properties.getWebhookSecret()))
                    .POST(HttpRequest.BodyPublishers.ofString(body));
            String requestId = MDC.get("requestId");
            if (hasText(requestId)) {
                requestBuilder.header("X-Request-ID", requestId);
            }

            HttpResponse<String> response = httpClient().send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() > 299) {
                throw new NotificationDeliveryException(
                        "Webhook delivery failed with HTTP " + response.statusCode(),
                        isRetryable(response.statusCode())
                );
            }
            return new NotificationDeliverySendResult(provider().providerName(), resolveProviderMessageId(response, delivery));
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new NotificationDeliveryException("Webhook delivery was interrupted", true, exception);
        } catch (IOException exception) {
            throw new NotificationDeliveryException("Webhook delivery failed: " + exception.getClass().getSimpleName(), true, exception);
        } catch (IllegalArgumentException exception) {
            throw new NotificationDeliveryException("Webhook delivery configuration is invalid", false, exception);
        } catch (NotificationDeliveryException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new NotificationDeliveryException("Webhook delivery failed: " + exception.getClass().getSimpleName(), true, exception);
        }
    }

    private HttpClient httpClient() {
        return HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(Math.max(1, properties.getWebhookTimeoutMs())))
                .build();
    }

    private Map<String, Object> payload(NotificationDelivery delivery) {
        PlatformNotification notification = delivery.getNotification();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("deliveryId", stringId(delivery));
        payload.put("notificationId", stringId(notification));
        payload.put("channel", delivery.getChannel().name());
        payload.put("destination", delivery.getDestination());
        payload.put("attemptCount", delivery.getAttemptCount());
        payload.put("recipient", recipientPayload(delivery.getRecipient()));
        if (notification != null) {
            payload.put("type", notification.getType().name());
            payload.put("priority", notification.getPriority().name());
            payload.put("title", notification.getTitle());
            payload.put("body", notification.getBody());
            payload.put("actionUrl", notification.getActionUrl());
            payload.put("sourceType", notification.getSourceType());
            payload.put("sourceId", stringId(notification.getSourceId()));
            payload.put("workspaceId", notification.getWorkspace() == null ? null : notification.getWorkspace().getId().toString());
            payload.put("createdAt", notification.getCreatedAt() == null ? null : notification.getCreatedAt().toString());
        }
        return payload;
    }

    private Map<String, Object> recipientPayload(User recipient) {
        if (recipient == null) {
            return Map.of();
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", recipient.getId() == null ? null : recipient.getId().toString());
        payload.put("email", recipient.getEmail());
        payload.put("firstName", recipient.getFirstName());
        payload.put("lastName", recipient.getLastName());
        payload.put("role", recipient.getRole() == null ? null : recipient.getRole().name());
        return payload;
    }

    private String resolveProviderMessageId(HttpResponse<String> response, NotificationDelivery delivery) {
        String headerMessageId = response.headers().firstValue("X-Provider-Message-ID").orElse(null);
        if (hasText(headerMessageId)) {
            return headerMessageId.trim();
        }
        if (hasText(response.body())) {
            try {
                JsonNode root = objectMapper.readTree(response.body());
                String messageId = root.path("messageId").asText(null);
                if (hasText(messageId)) {
                    return messageId.trim();
                }
            } catch (Exception ignored) {
                return "webhook-" + stringId(delivery);
            }
        }
        return "webhook-" + stringId(delivery);
    }

    private String sign(String payload, String secret) throws Exception {
        Mac mac = Mac.getInstance(HMAC_SHA256);
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
        return SIGNATURE_PREFIX + HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
    }

    private boolean isRetryable(int statusCode) {
        return statusCode == 408 || statusCode == 425 || statusCode == 429 || statusCode >= 500;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String stringId(Object entity) {
        if (entity instanceof NotificationDelivery delivery && delivery.getId() != null) {
            return delivery.getId().toString();
        }
        if (entity instanceof PlatformNotification notification && notification.getId() != null) {
            return notification.getId().toString();
        }
        if (entity instanceof java.util.UUID uuid) {
            return uuid.toString();
        }
        return "unknown";
    }
}
