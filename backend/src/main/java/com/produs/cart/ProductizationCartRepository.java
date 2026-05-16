package com.produs.cart;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProductizationCartRepository extends JpaRepository<ProductizationCart, UUID> {
    Optional<ProductizationCart> findFirstByOwnerIdAndStatusOrderByCreatedAtDesc(UUID ownerId, ProductizationCart.CartStatus status);
}
