package com.produs.share;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public final class ProductShareDtos {

    private ProductShareDtos() {
    }

    public record ProductShareLinkRequest(
            String title,
            ProductShareLink.ShareAudience audience,
            List<String> visibleSections,
            String ownerNote,
            String viewerActionLabel,
            String viewerActionUrl,
            LocalDateTime expiresAt
    ) {}

    public record ProductShareLinkResponse(
            UUID id,
            UUID productId,
            String token,
            String title,
            ProductShareLink.ShareAudience audience,
            List<String> visibleSections,
            String ownerNote,
            String viewerActionLabel,
            String viewerActionUrl,
            LocalDateTime expiresAt,
            LocalDateTime revokedAt,
            LocalDateTime createdAt,
            LocalDateTime lastAccessedAt,
            int accessCount,
            boolean active
    ) {}

    public record PublicProductShareResponse(
            UUID productId,
            String productName,
            String summary,
            String businessStage,
            String ownerNote,
            ProductShareLink.ShareAudience audience,
            List<String> visibleSections,
            PublicLaunchStatus launchStatus,
            List<PublicSelectedService> selectedServices,
            PublicShareSummary findingsSummary,
            PublicShareSummary evidenceSummary,
            PublicShareSummary teamSummary,
            List<LockedShareSection> lockedSections,
            PublicViewerAction viewerAction,
            LocalDateTime expiresAt
    ) {}

    public record PublicLaunchStatus(
            String statusLabel,
            Integer score,
            String summary,
            boolean reportAvailable
    ) {}

    public record PublicSelectedService(
            String name,
            String outcome,
            String category
    ) {}

    public record PublicShareSummary(
            String title,
            String summary,
            List<String> items,
            int count
    ) {}

    public record PublicViewerAction(
            String label,
            String url
    ) {}

    public record LockedShareSection(
            String section,
            String reason
    ) {}
}
