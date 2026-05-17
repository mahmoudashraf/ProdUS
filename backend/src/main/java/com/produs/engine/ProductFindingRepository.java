package com.produs.engine;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductFindingRepository extends JpaRepository<ProductFinding, UUID> {
    List<ProductFinding> findByDiagnosisIdOrderByCreatedAtAsc(UUID diagnosisId);
}
