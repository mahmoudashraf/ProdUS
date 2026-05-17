package com.produs.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ServiceDependencyRepository extends JpaRepository<ServiceDependency, UUID> {
    List<ServiceDependency> findBySourceModuleAndRequiredTrue(ServiceModule sourceModule);
    List<ServiceDependency> findBySourceModuleId(UUID sourceModuleId);
    List<ServiceDependency> findBySourceModuleIdIn(List<UUID> sourceModuleIds);
}
