package com.produs.product;

import com.produs.dto.PlatformDtos.ProductProfileResponse;
import com.produs.entity.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

import static com.produs.dto.PlatformDtos.toProductProfileResponse;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductProfileController {

    private final ProductProfileRepository productProfileRepository;

    @GetMapping
    public List<ProductProfileResponse> list(@AuthenticationPrincipal User owner) {
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
        return toProductProfileResponse(productProfileRepository.save(profile));
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
