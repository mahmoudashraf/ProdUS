package com.produs.teams;

import com.produs.catalog.ServiceCategory;
import com.produs.catalog.ServiceCategoryRepository;
import com.produs.catalog.ServiceModule;
import com.produs.catalog.ServiceModuleRepository;
import com.produs.dto.PlatformDtos.TeamCapabilityResponse;
import com.produs.dto.PlatformDtos.TeamMemberResponse;
import com.produs.dto.PlatformDtos.TeamResponse;
import com.produs.entity.User;
import com.produs.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
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

import static com.produs.dto.PlatformDtos.toTeamCapabilityResponse;
import static com.produs.dto.PlatformDtos.toTeamMemberResponse;
import static com.produs.dto.PlatformDtos.toTeamResponse;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamRepository teamRepository;
    private final TeamCapabilityRepository capabilityRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ServiceCategoryRepository categoryRepository;
    private final ServiceModuleRepository moduleRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<TeamResponse> list() {
        return teamRepository.findByActiveTrueOrderByCreatedAtDesc().stream()
                .map(team -> toTeamResponse(team))
                .toList();
    }

    @GetMapping("/mine")
    public List<TeamResponse> mine(@AuthenticationPrincipal User user) {
        return teamRepository.findByManagerIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(team -> toTeamResponse(team))
                .toList();
    }

    @GetMapping("/{id}")
    public TeamResponse get(@PathVariable UUID id) {
        return toTeamResponse(teamRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Team not found")));
    }

    @GetMapping("/{id}/capabilities")
    public List<TeamCapabilityResponse> capabilities(@PathVariable UUID id) {
        return capabilityRepository.findByTeamId(id).stream()
                .map(capability -> toTeamCapabilityResponse(capability))
                .toList();
    }

    @GetMapping("/{id}/members")
    public List<TeamMemberResponse> members(@AuthenticationPrincipal User user, @PathVariable UUID id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        requireManagerAdminOrMember(user, team);
        return teamMemberRepository.findByTeamIdOrderByCreatedAtAsc(id).stream()
                .map(member -> toTeamMemberResponse(member))
                .toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEAM_MANAGER','ADMIN')")
    public TeamResponse create(@AuthenticationPrincipal User manager, @Valid @RequestBody TeamRequest request) {
        Team team = new Team();
        team.setManager(manager);
        apply(team, request);
        return toTeamResponse(teamRepository.save(team));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEAM_MANAGER','ADMIN')")
    public TeamResponse update(@AuthenticationPrincipal User manager, @PathVariable UUID id, @Valid @RequestBody TeamRequest request) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        requireManagerOrAdmin(manager, team);
        apply(team, request);
        return toTeamResponse(teamRepository.save(team));
    }

    @PostMapping("/{id}/capabilities")
    @PreAuthorize("hasAnyRole('TEAM_MANAGER','ADMIN')")
    public TeamCapabilityResponse createCapability(
            @AuthenticationPrincipal User manager,
            @PathVariable UUID id,
            @Valid @RequestBody TeamCapabilityRequest request
    ) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        requireManagerOrAdmin(manager, team);

        ServiceCategory category = categoryRepository.findById(request.serviceCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Service category not found"));
        ServiceModule module = request.serviceModuleId() == null
                ? null
                : moduleRepository.findById(request.serviceModuleId())
                        .orElseThrow(() -> new IllegalArgumentException("Service module not found"));
        if (module != null && !module.getCategory().getId().equals(category.getId())) {
            throw new IllegalArgumentException("Service module does not belong to the selected category");
        }

        TeamCapability capability = new TeamCapability();
        capability.setTeam(team);
        capability.setServiceCategory(category);
        capability.setServiceModule(module);
        capability.setEvidenceUrl(request.evidenceUrl());
        capability.setNotes(request.notes());
        return toTeamCapabilityResponse(capabilityRepository.save(capability));
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("hasAnyRole('TEAM_MANAGER','ADMIN')")
    public TeamMemberResponse addMember(
            @AuthenticationPrincipal User manager,
            @PathVariable UUID id,
            @Valid @RequestBody TeamMemberRequest request
    ) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        requireManagerOrAdmin(manager, team);
        User memberUser = resolveUser(request.userId(), request.email());

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(id, memberUser.getId())
                .orElseGet(TeamMember::new);
        member.setTeam(team);
        member.setUser(memberUser);
        member.setRole(request.role() == null ? TeamMember.MemberRole.SPECIALIST : request.role());
        member.setActive(request.active() == null || request.active());
        return toTeamMemberResponse(teamMemberRepository.save(member));
    }

    @PutMapping("/members/{memberId}")
    @PreAuthorize("hasAnyRole('TEAM_MANAGER','ADMIN')")
    public TeamMemberResponse updateMember(
            @AuthenticationPrincipal User manager,
            @PathVariable UUID memberId,
            @Valid @RequestBody TeamMemberUpdateRequest request
    ) {
        TeamMember member = teamMemberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Team member not found"));
        requireManagerOrAdmin(manager, member.getTeam());
        if (request.role() != null) {
            member.setRole(request.role());
        }
        if (request.active() != null) {
            member.setActive(request.active());
        }
        return toTeamMemberResponse(teamMemberRepository.save(member));
    }

    private void apply(Team team, TeamRequest request) {
        team.setName(request.name());
        team.setDescription(request.description());
        team.setTimezone(request.timezone());
        team.setCapabilitiesSummary(request.capabilitiesSummary());
        team.setTypicalProjectSize(request.typicalProjectSize());
        if (request.verificationStatus() != null) {
            team.setVerificationStatus(request.verificationStatus());
        }
        team.setActive(request.active() == null || request.active());
    }

    private void requireManagerOrAdmin(User manager, Team team) {
        if (manager.getRole() == User.UserRole.ADMIN || team.getManager().getId().equals(manager.getId())) {
            return;
        }
        throw new AccessDeniedException("Team belongs to another manager");
    }

    private void requireManagerAdminOrMember(User user, Team team) {
        if (user.getRole() == User.UserRole.ADMIN
                || team.getManager().getId().equals(user.getId())
                || teamMemberRepository.existsByTeamIdAndUserIdAndActiveTrue(team.getId(), user.getId())) {
            return;
        }
        throw new AccessDeniedException("Team membership is private");
    }

    private User resolveUser(UUID userId, String email) {
        if (userId != null) {
            return userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
        }
        if (email != null && !email.isBlank()) {
            return userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
        }
        throw new IllegalArgumentException("User id or email is required");
    }

    public record TeamRequest(
            @NotBlank(message = "Team name is required")
            String name,
            String description,
            String timezone,
            String capabilitiesSummary,
            String typicalProjectSize,
            Team.VerificationStatus verificationStatus,
            Boolean active
    ) {}
    public record TeamCapabilityRequest(
            @NotNull(message = "Service category is required")
            UUID serviceCategoryId,
            UUID serviceModuleId,
            String evidenceUrl,
            String notes
    ) {}
    public record TeamMemberRequest(
            UUID userId,
            String email,
            TeamMember.MemberRole role,
            Boolean active
    ) {}
    public record TeamMemberUpdateRequest(TeamMember.MemberRole role, Boolean active) {}
}
