package com.produs.mcp;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface McpToolInvocationRepository extends JpaRepository<McpToolInvocation, UUID> {
    List<McpToolInvocation> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
