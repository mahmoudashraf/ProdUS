package com.produs.commerce;

import com.produs.dto.PlatformDtos.ContractAgreementResponse;
import com.produs.dto.PlatformDtos.DisputeCaseResponse;
import com.produs.dto.PlatformDtos.InvoiceRecordResponse;
import com.produs.dto.PlatformDtos.QuoteProposalResponse;
import com.produs.dto.PlatformDtos.SupportRequestResponse;
import com.produs.dto.PlatformDtos.SupportSlaRunResponse;
import com.produs.dto.PlatformDtos.SupportSubscriptionResponse;
import com.produs.dto.PlatformDtos.TeamReputationEventResponse;
import com.produs.entity.User;
import com.produs.notifications.NotificationService;
import com.produs.notifications.PlatformNotification;
import com.produs.packages.PackageInstance;
import com.produs.packages.PackageInstanceRepository;
import com.produs.shared.BaseEntity;
import com.produs.teams.Team;
import com.produs.teams.TeamMember;
import com.produs.teams.TeamMemberRepository;
import com.produs.teams.TeamRepository;
import com.produs.workspace.ProjectWorkspace;
import com.produs.workspace.ProjectWorkspaceRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

import static com.produs.dto.PlatformDtos.toContractAgreementResponse;
import static com.produs.dto.PlatformDtos.toDisputeCaseResponse;
import static com.produs.dto.PlatformDtos.toInvoiceRecordResponse;
import static com.produs.dto.PlatformDtos.toQuoteProposalResponse;
import static com.produs.dto.PlatformDtos.toSupportRequestResponse;
import static com.produs.dto.PlatformDtos.toSupportSubscriptionResponse;
import static com.produs.dto.PlatformDtos.toTeamReputationEventResponse;

@RestController
@RequestMapping("/api/commerce")
@RequiredArgsConstructor
public class CommerceController {

    private final QuoteProposalRepository proposalRepository;
    private final ContractAgreementRepository contractRepository;
    private final InvoiceRecordRepository invoiceRepository;
    private final SupportSubscriptionRepository subscriptionRepository;
    private final SupportRequestRepository supportRequestRepository;
    private final TeamReputationEventRepository reputationRepository;
    private final DisputeCaseRepository disputeRepository;
    private final PackageInstanceRepository packageRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ProjectWorkspaceRepository workspaceRepository;
    private final NotificationService notificationService;
    private final SupportSlaService supportSlaService;

    @GetMapping("/proposals")
    public List<QuoteProposalResponse> proposals(@AuthenticationPrincipal User user) {
        Stream<QuoteProposal> proposals = switch (user.getRole()) {
            case ADMIN -> proposalRepository.findAll().stream();
            case PRODUCT_OWNER -> proposalRepository.findByPackageInstanceOwnerIdOrderByCreatedAtDesc(user.getId()).stream();
            case TEAM_MANAGER -> proposalRepository.findByTeamManagerIdOrderByCreatedAtDesc(user.getId()).stream();
            case SPECIALIST, ADVISOR -> teamMemberRepository.findByUserIdAndActiveTrueOrderByCreatedAtDesc(user.getId()).stream()
                    .flatMap(member -> proposalRepository.findByTeamIdOrderByCreatedAtDesc(member.getTeam().getId()).stream());
        };
        return sortDistinct(proposals).stream()
                .map(proposal -> toQuoteProposalResponse(proposal))
                .toList();
    }

    @GetMapping("/packages/{packageId}/proposals")
    public List<QuoteProposalResponse> packageProposals(@AuthenticationPrincipal User user, @PathVariable UUID packageId) {
        PackageInstance packageInstance = packageRepository.findById(packageId)
                .orElseThrow(() -> new IllegalArgumentException("Package not found"));
        requirePackageOwnerOrAdmin(user, packageInstance);
        return proposalRepository.findByPackageInstanceIdOrderByCreatedAtDesc(packageId).stream()
                .map(proposal -> toQuoteProposalResponse(proposal))
                .toList();
    }

    @PostMapping("/packages/{packageId}/proposals")
    public QuoteProposalResponse createProposal(
            @AuthenticationPrincipal User user,
            @PathVariable UUID packageId,
            @Valid @RequestBody ProposalRequest request
    ) {
        PackageInstance packageInstance = packageRepository.findById(packageId)
                .orElseThrow(() -> new IllegalArgumentException("Package not found"));
        Team team = teamRepository.findById(request.teamId())
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        requireTeamWriter(user, team);

        QuoteProposal proposal = new QuoteProposal();
        proposal.setPackageInstance(packageInstance);
        proposal.setTeam(team);
        proposal.setSubmittedBy(user);
        proposal.setTitle(request.title());
        proposal.setScope(request.scope());
        proposal.setAssumptions(request.assumptions());
        proposal.setTimelineDays(request.timelineDays() == null ? 14 : request.timelineDays());
        proposal.setCurrency(normalizeCurrency(request.currency()));
        proposal.setFixedPriceCents(request.fixedPriceCents() == null ? 0 : request.fixedPriceCents());
        proposal.setPlatformFeeCents(request.platformFeeCents() == null ? 0 : request.platformFeeCents());
        proposal.setStatus(request.status() == null ? QuoteProposal.ProposalStatus.SUBMITTED : request.status());
        QuoteProposal saved = proposalRepository.save(proposal);
        notifyProposalSubmitted(saved, user);
        return toQuoteProposalResponse(saved);
    }

    @PutMapping("/proposals/{proposalId}/status")
    public QuoteProposalResponse updateProposalStatus(
            @AuthenticationPrincipal User user,
            @PathVariable UUID proposalId,
            @Valid @RequestBody ProposalStatusRequest request
    ) {
        QuoteProposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found"));
        if (isAdmin(user)) {
            proposal.setStatus(request.status());
            QuoteProposal saved = proposalRepository.save(proposal);
            notifyProposalStatusChanged(saved, user);
            return toQuoteProposalResponse(saved);
        }
        if (isPackageOwner(user, proposal.getPackageInstance())) {
            if (request.status() == QuoteProposal.ProposalStatus.OWNER_ACCEPTED
                    || request.status() == QuoteProposal.ProposalStatus.OWNER_REJECTED) {
                proposal.setStatus(request.status());
                QuoteProposal saved = proposalRepository.save(proposal);
                notifyProposalStatusChanged(saved, user);
                return toQuoteProposalResponse(saved);
            }
        }
        if (isTeamManager(user, proposal.getTeam())) {
            if (request.status() == QuoteProposal.ProposalStatus.DRAFT
                    || request.status() == QuoteProposal.ProposalStatus.SUBMITTED
                    || request.status() == QuoteProposal.ProposalStatus.WITHDRAWN) {
                proposal.setStatus(request.status());
                QuoteProposal saved = proposalRepository.save(proposal);
                notifyProposalStatusChanged(saved, user);
                return toQuoteProposalResponse(saved);
            }
        }
        throw new AccessDeniedException("Proposal status cannot be changed by this user");
    }

    @PostMapping("/proposals/{proposalId}/contract")
    public ContractAgreementResponse createContract(
            @AuthenticationPrincipal User user,
            @PathVariable UUID proposalId,
            @Valid @RequestBody ContractRequest request
    ) {
        QuoteProposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found"));
        requirePackageOwnerOrAdmin(user, proposal.getPackageInstance());

        ContractAgreement existing = contractRepository.findByProposalId(proposalId).orElse(null);
        if (existing != null) {
            return toContractAgreementResponse(existing);
        }

        ProjectWorkspace workspace = resolveWorkspace(request.workspaceId());
        if (workspace != null) {
            requireWorkspaceMatchesProposal(workspace, proposal);
            requireWorkspaceOwnerOrAdmin(user, workspace);
        }

        proposal.setStatus(QuoteProposal.ProposalStatus.OWNER_ACCEPTED);
        proposalRepository.save(proposal);

        ContractAgreement contract = new ContractAgreement();
        contract.setProposal(proposal);
        contract.setWorkspace(workspace);
        contract.setOwner(proposal.getPackageInstance().getOwner());
        contract.setTeam(proposal.getTeam());
        contract.setTitle(request.title());
        contract.setTerms(request.terms());
        contract.setEffectiveOn(request.effectiveOn());
        contract.setStatus(request.status() == null ? ContractAgreement.ContractStatus.SENT : request.status());
        if (contract.getStatus() == ContractAgreement.ContractStatus.SIGNED
                || contract.getStatus() == ContractAgreement.ContractStatus.ACTIVE) {
            contract.setSignedAt(LocalDateTime.now());
        }
        ContractAgreement saved = contractRepository.save(contract);
        notifyContractCreated(saved, user);
        return toContractAgreementResponse(saved);
    }

    @GetMapping("/contracts")
    public List<ContractAgreementResponse> contracts(@AuthenticationPrincipal User user) {
        Stream<ContractAgreement> contracts = switch (user.getRole()) {
            case ADMIN -> contractRepository.findAll().stream();
            case PRODUCT_OWNER -> contractRepository.findByOwnerIdOrderByCreatedAtDesc(user.getId()).stream();
            case TEAM_MANAGER -> contractRepository.findByTeamManagerIdOrderByCreatedAtDesc(user.getId()).stream();
            case SPECIALIST, ADVISOR -> Stream.empty();
        };
        return sortDistinct(contracts).stream()
                .map(contract -> toContractAgreementResponse(contract))
                .toList();
    }

    @PutMapping("/contracts/{contractId}/status")
    public ContractAgreementResponse updateContractStatus(
            @AuthenticationPrincipal User user,
            @PathVariable UUID contractId,
            @Valid @RequestBody ContractStatusRequest request
    ) {
        ContractAgreement contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));
        requireContractParty(user, contract);
        contract.setStatus(request.status());
        if ((request.status() == ContractAgreement.ContractStatus.SIGNED
                || request.status() == ContractAgreement.ContractStatus.ACTIVE)
                && contract.getSignedAt() == null) {
            contract.setSignedAt(LocalDateTime.now());
        }
        ContractAgreement saved = contractRepository.save(contract);
        notifyContractStatusChanged(saved, user);
        return toContractAgreementResponse(saved);
    }

    @PostMapping("/contracts/{contractId}/invoices")
    public InvoiceRecordResponse createInvoice(
            @AuthenticationPrincipal User user,
            @PathVariable UUID contractId,
            @Valid @RequestBody InvoiceRequest request
    ) {
        ContractAgreement contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));
        requireTeamWriter(user, contract.getTeam());

        InvoiceRecord invoice = new InvoiceRecord();
        invoice.setContractAgreement(contract);
        invoice.setOwner(contract.getOwner());
        invoice.setIssuedBy(user);
        invoice.setInvoiceNumber(request.invoiceNumber());
        invoice.setDescription(request.description());
        invoice.setAmountCents(request.amountCents() == null ? 0 : request.amountCents());
        invoice.setCurrency(normalizeCurrency(request.currency()));
        invoice.setDueDate(request.dueDate());
        invoice.setStatus(request.status() == null ? InvoiceRecord.InvoiceStatus.ISSUED : request.status());
        InvoiceRecord saved = invoiceRepository.save(invoice);
        notifyInvoiceIssued(saved, user);
        return toInvoiceRecordResponse(saved);
    }

    @GetMapping("/invoices")
    public List<InvoiceRecordResponse> invoices(@AuthenticationPrincipal User user) {
        Stream<InvoiceRecord> invoices = switch (user.getRole()) {
            case ADMIN -> invoiceRepository.findAll().stream();
            case PRODUCT_OWNER -> invoiceRepository.findByOwnerIdOrderByCreatedAtDesc(user.getId()).stream();
            case TEAM_MANAGER -> invoiceRepository.findByContractAgreementTeamManagerIdOrderByCreatedAtDesc(user.getId()).stream();
            case SPECIALIST, ADVISOR -> Stream.empty();
        };
        return sortDistinct(invoices).stream()
                .map(invoice -> toInvoiceRecordResponse(invoice))
                .toList();
    }

    @PutMapping("/invoices/{invoiceId}/status")
    public InvoiceRecordResponse updateInvoiceStatus(
            @AuthenticationPrincipal User user,
            @PathVariable UUID invoiceId,
            @Valid @RequestBody InvoiceStatusRequest request
    ) {
        InvoiceRecord invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
        requireInvoiceParty(user, invoice);
        invoice.setStatus(request.status());
        InvoiceRecord saved = invoiceRepository.save(invoice);
        notifyInvoiceStatusChanged(saved, user);
        return toInvoiceRecordResponse(saved);
    }

    @PostMapping("/workspaces/{workspaceId}/support-subscriptions")
    public SupportSubscriptionResponse createSupportSubscription(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @Valid @RequestBody SupportSubscriptionRequest request
    ) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        Team team = teamRepository.findById(request.teamId())
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        if (!isWorkspaceOwner(user, workspace) && !isTeamManager(user, team) && !isAdmin(user)) {
            throw new AccessDeniedException("Support subscription cannot be created by this user");
        }

        SupportSubscription subscription = new SupportSubscription();
        subscription.setWorkspace(workspace);
        subscription.setOwner(workspace.getOwner());
        subscription.setTeam(team);
        subscription.setCreatedBy(user);
        subscription.setPlanName(request.planName());
        subscription.setSla(request.sla());
        subscription.setMonthlyAmountCents(request.monthlyAmountCents() == null ? 0 : request.monthlyAmountCents());
        subscription.setCurrency(normalizeCurrency(request.currency()));
        subscription.setStartsOn(request.startsOn());
        subscription.setRenewsOn(request.renewsOn());
        subscription.setStatus(request.status() == null ? SupportSubscription.SubscriptionStatus.PROPOSED : request.status());
        SupportSubscription saved = subscriptionRepository.save(subscription);
        notifySupportSubscriptionCreated(saved, user);
        return toSupportSubscriptionResponse(saved);
    }

    @GetMapping("/support-subscriptions")
    public List<SupportSubscriptionResponse> supportSubscriptions(@AuthenticationPrincipal User user) {
        Stream<SupportSubscription> subscriptions = switch (user.getRole()) {
            case ADMIN -> subscriptionRepository.findAll().stream();
            case PRODUCT_OWNER -> subscriptionRepository.findByOwnerIdOrderByCreatedAtDesc(user.getId()).stream();
            case TEAM_MANAGER -> subscriptionRepository.findByTeamManagerIdOrderByCreatedAtDesc(user.getId()).stream();
            case SPECIALIST, ADVISOR -> Stream.empty();
        };
        return sortDistinct(subscriptions).stream()
                .map(subscription -> toSupportSubscriptionResponse(subscription))
                .toList();
    }

    @PutMapping("/support-subscriptions/{subscriptionId}/status")
    public SupportSubscriptionResponse updateSupportSubscriptionStatus(
            @AuthenticationPrincipal User user,
            @PathVariable UUID subscriptionId,
            @Valid @RequestBody SubscriptionStatusRequest request
    ) {
        SupportSubscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Support subscription not found"));
        if (!isAdmin(user) && !isWorkspaceOwner(user, subscription.getWorkspace()) && !isTeamManager(user, subscription.getTeam())) {
            throw new AccessDeniedException("Support subscription cannot be changed by this user");
        }
        subscription.setStatus(request.status());
        SupportSubscription saved = subscriptionRepository.save(subscription);
        notifySupportSubscriptionStatusChanged(saved, user);
        return toSupportSubscriptionResponse(saved);
    }

    @GetMapping("/support-requests")
    public List<SupportRequestResponse> supportRequests(@AuthenticationPrincipal User user) {
        Stream<SupportRequest> requests = switch (user.getRole()) {
            case ADMIN -> supportRequestRepository.findAll().stream();
            case PRODUCT_OWNER -> supportRequestRepository.findByOwnerIdOrderByCreatedAtDesc(user.getId()).stream();
            case TEAM_MANAGER -> supportRequestRepository.findByTeamManagerIdOrderByCreatedAtDesc(user.getId()).stream();
            case SPECIALIST, ADVISOR -> teamMemberRepository.findByUserIdAndActiveTrueOrderByCreatedAtDesc(user.getId()).stream()
                    .flatMap(member -> supportRequestRepository.findByTeamIdOrderByCreatedAtDesc(member.getTeam().getId()).stream());
        };
        return sortDistinct(requests).stream()
                .map(request -> toSupportRequestResponse(request))
                .toList();
    }

    @GetMapping("/workspaces/{workspaceId}/support-requests")
    public List<SupportRequestResponse> workspaceSupportRequests(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId
    ) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceSupportViewer(user, workspace);
        return supportRequestRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream()
                .map(request -> toSupportRequestResponse(request))
                .toList();
    }

    @PostMapping("/workspaces/{workspaceId}/support-requests")
    public SupportRequestResponse createSupportRequest(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @Valid @RequestBody SupportRequestPayload request
    ) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        SupportSubscription subscription = resolveSupportSubscription(request.supportSubscriptionId());
        if (subscription != null && !subscription.getWorkspace().getId().equals(workspaceId)) {
            throw new IllegalArgumentException("Support subscription belongs to a different workspace");
        }

        Team team = request.teamId() == null
                ? subscription == null ? null : subscription.getTeam()
                : teamRepository.findById(request.teamId()).orElseThrow(() -> new IllegalArgumentException("Team not found"));
        if (team == null) {
            throw new IllegalArgumentException("Support team is required");
        }
        if (subscription != null && !subscription.getTeam().getId().equals(team.getId())) {
            throw new IllegalArgumentException("Support request team must match the subscription team");
        }
        requireSupportParticipant(user, workspace, team);

        SupportRequest supportRequest = new SupportRequest();
        supportRequest.setWorkspace(workspace);
        supportRequest.setSupportSubscription(subscription);
        supportRequest.setTeam(team);
        supportRequest.setOwner(workspace.getOwner());
        supportRequest.setOpenedBy(user);
        supportRequest.setTitle(request.title());
        supportRequest.setDescription(request.description());
        supportRequest.setPriority(request.priority() == null ? SupportRequest.SupportPriority.MEDIUM : request.priority());
        supportRequest.setStatus(request.status() == null ? SupportRequest.SupportStatus.OPEN : request.status());
        supportRequest.setDueOn(request.dueOn());
        supportSlaService.applyPassiveSlaState(supportRequest);
        SupportRequest saved = supportRequestRepository.save(supportRequest);
        notifySupportRequestOpened(saved, user);
        return toSupportRequestResponse(saved);
    }

    @PutMapping("/support-requests/{requestId}/status")
    public SupportRequestResponse updateSupportRequestStatus(
            @AuthenticationPrincipal User user,
            @PathVariable UUID requestId,
            @Valid @RequestBody SupportRequestStatusPayload request
    ) {
        SupportRequest supportRequest = supportRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Support request not found"));
        requireSupportParticipant(user, supportRequest.getWorkspace(), supportRequest.getTeam());
        supportRequest.setStatus(request.status());
        if (request.resolution() != null) {
            supportRequest.setResolution(request.resolution());
        }
        if (request.status() == SupportRequest.SupportStatus.RESOLVED && supportRequest.getResolvedAt() == null) {
            supportRequest.setResolvedAt(LocalDateTime.now());
        }
        if (request.status() != SupportRequest.SupportStatus.RESOLVED) {
            supportRequest.setResolvedAt(null);
        }
        supportSlaService.applyPassiveSlaState(supportRequest);
        SupportRequest saved = supportRequestRepository.save(supportRequest);
        notifySupportRequestUpdated(saved, user);
        return toSupportRequestResponse(saved);
    }

    @PostMapping("/support-requests/sla/run")
    public SupportSlaRunResponse runSupportSlaScan(@AuthenticationPrincipal User user) {
        if (!isAdmin(user)) {
            throw new AccessDeniedException("Only admins can run support SLA scans");
        }
        SupportSlaService.SupportSlaRunResult result = supportSlaService.runSlaScan();
        return new SupportSlaRunResponse(
                result.scannedCount(),
                result.dueSoonCount(),
                result.escalatedCount(),
                result.updatedCount()
        );
    }

    @GetMapping("/teams/{teamId}/reputation")
    public List<TeamReputationEventResponse> reputation(@PathVariable UUID teamId) {
        return reputationRepository.findByTeamIdOrderByCreatedAtDesc(teamId).stream()
                .map(event -> toTeamReputationEventResponse(event))
                .toList();
    }

    @PostMapping("/teams/{teamId}/reputation")
    public TeamReputationEventResponse createReputationEvent(
            @AuthenticationPrincipal User user,
            @PathVariable UUID teamId,
            @Valid @RequestBody ReputationEventRequest request
    ) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        ProjectWorkspace workspace = resolveWorkspace(request.workspaceId());
        if (workspace == null && !isAdmin(user)) {
            throw new AccessDeniedException("Workspace-backed evidence is required for reputation events");
        }
        if (workspace != null) {
            requireWorkspaceOwnerOrAdmin(user, workspace);
        }

        TeamReputationEvent event = new TeamReputationEvent();
        event.setTeam(team);
        event.setWorkspace(workspace);
        event.setCreatedBy(user);
        event.setEventType(request.eventType() == null ? TeamReputationEvent.ReputationEventType.WORKSPACE_REVIEW : request.eventType());
        event.setRating(request.rating() == null ? 5 : request.rating());
        event.setVerified(workspace != null);
        event.setNotes(request.notes());
        return toTeamReputationEventResponse(reputationRepository.save(event));
    }

    @GetMapping("/disputes")
    public List<DisputeCaseResponse> disputes(@AuthenticationPrincipal User user) {
        Stream<DisputeCase> disputes = switch (user.getRole()) {
            case ADMIN -> disputeRepository.findAll().stream();
            case PRODUCT_OWNER -> disputeRepository.findByWorkspaceOwnerIdOrderByCreatedAtDesc(user.getId()).stream();
            case TEAM_MANAGER -> disputeRepository.findByTeamManagerIdOrderByCreatedAtDesc(user.getId()).stream();
            case SPECIALIST, ADVISOR -> teamMemberRepository.findByUserIdAndActiveTrueOrderByCreatedAtDesc(user.getId()).stream()
                    .flatMap(member -> disputeRepository.findByTeamIdOrderByCreatedAtDesc(member.getTeam().getId()).stream());
        };
        return sortDistinct(disputes).stream()
                .map(dispute -> toDisputeCaseResponse(dispute))
                .toList();
    }

    @GetMapping("/workspaces/{workspaceId}/disputes")
    public List<DisputeCaseResponse> workspaceDisputes(@AuthenticationPrincipal User user, @PathVariable UUID workspaceId) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        requireWorkspaceDisputeViewer(user, workspace);
        return disputeRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream()
                .map(dispute -> toDisputeCaseResponse(dispute))
                .toList();
    }

    @PostMapping("/workspaces/{workspaceId}/disputes")
    public DisputeCaseResponse createDispute(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @Valid @RequestBody DisputeRequest request
    ) {
        ProjectWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        Team team = request.teamId() == null
                ? null
                : teamRepository.findById(request.teamId())
                        .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        requireDisputeCreator(user, workspace, team);

        DisputeCase dispute = new DisputeCase();
        dispute.setWorkspace(workspace);
        dispute.setTeam(team);
        dispute.setOpenedBy(user);
        dispute.setTitle(request.title());
        dispute.setDescription(request.description());
        dispute.setSeverity(request.severity() == null ? DisputeCase.DisputeSeverity.MEDIUM : request.severity());
        dispute.setStatus(request.status() == null ? DisputeCase.DisputeStatus.OPEN : request.status());
        dispute.setResponseDueOn(request.responseDueOn());
        DisputeCase saved = disputeRepository.save(dispute);
        notifyDisputeOpened(saved, user);
        return toDisputeCaseResponse(saved);
    }

    @PutMapping("/disputes/{disputeId}/status")
    public DisputeCaseResponse updateDisputeStatus(
            @AuthenticationPrincipal User user,
            @PathVariable UUID disputeId,
            @Valid @RequestBody DisputeStatusRequest request
    ) {
        DisputeCase dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new IllegalArgumentException("Dispute not found"));
        requireDisputeManager(user, dispute);
        dispute.setStatus(request.status());
        if (request.resolution() != null) {
            dispute.setResolution(request.resolution());
        }
        DisputeCase saved = disputeRepository.save(dispute);
        notifyDisputeUpdated(saved, user);
        return toDisputeCaseResponse(saved);
    }

    private void notifyProposalSubmitted(QuoteProposal proposal, User actor) {
        notificationService.notify(
                proposal.getPackageInstance().getOwner(),
                actor,
                PlatformNotification.NotificationType.PROPOSAL_SUBMITTED,
                PlatformNotification.NotificationPriority.HIGH,
                "Proposal submitted",
                proposal.getTeam().getName() + " submitted " + proposal.getTitle(),
                "/packages",
                "QUOTE_PROPOSAL",
                proposal.getId(),
                null
        );
    }

    private void notifyProposalStatusChanged(QuoteProposal proposal, User actor) {
        notificationService.notifyAll(
                List.of(proposal.getPackageInstance().getOwner(), proposal.getTeam().getManager()),
                actor,
                PlatformNotification.NotificationType.PROPOSAL_STATUS_CHANGED,
                PlatformNotification.NotificationPriority.NORMAL,
                "Proposal " + proposal.getStatus().name().replace('_', ' ').toLowerCase(),
                proposal.getTitle() + " is now " + proposal.getStatus().name().replace('_', ' ').toLowerCase(),
                "/packages",
                "QUOTE_PROPOSAL",
                proposal.getId(),
                null
        );
    }

    private void notifyContractCreated(ContractAgreement contract, User actor) {
        notificationService.notify(
                contract.getTeam().getManager(),
                actor,
                PlatformNotification.NotificationType.CONTRACT_CREATED,
                PlatformNotification.NotificationPriority.HIGH,
                "Contract ready",
                contract.getTitle() + " was created for " + contract.getTeam().getName(),
                "/packages",
                "CONTRACT_AGREEMENT",
                contract.getId(),
                contract.getWorkspace()
        );
    }

    private void notifyContractStatusChanged(ContractAgreement contract, User actor) {
        PlatformNotification.NotificationType type = contract.getStatus() == ContractAgreement.ContractStatus.SIGNED
                || contract.getStatus() == ContractAgreement.ContractStatus.ACTIVE
                ? PlatformNotification.NotificationType.CONTRACT_SIGNED
                : PlatformNotification.NotificationType.CONTRACT_STATUS_CHANGED;
        notificationService.notifyAll(
                List.of(contract.getOwner(), contract.getTeam().getManager()),
                actor,
                type,
                PlatformNotification.NotificationPriority.NORMAL,
                "Contract " + contract.getStatus().name().replace('_', ' ').toLowerCase(),
                contract.getTitle() + " is now " + contract.getStatus().name().replace('_', ' ').toLowerCase(),
                "/packages",
                "CONTRACT_AGREEMENT",
                contract.getId(),
                contract.getWorkspace()
        );
    }

    private void notifyInvoiceIssued(InvoiceRecord invoice, User actor) {
        notificationService.notify(
                invoice.getOwner(),
                actor,
                PlatformNotification.NotificationType.INVOICE_ISSUED,
                PlatformNotification.NotificationPriority.HIGH,
                "Invoice issued",
                invoice.getInvoiceNumber() + " is ready for review",
                "/packages",
                "INVOICE_RECORD",
                invoice.getId(),
                invoice.getContractAgreement().getWorkspace()
        );
    }

    private void notifyInvoiceStatusChanged(InvoiceRecord invoice, User actor) {
        PlatformNotification.NotificationType type = invoice.getStatus() == InvoiceRecord.InvoiceStatus.PAID
                ? PlatformNotification.NotificationType.INVOICE_PAID
                : PlatformNotification.NotificationType.INVOICE_STATUS_CHANGED;
        notificationService.notifyAll(
                List.of(invoice.getOwner(), invoice.getContractAgreement().getTeam().getManager()),
                actor,
                type,
                PlatformNotification.NotificationPriority.NORMAL,
                "Invoice " + invoice.getStatus().name().replace('_', ' ').toLowerCase(),
                invoice.getInvoiceNumber() + " is now " + invoice.getStatus().name().replace('_', ' ').toLowerCase(),
                "/packages",
                "INVOICE_RECORD",
                invoice.getId(),
                invoice.getContractAgreement().getWorkspace()
        );
    }

    private void notifySupportSubscriptionCreated(SupportSubscription subscription, User actor) {
        notificationService.notifyAll(
                List.of(subscription.getOwner(), subscription.getTeam().getManager()),
                actor,
                PlatformNotification.NotificationType.SUPPORT_SUBSCRIPTION_CREATED,
                PlatformNotification.NotificationPriority.NORMAL,
                "Support plan created",
                subscription.getPlanName() + " is attached to " + subscription.getWorkspace().getName(),
                "/workspaces",
                "SUPPORT_SUBSCRIPTION",
                subscription.getId(),
                subscription.getWorkspace()
        );
    }

    private void notifySupportSubscriptionStatusChanged(SupportSubscription subscription, User actor) {
        notificationService.notifyAll(
                List.of(subscription.getOwner(), subscription.getTeam().getManager()),
                actor,
                PlatformNotification.NotificationType.SUPPORT_SUBSCRIPTION_STATUS_CHANGED,
                PlatformNotification.NotificationPriority.NORMAL,
                "Support plan " + subscription.getStatus().name().replace('_', ' ').toLowerCase(),
                subscription.getPlanName() + " is now " + subscription.getStatus().name().replace('_', ' ').toLowerCase(),
                "/workspaces",
                "SUPPORT_SUBSCRIPTION",
                subscription.getId(),
                subscription.getWorkspace()
        );
    }

    private void notifySupportRequestOpened(SupportRequest request, User actor) {
        notificationService.notifyAll(
                ownerAndTeamManager(request.getWorkspace(), request.getTeam()),
                actor,
                PlatformNotification.NotificationType.SUPPORT_REQUEST_OPENED,
                priorityForSupportRequest(request),
                "Support request opened",
                request.getTitle(),
                "/workspaces",
                "SUPPORT_REQUEST",
                request.getId(),
                request.getWorkspace()
        );
    }

    private void notifySupportRequestUpdated(SupportRequest request, User actor) {
        notificationService.notifyAll(
                ownerAndTeamManager(request.getWorkspace(), request.getTeam()),
                actor,
                PlatformNotification.NotificationType.SUPPORT_REQUEST_UPDATED,
                priorityForSupportRequest(request),
                "Support request " + request.getStatus().name().replace('_', ' ').toLowerCase(),
                request.getTitle() + " is now " + request.getStatus().name().replace('_', ' ').toLowerCase(),
                "/workspaces",
                "SUPPORT_REQUEST",
                request.getId(),
                request.getWorkspace()
        );
    }

    private void notifyDisputeOpened(DisputeCase dispute, User actor) {
        notificationService.notifyAll(
                ownerAndTeamManager(dispute.getWorkspace(), dispute.getTeam()),
                actor,
                PlatformNotification.NotificationType.DISPUTE_OPENED,
                PlatformNotification.NotificationPriority.CRITICAL,
                "Dispute opened",
                dispute.getTitle(),
                "/workspaces",
                "DISPUTE_CASE",
                dispute.getId(),
                dispute.getWorkspace()
        );
    }

    private void notifyDisputeUpdated(DisputeCase dispute, User actor) {
        notificationService.notifyAll(
                ownerAndTeamManager(dispute.getWorkspace(), dispute.getTeam()),
                actor,
                PlatformNotification.NotificationType.DISPUTE_UPDATED,
                dispute.getSeverity() == DisputeCase.DisputeSeverity.CRITICAL
                        ? PlatformNotification.NotificationPriority.CRITICAL
                        : PlatformNotification.NotificationPriority.HIGH,
                "Dispute " + dispute.getStatus().name().replace('_', ' ').toLowerCase(),
                dispute.getTitle() + " is now " + dispute.getStatus().name().replace('_', ' ').toLowerCase(),
                "/workspaces",
                "DISPUTE_CASE",
                dispute.getId(),
                dispute.getWorkspace()
        );
    }

    private PlatformNotification.NotificationPriority priorityForSupportRequest(SupportRequest request) {
        return switch (request.getPriority()) {
            case URGENT -> PlatformNotification.NotificationPriority.CRITICAL;
            case HIGH -> PlatformNotification.NotificationPriority.HIGH;
            case MEDIUM -> PlatformNotification.NotificationPriority.NORMAL;
            case LOW -> PlatformNotification.NotificationPriority.LOW;
        };
    }

    private List<User> ownerAndTeamManager(ProjectWorkspace workspace, Team team) {
        List<User> users = new ArrayList<>();
        users.add(workspace.getOwner());
        if (team != null) {
            users.add(team.getManager());
        }
        return users;
    }

    private <T extends BaseEntity> List<T> sortDistinct(Stream<T> records) {
        Map<UUID, T> unique = new LinkedHashMap<>();
        records.forEach(record -> unique.putIfAbsent(record.getId(), record));
        return unique.values().stream()
                .sorted(Comparator.comparing(BaseEntity::getCreatedAt).reversed())
                .toList();
    }

    private boolean isAdmin(User user) {
        return user.getRole() == User.UserRole.ADMIN;
    }

    private boolean isPackageOwner(User user, PackageInstance packageInstance) {
        return packageInstance.getOwner().getId().equals(user.getId());
    }

    private boolean isWorkspaceOwner(User user, ProjectWorkspace workspace) {
        return workspace.getOwner().getId().equals(user.getId());
    }

    private boolean isTeamManager(User user, Team team) {
        return team.getManager().getId().equals(user.getId());
    }

    private void requirePackageOwnerOrAdmin(User user, PackageInstance packageInstance) {
        if (isAdmin(user) || isPackageOwner(user, packageInstance)) {
            return;
        }
        throw new AccessDeniedException("Package commerce records are not available to this user");
    }

    private void requireWorkspaceOwnerOrAdmin(User user, ProjectWorkspace workspace) {
        if (isAdmin(user) || isWorkspaceOwner(user, workspace)) {
            return;
        }
        throw new AccessDeniedException("Workspace commerce records are not available to this user");
    }

    private void requireTeamWriter(User user, Team team) {
        if (isAdmin(user) || isTeamManager(user, team)) {
            return;
        }
        throw new AccessDeniedException("Team commerce records cannot be changed by this user");
    }

    private void requireContractParty(User user, ContractAgreement contract) {
        if (isAdmin(user) || contract.getOwner().getId().equals(user.getId()) || isTeamManager(user, contract.getTeam())) {
            return;
        }
        throw new AccessDeniedException("Contract is not available to this user");
    }

    private void requireInvoiceParty(User user, InvoiceRecord invoice) {
        if (isAdmin(user) || invoice.getOwner().getId().equals(user.getId()) || isTeamManager(user, invoice.getContractAgreement().getTeam())) {
            return;
        }
        throw new AccessDeniedException("Invoice is not available to this user");
    }

    private void requireWorkspaceDisputeViewer(User user, ProjectWorkspace workspace) {
        if (isAdmin(user) || isWorkspaceOwner(user, workspace)) {
            return;
        }
        List<DisputeCase> workspaceDisputes = disputeRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspace.getId());
        boolean managesAssignedTeam = workspaceDisputes.stream()
                .anyMatch(dispute -> dispute.getTeam() != null && isTeamManager(user, dispute.getTeam()));
        if (managesAssignedTeam) {
            return;
        }
        Set<UUID> memberTeamIds = teamMemberRepository.findByUserIdAndActiveTrueOrderByCreatedAtDesc(user.getId()).stream()
                .map(TeamMember::getTeam)
                .map(Team::getId)
                .collect(java.util.stream.Collectors.toSet());
        boolean memberOfAssignedTeam = workspaceDisputes.stream()
                .anyMatch(dispute -> dispute.getTeam() != null && memberTeamIds.contains(dispute.getTeam().getId()));
        if (memberOfAssignedTeam) {
            return;
        }
        throw new AccessDeniedException("Workspace disputes are not available to this user");
    }

    private void requireWorkspaceSupportViewer(User user, ProjectWorkspace workspace) {
        if (isAdmin(user) || isWorkspaceOwner(user, workspace)) {
            return;
        }
        boolean hasSubscriptionAccess = subscriptionRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspace.getId()).stream()
                .anyMatch(subscription -> isTeamManager(user, subscription.getTeam()) || isTeamMember(user, subscription.getTeam()));
        if (hasSubscriptionAccess) {
            return;
        }
        boolean hasRequestAccess = supportRequestRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspace.getId()).stream()
                .anyMatch(request -> isTeamManager(user, request.getTeam()) || isTeamMember(user, request.getTeam()));
        if (hasRequestAccess) {
            return;
        }
        throw new AccessDeniedException("Workspace support requests are not available to this user");
    }

    private void requireSupportParticipant(User user, ProjectWorkspace workspace, Team team) {
        if (isAdmin(user) || isWorkspaceOwner(user, workspace) || isTeamManager(user, team) || isTeamMember(user, team)) {
            return;
        }
        throw new AccessDeniedException("Support request cannot be changed by this user");
    }

    private void requireDisputeCreator(User user, ProjectWorkspace workspace, Team team) {
        if (isAdmin(user) || isWorkspaceOwner(user, workspace)) {
            return;
        }
        if (team != null && isTeamManager(user, team)) {
            return;
        }
        throw new AccessDeniedException("Dispute cannot be opened by this user");
    }

    private void requireDisputeManager(User user, DisputeCase dispute) {
        if (isAdmin(user) || isWorkspaceOwner(user, dispute.getWorkspace())) {
            return;
        }
        if (dispute.getTeam() != null && isTeamManager(user, dispute.getTeam())) {
            return;
        }
        throw new AccessDeniedException("Dispute cannot be changed by this user");
    }

    private boolean isTeamMember(User user, Team team) {
        return team != null && teamMemberRepository.existsByTeamIdAndUserIdAndActiveTrue(team.getId(), user.getId());
    }

    private ProjectWorkspace resolveWorkspace(UUID workspaceId) {
        if (workspaceId == null) {
            return null;
        }
        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
    }

    private SupportSubscription resolveSupportSubscription(UUID subscriptionId) {
        if (subscriptionId == null) {
            return null;
        }
        return subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Support subscription not found"));
    }

    private void requireWorkspaceMatchesProposal(ProjectWorkspace workspace, QuoteProposal proposal) {
        if (workspace.getPackageInstance().getId().equals(proposal.getPackageInstance().getId())) {
            return;
        }
        throw new IllegalArgumentException("Workspace belongs to a different package");
    }

    private String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return "USD";
        }
        return currency.trim().toUpperCase();
    }

    public record ProposalRequest(
            @NotNull(message = "Team is required")
            UUID teamId,
            @NotBlank(message = "Proposal title is required")
            String title,
            String scope,
            String assumptions,
            @Min(value = 1, message = "Timeline must be at least one day")
            Integer timelineDays,
            String currency,
            @Min(value = 0, message = "Price cannot be negative")
            Long fixedPriceCents,
            @Min(value = 0, message = "Platform fee cannot be negative")
            Long platformFeeCents,
            QuoteProposal.ProposalStatus status
    ) {}

    public record ProposalStatusRequest(
            @NotNull(message = "Proposal status is required")
            QuoteProposal.ProposalStatus status
    ) {}

    public record ContractRequest(
            UUID workspaceId,
            @NotBlank(message = "Contract title is required")
            String title,
            String terms,
            LocalDate effectiveOn,
            ContractAgreement.ContractStatus status
    ) {}

    public record ContractStatusRequest(
            @NotNull(message = "Contract status is required")
            ContractAgreement.ContractStatus status
    ) {}

    public record InvoiceRequest(
            @NotBlank(message = "Invoice number is required")
            String invoiceNumber,
            String description,
            @Min(value = 0, message = "Invoice amount cannot be negative")
            Long amountCents,
            String currency,
            LocalDate dueDate,
            InvoiceRecord.InvoiceStatus status
    ) {}

    public record InvoiceStatusRequest(
            @NotNull(message = "Invoice status is required")
            InvoiceRecord.InvoiceStatus status
    ) {}

    public record SupportSubscriptionRequest(
            @NotNull(message = "Team is required")
            UUID teamId,
            @NotBlank(message = "Plan name is required")
            String planName,
            String sla,
            @Min(value = 0, message = "Monthly amount cannot be negative")
            Long monthlyAmountCents,
            String currency,
            LocalDate startsOn,
            LocalDate renewsOn,
            SupportSubscription.SubscriptionStatus status
    ) {}

    public record SubscriptionStatusRequest(
            @NotNull(message = "Subscription status is required")
            SupportSubscription.SubscriptionStatus status
    ) {}

    public record SupportRequestPayload(
            UUID supportSubscriptionId,
            UUID teamId,
            @NotBlank(message = "Support request title is required")
            String title,
            String description,
            SupportRequest.SupportPriority priority,
            SupportRequest.SupportStatus status,
            LocalDate dueOn
    ) {}

    public record SupportRequestStatusPayload(
            @NotNull(message = "Support request status is required")
            SupportRequest.SupportStatus status,
            String resolution
    ) {}

    public record ReputationEventRequest(
            UUID workspaceId,
            TeamReputationEvent.ReputationEventType eventType,
            @Min(value = 1, message = "Rating must be at least 1")
            @Max(value = 5, message = "Rating must be at most 5")
            Integer rating,
            String notes
    ) {}

    public record DisputeRequest(
            UUID teamId,
            @NotBlank(message = "Dispute title is required")
            String title,
            String description,
            DisputeCase.DisputeSeverity severity,
            DisputeCase.DisputeStatus status,
            LocalDate responseDueOn
    ) {}

    public record DisputeStatusRequest(
            @NotNull(message = "Dispute status is required")
            DisputeCase.DisputeStatus status,
            String resolution
    ) {}
}
