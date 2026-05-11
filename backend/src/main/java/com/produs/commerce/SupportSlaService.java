package com.produs.commerce;

import com.produs.entity.User;
import com.produs.notifications.NotificationService;
import com.produs.notifications.PlatformNotification;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class SupportSlaService {

    private static final List<SupportRequest.SupportStatus> SLA_ACTIVE_STATUSES = List.of(
            SupportRequest.SupportStatus.OPEN,
            SupportRequest.SupportStatus.ACKNOWLEDGED,
            SupportRequest.SupportStatus.IN_PROGRESS
    );

    private final SupportRequestRepository supportRequestRepository;
    private final SupportSlaProperties properties;
    private final NotificationService notificationService;

    public void applyPassiveSlaState(SupportRequest request) {
        request.setSlaStatus(passiveStatus(request, LocalDate.now()));
    }

    @Transactional
    public SupportSlaRunResult runSlaScan() {
        if (!properties.isEnabled()) {
            return new SupportSlaRunResult(0, 0, 0, 0);
        }

        LocalDate today = LocalDate.now();
        LocalDate horizon = today.plusDays(Math.max(0, properties.getDueSoonDays()));
        LocalDateTime checkedAt = LocalDateTime.now();
        List<SupportRequest> candidates = supportRequestRepository.findByStatusInAndDueOnLessThanEqualOrderByDueOnAsc(
                SLA_ACTIVE_STATUSES,
                horizon
        );

        int dueSoonCount = 0;
        int escalatedCount = 0;
        int updatedCount = 0;

        for (SupportRequest request : candidates) {
            SupportRequest.SlaStatus before = request.getSlaStatus();
            SupportRequest.SlaStatus target = passiveStatus(request, today);
            request.setLastSlaCheckAt(checkedAt);

            if (target == SupportRequest.SlaStatus.DUE_SOON) {
                if (before != SupportRequest.SlaStatus.DUE_SOON) {
                    dueSoonCount++;
                    notifyDueSoon(request);
                }
                request.setSlaStatus(SupportRequest.SlaStatus.DUE_SOON);
            } else if (target == SupportRequest.SlaStatus.OVERDUE) {
                if (before != SupportRequest.SlaStatus.ESCALATED) {
                    escalatedCount++;
                    request.setEscalatedAt(checkedAt);
                    request.setEscalationCount(request.getEscalationCount() + 1);
                    notifyEscalated(request);
                }
                request.setSlaStatus(SupportRequest.SlaStatus.ESCALATED);
            } else {
                request.setSlaStatus(target);
            }

            if (!Objects.equals(before, request.getSlaStatus())) {
                updatedCount++;
            }
            supportRequestRepository.save(request);
        }

        return new SupportSlaRunResult(candidates.size(), dueSoonCount, escalatedCount, updatedCount);
    }

    private SupportRequest.SlaStatus passiveStatus(SupportRequest request, LocalDate today) {
        if (request.getStatus() == SupportRequest.SupportStatus.RESOLVED
                || request.getStatus() == SupportRequest.SupportStatus.CANCELLED) {
            return SupportRequest.SlaStatus.RESOLVED;
        }
        if (!SLA_ACTIVE_STATUSES.contains(request.getStatus()) || request.getDueOn() == null) {
            return SupportRequest.SlaStatus.ON_TRACK;
        }
        if (request.getSlaStatus() == SupportRequest.SlaStatus.ESCALATED && request.getDueOn().isBefore(today)) {
            return SupportRequest.SlaStatus.ESCALATED;
        }
        if (request.getDueOn().isBefore(today)) {
            return SupportRequest.SlaStatus.OVERDUE;
        }
        if (!request.getDueOn().isAfter(today.plusDays(Math.max(0, properties.getDueSoonDays())))) {
            return SupportRequest.SlaStatus.DUE_SOON;
        }
        return SupportRequest.SlaStatus.ON_TRACK;
    }

    private void notifyDueSoon(SupportRequest request) {
        notificationService.notifyAll(
                List.of(request.getOwner(), request.getTeam().getManager()),
                null,
                PlatformNotification.NotificationType.SUPPORT_REQUEST_SLA_DUE_SOON,
                PlatformNotification.NotificationPriority.HIGH,
                "Support request due soon",
                request.getTitle() + " is due on " + request.getDueOn(),
                "/workspaces",
                "SUPPORT_REQUEST",
                request.getId(),
                request.getWorkspace()
        );
    }

    private void notifyEscalated(SupportRequest request) {
        notificationService.notifyAll(
                List.of(request.getOwner(), request.getTeam().getManager()),
                null,
                PlatformNotification.NotificationType.SUPPORT_REQUEST_SLA_ESCALATED,
                PlatformNotification.NotificationPriority.CRITICAL,
                "Support SLA escalated",
                request.getTitle() + " is past its support due date of " + request.getDueOn(),
                "/workspaces",
                "SUPPORT_REQUEST",
                request.getId(),
                request.getWorkspace()
        );
    }

    public record SupportSlaRunResult(
            int scannedCount,
            int dueSoonCount,
            int escalatedCount,
            int updatedCount
    ) {}
}
