package com.produs.share;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.engine.LaunchReadinessReport;
import com.produs.engine.LaunchReadinessReportRepository;
import com.produs.engine.ProductDiagnosis;
import com.produs.engine.ProductDiagnosisRepository;
import com.produs.engine.ProductFinding;
import com.produs.engine.ProductFindingRepository;
import com.produs.entity.User;
import com.produs.cart.ProductizationCartRepository;
import com.produs.cart.ProductizationCartServiceItemRepository;
import com.produs.cart.ProductizationCartTalentItemRepository;
import com.produs.packages.PackageInstance;
import com.produs.packages.PackageInstanceRepository;
import com.produs.packages.PackageModuleRepository;
import com.produs.product.ProductProfile;
import com.produs.product.ProductProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import static com.produs.share.ProductShareDtos.LockedShareSection;
import static com.produs.share.ProductShareDtos.ProductShareLinkRequest;
import static com.produs.share.ProductShareDtos.ProductShareLinkResponse;
import static com.produs.share.ProductShareDtos.PublicLaunchStatus;
import static com.produs.share.ProductShareDtos.PublicProductShareResponse;
import static com.produs.share.ProductShareDtos.PublicSelectedService;
import static com.produs.share.ProductShareDtos.PublicShareSummary;
import static com.produs.share.ProductShareDtos.PublicViewerAction;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class ProductShareLinkService {

    private static final List<String> DEFAULT_SECTIONS = List.of("PRODUCT_SUMMARY");
    private static final Set<String> ALLOWED_SECTIONS = Set.of(
            "PRODUCT_SUMMARY",
            "LAUNCH_STATUS",
            "SELECTED_SERVICES",
            "TEAM_STATUS",
            "FINDINGS_SUMMARY",
            "EVIDENCE_SUMMARY"
    );

    private final ProductShareLinkRepository shareLinkRepository;
    private final ProductProfileRepository productProfileRepository;
    private final LaunchReadinessReportRepository launchReadinessReportRepository;
    private final ProductDiagnosisRepository productDiagnosisRepository;
    private final ProductFindingRepository productFindingRepository;
    private final PackageInstanceRepository packageInstanceRepository;
    private final PackageModuleRepository packageModuleRepository;
    private final ProductizationCartRepository productizationCartRepository;
    private final ProductizationCartServiceItemRepository productizationCartServiceItemRepository;
    private final ProductizationCartTalentItemRepository productizationCartTalentItemRepository;
    private final ObjectMapper objectMapper;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional(readOnly = true)
    public List<ProductShareLinkResponse> list(User owner, UUID productId) {
        ProductProfile product = productProfileRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product profile not found"));
        requireProductOwner(owner, product);
        return shareLinkRepository.findByProductProfileIdAndOwnerIdOrderByCreatedAtDesc(productId, owner.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ProductShareLinkResponse create(User owner, UUID productId, ProductShareLinkRequest request) {
        ProductProfile product = productProfileRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product profile not found"));
        requireProductOwner(owner, product);

        ProductShareLink link = new ProductShareLink();
        link.setProductProfile(product);
        link.setOwner(owner);
        link.setShareToken(uniqueToken());
        link.setTitle(firstNonBlank(request == null ? null : request.title(), product.getName() + " product summary"));
        link.setAudience(request == null || request.audience() == null
                ? ProductShareLink.ShareAudience.PUBLIC_SUMMARY
                : request.audience());
        link.setVisibleSectionsJson(writeSections(normalizeSections(request == null ? null : request.visibleSections())));
        link.setOwnerNote(request == null ? null : clean(request.ownerNote()));
        link.setViewerActionLabel(request == null ? null : clean(request.viewerActionLabel()));
        link.setViewerActionUrl(request == null ? null : cleanViewerActionUrl(request.viewerActionUrl()));
        link.setExpiresAt(request == null ? null : request.expiresAt());
        return toResponse(shareLinkRepository.save(link));
    }

    @Transactional
    public ProductShareLinkResponse revoke(User owner, UUID productId, UUID linkId) {
        ProductShareLink link = shareLinkRepository.findByIdAndProductProfileIdAndOwnerId(linkId, productId, owner.getId())
                .orElseThrow(() -> new IllegalArgumentException("Share link not found"));
        link.setRevokedAt(LocalDateTime.now());
        return toResponse(shareLinkRepository.save(link));
    }

    @Transactional
    public PublicProductShareResponse publicView(String token) {
        ProductShareLink link = shareLinkRepository.findByShareToken(token)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Share link not found"));
        LocalDateTime now = LocalDateTime.now();
        if (!link.activeAt(now) || link.getAudience() == ProductShareLink.ShareAudience.INTERNAL_ONLY) {
            throw new ResponseStatusException(NOT_FOUND, "Share link not found");
        }
        link.setLastAccessedAt(now);
        link.setAccessCount(link.getAccessCount() + 1);
        shareLinkRepository.save(link);

        List<String> sections = readSections(link.getVisibleSectionsJson());
        ProductProfile product = link.getProductProfile();
        boolean showLaunchStatus = sections.contains("LAUNCH_STATUS");
        boolean showSelectedServices = sections.contains("SELECTED_SERVICES");
        boolean showFindingsSummary = sections.contains("FINDINGS_SUMMARY");
        boolean showEvidenceSummary = sections.contains("EVIDENCE_SUMMARY");
        boolean showTeamSummary = sections.contains("TEAM_STATUS");

        return new PublicProductShareResponse(
                product.getId(),
                product.getName(),
                product.getSummary(),
                product.getBusinessStage().name(),
                link.getOwnerNote(),
                link.getAudience(),
                sections,
                showLaunchStatus ? launchStatus(product.getId()) : null,
                showSelectedServices ? selectedServices(product.getId()) : List.of(),
                showFindingsSummary ? findingsSummary(product.getId()) : null,
                showEvidenceSummary ? evidenceSummary(product.getId()) : null,
                showTeamSummary ? teamSummary(product.getId()) : null,
                lockedSections(sections),
                viewerAction(link),
                link.getExpiresAt()
        );
    }

    private ProductShareLinkResponse toResponse(ProductShareLink link) {
        return new ProductShareLinkResponse(
                link.getId(),
                link.getProductProfile().getId(),
                link.getShareToken(),
                link.getTitle(),
                link.getAudience(),
                readSections(link.getVisibleSectionsJson()),
                link.getOwnerNote(),
                link.getViewerActionLabel(),
                link.getViewerActionUrl(),
                link.getExpiresAt(),
                link.getRevokedAt(),
                link.getCreatedAt(),
                link.getLastAccessedAt(),
                link.getAccessCount(),
                link.activeAt(LocalDateTime.now())
        );
    }

    private PublicLaunchStatus launchStatus(UUID productId) {
        return launchReadinessReportRepository.findFirstByProductProfileIdOrderByCreatedAtDesc(productId)
                .map(report -> new PublicLaunchStatus(
                        report.getStatusLabel(),
                        report.getShipConfidenceScore(),
                        firstNonBlank(report.getSummary(), report.getReadySummary(), report.getRiskSummary(), "Launch readiness summary is available."),
                        true
                ))
                .orElse(new PublicLaunchStatus(
                        "Launch status not available yet",
                        null,
                        "No launch-readiness report exists for this product yet.",
                        false
                ));
    }

    private List<PublicSelectedService> selectedServices(UUID productId) {
        List<PublicSelectedService> packageServices = packageInstanceRepository.findByProductProfileIdOrderByCreatedAtDesc(productId).stream()
                .findFirst()
                .map(PackageInstance::getId)
                .map(packageId -> packageModuleRepository.findByPackageInstanceIdOrderBySequenceOrderAsc(packageId).stream()
                        .limit(8)
                        .map(module -> new PublicSelectedService(
                                module.getServiceModule().getName(),
                                firstNonBlank(module.getServiceModule().getOwnerOutcome(), module.getServiceModule().getDescription(), module.getRationale()),
                                module.getServiceModule().getCategory() == null ? null : module.getServiceModule().getCategory().getName()
                        ))
                        .toList())
                .orElse(List.of());
        if (!packageServices.isEmpty()) {
            return packageServices;
        }
        return productizationCartRepository.findByProductProfileIdOrderByCreatedAtDesc(productId).stream()
                .findFirst()
                .map(cart -> productizationCartServiceItemRepository.findByCartIdOrderBySequenceOrderAscCreatedAtAsc(cart.getId()).stream()
                        .limit(8)
                        .map(item -> new PublicSelectedService(
                                item.getServiceModule().getName(),
                                firstNonBlank(item.getServiceModule().getOwnerOutcome(), item.getServiceModule().getDescription(), item.getNotes()),
                                item.getServiceModule().getCategory() == null ? null : item.getServiceModule().getCategory().getName()
                        ))
                        .toList())
                .orElse(List.of());
    }

    private PublicShareSummary findingsSummary(UUID productId) {
        ProductDiagnosis diagnosis = productDiagnosisRepository.findByProductProfileIdOrderByCreatedAtDesc(productId).stream()
                .findFirst()
                .orElse(null);
        if (diagnosis == null) {
            return new PublicShareSummary(
                    "Findings summary",
                    "No owner-approved findings summary is available yet.",
                    List.of("Detailed findings are still private."),
                    0
            );
        }
        List<ProductFinding> openFindings = productFindingRepository.findByDiagnosisIdOrderByCreatedAtAsc(diagnosis.getId()).stream()
                .filter(finding -> finding.getStatus() != ProductFinding.FindingStatus.RESOLVED
                        && finding.getStatus() != ProductFinding.FindingStatus.DISMISSED)
                .toList();
        long blockerCount = openFindings.stream().filter(finding -> severe(finding.getSeverity())).count();
        List<String> items = openFindings.stream()
                .sorted(Comparator.comparing((ProductFinding finding) -> severityRank(finding.getSeverity())).reversed())
                .limit(4)
                .map(finding -> finding.getTitle() + " (" + finding.getSeverity().name().toLowerCase(Locale.ROOT) + ")")
                .toList();
        return new PublicShareSummary(
                "Findings summary",
                openFindings.isEmpty()
                        ? "No open owner findings are currently shared at summary level."
                        : openFindings.size() + " open finding(s) are shared at summary level; " + blockerCount + " look like launch blockers.",
                items.isEmpty() ? List.of("Detailed findings remain private unless the owner grants deeper access.") : items,
                openFindings.size()
        );
    }

    private PublicShareSummary evidenceSummary(UUID productId) {
        LaunchReadinessReport report = launchReadinessReportRepository.findFirstByProductProfileIdOrderByCreatedAtDesc(productId)
                .orElse(null);
        if (report == null) {
            return new PublicShareSummary(
                    "Evidence summary",
                    "No launch evidence report has been shared yet.",
                    List.of("Evidence artifacts remain private."),
                    0
            );
        }
        List<String> collected = readStringList(report.getProofCollectedJson());
        List<String> missing = readStringList(report.getProofMissingJson());
        List<String> items = new ArrayList<>();
        collected.stream().limit(3).forEach(item -> items.add("Collected: " + item));
        missing.stream().limit(Math.max(0, 4 - items.size())).forEach(item -> items.add("Needed: " + item));
        return new PublicShareSummary(
                "Evidence summary",
                collected.size() + " proof item(s) collected and " + missing.size() + " proof gap(s) still tracked. Raw artifacts remain private.",
                items.isEmpty() ? List.of("No proof details were selected for this public summary.") : items,
                collected.size() + missing.size()
        );
    }

    private PublicShareSummary teamSummary(UUID productId) {
        return productizationCartRepository.findByProductProfileIdOrderByCreatedAtDesc(productId).stream()
                .findFirst()
                .map(cart -> {
                    int serviceCount = productizationCartServiceItemRepository.findByCartIdOrderBySequenceOrderAscCreatedAtAsc(cart.getId()).size();
                    int talentCount = productizationCartTalentItemRepository.findByCartIdOrderByCreatedAtAsc(cart.getId()).size();
                    List<String> items = new ArrayList<>();
                    items.add(serviceCount + " service workstream(s) are in the owner plan.");
                    items.add(talentCount > 0
                            ? talentCount + " team or expert candidate(s) are saved for follow-up."
                            : "No team or expert shortlist has been shared yet.");
                    return new PublicShareSummary(
                            "Team status",
                            talentCount > 0
                                    ? "The owner has started matching delivery support to the product plan."
                                    : "The owner has not shared a delivery team selection yet.",
                            items,
                            talentCount
                    );
                })
                .orElse(new PublicShareSummary(
                        "Team status",
                        "No Project Start Plan team status is available yet.",
                        List.of("Delivery participation remains private until the owner shares it."),
                        0
                ));
    }

    private PublicViewerAction viewerAction(ProductShareLink link) {
        if (link.getViewerActionLabel() == null || link.getViewerActionLabel().isBlank()
                || link.getViewerActionUrl() == null || link.getViewerActionUrl().isBlank()) {
            return null;
        }
        return new PublicViewerAction(link.getViewerActionLabel(), link.getViewerActionUrl());
    }

    private List<LockedShareSection> lockedSections(List<String> visibleSections) {
        List<LockedShareSection> locked = new ArrayList<>();
        if (!visibleSections.contains("FINDINGS_SUMMARY")) {
            locked.add(new LockedShareSection("Findings", "Detailed findings stay private unless the owner explicitly shares them with the right audience."));
        }
        if (!visibleSections.contains("EVIDENCE_SUMMARY")) {
            locked.add(new LockedShareSection("Evidence", "Evidence artifacts stay private unless the owner explicitly shares them with the right audience."));
        }
        if (!visibleSections.contains("TEAM_STATUS")) {
            locked.add(new LockedShareSection("Team status", "Team and delivery participation are hidden until the owner shares that section."));
        }
        return locked;
    }

    private List<String> normalizeSections(List<String> sections) {
        if (sections == null || sections.isEmpty()) {
            return DEFAULT_SECTIONS;
        }
        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        sections.forEach(section -> {
            String value = section == null ? "" : section.trim().toUpperCase(Locale.ROOT);
            if (ALLOWED_SECTIONS.contains(value)) {
                normalized.add(value);
            }
        });
        if (normalized.isEmpty()) {
            return DEFAULT_SECTIONS;
        }
        normalized.add("PRODUCT_SUMMARY");
        return List.copyOf(normalized);
    }

    private String writeSections(List<String> sections) {
        try {
            return objectMapper.writeValueAsString(sections);
        } catch (Exception exception) {
            return "[\"PRODUCT_SUMMARY\"]";
        }
    }

    private List<String> readSections(String value) {
        if (value == null || value.isBlank()) {
            return DEFAULT_SECTIONS;
        }
        try {
            List<String> sections = objectMapper.readValue(value, new TypeReference<>() {});
            return normalizeSections(sections);
        } catch (Exception exception) {
            return DEFAULT_SECTIONS;
        }
    }

    private List<String> readStringList(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(value, new TypeReference<>() {});
        } catch (Exception exception) {
            return List.of();
        }
    }

    private String uniqueToken() {
        byte[] bytes = new byte[24];
        String token;
        do {
            secureRandom.nextBytes(bytes);
            token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        } while (shareLinkRepository.existsByShareToken(token));
        return token;
    }

    private void requireProductOwner(User user, ProductProfile product) {
        if (user.getRole() == User.UserRole.ADMIN || product.getOwner().getId().equals(user.getId())) {
            return;
        }
        throw new AccessDeniedException("Product profile belongs to another owner");
    }

    private String clean(String value) {
        return value == null ? null : value.trim();
    }

    private String cleanViewerActionUrl(String value) {
        String cleaned = clean(value);
        if (cleaned == null || cleaned.isBlank()) {
            return null;
        }
        String lower = cleaned.toLowerCase(Locale.ROOT);
        if (lower.startsWith("https://") || lower.startsWith("http://") || lower.startsWith("mailto:") || cleaned.startsWith("/")) {
            return cleaned;
        }
        return null;
    }

    private boolean severe(ProductFinding.FindingSeverity severity) {
        return severity == ProductFinding.FindingSeverity.CRITICAL || severity == ProductFinding.FindingSeverity.HIGH;
    }

    private int severityRank(ProductFinding.FindingSeverity severity) {
        return switch (severity) {
            case CRITICAL -> 5;
            case HIGH -> 4;
            case MEDIUM -> 3;
            case LOW -> 2;
            case INFO -> 1;
        };
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }
}
