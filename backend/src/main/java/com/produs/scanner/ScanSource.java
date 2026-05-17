package com.produs.scanner;

import com.produs.entity.User;
import com.produs.product.ProductProfile;
import com.produs.shared.BaseEntity;
import com.produs.workspace.ProjectWorkspace;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "scan_sources")
public class ScanSource extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_profile_id", nullable = false)
    private ProductProfile productProfile;

    @ManyToOne
    @JoinColumn(name = "workspace_id")
    private ProjectWorkspace workspace;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider_type", nullable = false)
    private ProviderType providerType = ProviderType.CI_UPLOAD;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "external_reference", length = 1000)
    private String externalReference;

    @Enumerated(EnumType.STRING)
    @Column(name = "authorization_status", nullable = false)
    private AuthorizationStatus authorizationStatus = AuthorizationStatus.AUTHORIZED;

    @Column(name = "scope_note", columnDefinition = "TEXT")
    private String scopeNote;

    @ManyToOne(optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    public enum ProviderType {
        CI_UPLOAD,
        GITHUB,
        GITLAB,
        RUNTIME_URL,
        EXTERNAL_TOOL
    }

    public enum AuthorizationStatus {
        PENDING,
        AUTHORIZED,
        REVOKED,
        FAILED
    }
}
