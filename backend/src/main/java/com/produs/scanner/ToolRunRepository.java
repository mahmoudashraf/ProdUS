package com.produs.scanner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ToolRunRepository extends JpaRepository<ToolRun, UUID> {
    List<ToolRun> findByScanRunIdOrderByCreatedAtAsc(UUID scanRunId);
    List<ToolRun> findByScanRunIdInOrderByCreatedAtAsc(List<UUID> scanRunIds);
}
