package com.produs.engine;

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

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "integration_connections")
public class IntegrationConnection extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne
    @JoinColumn(name = "product_profile_id")
    private ProductProfile productProfile;

    @ManyToOne
    @JoinColumn(name = "workspace_id")
    private ProjectWorkspace workspace;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProviderType providerType = ProviderType.GITHUB;

    @Column(nullable = false)
    private String name;

    @Column(name = "external_ref")
    private String externalRef;

    @Column(name = "scoped_access_note", columnDefinition = "TEXT")
    private String scopedAccessNote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConnectionStatus status = ConnectionStatus.CONFIGURED;

    @Column(name = "last_checked_at")
    private LocalDateTime lastCheckedAt;

    public enum ProviderType {
        GITHUB,
        CI_CD,
        DEPENDENCY_SCAN,
        SECRETS_SCAN,
        DEPLOYMENT,
        MONITORING,
        DATABASE,
        ISSUE_TRACKER,
        SUPPORT_TOOL,
        OTHER
    }

    public enum ConnectionStatus {
        CONFIGURED,
        ACTIVE,
        NEEDS_ATTENTION,
        DISCONNECTED
    }
}
