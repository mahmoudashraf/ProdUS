package com.produs.commerce;

import com.produs.dto.PlatformDtos.ContractAgreementResponse;
import com.produs.dto.PlatformDtos.InvoiceRecordResponse;
import com.produs.dto.PlatformDtos.QuoteProposalResponse;
import com.produs.dto.PlatformDtos.SupportSubscriptionResponse;
import com.produs.dto.PlatformDtos.TeamReputationEventResponse;
import com.produs.entity.User;
import com.produs.packages.PackageInstance;
import com.produs.packages.PackageInstanceRepository;
import com.produs.shared.BaseEntity;
import com.produs.teams.Team;
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
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

import static com.produs.dto.PlatformDtos.toContractAgreementResponse;
import static com.produs.dto.PlatformDtos.toInvoiceRecordResponse;
import static com.produs.dto.PlatformDtos.toQuoteProposalResponse;
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
    private final TeamReputationEventRepository reputationRepository;
    private final PackageInstanceRepository packageRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ProjectWorkspaceRepository workspaceRepository;

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
        return toQuoteProposalResponse(proposalRepository.save(proposal));
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
            return toQuoteProposalResponse(proposalRepository.save(proposal));
        }
        if (isPackageOwner(user, proposal.getPackageInstance())) {
            if (request.status() == QuoteProposal.ProposalStatus.OWNER_ACCEPTED
                    || request.status() == QuoteProposal.ProposalStatus.OWNER_REJECTED) {
                proposal.setStatus(request.status());
                return toQuoteProposalResponse(proposalRepository.save(proposal));
            }
        }
        if (isTeamManager(user, proposal.getTeam())) {
            if (request.status() == QuoteProposal.ProposalStatus.DRAFT
                    || request.status() == QuoteProposal.ProposalStatus.SUBMITTED
                    || request.status() == QuoteProposal.ProposalStatus.WITHDRAWN) {
                proposal.setStatus(request.status());
                return toQuoteProposalResponse(proposalRepository.save(proposal));
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
        return toContractAgreementResponse(contractRepository.save(contract));
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
        return toContractAgreementResponse(contractRepository.save(contract));
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
        return toInvoiceRecordResponse(invoiceRepository.save(invoice));
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
        return toInvoiceRecordResponse(invoiceRepository.save(invoice));
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
        return toSupportSubscriptionResponse(subscriptionRepository.save(subscription));
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
        return toSupportSubscriptionResponse(subscriptionRepository.save(subscription));
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

    private ProjectWorkspace resolveWorkspace(UUID workspaceId) {
        if (workspaceId == null) {
            return null;
        }
        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
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

    public record ReputationEventRequest(
            UUID workspaceId,
            TeamReputationEvent.ReputationEventType eventType,
            @Min(value = 1, message = "Rating must be at least 1")
            @Max(value = 5, message = "Rating must be at most 5")
            Integer rating,
            String notes
    ) {}
}
