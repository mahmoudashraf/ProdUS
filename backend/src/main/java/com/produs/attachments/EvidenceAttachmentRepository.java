package com.produs.attachments;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EvidenceAttachmentRepository extends JpaRepository<EvidenceAttachment, UUID> {
    List<EvidenceAttachment> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
    List<EvidenceAttachment> findByScopeTypeAndScopeIdOrderByCreatedAtDesc(EvidenceAttachment.AttachmentScope scopeType, UUID scopeId);
}
