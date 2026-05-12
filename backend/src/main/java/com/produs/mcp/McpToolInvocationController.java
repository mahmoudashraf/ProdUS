package com.produs.mcp;

import com.produs.entity.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/mcp/invocations")
@RequiredArgsConstructor
public class McpToolInvocationController {

    private final McpToolInvocationRepository invocationRepository;

    @GetMapping
    public List<McpToolInvocationResponse> list(@AuthenticationPrincipal User user) {
        List<McpToolInvocation> invocations = user.getRole() == User.UserRole.ADMIN
                ? invocationRepository.findAll().stream()
                        .sorted(Comparator.comparing(McpToolInvocation::getCreatedAt).reversed())
                        .toList()
                : invocationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return invocations.stream()
                .map(McpToolInvocationController::toResponse)
                .toList();
    }

    @PostMapping
    public McpToolInvocationResponse create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody McpToolInvocationRequest request
    ) {
        McpToolInvocation invocation = new McpToolInvocation();
        invocation.setUser(user);
        invocation.setRole(user.getRole().name());
        invocation.setToolName(request.toolName());
        invocation.setRequestId(request.requestId());
        invocation.setTargetType(request.targetType());
        invocation.setTargetId(request.targetId());
        invocation.setInputHash(request.inputHash());
        invocation.setStatus(request.status());
        invocation.setBackendStatus(request.backendStatus());
        invocation.setErrorSummary(request.errorSummary());
        return toResponse(invocationRepository.save(invocation));
    }

    private static McpToolInvocationResponse toResponse(McpToolInvocation invocation) {
        return new McpToolInvocationResponse(
                invocation.getId(),
                invocation.getCreatedAt(),
                invocation.getUpdatedAt(),
                invocation.getUser().getId(),
                invocation.getUser().getEmail(),
                invocation.getRole(),
                invocation.getToolName(),
                invocation.getRequestId(),
                invocation.getTargetType(),
                invocation.getTargetId(),
                invocation.getInputHash(),
                invocation.getStatus(),
                invocation.getBackendStatus(),
                invocation.getErrorSummary()
        );
    }

    public record McpToolInvocationRequest(
            @NotBlank(message = "Tool name is required")
            String toolName,
            String requestId,
            String targetType,
            String targetId,
            String inputHash,
            @NotNull(message = "Invocation status is required")
            McpToolInvocation.InvocationStatus status,
            Integer backendStatus,
            String errorSummary
    ) {}

    public record McpToolInvocationResponse(
            UUID id,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            UUID userId,
            String userEmail,
            String role,
            String toolName,
            String requestId,
            String targetType,
            String targetId,
            String inputHash,
            McpToolInvocation.InvocationStatus status,
            Integer backendStatus,
            String errorSummary
    ) {}
}
