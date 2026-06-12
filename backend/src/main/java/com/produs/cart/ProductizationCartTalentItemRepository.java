package com.produs.cart;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductizationCartTalentItemRepository extends JpaRepository<ProductizationCartTalentItem, UUID> {
    List<ProductizationCartTalentItem> findByCartIdOrderByCreatedAtAsc(UUID cartId);
    Optional<ProductizationCartTalentItem> findByCartIdAndTeamId(UUID cartId, UUID teamId);
    Optional<ProductizationCartTalentItem> findByCartIdAndExpertProfileId(UUID cartId, UUID expertProfileId);

    @Modifying
    @Query("delete from ProductizationCartTalentItem item where item.cart.id = :cartId")
    void deleteByCartId(@Param("cartId") UUID cartId);
}
