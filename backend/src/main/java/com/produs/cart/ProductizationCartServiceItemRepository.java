package com.produs.cart;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductizationCartServiceItemRepository extends JpaRepository<ProductizationCartServiceItem, UUID> {
    List<ProductizationCartServiceItem> findByCartIdOrderBySequenceOrderAscCreatedAtAsc(UUID cartId);
    Optional<ProductizationCartServiceItem> findByCartIdAndServiceModuleId(UUID cartId, UUID serviceModuleId);
    long countByCartId(UUID cartId);

    @Modifying
    @Query("delete from ProductizationCartServiceItem item where item.cart.id = :cartId")
    void deleteByCartId(@Param("cartId") UUID cartId);
}
