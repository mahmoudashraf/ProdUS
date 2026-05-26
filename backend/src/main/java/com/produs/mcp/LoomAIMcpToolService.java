package com.produs.mcp;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.catalog.PackageTemplate;
import com.produs.catalog.PackageTemplateModuleRepository;
import com.produs.catalog.PackageTemplateRepository;
import com.produs.catalog.ServiceCategory;
import com.produs.catalog.ServiceCategoryRepository;
import com.produs.catalog.ServiceDependency;
import com.produs.catalog.ServiceDependencyRepository;
import com.produs.catalog.ServiceModule;
import com.produs.catalog.ServiceModuleRepository;
import com.produs.packages.PackageInstance;
import com.produs.packages.PackageInstanceRepository;
import com.produs.packages.PackageModule;
import com.produs.packages.PackageModuleRepository;
import com.produs.product.AiAssistedProductCreationService;
import com.produs.product.ProductProfile;
import com.produs.product.ProductProfileRepository;
import com.produs.scanner.NormalizedFinding;
import com.produs.scanner.NormalizedFindingRepository;
import com.produs.scanner.ScanRun;
import com.produs.scanner.ScanRunRepository;
import com.produs.scanner.ScannerEvidenceItem;
import com.produs.scanner.ScannerEvidenceItemRepository;
import com.produs.workspace.Deliverable;
import com.produs.workspace.DeliverableRepository;
import com.produs.workspace.Milestone;
import com.produs.workspace.MilestoneRepository;
import com.produs.workspace.ProjectWorkspace;
import com.produs.workspace.ProjectWorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.temporal.TemporalAccessor;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class LoomAIMcpToolService {

    private static final int DEFAULT_LIMIT = 10;
    private static final int MAX_LIMIT = 25;
    private static final int TEXT_LIMIT = 600;

    private final ServiceCategoryRepository categoryRepository;
    private final ServiceModuleRepository moduleRepository;
    private final ServiceDependencyRepository dependencyRepository;
    private final PackageTemplateRepository packageTemplateRepository;
    private final PackageTemplateModuleRepository packageTemplateModuleRepository;
    private final ProductProfileRepository productRepository;
    private final PackageInstanceRepository packageRepository;
    private final PackageModuleRepository packageModuleRepository;
    private final ProjectWorkspaceRepository workspaceRepository;
    private final MilestoneRepository milestoneRepository;
    private final DeliverableRepository deliverableRepository;
    private final ScanRunRepository scanRunRepository;
    private final NormalizedFindingRepository findingRepository;
    private final ScannerEvidenceItemRepository evidenceRepository;
    private final AiAssistedProductCreationService aiAssistedProductCreationService;
    private final ObjectMapper objectMapper;

    @Transactional
    public Map<String, Object> call(String toolName, Map<String, Object> arguments) {
        Map<String, Object> args = arguments == null ? Map.of() : arguments;
        return switch (toolName) {
            case "produs.catalog.search" -> catalogSearch(args);
            case "produs.product.list" -> productList(args);
            case "produs.package.inspect" -> packageInspect(args);
            case "produs.workspace.inspect" -> workspaceInspect(args);
            case "produs.productization_project.create" -> aiAssistedProductCreationService.createFromMcpAction(args);
            case "produs.scan.status" -> scanStatus(args);
            case "produs.finding.inspect" -> findingInspect(args);
            case "produs.evidence.list" -> evidenceList(args);
            case "produs.milestone.review_evidence" -> milestoneReviewEvidence(args);
            default -> error("UNSUPPORTED_TOOL", "Tool is not supported by the ProdUS MCP read adapter: " + safe(toolName));
        };
    }

    public Map<String, Object> toMcpResult(Map<String, Object> payload) {
        Map<String, Object> result = new LinkedHashMap<>();
        boolean hasErrors = payload.containsKey("errors");
        result.put("isError", hasErrors);
        result.put("structuredContent", payload);
        result.put("content", List.of(Map.of(
                "type", "text",
                "text", writeJson(payload)
        )));
        return result;
    }

    private Map<String, Object> catalogSearch(Map<String, Object> args) {
        String query = textArg(args, "query", "q", "search");
        String categorySlug = textArg(args, "categorySlug", "category", "category_slug");
        String layer = textArg(args, "serviceLayer", "layer", "service_layer");
        int limit = limit(args);
        String needle = normalize(query);

        List<Map<String, Object>> categories = categoryRepository.findByActiveTrueOrderBySortOrderAscNameAsc().stream()
                .filter(category -> matchesAny(needle, category.getName(), category.getSlug(), category.getDescription()))
                .limit(limit)
                .map(this::categorySummary)
                .toList();

        Stream<ServiceModule> moduleStream = moduleRepository.findByActiveTrueAndVisibleTrueOrderBySortOrderAscNameAsc().stream();
        if (hasText(categorySlug)) {
            String normalizedCategory = normalize(categorySlug);
            moduleStream = moduleStream.filter(module -> module.getCategory() != null
                    && (normalize(module.getCategory().getSlug()).equals(normalizedCategory)
                    || normalize(module.getCategory().getName()).equals(normalizedCategory)));
        }
        if (hasText(layer)) {
            String normalizedLayer = normalize(layer);
            moduleStream = moduleStream.filter(module -> normalize(module.getServiceLayer()).equals(normalizedLayer));
        }
        List<Map<String, Object>> modules = moduleStream
                .filter(module -> matchesModule(needle, module))
                .limit(limit)
                .map(this::moduleSummary)
                .toList();

        List<UUID> moduleIds = modules.stream()
                .map(item -> parseUuid(String.valueOf(item.get("id"))))
                .flatMap(Optional::stream)
                .toList();
        List<Map<String, Object>> dependencies = moduleIds.isEmpty()
                ? dependencyRepository.findAll().stream()
                .filter(dependency -> matchesAny(needle,
                        dependency.getSourceModule().getName(),
                        dependency.getDependsOnModule().getName(),
                        dependency.getReason(),
                        dependency.getMessage()))
                .limit(limit)
                .map(this::dependencySummary)
                .toList()
                : dependencyRepository.findBySourceModuleIdIn(moduleIds).stream()
                .limit(limit)
                .map(this::dependencySummary)
                .toList();

        List<Map<String, Object>> templates = packageTemplateRepository.findByActiveTrueOrderBySortOrderAscNameAsc().stream()
                .filter(template -> matchesAny(needle,
                        template.getName(),
                        template.getSlug(),
                        template.getDescription(),
                        template.getOutcomeSummary(),
                        template.getCustomerFit()))
                .limit(limit)
                .map(this::packageTemplateSummary)
                .toList();

        Map<String, Object> response = ok("produs.catalog.search");
        response.put("query", safe(query));
        response.put("counts", Map.of(
                "categories", categories.size(),
                "modules", modules.size(),
                "dependencies", dependencies.size(),
                "packageTemplates", templates.size()
        ));
        response.put("summary", catalogSummary(categories, modules, templates));
        response.put("highlights", Map.of(
                "categories", names(categories),
                "modules", names(modules),
                "packageTemplates", names(templates)
        ));
        response.put("categories", categories);
        response.put("modules", modules);
        response.put("dependencies", dependencies);
        response.put("packageTemplates", templates);
        return response;
    }

    private Map<String, Object> productList(Map<String, Object> args) {
        String query = textArg(args, "query", "q", "search");
        String needle = normalize(query);
        int limit = limit(args);
        List<Map<String, Object>> products = productRepository.findAll().stream()
                .sorted(Comparator.comparing(ProductProfile::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .filter(product -> matchesAny(needle, product.getName(), product.getSummary(), product.getTechStack(), product.getRiskProfile()))
                .limit(limit)
                .map(this::productSummary)
                .toList();
        Map<String, Object> response = ok("produs.product.list");
        response.put("products", products);
        response.put("count", products.size());
        return response;
    }

    private Map<String, Object> packageInspect(Map<String, Object> args) {
        Optional<PackageInstance> packageInstance = findByIdOrName(
                packageRepository.findAll().stream(),
                args,
                PackageInstance::getId,
                PackageInstance::getName,
                "packageId",
                "package_id",
                "id",
                "name",
                "packageName"
        );
        if (packageInstance.isEmpty()) {
            return error("PACKAGE_NOT_FOUND", "No package matched the supplied package identifier.");
        }
        PackageInstance pkg = packageInstance.get();
        List<Map<String, Object>> modules = packageModuleRepository.findByPackageInstanceIdOrderBySequenceOrderAsc(pkg.getId()).stream()
                .map(this::packageModuleSummary)
                .toList();
        Map<String, Object> response = ok("produs.package.inspect");
        response.put("package", packageSummary(pkg));
        response.put("modules", modules);
        return response;
    }

    private Map<String, Object> workspaceInspect(Map<String, Object> args) {
        Optional<ProjectWorkspace> workspace = findByIdOrName(
                workspaceRepository.findAll().stream(),
                args,
                ProjectWorkspace::getId,
                ProjectWorkspace::getName,
                "workspaceId",
                "workspace_id",
                "id",
                "name",
                "workspaceName"
        );
        if (workspace.isEmpty()) {
            return error("WORKSPACE_NOT_FOUND", "No workspace matched the supplied workspace identifier.");
        }
        ProjectWorkspace value = workspace.get();
        List<Map<String, Object>> milestones = milestoneRepository.findByWorkspaceIdOrderByCreatedAtAsc(value.getId()).stream()
                .map(milestone -> {
                    Map<String, Object> item = milestoneSummary(milestone);
                    item.put("deliverables", deliverableRepository.findByMilestoneIdOrderByCreatedAtAsc(milestone.getId()).stream()
                            .map(this::deliverableSummary)
                            .toList());
                    return item;
                })
                .toList();
        Map<String, Object> response = ok("produs.workspace.inspect");
        response.put("workspace", workspaceSummary(value));
        response.put("package", packageSummary(value.getPackageInstance()));
        response.put("milestones", milestones);
        return response;
    }

    private Map<String, Object> scanStatus(Map<String, Object> args) {
        int limit = limit(args);
        Optional<UUID> runId = uuidArg(args, "scanRunId", "scan_run_id", "runId", "id");
        List<ScanRun> runs;
        if (runId.isPresent()) {
            runs = scanRunRepository.findById(runId.get()).stream().toList();
        } else if (uuidArg(args, "workspaceId", "workspace_id").isPresent()) {
            runs = scanRunRepository.findByWorkspaceIdOrderByCreatedAtDesc(uuidArg(args, "workspaceId", "workspace_id").get());
        } else if (uuidArg(args, "productId", "product_id", "productProfileId").isPresent()) {
            runs = scanRunRepository.findByProductProfileIdOrderByCreatedAtDesc(uuidArg(args, "productId", "product_id", "productProfileId").get());
        } else {
            runs = scanRunRepository.findAll().stream()
                    .sorted(Comparator.comparing(ScanRun::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                    .toList();
        }
        List<Map<String, Object>> summaries = runs.stream().limit(limit).map(this::scanRunSummary).toList();
        Map<String, Object> response = ok("produs.scan.status");
        response.put("scanRuns", summaries);
        response.put("count", summaries.size());
        return response;
    }

    private Map<String, Object> findingInspect(Map<String, Object> args) {
        Optional<UUID> findingId = uuidArg(args, "findingId", "finding_id", "id");
        Optional<NormalizedFinding> finding = findingId.flatMap(findingRepository::findById);
        if (finding.isEmpty() && hasText(textArg(args, "fingerprint"))) {
            Optional<UUID> productId = uuidArg(args, "productId", "product_id", "productProfileId");
            if (productId.isPresent()) {
                finding = findingRepository.findTopByProductProfileIdAndFingerprintOrderByCreatedAtDesc(
                        productId.get(),
                        textArg(args, "fingerprint")
                );
            }
        }
        if (finding.isEmpty() && uuidArg(args, "scanRunId", "scan_run_id").isPresent()) {
            finding = findingRepository.findByScanRunIdOrderBySeverityDescCreatedAtDesc(uuidArg(args, "scanRunId", "scan_run_id").get())
                    .stream()
                    .findFirst();
        }
        if (finding.isEmpty()) {
            return error("FINDING_NOT_FOUND", "No scanner finding matched the supplied identifier.");
        }
        Map<String, Object> response = ok("produs.finding.inspect");
        response.put("finding", findingSummary(finding.get()));
        response.put("evidence", evidenceRepository.findByFindingIdOrderByCreatedAtDesc(finding.get().getId()).stream()
                .limit(limit(args))
                .map(this::evidenceSummary)
                .toList());
        return response;
    }

    private Map<String, Object> evidenceList(Map<String, Object> args) {
        int limit = limit(args);
        List<ScannerEvidenceItem> evidence;
        if (uuidArg(args, "findingId", "finding_id").isPresent()) {
            evidence = evidenceRepository.findByFindingIdOrderByCreatedAtDesc(uuidArg(args, "findingId", "finding_id").get());
        } else if (uuidArg(args, "milestoneId", "milestone_id").isPresent()) {
            evidence = evidenceRepository.findByMilestoneIdOrderByCreatedAtDesc(uuidArg(args, "milestoneId", "milestone_id").get());
        } else if (uuidArg(args, "workspaceId", "workspace_id").isPresent()) {
            evidence = evidenceRepository.findByWorkspaceIdOrderByCreatedAtDesc(uuidArg(args, "workspaceId", "workspace_id").get());
        } else if (uuidArg(args, "productId", "product_id", "productProfileId").isPresent()) {
            evidence = evidenceRepository.findByProductProfileIdOrderByCreatedAtDesc(uuidArg(args, "productId", "product_id", "productProfileId").get());
        } else if (uuidArg(args, "scanRunId", "scan_run_id").isPresent()) {
            evidence = evidenceRepository.findByScanRunIdInOrderByCreatedAtDesc(List.of(uuidArg(args, "scanRunId", "scan_run_id").get()));
        } else {
            evidence = evidenceRepository.findAll().stream()
                    .sorted(Comparator.comparing(ScannerEvidenceItem::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                    .toList();
        }
        List<Map<String, Object>> summaries = evidence.stream().limit(limit).map(this::evidenceSummary).toList();
        Map<String, Object> response = ok("produs.evidence.list");
        response.put("evidence", summaries);
        response.put("count", summaries.size());
        return response;
    }

    private Map<String, Object> milestoneReviewEvidence(Map<String, Object> args) {
        Optional<Milestone> milestone = uuidArg(args, "milestoneId", "milestone_id", "id").flatMap(milestoneRepository::findById);
        if (milestone.isEmpty() && uuidArg(args, "workspaceId", "workspace_id").isPresent()) {
            milestone = milestoneRepository.findByWorkspaceIdOrderByCreatedAtAsc(uuidArg(args, "workspaceId", "workspace_id").get())
                    .stream()
                    .findFirst();
        }
        if (milestone.isEmpty()) {
            return error("MILESTONE_NOT_FOUND", "No milestone matched the supplied identifier.");
        }
        Milestone value = milestone.get();
        List<Map<String, Object>> deliverables = deliverableRepository.findByMilestoneIdOrderByCreatedAtAsc(value.getId()).stream()
                .map(this::deliverableSummary)
                .toList();
        List<Map<String, Object>> evidence = evidenceRepository.findByMilestoneIdOrderByCreatedAtDesc(value.getId()).stream()
                .limit(limit(args))
                .map(this::evidenceSummary)
                .toList();
        long accepted = deliverables.stream().filter(item -> "ACCEPTED".equals(String.valueOf(item.get("status")))).count();
        long submitted = deliverables.stream().filter(item -> "SUBMITTED".equals(String.valueOf(item.get("status")))).count();
        Map<String, Object> response = ok("produs.milestone.review_evidence");
        response.put("milestone", milestoneSummary(value));
        response.put("deliverables", deliverables);
        response.put("evidence", evidence);
        response.put("reviewSummary", Map.of(
                "deliverableCount", deliverables.size(),
                "acceptedDeliverables", accepted,
                "submittedDeliverables", submitted,
                "evidenceCount", evidence.size(),
                "decision", accepted == deliverables.size() && !deliverables.isEmpty() ? "READY_FOR_ACCEPTANCE" : "REVIEW_REQUIRED"
        ));
        return response;
    }

    private Map<String, Object> ok(String toolName) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "OK");
        response.put("tool", toolName);
        return response;
    }

    private Map<String, Object> error(String code, String message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "ERROR");
        response.put("errors", List.of(Map.of("code", code, "message", message)));
        return response;
    }

    private Map<String, Object> categorySummary(ServiceCategory category) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", category.getId());
        item.put("name", category.getName());
        item.put("slug", category.getSlug());
        item.put("description", safe(category.getDescription()));
        return item;
    }

    private Map<String, Object> moduleSummary(ServiceModule module) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", module.getId());
        item.put("name", module.getName());
        item.put("slug", module.getSlug());
        item.put("stableCode", module.getStableCode());
        item.put("category", module.getCategory() == null ? null : module.getCategory().getName());
        item.put("serviceLayer", module.getServiceLayer());
        item.put("description", safe(module.getDescription()));
        item.put("ownerOutcome", safe(module.getOwnerOutcome()));
        item.put("expectedDeliverables", safe(module.getExpectedDeliverables()));
        item.put("acceptanceCriteria", safe(module.getAcceptanceCriteria()));
        item.put("timelineRange", module.getTimelineRange());
        item.put("priceRange", module.getPriceRange());
        item.put("maturityLevel", module.getMaturityLevel());
        return item;
    }

    private Map<String, Object> dependencySummary(ServiceDependency dependency) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("sourceModule", moduleIdentity(dependency.getSourceModule()));
        item.put("dependsOnModule", moduleIdentity(dependency.getDependsOnModule()));
        item.put("required", dependency.isRequired());
        item.put("dependencyType", dependency.getDependencyType());
        item.put("reason", safe(dependency.getReason()));
        item.put("message", safe(dependency.getMessage()));
        return item;
    }

    private Map<String, Object> packageTemplateSummary(PackageTemplate template) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", template.getId());
        item.put("name", template.getName());
        item.put("slug", template.getSlug());
        item.put("targetProductStage", template.getTargetProductStage());
        item.put("description", safe(template.getDescription()));
        item.put("customerFit", safe(template.getCustomerFit()));
        item.put("timelineRange", template.getTimelineRange());
        item.put("budgetRange", template.getBudgetRange());
        item.put("outcomeSummary", safe(template.getOutcomeSummary()));
        item.put("modules", packageTemplateModuleRepository.findByTemplateIdOrderBySequenceOrderAsc(template.getId()).stream()
                .map(module -> Map.of(
                        "name", module.getServiceModule().getName(),
                        "slug", module.getServiceModule().getSlug(),
                        "required", module.isRequired()
                ))
                .toList());
        return item;
    }

    private Map<String, Object> productSummary(ProductProfile product) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", product.getId());
        item.put("name", product.getName());
        item.put("summary", safe(product.getSummary()));
        item.put("businessStage", product.getBusinessStage());
        item.put("techStack", safe(product.getTechStack()));
        item.put("riskProfile", safe(product.getRiskProfile()));
        item.put("ownerRole", product.getOwner() == null ? null : product.getOwner().getRole());
        item.put("createdAt", iso(product.getCreatedAt()));
        return item;
    }

    private Map<String, Object> packageSummary(PackageInstance pkg) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", pkg.getId());
        item.put("name", pkg.getName());
        item.put("summary", safe(pkg.getSummary()));
        item.put("status", pkg.getStatus());
        item.put("product", productIdentity(pkg.getProductProfile()));
        item.put("createdAt", iso(pkg.getCreatedAt()));
        return item;
    }

    private Map<String, Object> packageModuleSummary(PackageModule module) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", module.getId());
        item.put("serviceModule", moduleIdentity(module.getServiceModule()));
        item.put("sequenceOrder", module.getSequenceOrder());
        item.put("required", module.isRequired());
        item.put("status", module.getStatus());
        item.put("rationale", safe(module.getRationale()));
        item.put("deliverables", safe(module.getDeliverables()));
        item.put("acceptanceCriteria", safe(module.getAcceptanceCriteria()));
        return item;
    }

    private Map<String, Object> workspaceSummary(ProjectWorkspace workspace) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", workspace.getId());
        item.put("name", workspace.getName());
        item.put("status", workspace.getStatus());
        item.put("product", productIdentity(workspace.getPackageInstance().getProductProfile()));
        item.put("createdAt", iso(workspace.getCreatedAt()));
        return item;
    }

    private Map<String, Object> milestoneSummary(Milestone milestone) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", milestone.getId());
        item.put("title", milestone.getTitle());
        item.put("description", safe(milestone.getDescription()));
        item.put("dueDate", milestone.getDueDate() == null ? null : milestone.getDueDate().toString());
        item.put("status", milestone.getStatus());
        return item;
    }

    private Map<String, Object> deliverableSummary(Deliverable deliverable) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", deliverable.getId());
        item.put("title", deliverable.getTitle());
        item.put("status", deliverable.getStatus());
        item.put("evidence", safe(deliverable.getEvidence()));
        return item;
    }

    private Map<String, Object> scanRunSummary(ScanRun run) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", run.getId());
        item.put("status", run.getStatus());
        item.put("depth", run.getDepth());
        item.put("triggerType", run.getTriggerType());
        item.put("product", productIdentity(run.getProductProfile()));
        item.put("workspace", run.getWorkspace() == null ? null : Map.of("id", run.getWorkspace().getId(), "name", run.getWorkspace().getName()));
        item.put("startedAt", iso(run.getStartedAt()));
        item.put("completedAt", iso(run.getCompletedAt()));
        item.put("failureSummary", safe(run.getFailureSummary()));
        item.put("branchRef", safe(run.getBranchRef()));
        item.put("scanPlan", safe(run.getScanPlan()));
        return item;
    }

    private Map<String, Object> findingSummary(NormalizedFinding finding) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", finding.getId());
        item.put("title", finding.getTitle());
        item.put("description", safe(finding.getDescription()));
        item.put("severity", finding.getSeverity());
        item.put("status", finding.getStatus());
        item.put("sourceTool", finding.getSourceTool());
        item.put("sourceRuleId", safe(finding.getSourceRuleId()));
        item.put("affectedComponent", safe(finding.getAffectedComponent()));
        item.put("product", productIdentity(finding.getProductProfile()));
        item.put("workspace", finding.getWorkspace() == null ? null : Map.of("id", finding.getWorkspace().getId(), "name", finding.getWorkspace().getName()));
        item.put("scanRunId", finding.getScanRun().getId());
        item.put("recommendedService", moduleIdentity(finding.getRecommendedModule()));
        item.put("confidenceBasis", safe(finding.getConfidenceBasis()));
        return item;
    }

    private Map<String, Object> evidenceSummary(ScannerEvidenceItem evidence) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", evidence.getId());
        item.put("title", evidence.getTitle());
        item.put("summary", safe(evidence.getSummary()));
        item.put("evidenceType", evidence.getEvidenceType());
        item.put("source", safe(evidence.getSource()));
        item.put("confidenceLevel", evidence.getConfidenceLevel());
        item.put("redactionStatus", evidence.getRedactionStatus());
        item.put("product", productIdentity(evidence.getProductProfile()));
        item.put("workspaceId", evidence.getWorkspace() == null ? null : evidence.getWorkspace().getId());
        item.put("milestoneId", evidence.getMilestone() == null ? null : evidence.getMilestone().getId());
        item.put("findingId", evidence.getFinding() == null ? null : evidence.getFinding().getId());
        item.put("scanRunId", evidence.getScanRun() == null ? null : evidence.getScanRun().getId());
        item.put("createdAt", iso(evidence.getCreatedAt()));
        return item;
    }

    private Map<String, Object> productIdentity(ProductProfile product) {
        if (product == null) {
            return Map.of();
        }
        return Map.of("id", product.getId(), "name", product.getName(), "businessStage", product.getBusinessStage());
    }

    private Map<String, Object> moduleIdentity(ServiceModule module) {
        if (module == null) {
            return Map.of();
        }
        return Map.of("id", module.getId(), "name", module.getName(), "slug", module.getSlug());
    }

    private boolean matchesModule(String needle, ServiceModule module) {
        return matchesAny(needle,
                module.getName(),
                module.getSlug(),
                module.getStableCode(),
                module.getDescription(),
                module.getOwnerOutcome(),
                module.getExpectedDeliverables(),
                module.getAcceptanceCriteria(),
                module.getSourceAliases(),
                module.getCategory() == null ? null : module.getCategory().getName(),
                module.getCategory() == null ? null : module.getCategory().getSlug());
    }

    private boolean matchesAny(String needle, String... values) {
        if (!hasText(needle)) {
            return true;
        }
        List<String> tokens = searchTokens(needle);
        for (String value : values) {
            String normalized = normalize(value);
            if (normalized.contains(needle)) {
                return true;
            }
            if (!tokens.isEmpty() && tokens.stream().anyMatch(normalized::contains)) {
                return true;
            }
        }
        return false;
    }

    private List<String> searchTokens(String query) {
        if (!hasText(query)) {
            return List.of();
        }
        return Stream.of(query.split("[^a-zA-Z0-9]+"))
                .map(this::normalize)
                .filter(token -> token.length() >= 4)
                .filter(token -> !List.of(
                        "search",
                        "produs",
                        "service",
                        "services",
                        "catalog",
                        "summarize",
                        "summary",
                        "module",
                        "modules",
                        "package",
                        "packages",
                        "template",
                        "templates",
                        "find",
                        "what",
                        "does",
                        "about"
                ).contains(token))
                .distinct()
                .toList();
    }

    private String catalogSummary(List<Map<String, Object>> categories,
                                  List<Map<String, Object>> modules,
                                  List<Map<String, Object>> templates) {
        List<String> parts = new ArrayList<>();
        if (!categories.isEmpty()) {
            parts.add("categories: " + String.join(", ", names(categories)));
        }
        if (!modules.isEmpty()) {
            parts.add("service modules: " + String.join(", ", names(modules)));
        }
        if (!templates.isEmpty()) {
            parts.add("package templates: " + String.join(", ", names(templates)));
        }
        if (parts.isEmpty()) {
            return "No catalog records matched the query.";
        }
        return "Matched " + String.join("; ", parts) + ".";
    }

    private List<String> names(List<Map<String, Object>> records) {
        return records.stream()
                .map(record -> String.valueOf(record.getOrDefault("name", "")))
                .filter(this::hasText)
                .limit(6)
                .toList();
    }

    private <T> Optional<T> findByIdOrName(Stream<T> stream,
                                           Map<String, Object> args,
                                           Function<T, UUID> idReader,
                                           Function<T, String> nameReader,
                                           String... keys) {
        for (String key : keys) {
            Optional<UUID> id = uuidArg(args, key);
            if (id.isPresent()) {
                return stream.filter(item -> id.get().equals(idReader.apply(item))).findFirst();
            }
        }
        String name = textArg(args, keys);
        if (!hasText(name)) {
            return Optional.empty();
        }
        String normalized = normalize(name);
        return stream.filter(item -> normalize(nameReader.apply(item)).contains(normalized)).findFirst();
    }

    private Optional<UUID> uuidArg(Map<String, Object> args, String... names) {
        for (String name : names) {
            Object raw = args.get(name);
            if (raw == null) {
                continue;
            }
            Optional<UUID> parsed = parseUuid(String.valueOf(raw));
            if (parsed.isPresent()) {
                return parsed;
            }
        }
        return Optional.empty();
    }

    private Optional<UUID> parseUuid(String value) {
        if (!hasText(value)) {
            return Optional.empty();
        }
        try {
            return Optional.of(UUID.fromString(value.trim()));
        } catch (IllegalArgumentException ignored) {
            return Optional.empty();
        }
    }

    private String textArg(Map<String, Object> args, String... names) {
        for (String name : names) {
            Object raw = args.get(name);
            if (raw != null && hasText(String.valueOf(raw))) {
                return String.valueOf(raw).trim();
            }
        }
        return null;
    }

    private int limit(Map<String, Object> args) {
        Object raw = args.get("limit");
        if (raw == null) {
            return DEFAULT_LIMIT;
        }
        try {
            int value = Integer.parseInt(String.valueOf(raw));
            return Math.max(1, Math.min(MAX_LIMIT, value));
        } catch (NumberFormatException ignored) {
            return DEFAULT_LIMIT;
        }
    }

    private String safe(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.replaceAll("(?i)(api[_-]?key|token|secret|password)\\s*[:=]\\s*\\S+", "$1=[REDACTED]")
                .replaceAll("\\s+", " ")
                .trim();
        if (normalized.length() <= TEXT_LIMIT) {
            return normalized;
        }
        return normalized.substring(0, TEXT_LIMIT - 1).trim() + "...";
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String iso(TemporalAccessor value) {
        return value == null ? null : value.toString();
    }

    private String writeJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            return "{\"status\":\"ERROR\",\"errors\":[{\"code\":\"SERIALIZATION_FAILED\",\"message\":\"Unable to serialize tool result\"}]}";
        }
    }
}
