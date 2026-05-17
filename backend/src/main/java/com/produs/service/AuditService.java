package com.produs.service;

import com.produs.audit.AuditEvent;
import com.produs.audit.AuditEventRepository;
import com.produs.entity.User;
import com.produs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditEventRepository auditEventRepository;
    private final UserRepository userRepository;

    public AuditEvent logAdminAction(UUID adminId, String action, String details) {
        return logAction(adminId, action, "ADMIN", null, AuditEvent.RiskLevel.HIGH, details);
    }

    public AuditEvent logUserAction(UUID userId, String action, String details) {
        return logAction(userId, action, "USER", userId, AuditEvent.RiskLevel.MEDIUM, details);
    }

    public AuditEvent logAction(
            UUID actorId,
            String action,
            String entityType,
            UUID entityId,
            AuditEvent.RiskLevel riskLevel,
            String details
    ) {
        AuditEvent event = new AuditEvent();
        if (actorId != null) {
            userRepository.findById(actorId).ifPresent(event::setActor);
        }
        event.setAction(action);
        event.setEntityType(entityType == null || entityType.isBlank() ? "UNKNOWN" : entityType);
        event.setEntityId(entityId);
        event.setRiskLevel(riskLevel == null ? AuditEvent.RiskLevel.LOW : riskLevel);
        event.setDetails(details);
        AuditEvent saved = auditEventRepository.save(event);
        User actor = saved.getActor();
        log.info(
                "audit_event id={} actor={} action={} entityType={} entityId={} risk={} details={}",
                saved.getId(),
                actor == null ? "system" : actor.getEmail(),
                saved.getAction(),
                saved.getEntityType(),
                saved.getEntityId(),
                saved.getRiskLevel(),
                saved.getDetails()
        );
        return saved;
    }
}
