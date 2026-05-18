package com.produs.scanner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ScannerConnectorInstallationRepository extends JpaRepository<ScannerConnectorInstallation, UUID> {
    List<ScannerConnectorInstallation> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    Optional<ScannerConnectorInstallation> findByProviderTypeAndExternalInstallationId(
            ScanSource.ProviderType providerType,
            String externalInstallationId
    );
}
