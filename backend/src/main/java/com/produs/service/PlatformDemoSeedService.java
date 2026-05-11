package com.produs.service;

import com.produs.ai.AIRecommendation;
import com.produs.ai.AIRecommendationRepository;
import com.produs.catalog.ServiceCategory;
import com.produs.catalog.ServiceCategoryRepository;
import com.produs.catalog.ServiceDependency;
import com.produs.catalog.ServiceDependencyRepository;
import com.produs.catalog.ServiceModule;
import com.produs.catalog.ServiceModuleRepository;
import com.produs.commerce.QuoteProposal;
import com.produs.commerce.QuoteProposalRepository;
import com.produs.commerce.SupportRequest;
import com.produs.commerce.SupportRequestRepository;
import com.produs.commerce.SupportSubscription;
import com.produs.commerce.SupportSubscriptionRepository;
import com.produs.commerce.TeamReputationEvent;
import com.produs.commerce.TeamReputationEventRepository;
import com.produs.entity.User;
import com.produs.notifications.NotificationService;
import com.produs.notifications.PlatformNotification;
import com.produs.packages.PackageBuilderService;
import com.produs.packages.PackageInstance;
import com.produs.packages.PackageInstanceRepository;
import com.produs.packages.PackageModule;
import com.produs.packages.PackageModuleRepository;
import com.produs.product.ProductProfile;
import com.produs.product.ProductProfileRepository;
import com.produs.repository.UserRepository;
import com.produs.requirements.RequirementIntake;
import com.produs.requirements.RequirementIntakeRepository;
import com.produs.teams.Team;
import com.produs.teams.TeamCapability;
import com.produs.teams.TeamCapabilityRepository;
import com.produs.teams.TeamMember;
import com.produs.teams.TeamMemberRepository;
import com.produs.teams.TeamRepository;
import com.produs.workspace.Deliverable;
import com.produs.workspace.DeliverableRepository;
import com.produs.workspace.Milestone;
import com.produs.workspace.MilestoneRepository;
import com.produs.workspace.ProjectWorkspace;
import com.produs.workspace.ProjectWorkspaceRepository;
import com.produs.workspace.WorkspaceParticipant;
import com.produs.workspace.WorkspaceParticipantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@Profile("dev")
@RequiredArgsConstructor
public class PlatformDemoSeedService implements ApplicationRunner {

    private final UsersFeedService usersFeedService;
    private final UserRepository userRepository;
    private final ServiceCategoryRepository categoryRepository;
    private final ServiceModuleRepository moduleRepository;
    private final ServiceDependencyRepository dependencyRepository;
    private final ProductProfileRepository productRepository;
    private final RequirementIntakeRepository requirementRepository;
    private final PackageBuilderService packageBuilderService;
    private final PackageInstanceRepository packageRepository;
    private final PackageModuleRepository packageModuleRepository;
    private final TeamRepository teamRepository;
    private final TeamCapabilityRepository capabilityRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ProjectWorkspaceRepository workspaceRepository;
    private final WorkspaceParticipantRepository participantRepository;
    private final MilestoneRepository milestoneRepository;
    private final DeliverableRepository deliverableRepository;
    private final QuoteProposalRepository proposalRepository;
    private final SupportSubscriptionRepository supportSubscriptionRepository;
    private final SupportRequestRepository supportRequestRepository;
    private final TeamReputationEventRepository reputationRepository;
    private final AIRecommendationRepository recommendationRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        SeedSummary summary = feedDemoData();
        log.info(
                "Platform demo seed complete: {} categories, {} modules, {} products, {} packages, {} teams, {} workspaces",
                summary.categories(),
                summary.modules(),
                summary.products(),
                summary.packages(),
                summary.teams(),
                summary.workspaces()
        );
    }

    @Transactional
    public SeedSummary feedDemoData() {
        usersFeedService.feedUsersToDatabase();
        Map<String, ServiceCategory> categories = seedCatalogCategories();
        Map<String, ServiceModule> modules = seedCatalogModules(categories);
        seedDependencies(modules);
        List<Team> teams = seedTeams(categories, modules);
        seedAdminDemoData(modules, teams);

        return new SeedSummary(
                categoryRepository.count(),
                moduleRepository.count(),
                productRepository.count(),
                packageRepository.count(),
                teamRepository.count(),
                workspaceRepository.count()
        );
    }

    private Map<String, ServiceCategory> seedCatalogCategories() {
        List<CategorySeed> seeds = List.of(
                new CategorySeed("validation", "Validation", "Clear product readiness and confident next steps.", 1),
                new CategorySeed("code-rewrite-refactor", "Code Rewrite", "Modernize code so the product is easier to evolve.", 2),
                new CategorySeed("scaling", "Scaling", "Faster systems that stay efficient as usage grows.", 3),
                new CategorySeed("cloud-devops", "Cloud / DevOps", "Reliable delivery pipelines and production stability.", 4),
                new CategorySeed("database", "Database", "A safer data foundation with faster query performance.", 5),
                new CategorySeed("security", "Security", "Reduced risk and stronger trust across the product.", 6),
                new CategorySeed("launch-gtm-readiness", "Launch Readiness", "Core business flows are ready for a confident go-live.", 7),
                new CategorySeed("operations-support", "Operations / Support", "Stable product operations and quick issue recovery.", 8)
        );

        Set<String> seedSlugs = seeds.stream().map(CategorySeed::slug).collect(Collectors.toSet());
        Map<String, ServiceCategory> categories = new LinkedHashMap<>();
        for (CategorySeed seed : seeds) {
            ServiceCategory category = categoryRepository.findBySlug(seed.slug()).orElseGet(ServiceCategory::new);
            category.setName(seed.name());
            category.setSlug(seed.slug());
            category.setDescription(seed.description());
            category.setSortOrder(seed.sortOrder());
            category.setActive(true);
            categories.put(seed.slug(), categoryRepository.save(category));
        }
        categoryRepository.findAll().stream()
                .filter(category -> !seedSlugs.contains(category.getSlug()) && category.isActive())
                .forEach(category -> {
                    category.setActive(false);
                    categoryRepository.save(category);
                });
        return categories;
    }

    private Map<String, ServiceModule> seedCatalogModules(Map<String, ServiceCategory> categories) {
        List<ModuleSeed> seeds = List.of(
                new ModuleSeed("validation", "requirement-analysis", "Requirement analysis", "Turn vague product needs into a structured requirement brief and risk map.", "Requirement brief; risk map; recommended service package; open questions.", "Owner confirms product state, business goal, assumptions, and next services.", 1),
                new ModuleSeed("validation", "launch-readiness-review", "Launch readiness review", "Assess whether a SaaS product is ready for public launch or customer handoff.", "Launch readiness report; blockers; recommended milestone sequence.", "Report covers deployment, security, monitoring, backups, analytics, payments, support, and handoff.", 2),
                new ModuleSeed("code-rewrite-refactor", "backend-rewrite-refactor", "Backend rewrite/refactor", "Stabilize or rebuild backend modules that block production readiness.", "Refactored backend modules; API notes; migration and deployment notes.", "Backend paths are documented, tested, deployable, and do not regress core workflows.", 1),
                new ModuleSeed("code-rewrite-refactor", "frontend-rewrite-refactor", "Frontend rewrite/refactor", "Stabilize frontend architecture, screens, state, and release readiness.", "Refactored frontend flows; component cleanup; route and state notes.", "Core screens render without blocking errors and match agreed UX scope.", 2),
                new ModuleSeed("scaling", "performance-audit", "Performance audit", "Find bottlenecks across app, database, API, and hosting.", "Performance report; prioritized bottlenecks; remediation plan.", "Findings include evidence, impact, and remediation sequence.", 1),
                new ModuleSeed("cloud-devops", "cloud-deployment", "Cloud deployment", "Set up production/staging deployment with rollback and environment ownership.", "Production/staging environments; deployment notes; rollback process.", "Deployment can be repeated and rollback path is documented.", 1),
                new ModuleSeed("cloud-devops", "ci-cd-setup", "CI/CD setup", "Create a deploy pipeline and basic release checks.", "Pipeline configuration; required checks; release notes.", "Pipeline runs on agreed branch events and blocks release on failing checks.", 2),
                new ModuleSeed("cloud-devops", "monitoring-setup", "Monitoring setup", "Configure uptime, error, and operational monitoring for launch.", "Monitoring dashboard; alert rules; escalation notes.", "Alerts are configured for critical paths and response ownership is clear.", 3),
                new ModuleSeed("database", "database-redesign", "Database redesign", "Improve schema, migration strategy, query health, and data integrity.", "Schema changes; migration scripts; data integrity notes.", "Migration path is documented, reversible where practical, and validated.", 1),
                new ModuleSeed("database", "backup-restore", "Backup and restore", "Set backup policy and verify restore readiness.", "Backup schedule; restore runbook; verification evidence.", "Restore process is documented and tested against a non-production environment.", 2),
                new ModuleSeed("security", "auth-access-control-review", "Auth and access control review", "Review authentication, authorization, roles, sessions, and sensitive flows.", "Findings; remediation plan; launch security checklist.", "Findings are evidence-backed and no unsupported compliance certification is claimed.", 1),
                new ModuleSeed("security", "api-security-review", "API security review", "Review APIs, secrets, access control, and risky integrations.", "API security findings; prioritized fixes; verification notes.", "Critical API risks are documented with reproduction evidence or clear reasoning.", 2),
                new ModuleSeed("launch-gtm-readiness", "analytics-payments-onboarding-readiness", "Analytics, payments, and onboarding readiness", "Prepare operational launch workflows around analytics, payments, onboarding, and admin readiness.", "Launch checklist; tracking/payment/onboarding notes; admin readiness notes.", "Launch-critical business flows have owner-approved acceptance criteria and handoff notes.", 1),
                new ModuleSeed("operations-support", "support-package", "Support package", "Create ongoing support, monitoring, bug fixing, and incident response workflow.", "Support scope; SLA notes; monthly health report template; escalation path.", "Owner and team agree response expectations, support scope, known issues, and reporting format.", 1)
        );

        Map<String, ServiceModule> modules = new LinkedHashMap<>();
        for (ModuleSeed seed : seeds) {
            ServiceModule module = moduleRepository.findBySlug(seed.slug()).orElseGet(ServiceModule::new);
            module.setCategory(categories.get(seed.categorySlug()));
            module.setName(seed.name());
            module.setSlug(seed.slug());
            module.setDescription(seed.description());
            module.setExpectedDeliverables(seed.deliverables());
            module.setAcceptanceCriteria(seed.acceptanceCriteria());
            module.setTimelineRange("1-3 weeks");
            module.setPriceRange("$8K-$40K");
            module.setSortOrder(seed.sortOrder());
            module.setActive(true);
            modules.put(seed.slug(), moduleRepository.save(module));
        }
        return modules;
    }

    private void seedDependencies(Map<String, ServiceModule> modules) {
        List<DependencySeed> seeds = List.of(
                new DependencySeed("cloud-deployment", "ci-cd-setup", "Cloud deployment needs a repeatable CI/CD path."),
                new DependencySeed("cloud-deployment", "monitoring-setup", "Production deployment needs monitoring before handoff."),
                new DependencySeed("cloud-deployment", "backup-restore", "Live systems need restore readiness."),
                new DependencySeed("backend-rewrite-refactor", "database-redesign", "Backend rewrites often affect schema and migrations."),
                new DependencySeed("auth-access-control-review", "api-security-review", "Access control review should include API authorization risks."),
                new DependencySeed("analytics-payments-onboarding-readiness", "monitoring-setup", "Launch flows need operational visibility.")
        );
        Map<String, List<ServiceDependency>> existingBySource = dependencyRepository.findAll().stream()
                .collect(Collectors.groupingBy(dependency -> dependency.getSourceModule().getSlug()));
        for (DependencySeed seed : seeds) {
            boolean exists = existingBySource.getOrDefault(seed.sourceSlug(), List.of()).stream()
                    .anyMatch(dependency -> dependency.getDependsOnModule().getSlug().equals(seed.dependsOnSlug()));
            if (exists) {
                continue;
            }
            ServiceDependency dependency = new ServiceDependency();
            dependency.setSourceModule(modules.get(seed.sourceSlug()));
            dependency.setDependsOnModule(modules.get(seed.dependsOnSlug()));
            dependency.setReason(seed.reason());
            dependency.setRequired(true);
            dependencyRepository.save(dependency);
        }
    }

    private List<Team> seedTeams(Map<String, ServiceCategory> categories, Map<String, ServiceModule> modules) {
        User manager = user("team@produs.com");
        User specialist = user("specialist@produs.com");
        User advisor = user("advisor@produs.com");
        List<TeamSeed> seeds = List.of(
                new TeamSeed("CoreLedger Labs", "Payment orchestration, fraud controls, backend APIs, and compliance-ready delivery.", "San Francisco, CA", "Payments, backend, risk, compliance, API integrations", "$80K-$240K", Team.VerificationStatus.OPERATIONS_READY, List.of("analytics-payments-onboarding-readiness", "backend-rewrite-refactor", "api-security-review")),
                new TeamSeed("Northstar Engineers", "Secure backend and cloud systems for modern businesses.", "Austin, TX", "Backend, DevOps, security, reliability, PostgreSQL", "$60K-$180K", Team.VerificationStatus.SPECIALIST, List.of("backend-rewrite-refactor", "cloud-deployment", "ci-cd-setup", "database-redesign")),
                new TeamSeed("Pivotal Stack", "Full-stack delivery with risk, fraud, and QA experience.", "New York, NY", "Payments, frontend, QA, launch readiness", "$50K-$160K", Team.VerificationStatus.CERTIFIED, List.of("frontend-rewrite-refactor", "launch-readiness-review", "support-package")),
                new TeamSeed("Altura Engineering", "Disciplined infrastructure, scaling, and cost optimization.", "Chicago, IL", "Cloud, performance, monitoring, scaling", "$45K-$140K", Team.VerificationStatus.VERIFIED, List.of("performance-audit", "monitoring-setup", "cloud-deployment"))
        );

        Map<String, Team> existing = teamRepository.findAll().stream()
                .collect(Collectors.toMap(Team::getName, Function.identity(), (left, right) -> left));
        for (TeamSeed seed : seeds) {
            Team team = existing.getOrDefault(seed.name(), new Team());
            team.setManager(manager);
            team.setName(seed.name());
            team.setDescription(seed.description());
            team.setTimezone(seed.location());
            team.setCapabilitiesSummary(seed.capabilities());
            team.setTypicalProjectSize(seed.typicalProjectSize());
            team.setVerificationStatus(seed.status());
            team.setActive(true);
            team = teamRepository.save(team);
            ensureTeamMember(team, manager, TeamMember.MemberRole.LEAD);
            ensureTeamMember(team, specialist, TeamMember.MemberRole.SPECIALIST);
            ensureTeamMember(team, advisor, TeamMember.MemberRole.ADVISOR);
            for (String moduleSlug : seed.moduleSlugs()) {
                ServiceModule module = modules.get(moduleSlug);
                ensureCapability(team, module.getCategory(), module, "Verified delivery evidence for " + module.getName());
            }
            ensureCapability(team, categories.get("operations-support"), null, "Operational handoff and support coverage.");
        }
        return teamRepository.findByActiveTrueOrderByCreatedAtDesc();
    }

    private void seedAdminDemoData(Map<String, ServiceModule> modules, List<Team> teams) {
        User admin = user("admin@produs.com");
        User manager = user("team@produs.com");
        if (!productRepository.findByOwnerIdOrderByCreatedAtDesc(admin.getId()).isEmpty()) {
            return;
        }

        List<ProductSeed> products = List.of(
                new ProductSeed("Payments Hub", "Payment orchestration and settlement platform moving from prototype into governed delivery.", ProductProfile.BusinessStage.VALIDATED, "React, Node.js, PostgreSQL, Stripe, Kafka", "Release evidence gaps, data quality checks, and API contract risk.", "analytics-payments-onboarding-readiness", PackageInstance.PackageStatus.ACTIVE_DELIVERY),
                new ProductSeed("Analytics Pro", "AI-assisted analytics platform for business intelligence and data teams.", ProductProfile.BusinessStage.PROTOTYPE, "Next.js, Spring Boot, PostgreSQL, Redis", "Security scan and test coverage below launch threshold.", "backend-rewrite-refactor", PackageInstance.PackageStatus.MILESTONE_REVIEW),
                new ProductSeed("Customer Portal", "Self-service customer account and support experience.", ProductProfile.BusinessStage.VALIDATED, "React, Supabase, PostgreSQL, S3", "UAT feedback, frontend integration risk, and support runbook gaps.", "frontend-rewrite-refactor", PackageInstance.PackageStatus.AWAITING_TEAM),
                new ProductSeed("Billing Engine", "Recurring billing module for finance operations.", ProductProfile.BusinessStage.LIVE, "Java, PostgreSQL, Redis, Stripe", "Data migration dependencies and reconciliation evidence gaps.", "database-redesign", PackageInstance.PackageStatus.SCOPE_NEGOTIATION),
                new ProductSeed("Inventory Sync", "Supply-chain synchronization service for operational teams.", ProductProfile.BusinessStage.PROTOTYPE, "Go, PostgreSQL, AWS, Terraform", "API permissions, secrets handling, and environment readiness.", "api-security-review", PackageInstance.PackageStatus.SCOPE_NEGOTIATION)
        );

        for (int index = 0; index < products.size(); index++) {
            ProductSeed seed = products.get(index);
            ProductProfile product = createProduct(admin, seed);
            RequirementIntake requirement = createRequirement(product, modules.get(seed.moduleSlug()), seed);
            PackageInstance packageInstance = packageBuilderService.buildFromRequirement(admin, requirement.getId());
            packageInstance.setName(seed.name() + " package");
            packageInstance.setSummary("Governed productization package for " + seed.name() + " covering " + modules.get(seed.moduleSlug()).getName() + ".");
            packageInstance.setStatus(seed.packageStatus());
            packageInstance = packageRepository.save(packageInstance);
            tunePackageModules(packageInstance, index);
            Team team = teams.get(index % teams.size());
            createProposal(packageInstance, team, manager, index);
            ProjectWorkspace workspace = createWorkspace(admin, packageInstance, team, index);
            createSupport(admin, manager, team, workspace, index);
            createReputation(admin, team, workspace, index);
        }
        createRecommendation(admin);
        createAdminNotification(admin, manager);
    }

    private ProductProfile createProduct(User owner, ProductSeed seed) {
        ProductProfile product = new ProductProfile();
        product.setOwner(owner);
        product.setName(seed.name());
        product.setSummary(seed.summary());
        product.setBusinessStage(seed.stage());
        product.setTechStack(seed.techStack());
        product.setRiskProfile(seed.riskProfile());
        product.setProductUrl("https://example.com/" + seed.name().toLowerCase().replace(" ", "-"));
        product.setRepositoryUrl("https://github.com/example/" + seed.name().toLowerCase().replace(" ", "-"));
        return productRepository.save(product);
    }

    private RequirementIntake createRequirement(ProductProfile product, ServiceModule module, ProductSeed seed) {
        RequirementIntake requirement = new RequirementIntake();
        requirement.setProductProfile(product);
        requirement.setRequestedServiceModule(module);
        requirement.setBusinessGoal("Move " + seed.name() + " to production-ready delivery with evidence, owners, and clear milestones.");
        requirement.setCurrentProblems(seed.riskProfile());
        requirement.setConstraints("Keep core user workflows live while changes are validated in staging.");
        requirement.setRiskSignals("Security, CI/CD, data integrity, support handoff.");
        requirement.setRequirementBrief(seed.summary());
        requirement.setStatus(RequirementIntake.RequirementStatus.SUBMITTED);
        return requirementRepository.save(requirement);
    }

    private void tunePackageModules(PackageInstance packageInstance, int packageIndex) {
        List<PackageModule> modules = packageModuleRepository.findByPackageInstanceIdOrderBySequenceOrderAsc(packageInstance.getId());
        PackageModule.ModuleStatus[] statuses = {
                PackageModule.ModuleStatus.ACCEPTED,
                PackageModule.ModuleStatus.IN_PROGRESS,
                PackageModule.ModuleStatus.REVIEW,
                PackageModule.ModuleStatus.BLOCKED
        };
        for (int index = 0; index < modules.size(); index++) {
            PackageModule module = modules.get(index);
            module.setStatus(statuses[(index + packageIndex) % statuses.length]);
            packageModuleRepository.save(module);
        }
    }

    private QuoteProposal createProposal(PackageInstance packageInstance, Team team, User manager, int index) {
        QuoteProposal proposal = new QuoteProposal();
        proposal.setPackageInstance(packageInstance);
        proposal.setTeam(team);
        proposal.setSubmittedBy(manager);
        proposal.setTitle(team.getName() + " proposal for " + packageInstance.getProductProfile().getName());
        proposal.setScope("Deliver package milestones with weekly evidence review and owner checkpoints.");
        proposal.setAssumptions("Owner provides access to staging, repository, product analytics, and deployment accounts.");
        proposal.setTimelineDays(42 + index * 7);
        proposal.setCurrency("USD");
        proposal.setFixedPriceCents(9000000L + index * 1800000L);
        proposal.setPlatformFeeCents(900000L + index * 120000L);
        proposal.setStatus(index == 0 ? QuoteProposal.ProposalStatus.OWNER_ACCEPTED : QuoteProposal.ProposalStatus.SUBMITTED);
        return proposalRepository.save(proposal);
    }

    private ProjectWorkspace createWorkspace(User owner, PackageInstance packageInstance, Team team, int index) {
        ProjectWorkspace workspace = new ProjectWorkspace();
        workspace.setOwner(owner);
        workspace.setPackageInstance(packageInstance);
        workspace.setName(packageInstance.getProductProfile().getName() + " delivery");
        workspace.setStatus(index == 4 ? ProjectWorkspace.WorkspaceStatus.BLOCKED : ProjectWorkspace.WorkspaceStatus.ACTIVE_DELIVERY);
        workspace = workspaceRepository.save(workspace);
        ensureParticipant(workspace, owner, owner, WorkspaceParticipant.ParticipantRole.OWNER);
        ensureParticipant(workspace, team.getManager(), owner, WorkspaceParticipant.ParticipantRole.TEAM_LEAD);
        createMilestones(workspace, packageInstance, index);
        return workspace;
    }

    private void createMilestones(ProjectWorkspace workspace, PackageInstance packageInstance, int packageIndex) {
        List<PackageModule> packageModules = packageModuleRepository.findByPackageInstanceIdOrderBySequenceOrderAsc(packageInstance.getId());
        if (packageModules.isEmpty()) {
            return;
        }
        Milestone.MilestoneStatus[] statuses = {
                Milestone.MilestoneStatus.ACCEPTED,
                Milestone.MilestoneStatus.IN_PROGRESS,
                Milestone.MilestoneStatus.SUBMITTED,
                Milestone.MilestoneStatus.BLOCKED,
                Milestone.MilestoneStatus.PLANNED
        };
        LocalDate now = LocalDate.now();
        for (int index = 0; index < packageModules.size(); index++) {
            PackageModule packageModule = packageModules.get(index);
            Milestone milestone = new Milestone();
            milestone.setWorkspace(workspace);
            milestone.setTitle(packageModule.getServiceModule().getName());
            milestone.setDescription(packageModule.getDeliverables());
            milestone.setDueDate(now.plusDays(7L * (index + packageIndex + 1)));
            milestone.setStatus(statuses[(index + packageIndex) % statuses.length]);
            milestone = milestoneRepository.save(milestone);
            createDeliverable(milestone, "Evidence pack", packageModule.getAcceptanceCriteria(), index);
            createDeliverable(milestone, "Owner review notes", "Acceptance notes and decision log.", index + 1);
        }
    }

    private void createDeliverable(Milestone milestone, String title, String evidence, int index) {
        Deliverable deliverable = new Deliverable();
        deliverable.setMilestone(milestone);
        deliverable.setTitle(title);
        deliverable.setEvidence(evidence);
        deliverable.setStatus(index % 4 == 0 ? Deliverable.DeliverableStatus.ACCEPTED : Deliverable.DeliverableStatus.SUBMITTED);
        deliverableRepository.save(deliverable);
    }

    private void createSupport(User owner, User actor, Team team, ProjectWorkspace workspace, int index) {
        SupportSubscription subscription = new SupportSubscription();
        subscription.setWorkspace(workspace);
        subscription.setOwner(owner);
        subscription.setTeam(team);
        subscription.setCreatedBy(actor);
        subscription.setPlanName("Launch support");
        subscription.setSla("Critical response in 4 business hours; weekly health report.");
        subscription.setMonthlyAmountCents(1200000L + index * 150000L);
        subscription.setCurrency("USD");
        subscription.setStartsOn(LocalDate.now().minusDays(3));
        subscription.setRenewsOn(LocalDate.now().plusDays(27));
        subscription.setStatus(SupportSubscription.SubscriptionStatus.ACTIVE);
        subscription = supportSubscriptionRepository.save(subscription);

        SupportRequest request = new SupportRequest();
        request.setWorkspace(workspace);
        request.setSupportSubscription(subscription);
        request.setTeam(team);
        request.setOwner(owner);
        request.setOpenedBy(owner);
        request.setTitle(index % 2 == 0 ? "Release blocker review" : "Evidence gap follow-up");
        request.setDescription("Track support and delivery risks before the next owner checkpoint.");
        request.setPriority(index == 4 ? SupportRequest.SupportPriority.URGENT : SupportRequest.SupportPriority.HIGH);
        request.setStatus(index == 4 ? SupportRequest.SupportStatus.IN_PROGRESS : SupportRequest.SupportStatus.OPEN);
        request.setSlaStatus(index == 4 ? SupportRequest.SlaStatus.OVERDUE : SupportRequest.SlaStatus.ON_TRACK);
        request.setDueOn(LocalDate.now().plusDays(index - 1L));
        supportRequestRepository.save(request);
    }

    private void createReputation(User owner, Team team, ProjectWorkspace workspace, int index) {
        TeamReputationEvent event = new TeamReputationEvent();
        event.setTeam(team);
        event.setWorkspace(workspace);
        event.setCreatedBy(owner);
        event.setEventType(TeamReputationEvent.ReputationEventType.WORKSPACE_REVIEW);
        event.setRating(Math.max(4, 5 - index % 2));
        event.setVerified(true);
        event.setNotes("Owner-reviewed delivery evidence and response quality.");
        reputationRepository.save(event);
    }

    private void createRecommendation(User admin) {
        AIRecommendation recommendation = new AIRecommendation();
        recommendation.setCreatedBy(admin);
        recommendation.setRecommendationType("PORTFOLIO_HEALTH");
        recommendation.setSourceEntityType("PORTFOLIO");
        recommendation.setSourceEntityId(admin.getId().toString());
        recommendation.setPromptVersion("dev-demo-v1");
        recommendation.setConfidence(0.88);
        recommendation.setRationale("Portfolio is trending well. Focus on blocked API permissions, test coverage, and support handoff evidence.");
        recommendation.setOutputJson("{\"health\":68,\"focus\":[\"security\",\"ci_cd\",\"support_handoff\"]}");
        recommendationRepository.save(recommendation);
    }

    private void createAdminNotification(User admin, User actor) {
        notificationService.notify(
                admin,
                actor,
                PlatformNotification.NotificationType.SYSTEM,
                PlatformNotification.NotificationPriority.HIGH,
                "Demo workspace data ready",
                "Catalog, packages, teams, workspaces, support requests, and AI recommendations have been seeded for local UI review.",
                "/dashboard",
                "PLATFORM_DEMO_SEED",
                UUID.nameUUIDFromBytes("platform-demo-seed".getBytes()),
                null
        );
    }

    private void ensureTeamMember(Team team, User user, TeamMember.MemberRole role) {
        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(team.getId(), user.getId()).orElseGet(TeamMember::new);
        member.setTeam(team);
        member.setUser(user);
        member.setRole(role);
        member.setActive(true);
        teamMemberRepository.save(member);
    }

    private void ensureCapability(Team team, ServiceCategory category, ServiceModule module, String notes) {
        boolean exists = capabilityRepository.findByTeamId(team.getId()).stream()
                .anyMatch(capability ->
                        capability.getServiceCategory().getId().equals(category.getId())
                                && ((module == null && capability.getServiceModule() == null)
                                || (module != null && capability.getServiceModule() != null
                                && capability.getServiceModule().getId().equals(module.getId())))
                );
        if (exists) {
            return;
        }
        TeamCapability capability = new TeamCapability();
        capability.setTeam(team);
        capability.setServiceCategory(category);
        capability.setServiceModule(module);
        capability.setEvidenceUrl("https://docs.produs.local/evidence/" + team.getName().toLowerCase().replace(" ", "-"));
        capability.setNotes(notes);
        capabilityRepository.save(capability);
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

    private User user(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Missing dev user " + email));
    }

    public record SeedSummary(
            long categories,
            long modules,
            long products,
            long packages,
            long teams,
            long workspaces
    ) {}

    private record CategorySeed(String slug, String name, String description, int sortOrder) {}

    private record ModuleSeed(
            String categorySlug,
            String slug,
            String name,
            String description,
            String deliverables,
            String acceptanceCriteria,
            int sortOrder
    ) {}

    private record DependencySeed(String sourceSlug, String dependsOnSlug, String reason) {}

    private record TeamSeed(
            String name,
            String description,
            String location,
            String capabilities,
            String typicalProjectSize,
            Team.VerificationStatus status,
            List<String> moduleSlugs
    ) {}

    private record ProductSeed(
            String name,
            String summary,
            ProductProfile.BusinessStage stage,
            String techStack,
            String riskProfile,
            String moduleSlug,
            PackageInstance.PackageStatus packageStatus
    ) {}
}
