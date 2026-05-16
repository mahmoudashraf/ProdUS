package com.produs.cart;

import com.produs.catalog.ServiceModule;
import com.produs.catalog.ServiceModuleRepository;
import com.produs.entity.User;
import com.produs.experts.ExpertProfile;
import com.produs.experts.ExpertProfileRepository;
import com.produs.packages.PackageInstance;
import com.produs.packages.PackageInstanceRepository;
import com.produs.packages.PackageModule;
import com.produs.packages.PackageModuleRepository;
import com.produs.product.ProductProfile;
import com.produs.product.ProductProfileRepository;
import com.produs.shortlist.TeamShortlist;
import com.produs.shortlist.TeamShortlistRepository;
import com.produs.teams.Team;
import com.produs.teams.TeamMember;
import com.produs.teams.TeamMemberRepository;
import com.produs.teams.TeamRepository;
import com.produs.workspace.Milestone;
import com.produs.workspace.MilestoneRepository;
import com.produs.workspace.ProjectWorkspace;
import com.produs.workspace.ProjectWorkspaceRepository;
import com.produs.workspace.WorkspaceParticipant;
import com.produs.workspace.WorkspaceParticipantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductizationCartService {

    private final ProductizationCartRepository cartRepository;
    private final ProductizationCartServiceItemRepository serviceItemRepository;
    private final ProductizationCartTalentItemRepository talentItemRepository;
    private final ProductProfileRepository productProfileRepository;
    private final ServiceModuleRepository serviceModuleRepository;
    private final TeamRepository teamRepository;
    private final ExpertProfileRepository expertProfileRepository;
    private final PackageInstanceRepository packageRepository;
    private final PackageModuleRepository packageModuleRepository;
    private final ProjectWorkspaceRepository workspaceRepository;
    private final WorkspaceParticipantRepository participantRepository;
    private final MilestoneRepository milestoneRepository;
    private final TeamShortlistRepository shortlistRepository;
    private final TeamMemberRepository teamMemberRepository;

    @Transactional
    public ProductizationCart current(User owner) {
        return cartRepository.findFirstByOwnerIdAndStatusOrderByCreatedAtDesc(owner.getId(), ProductizationCart.CartStatus.DRAFT)
                .orElseGet(() -> createDraftCart(owner));
    }

    @Transactional
    public ProductizationCart update(User owner, CartUpdateRequest request) {
        ProductizationCart cart = current(owner);
        requireCartOwner(owner, cart);
        if (request.productProfileId() != null) {
            ProductProfile product = productProfileRepository.findById(request.productProfileId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found"));
            requireProductOwner(owner, product);
            cart.setProductProfile(product);
            if (cart.getTitle() == null || cart.getTitle().isBlank() || "Productization cart".equals(cart.getTitle())) {
                cart.setTitle(product.getName() + " productization plan");
            }
        }
        if (request.title() != null && !request.title().isBlank()) {
            cart.setTitle(request.title().trim());
        }
        if (request.businessGoal() != null) {
            cart.setBusinessGoal(request.businessGoal().trim());
        }
        return cartRepository.save(cart);
    }

    @Transactional
    public ProductizationCartServiceItem addService(User owner, ServiceItemRequest request) {
        ProductizationCart cart = current(owner);
        requireCartOwner(owner, cart);
        if (request.serviceModuleId() == null) {
            throw new IllegalArgumentException("Service module is required");
        }
        ServiceModule module = serviceModuleRepository.findById(request.serviceModuleId())
                .orElseThrow(() -> new IllegalArgumentException("Service module not found"));
        if (!module.isActive()) {
            throw new IllegalArgumentException("Service module is not active");
        }

        ProductizationCartServiceItem item = serviceItemRepository
                .findByCartIdAndServiceModuleId(cart.getId(), module.getId())
                .orElseGet(ProductizationCartServiceItem::new);
        item.setCart(cart);
        item.setServiceModule(module);
        item.setNotes(request.notes());
        if (item.getSequenceOrder() == null || item.getSequenceOrder() == 0) {
            item.setSequenceOrder((int) serviceItemRepository.countByCartId(cart.getId()) + 1);
        }
        return serviceItemRepository.save(item);
    }

    @Transactional
    public void removeService(User owner, UUID itemId) {
        ProductizationCartServiceItem item = serviceItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Cart service item not found"));
        requireCartOwner(owner, item.getCart());
        serviceItemRepository.delete(item);
    }

    @Transactional
    public ProductizationCartTalentItem addTalent(User owner, TalentItemRequest request) {
        ProductizationCart cart = current(owner);
        requireCartOwner(owner, cart);
        if (request.itemType() == ProductizationCartTalentItem.TalentItemType.TEAM) {
            if (request.teamId() == null) {
                throw new IllegalArgumentException("Team is required");
            }
            Team team = teamRepository.findByIdAndActiveTrue(request.teamId())
                    .orElseThrow(() -> new IllegalArgumentException("Team not found"));
            ProductizationCartTalentItem item = talentItemRepository
                    .findByCartIdAndTeamId(cart.getId(), team.getId())
                    .orElseGet(ProductizationCartTalentItem::new);
            item.setCart(cart);
            item.setItemType(ProductizationCartTalentItem.TalentItemType.TEAM);
            item.setTeam(team);
            item.setExpertProfile(null);
            item.setNotes(request.notes());
            return talentItemRepository.save(item);
        }
        if (request.itemType() == ProductizationCartTalentItem.TalentItemType.EXPERT) {
            if (request.expertProfileId() == null) {
                throw new IllegalArgumentException("Expert profile is required");
            }
            ExpertProfile expert = expertProfileRepository.findByIdAndActiveTrue(request.expertProfileId())
                    .orElseThrow(() -> new IllegalArgumentException("Expert profile not found"));
            ProductizationCartTalentItem item = talentItemRepository
                    .findByCartIdAndExpertProfileId(cart.getId(), expert.getId())
                    .orElseGet(ProductizationCartTalentItem::new);
            item.setCart(cart);
            item.setItemType(ProductizationCartTalentItem.TalentItemType.EXPERT);
            item.setTeam(null);
            item.setExpertProfile(expert);
            item.setNotes(request.notes());
            return talentItemRepository.save(item);
        }
        throw new IllegalArgumentException("Talent type is required");
    }

    @Transactional
    public void removeTalent(User owner, UUID itemId) {
        ProductizationCartTalentItem item = talentItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Cart talent item not found"));
        requireCartOwner(owner, item.getCart());
        talentItemRepository.delete(item);
    }

    @Transactional
    public ConversionResult convert(User owner, CartConvertRequest request) {
        ProductizationCart cart = current(owner);
        requireCartOwner(owner, cart);
        if (cart.getProductProfile() == null) {
            throw new IllegalArgumentException("Select a product before starting a project");
        }
        List<ProductizationCartServiceItem> services = services(cart);
        if (services.isEmpty()) {
            throw new IllegalArgumentException("Add at least one lifecycle service before starting a project");
        }

        PackageInstance packageInstance = new PackageInstance();
        packageInstance.setOwner(owner);
        packageInstance.setProductProfile(cart.getProductProfile());
        packageInstance.setName(cart.getTitle() == null || cart.getTitle().isBlank()
                ? cart.getProductProfile().getName() + " productization plan"
                : cart.getTitle());
        packageInstance.setSummary(buildSummary(cart, services));
        packageInstance.setStatus(PackageInstance.PackageStatus.AWAITING_TEAM);
        packageInstance = packageRepository.save(packageInstance);

        int order = 1;
        for (ProductizationCartServiceItem serviceItem : services) {
            ServiceModule module = serviceItem.getServiceModule();
            PackageModule packageModule = new PackageModule();
            packageModule.setPackageInstance(packageInstance);
            packageModule.setServiceModule(module);
            packageModule.setSequenceOrder(order++);
            packageModule.setRequired(true);
            packageModule.setRationale(serviceItem.getNotes() == null || serviceItem.getNotes().isBlank()
                    ? "Selected by the owner from the lifecycle service cart."
                    : serviceItem.getNotes());
            packageModule.setDeliverables(module.getExpectedDeliverables());
            packageModule.setAcceptanceCriteria(module.getAcceptanceCriteria());
            packageModuleRepository.save(packageModule);
        }

        ProjectWorkspace workspace = new ProjectWorkspace();
        workspace.setOwner(owner);
        workspace.setPackageInstance(packageInstance);
        workspace.setName(request.projectName() == null || request.projectName().isBlank()
                ? packageInstance.getName() + " workspace"
                : request.projectName().trim());
        workspace.setStatus(ProjectWorkspace.WorkspaceStatus.AWAITING_TEAM_PROPOSAL);
        workspace = workspaceRepository.save(workspace);

        ensureParticipant(workspace, owner, owner, WorkspaceParticipant.ParticipantRole.OWNER);
        List<ProductizationCartTalentItem> talent = talent(cart);
        for (ProductizationCartTalentItem talentItem : talent) {
            if (talentItem.getItemType() == ProductizationCartTalentItem.TalentItemType.TEAM && talentItem.getTeam() != null) {
                addTeamToProject(owner, packageInstance, workspace, talentItem.getTeam(), talentItem.getNotes());
            }
            if (talentItem.getItemType() == ProductizationCartTalentItem.TalentItemType.EXPERT && talentItem.getExpertProfile() != null) {
                ensureParticipant(workspace, talentItem.getExpertProfile().getUser(), owner, WorkspaceParticipant.ParticipantRole.SPECIALIST);
            }
        }
        createMilestones(workspace, services);

        cart.setStatus(ProductizationCart.CartStatus.CONVERTED);
        cart.setConvertedPackage(packageInstance);
        cart.setConvertedWorkspace(workspace);
        cartRepository.save(cart);
        return new ConversionResult(cart, services, talent, packageInstance, workspace);
    }

    public List<ProductizationCartServiceItem> services(ProductizationCart cart) {
        return serviceItemRepository.findByCartIdOrderBySequenceOrderAscCreatedAtAsc(cart.getId());
    }

    public List<ProductizationCartTalentItem> talent(ProductizationCart cart) {
        return talentItemRepository.findByCartIdOrderByCreatedAtAsc(cart.getId());
    }

    private ProductizationCart createDraftCart(User owner) {
        ProductizationCart cart = new ProductizationCart();
        cart.setOwner(owner);
        cart.setTitle("Productization cart");
        return cartRepository.save(cart);
    }

    private void addTeamToProject(User owner, PackageInstance packageInstance, ProjectWorkspace workspace, Team team, String notes) {
        TeamShortlist shortlist = shortlistRepository
                .findByOwnerIdAndPackageInstanceIdAndTeamId(owner.getId(), packageInstance.getId(), team.getId())
                .orElseGet(TeamShortlist::new);
        shortlist.setOwner(owner);
        shortlist.setPackageInstance(packageInstance);
        shortlist.setTeam(team);
        shortlist.setStatus(TeamShortlist.ShortlistStatus.ACTIVE);
        shortlist.setNotes(notes == null || notes.isBlank() ? "Selected in the productization cart before project start." : notes);
        shortlistRepository.save(shortlist);

        ensureParticipant(workspace, team.getManager(), owner, WorkspaceParticipant.ParticipantRole.TEAM_LEAD);
        teamMemberRepository.findByTeamIdOrderByCreatedAtAsc(team.getId()).stream()
                .filter(TeamMember::isActive)
                .forEach(member -> ensureParticipant(workspace, member.getUser(), owner, toParticipantRole(member.getRole())));
    }

    private WorkspaceParticipant.ParticipantRole toParticipantRole(TeamMember.MemberRole role) {
        if (role == TeamMember.MemberRole.LEAD || role == TeamMember.MemberRole.DELIVERY_MANAGER) {
            return WorkspaceParticipant.ParticipantRole.TEAM_LEAD;
        }
        if (role == TeamMember.MemberRole.ADVISOR) {
            return WorkspaceParticipant.ParticipantRole.ADVISOR;
        }
        return WorkspaceParticipant.ParticipantRole.SPECIALIST;
    }

    private void ensureParticipant(ProjectWorkspace workspace, User user, User addedBy, WorkspaceParticipant.ParticipantRole role) {
        WorkspaceParticipant participant = participantRepository.findByWorkspaceIdAndUserId(workspace.getId(), user.getId())
                .orElseGet(WorkspaceParticipant::new);
        participant.setWorkspace(workspace);
        participant.setUser(user);
        participant.setAddedBy(addedBy);
        participant.setRole(role);
        participant.setActive(true);
        participantRepository.save(participant);
    }

    private void createMilestones(ProjectWorkspace workspace, List<ProductizationCartServiceItem> services) {
        LocalDate startDate = LocalDate.now();
        int offset = 7;
        for (ProductizationCartServiceItem item : services) {
            ServiceModule module = item.getServiceModule();
            Milestone milestone = new Milestone();
            milestone.setWorkspace(workspace);
            milestone.setTitle(module.getName());
            milestone.setDescription(module.getExpectedDeliverables());
            milestone.setDueDate(startDate.plusDays(offset));
            milestoneRepository.save(milestone);
            offset += 7;
        }
    }

    private String buildSummary(ProductizationCart cart, List<ProductizationCartServiceItem> services) {
        String serviceNames = services.stream()
                .map(item -> item.getServiceModule().getName())
                .reduce((left, right) -> left + ", " + right)
                .orElse("selected lifecycle services");
        String goal = cart.getBusinessGoal() == null || cart.getBusinessGoal().isBlank()
                ? "Move the product toward production readiness."
                : cart.getBusinessGoal();
        return goal + " Selected services: " + serviceNames + ".";
    }

    private void requireCartOwner(User user, ProductizationCart cart) {
        if (user.getRole() == User.UserRole.ADMIN || cart.getOwner().getId().equals(user.getId())) {
            return;
        }
        throw new AccessDeniedException("Cart belongs to another owner");
    }

    private void requireProductOwner(User user, ProductProfile product) {
        if (user.getRole() == User.UserRole.ADMIN || product.getOwner().getId().equals(user.getId())) {
            return;
        }
        throw new AccessDeniedException("Product belongs to another owner");
    }

    public record CartUpdateRequest(UUID productProfileId, String title, String businessGoal) {}
    public record ServiceItemRequest(UUID serviceModuleId, String notes) {}
    public record TalentItemRequest(ProductizationCartTalentItem.TalentItemType itemType, UUID teamId, UUID expertProfileId, String notes) {}
    public record CartConvertRequest(String projectName) {}
    public record ConversionResult(
            ProductizationCart cart,
            List<ProductizationCartServiceItem> serviceItems,
            List<ProductizationCartTalentItem> talentItems,
            PackageInstance packageInstance,
            ProjectWorkspace workspace
    ) {}
}
