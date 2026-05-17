package com.produs.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PackageTemplateModuleRepository extends JpaRepository<PackageTemplateModule, UUID> {
    List<PackageTemplateModule> findByTemplateIdOrderBySequenceOrderAsc(UUID templateId);
    Optional<PackageTemplateModule> findByTemplateIdAndServiceModuleId(UUID templateId, UUID serviceModuleId);
}
