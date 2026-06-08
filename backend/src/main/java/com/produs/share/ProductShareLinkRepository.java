package com.produs.share;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductShareLinkRepository extends JpaRepository<ProductShareLink, UUID> {
    List<ProductShareLink> findByProductProfileIdAndOwnerIdOrderByCreatedAtDesc(UUID productProfileId, UUID ownerId);
    Optional<ProductShareLink> findByIdAndProductProfileIdAndOwnerId(UUID id, UUID productProfileId, UUID ownerId);
    Optional<ProductShareLink> findByShareToken(String shareToken);
    boolean existsByShareToken(String shareToken);
}
