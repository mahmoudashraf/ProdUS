package com.produs.requirements;

import com.produs.catalog.ServiceModule;
import com.produs.catalog.ServiceModuleRepository;
import com.produs.dto.PlatformDtos.RequirementIntakeResponse;
import com.produs.entity.User;
import com.produs.product.ProductProfile;
import com.produs.product.ProductProfileRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

import static com.produs.dto.PlatformDtos.toRequirementIntakeResponse;

@RestController
@RequestMapping("/api/requirements")
@RequiredArgsConstructor
public class RequirementController {

    private final RequirementIntakeRepository requirementRepository;
    private final ProductProfileRepository productRepository;
    private final ServiceModuleRepository moduleRepository;

    @GetMapping
    public List<RequirementIntakeResponse> list(@AuthenticationPrincipal User user) {
        return requirementRepository.findByProductProfileOwnerIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(intake -> toRequirementIntakeResponse(intake))
                .toList();
    }

    @GetMapping("/{id}")
    public RequirementIntakeResponse get(@AuthenticationPrincipal User user, @PathVariable UUID id) {
        RequirementIntake intake = requirementRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Requirement intake not found"));
        requireOwnerOrAdmin(user, intake.getProductProfile());
        return toRequirementIntakeResponse(intake);
    }

    @PostMapping
    public RequirementIntakeResponse create(@AuthenticationPrincipal User user, @Valid @RequestBody RequirementRequest request) {
        RequirementIntake intake = new RequirementIntake();
        apply(user, intake, request);
        return toRequirementIntakeResponse(requirementRepository.save(intake));
    }

    @PutMapping("/{id}")
    public RequirementIntakeResponse update(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody RequirementRequest request
    ) {
        RequirementIntake intake = requirementRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Requirement intake not found"));
        requireOwnerOrAdmin(user, intake.getProductProfile());
        apply(user, intake, request);
        return toRequirementIntakeResponse(requirementRepository.save(intake));
    }

    private void apply(User user, RequirementIntake intake, RequirementRequest request) {
        ProductProfile product = productRepository.findById(request.productProfileId())
                .orElseThrow(() -> new IllegalArgumentException("Product profile not found"));
        requireOwnerOrAdmin(user, product);
        ServiceModule module = request.requestedServiceModuleId() == null
                ? null
                : moduleRepository.findById(request.requestedServiceModuleId())
                        .orElseThrow(() -> new IllegalArgumentException("Service module not found"));

        intake.setProductProfile(product);
        intake.setRequestedServiceModule(module);
        intake.setBusinessGoal(request.businessGoal());
        intake.setCurrentProblems(request.currentProblems());
        intake.setConstraints(request.constraints());
        intake.setRiskSignals(request.riskSignals());
        intake.setRequirementBrief(request.requirementBrief());
        intake.setStatus(request.status() == null ? RequirementIntake.RequirementStatus.DRAFT : request.status());
    }

    private void requireOwnerOrAdmin(User user, ProductProfile product) {
        if (user.getRole() == User.UserRole.ADMIN || product.getOwner().getId().equals(user.getId())) {
            return;
        }
        throw new AccessDeniedException("Requirement belongs to another owner");
    }

    public record RequirementRequest(
            @NotNull(message = "Product profile is required")
            UUID productProfileId,
            UUID requestedServiceModuleId,
            @NotBlank(message = "Business goal is required")
            String businessGoal,
            String currentProblems,
            String constraints,
            String riskSignals,
            String requirementBrief,
            RequirementIntake.RequirementStatus status
    ) {}
}
