package com.produs.cart;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductizationCartTalentItemRepository extends JpaRepository<ProductizationCartTalentItem, UUID> {
    List<ProductizationCartTalentItem> findByCartIdOrderByCreatedAtAsc(UUID cartId);
    Optional<ProductizationCartTalentItem> findByCartIdAndTeamId(UUID cartId, UUID teamId);
    Optional<ProductizationCartTalentItem> findByCartIdAndExpertProfileId(UUID cartId, UUID expertProfileId);
}
