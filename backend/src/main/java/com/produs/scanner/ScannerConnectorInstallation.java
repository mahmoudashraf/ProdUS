package com.produs.scanner;

import com.produs.entity.User;
import com.produs.shared.BaseEntity;
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
@Table(name = "scanner_connector_installations")
public class ScannerConnectorInstallation extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "provider_type", nullable = false)
    private ScanSource.ProviderType providerType;

    @ManyToOne(optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "external_installation_id", nullable = false, length = 255)
    private String externalInstallationId;

    @Column(name = "account_login", length = 255)
    private String accountLogin;

    @Column(name = "account_type", length = 80)
    private String accountType;

    @Column(name = "permissions_json", columnDefinition = "TEXT")
    private String permissionsJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InstallationStatus status = InstallationStatus.ACTIVE;

    @Column(name = "connected_at", nullable = false)
    private LocalDateTime connectedAt = LocalDateTime.now();

    @Column(name = "disconnected_at")
    private LocalDateTime disconnectedAt;

    @Column(name = "last_webhook_at")
    private LocalDateTime lastWebhookAt;

    @Column(name = "last_webhook_event", length = 120)
    private String lastWebhookEvent;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    @ManyToOne(optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    public enum InstallationStatus {
        ACTIVE,
        SUSPENDED,
        DISCONNECTED,
        FAILED
    }
}
