package com.produs.scanner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ScanSourceRepository extends JpaRepository<ScanSource, UUID> {
    List<ScanSource> findByProductProfileIdOrderByCreatedAtDesc(UUID productProfileId);
    List<ScanSource> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
    Optional<ScanSource> findFirstByProductProfileIdAndProviderTypeOrderByCreatedAtDesc(UUID productProfileId, ScanSource.ProviderType providerType);
}
