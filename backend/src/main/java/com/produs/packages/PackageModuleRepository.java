package com.produs.packages;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PackageModuleRepository extends JpaRepository<PackageModule, UUID> {
    List<PackageModule> findByPackageInstanceIdOrderBySequenceOrderAsc(UUID packageInstanceId);
    Optional<PackageModule> findByPackageInstanceIdAndServiceModuleId(UUID packageInstanceId, UUID serviceModuleId);
}
