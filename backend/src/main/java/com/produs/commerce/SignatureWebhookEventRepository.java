package com.produs.commerce;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SignatureWebhookEventRepository extends JpaRepository<SignatureWebhookEvent, UUID> {
    Optional<SignatureWebhookEvent> findByProviderAndEventId(String provider, String eventId);
}
