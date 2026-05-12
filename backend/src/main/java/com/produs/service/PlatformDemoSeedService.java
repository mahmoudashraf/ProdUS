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
import com.produs.shortlist.TeamShortlist;
import com.produs.shortlist.TeamShortlistRepository;
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
    private final TeamShortlistRepository shortlistRepository;
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
        seedOwnerDemoData(modules, teams);

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
                new ModuleSeed("validation", "requirement-analysis", "Requirement analysis", "Turn an early product idea or prototype into an implementation-ready brief with scope, risk, acceptance criteria, and evidence needs.", "Product summary, current workflow map, known blockers, target customer segment, repository or demo access.", "Requirement brief; capability map; risk register; recommended service package; open decision log.", "Owner confirms product state, business goal, assumptions, acceptance criteria, and next service sequence.", "3-5 business days", "$4K-$12K", 1),
                new ModuleSeed("validation", "launch-readiness-review", "Launch readiness review", "Assess whether a SaaS product is ready for customer rollout, paid beta, enterprise pilot, or public launch.", "Deployment URL, staging access, release checklist, analytics plan, support path, payment/onboarding flow notes.", "Launch readiness report; blockers; go/no-go decision; recommended milestone sequence.", "Report covers deployment, security, monitoring, backups, analytics, payments, support, and owner handoff.", "1-2 weeks", "$8K-$24K", 2),
                new ModuleSeed("code-rewrite-refactor", "backend-rewrite-refactor", "Backend rewrite/refactor", "Stabilize backend modules, APIs, jobs, and integration boundaries that block production reliability or maintainability.", "Repository access, API inventory, error logs, critical workflows, data model notes, deployment constraints.", "Refactored backend modules; API notes; migration and deployment notes; regression test evidence.", "Backend paths are documented, tested, deployable, observable, and do not regress core workflows.", "2-6 weeks", "$24K-$120K", 1),
                new ModuleSeed("code-rewrite-refactor", "frontend-rewrite-refactor", "Frontend rewrite/refactor", "Improve frontend architecture, state, page flows, role views, accessibility, and release readiness.", "Current routes, design references, component library notes, API contracts, browser targets, priority workflows.", "Refactored frontend flows; component cleanup; route/state notes; responsive QA evidence.", "Core screens render without blocking errors, connect to APIs, and match agreed role-specific UX scope.", "2-5 weeks", "$18K-$90K", 2),
                new ModuleSeed("scaling", "performance-audit", "Performance audit", "Find and prioritize bottlenecks across frontend rendering, backend APIs, database queries, queues, and hosting.", "Traffic assumptions, slow traces, logs, database metrics, hosting plan, top user journeys.", "Performance report; prioritized bottlenecks; benchmark evidence; remediation plan.", "Findings include reproduction steps, impact, tradeoffs, and a sequenced remediation path.", "1-3 weeks", "$10K-$45K", 1),
                new ModuleSeed("cloud-devops", "cloud-deployment", "Cloud deployment", "Set up production and staging deployment with environment ownership, secrets discipline, rollback, and release controls.", "Cloud account, domain, environment variables, build command, runtime requirements, rollback expectations.", "Production/staging environments; deployment notes; rollback process; runtime ownership matrix.", "Deployment can be repeated, observed, rolled back, and handed off without undocumented operator knowledge.", "1-4 weeks", "$12K-$80K", 1),
                new ModuleSeed("cloud-devops", "ci-cd-setup", "CI/CD setup", "Create a release pipeline with required checks, build artifacts, deployment gates, and failure feedback.", "Repository access, branch strategy, test commands, build commands, deployment target, secret policy.", "Pipeline configuration; required checks; release notes; failed-check triage guide.", "Pipeline runs on agreed branch events and blocks release on failing build, test, or security gates.", "1-3 weeks", "$8K-$40K", 2),
                new ModuleSeed("cloud-devops", "monitoring-setup", "Monitoring setup", "Configure uptime, error, logs, metrics, synthetic checks, and alert ownership for production operation.", "Critical paths, expected traffic, incident channels, alert destinations, existing telemetry.", "Monitoring dashboard; alert rules; escalation notes; monthly health report template.", "Alerts cover critical paths, include runbook context, and have accountable response ownership.", "1-3 weeks", "$8K-$45K", 3),
                new ModuleSeed("database", "database-redesign", "Database redesign", "Improve schema, migrations, query health, indexes, data integrity, and reporting foundations.", "Schema dump, high-volume queries, migration history, reporting needs, backup policy, data quality issues.", "Schema changes; migration scripts; query plan evidence; data integrity notes.", "Migration path is documented, validated, reversible where practical, and protects existing production data.", "2-6 weeks", "$20K-$110K", 1),
                new ModuleSeed("database", "backup-restore", "Backup and restore", "Set backup policy and verify restore readiness for production incidents, migrations, and recovery drills.", "Database provider access, RPO/RTO target, retention requirements, storage restrictions, restore environment.", "Backup schedule; restore runbook; recovery drill evidence; retention policy.", "Restore process is documented and tested against a non-production environment with measurable recovery timing.", "1-2 weeks", "$6K-$24K", 2),
                new ModuleSeed("security", "auth-access-control-review", "Auth and access control review", "Review authentication, authorization, roles, sessions, data boundaries, and sensitive workflows.", "Role matrix, auth provider setup, protected routes, API authorization logic, session policy, audit needs.", "Findings; remediation plan; launch security checklist; access-control test cases.", "Findings are evidence-backed, scoped to actual risk, and avoid unsupported compliance claims.", "1-3 weeks", "$12K-$55K", 1),
                new ModuleSeed("security", "api-security-review", "API security review", "Review APIs, secrets, webhook handling, rate limits, tenant boundaries, and risky integrations.", "OpenAPI/API inventory, environment variables, webhook providers, auth rules, recent incidents.", "API security findings; prioritized fixes; verification notes; hardening checklist.", "Critical API risks are documented with reproduction evidence or clear reasoning and mapped to fixes.", "1-4 weeks", "$14K-$70K", 2),
                new ModuleSeed("launch-gtm-readiness", "analytics-payments-onboarding-readiness", "Analytics, payments, and onboarding readiness", "Prepare operational launch workflows around activation, analytics, payments, onboarding, admin tooling, and customer handoff.", "Event taxonomy, payment provider access, onboarding flow, admin tasks, support policy, launch goals.", "Launch checklist; tracking/payment/onboarding notes; admin readiness notes; release acceptance criteria.", "Launch-critical business flows have owner-approved acceptance criteria, monitoring, and handoff notes.", "2-5 weeks", "$18K-$95K", 1),
                new ModuleSeed("operations-support", "support-package", "Support package", "Create ongoing support, monitoring, bug triage, incident response, and owner reporting workflow.", "Known issues, support inbox/channel, SLA expectations, monitoring links, deployment ownership.", "Support scope; SLA notes; incident response workflow; monthly health report template; escalation path.", "Owner and team agree response expectations, support scope, known issues, reporting format, and escalation owners.", "Ongoing", "$6K-$25K/mo", 1)
        );

        Map<String, ServiceModule> modules = new LinkedHashMap<>();
        for (ModuleSeed seed : seeds) {
            ServiceModule module = moduleRepository.findBySlug(seed.slug()).orElseGet(ServiceModule::new);
            module.setCategory(categories.get(seed.categorySlug()));
            module.setName(seed.name());
            module.setSlug(seed.slug());
            module.setDescription(seed.description());
            module.setRequiredInputs(seed.requiredInputs());
            module.setExpectedDeliverables(seed.deliverables());
            module.setAcceptanceCriteria(seed.acceptanceCriteria());
            module.setTimelineRange(seed.timelineRange());
            module.setPriceRange(seed.priceRange());
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

    private void seedOwnerDemoData(Map<String, ServiceModule> modules, List<Team> teams) {
        User admin = user("admin@produs.com");
        User owner = user("owner@produs.com");
        User manager = user("team@produs.com");
        User specialist = user("specialist@produs.com");
        User advisor = user("advisor@produs.com");
        List<ProductSeed> products = List.of(
                new ProductSeed("Payments Hub", "Payment orchestration and settlement platform moving from prototype into governed delivery for merchant onboarding, payout reconciliation, and risk review.", ProductProfile.BusinessStage.VALIDATED, "React, Node.js, PostgreSQL, Stripe, Kafka", "Release evidence gaps, data quality checks, settlement reconciliation, and API contract risk.", "analytics-payments-onboarding-readiness", PackageInstance.PackageStatus.ACTIVE_DELIVERY),
                new ProductSeed("Analytics Pro", "AI-assisted analytics platform for business intelligence teams that need reliable ingestion, governed dashboards, and customer-facing reporting.", ProductProfile.BusinessStage.PROTOTYPE, "Next.js, Spring Boot, PostgreSQL, Redis", "Security scan findings, ingestion retry gaps, and test coverage below launch threshold.", "backend-rewrite-refactor", PackageInstance.PackageStatus.MILESTONE_REVIEW),
                new ProductSeed("Customer Portal", "Self-service customer account and support experience for profile updates, billing visibility, ticket tracking, and onboarding tasks.", ProductProfile.BusinessStage.VALIDATED, "React, Supabase, PostgreSQL, S3", "UAT feedback, frontend integration risk, accessibility fixes, and support runbook gaps.", "frontend-rewrite-refactor", PackageInstance.PackageStatus.AWAITING_TEAM),
                new ProductSeed("Billing Engine", "Recurring billing module for finance operations with subscription lifecycle, invoicing, proration, and revenue reporting.", ProductProfile.BusinessStage.LIVE, "Java, PostgreSQL, Redis, Stripe", "Data migration dependencies, invoice reconciliation evidence gaps, and rollback planning.", "database-redesign", PackageInstance.PackageStatus.SCOPE_NEGOTIATION),
                new ProductSeed("Inventory Sync", "Supply-chain synchronization service that keeps warehouse, marketplace, and operations systems aligned across API boundaries.", ProductProfile.BusinessStage.PROTOTYPE, "Go, PostgreSQL, AWS, Terraform", "API permissions, secrets handling, environment readiness, and external dependency ownership.", "api-security-review", PackageInstance.PackageStatus.SCOPE_NEGOTIATION)
        );

        Map<String, ProductProfile> existingProducts = productRepository.findByOwnerIdOrderByCreatedAtDesc(owner.getId()).stream()
                .collect(Collectors.toMap(ProductProfile::getName, Function.identity(), (left, right) -> left));
        for (int index = 0; index < products.size(); index++) {
            ProductSeed seed = products.get(index);
            ProductProfile product = upsertProduct(owner, seed, existingProducts);
            RequirementIntake requirement = upsertRequirement(product, modules.get(seed.moduleSlug()), seed);
            PackageInstance packageInstance = upsertPackage(owner, requirement, seed, modules.get(seed.moduleSlug()));
            packageInstance.setStatus(seed.packageStatus());
            packageInstance = packageRepository.save(packageInstance);
            tunePackageModules(packageInstance, index);
            Team team = teams.get(index % teams.size());
            upsertProposal(packageInstance, team, manager, index);
            createShortlist(owner, packageInstance, team, index);
            ProjectWorkspace workspace = upsertWorkspace(owner, packageInstance, team, specialist, advisor, index);
            upsertSupport(owner, manager, team, workspace, index);
            upsertReputation(owner, team, workspace, index);
        }
        createRecommendation(
                admin,
                "ADMIN_OPERATIONS",
                "PLATFORM",
                admin.getId().toString(),
                "Platform is seeded for admin control. Review catalog coverage, notification delivery, SLA escalations, and team supply."
        );
        createRecommendation(
                owner,
                "OWNER_PRODUCTIZATION",
                "PORTFOLIO",
                owner.getId().toString(),
                "Your productization queue is trending well. Focus on package evidence, shortlisted teams, and launch-critical security and CI/CD services."
        );
        createAdminNotification(admin, manager);
    }

    private ProductProfile upsertProduct(User owner, ProductSeed seed, Map<String, ProductProfile> existingProducts) {
        ProductProfile product = existingProducts.getOrDefault(seed.name(), new ProductProfile());
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

    private RequirementIntake upsertRequirement(ProductProfile product, ServiceModule module, ProductSeed seed) {
        RequirementIntake requirement = requirementRepository.findByProductProfileOwnerIdOrderByCreatedAtDesc(product.getOwner().getId()).stream()
                .filter(item -> item.getProductProfile().getId().equals(product.getId()))
                .filter(item -> item.getRequestedServiceModule() != null && item.getRequestedServiceModule().getId().equals(module.getId()))
                .findFirst()
                .orElseGet(RequirementIntake::new);
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

    private PackageInstance upsertPackage(User owner, RequirementIntake requirement, ProductSeed seed, ServiceModule module) {
        PackageInstance packageInstance = packageRepository.findByOwnerIdOrderByCreatedAtDesc(owner.getId()).stream()
                .filter(item -> item.getProductProfile().getId().equals(requirement.getProductProfile().getId()))
                .findFirst()
                .orElse(null);
        if (packageInstance == null) {
            packageInstance = packageBuilderService.buildFromRequirement(owner, requirement.getId());
        }
        packageInstance.setOwner(owner);
        packageInstance.setProductProfile(requirement.getProductProfile());
        packageInstance.setRequirementIntake(requirement);
        packageInstance.setName(seed.name() + " production package");
        packageInstance.setSummary("Governed productization package for " + seed.name()
                + ": " + module.getName()
                + " with dependency-aware milestones, evidence checkpoints, team selection, and support handoff.");
        requirement.setStatus(RequirementIntake.RequirementStatus.PACKAGE_RECOMMENDED);
        requirementRepository.save(requirement);
        return packageRepository.save(packageInstance);
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
            module.setRationale(index == 0
                    ? "Primary service selected from the owner intake and product risk profile."
                    : "Dependency required to make the package production-ready instead of a one-off task.");
            module.setDeliverables(module.getServiceModule().getExpectedDeliverables()
                    + " Evidence must include owner-readable notes, links to implementation artifacts, and pass/fail acceptance status.");
            module.setAcceptanceCriteria(module.getServiceModule().getAcceptanceCriteria()
                    + " The owner can approve, reject, or request changes from evidence in the workspace.");
            packageModuleRepository.save(module);
        }
    }

    private QuoteProposal upsertProposal(PackageInstance packageInstance, Team team, User manager, int index) {
        QuoteProposal proposal = proposalRepository.findByPackageInstanceIdOrderByCreatedAtDesc(packageInstance.getId()).stream()
                .filter(item -> item.getTeam().getId().equals(team.getId()))
                .findFirst()
                .orElseGet(QuoteProposal::new);
        proposal.setPackageInstance(packageInstance);
        proposal.setTeam(team);
        proposal.setSubmittedBy(manager);
        proposal.setTitle(team.getName() + " proposal for " + packageInstance.getProductProfile().getName());
        proposal.setScope("Deliver the service package through milestone-based implementation, weekly evidence review, deployment checks, and owner approval gates.");
        proposal.setAssumptions("Owner provides staging access, repository access, product analytics, deployment accounts, and one accountable decision owner per milestone.");
        proposal.setTimelineDays(42 + index * 7);
        proposal.setCurrency("USD");
        proposal.setFixedPriceCents(9000000L + index * 1800000L);
        proposal.setPlatformFeeCents(900000L + index * 120000L);
        proposal.setStatus(index == 0 ? QuoteProposal.ProposalStatus.OWNER_ACCEPTED : QuoteProposal.ProposalStatus.SUBMITTED);
        return proposalRepository.save(proposal);
    }

    private void createShortlist(User owner, PackageInstance packageInstance, Team team, int index) {
        TeamShortlist shortlist = shortlistRepository.findByOwnerIdAndPackageInstanceIdAndTeamId(owner.getId(), packageInstance.getId(), team.getId())
                .orElseGet(TeamShortlist::new);
        shortlist.setOwner(owner);
        shortlist.setPackageInstance(packageInstance);
        shortlist.setTeam(team);
        shortlist.setStatus(index == 0 ? TeamShortlist.ShortlistStatus.REQUESTED_PROPOSAL : TeamShortlist.ShortlistStatus.ACTIVE);
        shortlist.setNotes("Seeded from package fit, verified capability evidence, and delivery reputation.");
        shortlistRepository.save(shortlist);
    }

    private ProjectWorkspace upsertWorkspace(User owner, PackageInstance packageInstance, Team team, User specialist, User advisor, int index) {
        ProjectWorkspace workspace = workspaceRepository.findByOwnerIdOrderByCreatedAtDesc(owner.getId()).stream()
                .filter(item -> item.getPackageInstance().getId().equals(packageInstance.getId()))
                .findFirst()
                .orElseGet(ProjectWorkspace::new);
        workspace.setOwner(owner);
        workspace.setPackageInstance(packageInstance);
        workspace.setName(packageInstance.getProductProfile().getName() + " delivery");
        workspace.setStatus(index == 4 ? ProjectWorkspace.WorkspaceStatus.BLOCKED : ProjectWorkspace.WorkspaceStatus.ACTIVE_DELIVERY);
        workspace = workspaceRepository.save(workspace);
        ensureParticipant(workspace, owner, owner, WorkspaceParticipant.ParticipantRole.OWNER);
        ensureParticipant(workspace, team.getManager(), owner, WorkspaceParticipant.ParticipantRole.TEAM_LEAD);
        ensureParticipant(workspace, specialist, owner, WorkspaceParticipant.ParticipantRole.SPECIALIST);
        ensureParticipant(workspace, advisor, owner, WorkspaceParticipant.ParticipantRole.ADVISOR);
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
        Map<String, Milestone> existingMilestones = milestoneRepository.findByWorkspaceIdOrderByCreatedAtAsc(workspace.getId()).stream()
                .collect(Collectors.toMap(Milestone::getTitle, Function.identity(), (left, right) -> left));
        for (int index = 0; index < packageModules.size(); index++) {
            PackageModule packageModule = packageModules.get(index);
            Milestone milestone = existingMilestones.getOrDefault(packageModule.getServiceModule().getName(), new Milestone());
            milestone.setWorkspace(workspace);
            milestone.setTitle(packageModule.getServiceModule().getName());
            milestone.setDescription(packageModule.getDeliverables());
            milestone.setDueDate(now.plusDays(7L * (index + packageIndex + 1)));
            milestone.setStatus(statuses[(index + packageIndex) % statuses.length]);
            milestone = milestoneRepository.save(milestone);
            upsertDeliverable(milestone, "Evidence pack", packageModule.getAcceptanceCriteria(), index);
            upsertDeliverable(milestone, "Owner review notes", "Acceptance notes, tradeoffs, and decision log for the milestone.", index + 1);
        }
    }

    private void upsertDeliverable(Milestone milestone, String title, String evidence, int index) {
        Deliverable deliverable = deliverableRepository.findByMilestoneIdOrderByCreatedAtAsc(milestone.getId()).stream()
                .filter(item -> item.getTitle().equals(title))
                .findFirst()
                .orElseGet(Deliverable::new);
        deliverable.setMilestone(milestone);
        deliverable.setTitle(title);
        deliverable.setEvidence(evidence);
        deliverable.setStatus(index % 4 == 0 ? Deliverable.DeliverableStatus.ACCEPTED : Deliverable.DeliverableStatus.SUBMITTED);
        deliverableRepository.save(deliverable);
    }

    private void upsertSupport(User owner, User actor, Team team, ProjectWorkspace workspace, int index) {
        SupportSubscription subscription = supportSubscriptionRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspace.getId()).stream()
                .findFirst()
                .orElseGet(SupportSubscription::new);
        subscription.setWorkspace(workspace);
        subscription.setOwner(owner);
        subscription.setTeam(team);
        subscription.setCreatedBy(actor);
        subscription.setPlanName("Production launch support");
        subscription.setSla("Critical response in 4 business hours; high priority response in 1 business day; weekly health report.");
        subscription.setMonthlyAmountCents(1200000L + index * 150000L);
        subscription.setCurrency("USD");
        subscription.setStartsOn(LocalDate.now().minusDays(3));
        subscription.setRenewsOn(LocalDate.now().plusDays(27));
        subscription.setStatus(SupportSubscription.SubscriptionStatus.ACTIVE);
        subscription = supportSubscriptionRepository.save(subscription);

        SupportRequest request = supportRequestRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspace.getId()).stream()
                .findFirst()
                .orElseGet(SupportRequest::new);
        request.setWorkspace(workspace);
        request.setSupportSubscription(subscription);
        request.setTeam(team);
        request.setOwner(owner);
        request.setOpenedBy(owner);
        request.setTitle(index % 2 == 0 ? "Release blocker review" : "Evidence gap follow-up");
        request.setDescription("Track production-readiness risk before the next owner checkpoint, including evidence, owner decision, and response owner.");
        request.setPriority(index == 4 ? SupportRequest.SupportPriority.URGENT : SupportRequest.SupportPriority.HIGH);
        request.setStatus(index == 4 ? SupportRequest.SupportStatus.IN_PROGRESS : SupportRequest.SupportStatus.OPEN);
        request.setSlaStatus(index == 4 ? SupportRequest.SlaStatus.OVERDUE : SupportRequest.SlaStatus.ON_TRACK);
        request.setDueOn(LocalDate.now().plusDays(index - 1L));
        supportRequestRepository.save(request);
    }

    private void upsertReputation(User owner, Team team, ProjectWorkspace workspace, int index) {
        TeamReputationEvent event = reputationRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspace.getId()).stream()
                .filter(item -> item.getTeam().getId().equals(team.getId()))
                .findFirst()
                .orElseGet(TeamReputationEvent::new);
        event.setTeam(team);
        event.setWorkspace(workspace);
        event.setCreatedBy(owner);
        event.setEventType(TeamReputationEvent.ReputationEventType.WORKSPACE_REVIEW);
        event.setRating(Math.max(4, 5 - index % 2));
        event.setVerified(true);
        event.setNotes("Owner-reviewed delivery evidence, milestone response quality, and production handoff discipline.");
        reputationRepository.save(event);
    }

    private void createRecommendation(User user, String type, String sourceEntityType, String sourceEntityId, String rationale) {
        AIRecommendation recommendation = recommendationRepository.findBySourceEntityTypeAndSourceEntityIdOrderByCreatedAtDesc(sourceEntityType, sourceEntityId).stream()
                .filter(item -> item.getCreatedBy().getId().equals(user.getId()))
                .filter(item -> type.equals(item.getRecommendationType()))
                .findFirst()
                .orElseGet(AIRecommendation::new);
        recommendation.setCreatedBy(user);
        recommendation.setRecommendationType(type);
        recommendation.setSourceEntityType(sourceEntityType);
        recommendation.setSourceEntityId(sourceEntityId);
        recommendation.setPromptVersion("dev-demo-v1");
        recommendation.setConfidence(0.88);
        recommendation.setRationale(rationale);
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
            String requiredInputs,
            String deliverables,
            String acceptanceCriteria,
            String timelineRange,
            String priceRange,
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
