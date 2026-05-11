package com.produs.notifications;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationDeliveryService {

    private final NotificationDeliveryRepository deliveryRepository;
    private final NotificationDeliveryProperties properties;
    private final List<NotificationDeliverySender> senders;

    @Transactional
    public List<NotificationDelivery> enqueue(PlatformNotification notification) {
        if (!properties.isEnabled() || notification == null || notification.getRecipient() == null) {
            return List.of();
        }

        List<NotificationDelivery> deliveries = new ArrayList<>();
        if (properties.isEmailEnabled() && hasText(notification.getRecipient().getEmail())) {
            deliveries.add(buildDelivery(notification, NotificationDelivery.DeliveryChannel.EMAIL, notification.getRecipient().getEmail()));
        }
        if (properties.isPushEnabled()) {
            deliveries.add(buildDelivery(notification, NotificationDelivery.DeliveryChannel.PUSH, notification.getRecipient().getId().toString()));
        }
        if (deliveries.isEmpty()) {
            return List.of();
        }
        return deliveryRepository.saveAll(deliveries);
    }

    @Transactional(readOnly = true)
    public List<NotificationDelivery> recent(NotificationDelivery.DeliveryStatus status) {
        if (status == null) {
            return deliveryRepository.findTop100ByOrderByCreatedAtDesc();
        }
        return deliveryRepository.findTop100ByStatusOrderByCreatedAtDesc(status);
    }

    @Transactional
    public DeliveryDispatchResult dispatchPending() {
        if (!properties.isEnabled()) {
            return new DeliveryDispatchResult(0, 0, 0, 0);
        }

        LocalDateTime now = LocalDateTime.now();
        List<NotificationDelivery> pending = deliveryRepository.findReadyForDispatch(
                NotificationDelivery.DeliveryStatus.PENDING,
                now,
                PageRequest.of(0, Math.max(1, properties.getBatchSize()))
        );

        int sent = 0;
        int failed = 0;
        int skipped = 0;

        for (NotificationDelivery delivery : pending) {
            DispatchOutcome outcome = dispatchOne(delivery, now);
            sent += outcome == DispatchOutcome.SENT ? 1 : 0;
            failed += outcome == DispatchOutcome.FAILED ? 1 : 0;
            skipped += outcome == DispatchOutcome.SKIPPED ? 1 : 0;
            deliveryRepository.save(delivery);
        }

        return new DeliveryDispatchResult(pending.size(), sent, failed, skipped);
    }

    private NotificationDelivery buildDelivery(
            PlatformNotification notification,
            NotificationDelivery.DeliveryChannel channel,
            String destination
    ) {
        NotificationDelivery delivery = new NotificationDelivery();
        delivery.setNotification(notification);
        delivery.setRecipient(notification.getRecipient());
        delivery.setChannel(channel);
        delivery.setDestination(destination);
        delivery.setNextAttemptAt(LocalDateTime.now());
        return delivery;
    }

    private DispatchOutcome dispatchOne(NotificationDelivery delivery, LocalDateTime now) {
        if (!isChannelEnabled(delivery.getChannel())) {
            delivery.setStatus(NotificationDelivery.DeliveryStatus.SKIPPED);
            delivery.setLastError("Delivery channel is disabled");
            return DispatchOutcome.SKIPPED;
        }
        if (!hasText(delivery.getDestination())) {
            delivery.setStatus(NotificationDelivery.DeliveryStatus.SKIPPED);
            delivery.setLastError("Delivery destination is missing");
            return DispatchOutcome.SKIPPED;
        }

        NotificationDeliveryProperties.DeliveryProvider provider = properties.providerFor(delivery.getChannel());
        NotificationDeliverySender sender = senderFor(provider);
        delivery.setAttemptCount(delivery.getAttemptCount() + 1);
        delivery.setProvider(provider.providerName());
        try {
            NotificationDeliverySendResult result = sender.send(delivery);
            delivery.setProvider(result.provider());
            delivery.setProviderMessageId(result.providerMessageId());
            delivery.setDeliveredAt(now);
            delivery.setStatus(NotificationDelivery.DeliveryStatus.SENT);
            delivery.setLastError(null);
            return DispatchOutcome.SENT;
        } catch (NotificationDeliveryException ex) {
            delivery.setLastError(truncate(ex.getMessage()));
            if (!ex.isRetryable() || delivery.getAttemptCount() >= Math.max(1, properties.getMaxAttempts())) {
                delivery.setStatus(NotificationDelivery.DeliveryStatus.FAILED);
                return DispatchOutcome.FAILED;
            }
            delivery.setNextAttemptAt(now.plusSeconds(Math.max(1, properties.getRetryDelaySeconds())));
            return DispatchOutcome.SKIPPED;
        } catch (RuntimeException ex) {
            delivery.setLastError(truncate(ex.getMessage()));
            if (delivery.getAttemptCount() >= Math.max(1, properties.getMaxAttempts())) {
                delivery.setStatus(NotificationDelivery.DeliveryStatus.FAILED);
                return DispatchOutcome.FAILED;
            }
            delivery.setNextAttemptAt(now.plusSeconds(Math.max(1, properties.getRetryDelaySeconds())));
            return DispatchOutcome.SKIPPED;
        }
    }

    @Transactional(readOnly = true)
    public DeliveryConfiguration configuration() {
        return new DeliveryConfiguration(
                properties.isEnabled(),
                properties.isSchedulerEnabled(),
                properties.isEmailEnabled(),
                properties.isPushEnabled(),
                properties.providerFor(NotificationDelivery.DeliveryChannel.EMAIL).providerName(),
                properties.providerFor(NotificationDelivery.DeliveryChannel.PUSH).providerName(),
                providerConfigured(NotificationDelivery.DeliveryChannel.EMAIL),
                providerConfigured(NotificationDelivery.DeliveryChannel.PUSH),
                properties.getBatchSize(),
                properties.getMaxAttempts(),
                properties.getRetryDelaySeconds(),
                properties.getWebhookTimeoutMs()
        );
    }

    private boolean isChannelEnabled(NotificationDelivery.DeliveryChannel channel) {
        return switch (channel) {
            case EMAIL -> properties.isEmailEnabled();
            case PUSH -> properties.isPushEnabled();
        };
    }

    private NotificationDeliverySender senderFor(NotificationDeliveryProperties.DeliveryProvider provider) {
        Map<NotificationDeliveryProperties.DeliveryProvider, NotificationDeliverySender> byProvider = senders.stream()
                .collect(Collectors.toMap(NotificationDeliverySender::provider, Function.identity(), (first, second) -> first));
        NotificationDeliverySender sender = byProvider.get(provider);
        if (sender == null) {
            throw new NotificationDeliveryException("No sender is configured for provider " + provider, false);
        }
        return sender;
    }

    private boolean providerConfigured(NotificationDelivery.DeliveryChannel channel) {
        NotificationDeliveryProperties.DeliveryProvider provider = properties.providerFor(channel);
        if (provider == NotificationDeliveryProperties.DeliveryProvider.AUDIT_LOG) {
            return true;
        }
        if (provider == NotificationDeliveryProperties.DeliveryProvider.WEBHOOK) {
            return hasText(properties.webhookUrlFor(channel)) && hasText(properties.getWebhookSecret());
        }
        return false;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String truncate(String value) {
        if (value == null || value.length() <= 2000) {
            return value;
        }
        return value.substring(0, 2000);
    }

    private enum DispatchOutcome {
        SENT,
        FAILED,
        SKIPPED
    }

    public record DeliveryDispatchResult(
            int scannedCount,
            int sentCount,
            int failedCount,
            int skippedCount
    ) {}

    public record DeliveryConfiguration(
            boolean enabled,
            boolean schedulerEnabled,
            boolean emailEnabled,
            boolean pushEnabled,
            String emailProvider,
            String pushProvider,
            boolean emailProviderConfigured,
            boolean pushProviderConfigured,
            int batchSize,
            int maxAttempts,
            long retryDelaySeconds,
            long webhookTimeoutMs
    ) {}
}
