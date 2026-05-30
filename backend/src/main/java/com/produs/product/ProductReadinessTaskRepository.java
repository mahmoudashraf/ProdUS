package com.produs.product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductReadinessTaskRepository extends JpaRepository<ProductReadinessTask, UUID> {
    List<ProductReadinessTask> findByProductProfileIdOrderByCreatedAtAsc(UUID productProfileId);
}
