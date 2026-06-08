package com.produs.share;

import com.produs.entity.User;
import com.produs.product.ProductProfile;
import com.produs.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "product_share_links")
public class ProductShareLink extends BaseEntity {

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "product_profile_id", nullable = false)
    private ProductProfile productProfile;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "share_token", nullable = false, unique = true, length = 96)
    private String shareToken;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShareAudience audience = ShareAudience.PUBLIC_SUMMARY;

    @Column(name = "visible_sections_json", nullable = false, columnDefinition = "TEXT")
    private String visibleSectionsJson = "[\"PRODUCT_SUMMARY\"]";

    @Column(name = "owner_note", columnDefinition = "TEXT")
    private String ownerNote;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Column(name = "last_accessed_at")
    private LocalDateTime lastAccessedAt;

    @Column(name = "access_count", nullable = false)
    private int accessCount = 0;

    public enum ShareAudience {
        PUBLIC_SUMMARY,
        REGISTERED_VIEWERS,
        INVITED_VIEWERS,
        INTERNAL_ONLY
    }

    public boolean activeAt(LocalDateTime now) {
        return revokedAt == null && (expiresAt == null || expiresAt.isAfter(now));
    }
}
