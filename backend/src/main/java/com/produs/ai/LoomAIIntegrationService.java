package com.produs.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.ai.loom.LoomAIProperties;
import com.produs.ai.loom.LoomAIRuntimeAssertionService;
import com.produs.catalog.AICapabilityConfig;
import com.produs.catalog.AICapabilityConfigRepository;
import com.produs.catalog.PackageTemplate;
import com.produs.catalog.PackageTemplateRepository;
import com.produs.catalog.ServiceCategory;
import com.produs.catalog.ServiceCategoryRepository;
import com.produs.catalog.ServiceDependency;
import com.produs.catalog.ServiceDependencyRepository;
import com.produs.catalog.ServiceModule;
import com.produs.catalog.ServiceModuleRepository;
import com.produs.entity.User;
import com.produs.exception.ResourceNotFoundException;
import com.produs.packages.PackageInstance;
import com.produs.packages.PackageInstanceRepository;
import com.produs.product.ProductProfile;
import com.produs.product.ProductProfileRepository;
import com.produs.scanner.NormalizedFinding;
import com.produs.scanner.NormalizedFindingRepository;
import com.produs.workspace.Milestone;
import com.produs.workspace.MilestoneRepository;
import com.produs.workspace.ProjectWorkspace;
import com.produs.workspace.ProjectWorkspaceRepository;
import com.produs.workspace.WorkspaceParticipantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoomAIIntegrationService {

    private static final List<String> ALLOWED_ACTIONS = LoomAIToolAllowlist.toolNames();

    private final LoomAIProperties properties;
    private final LoomAIRuntimeAssertionService runtimeAssertionService;
    private final ObjectMapper objectMapper;
    private final ProductProfileRepository productRepository;
    private final PackageInstanceRepository packageRepository;
    private final ProjectWorkspaceRepository workspaceRepository;
    private final WorkspaceParticipantRepository participantRepository;
    private final MilestoneRepository milestoneRepository;
    private final NormalizedFindingRepository findingRepository;
    private final ServiceCategoryRepository categoryRepository;
    private final ServiceModuleRepository moduleRepository;
    private final ServiceDependencyRepository dependencyRepository;
    private final PackageTemplateRepository packageTemplateRepository;
    private final AICapabilityConfigRepository capabilityConfigRepository;

    @Transactional(readOnly = true)
    public LoomAIStatusResponse status(User user) {
        requireAdmin(user);
        return new LoomAIStatusResponse(
                properties.isEnabled(),
                isConfigured(),
                properties.getEnvironment(),
                properties.getIntegrationMode(),
                properties.getAuthMode(),
                properties.isPrivateRuntimeMode(),
                runtimeAssertionService.isConfigured(),
                configuredPath(properties.getAssistantSessionPath()),
                configuredPath(properties.getAssistantQueryPath()),
                configuredPath(properties.getAssistantSuggestionsPath()),
                configuredPath(properties.getDataSyncBatchPath()),
                ALLOWED_ACTIONS
        );
    }

    @Transactional(readOnly = true)
    public AssistantSessionResponse createSession(User user, AssistantSessionRequest request) {
        Map<String, Object> context = safeContext(user, request == null ? null : request.context());
        if (!isConfigured()) {
            return fallbackSession("LOOMAI_DISABLED", context);
        }
        if (properties.isPrivateRuntimeMode() || properties.isPlatformBridgeMode()) {
            return localSession(context);
        }
        try {
            ProviderJsonResponse response = postJson(properties.getAssistantSessionPath(), Map.of(
                    "environment", properties.getEnvironment(),
                    "context", context,
                    "allowedActions", ALLOWED_ACTIONS
            ), user, "assistant-session");
            JsonNode body = response.body();
            String sessionId = textOr(body, "sessionId", UUID.randomUUID().toString());
            return new AssistantSessionResponse(
                    "LOOMAI",
                    "LIVE",
                    sessionId,
                    LocalDateTime.now().plusMinutes(30),
                    sanitizedBaseUrl(),
                    ALLOWED_ACTIONS,
                    null,
                    response.providerRequestId()
            );
        } catch (RuntimeException exception) {
            log.warn("loomai_assistant_session_fallback reason={}", exception.getClass().getSimpleName());
            return fallbackSession("LOOMAI_UNAVAILABLE", context);
        }
    }

    @Transactional(readOnly = true)
    public AssistantQueryResponse query(User user, AssistantQueryRequest request) {
        if (request == null || request.query() == null || request.query().isBlank()) {
            throw new IllegalArgumentException("Assistant query is required");
        }
        Map<String, Object> context = safeContext(user, request.context());
        if (!isConfigured()) {
            return fallbackAnswer("LOOMAI_DISABLED", context);
        }
        try {
            ProviderJsonResponse response = postJson(
                    properties.getAssistantQueryPath(),
                    assistantQueryPayload(request, context),
                    user,
                    conversationId(request.conversationId(), context)
            );
            JsonNode body = response.body();
            return new AssistantQueryResponse(
                    "LOOMAI",
                    "LIVE",
                    normalizedAnswer(body),
                    normalizedConfidence(body),
                    jsonList(firstArray(body, "sources")),
                    jsonList(firstArray(body, "actions")),
                    null,
                    response.providerRequestId()
            );
        } catch (RuntimeException exception) {
            log.warn("loomai_assistant_query_fallback reason={}", exception.getClass().getSimpleName());
            return fallbackAnswer("LOOMAI_UNAVAILABLE", context);
        }
    }

    @Transactional(readOnly = true)
    public AssistantSuggestionsResponse suggestions(User user, AssistantSuggestionsRequest request) {
        Map<String, Object> context = safeContext(user, request == null ? null : request.context());
        if (!isConfigured()) {
            return fallbackSuggestions("LOOMAI_DISABLED", context);
        }
        try {
            ProviderJsonResponse response = postJson(
                    properties.getAssistantSuggestionsPath(),
                    assistantSuggestionsPayload(context),
                    user,
                    conversationId(null, context)
            );
            JsonNode body = response.body();
            List<String> parsedSuggestions = suggestionList(body);
            List<String> suggestions = parsedSuggestions.isEmpty() ? defaultSuggestionText(context) : parsedSuggestions;
            return new AssistantSuggestionsResponse("LOOMAI", "LIVE", suggestions, null, response.providerRequestId());
        } catch (RuntimeException exception) {
            log.warn("loomai_assistant_suggestions_fallback reason={}", exception.getClass().getSimpleName());
            return fallbackSuggestions("LOOMAI_UNAVAILABLE", context);
        }
    }

    @Transactional(readOnly = true)
    public KnowledgeSyncResponse syncSafeKnowledge(User user) {
        requireAdmin(user);
        List<SafeKnowledgeRecord> records = safeKnowledgeRecords();
        if (!isConfigured()) {
            return new KnowledgeSyncResponse("SKIPPED", records.size(), null, "LOOMAI_DISABLED");
        }
        try {
            ProviderJsonResponse response = postJson(properties.getDataSyncBatchPath(), Map.of(
                    "environment", properties.getEnvironment(),
                    "source", "ProdUS",
                    "records", records
            ), user, "knowledge-sync");
            return new KnowledgeSyncResponse("SYNCED", records.size(), response.providerRequestId(), null);
        } catch (RuntimeException exception) {
            log.warn("loomai_knowledge_sync_failed reason={}", exception.getClass().getSimpleName());
            return new KnowledgeSyncResponse("FAILED", records.size(), null, "LOOMAI_UNAVAILABLE");
        }
    }

    @Transactional(readOnly = true)
    public List<SafeKnowledgeRecord> previewSafeKnowledge(User user) {
        requireAdmin(user);
        return safeKnowledgeRecords();
    }

    private List<SafeKnowledgeRecord> safeKnowledgeRecords() {
        List<SafeKnowledgeRecord> records = new ArrayList<>();
        for (ServiceCategory category : categoryRepository.findAll()) {
            records.add(record(
                    "service-category:" + category.getSlug(),
                    "SERVICE_CATEGORY",
                    category.getName(),
                    category.getDescription(),
                    Map.of("slug", category.getSlug(), "active", category.isActive(), "sortOrder", category.getSortOrder())
            ));
        }
        for (ServiceModule module : moduleRepository.findAll()) {
            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("slug", module.getSlug());
            metadata.put("stableCode", module.getStableCode());
            metadata.put("category", module.getCategory() == null ? "" : module.getCategory().getSlug());
            metadata.put("serviceLayer", module.getServiceLayer());
            metadata.put("timelineRange", module.getTimelineRange());
            metadata.put("priceRange", module.getPriceRange());
            metadata.put("humanReviewRequired", module.isHumanReviewRequired());
            metadata.put("releaseStage", module.getReleaseStage());
            records.add(record(
                    "service-module:" + module.getSlug(),
                    "SERVICE_MODULE",
                    module.getName(),
                    joinText(
                            module.getDescription(),
                            module.getOwnerOutcome(),
                            module.getRequiredInputs(),
                            module.getExpectedDeliverables(),
                            module.getAcceptanceCriteria(),
                            module.getWorkflowSteps(),
                            module.getRequiredEvidenceTypes(),
                            module.getSuggestedTeamRoles(),
                            module.getAiAssistanceTags()
                    ),
                    metadata
            ));
        }
        for (ServiceDependency dependency : dependencyRepository.findAll()) {
            ServiceModule source = dependency.getSourceModule();
            ServiceModule dependsOn = dependency.getDependsOnModule();
            if (source == null || dependsOn == null) {
                log.warn("Skipping service dependency {} from LoomAI knowledge export because source or target module is missing", dependency.getId());
                continue;
            }
            records.add(record(
                    "service-dependency:" + source.getSlug() + ":" + dependsOn.getSlug(),
                    "SERVICE_DEPENDENCY",
                    source.getName() + " requires " + dependsOn.getName(),
                    joinText(dependency.getReason(), dependency.getMessage(), dependency.getRuleMetadata()),
                    Map.of(
                            "sourceModule", source.getSlug(),
                            "dependsOnModule", dependsOn.getSlug(),
                            "dependencyType", dependency.getDependencyType().name(),
                            "severity", dependency.getSeverity().name(),
                            "required", dependency.isRequired()
                    )
            ));
        }
        for (PackageTemplate template : packageTemplateRepository.findAll()) {
            records.add(record(
                    "package-template:" + template.getSlug(),
                    "PACKAGE_TEMPLATE",
                    template.getName(),
                    joinText(template.getDescription(), template.getCustomerFit(), template.getOutcomeSummary(), template.getAiReadinessNotes()),
                    Map.of(
                            "slug", template.getSlug(),
                            "targetProductStage", nullToEmpty(template.getTargetProductStage()),
                            "timelineRange", nullToEmpty(template.getTimelineRange()),
                            "budgetRange", nullToEmpty(template.getBudgetRange()),
                            "humanReviewRequired", template.isHumanReviewRequired(),
                            "active", template.isActive()
                    )
            ));
        }
        for (AICapabilityConfig config : capabilityConfigRepository.findAll()) {
            records.add(record(
                    "ai-capability:" + config.getSlug(),
                    "AI_CAPABILITY_CONTRACT",
                    config.getName(),
                    joinText(config.getDescription(), config.getInputContract(), config.getOutputContract(), config.getAllowedSources(), config.getForbiddenClaims()),
                    Map.of(
                            "slug", config.getSlug(),
                            "capabilityType", config.getCapabilityType(),
                            "humanReviewRequired", config.isHumanReviewRequired(),
                            "enabled", config.isEnabled()
                    )
            ));
        }
        return records;
    }

    private SafeKnowledgeRecord record(String id, String type, String title, String body, Map<String, Object> metadata) {
        return new SafeKnowledgeRecord(id, type, title, nullToEmpty(body), metadata);
    }

    private Map<String, Object> safeContext(User user, AssistantContextRequest context) {
        Map<String, Object> safe = new LinkedHashMap<>();
        safe.put("actorRole", user.getRole().name());
        safe.put("pageType", context == null || context.pageType() == null ? "unknown" : context.pageType());
        if (context == null) {
            return safe;
        }
        if (context.productId() != null) {
            ProductProfile product = productRepository.findById(context.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product profile not found"));
            requireProductRead(user, product);
            safe.put("productId", product.getId().toString());
            safe.put("productStage", product.getBusinessStage() == null ? "" : product.getBusinessStage().name());
        }
        if (context.packageId() != null) {
            PackageInstance packageInstance = packageRepository.findById(context.packageId())
                    .orElseThrow(() -> new ResourceNotFoundException("Package not found"));
            requirePackageRead(user, packageInstance);
            safe.put("packageId", packageInstance.getId().toString());
            safe.put("packageStatus", packageInstance.getStatus().name());
        }
        if (context.workspaceId() != null) {
            ProjectWorkspace workspace = workspaceRepository.findById(context.workspaceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
            requireWorkspaceRead(user, workspace);
            safe.put("workspaceId", workspace.getId().toString());
            safe.put("workspaceStatus", workspace.getStatus().name());
        }
        if (context.milestoneId() != null) {
            Milestone milestone = milestoneRepository.findById(context.milestoneId())
                    .orElseThrow(() -> new ResourceNotFoundException("Milestone not found"));
            requireWorkspaceRead(user, milestone.getWorkspace());
            safe.put("milestoneId", milestone.getId().toString());
            safe.put("milestoneStatus", milestone.getStatus().name());
        }
        if (context.findingId() != null) {
            NormalizedFinding finding = findingRepository.findById(context.findingId())
                    .orElseThrow(() -> new ResourceNotFoundException("Finding not found"));
            requireProductOrWorkspaceRead(user, finding.getProductProfile(), finding.getWorkspace());
            safe.put("findingId", finding.getId().toString());
            safe.put("findingSeverity", finding.getSeverity().name());
            safe.put("findingStatus", finding.getStatus().name());
        }
        return safe;
    }

    private Map<String, Object> assistantQueryPayload(AssistantQueryRequest request, Map<String, Object> context) {
        if (properties.isPrivateRuntimeMode() || properties.isPlatformBridgeMode()) {
            Map<String, Object> payload = runtimeChatPayload(context, conversationId(request.conversationId(), context));
            payload.put("query", request.query());
            return payload;
        }
        return Map.of(
                "environment", properties.getEnvironment(),
                "conversationId", request.conversationId() == null ? "" : request.conversationId(),
                "query", request.query(),
                "context", context,
                "allowedActions", ALLOWED_ACTIONS
        );
    }

    private Map<String, Object> assistantSuggestionsPayload(Map<String, Object> context) {
        if (properties.isPrivateRuntimeMode() || properties.isPlatformBridgeMode()) {
            Map<String, Object> payload = runtimeChatPayload(context, conversationId(null, context));
            payload.put("query", "Suggest the most useful next productization questions or actions for this page.");
            return payload;
        }
        return Map.of(
                "environment", properties.getEnvironment(),
                "context", context,
                "allowedActions", ALLOWED_ACTIONS
        );
    }

    private Map<String, Object> runtimeChatPayload(Map<String, Object> context, String conversationId) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("conversationId", conversationId);
        payload.put("mode", blank(properties.getDefaultMode()) ? "support_assistant" : properties.getDefaultMode());
        payload.put("position", blank(properties.getDefaultPosition()) ? "productization" : properties.getDefaultPosition());
        payload.put("context", context);
        payload.put("allowedActions", ALLOWED_ACTIONS);
        return payload;
    }

    private String conversationId(String requestedConversationId, Map<String, Object> context) {
        if (!blank(requestedConversationId)) {
            return requestedConversationId;
        }
        String actorRole = String.valueOf(context.getOrDefault("actorRole", "user"));
        String pageType = String.valueOf(context.getOrDefault("pageType", "productization"));
        return "produs-" + actorRole.toLowerCase() + "-" + pageType.toLowerCase();
    }

    private ProviderJsonResponse postJson(String path, Object payload, User user, String conversationId) {
        if (!isConfigured()) {
            throw new IllegalStateException("LoomAI is not configured");
        }
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(normalizedBaseUrl() + normalizedPath(path)))
                    .timeout(java.time.Duration.ofMillis(properties.getTimeoutMs()))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)));
            applyProviderAuth(builder, user, conversationId);
            String requestId = MDC.get("requestId");
            if (requestId != null && !requestId.isBlank()) {
                builder.header("X-Request-ID", requestId);
            }
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(java.time.Duration.ofMillis(properties.getTimeoutMs()))
                    .build();
            HttpResponse<String> response = client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() > 299) {
                throw new IllegalStateException("LoomAI HTTP " + response.statusCode());
            }
            JsonNode body = response.body() == null || response.body().isBlank()
                    ? objectMapper.createObjectNode()
                    : objectMapper.readTree(response.body());
            return new ProviderJsonResponse(body, providerRequestId(response, body));
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("LoomAI request interrupted", interruptedException);
        } catch (Exception exception) {
            throw new IllegalStateException("LoomAI request failed", exception);
        }
    }

    private void applyProviderAuth(HttpRequest.Builder builder, User user, String conversationId) {
        if (properties.isPrivateRuntimeAssertionAuth()) {
            builder.header(
                    blank(properties.getRuntimeApiKeyHeaderName()) ? "X-AIFABRIC-RUNTIME-API-KEY" : properties.getRuntimeApiKeyHeaderName(),
                    properties.getRuntimeApiKey().trim()
            );
            builder.header(
                    blank(properties.getRuntimeAuthorizationHeaderName()) ? "X-AIFABRIC-RUNTIME-AUTHORIZATION" : properties.getRuntimeAuthorizationHeaderName(),
                    "Bearer " + runtimeAssertionService.createAssertion(user, conversationId)
            );
            return;
        }
        if (properties.isPlatformApiKeyAuth()) {
            builder.header(
                    blank(properties.getApiKeyHeaderName()) ? "X-PLATFORM-API-KEY" : properties.getApiKeyHeaderName(),
                    properties.getApiKey().trim()
            );
            return;
        }
        if (properties.getApiKey() != null && !properties.getApiKey().isBlank()) {
            builder.header("Authorization", "Bearer " + properties.getApiKey().trim());
        }
    }

    private String providerRequestId(HttpResponse<?> response, JsonNode body) {
        String headerValue = response.headers().firstValue("X-Request-ID")
                .or(() -> response.headers().firstValue("X-AIFABRIC-REQUEST-ID"))
                .or(() -> response.headers().firstValue("X-Provider-Request-ID"))
                .orElse(null);
        if (!blank(headerValue)) {
            return headerValue;
        }
        JsonNode metadata = body.path("metadata");
        JsonNode resultMetadata = body.path("result").path("metadata");
        return firstText(
                body.path("requestId"),
                metadata.path("requestId"),
                metadata.path("providerRequestId"),
                resultMetadata.path("requestId"),
                resultMetadata.path("providerRequestId")
        );
    }

    private String normalizedAnswer(JsonNode body) {
        String answer = firstText(
                body.path("answer"),
                body.path("safeSummary"),
                body.path("result").path("answer"),
                body.path("result").path("safeSummary")
        );
        return blank(answer) ? "LoomAI returned an empty answer." : answer;
    }

    private double normalizedConfidence(JsonNode body) {
        JsonNode value = firstNumber(
                body.path("confidence"),
                body.path("result").path("confidence")
        );
        return value == null ? 0.0 : value.asDouble();
    }

    private JsonNode firstArray(JsonNode body, String field) {
        JsonNode[] candidates = new JsonNode[]{
                body.path(field),
                body.path("result").path(field)
        };
        for (JsonNode candidate : candidates) {
            if (candidate.isArray()) {
                return candidate;
            }
        }
        return objectMapper.createArrayNode();
    }

    private List<String> suggestionList(JsonNode body) {
        JsonNode values = firstArray(body, "suggestions");
        List<String> suggestions = new ArrayList<>();
        values.forEach(item -> {
            if (item.isTextual()) {
                suggestions.add(item.asText());
            } else {
                String title = firstText(item.path("title"), item.path("label"), item.path("message"));
                suggestions.add(blank(title) ? item.toString() : title);
            }
        });
        return suggestions;
    }

    private String firstText(JsonNode... nodes) {
        for (JsonNode node : nodes) {
            if (node != null && node.isTextual() && !node.asText().isBlank()) {
                return node.asText();
            }
        }
        return null;
    }

    private JsonNode firstNumber(JsonNode... nodes) {
        for (JsonNode node : nodes) {
            if (node != null && node.isNumber()) {
                return node;
            }
        }
        return null;
    }

    private AssistantSessionResponse localSession(Map<String, Object> context) {
        return new AssistantSessionResponse(
                "PRODUS_SESSION",
                "LOCAL",
                "produs-" + UUID.randomUUID(),
                LocalDateTime.now().plusMinutes(30),
                null,
                ALLOWED_ACTIONS,
                null,
                null
        );
    }

    private AssistantSessionResponse fallbackSession(String reason, Map<String, Object> context) {
        return new AssistantSessionResponse(
                "PRODUS_FALLBACK",
                "FALLBACK",
                "fallback-" + UUID.randomUUID(),
                LocalDateTime.now().plusMinutes(10),
                null,
                ALLOWED_ACTIONS,
                reason,
                null
        );
    }

    private AssistantQueryResponse fallbackAnswer(String reason, Map<String, Object> context) {
        String pageType = String.valueOf(context.getOrDefault("pageType", "productization"));
        String answer = "LoomAI is not connected for this environment. ProdUS can still use deterministic product, package, workspace, scanner, and evidence records for this "
                + pageType + " view.";
        return new AssistantQueryResponse("PRODUS_FALLBACK", "FALLBACK", answer, 0.0, List.of(), List.of(), reason, null);
    }

    private AssistantSuggestionsResponse fallbackSuggestions(String reason, Map<String, Object> context) {
        return new AssistantSuggestionsResponse("PRODUS_FALLBACK", "FALLBACK", defaultSuggestionText(context), reason, null);
    }

    private List<String> defaultSuggestionText(Map<String, Object> context) {
        String pageType = String.valueOf(context.getOrDefault("pageType", "product"));
        if (pageType.toLowerCase().contains("workspace")) {
            return List.of("Review missing milestone evidence", "Summarize blocked delivery items", "List scanner findings that affect handoff");
        }
        if (pageType.toLowerCase().contains("scanner") || context.containsKey("findingId")) {
            return List.of("Explain this finding with evidence basis", "Map finding to lifecycle services", "Show what evidence is missing before review");
        }
        return List.of("Explain productization readiness", "Recommend lifecycle services from evidence", "Prepare the next package action");
    }

    private List<Map<String, Object>> jsonList(JsonNode node) {
        if (!node.isArray()) {
            return List.of();
        }
        List<Map<String, Object>> values = new ArrayList<>();
        node.forEach(item -> values.add(objectMapper.convertValue(item, Map.class)));
        return values;
    }

    private void requireAdmin(User user) {
        if (user.getRole() != User.UserRole.ADMIN) {
            throw new AccessDeniedException("Admin access is required");
        }
    }

    private void requireProductRead(User user, ProductProfile product) {
        if (user.getRole() == User.UserRole.ADMIN || product.getOwner().getId().equals(user.getId())) {
            return;
        }
        throw new AccessDeniedException("Product context is restricted to the owner");
    }

    private void requirePackageRead(User user, PackageInstance packageInstance) {
        if (user.getRole() == User.UserRole.ADMIN || packageInstance.getOwner().getId().equals(user.getId())) {
            return;
        }
        throw new AccessDeniedException("Package context is restricted to the owner");
    }

    private void requireWorkspaceRead(User user, ProjectWorkspace workspace) {
        if (user.getRole() == User.UserRole.ADMIN || workspace.getOwner().getId().equals(user.getId())
                || participantRepository.existsByWorkspaceIdAndUserIdAndActiveTrue(workspace.getId(), user.getId())) {
            return;
        }
        throw new AccessDeniedException("Workspace context is restricted to participants");
    }

    private void requireProductOrWorkspaceRead(User user, ProductProfile product, ProjectWorkspace workspace) {
        if (workspace != null) {
            requireWorkspaceRead(user, workspace);
            return;
        }
        requireProductRead(user, product);
    }

    private boolean isConfigured() {
        return properties.isEnabled()
                && properties.getBaseUrl() != null
                && !properties.getBaseUrl().isBlank()
                && (!properties.isPrivateRuntimeMode() || properties.isPrivateRuntimeAssertionAuth())
                && (!properties.isPlatformApiKeyAuth() || !blank(properties.getApiKey()))
                && runtimeAssertionService.isConfigured();
    }

    private boolean configuredPath(String path) {
        return isConfigured() && path != null && !path.isBlank();
    }

    private String sanitizedBaseUrl() {
        return isConfigured() ? normalizedBaseUrl() : null;
    }

    private String normalizedBaseUrl() {
        String baseUrl = properties.getBaseUrl().trim();
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    private String normalizedPath(String path) {
        if (path == null || path.isBlank()) {
            return "/";
        }
        return path.startsWith("/") ? path : "/" + path;
    }

    private String textOr(JsonNode node, String field, String fallback) {
        JsonNode value = node.path(field);
        return value.isTextual() && !value.asText().isBlank() ? value.asText() : fallback;
    }

    private double doubleOr(JsonNode node, String field, double fallback) {
        JsonNode value = node.path(field);
        return value.isNumber() ? value.asDouble() : fallback;
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private String joinText(String... parts) {
        List<String> values = new ArrayList<>();
        for (String part : parts) {
            if (part != null && !part.isBlank()) {
                values.add(part.trim());
            }
        }
        return String.join("\n\n", values);
    }

    private record ProviderJsonResponse(JsonNode body, String providerRequestId) {}

    public record AssistantContextRequest(
            String pageType,
            UUID productId,
            UUID packageId,
            UUID workspaceId,
            UUID milestoneId,
            UUID findingId
    ) {}

    public record AssistantSessionRequest(AssistantContextRequest context) {}

    public record AssistantQueryRequest(String conversationId, String query, AssistantContextRequest context) {}

    public record AssistantSuggestionsRequest(AssistantContextRequest context) {}

    public record AssistantSessionResponse(
            String provider,
            String mode,
            String sessionId,
            LocalDateTime expiresAt,
            String runtimeBaseUrl,
            List<String> allowedActions,
            String fallbackReason,
            String providerRequestId
    ) {}

    public record AssistantQueryResponse(
            String provider,
            String mode,
            String answer,
            double confidence,
            List<Map<String, Object>> sources,
            List<Map<String, Object>> actions,
            String fallbackReason,
            String providerRequestId
    ) {}

    public record AssistantSuggestionsResponse(
            String provider,
            String mode,
            List<String> suggestions,
            String fallbackReason,
            String providerRequestId
    ) {}

    public record LoomAIStatusResponse(
            boolean enabled,
            boolean configured,
            String environment,
            String integrationMode,
            String authMode,
            boolean privateRuntimeMode,
            boolean privateRuntimeAuthConfigured,
            boolean assistantSessionConfigured,
            boolean assistantQueryConfigured,
            boolean assistantSuggestionsConfigured,
            boolean knowledgeSyncConfigured,
            List<String> allowedActions
    ) {}

    public record KnowledgeSyncResponse(
            String status,
            int recordCount,
            String providerRequestId,
            String fallbackReason
    ) {}

    public record SafeKnowledgeRecord(
            String id,
            String type,
            String title,
            String body,
            Map<String, Object> metadata
    ) {}
}
