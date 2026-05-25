package com.produs.product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductProjectAttachmentRepository extends JpaRepository<ProductProjectAttachment, UUID> {
    List<ProductProjectAttachment> findByProductProfileIdOrderByCreatedAtDesc(UUID productProfileId);

    Optional<ProductProjectAttachment> findByAiAccessTokenHash(String aiAccessTokenHash);
}
