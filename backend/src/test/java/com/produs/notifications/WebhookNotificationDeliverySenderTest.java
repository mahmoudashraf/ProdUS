package com.produs.notifications;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.entity.User;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class WebhookNotificationDeliverySenderTest {

    @Test
    void signsAndPostsNotificationDeliveryPayload() throws Exception {
        AtomicReference<String> body = new AtomicReference<>();
        AtomicReference<String> timestamp = new AtomicReference<>();
        AtomicReference<String> signature = new AtomicReference<>();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/notifications", exchange -> {
            body.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            timestamp.set(exchange.getRequestHeaders().getFirst("X-ProdUS-Delivery-Timestamp"));
            signature.set(exchange.getRequestHeaders().getFirst("X-ProdUS-Delivery-Signature"));
            byte[] response = "{\"messageId\":\"msg-123\"}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(202, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();

        try {
            NotificationDeliveryProperties properties = new NotificationDeliveryProperties();
            properties.setEmailProvider(NotificationDeliveryProperties.DeliveryProvider.WEBHOOK);
            properties.setEmailWebhookUrl("http://127.0.0.1:" + server.getAddress().getPort() + "/notifications");
            properties.setWebhookSecret("test-delivery-secret");

            WebhookNotificationDeliverySender sender = new WebhookNotificationDeliverySender(properties, new ObjectMapper());
            NotificationDelivery delivery = emailDelivery();

            NotificationDeliverySendResult result = sender.send(delivery);

            assertThat(result.provider()).isEqualTo("webhook");
            assertThat(result.providerMessageId()).isEqualTo("msg-123");
            assertThat(body.get()).contains("\"channel\":\"EMAIL\"");
            assertThat(body.get()).contains("\"destination\":\"owner@produs.test\"");
            assertThat(body.get()).contains("\"attemptCount\":1");
            assertThat(body.get()).contains("\"title\":\"Support request escalated\"");
            assertThat(signature.get()).isEqualTo(sign(timestamp.get() + "." + body.get(), "test-delivery-secret"));
        } finally {
            server.stop(0);
        }
    }

    private NotificationDelivery emailDelivery() {
        User recipient = new User();
        recipient.setId(UUID.randomUUID());
        recipient.setEmail("owner@produs.test");
        recipient.setFirstName("Product");
        recipient.setLastName("Owner");
        recipient.setRole(User.UserRole.PRODUCT_OWNER);

        PlatformNotification notification = new PlatformNotification();
        notification.setId(UUID.randomUUID());
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRecipient(recipient);
        notification.setType(PlatformNotification.NotificationType.SUPPORT_REQUEST_SLA_ESCALATED);
        notification.setPriority(PlatformNotification.NotificationPriority.HIGH);
        notification.setTitle("Support request escalated");
        notification.setBody("A support request missed its SLA.");
        notification.setActionUrl("/workspaces/mock");
        notification.setSourceType("SUPPORT_REQUEST");
        notification.setSourceId(UUID.randomUUID());

        NotificationDelivery delivery = new NotificationDelivery();
        delivery.setId(UUID.randomUUID());
        delivery.setNotification(notification);
        delivery.setRecipient(recipient);
        delivery.setChannel(NotificationDelivery.DeliveryChannel.EMAIL);
        delivery.setDestination(recipient.getEmail());
        delivery.setAttemptCount(1);
        return delivery;
    }

    private String sign(String payload, String secret) throws Exception {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return "sha256=" + HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IOException("Unable to sign payload", exception);
        }
    }
}
