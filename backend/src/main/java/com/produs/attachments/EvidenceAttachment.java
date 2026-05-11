package com.produs.attachments;

import com.produs.commerce.DisputeCase;
import com.produs.entity.User;
import com.produs.shared.BaseEntity;
import com.produs.workspace.Deliverable;
import com.produs.workspace.ProjectWorkspace;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "evidence_attachments",
        uniqueConstraints = @UniqueConstraint(name = "uk_evidence_attachments_storage_key", columnNames = "storage_key"),
        indexes = {
                @Index(name = "idx_evidence_attachments_workspace", columnList = "workspace_id,created_at"),
                @Index(name = "idx_evidence_attachments_scope", columnList = "scope_type,scope_id,created_at")
        }
)
public class EvidenceAttachment extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private ProjectWorkspace workspace;

    @ManyToOne
    @JoinColumn(name = "deliverable_id")
    private Deliverable deliverable;

    @ManyToOne
    @JoinColumn(name = "dispute_id")
    private DisputeCase dispute;

    @ManyToOne(optional = false)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope_type", nullable = false)
    private AttachmentScope scopeType;

    @Column(name = "scope_id", nullable = false)
    private UUID scopeId;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "storage_key", nullable = false, length = 512)
    private String storageKey;

    @Column(name = "file_url", nullable = false, columnDefinition = "TEXT")
    private String fileUrl;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    private String label;

    public enum AttachmentScope {
        WORKSPACE,
        DELIVERABLE,
        DISPUTE
    }
}
