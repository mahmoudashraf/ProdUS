package com.produs.workspace;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProjectWorkspaceRepository extends JpaRepository<ProjectWorkspace, UUID> {
    List<ProjectWorkspace> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
}
