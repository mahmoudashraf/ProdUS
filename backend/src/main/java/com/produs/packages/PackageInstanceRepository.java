package com.produs.packages;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PackageInstanceRepository extends JpaRepository<PackageInstance, UUID> {
    List<PackageInstance> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
}
