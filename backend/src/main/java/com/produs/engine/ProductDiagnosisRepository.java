package com.produs.engine;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductDiagnosisRepository extends JpaRepository<ProductDiagnosis, UUID> {
    List<ProductDiagnosis> findByProductProfileIdOrderByCreatedAtDesc(UUID productProfileId);
}
