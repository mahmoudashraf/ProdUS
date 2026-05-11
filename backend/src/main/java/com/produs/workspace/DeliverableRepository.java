package com.produs.workspace;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DeliverableRepository extends JpaRepository<Deliverable, UUID> {
    List<Deliverable> findByMilestoneIdOrderByCreatedAtAsc(UUID milestoneId);
}
