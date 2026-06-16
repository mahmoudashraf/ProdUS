package com.produs.workspace;

import com.produs.catalog.ServiceModule;
import com.produs.catalog.ServiceModuleRepository;
import com.produs.dto.PlatformDtos.DeliverableResponse;
import com.produs.dto.PlatformDtos.MilestoneResponse;
import com.produs.dto.PlatformDtos.PackageModuleResponse;
import com.produs.dto.PlatformDtos.ProjectWorkspaceResponse;
import com.produs.dto.PlatformDtos.WorkspaceParticipantResponse;
import com.produs.entity.User;
import com.produs.packages.PackageInstance;
import com.produs.packages.PackageInstanceRepository;
import com.produs.packages.PackageModule;
import com.produs.packages.PackageModuleRepository;
import com.produs.product.ProductProfile;
import com.produs.product.ProductProfileRepository;
import com.produs.repository.UserRepository;
import com.produs.scanner.ScannerService;
import com.produs.scanner.ScannerService.CheckFixesRequest;
import com.produs.scanner.ScannerService.CheckFixesResponse;
import com.produs.scanner.ScannerService.ScannerRiskThreadResponse;
import com.produs.scanner.ScannerService.WorkspaceCheckProgressResponse;
import com.produs.scanner.ScannerService.ScannerRiskSummaryResponse;
import com.produs.scanner.ScannerRiskLifecycleService;
import com.produs.scanner.ScannerRiskThread;
import com.produs.scanner.ScannerRiskThreadRepository;
import com.produs.workspace.WorkspaceServiceFinding.WorkspaceServiceFindingStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.produs.dto.PlatformDtos.toDeliverableResponse;
import static com.produs.dto.PlatformDtos.toMilestoneResponse;
import static com.produs.dto.PlatformDtos.toPackageModuleResponse;
import static com.produs.dto.PlatformDtos.toProjectWorkspaceResponse;
import static com.produs.dto.PlatformDtos.toWorkspaceParticipantResponse;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final ProjectWorkspaceRepository workspaceRepository;
    private final PackageInstanceRepository packageRepository;
    private final ProductProfileRepository productProfileRepository;
    private final PackageModuleRepository packageModuleRepository;
    private final ServiceModuleRepository serviceModuleRepository;
    private final MilestoneRepository milestoneRepository;
    private final DeliverableRepository deliverableRepository;
    private final WorkspaceParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final ScannerService scannerService;
    private final ScannerRiskLifecycleService riskLifecycleService;
    private final ScannerRiskThreadRepository riskThreadRepository;
    private final WorkspaceServiceFindingRepository workspaceServiceFindingRepository;

    @GetMapping
    public List<ProjectWorkspaceResponse> list(@AuthenticationPrincipal User user) {
        if (user.getRole() == User.UserRole.ADMIN) {
            return workspaceRepository.findAll().stream()
                    .sorted(Comparator.comparing(ProjectWorkspace::getCreatedAt).reversed())
                    .map(workspace -> toProjectWorkspaceResponse(workspace))
                    .toList();
        }
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
        PackageInstance packageInstance = resolveWorkspacePackage(owner, request);

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

    @GetMapping("/{workspaceId}/services")
    public List<PackageModuleResponse> services(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId
    ) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceViewer(user, workspace);
        return packageModuleRepository.findByPackageInstanceIdOrderBySequenceOrderAsc(workspace.getPackageInstance().getId()).stream()
                .map(module -> toPackageModuleResponse(module))
                .toList();
    }

    @GetMapping("/{workspaceId}/services/finding-impact")
    @Transactional
    public List<WorkspaceServiceFindingImpactResponse> serviceFindingImpact(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId
    ) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceViewer(user, workspace);
        return serviceFindingImpact(workspace);
    }

    @PostMapping("/{workspaceId}/services")
    @Transactional
    public WorkspaceServiceAddResponse addService(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @Valid @RequestBody WorkspaceServiceRequest request
    ) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceCoordinator(user, workspace);
        ServiceModule serviceModule = serviceModuleRepository.findById(request.serviceModuleId())
                .orElseThrow(() -> new IllegalArgumentException("Service module not found"));
        UUID packageInstanceId = workspace.getPackageInstance().getId();
        PackageModule module = packageModuleRepository
                .findByPackageInstanceIdAndServiceModuleId(packageInstanceId, serviceModule.getId())
                .orElse(null);
        boolean created = module == null;
        if (created) {
            module = new PackageModule();
            module.setPackageInstance(workspace.getPackageInstance());
            module.setServiceModule(serviceModule);
            module.setSequenceOrder(nextServiceSequence(packageInstanceId));
            module.setStatus(PackageModule.ModuleStatus.PLANNED);
            module.setDeliverables(serviceModule.getExpectedDeliverables());
            module.setAcceptanceCriteria(serviceModule.getAcceptanceCriteria());
        }

        if (created || request.required() != null) {
            module.setRequired(request.required() == null || request.required());
        }
        if (created || hasText(request.rationale())) {
            module.setRationale(hasText(request.rationale()) ? request.rationale().trim() : "Added from workspace services.");
        }

        PackageModule savedModule = packageModuleRepository.save(module);
        if (created && !Boolean.FALSE.equals(request.createMilestone())) {
            createMilestoneForModule(workspace, savedModule);
        }
        WorkspaceServiceFindingBucket findingBucket = serviceFindingBucket(workspace, serviceModule);
        List<ScannerRiskThread> addedFindings = new ArrayList<>();
        if (!Boolean.FALSE.equals(request.addMatchingFindings())) {
            List<ScannerRiskThread> candidateFindings = new ArrayList<>(findingBucket.findingsWillBeAdded());
            if (Boolean.TRUE.equals(request.includeExcluded())) {
                candidateFindings.addAll(findingBucket.findingsExcludedFromWorkspace());
            }
            candidateFindings.addAll(explicitUnmappedServiceChoices(
                    workspace,
                    candidateFindings,
                    request.selectedRiskThreadIds()
            ));
            List<ScannerRiskThread> findingsToAdd = selectServiceFindings(
                    candidateFindings,
                    request.selectedRiskThreadIds()
            );
            findingsToAdd.forEach(risk -> addedFindings.add(includeFindingInWorkspaceService(
                    user,
                    workspace,
                    serviceModule,
                    risk,
                    Boolean.TRUE.equals(request.includeExcluded()),
                    "Included when " + serviceModule.getName() + " was added to this workspace.",
                    true
            )));
        }
        List<ScannerRiskThread> coveredFindings = new ArrayList<>(findingBucket.findingsAlreadyInWorkspace());
        coveredFindings.addAll(addedFindings);
        String ownerNotice = addedFindings.isEmpty()
                ? serviceModule.getName() + " was added. No matching unassigned scanner findings needed to move."
                : serviceModule.getName() + " was added and " + addedFindings.size()
                + " matching scanner finding" + (addedFindings.size() == 1 ? "" : "s")
                + " moved into this workspace.";
        return new WorkspaceServiceAddResponse(
                toPackageModuleResponse(savedModule),
                addedFindings.stream().map(this::toFindingBrief).toList(),
                coveredFindings.stream()
                        .collect(Collectors.toMap(ScannerRiskThread::getId, risk -> risk, (first, ignored) -> first, LinkedHashMap::new))
                        .values()
                        .stream()
                        .map(this::toFindingBrief)
                        .toList(),
                addedFindings.size(),
                coveredFindings.stream().map(ScannerRiskThread::getId).collect(Collectors.toSet()).size(),
                ownerNotice
        );
    }

    @DeleteMapping("/{workspaceId}/services/{moduleId}")
    @Transactional
    public List<PackageModuleResponse> removeService(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @PathVariable UUID moduleId
    ) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceCoordinator(user, workspace);
        PackageModule module = packageModuleRepository.findById(moduleId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace service not found"));
        if (!module.getPackageInstance().getId().equals(workspace.getPackageInstance().getId())) {
            throw new AccessDeniedException("Service is not attached to this workspace");
        }
        excludeIncludedFindingsForService(user, workspace, module.getServiceModule(), "Service removed from this workspace.");
        packageModuleRepository.delete(module);
        return packageModuleRepository.findByPackageInstanceIdOrderBySequenceOrderAsc(workspace.getPackageInstance().getId()).stream()
                .map(packageModule -> toPackageModuleResponse(packageModule))
                .toList();
    }

    @PutMapping("/{workspaceId}/services/{moduleId}/owner")
    @Transactional
    public PackageModuleResponse assignServiceOwner(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @PathVariable UUID moduleId,
            @Valid @RequestBody WorkspaceOwnerAssignmentRequest request
    ) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceCoordinator(user, workspace);
        PackageModule module = packageModuleRepository.findById(moduleId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace service not found"));
        if (!module.getPackageInstance().getId().equals(workspace.getPackageInstance().getId())) {
            throw new AccessDeniedException("Service is not attached to this workspace");
        }
        User owner = resolveWorkspaceOwnerCandidate(workspace, request.ownerUserId());
        module.setOwner(owner);
        module.setOwnerAssignedBy(user);
        module.setOwnerAssignedAt(LocalDateTime.now());
        module.setOwnerNote(normalizeOptionalText(request.note()));
        return toPackageModuleResponse(packageModuleRepository.save(module));
    }

    @PostMapping("/{workspaceId}/services/{serviceModuleId}/findings")
    @Transactional
    public WorkspaceServiceFindingsUpdateResponse includeServiceFindings(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @PathVariable UUID serviceModuleId,
            @Valid @RequestBody WorkspaceServiceFindingsRequest request
    ) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceCoordinator(user, workspace);
        ServiceModule serviceModule = serviceModuleRepository.findById(serviceModuleId)
                .orElseThrow(() -> new IllegalArgumentException("Service module not found"));
        requireServiceInWorkspace(workspace, serviceModule);
        if (request.riskThreadIds() == null || request.riskThreadIds().isEmpty()) {
            throw new IllegalArgumentException("Select at least one finding to include");
        }
        List<ScannerRiskThread> included = new ArrayList<>();
        riskLifecycleService.currentProductRisks(workspaceProduct(workspace).getId()).stream()
                .filter(risk -> request.riskThreadIds().contains(risk.getId()))
                .forEach(risk -> included.add(includeFindingInWorkspaceService(
                        user,
                        workspace,
                        serviceModule,
                        risk,
                        Boolean.TRUE.equals(request.includeExcluded()),
                        hasText(request.note()) ? request.note().trim() : "Included in workspace service scope.",
                        false
                )));
        if (included.size() != request.riskThreadIds().size()) {
            throw new IllegalArgumentException("Some selected findings are not available for this product");
        }
        return new WorkspaceServiceFindingsUpdateResponse(
                serviceModule.getId(),
                serviceModule.getName(),
                included.stream().map(this::toFindingBrief).toList(),
                included.size(),
                included.size() + " finding" + (included.size() == 1 ? "" : "s") + " included under " + serviceModule.getName() + "."
        );
    }

    @PostMapping("/{workspaceId}/services/{serviceModuleId}/findings/{riskThreadId}/exclude")
    @Transactional
    public WorkspaceServiceFindingsUpdateResponse excludeServiceFinding(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @PathVariable UUID serviceModuleId,
            @PathVariable UUID riskThreadId,
            @Valid @RequestBody WorkspaceServiceFindingExcludeRequest request
    ) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceCoordinator(user, workspace);
        ServiceModule serviceModule = serviceModuleRepository.findById(serviceModuleId)
                .orElseThrow(() -> new IllegalArgumentException("Service module not found"));
        requireServiceInWorkspace(workspace, serviceModule);
        ScannerRiskThread risk = riskLifecycleService.currentProductRisks(workspaceProduct(workspace).getId()).stream()
                .filter(item -> item.getId().equals(riskThreadId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Finding is not available for this product"));
        excludeFindingFromWorkspaceService(
                user,
                workspace,
                serviceModule,
                risk,
                hasText(request.reason()) ? request.reason().trim() : "Removed from this workspace service scope."
        );
        return new WorkspaceServiceFindingsUpdateResponse(
                serviceModule.getId(),
                serviceModule.getName(),
                List.of(toFindingBrief(risk)),
                1,
                "Finding removed from " + serviceModule.getName() + " in this workspace."
        );
    }

    @GetMapping("/{workspaceId}/scanner/risks/current")
    public ScannerRiskSummaryResponse scannerRisks(@AuthenticationPrincipal User user, @PathVariable UUID workspaceId) {
        return scannerService.currentWorkspaceRisks(user, workspaceId);
    }

    @PutMapping("/{workspaceId}/scanner/risks/{riskThreadId}/owner")
    @Transactional
    public ScannerRiskThreadResponse assignFindingOwner(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @PathVariable UUID riskThreadId,
            @Valid @RequestBody WorkspaceOwnerAssignmentRequest request
    ) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceCoordinator(user, workspace);
        ScannerRiskThread risk = riskThreadRepository.findById(riskThreadId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace finding not found"));
        if (risk.getWorkspace() == null || !risk.getWorkspace().getId().equals(workspace.getId())) {
            throw new AccessDeniedException("Finding is not attached to this workspace");
        }
        User owner = resolveWorkspaceOwnerCandidate(workspace, request.ownerUserId());
        risk.setOwner(owner);
        risk.setOwnerAssignedBy(user);
        risk.setOwnerAssignedAt(LocalDateTime.now());
        risk.setOwnerNote(normalizeOptionalText(request.note()));
        return scannerService.toScannerRiskThreadResponse(riskThreadRepository.save(risk));
    }

    @PostMapping("/{workspaceId}/scanner/check-fixes")
    public CheckFixesResponse checkFixes(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @Valid @RequestBody CheckFixesRequest request
    ) {
        return scannerService.checkWorkspaceFixes(user, workspaceId, request);
    }

    @GetMapping("/{workspaceId}/scanner/check-progress")
    public WorkspaceCheckProgressResponse checkProgress(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId
    ) {
        return scannerService.workspaceCheckProgress(user, workspaceId);
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

    private int nextServiceSequence(UUID packageInstanceId) {
        return packageModuleRepository.findByPackageInstanceIdOrderBySequenceOrderAsc(packageInstanceId).stream()
                .map(PackageModule::getSequenceOrder)
                .filter(sequence -> sequence != null)
                .max(Integer::compareTo)
                .orElse(0) + 1;
    }

    private void createMilestoneForModule(ProjectWorkspace workspace, PackageModule module) {
        Milestone milestone = new Milestone();
        milestone.setWorkspace(workspace);
        milestone.setTitle(module.getServiceModule().getName());
        milestone.setDescription(hasText(module.getDeliverables())
                ? module.getDeliverables()
                : module.getServiceModule().getOwnerOutcome());
        int sequence = module.getSequenceOrder() == null ? 1 : module.getSequenceOrder();
        milestone.setDueDate(LocalDate.now().plusDays(Math.max(1, sequence) * 7L));
        milestoneRepository.save(milestone);
    }

    private List<WorkspaceServiceFindingImpactResponse> serviceFindingImpact(ProjectWorkspace workspace) {
        return riskLifecycleService.currentProductRisks(workspaceProduct(workspace).getId()).stream()
                .filter(this::isServiceImpactRisk)
                .filter(risk -> risk.getRecommendedModule() != null)
                .collect(Collectors.groupingBy(
                        risk -> risk.getRecommendedModule().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ))
                .values()
                .stream()
                .map(risks -> serviceFindingBucket(workspace, risks.get(0).getRecommendedModule(), risks))
                .map(bucket -> new WorkspaceServiceFindingImpactResponse(
                        bucket.serviceModule().getId(),
                        bucket.serviceModule().getName(),
                        bucket.findingsAlreadyInWorkspace().size(),
                        bucket.findingsWillBeAdded().size(),
                        bucket.findingsExcludedFromWorkspace().size(),
                        bucket.findingsAlreadyInWorkspace().stream().map(this::toFindingBrief).toList(),
                        bucket.findingsWillBeAdded().stream().map(this::toFindingBrief).toList(),
                        bucket.findingsExcludedFromWorkspace().stream().map(this::toFindingBrief).toList()
                ))
                .sorted(Comparator
                        .comparingInt(WorkspaceServiceFindingImpactResponse::findingsWillBeAddedCount).reversed()
                        .thenComparing(Comparator.comparingInt(WorkspaceServiceFindingImpactResponse::findingsAlreadyInWorkspaceCount).reversed())
                        .thenComparing(WorkspaceServiceFindingImpactResponse::serviceName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private WorkspaceServiceFindingBucket serviceFindingBucket(ProjectWorkspace workspace, ServiceModule serviceModule) {
        List<ScannerRiskThread> matchingRisks = riskLifecycleService.currentProductRisks(workspaceProduct(workspace).getId()).stream()
                .filter(this::isServiceImpactRisk)
                .filter(risk -> risk.getRecommendedModule() != null)
                .filter(risk -> risk.getRecommendedModule().getId().equals(serviceModule.getId()))
                .toList();
        return serviceFindingBucket(workspace, serviceModule, matchingRisks);
    }

    private WorkspaceServiceFindingBucket serviceFindingBucket(
            ProjectWorkspace workspace,
            ServiceModule serviceModule,
            List<ScannerRiskThread> matchingRisks
    ) {
        List<ScannerRiskThread> alreadyInWorkspace = matchingRisks.stream()
                .filter(risk -> isIncludedInWorkspaceService(workspace, serviceModule, risk)
                        || hasLegacyWorkspaceAssignment(workspace, risk))
                .toList();
        List<ScannerRiskThread> willBeAdded = matchingRisks.stream()
                .filter(risk -> !alreadyInWorkspace.contains(risk))
                .filter(risk -> !isExcludedFromWorkspaceService(workspace, serviceModule, risk))
                .filter(risk -> risk.getWorkspace() == null)
                .toList();
        List<ScannerRiskThread> excluded = matchingRisks.stream()
                .filter(risk -> isExcludedFromWorkspaceService(workspace, serviceModule, risk))
                .toList();
        return new WorkspaceServiceFindingBucket(serviceModule, alreadyInWorkspace, willBeAdded, excluded);
    }

    private boolean hasLegacyWorkspaceAssignment(ProjectWorkspace workspace, ScannerRiskThread risk) {
        return risk.getWorkspace() != null && risk.getWorkspace().getId().equals(workspace.getId());
    }

    private boolean isIncludedInWorkspaceService(ProjectWorkspace workspace, ServiceModule serviceModule, ScannerRiskThread risk) {
        return workspaceServiceFindingRepository
                .findByWorkspaceIdAndServiceModuleIdAndRiskThreadId(workspace.getId(), serviceModule.getId(), risk.getId())
                .map(scope -> scope.getStatus() == WorkspaceServiceFindingStatus.INCLUDED)
                .orElse(false);
    }

    private boolean isExcludedFromWorkspaceService(ProjectWorkspace workspace, ServiceModule serviceModule, ScannerRiskThread risk) {
        return workspaceServiceFindingRepository
                .findByWorkspaceIdAndServiceModuleIdAndRiskThreadId(workspace.getId(), serviceModule.getId(), risk.getId())
                .map(scope -> scope.getStatus() == WorkspaceServiceFindingStatus.EXCLUDED)
                .orElse(false);
    }

    private List<ScannerRiskThread> selectServiceFindings(List<ScannerRiskThread> candidates, List<UUID> selectedRiskThreadIds) {
        if (selectedRiskThreadIds == null || selectedRiskThreadIds.isEmpty()) {
            return candidates;
        }
        Set<UUID> selected = Set.copyOf(selectedRiskThreadIds);
        return candidates.stream()
                .filter(risk -> selected.contains(risk.getId()))
                .toList();
    }

    private List<ScannerRiskThread> explicitUnmappedServiceChoices(
            ProjectWorkspace workspace,
            List<ScannerRiskThread> candidates,
            List<UUID> selectedRiskThreadIds
    ) {
        if (selectedRiskThreadIds == null || selectedRiskThreadIds.isEmpty()) {
            return List.of();
        }
        Set<UUID> existingCandidateIds = candidates.stream()
                .map(ScannerRiskThread::getId)
                .collect(Collectors.toSet());
        Set<UUID> selected = Set.copyOf(selectedRiskThreadIds);
        return riskLifecycleService.currentProductRisks(workspaceProduct(workspace).getId()).stream()
                .filter(risk -> selected.contains(risk.getId()))
                .filter(risk -> !existingCandidateIds.contains(risk.getId()))
                .filter(risk -> risk.getRecommendedModule() == null)
                .filter(risk -> risk.getWorkspace() == null || hasLegacyWorkspaceAssignment(workspace, risk))
                .toList();
    }

    private ScannerRiskThread includeFindingInWorkspaceService(
            User user,
            ProjectWorkspace workspace,
            ServiceModule serviceModule,
            ScannerRiskThread risk,
            boolean includeExcluded,
            String reason,
            boolean allowServiceChoiceForUnmapped
    ) {
        if (allowServiceChoiceForUnmapped && risk.getRecommendedModule() == null) {
            risk = riskLifecycleService.updateServiceMapping(
                    risk,
                    serviceModule,
                    user,
                    "Service selected before adding the finding to workspace work."
            );
        }
        validateServiceOwnsRisk(workspace, serviceModule, risk);
        WorkspaceServiceFinding scope = workspaceServiceFindingRepository
                .findByWorkspaceIdAndServiceModuleIdAndRiskThreadId(workspace.getId(), serviceModule.getId(), risk.getId())
                .orElseGet(WorkspaceServiceFinding::new);
        if (scope.getId() != null && scope.getStatus() == WorkspaceServiceFindingStatus.EXCLUDED && !includeExcluded) {
            throw new IllegalArgumentException("Finding was removed from this service. Confirm re-add before including it again.");
        }
        scope.setWorkspace(workspace);
        scope.setServiceModule(serviceModule);
        scope.setRiskThread(risk);
        scope.setStatus(WorkspaceServiceFindingStatus.INCLUDED);
        scope.setReason(reason);
        scope.setAddedBy(user);
        scope.setRemovedBy(null);
        workspaceServiceFindingRepository.save(scope);
        return riskLifecycleService.assignWorkspace(risk, workspace);
    }

    private void excludeIncludedFindingsForService(User user, ProjectWorkspace workspace, ServiceModule serviceModule, String reason) {
        workspaceServiceFindingRepository
                .findByWorkspaceIdAndServiceModuleIdOrderByUpdatedAtDesc(workspace.getId(), serviceModule.getId())
                .stream()
                .filter(scope -> scope.getStatus() == WorkspaceServiceFindingStatus.INCLUDED)
                .forEach(scope -> excludeFindingFromWorkspaceService(user, workspace, serviceModule, scope.getRiskThread(), reason));
    }

    private void excludeFindingFromWorkspaceService(
            User user,
            ProjectWorkspace workspace,
            ServiceModule serviceModule,
            ScannerRiskThread risk,
            String reason
    ) {
        validateServiceOwnsRisk(workspace, serviceModule, risk);
        WorkspaceServiceFinding scope = workspaceServiceFindingRepository
                .findByWorkspaceIdAndServiceModuleIdAndRiskThreadId(workspace.getId(), serviceModule.getId(), risk.getId())
                .orElseGet(WorkspaceServiceFinding::new);
        scope.setWorkspace(workspace);
        scope.setServiceModule(serviceModule);
        scope.setRiskThread(risk);
        scope.setStatus(WorkspaceServiceFindingStatus.EXCLUDED);
        scope.setReason(reason);
        scope.setRemovedBy(user);
        workspaceServiceFindingRepository.save(scope);
        if (risk.getWorkspace() != null
                && risk.getWorkspace().getId().equals(workspace.getId())
                && workspaceServiceFindingRepository
                .findByWorkspaceIdAndRiskThreadIdAndStatus(workspace.getId(), risk.getId(), WorkspaceServiceFindingStatus.INCLUDED)
                .isEmpty()) {
            riskLifecycleService.unassignWorkspace(risk);
        }
    }

    private void validateServiceOwnsRisk(ProjectWorkspace workspace, ServiceModule serviceModule, ScannerRiskThread risk) {
        if (!risk.getProductProfile().getId().equals(workspaceProduct(workspace).getId())) {
            throw new IllegalArgumentException("Finding belongs to another product");
        }
        if (risk.getRecommendedModule() == null) {
            throw new IllegalArgumentException("Choose a service for this finding before adding it to workspace work");
        }
        if (!risk.getRecommendedModule().getId().equals(serviceModule.getId())) {
            throw new IllegalArgumentException("Finding is mapped to " + risk.getRecommendedModule().getName() + ", not " + serviceModule.getName());
        }
        requireServiceInWorkspace(workspace, serviceModule);
    }

    private void requireServiceInWorkspace(ProjectWorkspace workspace, ServiceModule serviceModule) {
        packageModuleRepository
                .findByPackageInstanceIdAndServiceModuleId(workspace.getPackageInstance().getId(), serviceModule.getId())
                .orElseThrow(() -> new IllegalArgumentException("Add " + serviceModule.getName() + " to this workspace before adding its findings"));
    }

    private WorkspaceFindingBriefResponse toFindingBrief(ScannerRiskThread risk) {
        return new WorkspaceFindingBriefResponse(
                risk.getId(),
                risk.getTitle(),
                risk.getSeverity(),
                risk.getCurrentState(),
                risk.getRecommendedModule() == null ? null : risk.getRecommendedModule().getName(),
                risk.getSourceTool(),
                risk.getAffectedComponent(),
                risk.getBusinessRisk()
        );
    }

    private boolean isServiceImpactRisk(ScannerRiskThread risk) {
        if (risk.getCurrentState() == null) {
            return true;
        }
        return switch (risk.getCurrentState()) {
            case FIXED_BY_LATEST_SCAN, ACCEPTED_RISK, FALSE_POSITIVE -> false;
            default -> true;
        };
    }

    private ProductProfile workspaceProduct(ProjectWorkspace workspace) {
        ProductProfile product = workspace.getPackageInstance() == null ? null : workspace.getPackageInstance().getProductProfile();
        if (product == null) {
            throw new IllegalArgumentException("Workspace product not found");
        }
        return product;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private PackageInstance resolveWorkspacePackage(User owner, WorkspaceRequest request) {
        if (request.packageInstanceId() != null) {
            PackageInstance packageInstance = packageRepository.findById(request.packageInstanceId())
                    .orElseThrow(() -> new IllegalArgumentException("Package not found"));
            requireOwnerOrAdmin(owner, packageInstance);
            return packageInstance;
        }

        if (request.productProfileId() == null) {
            throw new IllegalArgumentException("Product is required");
        }
        if (!hasText(request.name())) {
            throw new IllegalArgumentException("Workspace name is required");
        }

        ProductProfile product = productProfileRepository.findById(request.productProfileId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        requireOwnerOrAdmin(owner, product);

        PackageInstance packageInstance = new PackageInstance();
        packageInstance.setOwner(owner);
        packageInstance.setProductProfile(product);
        packageInstance.setName(request.name().trim());
        packageInstance.setSummary("Empty workspace scope. Add services, team, findings, and proof as the work becomes clear.");
        return packageRepository.save(packageInstance);
    }

    private void requireOwnerOrAdmin(User user, PackageInstance packageInstance) {
        if (user.getRole() == User.UserRole.ADMIN || packageInstance.getOwner().getId().equals(user.getId())) {
            return;
        }
        throw new AccessDeniedException("Package belongs to another owner");
    }

    private void requireOwnerOrAdmin(User user, ProductProfile product) {
        if (user.getRole() == User.UserRole.ADMIN || product.getOwner().getId().equals(user.getId())) {
            return;
        }
        throw new AccessDeniedException("Product belongs to another owner");
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

    private User resolveWorkspaceOwnerCandidate(ProjectWorkspace workspace, UUID userId) {
        if (userId == null) {
            throw new IllegalArgumentException("Owner is required");
        }
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Owner user not found"));
        if (workspace.getOwner().getId().equals(owner.getId())) {
            return owner;
        }
        participantRepository.findByWorkspaceIdAndUserIdAndActiveTrue(workspace.getId(), owner.getId())
                .orElseThrow(() -> new AccessDeniedException("Owner must be an active workspace participant"));
        return owner;
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim();
        return normalized.length() > 500 ? normalized.substring(0, 500) : normalized;
    }

    public record WorkspaceRequest(
            UUID packageInstanceId,
            UUID productProfileId,
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
    public record WorkspaceServiceRequest(
            @NotNull(message = "Service is required")
            UUID serviceModuleId,
            Boolean required,
            String rationale,
            Boolean createMilestone,
            Boolean addMatchingFindings,
            List<UUID> selectedRiskThreadIds,
            Boolean includeExcluded
    ) {}
    public record WorkspaceServiceFindingsRequest(
            List<UUID> riskThreadIds,
            Boolean includeExcluded,
            String note
    ) {}
    public record WorkspaceServiceFindingExcludeRequest(String reason) {}
    public record WorkspaceOwnerAssignmentRequest(
            @NotNull(message = "Owner is required")
            UUID ownerUserId,
            String note
    ) {}
    private record WorkspaceServiceFindingBucket(
            ServiceModule serviceModule,
            List<ScannerRiskThread> findingsAlreadyInWorkspace,
            List<ScannerRiskThread> findingsWillBeAdded,
            List<ScannerRiskThread> findingsExcludedFromWorkspace
    ) {}
    public record WorkspaceFindingBriefResponse(
            UUID id,
            String title,
            com.produs.scanner.NormalizedFinding.FindingSeverity severity,
            ScannerRiskThread.RiskState currentState,
            String serviceName,
            String sourceTool,
            String affectedComponent,
            String businessRisk
    ) {}
    public record WorkspaceServiceFindingImpactResponse(
            UUID serviceModuleId,
            String serviceName,
            int findingsAlreadyInWorkspaceCount,
            int findingsWillBeAddedCount,
            int findingsExcludedFromWorkspaceCount,
            List<WorkspaceFindingBriefResponse> findingsAlreadyInWorkspace,
            List<WorkspaceFindingBriefResponse> findingsWillBeAdded,
            List<WorkspaceFindingBriefResponse> findingsExcludedFromWorkspace
    ) {}
    public record WorkspaceServiceAddResponse(
            PackageModuleResponse service,
            List<WorkspaceFindingBriefResponse> addedFindings,
            List<WorkspaceFindingBriefResponse> coveredFindings,
            int addedFindingCount,
            int coveredFindingCount,
            String ownerNotice
    ) {}
    public record WorkspaceServiceFindingsUpdateResponse(
            UUID serviceModuleId,
            String serviceName,
            List<WorkspaceFindingBriefResponse> findings,
            int findingCount,
            String ownerNotice
    ) {}
}
