package com.produs.share;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.engine.LaunchReadinessReport;
import com.produs.engine.LaunchReadinessReportRepository;
import com.produs.entity.User;
import com.produs.cart.ProductizationCartRepository;
import com.produs.cart.ProductizationCartServiceItemRepository;
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
    private final PackageInstanceRepository packageInstanceRepository;
    private final PackageModuleRepository packageModuleRepository;
    private final ProductizationCartRepository productizationCartRepository;
    private final ProductizationCartServiceItemRepository productizationCartServiceItemRepository;
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
                lockedSections(sections),
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

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }
}
