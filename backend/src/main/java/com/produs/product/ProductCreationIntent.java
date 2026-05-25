package com.produs.product;

import com.produs.entity.User;
import com.produs.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "product_creation_intents")
public class ProductCreationIntent extends BaseEntity {

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_profile_id")
    private ProductProfile productProfile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ANALYZING;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "created_product_at")
    private LocalDateTime createdProductAt;

    @Column(name = "consent_token_hash", nullable = false, length = 64)
    private String consentTokenHash;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 180)
    private String idempotencyKey;

    @Column(name = "owner_message", nullable = false, columnDefinition = "TEXT")
    private String ownerMessage;

    @Column(name = "product_name")
    private String productName;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Enumerated(EnumType.STRING)
    @Column(name = "business_stage")
    private ProductProfile.BusinessStage businessStage;

    @Column(name = "tech_stack", columnDefinition = "TEXT")
    private String techStack;

    @Column(name = "product_url")
    private String productUrl;

    @Column(name = "repository_url")
    private String repositoryUrl;

    @Column(name = "risk_profile", columnDefinition = "TEXT")
    private String riskProfile;

    @Column(name = "ai_creation_summary", columnDefinition = "TEXT")
    private String aiCreationSummary;

    @Column(columnDefinition = "TEXT")
    private String assumptions;

    @Column(name = "missing_evidence", columnDefinition = "TEXT")
    private String missingEvidence;

    @Column(name = "analysis_provider_request_id")
    private String analysisProviderRequestId;

    @Column(name = "analysis_fallback_reason")
    private String analysisFallbackReason;

    @Column(name = "ai_source_attachment_count", nullable = false)
    private int aiSourceAttachmentCount = 0;

    public enum Status {
        ANALYZING,
        READY_FOR_ACTION,
        CREATED,
        EXPIRED,
        FAILED
    }
}
