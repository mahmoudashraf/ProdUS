package com.produs.product;

import com.produs.product.AiAssistedProductCreationService.AiAssistedProductCreationRequest;
import com.produs.product.AiAssistedProductCreationService.AiAssistedProductAnalysisResponse;
import com.produs.product.AiAssistedProductCreationService.ProductCreationActionRequest;
import com.produs.product.AiAssistedProductCreationService.ProductCreationActionResponse;
import com.produs.dto.PlatformDtos.ProductProfileResponse;
import com.produs.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.produs.dto.PlatformDtos.toProductProfileResponse;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductProfileController {

    private final ProductProfileRepository productProfileRepository;
    private final AiAssistedProductCreationService aiAssistedProductCreationService;

    @Value("${app.public-api-base-url:}")
    private String publicApiBaseUrl;

    @GetMapping
    public List<ProductProfileResponse> list(@AuthenticationPrincipal User owner) {
        if (owner.getRole() == User.UserRole.ADMIN) {
            return productProfileRepository.findAll().stream()
                    .sorted(Comparator.comparing(ProductProfile::getCreatedAt).reversed())
                    .map(profile -> toProductProfileResponse(profile))
                    .toList();
        }
        return productProfileRepository.findByOwnerIdOrderByCreatedAtDesc(owner.getId()).stream()
                .map(profile -> toProductProfileResponse(profile))
                .toList();
    }

    @GetMapping("/{id}")
    public ProductProfileResponse get(@AuthenticationPrincipal User owner, @PathVariable UUID id) {
        ProductProfile profile = productProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product profile not found"));
        requireOwnerOrAdmin(owner, profile);
        return toProductProfileResponse(profile);
    }

    @PostMapping
    public ProductProfileResponse create(@AuthenticationPrincipal User owner, @Valid @RequestBody ProductProfileRequest request) {
        ProductProfile profile = new ProductProfile();
        profile.setOwner(owner);
        apply(profile, request);
        profile.setCreationMode(ProductProfile.CreationMode.MANUAL);
        profile.setCreatedByAi(false);
        return toProductProfileResponse(productProfileRepository.save(profile));
    }

    @PostMapping(value = "/ai-assisted/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AiAssistedProductAnalysisResponse analyzeWithAI(
            @AuthenticationPrincipal User owner,
            @RequestParam String ownerMessage,
            @RequestParam(required = false) String productName,
            @RequestParam(required = false) ProductProfile.BusinessStage businessStage,
            @RequestParam(required = false) String techStack,
            @RequestParam(required = false) String productUrl,
            @RequestParam(required = false) String repositoryUrl,
            @RequestParam(required = false) String knownRisks,
            @RequestParam(required = false) List<MultipartFile> files,
            @RequestParam(required = false) List<Integer> aiSharedFileIndexes,
            HttpServletRequest servletRequest
    ) {
        Set<Integer> selectedDocumentIndexes = aiSharedFileIndexes == null
                ? Set.of()
                : aiSharedFileIndexes.stream().filter(index -> index != null && index >= 0).collect(Collectors.toSet());
        return aiAssistedProductCreationService.analyze(
                owner,
                new AiAssistedProductCreationRequest(
                        productName,
                        ownerMessage,
                        businessStage,
                        techStack,
                        productUrl,
                        repositoryUrl,
                        knownRisks
                ),
                files,
                selectedDocumentIndexes,
                apiBaseUrl(servletRequest)
        );
    }

    @PostMapping("/ai-assisted/intents/{intentId}/create")
    public ProductCreationActionResponse createFromAIAction(
            @AuthenticationPrincipal User owner,
            @PathVariable UUID intentId,
            @RequestBody ProductCreationActionRequest request
    ) {
        if (request == null) {
            throw new IllegalArgumentException("Project creation action payload is required");
        }
        if (request.creationIntentId() != null && !intentId.equals(request.creationIntentId())) {
            throw new AccessDeniedException("Project creation intent path does not match action payload");
        }
        ProductCreationActionRequest actionRequest = new ProductCreationActionRequest(
                intentId,
                request.consentToken(),
                request.idempotencyKey(),
                request.analysisProviderRequestId(),
                request.productName(),
                request.summary(),
                request.projectDescription(),
                request.businessProblem(),
                request.targetUsers(),
                request.businessStage(),
                request.techStack(),
                request.productUrl(),
                request.repositoryUrl(),
                request.riskProfile(),
                request.aiCreationSummary(),
                request.coreCapabilities(),
                request.businessOutcomes(),
                request.readinessGoals(),
                request.recommendedServices(),
                request.scannerFocusAreas(),
                request.suggestedNextSteps(),
                request.sourceInsights(),
                request.assumptions(),
                request.missingEvidence(),
                request.sourceAttachmentIds(),
                request.aiAccessibleAttachmentIds()
        );
        return aiAssistedProductCreationService.createFromActionForOwner(owner, actionRequest);
    }

    @PutMapping("/{id}")
    public ProductProfileResponse update(
            @AuthenticationPrincipal User owner,
            @PathVariable UUID id,
            @Valid @RequestBody ProductProfileRequest request
    ) {
        ProductProfile profile = productProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product profile not found"));
        requireOwnerOrAdmin(owner, profile);
        apply(profile, request);
        return toProductProfileResponse(productProfileRepository.save(profile));
    }

    private void apply(ProductProfile profile, ProductProfileRequest request) {
        profile.setName(request.name());
        profile.setSummary(request.summary());
        profile.setBusinessStage(request.businessStage() == null ? ProductProfile.BusinessStage.PROTOTYPE : request.businessStage());
        profile.setTechStack(request.techStack());
        profile.setProductUrl(request.productUrl());
        profile.setRepositoryUrl(request.repositoryUrl());
        profile.setRiskProfile(request.riskProfile());
    }

    private void requireOwnerOrAdmin(User user, ProductProfile profile) {
        if (user.getRole() == User.UserRole.ADMIN || profile.getOwner().getId().equals(user.getId())) {
            return;
        }
        throw new AccessDeniedException("Product profile belongs to another owner");
    }

    String apiBaseUrl(HttpServletRequest request) {
        String configuredBaseUrl = normalizeBaseUrl(publicApiBaseUrl);
        if (!configuredBaseUrl.isBlank()) {
            return configuredBaseUrl;
        }

        String forwardedHost = firstHeaderValue(request.getHeader("X-Forwarded-Host"));
        String hostHeader = firstHeaderValue(request.getHeader("Host"));
        boolean hostCameFromHeader = !forwardedHost.isBlank() || !hostHeader.isBlank();
        String host = firstNonBlank(forwardedHost, hostHeader, request.getServerName());
        String scheme = firstNonBlank(firstHeaderValue(request.getHeader("X-Forwarded-Proto")), request.getScheme());

        if ("http".equalsIgnoreCase(scheme) && isPublicHost(host)) {
            scheme = "https";
        }

        boolean hostHasPort = host.contains(":");
        int port = request.getServerPort();
        boolean defaultPort = ("http".equalsIgnoreCase(scheme) && port == 80)
                || ("https".equalsIgnoreCase(scheme) && port == 443);
        return scheme + "://" + host + (hostCameFromHeader || hostHasPort || defaultPort ? "" : ":" + port);
    }

    private String firstHeaderValue(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.split(",", 2)[0].trim();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }

    private String normalizeBaseUrl(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String normalized = value.trim();
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private boolean isPublicHost(String host) {
        if (host == null || host.isBlank()) {
            return false;
        }
        String normalized = host.toLowerCase();
        return !normalized.startsWith("localhost")
                && !normalized.startsWith("127.")
                && !normalized.startsWith("0.0.0.0")
                && !normalized.startsWith("backend")
                && !normalized.endsWith(".local");
    }

    public record ProductProfileRequest(
            @NotBlank(message = "Product name is required")
            String name,
            String summary,
            ProductProfile.BusinessStage businessStage,
            String techStack,
            String productUrl,
            String repositoryUrl,
            String riskProfile
    ) {}
}
