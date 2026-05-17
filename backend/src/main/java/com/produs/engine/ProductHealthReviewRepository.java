package com.produs.engine;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductHealthReviewRepository extends JpaRepository<ProductHealthReview, UUID> {
    List<ProductHealthReview> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
}
