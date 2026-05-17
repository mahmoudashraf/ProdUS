package com.produs.audit;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/audit-events")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditController {

    private final AuditEventRepository auditEventRepository;

    @GetMapping
    public List<AuditEventResponse> list() {
        return auditEventRepository.findTop100ByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    private AuditEventResponse toResponse(AuditEvent event) {
        return new AuditEventResponse(
                event.getId(),
                event.getCreatedAt(),
                event.getActor() == null ? null : event.getActor().getEmail(),
                event.getAction(),
                event.getEntityType(),
                event.getEntityId(),
                event.getRiskLevel(),
                event.getDetails()
        );
    }

    public record AuditEventResponse(
            UUID id,
            LocalDateTime createdAt,
            String actorEmail,
            String action,
            String entityType,
            UUID entityId,
            AuditEvent.RiskLevel riskLevel,
            String details
    ) {}
}
