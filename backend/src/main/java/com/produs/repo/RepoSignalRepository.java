package com.produs.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RepoSignalRepository extends JpaRepository<RepoSignal, UUID> {
    List<RepoSignal> findByProductProfileIdAndWorkspaceIsNullOrderByCreatedAtDesc(UUID productProfileId);
    List<RepoSignal> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
    long deleteByProductProfileIdAndWorkspaceIsNull(UUID productProfileId);
    long deleteByWorkspaceId(UUID workspaceId);
}
