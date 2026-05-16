package com.produs.cart;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductizationCartServiceItemRepository extends JpaRepository<ProductizationCartServiceItem, UUID> {
    List<ProductizationCartServiceItem> findByCartIdOrderBySequenceOrderAscCreatedAtAsc(UUID cartId);
    Optional<ProductizationCartServiceItem> findByCartIdAndServiceModuleId(UUID cartId, UUID serviceModuleId);
    long countByCartId(UUID cartId);
}
