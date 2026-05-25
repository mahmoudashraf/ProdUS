package com.produs.product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProductCreationIntentRepository extends JpaRepository<ProductCreationIntent, UUID> {
    Optional<ProductCreationIntent> findByIdempotencyKey(String idempotencyKey);
}
