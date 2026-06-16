package com.produs.workspace;

import com.produs.workspace.WorkspaceServiceFinding.WorkspaceServiceFindingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceServiceFindingRepository extends JpaRepository<WorkspaceServiceFinding, UUID> {
    Optional<WorkspaceServiceFinding> findByWorkspaceIdAndServiceModuleIdAndRiskThreadId(UUID workspaceId, UUID serviceModuleId, UUID riskThreadId);

    List<WorkspaceServiceFinding> findByWorkspaceIdAndServiceModuleIdOrderByUpdatedAtDesc(UUID workspaceId, UUID serviceModuleId);

    List<WorkspaceServiceFinding> findByWorkspaceIdAndRiskThreadIdAndStatus(UUID workspaceId, UUID riskThreadId, WorkspaceServiceFindingStatus status);

    List<WorkspaceServiceFinding> findByRiskThreadIdAndStatus(UUID riskThreadId, WorkspaceServiceFindingStatus status);
}
