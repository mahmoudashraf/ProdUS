package com.produs.engine;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductDiagnosisRepository extends JpaRepository<ProductDiagnosis, UUID> {
    List<ProductDiagnosis> findByProductProfileIdOrderByCreatedAtDesc(UUID productProfileId);
    List<ProductDiagnosis> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
    List<ProductDiagnosis> findByWorkspaceIdAndDiagnosisSourceOrderByCreatedAtDesc(UUID workspaceId, ProductDiagnosis.DiagnosisSource diagnosisSource);
    Optional<ProductDiagnosis> findByProductProfileIdAndDiagnosisSourceAndGeneratedFromScanRunIds(
            UUID productProfileId,
            ProductDiagnosis.DiagnosisSource diagnosisSource,
            String generatedFromScanRunIds
    );
    Optional<ProductDiagnosis> findByProductProfileIdAndWorkspaceIdAndDiagnosisSourceAndGeneratedFromScanRunIds(
            UUID productProfileId,
            UUID workspaceId,
            ProductDiagnosis.DiagnosisSource diagnosisSource,
            String generatedFromScanRunIds
    );
}
