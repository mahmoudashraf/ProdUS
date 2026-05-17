package com.produs.teams;

import com.produs.catalog.ServiceCategory;
import com.produs.catalog.ServiceCategoryRepository;
import com.produs.catalog.ServiceModule;
import com.produs.catalog.ServiceModuleRepository;
import com.produs.dto.PlatformDtos.TeamCapabilityResponse;
import com.produs.dto.PlatformDtos.TeamInvitationResponse;
import com.produs.dto.PlatformDtos.TeamJoinRequestResponse;
import com.produs.dto.PlatformDtos.TeamMemberResponse;
import com.produs.dto.PlatformDtos.TeamResponse;
import com.produs.entity.User;
import com.produs.notifications.NotificationService;
import com.produs.notifications.PlatformNotification;
import com.produs.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
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

import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;

import static com.produs.dto.PlatformDtos.toTeamCapabilityResponse;
import static com.produs.dto.PlatformDtos.toTeamInvitationResponse;
import static com.produs.dto.PlatformDtos.toTeamJoinRequestResponse;
import static com.produs.dto.PlatformDtos.toTeamMemberResponse;
import static com.produs.dto.PlatformDtos.toTeamResponse;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamRepository teamRepository;
    private final TeamCapabilityRepository capabilityRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamInvitationRepository teamInvitationRepository;
    private final TeamJoinRequestRepository teamJoinRequestRepository;
    private final ServiceCategoryRepository categoryRepository;
    private final ServiceModuleRepository moduleRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @GetMapping
    public List<TeamResponse> list() {
        return teamRepository.findByActiveTrueOrderByCreatedAtDesc().stream()
                .map(team -> toTeamResponse(team))
                .toList();
    }

    @GetMapping("/mine")
    @PreAuthorize("isAuthenticated()")
    public List<TeamResponse> mine(@AuthenticationPrincipal User user) {
        LinkedHashMap<UUID, Team> teams = new LinkedHashMap<>();
        teamRepository.findByManagerIdOrderByCreatedAtDesc(user.getId())
                .forEach(team -> teams.put(team.getId(), team));
        teamMemberRepository.findByUserIdAndActiveTrueOrderByCreatedAtDesc(user.getId()).stream()
                .map(TeamMember::getTeam)
                .filter(Team::isActive)
                .forEach(team -> teams.putIfAbsent(team.getId(), team));
        return teams.values().stream()
                .map(team -> toTeamResponse(team))
                .toList();
    }

    @GetMapping("/{id}")
    public TeamResponse get(@PathVariable UUID id) {
        return toTeamResponse(teamRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new IllegalArgumentException("Team not found")));
    }

    @GetMapping("/{id}/capabilities")
    public List<TeamCapabilityResponse> capabilities(@PathVariable UUID id) {
        teamRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
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
    @PreAuthorize("hasAnyRole('TEAM_MANAGER','SPECIALIST','ADMIN')")
    public TeamResponse create(@AuthenticationPrincipal User manager, @Valid @RequestBody TeamRequest request) {
        Team team = new Team();
        team.setManager(manager);
        apply(team, request);
        team = teamRepository.save(team);
        ensureMember(team, manager, TeamMember.MemberRole.LEAD);
        return toTeamResponse(team);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEAM_MANAGER','SPECIALIST','ADMIN')")
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

    @GetMapping("/{id}/invitations")
    @PreAuthorize("hasAnyRole('TEAM_MANAGER','SPECIALIST','ADMIN')")
    public List<TeamInvitationResponse> invitations(@AuthenticationPrincipal User manager, @PathVariable UUID id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        requireManagerOrAdmin(manager, team);
        return teamInvitationRepository.findByTeamIdOrderByCreatedAtDesc(id).stream()
                .map(invitation -> toTeamInvitationResponse(invitation))
                .toList();
    }

    @GetMapping("/invitations/mine")
    @PreAuthorize("isAuthenticated()")
    public List<TeamInvitationResponse> myInvitations(@AuthenticationPrincipal User user) {
        return teamInvitationRepository.findByEmailOrderByCreatedAtDesc(user.getEmail().trim().toLowerCase()).stream()
                .map(invitation -> toTeamInvitationResponse(invitation))
                .toList();
    }

    @PostMapping("/{id}/invitations")
    @PreAuthorize("hasAnyRole('TEAM_MANAGER','SPECIALIST','ADMIN')")
    public TeamInvitationResponse invite(
            @AuthenticationPrincipal User manager,
            @PathVariable UUID id,
            @Valid @RequestBody TeamInvitationRequest request
    ) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        requireManagerOrAdmin(manager, team);
        String email = request.email().trim().toLowerCase();

        TeamInvitation invitation = teamInvitationRepository.findByTeamIdAndEmail(id, email)
                .orElseGet(TeamInvitation::new);
        invitation.setTeam(team);
        invitation.setInvitedBy(manager);
        invitation.setEmail(email);
        invitation.setRole(request.role() == null ? TeamMember.MemberRole.SPECIALIST : request.role());
        invitation.setMessage(request.message());
        invitation.setStatus(TeamInvitation.InvitationStatus.PENDING);

        userRepository.findByEmail(email).ifPresent(user -> {
            ensureMember(team, user, invitation.getRole());
            invitation.setStatus(TeamInvitation.InvitationStatus.ACCEPTED);
            notificationService.notify(
                    user,
                    manager,
                    PlatformNotification.NotificationType.NETWORK_TEAM_INVITATION,
                    PlatformNotification.NotificationPriority.NORMAL,
                    "You were added to " + team.getName(),
                    request.message(),
                    "/expert-network/team-profile",
                    "TEAM_INVITATION",
                    team.getId(),
                    null
            );
        });

        return toTeamInvitationResponse(teamInvitationRepository.save(invitation));
    }

    @PutMapping("/invitations/{invitationId}")
    @PreAuthorize("isAuthenticated()")
    public TeamInvitationResponse reviewInvitation(
            @AuthenticationPrincipal User user,
            @PathVariable UUID invitationId,
            @Valid @RequestBody TeamInvitationReviewRequest request
    ) {
        TeamInvitation invitation = teamInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found"));

        if (request.status() == TeamInvitation.InvitationStatus.CANCELLED) {
            requireManagerOrAdmin(user, invitation.getTeam());
            invitation.setStatus(TeamInvitation.InvitationStatus.CANCELLED);
            return toTeamInvitationResponse(teamInvitationRepository.save(invitation));
        }
        if (request.status() == TeamInvitation.InvitationStatus.ACCEPTED) {
            requireInvitationRecipient(user, invitation);
            ensureMember(invitation.getTeam(), user, invitation.getRole());
            invitation.setStatus(TeamInvitation.InvitationStatus.ACCEPTED);
            return toTeamInvitationResponse(teamInvitationRepository.save(invitation));
        }
        if (request.status() == TeamInvitation.InvitationStatus.DECLINED) {
            requireInvitationRecipient(user, invitation);
            invitation.setStatus(TeamInvitation.InvitationStatus.DECLINED);
            return toTeamInvitationResponse(teamInvitationRepository.save(invitation));
        }
        throw new IllegalArgumentException("Unsupported invitation status");
    }

    @GetMapping("/{id}/join-requests")
    @PreAuthorize("hasAnyRole('TEAM_MANAGER','SPECIALIST','ADMIN')")
    public List<TeamJoinRequestResponse> joinRequests(@AuthenticationPrincipal User manager, @PathVariable UUID id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        requireManagerOrAdmin(manager, team);
        return teamJoinRequestRepository.findByTeamIdOrderByCreatedAtDesc(id).stream()
                .map(request -> toTeamJoinRequestResponse(request))
                .toList();
    }

    @GetMapping("/join-requests/mine")
    @PreAuthorize("isAuthenticated()")
    public List<TeamJoinRequestResponse> myJoinRequests(@AuthenticationPrincipal User user) {
        return teamJoinRequestRepository.findByRequesterIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(request -> toTeamJoinRequestResponse(request))
                .toList();
    }

    @PostMapping("/{id}/join-requests")
    @PreAuthorize("hasAnyRole('SPECIALIST','TEAM_MANAGER','ADVISOR','ADMIN')")
    public TeamJoinRequestResponse requestToJoin(
            @AuthenticationPrincipal User requester,
            @PathVariable UUID id,
            @Valid @RequestBody TeamJoinRequestCreateRequest request
    ) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        if (teamMemberRepository.existsByTeamIdAndUserIdAndActiveTrue(team.getId(), requester.getId())) {
            throw new IllegalArgumentException("User is already an active team member");
        }
        TeamJoinRequest joinRequest = teamJoinRequestRepository.findByTeamIdAndRequesterId(id, requester.getId())
                .orElseGet(TeamJoinRequest::new);
        joinRequest.setTeam(team);
        joinRequest.setRequester(requester);
        joinRequest.setMessage(request.message());
        joinRequest.setStatus(TeamJoinRequest.RequestStatus.PENDING);
        joinRequest.setReviewedBy(null);
        joinRequest.setReviewNote(null);
        TeamJoinRequest saved = teamJoinRequestRepository.save(joinRequest);
        notificationService.notify(
                team.getManager(),
                requester,
                PlatformNotification.NotificationType.NETWORK_JOIN_REQUEST,
                PlatformNotification.NotificationPriority.HIGH,
                "New join request for " + team.getName(),
                request.message(),
                "/expert-network/join-requests",
                "TEAM_JOIN_REQUEST",
                saved.getId(),
                null
        );
        return toTeamJoinRequestResponse(saved);
    }

    @PutMapping("/join-requests/{requestId}")
    @PreAuthorize("hasAnyRole('TEAM_MANAGER','SPECIALIST','ADMIN')")
    public TeamJoinRequestResponse reviewJoinRequest(
            @AuthenticationPrincipal User manager,
            @PathVariable UUID requestId,
            @Valid @RequestBody TeamJoinRequestReviewRequest request
    ) {
        TeamJoinRequest joinRequest = teamJoinRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Join request not found"));
        requireManagerOrAdmin(manager, joinRequest.getTeam());
        joinRequest.setStatus(request.status());
        joinRequest.setReviewedBy(manager);
        joinRequest.setReviewNote(request.reviewNote());
        if (request.status() == TeamJoinRequest.RequestStatus.APPROVED) {
            ensureMember(joinRequest.getTeam(), joinRequest.getRequester(), TeamMember.MemberRole.SPECIALIST);
        }
        TeamJoinRequest saved = teamJoinRequestRepository.save(joinRequest);
        notificationService.notify(
                saved.getRequester(),
                manager,
                PlatformNotification.NotificationType.NETWORK_JOIN_REQUEST,
                request.status() == TeamJoinRequest.RequestStatus.APPROVED
                        ? PlatformNotification.NotificationPriority.HIGH
                        : PlatformNotification.NotificationPriority.NORMAL,
                "Join request " + request.status().name().toLowerCase().replace('_', ' '),
                request.reviewNote(),
                "/expert-network/join-requests",
                "TEAM_JOIN_REQUEST",
                saved.getId(),
                null
        );
        return toTeamJoinRequestResponse(saved);
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
        team.setHeadline(request.headline());
        team.setBio(request.bio());
        team.setProfilePhotoUrl(request.profilePhotoUrl());
        team.setCoverPhotoUrl(request.coverPhotoUrl());
        team.setWebsiteUrl(request.websiteUrl());
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

    private void requireInvitationRecipient(User user, TeamInvitation invitation) {
        if (invitation.getEmail().equalsIgnoreCase(user.getEmail())) {
            return;
        }
        throw new AccessDeniedException("Invitation belongs to another user");
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

    private void ensureMember(Team team, User user, TeamMember.MemberRole role) {
        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(team.getId(), user.getId())
                .orElseGet(TeamMember::new);
        member.setTeam(team);
        member.setUser(user);
        member.setRole(role);
        member.setActive(true);
        teamMemberRepository.save(member);
    }

    public record TeamRequest(
            @NotBlank(message = "Team name is required")
            String name,
            String description,
            String headline,
            String bio,
            String profilePhotoUrl,
            String coverPhotoUrl,
            String websiteUrl,
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
    public record TeamInvitationRequest(
            @NotBlank(message = "Invite email is required")
            @Email(message = "Use a valid email address")
            String email,
            TeamMember.MemberRole role,
            String message
    ) {}
    public record TeamInvitationReviewRequest(
            @NotNull(message = "Invitation status is required")
            TeamInvitation.InvitationStatus status
    ) {}
    public record TeamJoinRequestCreateRequest(String message) {}
    public record TeamJoinRequestReviewRequest(
            @NotNull(message = "Review status is required")
            TeamJoinRequest.RequestStatus status,
            String reviewNote
    ) {}
}
