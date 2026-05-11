package com.produs.product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductProfileRepository extends JpaRepository<ProductProfile, UUID> {
    List<ProductProfile> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
}
