package com.produs.experts;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExpertProfileRepository extends JpaRepository<ExpertProfile, UUID> {
    Optional<ExpertProfile> findByUserId(UUID userId);
    List<ExpertProfile> findByActiveTrueOrderByUpdatedAtDesc();
}
