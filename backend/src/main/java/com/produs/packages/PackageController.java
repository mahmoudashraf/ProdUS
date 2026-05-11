package com.produs.packages;

import com.produs.dto.PlatformDtos.PackageInstanceResponse;
import com.produs.dto.PlatformDtos.PackageModuleResponse;
import com.produs.dto.PlatformDtos.TeamRecommendationResponse;
import com.produs.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import static com.produs.dto.PlatformDtos.toPackageInstanceResponse;
import static com.produs.dto.PlatformDtos.toPackageModuleResponse;
import static com.produs.dto.PlatformDtos.toTeamRecommendationResponse;

@RestController
@RequestMapping("/api/packages")
@RequiredArgsConstructor
public class PackageController {

    private final PackageInstanceRepository packageRepository;
    private final PackageModuleRepository packageModuleRepository;
    private final PackageBuilderService packageBuilderService;
    private final TeamMatchService teamMatchService;

    @GetMapping
    public List<PackageInstanceResponse> list(@AuthenticationPrincipal User user) {
        if (user.getRole() == User.UserRole.ADMIN) {
            return packageRepository.findAll().stream()
                    .sorted(Comparator.comparing(PackageInstance::getCreatedAt).reversed())
                    .map(packageInstance -> toPackageInstanceResponse(packageInstance))
                    .toList();
        }
        return packageRepository.findByOwnerIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(packageInstance -> toPackageInstanceResponse(packageInstance))
                .toList();
    }

    @GetMapping("/{id}")
    public PackageInstanceResponse get(@AuthenticationPrincipal User user, @PathVariable UUID id) {
        PackageInstance packageInstance = packageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Package not found"));
        requireOwnerOrAdmin(user, packageInstance);
        return toPackageInstanceResponse(packageInstance);
    }

    @GetMapping("/{id}/modules")
    public List<PackageModuleResponse> modules(@AuthenticationPrincipal User user, @PathVariable UUID id) {
        PackageInstance packageInstance = packageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Package not found"));
        requireOwnerOrAdmin(user, packageInstance);
        return packageModuleRepository.findByPackageInstanceIdOrderBySequenceOrderAsc(id).stream()
                .map(packageModule -> toPackageModuleResponse(packageModule))
                .toList();
    }

    @GetMapping("/{id}/team-recommendations")
    public List<TeamRecommendationResponse> teamRecommendations(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id
    ) {
        PackageInstance packageInstance = packageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Package not found"));
        requireOwnerOrAdmin(user, packageInstance);
        return teamMatchService.recommend(id).stream()
                .map(recommendation -> toTeamRecommendationResponse(recommendation))
                .toList();
    }

    @PostMapping("/from-requirement/{requirementId}")
    public PackageInstanceResponse fromRequirement(@AuthenticationPrincipal User user, @PathVariable UUID requirementId) {
        return toPackageInstanceResponse(packageBuilderService.buildFromRequirement(user, requirementId));
    }

    private void requireOwnerOrAdmin(User user, PackageInstance packageInstance) {
        if (user.getRole() == User.UserRole.ADMIN || packageInstance.getOwner().getId().equals(user.getId())) {
            return;
        }
        throw new AccessDeniedException("Package belongs to another owner");
    }
}
