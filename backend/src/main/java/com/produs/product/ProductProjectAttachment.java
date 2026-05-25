package com.produs.product;

import com.produs.entity.User;
import com.produs.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "product_project_attachments")
public class ProductProjectAttachment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_profile_id")
    private ProductProfile productProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creation_intent_id")
    private ProductCreationIntent creationIntent;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "storage_key", nullable = false, unique = true, length = 512)
    private String storageKey;

    @Column(name = "file_url", nullable = false, columnDefinition = "TEXT")
    private String fileUrl;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "label")
    private String label;

    @Column(name = "ai_share_requested", nullable = false)
    private boolean aiShareRequested = false;

    @Column(name = "ai_access_token_hash", length = 64)
    private String aiAccessTokenHash;

    @Column(name = "ai_access_expires_at")
    private LocalDateTime aiAccessExpiresAt;

    @Column(name = "ai_access_revoked_at")
    private LocalDateTime aiAccessRevokedAt;

    @Column(name = "ai_access_last_used_at")
    private LocalDateTime aiAccessLastUsedAt;
}
