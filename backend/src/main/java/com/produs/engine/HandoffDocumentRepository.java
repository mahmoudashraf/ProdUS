package com.produs.engine;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HandoffDocumentRepository extends JpaRepository<HandoffDocument, UUID> {
    List<HandoffDocument> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
    Optional<HandoffDocument> findTopByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
}
