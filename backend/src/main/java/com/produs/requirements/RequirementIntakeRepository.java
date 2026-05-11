package com.produs.requirements;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RequirementIntakeRepository extends JpaRepository<RequirementIntake, UUID> {
    List<RequirementIntake> findByProductProfileOwnerIdOrderByCreatedAtDesc(UUID ownerId);
}
