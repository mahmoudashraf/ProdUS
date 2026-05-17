package com.produs.network;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TrialCollaborationRepository extends JpaRepository<TrialCollaboration, UUID> {
    List<TrialCollaboration> findAllByOrderByCreatedAtDesc();
    Optional<TrialCollaboration> findByTitleAndInitiatedById(String title, UUID initiatedById);
}
