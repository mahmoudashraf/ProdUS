package com.produs.experts;

import com.produs.dto.PlatformDtos.ExpertProfileResponse;
import com.produs.entity.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

import static com.produs.dto.PlatformDtos.toExpertProfileResponse;

@RestController
@RequestMapping("/api/expert-profiles")
@RequiredArgsConstructor
public class ExpertProfileController {

    private final ExpertProfileRepository expertProfileRepository;

    @GetMapping
    public List<ExpertProfileResponse> list() {
        return expertProfileRepository.findByActiveTrueOrderByUpdatedAtDesc().stream()
                .map(profile -> toExpertProfileResponse(profile))
                .toList();
    }

    @GetMapping("/{id}")
    public ExpertProfileResponse get(@PathVariable UUID id) {
        return toExpertProfileResponse(expertProfileRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new IllegalArgumentException("Expert profile not found")));
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('SPECIALIST','TEAM_MANAGER','ADVISOR','ADMIN')")
    public ExpertProfileResponse me(@AuthenticationPrincipal User user) {
        return toExpertProfileResponse(findOrCreate(user));
    }

    @PutMapping("/me")
    @PreAuthorize("hasAnyRole('SPECIALIST','TEAM_MANAGER','ADVISOR','ADMIN')")
    public ExpertProfileResponse update(@AuthenticationPrincipal User user, @Valid @RequestBody ExpertProfileRequest request) {
        ExpertProfile profile = findOrCreate(user);
        profile.setDisplayName(request.displayName());
        profile.setHeadline(request.headline());
        profile.setBio(request.bio());
        profile.setProfilePhotoUrl(request.profilePhotoUrl());
        profile.setCoverPhotoUrl(request.coverPhotoUrl());
        profile.setLocation(request.location());
        profile.setTimezone(request.timezone());
        profile.setWebsiteUrl(request.websiteUrl());
        profile.setPortfolioUrl(request.portfolioUrl());
        profile.setSkills(request.skills());
        profile.setPreferredProjectSize(request.preferredProjectSize());
        profile.setAvailability(request.availability() == null ? ExpertProfile.Availability.AVAILABLE : request.availability());
        profile.setSoloMode(request.soloMode() == null || request.soloMode());
        profile.setActive(request.active() == null || request.active());
        return toExpertProfileResponse(expertProfileRepository.save(profile));
    }

    private ExpertProfile findOrCreate(User user) {
        return expertProfileRepository.findByUserId(user.getId()).orElseGet(() -> {
            ExpertProfile profile = new ExpertProfile();
            profile.setUser(user);
            profile.setDisplayName(defaultDisplayName(user));
            profile.setHeadline(user.getRole() == User.UserRole.TEAM_MANAGER ? "Team leader" : "Independent productization expert");
            profile.setBio("Add a short expert bio, proof, preferred work, and availability.");
            profile.setSoloMode(user.getRole() == User.UserRole.SPECIALIST || user.getRole() == User.UserRole.ADVISOR);
            return expertProfileRepository.save(profile);
        });
    }

    private String defaultDisplayName(User user) {
        String fullName = ((user.getFirstName() == null ? "" : user.getFirstName()) + " " + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return fullName.isBlank() ? user.getEmail() : fullName;
    }

    public record ExpertProfileRequest(
            @NotBlank(message = "Display name is required")
            String displayName,
            String headline,
            String bio,
            String profilePhotoUrl,
            String coverPhotoUrl,
            String location,
            String timezone,
            String websiteUrl,
            String portfolioUrl,
            String skills,
            String preferredProjectSize,
            ExpertProfile.Availability availability,
            Boolean soloMode,
            Boolean active
    ) {}
}
