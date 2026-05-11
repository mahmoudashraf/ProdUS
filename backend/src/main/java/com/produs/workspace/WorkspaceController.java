package com.produs.workspace;

import com.produs.dto.PlatformDtos.DeliverableResponse;
import com.produs.dto.PlatformDtos.MilestoneResponse;
import com.produs.dto.PlatformDtos.ProjectWorkspaceResponse;
import com.produs.dto.PlatformDtos.WorkspaceParticipantResponse;
import com.produs.entity.User;
import com.produs.packages.PackageInstance;
import com.produs.packages.PackageInstanceRepository;
import com.produs.packages.PackageModule;
import com.produs.packages.PackageModuleRepository;
import com.produs.repository.UserRepository;
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

import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.produs.dto.PlatformDtos.toDeliverableResponse;
import static com.produs.dto.PlatformDtos.toMilestoneResponse;
import static com.produs.dto.PlatformDtos.toProjectWorkspaceResponse;
import static com.produs.dto.PlatformDtos.toWorkspaceParticipantResponse;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final ProjectWorkspaceRepository workspaceRepository;
    private final PackageInstanceRepository packageRepository;
    private final PackageModuleRepository packageModuleRepository;
    private final MilestoneRepository milestoneRepository;
    private final DeliverableRepository deliverableRepository;
    private final WorkspaceParticipantRepository participantRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<ProjectWorkspaceResponse> list(@AuthenticationPrincipal User user) {
        Map<UUID, ProjectWorkspace> visibleWorkspaces = new LinkedHashMap<>();
        workspaceRepository.findByOwnerIdOrderByCreatedAtDesc(user.getId())
                .forEach(workspace -> visibleWorkspaces.put(workspace.getId(), workspace));
        participantRepository.findByUserIdAndActiveTrueOrderByCreatedAtDesc(user.getId()).stream()
                .map(WorkspaceParticipant::getWorkspace)
                .forEach(workspace -> visibleWorkspaces.putIfAbsent(workspace.getId(), workspace));
        return visibleWorkspaces.values().stream()
                .sorted(Comparator.comparing(ProjectWorkspace::getCreatedAt).reversed())
                .map(workspace -> toProjectWorkspaceResponse(workspace))
                .toList();
    }

    @GetMapping("/{id}")
    public ProjectWorkspaceResponse get(@AuthenticationPrincipal User user, @PathVariable UUID id) {
        ProjectWorkspace workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceViewer(user, workspace);
        return toProjectWorkspaceResponse(workspace);
    }

    @PostMapping
    public ProjectWorkspaceResponse create(@AuthenticationPrincipal User owner, @Valid @RequestBody WorkspaceRequest request) {
        PackageInstance packageInstance = packageRepository.findById(request.packageInstanceId())
                .orElseThrow(() -> new IllegalArgumentException("Package not found"));
        requireOwnerOrAdmin(owner, packageInstance);

        ProjectWorkspace workspace = new ProjectWorkspace();
        workspace.setOwner(owner);
        workspace.setPackageInstance(packageInstance);
        workspace.setName(request.name() == null ? packageInstance.getName() : request.name());
        if (request.status() != null) {
            workspace.setStatus(request.status());
        }
        ProjectWorkspace savedWorkspace = workspaceRepository.save(workspace);
        ensureOwnerParticipant(savedWorkspace, owner);
        createDefaultMilestones(savedWorkspace, packageInstance);
        return toProjectWorkspaceResponse(savedWorkspace);
    }

    @PutMapping("/{id}")
    public ProjectWorkspaceResponse update(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody WorkspaceUpdateRequest request
    ) {
        ProjectWorkspace workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceCoordinator(user, workspace);
        if (request.name() != null) {
            workspace.setName(request.name());
        }
        if (request.status() != null) {
            workspace.setStatus(request.status());
        }
        return toProjectWorkspaceResponse(workspaceRepository.save(workspace));
    }

    @GetMapping("/{workspaceId}/milestones")
    public List<MilestoneResponse> milestones(@AuthenticationPrincipal User user, @PathVariable UUID workspaceId) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceViewer(user, workspace);
        return milestoneRepository.findByWorkspaceIdOrderByCreatedAtAsc(workspaceId).stream()
                .map(milestone -> toMilestoneResponse(milestone))
                .toList();
    }

    @PostMapping("/{workspaceId}/milestones")
    public MilestoneResponse createMilestone(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @Valid @RequestBody MilestoneRequest request
    ) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceCoordinator(user, workspace);

        Milestone milestone = new Milestone();
        milestone.setWorkspace(workspace);
        milestone.setTitle(request.title());
        milestone.setDescription(request.description());
        milestone.setDueDate(request.dueDate());
        if (request.status() != null) {
            milestone.setStatus(request.status());
        }
        return toMilestoneResponse(milestoneRepository.save(milestone));
    }

    @PutMapping("/milestones/{milestoneId}")
    public MilestoneResponse updateMilestone(
            @AuthenticationPrincipal User user,
            @PathVariable UUID milestoneId,
            @Valid @RequestBody MilestoneRequest request
    ) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found"));
        requireWorkspaceCoordinator(user, milestone.getWorkspace());
        milestone.setTitle(request.title());
        milestone.setDescription(request.description());
        milestone.setDueDate(request.dueDate());
        if (request.status() != null) {
            milestone.setStatus(request.status());
        }
        return toMilestoneResponse(milestoneRepository.save(milestone));
    }

    @GetMapping("/milestones/{milestoneId}/deliverables")
    public List<DeliverableResponse> deliverables(@AuthenticationPrincipal User user, @PathVariable UUID milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found"));
        requireWorkspaceViewer(user, milestone.getWorkspace());
        return deliverableRepository.findByMilestoneIdOrderByCreatedAtAsc(milestoneId).stream()
                .map(deliverable -> toDeliverableResponse(deliverable))
                .toList();
    }

    @PostMapping("/milestones/{milestoneId}/deliverables")
    public DeliverableResponse createDeliverable(
            @AuthenticationPrincipal User user,
            @PathVariable UUID milestoneId,
            @Valid @RequestBody DeliverableRequest request
    ) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found"));
        requireWorkspaceDeliverableContributor(user, milestone.getWorkspace());

        Deliverable deliverable = new Deliverable();
        deliverable.setMilestone(milestone);
        deliverable.setTitle(request.title());
        deliverable.setEvidence(request.evidence());
        if (request.status() != null) {
            deliverable.setStatus(request.status());
        }
        return toDeliverableResponse(deliverableRepository.save(deliverable));
    }

    @PutMapping("/deliverables/{deliverableId}")
    public DeliverableResponse updateDeliverable(
            @AuthenticationPrincipal User user,
            @PathVariable UUID deliverableId,
            @Valid @RequestBody DeliverableRequest request
    ) {
        Deliverable deliverable = deliverableRepository.findById(deliverableId)
                .orElseThrow(() -> new IllegalArgumentException("Deliverable not found"));
        requireWorkspaceDeliverableContributor(user, deliverable.getMilestone().getWorkspace());
        deliverable.setTitle(request.title());
        deliverable.setEvidence(request.evidence());
        if (request.status() != null) {
            deliverable.setStatus(request.status());
        }
        return toDeliverableResponse(deliverableRepository.save(deliverable));
    }

    @GetMapping("/{workspaceId}/participants")
    public List<WorkspaceParticipantResponse> participants(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId
    ) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceViewer(user, workspace);
        return participantRepository.findByWorkspaceIdOrderByCreatedAtAsc(workspaceId).stream()
                .map(participant -> toWorkspaceParticipantResponse(participant))
                .toList();
    }

    @PostMapping("/{workspaceId}/participants")
    public WorkspaceParticipantResponse addParticipant(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @Valid @RequestBody WorkspaceParticipantRequest request
    ) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceCoordinator(user, workspace);
        User participantUser = resolveUser(request.userId(), request.email());

        WorkspaceParticipant participant = participantRepository.findByWorkspaceIdAndUserId(workspaceId, participantUser.getId())
                .orElseGet(WorkspaceParticipant::new);
        participant.setWorkspace(workspace);
        participant.setUser(participantUser);
        participant.setAddedBy(user);
        participant.setRole(request.role() == null ? WorkspaceParticipant.ParticipantRole.VIEWER : request.role());
        participant.setActive(request.active() == null || request.active());
        return toWorkspaceParticipantResponse(participantRepository.save(participant));
    }

    @PutMapping("/participants/{participantId}")
    public WorkspaceParticipantResponse updateParticipant(
            @AuthenticationPrincipal User user,
            @PathVariable UUID participantId,
            @Valid @RequestBody WorkspaceParticipantUpdateRequest request
    ) {
        WorkspaceParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace participant not found"));
        requireWorkspaceCoordinator(user, participant.getWorkspace());
        if (request.role() != null) {
            participant.setRole(request.role());
        }
        if (request.active() != null) {
            participant.setActive(request.active());
        }
        return toWorkspaceParticipantResponse(participantRepository.save(participant));
    }

    private void createDefaultMilestones(ProjectWorkspace workspace, PackageInstance packageInstance) {
        List<PackageModule> modules = packageModuleRepository.findByPackageInstanceIdOrderBySequenceOrderAsc(packageInstance.getId());
        if (modules.isEmpty()) {
            return;
        }

        LocalDate startDate = LocalDate.now();
        int offset = 7;
        for (PackageModule module : modules) {
            Milestone milestone = new Milestone();
            milestone.setWorkspace(workspace);
            milestone.setTitle(module.getServiceModule().getName());
            milestone.setDescription(module.getDeliverables());
            milestone.setDueDate(startDate.plusDays(offset));
            milestoneRepository.save(milestone);
            offset += 7;
        }
    }

    private void requireOwnerOrAdmin(User user, PackageInstance packageInstance) {
        if (user.getRole() == User.UserRole.ADMIN || packageInstance.getOwner().getId().equals(user.getId())) {
            return;
        }
        throw new AccessDeniedException("Package belongs to another owner");
    }

    private void requireWorkspaceViewer(User user, ProjectWorkspace workspace) {
        if (user.getRole() == User.UserRole.ADMIN || workspace.getOwner().getId().equals(user.getId())) {
            return;
        }
        if (participantRepository.existsByWorkspaceIdAndUserIdAndActiveTrue(workspace.getId(), user.getId())) {
            return;
        }
        throw new AccessDeniedException("Workspace is not available to this user");
    }

    private void requireWorkspaceCoordinator(User user, ProjectWorkspace workspace) {
        if (user.getRole() == User.UserRole.ADMIN || workspace.getOwner().getId().equals(user.getId())) {
            return;
        }
        WorkspaceParticipant participant = participantRepository.findByWorkspaceIdAndUserIdAndActiveTrue(workspace.getId(), user.getId())
                .orElseThrow(() -> new AccessDeniedException("Workspace cannot be changed by this user"));
        if (participant.getRole() == WorkspaceParticipant.ParticipantRole.OWNER
                || participant.getRole() == WorkspaceParticipant.ParticipantRole.COORDINATOR
                || participant.getRole() == WorkspaceParticipant.ParticipantRole.TEAM_LEAD) {
            return;
        }
        throw new AccessDeniedException("Workspace cannot be changed by this user");
    }

    private void requireWorkspaceDeliverableContributor(User user, ProjectWorkspace workspace) {
        if (user.getRole() == User.UserRole.ADMIN || workspace.getOwner().getId().equals(user.getId())) {
            return;
        }
        WorkspaceParticipant participant = participantRepository.findByWorkspaceIdAndUserIdAndActiveTrue(workspace.getId(), user.getId())
                .orElseThrow(() -> new AccessDeniedException("Workspace deliverables cannot be changed by this user"));
        if (participant.getRole() == WorkspaceParticipant.ParticipantRole.OWNER
                || participant.getRole() == WorkspaceParticipant.ParticipantRole.COORDINATOR
                || participant.getRole() == WorkspaceParticipant.ParticipantRole.TEAM_LEAD
                || participant.getRole() == WorkspaceParticipant.ParticipantRole.SPECIALIST) {
            return;
        }
        throw new AccessDeniedException("Workspace deliverables cannot be changed by this user");
    }

    private void ensureOwnerParticipant(ProjectWorkspace workspace, User owner) {
        WorkspaceParticipant participant = participantRepository.findByWorkspaceIdAndUserId(workspace.getId(), owner.getId())
                .orElseGet(WorkspaceParticipant::new);
        participant.setWorkspace(workspace);
        participant.setUser(owner);
        participant.setAddedBy(owner);
        participant.setRole(WorkspaceParticipant.ParticipantRole.OWNER);
        participant.setActive(true);
        participantRepository.save(participant);
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

    public record WorkspaceRequest(
            @NotNull(message = "Package is required")
            UUID packageInstanceId,
            String name,
            ProjectWorkspace.WorkspaceStatus status
    ) {}
    public record WorkspaceUpdateRequest(String name, ProjectWorkspace.WorkspaceStatus status) {}
    public record MilestoneRequest(
            @NotBlank(message = "Milestone title is required")
            String title,
            String description,
            LocalDate dueDate,
            Milestone.MilestoneStatus status
    ) {}
    public record DeliverableRequest(
            @NotBlank(message = "Deliverable title is required")
            String title,
            String evidence,
            Deliverable.DeliverableStatus status
    ) {}
    public record WorkspaceParticipantRequest(
            UUID userId,
            String email,
            WorkspaceParticipant.ParticipantRole role,
            Boolean active
    ) {}
    public record WorkspaceParticipantUpdateRequest(
            WorkspaceParticipant.ParticipantRole role,
            Boolean active
    ) {}
}
