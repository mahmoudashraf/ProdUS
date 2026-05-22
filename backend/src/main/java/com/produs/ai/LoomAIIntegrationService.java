package com.produs.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.ai.loom.LoomAIProperties;
import com.produs.ai.loom.LoomAIRuntimeAssertionService;
import com.produs.catalog.AICapabilityConfig;
import com.produs.catalog.AICapabilityConfigRepository;
import com.produs.catalog.CatalogTemplateDefinition;
import com.produs.catalog.CatalogTemplateDefinitionRepository;
import com.produs.catalog.PackageTemplate;
import com.produs.catalog.PackageTemplateModule;
import com.produs.catalog.PackageTemplateModuleRepository;
import com.produs.catalog.PackageTemplateRepository;
import com.produs.catalog.ServiceCategory;
import com.produs.catalog.ServiceCategoryRepository;
import com.produs.catalog.ServiceDependency;
import com.produs.catalog.ServiceDependencyRepository;
import com.produs.catalog.ServiceModule;
import com.produs.catalog.ServiceModuleRepository;
import com.produs.entity.User;
import com.produs.engine.ProductDiagnosis;
import com.produs.engine.ProductDiagnosisRepository;
import com.produs.engine.ProductFinding;
import com.produs.engine.ProductFindingRepository;
import com.produs.exception.ResourceNotFoundException;
import com.produs.experts.ExpertProfile;
import com.produs.experts.ExpertProfileRepository;
import com.produs.packages.PackageInstance;
import com.produs.packages.PackageInstanceRepository;
import com.produs.packages.PackageModule;
import com.produs.packages.PackageModuleRepository;
import com.produs.product.ProductProfile;
import com.produs.product.ProductProfileRepository;
import com.produs.scanner.NormalizedFinding;
import com.produs.scanner.NormalizedFindingRepository;
import com.produs.scanner.ScanRun;
import com.produs.scanner.ScanRunRepository;
import com.produs.scanner.ScannerEvidenceItem;
import com.produs.scanner.ScannerEvidenceItemRepository;
import com.produs.scanner.ScannerProperties;
import com.produs.teams.Team;
import com.produs.teams.TeamCapability;
import com.produs.teams.TeamCapabilityRepository;
import com.produs.teams.TeamRepository;
import com.produs.workspace.Deliverable;
import com.produs.workspace.DeliverableRepository;
import com.produs.workspace.Milestone;
import com.produs.workspace.MilestoneRepository;
import com.produs.workspace.ProjectWorkspace;
import com.produs.workspace.ProjectWorkspaceRepository;
import com.produs.workspace.WorkspaceParticipantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoomAIIntegrationService {

    private static final List<String> ALLOWED_ACTIONS = LoomAIToolAllowlist.toolNames();
    private static final List<String> ACTIVE_READ_ACTIONS = LoomAIToolAllowlist.tools().stream()
            .filter(tool -> !tool.confirmationRequired())
            .map(LoomAIToolAllowlist.ToolDefinition::name)
            .toList();
    private static final List<String> CONFIRMED_ACTION_CANDIDATES = LoomAIToolAllowlist.tools().stream()
            .filter(LoomAIToolAllowlist.ToolDefinition::confirmationRequired)
            .map(LoomAIToolAllowlist.ToolDefinition::name)
            .toList();
    private static final List<String> ACTION_GROUP_HINTS = List.of(
            "catalog",
            "product",
            "package",
            "workspace",
            "scanner",
            "finding",
            "evidence",
            "milestone"
    );
    private static final int SUMMARY_LIMIT = 480;
    private static final int FIELD_LIMIT = 220;
    private static final int LIST_LIMIT = 6;
    private static final int KNOWLEDGE_CONTENT_LIMIT = 4_000;
    private static final int DEFAULT_KNOWLEDGE_EXPORT_LIMIT = 100;
    private static final int MAX_KNOWLEDGE_EXPORT_LIMIT = 250;
    private static final String DATA_SYNC_SCOPE = "data-sync:upsert";
    private static final String SAFE_KNOWLEDGE_SYSTEM_SUBJECT = "system:produs-safe-knowledge-sync";
    private static final String SAFE_KNOWLEDGE_EXPORT_VERSION = "produs-safe-knowledge-v1";
    private static final Pattern SECRET_PATTERN = Pattern.compile(
            "(?is)(api[_-]?key|secret|token|password|authorization|bearer|private[_-]?key)\\s*[:=]\\s*[^\\s,;]+"
                    + "|gh[pousr]_[A-Za-z0-9_]+"
                    + "|sk-[A-Za-z0-9_-]+"
                    + "|-----BEGIN [^-]+ PRIVATE KEY-----.*?-----END [^-]+ PRIVATE KEY-----"
    );
    private static final Pattern URL_PATTERN = Pattern.compile("(?i)https?://\\S+");

    private final LoomAIProperties properties;
    private final LoomAIRuntimeAssertionService runtimeAssertionService;
    private final ObjectMapper objectMapper;
    private final ProductProfileRepository productRepository;
    private final ProductDiagnosisRepository diagnosisRepository;
    private final ProductFindingRepository productFindingRepository;
    private final PackageInstanceRepository packageRepository;
    private final PackageModuleRepository packageModuleRepository;
    private final ProjectWorkspaceRepository workspaceRepository;
    private final WorkspaceParticipantRepository participantRepository;
    private final MilestoneRepository milestoneRepository;
    private final DeliverableRepository deliverableRepository;
    private final NormalizedFindingRepository findingRepository;
    private final ScanRunRepository scanRunRepository;
    private final ScannerEvidenceItemRepository evidenceItemRepository;
    private final ServiceCategoryRepository categoryRepository;
    private final ServiceModuleRepository moduleRepository;
    private final ServiceDependencyRepository dependencyRepository;
    private final PackageTemplateRepository packageTemplateRepository;
    private final PackageTemplateModuleRepository packageTemplateModuleRepository;
    private final CatalogTemplateDefinitionRepository templateDefinitionRepository;
    private final AICapabilityConfigRepository capabilityConfigRepository;
    private final ScannerProperties scannerProperties;
    private final TeamRepository teamRepository;
    private final TeamCapabilityRepository teamCapabilityRepository;
    private final ExpertProfileRepository expertProfileRepository;

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
                configuredPath(properties.getAuthContextPath()),
                configuredPath(properties.getDataSyncBatchPath()),
                ALLOWED_ACTIONS,
                ACTIVE_READ_ACTIONS,
                CONFIRMED_ACTION_CANDIDATES
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
        return query(user, request, false);
    }

    @Transactional(readOnly = true)
    public AssistantQueryResponse queryOnce(User user, AssistantQueryRequest request) {
        return query(user, request, true);
    }

    private AssistantQueryResponse query(User user, AssistantQueryRequest request, boolean oneTimeAnswer) {
        if (request == null || request.query() == null || request.query().isBlank()) {
            throw new IllegalArgumentException("Assistant query is required");
        }
        Map<String, Object> context = safeContext(user, request.context());
        if (oneTimeAnswer) {
            context = explainOnlyContext(context);
        }
        if (!isConfigured()) {
            return fallbackAnswer("LOOMAI_DISABLED", context);
        }
        try {
            String requestedConversationId = conversationId(request.conversationId(), context);
            String providerConversationId = providerConversationId(requestedConversationId, user, false);
            ProviderJsonResponse response = postJson(
                    oneTimeAnswer ? properties.getAssistantQueryOncePath() : properties.getAssistantQueryPath(),
                    assistantQueryPayload(request, context, providerConversationId),
                    user,
                    providerConversationId
            );
            JsonNode body = response.body();
            if (isConversationAccessDenied(body)) {
                String resetConversationId = providerConversationId(requestedConversationId, user, true);
                response = postJson(
                        oneTimeAnswer ? properties.getAssistantQueryOncePath() : properties.getAssistantQueryPath(),
                        assistantQueryPayload(request, context, resetConversationId),
                        user,
                        resetConversationId
                );
                body = response.body();
                providerConversationId = resetConversationId;
            }
            return assistantQueryResponse(response, providerConversationId);
        } catch (RuntimeException exception) {
            log.warn("loomai_assistant_query_fallback reason={} detail={}",
                    exception.getClass().getSimpleName(),
                    safeExceptionDetail(exception));
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
                    assistantSuggestionsPayload(request, context),
                    user,
                    providerConversationId(conversationId(request == null ? null : request.conversationId(), context), user, false)
            );
            JsonNode body = response.body();
            List<String> parsedSuggestions = suggestionList(body);
            List<String> suggestions = parsedSuggestions.isEmpty() ? defaultSuggestionText(context) : parsedSuggestions;
            return new AssistantSuggestionsResponse(
                    "LOOMAI",
                    "LIVE",
                    boolOr(body, "success", true),
                    suggestions,
                    firstText(body.path("fallbackReason"), body.path("errorCode"), body.path("result").path("fallbackReason")),
                    response.providerRequestId()
            );
        } catch (RuntimeException exception) {
            log.warn("loomai_assistant_suggestions_fallback reason={} detail={}",
                    exception.getClass().getSimpleName(),
                    safeExceptionDetail(exception));
            return fallbackSuggestions("LOOMAI_UNAVAILABLE", context);
        }
    }

    @Transactional(readOnly = true)
    public LoomAIAuthContextResponse authContext(User user) {
        requireAdmin(user);
        if (!isConfigured() || !configuredPath(properties.getAuthContextPath())) {
            return new LoomAIAuthContextResponse("PRODUS_FALLBACK", "FALLBACK", false, Map.of(), "LOOMAI_DISABLED", null);
        }
        try {
            ProviderJsonResponse response = getJson(properties.getAuthContextPath(), user, "produs-admin-auth-context-smoke");
            return new LoomAIAuthContextResponse("LOOMAI", "LIVE", true, objectMapper.convertValue(response.body(), Map.class), null, response.providerRequestId());
        } catch (RuntimeException exception) {
            log.warn("loomai_auth_context_fallback reason={} detail={}",
                    exception.getClass().getSimpleName(),
                    safeExceptionDetail(exception));
            return new LoomAIAuthContextResponse("PRODUS_FALLBACK", "FALLBACK", false, Map.of(), "LOOMAI_UNAVAILABLE", null);
        }
    }

    @Transactional(readOnly = true)
    public KnowledgeSyncResponse syncSafeKnowledge(User user) {
        requireAdmin(user);
        return syncSafeKnowledgeInternal("manual-admin");
    }

    @Transactional(readOnly = true)
    public KnowledgeSyncResponse syncSafeKnowledgeSystem() {
        return syncSafeKnowledgeInternal("scheduled-system");
    }

    private KnowledgeSyncResponse syncSafeKnowledgeInternal(String trigger) {
        List<SafeKnowledgeRecord> records = safeKnowledgeRecords();
        if (!isConfigured()) {
            return new KnowledgeSyncResponse("SKIPPED", records.size(), null, null, null, null, List.of(), "LOOMAI_DISABLED");
        }
        try {
            List<Map<String, Object>> errors = new ArrayList<>();
            List<String> providerRequestIds = new ArrayList<>();
            int totalOperations = 0;
            int succeededOperations = 0;
            int failedOperations = 0;
            int batchSize = normalizeSafeKnowledgeSyncBatchSize();
            int batchNumber = 0;

            for (int offset = 0; offset < records.size(); offset += batchSize) {
                batchNumber++;
                List<SafeKnowledgeRecord> batch = records.subList(offset, Math.min(records.size(), offset + batchSize));
                ProviderJsonResponse response = postJson(
                        properties.getDataSyncBatchPath(),
                        safeKnowledgeDataSyncPayload(batch, trigger, offset, batchNumber, records.size()),
                        ProviderAuthSubject.system(
                                SAFE_KNOWLEDGE_SYSTEM_SUBJECT,
                                "produs-safe-knowledge-sync",
                                List.of(DATA_SYNC_SCOPE)
                        )
                );
                JsonNode body = response.body();
                providerRequestIds.add(firstText(
                        body.path("providerRequestId"),
                        body.path("metadata").path("providerRequestId"),
                        body.path("requestId"),
                        body.path("metadata").path("requestId"),
                        textNode(response.providerRequestId())
                ));
                totalOperations += intOrDefault(body, "totalOperations", batch.size());
                succeededOperations += intOrDefault(body, "succeededOperations", batch.size());
                failedOperations += intOrDefault(body, "failedOperations", 0);
                errors.addAll(providerErrors(body));
            }
            return new KnowledgeSyncResponse(
                    failedOperations > 0 || !errors.isEmpty() ? "PARTIAL" : "SYNCED",
                    records.size(),
                    String.join(",", providerRequestIds.stream().filter(id -> !blank(id)).toList()),
                    totalOperations,
                    succeededOperations,
                    failedOperations,
                    errors,
                    null
            );
        } catch (RuntimeException exception) {
            log.warn("loomai_knowledge_sync_failed reason={} detail={}",
                    exception.getClass().getSimpleName(),
                    safeExceptionDetail(exception));
            return new KnowledgeSyncResponse("FAILED", records.size(), null, null, null, null, List.of(), "LOOMAI_UNAVAILABLE");
        }
    }

    @Transactional(readOnly = true)
    public List<SafeKnowledgeRecord> previewSafeKnowledge(User user) {
        requireAdmin(user);
        return safeKnowledgeRecords();
    }

    @Transactional(readOnly = true)
    public KnowledgeExportResponse exportSafeKnowledge(String authorizationHeader, String cursor, Integer limit) {
        requireSafeKnowledgeExportToken(authorizationHeader);
        List<SafeKnowledgeRecord> records = safeKnowledgeRecords();
        int pageSize = normalizeKnowledgeExportLimit(limit);
        int offset = decodeKnowledgeExportCursor(cursor);
        if (offset > records.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "knowledge export cursor is out of range");
        }

        int endExclusive = Math.min(records.size(), offset + pageSize);
        List<KnowledgeExportRecord> page = records.subList(offset, endExclusive).stream()
                .map(this::knowledgeExportRecord)
                .toList();
        boolean hasMore = endExclusive < records.size();
        String nextCursor = hasMore ? encodeKnowledgeExportCursor(endExclusive) : null;

        log.info("loomai_safe_knowledge_export requestId={} offset={} limit={} returned={} total={} hasMore={}",
                nullToEmpty(MDC.get("requestId")),
                offset,
                pageSize,
                page.size(),
                records.size(),
                hasMore);

        return new KnowledgeExportResponse(
                page,
                nextCursor,
                hasMore,
                records.size(),
                SAFE_KNOWLEDGE_EXPORT_VERSION
        );
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
        for (PackageTemplate template : packageTemplateRepository.findAll()) {
            List<PackageTemplateModule> modules = packageTemplateModuleRepository.findByTemplateIdOrderBySequenceOrderAsc(template.getId());
            records.add(record(
                    "milestone-template:package-template:" + template.getSlug(),
                    "MILESTONE_TEMPLATE",
                    template.getName() + " milestone template",
                    milestoneTemplateBody(template, modules),
                    Map.of(
                            "sourceTemplateSlug", template.getSlug(),
                            "sourceTemplateId", template.getId().toString(),
                            "targetProductStage", nullToEmpty(template.getTargetProductStage()),
                            "timelineRange", nullToEmpty(template.getTimelineRange()),
                            "moduleCount", modules.size(),
                            "source", "PACKAGE_TEMPLATE"
                    )
            ));
            records.add(record(
                    "case-pattern:package-template:" + template.getSlug(),
                    "CASE_PATTERN",
                    template.getName() + " productization pattern",
                    casePatternBody(template, modules),
                    Map.of(
                            "sourceTemplateSlug", template.getSlug(),
                            "sourceTemplateId", template.getId().toString(),
                            "targetProductStage", nullToEmpty(template.getTargetProductStage()),
                            "budgetRange", nullToEmpty(template.getBudgetRange()),
                            "moduleCount", modules.size(),
                            "anonymized", true,
                            "source", "PACKAGE_TEMPLATE"
                    )
            ));
        }
        for (CatalogTemplateDefinition definition : templateDefinitionRepository.findByActiveTrueOrderBySortOrderAscNameAsc()) {
            String recordType = templateRecordType(definition.getTemplateType());
            if (recordType == null) {
                continue;
            }
            records.add(record(
                    templateRecordId(recordType, definition.getSlug()),
                    recordType,
                    definition.getName(),
                    joinText(
                            definition.getDescription(),
                            "Required inputs: " + nullToEmpty(definition.getRequiredInputs()),
                            "Template guidance: " + nullToEmpty(definition.getContent()),
                            "Output contract: " + nullToEmpty(definition.getOutputContract())
                    ),
                    Map.of(
                            "slug", definition.getSlug(),
                            "templateType", definition.getTemplateType().name(),
                            "sortOrder", definition.getSortOrder() == null ? 0 : definition.getSortOrder(),
                            "active", definition.isActive(),
                            "source", "CATALOG_TEMPLATE_DEFINITION"
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
        scannerProperties.getTools().forEach((key, tool) -> records.add(record(
                "scanner-tool:" + key,
                "SCANNER_TOOL_DESCRIPTION",
                nullToEmpty(tool.getDisplayName()).isBlank() ? key : tool.getDisplayName(),
                scannerToolBody(key, tool),
                Map.of(
                        "toolKey", key,
                        "enabled", tool.isEnabled(),
                        "targetType", nullToEmpty(tool.getTargetType()),
                        "outputFormat", nullToEmpty(tool.getOutputFormat()),
                        "requiresIac", tool.isRequiresIac(),
                        "timeoutSeconds", tool.getTimeoutSeconds(),
                        "source", "SCANNER_CONFIGURATION"
                )
        )));
        for (Team team : teamRepository.findByActiveTrueOrderByCreatedAtDesc()) {
            if (team.getVerificationStatus() == Team.VerificationStatus.SUSPENDED) {
                continue;
            }
            List<TeamCapability> capabilities = teamCapabilityRepository.findByTeamId(team.getId());
            List<String> capabilityCategories = capabilities.stream()
                    .map(capability -> capability.getServiceCategory() == null ? "" : capability.getServiceCategory().getSlug())
                    .filter(value -> !value.isBlank())
                    .distinct()
                    .toList();
            List<String> serviceModules = capabilities.stream()
                    .map(capability -> capability.getServiceModule() == null ? "" : capability.getServiceModule().getSlug())
                    .filter(value -> !value.isBlank())
                    .distinct()
                    .toList();
            records.add(record(
                    "team-profile:" + team.getId(),
                    "TEAM_PROFILE",
                    team.getName(),
                    joinText(
                            team.getHeadline(),
                            team.getDescription(),
                            team.getBio(),
                            team.getCapabilitiesSummary(),
                            safeCapabilityText(capabilities)
                    ),
                    Map.of(
                            "teamId", team.getId().toString(),
                            "verificationStatus", team.getVerificationStatus().name(),
                            "timezone", nullToEmpty(team.getTimezone()),
                            "typicalProjectSize", nullToEmpty(team.getTypicalProjectSize()),
                            "capabilityCategories", capabilityCategories,
                            "serviceModules", serviceModules,
                            "profilePhotoAvailable", !blank(team.getProfilePhotoUrl()),
                            "coverPhotoAvailable", !blank(team.getCoverPhotoUrl()),
                            "websiteAvailable", !blank(team.getWebsiteUrl())
                    )
            ));
        }
        for (ExpertProfile profile : expertProfileRepository.findByActiveTrueOrderByUpdatedAtDesc()) {
            if (!profile.isSoloMode()) {
                continue;
            }
            records.add(record(
                    "solo-expert-profile:" + profile.getId(),
                    "SOLO_EXPERT_PROFILE",
                    profile.getDisplayName(),
                    joinText(
                            profile.getHeadline(),
                            profile.getBio(),
                            profile.getSkills()
                    ),
                    Map.of(
                            "expertProfileId", profile.getId().toString(),
                            "availability", profile.getAvailability().name(),
                            "location", nullToEmpty(profile.getLocation()),
                            "timezone", nullToEmpty(profile.getTimezone()),
                            "preferredProjectSize", nullToEmpty(profile.getPreferredProjectSize()),
                            "skills", nullToEmpty(profile.getSkills()),
                            "profilePhotoAvailable", !blank(profile.getProfilePhotoUrl()),
                            "coverPhotoAvailable", !blank(profile.getCoverPhotoUrl()),
                            "websiteAvailable", !blank(profile.getWebsiteUrl()),
                            "portfolioAvailable", !blank(profile.getPortfolioUrl())
                    )
            ));
        }
        return records;
    }

    private SafeKnowledgeRecord record(String id, String type, String title, String body, Map<String, Object> metadata) {
        return new SafeKnowledgeRecord(id, type, title, nullToEmpty(body), metadata);
    }

    private Map<String, Object> safeKnowledgeDataSyncPayload(
            List<SafeKnowledgeRecord> records,
            String trigger,
            int batchOffset,
            int batchNumber,
            int totalRecordCount
    ) {
        String requestId = "produs-safe-knowledge-sync-" + UUID.randomUUID();
        Map<String, Object> authContext = new LinkedHashMap<>();
        authContext.put("subjectId", SAFE_KNOWLEDGE_SYSTEM_SUBJECT);
        authContext.put("subjectType", "SYSTEM_PROCESS");
        authContext.put("authMode", "PRIVATE_RUNTIME_BACKEND_MEDIATED");
        authContext.put("callerType", "SYSTEM_PROCESS");
        authContext.put("deploymentId", properties.getAssertionAudience());
        authContext.put("customerId", properties.getAssertionCustomerId());
        authContext.put("issuer", properties.getAssertionIssuer());
        authContext.put("grantedScopes", List.of(DATA_SYNC_SCOPE));

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("source", "ProdUS");
        metadata.put("environment", properties.getEnvironment());
        metadata.put("datasetId", safeKnowledgeDatasetId());
        metadata.put("trigger", trigger);
        metadata.put("recordCount", records.size());
        metadata.put("totalRecordCount", totalRecordCount);
        metadata.put("batchOffset", batchOffset);
        metadata.put("batchNumber", batchNumber);

        Map<String, Object> trace = new LinkedHashMap<>();
        trace.put("requestId", requestId);
        trace.put("metadata", metadata);
        trace.put("authContext", authContext);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("trace", trace);
        payload.put("operations", records.stream().map(this::safeKnowledgeOperation).toList());
        return payload;
    }

    private Map<String, Object> safeKnowledgeOperation(SafeKnowledgeRecord record) {
        Map<String, Object> metadata = safeKnowledgeMetadata(record);
        Map<String, Object> identity = new LinkedHashMap<>();
        identity.put("sourceRecordId", record.id());
        identity.put("sourceRecordVersion", sourceRecordVersion(record));

        Map<String, Object> operation = new LinkedHashMap<>();
        operation.put("type", "UPSERT");
        operation.put("vectorSpace", vectorSpace(record.type()));
        operation.put("id", record.id());
        operation.put("content", safeText(joinText(record.title(), record.body()), KNOWLEDGE_CONTENT_LIMIT));
        operation.put("metadata", metadata);
        operation.put("identity", identity);
        return operation;
    }

    private Map<String, Object> safeKnowledgeMetadata(SafeKnowledgeRecord record) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("recordType", record.type());
        metadata.put("title", safeText(record.title(), FIELD_LIMIT));
        metadata.put("datasetId", safeKnowledgeDatasetId());
        metadata.put("sourceRecordVersion", sourceRecordVersion(record));
        if (record.metadata() != null) {
            record.metadata().forEach((key, value) -> metadata.put(key, safeMetadataValue(value)));
        }
        return metadata;
    }

    private Object safeMetadataValue(Object value) {
        if (value instanceof String text) {
            return safeText(text, SUMMARY_LIMIT);
        }
        if (value instanceof Collection<?> collection) {
            return collection.stream()
                    .map(item -> item instanceof String text ? safeText(text, FIELD_LIMIT) : item)
                    .toList();
        }
        return value;
    }

    private int normalizeSafeKnowledgeSyncBatchSize() {
        int configured = properties.getSafeKnowledgeSyncBatchSize();
        if (configured < 1) {
            return 50;
        }
        return Math.min(configured, MAX_KNOWLEDGE_EXPORT_LIMIT);
    }

    private String vectorSpace(String recordType) {
        return switch (recordType) {
            case "SERVICE_CATEGORY" -> "service-category";
            case "SERVICE_MODULE" -> "service-module";
            case "SERVICE_DEPENDENCY" -> "service-dependency";
            case "PACKAGE_TEMPLATE" -> "package-template";
            case "AI_CAPABILITY_CONTRACT" -> "ai-capability-contract";
            case "MILESTONE_TEMPLATE" -> "milestone-template";
            case "ACCEPTANCE_CRITERIA_TEMPLATE" -> "acceptance-criteria-template";
            case "EVIDENCE_TEMPLATE" -> "evidence-template";
            case "SCANNER_TOOL_DESCRIPTION" -> "scanner-tool-description";
            case "CASE_PATTERN" -> "case-pattern";
            case "TEAM_PROFILE" -> "team-profile";
            case "SOLO_EXPERT_PROFILE" -> "solo-expert-profile";
            default -> throw new IllegalArgumentException("Unsupported safe knowledge record type: " + recordType);
        };
    }

    private KnowledgeExportRecord knowledgeExportRecord(SafeKnowledgeRecord record) {
        return new KnowledgeExportRecord(
                record.id(),
                record.type(),
                vectorSpace(record.type()),
                safeText(record.title(), FIELD_LIMIT),
                safeText(record.body(), KNOWLEDGE_CONTENT_LIMIT),
                safeKnowledgeMetadata(record),
                false
        );
    }

    private void requireSafeKnowledgeExportToken(String authorizationHeader) {
        String configuredToken = nullToEmpty(properties.getSafeKnowledgeExportToken()).trim();
        if (configuredToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "safe knowledge export token is not configured");
        }
        if (blank(authorizationHeader) || !authorizationHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "safe knowledge export token is required");
        }
        String submittedToken = authorizationHeader.substring("Bearer ".length()).trim();
        if (!constantTimeEquals(configuredToken, submittedToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "safe knowledge export token is invalid");
        }
    }

    private int normalizeKnowledgeExportLimit(Integer limit) {
        if (limit == null) {
            return DEFAULT_KNOWLEDGE_EXPORT_LIMIT;
        }
        if (limit < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "knowledge export limit must be at least 1");
        }
        return Math.min(limit, MAX_KNOWLEDGE_EXPORT_LIMIT);
    }

    private int decodeKnowledgeExportCursor(String cursor) {
        if (blank(cursor)) {
            return 0;
        }
        try {
            String decoded = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
            String prefix = SAFE_KNOWLEDGE_EXPORT_VERSION + ":";
            if (!decoded.startsWith(prefix)) {
                throw new IllegalArgumentException("unexpected cursor version");
            }
            int offset = Integer.parseInt(decoded.substring(prefix.length()));
            if (offset < 0) {
                throw new IllegalArgumentException("negative cursor offset");
            }
            return offset;
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "knowledge export cursor is invalid");
        }
    }

    private String encodeKnowledgeExportCursor(int offset) {
        String rawCursor = SAFE_KNOWLEDGE_EXPORT_VERSION + ":" + offset;
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(rawCursor.getBytes(StandardCharsets.UTF_8));
    }

    private boolean constantTimeEquals(String expected, String actual) {
        byte[] expectedBytes = expected.getBytes(StandardCharsets.UTF_8);
        byte[] actualBytes = nullToEmpty(actual).getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expectedBytes, actualBytes);
    }

    private String sourceRecordVersion(SafeKnowledgeRecord record) {
        return sha256Hex(record.id() + "\n" + record.type() + "\n" + record.title() + "\n" + record.body() + "\n" + record.metadata());
    }

    private String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(nullToEmpty(value).getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (byte byteValue : hash) {
                builder.append(String.format("%02x", byteValue));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    private String safeKnowledgeDatasetId() {
        return blank(properties.getSafeKnowledgeDatasetId()) ? "produs-safe-knowledge" : properties.getSafeKnowledgeDatasetId().trim();
    }

    private String milestoneTemplateBody(PackageTemplate template, List<PackageTemplateModule> modules) {
        return joinText(
                "Reusable milestone sequence derived from approved package template " + template.getName() + ".",
                template.getDescription(),
                template.getOutcomeSummary(),
                "Target product stage: " + nullToEmpty(template.getTargetProductStage()),
                "Timeline: " + nullToEmpty(template.getTimelineRange()),
                "Service sequence: " + packageModuleSequenceText(modules)
        );
    }

    private String casePatternBody(PackageTemplate template, List<PackageTemplateModule> modules) {
        return joinText(
                "Anonymized productization case pattern derived from the approved package template " + template.getName() + ".",
                "Customer fit: " + nullToEmpty(template.getCustomerFit()),
                "Expected outcome: " + nullToEmpty(template.getOutcomeSummary()),
                "Budget range: " + nullToEmpty(template.getBudgetRange()),
                "Timeline: " + nullToEmpty(template.getTimelineRange()),
                "Recommended delivery pattern: " + packageModuleSequenceText(modules)
        );
    }

    private String packageModuleSequenceText(List<PackageTemplateModule> modules) {
        if (modules == null || modules.isEmpty()) {
            return "No service modules are attached to this package template yet.";
        }
        return String.join("; ", modules.stream()
                .map(module -> {
                    ServiceModule service = module.getServiceModule();
                    String serviceName = service == null ? "Unknown service" : service.getName();
                    String serviceSlug = service == null ? "" : service.getSlug();
                    String phase = nullToEmpty(module.getPhaseName());
                    String rationale = nullToEmpty(module.getRationale());
                    return joinInline(
                            "Step " + module.getSequenceOrder(),
                            phase.isBlank() ? null : "phase " + phase,
                            serviceSlug.isBlank() ? serviceName : serviceName + " (" + serviceSlug + ")",
                            module.isRequired() ? "required" : "optional",
                            rationale
                    );
                })
                .toList());
    }

    private String templateRecordType(CatalogTemplateDefinition.TemplateType type) {
        if (type == null) {
            return null;
        }
        return switch (type) {
            case MILESTONE -> "MILESTONE_TEMPLATE";
            case ACCEPTANCE_CRITERION -> "ACCEPTANCE_CRITERIA_TEMPLATE";
            case EVIDENCE -> "EVIDENCE_TEMPLATE";
            default -> null;
        };
    }

    private String templateRecordId(String recordType, String slug) {
        String prefix = switch (recordType) {
            case "MILESTONE_TEMPLATE" -> "milestone-template:";
            case "ACCEPTANCE_CRITERIA_TEMPLATE" -> "acceptance-criteria-template:";
            case "EVIDENCE_TEMPLATE" -> "evidence-template:";
            default -> throw new IllegalArgumentException("Unsupported template record type: " + recordType);
        };
        return prefix + slug;
    }

    private String scannerToolBody(String key, ScannerProperties.ToolProperties tool) {
        return joinText(
                scannerToolDescription(key, tool),
                "Target type: " + nullToEmpty(tool.getTargetType()),
                "Output format: " + nullToEmpty(tool.getOutputFormat()),
                "Infrastructure-as-code required: " + tool.isRequiresIac(),
                "Timeout seconds: " + tool.getTimeoutSeconds()
        );
    }

    private String scannerToolDescription(String key, ScannerProperties.ToolProperties tool) {
        String displayName = nullToEmpty(tool.getDisplayName()).isBlank() ? key : tool.getDisplayName();
        return switch (key) {
            case "gitleaks" -> "Gitleaks identifies exposed credentials and sensitive tokens in source repositories before production access is granted.";
            case "osv-scanner" -> "OSV-Scanner identifies vulnerable open-source dependencies and package ecosystem risks.";
            case "semgrep" -> "Semgrep performs static code analysis for insecure patterns, framework misuse, and code quality risks.";
            case "trivy-fs" -> "Trivy filesystem scanning reviews application dependencies, operating-system packages, and configuration risk in a repository.";
            case "checkov" -> "Checkov reviews infrastructure-as-code for cloud, Kubernetes, and policy misconfigurations.";
            case "syft" -> "Syft generates software bills of materials for container images and application artifacts.";
            case "grype" -> "Grype analyzes software bills of materials and container images for known vulnerabilities.";
            case "trivy-image" -> "Trivy image scanning reviews container images for vulnerable packages and misconfiguration signals.";
            case "lighthouse" -> "Lighthouse measures runtime web performance, accessibility, best-practice, and SEO readiness signals.";
            case "zap-baseline" -> "OWASP ZAP Baseline performs passive web application security checks against a runtime URL.";
            default -> displayName + " is a configured ProdUS scanner tool used to produce normalized productization evidence.";
        };
    }

    private String safeCapabilityText(List<TeamCapability> capabilities) {
        if (capabilities == null || capabilities.isEmpty()) {
            return "";
        }
        List<String> values = capabilities.stream()
                .map(capability -> {
                    String category = capability.getServiceCategory() == null ? "" : capability.getServiceCategory().getName();
                    String module = capability.getServiceModule() == null ? "" : capability.getServiceModule().getName();
                    return joinText(category, module, capability.getNotes());
                })
                .filter(value -> !value.isBlank())
                .toList();
        return values.isEmpty() ? "" : "Verified public capabilities: " + String.join("; ", values);
    }

    private String joinInline(String... parts) {
        List<String> values = new ArrayList<>();
        for (String part : parts) {
            if (part != null && !part.isBlank()) {
                values.add(part.trim());
            }
        }
        return String.join(" - ", values);
    }

    private Map<String, Object> safeContext(User user, AssistantContextRequest context) {
        Map<String, Object> safe = new LinkedHashMap<>();
        safe.put("contextVersion", "produs-safe-summary-v1");
        safe.put("contextBoundary", "authorized-redacted-summaries-only");
        safe.put("actionProfile", "loomai-productization-read");
        safe.put("availableActionGroups", ACTION_GROUP_HINTS);
        safe.put("actorRole", user.getRole().name());
        safe.put("pageType", context == null || context.pageType() == null ? "unknown" : context.pageType());
        if (context == null) {
            return safe;
        }
        ProductProfile scopedProduct = null;
        PackageInstance scopedPackage = null;
        ProjectWorkspace scopedWorkspace = null;
        Milestone scopedMilestone = null;
        NormalizedFinding scopedFinding = null;
        if (context.workspaceId() != null) {
            scopedWorkspace = workspaceRepository.findById(context.workspaceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
            requireWorkspaceRead(user, scopedWorkspace);
            safe.put("workspaceId", scopedWorkspace.getId().toString());
            safe.put("workspaceStatus", scopedWorkspace.getStatus().name());
            safe.put("workspaceSummary", workspaceSummary(scopedWorkspace));
            scopedPackage = scopedPackage == null ? scopedWorkspace.getPackageInstance() : scopedPackage;
            scopedProduct = scopedProduct == null && scopedWorkspace.getPackageInstance() != null ? scopedWorkspace.getPackageInstance().getProductProfile() : scopedProduct;
        }
        if (context.productId() != null) {
            ProductProfile requestedProduct = productRepository.findById(context.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product profile not found"));
            if (!contextProductMatchesWorkspace(scopedWorkspace, requestedProduct)) {
                requireProductRead(user, requestedProduct);
            }
            scopedProduct = requestedProduct;
            safe.put("productId", scopedProduct.getId().toString());
            safe.put("productStage", scopedProduct.getBusinessStage() == null ? "" : scopedProduct.getBusinessStage().name());
            safe.put("productName", safeText(scopedProduct.getName(), FIELD_LIMIT));
            safe.put("productSummary", productSummary(scopedProduct));
        }
        if (context.packageId() != null) {
            PackageInstance requestedPackage = packageRepository.findById(context.packageId())
                    .orElseThrow(() -> new ResourceNotFoundException("Package not found"));
            if (!contextPackageMatchesWorkspace(scopedWorkspace, requestedPackage)) {
                requirePackageRead(user, requestedPackage);
            }
            scopedPackage = requestedPackage;
            safe.put("packageId", scopedPackage.getId().toString());
            safe.put("packageStatus", scopedPackage.getStatus().name());
            safe.put("packageSummary", packageSummary(scopedPackage));
            scopedProduct = scopedProduct == null ? scopedPackage.getProductProfile() : scopedProduct;
        }
        if (context.milestoneId() != null) {
            scopedMilestone = milestoneRepository.findById(context.milestoneId())
                    .orElseThrow(() -> new ResourceNotFoundException("Milestone not found"));
            requireWorkspaceRead(user, scopedMilestone.getWorkspace());
            safe.put("milestoneId", scopedMilestone.getId().toString());
            safe.put("milestoneStatus", scopedMilestone.getStatus().name());
            safe.put("milestoneSummary", milestoneSummary(scopedMilestone));
            scopedWorkspace = scopedWorkspace == null ? scopedMilestone.getWorkspace() : scopedWorkspace;
            scopedPackage = scopedPackage == null && scopedWorkspace != null ? scopedWorkspace.getPackageInstance() : scopedPackage;
            scopedProduct = scopedProduct == null && scopedPackage != null ? scopedPackage.getProductProfile() : scopedProduct;
        }
        if (context.findingId() != null) {
            scopedFinding = findingRepository.findById(context.findingId())
                    .orElseThrow(() -> new ResourceNotFoundException("Finding not found"));
            requireProductOrWorkspaceRead(user, scopedFinding.getProductProfile(), scopedFinding.getWorkspace());
            safe.put("findingId", scopedFinding.getId().toString());
            safe.put("findingSeverity", scopedFinding.getSeverity().name());
            safe.put("findingStatus", scopedFinding.getStatus().name());
            safe.put("findingSummary", findingSummary(scopedFinding));
            scopedProduct = scopedProduct == null ? scopedFinding.getProductProfile() : scopedProduct;
            scopedWorkspace = scopedWorkspace == null ? scopedFinding.getWorkspace() : scopedWorkspace;
        }
        if (scopedProduct != null && !safe.containsKey("productSummary")) {
            safe.put("productId", scopedProduct.getId().toString());
            safe.put("productStage", scopedProduct.getBusinessStage() == null ? "" : scopedProduct.getBusinessStage().name());
            safe.put("productName", safeText(scopedProduct.getName(), FIELD_LIMIT));
            safe.put("productSummary", productSummary(scopedProduct));
        }
        if (scopedPackage != null && !safe.containsKey("packageSummary")) {
            safe.put("packageId", scopedPackage.getId().toString());
            safe.put("packageStatus", scopedPackage.getStatus().name());
            safe.put("packageSummary", packageSummary(scopedPackage));
        }
        if (scopedWorkspace != null && !safe.containsKey("workspaceSummary")) {
            safe.put("workspaceId", scopedWorkspace.getId().toString());
            safe.put("workspaceStatus", scopedWorkspace.getStatus().name());
            safe.put("workspaceSummary", workspaceSummary(scopedWorkspace));
        }
        if (scopedProduct != null) {
            safe.put("diagnosisSummary", diagnosisSummary(scopedProduct));
            safe.put("scannerSummary", scannerSummary(scopedProduct, scopedWorkspace));
        }
        return safe;
    }

    private Map<String, Object> explainOnlyContext(Map<String, Object> context) {
        Map<String, Object> safe = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : context.entrySet()) {
            if (isContextIdentifierKey(entry.getKey())) {
                continue;
            }
            safe.put(entry.getKey(), stripIdentifiersForExplainOnly(entry.getValue()));
        }
        safe.put("assistantIntent", "one-time-explanation");
        safe.put("toolUsePolicy", "answer-from-supplied-context-and-safe-indexed-knowledge");
        safe.put("actionProfile", "loomai-productization-explain-only");
        safe.put("availableActionGroups", List.of());
        return safe;
    }

    @SuppressWarnings("unchecked")
    private Object stripIdentifiersForExplainOnly(Object value) {
        if (value instanceof Map<?, ?> source) {
            Map<String, Object> sanitized = new LinkedHashMap<>();
            source.forEach((key, nestedValue) -> {
                String textKey = String.valueOf(key);
                if (!isContextIdentifierKey(textKey)) {
                    sanitized.put(textKey, stripIdentifiersForExplainOnly(nestedValue));
                }
            });
            return sanitized;
        }
        if (value instanceof List<?> source) {
            return source.stream().map(this::stripIdentifiersForExplainOnly).toList();
        }
        return value;
    }

    private boolean isContextIdentifierKey(String key) {
        if (key == null) {
            return false;
        }
        String normalized = key.trim();
        return normalized.equals("id")
                || normalized.equals("productId")
                || normalized.equals("packageId")
                || normalized.equals("workspaceId")
                || normalized.equals("milestoneId")
                || normalized.equals("findingId")
                || normalized.endsWith("Id");
    }

    private boolean contextProductMatchesWorkspace(ProjectWorkspace workspace, ProductProfile product) {
        if (workspace == null || product == null || workspace.getPackageInstance() == null
                || workspace.getPackageInstance().getProductProfile() == null) {
            return false;
        }
        return workspace.getPackageInstance().getProductProfile().getId().equals(product.getId());
    }

    private boolean contextPackageMatchesWorkspace(ProjectWorkspace workspace, PackageInstance packageInstance) {
        if (workspace == null || packageInstance == null || workspace.getPackageInstance() == null) {
            return false;
        }
        return workspace.getPackageInstance().getId().equals(packageInstance.getId());
    }

    private Map<String, Object> productSummary(ProductProfile product) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("name", safeText(product.getName(), FIELD_LIMIT));
        value.put("summary", safeText(product.getSummary(), SUMMARY_LIMIT));
        value.put("businessStage", product.getBusinessStage() == null ? "" : product.getBusinessStage().name());
        value.put("techStack", safeText(product.getTechStack(), SUMMARY_LIMIT));
        value.put("riskProfile", safeText(product.getRiskProfile(), SUMMARY_LIMIT));
        value.put("productUrlAvailable", !blank(product.getProductUrl()));
        value.put("repositoryUrlAvailable", !blank(product.getRepositoryUrl()));
        value.put("ownerPresent", product.getOwner() != null);
        return value;
    }

    private Map<String, Object> diagnosisSummary(ProductProfile product) {
        Map<String, Object> value = new LinkedHashMap<>();
        List<ProductDiagnosis> diagnoses = diagnosisRepository.findByProductProfileIdOrderByCreatedAtDesc(product.getId());
        value.put("present", !diagnoses.isEmpty());
        value.put("diagnosisCount", diagnoses.size());
        if (diagnoses.isEmpty()) {
            value.put("instruction", "No deterministic diagnosis exists yet; recommend running product diagnosis before making readiness claims.");
            return value;
        }
        ProductDiagnosis diagnosis = diagnoses.getFirst();
        List<ProductFinding> findings = productFindingRepository.findByDiagnosisIdOrderByCreatedAtAsc(diagnosis.getId());
        value.put("id", diagnosis.getId().toString());
        value.put("createdAt", diagnosis.getCreatedAt() == null ? "" : diagnosis.getCreatedAt().toString());
        value.put("readinessScore", diagnosis.getReadinessScore());
        value.put("status", diagnosis.getStatus().name());
        value.put("summary", safeText(diagnosis.getSummary(), SUMMARY_LIMIT));
        value.put("accessSignals", safeText(diagnosis.getAccessSignals(), SUMMARY_LIMIT));
        value.put("aiReady", diagnosis.isAiReady());
        value.put("aiExecuted", diagnosis.isAiExecuted());
        value.put("findingCount", findings.size());
        value.put("findingSeverityCounts", countBy(findings, finding -> finding.getSeverity().name()));
        value.put("findingStatusCounts", countBy(findings, finding -> finding.getStatus().name()));
        value.put("findings", findings.stream()
                .limit(LIST_LIMIT)
                .map(this::productFindingSummary)
                .toList());
        return value;
    }

    private Map<String, Object> productFindingSummary(ProductFinding finding) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("title", safeText(finding.getTitle(), FIELD_LIMIT));
        value.put("description", safeText(finding.getDescription(), SUMMARY_LIMIT));
        value.put("affectedLayer", safeText(finding.getAffectedLayer(), FIELD_LIMIT));
        value.put("severity", finding.getSeverity().name());
        value.put("status", finding.getStatus().name());
        value.put("confidenceLevel", finding.getConfidenceLevel().name());
        value.put("confidenceBasis", safeText(finding.getConfidenceBasis(), SUMMARY_LIMIT));
        value.put("sourceSignal", safeText(finding.getSourceSignal(), SUMMARY_LIMIT));
        ServiceModule recommended = finding.getRecommendedModule();
        value.put("recommendedService", recommended == null ? Map.of() : Map.of(
                "slug", recommended.getSlug(),
                "name", safeText(recommended.getName(), FIELD_LIMIT),
                "categorySlug", recommended.getCategory() == null ? "" : recommended.getCategory().getSlug()
        ));
        return value;
    }

    private Map<String, Object> packageSummary(PackageInstance packageInstance) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("name", safeText(packageInstance.getName(), FIELD_LIMIT));
        value.put("summary", safeText(packageInstance.getSummary(), SUMMARY_LIMIT));
        value.put("status", packageInstance.getStatus().name());
        value.put("productId", packageInstance.getProductProfile() == null ? "" : packageInstance.getProductProfile().getId().toString());
        value.put("productName", packageInstance.getProductProfile() == null ? "" : safeText(packageInstance.getProductProfile().getName(), FIELD_LIMIT));
        List<PackageModule> modules = packageModuleRepository.findByPackageInstanceIdOrderBySequenceOrderAsc(packageInstance.getId());
        value.put("serviceCount", modules.size());
        value.put("serviceStatusCounts", countBy(modules, module -> module.getStatus().name()));
        value.put("services", modules.stream()
                .limit(LIST_LIMIT)
                .map(this::packageModuleSummary)
                .toList());
        return value;
    }

    private Map<String, Object> packageModuleSummary(PackageModule module) {
        Map<String, Object> value = new LinkedHashMap<>();
        ServiceModule service = module.getServiceModule();
        value.put("serviceSlug", service == null ? "" : service.getSlug());
        value.put("serviceName", service == null ? "" : safeText(service.getName(), FIELD_LIMIT));
        value.put("categorySlug", service == null || service.getCategory() == null ? "" : service.getCategory().getSlug());
        value.put("required", module.isRequired());
        value.put("status", module.getStatus().name());
        value.put("rationale", safeText(module.getRationale(), SUMMARY_LIMIT));
        value.put("deliverables", safeText(module.getDeliverables(), SUMMARY_LIMIT));
        value.put("acceptanceCriteria", safeText(module.getAcceptanceCriteria(), SUMMARY_LIMIT));
        return value;
    }

    private Map<String, Object> workspaceSummary(ProjectWorkspace workspace) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("name", safeText(workspace.getName(), FIELD_LIMIT));
        value.put("status", workspace.getStatus().name());
        value.put("packageId", workspace.getPackageInstance() == null ? "" : workspace.getPackageInstance().getId().toString());
        value.put("packageName", workspace.getPackageInstance() == null ? "" : safeText(workspace.getPackageInstance().getName(), FIELD_LIMIT));
        value.put("participantCount", participantRepository.findByWorkspaceIdOrderByCreatedAtAsc(workspace.getId()).size());
        List<Milestone> milestones = milestoneRepository.findByWorkspaceIdOrderByCreatedAtAsc(workspace.getId());
        value.put("milestoneCount", milestones.size());
        value.put("milestoneStatusCounts", countBy(milestones, milestone -> milestone.getStatus().name()));
        value.put("milestones", milestones.stream()
                .limit(LIST_LIMIT)
                .map(this::milestoneBrief)
                .toList());
        return value;
    }

    private Map<String, Object> milestoneSummary(Milestone milestone) {
        Map<String, Object> value = milestoneBrief(milestone);
        List<Deliverable> deliverables = deliverableRepository.findByMilestoneIdOrderByCreatedAtAsc(milestone.getId());
        List<ScannerEvidenceItem> evidence = evidenceItemRepository.findByMilestoneIdOrderByCreatedAtDesc(milestone.getId());
        value.put("deliverableCount", deliverables.size());
        value.put("deliverableStatusCounts", countBy(deliverables, deliverable -> deliverable.getStatus().name()));
        value.put("deliverables", deliverables.stream()
                .limit(LIST_LIMIT)
                .map(this::deliverableSummary)
                .toList());
        value.put("evidenceCount", evidence.size());
        value.put("evidence", evidence.stream()
                .limit(LIST_LIMIT)
                .map(this::evidenceSummary)
                .toList());
        return value;
    }

    private Map<String, Object> milestoneBrief(Milestone milestone) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("id", milestone.getId().toString());
        value.put("title", safeText(milestone.getTitle(), FIELD_LIMIT));
        value.put("description", safeText(milestone.getDescription(), SUMMARY_LIMIT));
        value.put("dueDate", milestone.getDueDate() == null ? "" : milestone.getDueDate().toString());
        value.put("status", milestone.getStatus().name());
        return value;
    }

    private Map<String, Object> deliverableSummary(Deliverable deliverable) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("title", safeText(deliverable.getTitle(), FIELD_LIMIT));
        value.put("status", deliverable.getStatus().name());
        value.put("evidenceSummary", safeText(deliverable.getEvidence(), SUMMARY_LIMIT));
        return value;
    }

    private Map<String, Object> findingSummary(NormalizedFinding finding) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("title", safeText(finding.getTitle(), FIELD_LIMIT));
        value.put("description", safeText(finding.getDescription(), SUMMARY_LIMIT));
        value.put("severity", finding.getSeverity().name());
        value.put("status", finding.getStatus().name());
        value.put("sourceTool", safeText(finding.getSourceTool(), FIELD_LIMIT));
        value.put("sourceRuleId", safeText(finding.getSourceRuleId(), FIELD_LIMIT));
        value.put("affectedComponent", safeText(finding.getAffectedComponent(), FIELD_LIMIT));
        value.put("confidenceBasis", safeText(finding.getConfidenceBasis(), SUMMARY_LIMIT));
        value.put("riskReviewDueOn", finding.getRiskReviewDueOn() == null ? "" : finding.getRiskReviewDueOn().toString());
        ServiceModule recommended = finding.getRecommendedModule();
        value.put("recommendedService", recommended == null ? Map.of() : Map.of(
                "slug", recommended.getSlug(),
                "name", safeText(recommended.getName(), FIELD_LIMIT),
                "categorySlug", recommended.getCategory() == null ? "" : recommended.getCategory().getSlug()
        ));
        List<ScannerEvidenceItem> evidence = evidenceItemRepository.findByFindingIdOrderByCreatedAtDesc(finding.getId());
        value.put("evidenceCount", evidence.size());
        value.put("evidence", evidence.stream()
                .limit(LIST_LIMIT)
                .map(this::evidenceSummary)
                .toList());
        if (finding.getScanRun() != null) {
            value.put("scanRun", scanRunSummary(finding.getScanRun()));
        }
        return value;
    }

    private Map<String, Object> scannerSummary(ProductProfile product, ProjectWorkspace workspace) {
        Map<String, Object> value = new LinkedHashMap<>();
        List<ScanRun> scanRuns = workspace == null
                ? scanRunRepository.findByProductProfileIdOrderByCreatedAtDesc(product.getId())
                : scanRunRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspace.getId());
        List<NormalizedFinding> findings = findingRepository.findByProductProfileIdOrderBySeverityDescCreatedAtDesc(product.getId()).stream()
                .filter(finding -> workspace == null || (finding.getWorkspace() != null && workspace.getId().equals(finding.getWorkspace().getId())))
                .toList();
        List<ScannerEvidenceItem> evidence = workspace == null
                ? evidenceItemRepository.findByProductProfileIdOrderByCreatedAtDesc(product.getId())
                : evidenceItemRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspace.getId());
        value.put("scanRunCount", scanRuns.size());
        value.put("scanRunStatusCounts", countBy(scanRuns, scanRun -> scanRun.getStatus().name()));
        value.put("latestScanRuns", scanRuns.stream()
                .limit(3)
                .map(this::scanRunSummary)
                .toList());
        value.put("findingCount", findings.size());
        value.put("findingSeverityCounts", countBy(findings, finding -> finding.getSeverity().name()));
        value.put("findingStatusCounts", countBy(findings, finding -> finding.getStatus().name()));
        value.put("topFindings", findings.stream()
                .limit(LIST_LIMIT)
                .map(finding -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", finding.getId().toString());
                    item.put("title", safeText(finding.getTitle(), FIELD_LIMIT));
                    item.put("severity", finding.getSeverity().name());
                    item.put("status", finding.getStatus().name());
                    item.put("sourceTool", safeText(finding.getSourceTool(), FIELD_LIMIT));
                    ServiceModule recommended = finding.getRecommendedModule();
                    item.put("recommendedServiceSlug", recommended == null ? "" : recommended.getSlug());
                    return item;
                })
                .toList());
        value.put("evidenceCount", evidence.size());
        value.put("latestEvidence", evidence.stream()
                .limit(LIST_LIMIT)
                .map(this::evidenceSummary)
                .toList());
        return value;
    }

    private Map<String, Object> scanRunSummary(ScanRun scanRun) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("id", scanRun.getId().toString());
        value.put("status", scanRun.getStatus().name());
        value.put("depth", scanRun.getDepth().name());
        value.put("triggerType", scanRun.getTriggerType().name());
        value.put("startedAt", scanRun.getStartedAt() == null ? "" : scanRun.getStartedAt().toString());
        value.put("completedAt", scanRun.getCompletedAt() == null ? "" : scanRun.getCompletedAt().toString());
        value.put("failureSummary", safeText(scanRun.getFailureSummary(), SUMMARY_LIMIT));
        value.put("cancelRequested", scanRun.isCancelRequested());
        return value;
    }

    private Map<String, Object> evidenceSummary(ScannerEvidenceItem evidence) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("id", evidence.getId().toString());
        value.put("type", evidence.getEvidenceType().name());
        value.put("source", safeText(evidence.getSource(), FIELD_LIMIT));
        value.put("title", safeText(evidence.getTitle(), FIELD_LIMIT));
        value.put("summary", safeText(evidence.getSummary(), SUMMARY_LIMIT));
        value.put("redactionStatus", evidence.getRedactionStatus().name());
        value.put("confidenceLevel", evidence.getConfidenceLevel().name());
        value.put("artifactAvailable", !blank(evidence.getArtifactRef()) || !blank(evidence.getStorageKey()));
        return value;
    }

    private Map<String, Object> assistantQueryPayload(AssistantQueryRequest request, Map<String, Object> context, String conversationId) {
        if (properties.isPrivateRuntimeMode() || properties.isPlatformBridgeMode()) {
            Map<String, Object> payload = runtimeChatPayload(context, conversationId);
            payload.put("query", request.query());
            payload.put("mode", mode(request.mode()));
            payload.put("position", position(request.position()));
            return payload;
        }
        return Map.of(
                "environment", properties.getEnvironment(),
                "conversationId", request.conversationId() == null ? "" : request.conversationId(),
                "query", request.query(),
                "mode", mode(request.mode()),
                "position", position(request.position()),
                "context", context,
                "allowedActions", ALLOWED_ACTIONS
        );
    }

    private Map<String, Object> assistantSuggestionsPayload(AssistantSuggestionsRequest request, Map<String, Object> context) {
        if (properties.isPrivateRuntimeMode() || properties.isPlatformBridgeMode()) {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("content", blank(request == null ? null : request.content())
                    ? suggestionsContent(context)
                    : request.content());
            payload.put("maxSuggestions", request == null || request.maxSuggestions() == null ? 4 : Math.max(1, Math.min(8, request.maxSuggestions())));
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
        return payload;
    }

    private String suggestionsContent(Map<String, Object> context) {
        String pageType = String.valueOf(context.getOrDefault("pageType", "productization"));
        String productName = String.valueOf(context.getOrDefault("productName", ""));
        String workspaceStatus = String.valueOf(context.getOrDefault("workspaceStatus", ""));
        StringBuilder content = new StringBuilder("Current ProdUS productization context for ").append(pageType).append('.');
        if (!blank(productName)) {
            content.append(" Product: ").append(productName).append('.');
        }
        if (!blank(workspaceStatus)) {
            content.append(" Workspace status: ").append(workspaceStatus).append('.');
        }
        content.append(" Suggest useful next questions or actions for product readiness, scanner evidence, package planning, and milestone blockers.");
        return content.toString();
    }

    private String mode(String requestedMode) {
        if (!blank(requestedMode)) {
            return requestedMode;
        }
        return blank(properties.getDefaultMode()) ? "support_assistant" : properties.getDefaultMode();
    }

    private String position(String requestedPosition) {
        if (!blank(requestedPosition)) {
            return requestedPosition;
        }
        return blank(properties.getDefaultPosition()) ? "productization" : properties.getDefaultPosition();
    }

    private String conversationId(String requestedConversationId, Map<String, Object> context) {
        if (!blank(requestedConversationId)) {
            return requestedConversationId;
        }
        String actorRole = String.valueOf(context.getOrDefault("actorRole", "user"));
        String pageType = String.valueOf(context.getOrDefault("pageType", "productization"));
        return "produs-" + actorRole.toLowerCase() + "-" + pageType.toLowerCase();
    }

    private String providerConversationId(String requestedConversationId, User user, boolean reset) {
        String baseConversationId = safeConversationSegment(requestedConversationId);
        if (!properties.isPrivateRuntimeAssertionAuth()) {
            return reset ? appendResetSuffix(baseConversationId) : baseConversationId;
        }
        String subject = user == null ? "anonymous" : stableSubject(user);
        String subjectHash = shortHash(subject);
        String conversationHash = shortHash(subject + ":" + baseConversationId);
        String scoped = "produs-" + subjectHash + "-" + baseConversationId + "-" + conversationHash;
        return reset ? appendResetSuffix(scoped) : truncateConversationId(scoped);
    }

    private String safeConversationSegment(String value) {
        String sanitized = blank(value) ? "assistant" : value.trim();
        sanitized = sanitized.replaceAll("[^A-Za-z0-9._:-]", "-").replaceAll("-{2,}", "-");
        if (sanitized.isBlank() || "-".equals(sanitized)) {
            sanitized = "assistant";
        }
        if (sanitized.length() > 90) {
            sanitized = sanitized.substring(0, 72) + "-" + shortHash(sanitized);
        }
        return sanitized;
    }

    private String appendResetSuffix(String conversationId) {
        String suffix = "-reset-" + UUID.randomUUID().toString().substring(0, 8);
        return truncateConversationId(conversationId, 180 - suffix.length()) + suffix;
    }

    private String truncateConversationId(String conversationId) {
        return truncateConversationId(conversationId, 180);
    }

    private String truncateConversationId(String conversationId, int maxLength) {
        if (conversationId.length() <= maxLength) {
            return conversationId;
        }
        return conversationId.substring(0, Math.max(1, maxLength - 13)) + "-" + shortHash(conversationId);
    }

    private String stableSubject(User user) {
        if (user == null) {
            return "anonymous";
        }
        if (!blank(user.getSupabaseId())) {
            return user.getSupabaseId();
        }
        return user.getId() == null ? user.getEmail() : user.getId().toString();
    }

    private String shortHash(String value) {
        return sha256Hex(value).substring(0, 12);
    }

    private ProviderJsonResponse postJson(String path, Object payload, User user, String conversationId) {
        return postJson(path, payload, ProviderAuthSubject.user(user, conversationId));
    }

    private ProviderJsonResponse postJson(String path, Object payload, ProviderAuthSubject authSubject) {
        if (!isConfigured()) {
            throw new IllegalStateException("LoomAI is not configured");
        }
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(normalizedBaseUrl() + normalizedPath(path)))
                    .timeout(java.time.Duration.ofMillis(effectiveTimeoutMs()))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)));
            applyProviderAuth(builder, authSubject);
            String requestId = MDC.get("requestId");
            if (requestId != null && !requestId.isBlank()) {
                builder.header("X-Request-ID", requestId);
            }
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(java.time.Duration.ofMillis(effectiveTimeoutMs()))
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

    private ProviderJsonResponse getJson(String path, User user, String conversationId) {
        if (!isConfigured()) {
            throw new IllegalStateException("LoomAI is not configured");
        }
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(normalizedBaseUrl() + normalizedPath(path)))
                    .timeout(java.time.Duration.ofMillis(effectiveTimeoutMs()))
                    .header("Accept", "application/json")
                    .GET();
            applyProviderAuth(builder, ProviderAuthSubject.user(user, conversationId));
            String requestId = MDC.get("requestId");
            if (requestId != null && !requestId.isBlank()) {
                builder.header("X-Request-ID", requestId);
            }
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(java.time.Duration.ofMillis(effectiveTimeoutMs()))
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

    private void applyProviderAuth(HttpRequest.Builder builder, ProviderAuthSubject authSubject) {
        if (properties.isPrivateRuntimeAssertionAuth()) {
            builder.header(
                    blank(properties.getRuntimeApiKeyHeaderName()) ? "X-AIFABRIC-RUNTIME-API-KEY" : properties.getRuntimeApiKeyHeaderName(),
                    properties.getRuntimeApiKey().trim()
            );
            String assertion = authSubject.system()
                    ? runtimeAssertionService.createSystemAssertion(authSubject.subjectId(), authSubject.conversationId(), authSubject.scopes())
                    : runtimeAssertionService.createAssertion(authSubject.user(), authSubject.conversationId(), authSubject.scopes());
            builder.header(
                    blank(properties.getRuntimeAuthorizationHeaderName()) ? "X-AIFABRIC-RUNTIME-AUTHORIZATION" : properties.getRuntimeAuthorizationHeaderName(),
                    "Bearer " + assertion
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

    private long effectiveTimeoutMs() {
        long configured = Math.max(1_000, properties.getTimeoutMs());
        if (properties.isPrivateRuntimeMode()) {
            return Math.max(configured, 30_000);
        }
        return configured;
    }

    private String safeExceptionDetail(Throwable throwable) {
        Throwable cursor = throwable;
        Throwable root = throwable;
        while (cursor != null) {
            root = cursor;
            cursor = cursor.getCause();
        }
        String message = root == null ? null : root.getMessage();
        if (message == null || message.isBlank()) {
            return root == null ? "unknown" : root.getClass().getSimpleName();
        }
        return message.length() > 180 ? message.substring(0, 180) : message;
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
                body.path("providerRequestId"),
                metadata.path("requestId"),
                metadata.path("providerRequestId"),
                resultMetadata.path("requestId"),
                resultMetadata.path("providerRequestId")
        );
    }

    private AssistantQueryResponse assistantQueryResponse(ProviderJsonResponse response, String fallbackConversationId) {
        JsonNode body = response.body();
        return new AssistantQueryResponse(
                "LOOMAI",
                "LIVE",
                boolOr(body, "success", true),
                textOr(body, "type", "INFORMATION_PROVIDED"),
                normalizedAnswer(body),
                normalizedSafeSummary(body),
                conversationId(body, fallbackConversationId),
                normalizedConfidence(body),
                jsonList(firstArray(body, "sources")),
                jsonList(firstArray(body, "actions")),
                suggestionList(body),
                firstText(body.path("fallbackReason"), body.path("errorCode"), body.path("result").path("fallbackReason")),
                response.providerRequestId()
        );
    }

    private boolean isConversationAccessDenied(JsonNode body) {
        if (body == null || body.isMissingNode() || body.isNull()) {
            return false;
        }
        String raw = body.toString().toLowerCase(Locale.ROOT);
        return raw.contains("access denied to conversation")
                || raw.contains("conversation_access_denied")
                || raw.contains("access_denied")
                || (raw.contains("conversation") && raw.contains("access") && raw.contains("denied"));
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

    private String normalizedSafeSummary(JsonNode body) {
        String safeSummary = firstText(
                body.path("safeSummary"),
                body.path("answer"),
                body.path("result").path("safeSummary"),
                body.path("result").path("answer")
        );
        return blank(safeSummary) ? "LoomAI returned an empty answer." : safeSummary;
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

    private boolean boolOr(JsonNode node, String field, boolean fallback) {
        JsonNode value = node.path(field);
        if (value.isBoolean()) {
            return value.asBoolean();
        }
        JsonNode resultValue = node.path("result").path(field);
        return resultValue.isBoolean() ? resultValue.asBoolean() : fallback;
    }

    private String conversationId(JsonNode body, String fallback) {
        String value = firstText(body.path("conversationId"), body.path("result").path("conversationId"));
        return blank(value) ? fallback : value;
    }

    private String firstText(JsonNode... nodes) {
        for (JsonNode node : nodes) {
            if (node != null && node.isTextual() && !node.asText().isBlank()) {
                return node.asText();
            }
        }
        return null;
    }

    private JsonNode textNode(String value) {
        return blank(value) ? objectMapper.nullNode() : objectMapper.getNodeFactory().textNode(value);
    }

    private Integer intOrNull(JsonNode body, String field) {
        JsonNode value = body.path(field);
        if (value.isNumber()) {
            return value.asInt();
        }
        JsonNode resultValue = body.path("result").path(field);
        return resultValue.isNumber() ? resultValue.asInt() : null;
    }

    private int intOrDefault(JsonNode body, String field, int defaultValue) {
        Integer value = intOrNull(body, field);
        return value == null ? defaultValue : value;
    }

    private List<Map<String, Object>> providerErrors(JsonNode body) {
        JsonNode values = firstArray(body, "errors");
        if (!values.isArray() || values.isEmpty()) {
            values = firstArray(body, "failures");
        }
        return jsonList(values);
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
        String conversationId = conversationId(null, context);
        return new AssistantQueryResponse(
                "PRODUS_FALLBACK",
                "FALLBACK",
                false,
                "FALLBACK",
                answer,
                answer,
                conversationId,
                0.0,
                List.of(),
                List.of(),
                defaultSuggestionText(context),
                reason,
                null
        );
    }

    private AssistantSuggestionsResponse fallbackSuggestions(String reason, Map<String, Object> context) {
        return new AssistantSuggestionsResponse("PRODUS_FALLBACK", "FALLBACK", false, defaultSuggestionText(context), reason, null);
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

    private String safeText(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String redacted = SECRET_PATTERN.matcher(value).replaceAll("[redacted-secret]");
        redacted = URL_PATTERN.matcher(redacted).replaceAll("[redacted-url]");
        redacted = redacted.replaceAll("\\s+", " ").trim();
        if (redacted.length() <= maxLength) {
            return redacted;
        }
        return redacted.substring(0, Math.max(0, maxLength - 1)).trim() + "...";
    }

    private <T> Map<String, Long> countBy(Collection<T> values, Function<T, String> keyExtractor) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (T value : values) {
            String key = keyExtractor.apply(value);
            if (key == null || key.isBlank()) {
                key = "UNKNOWN";
            }
            counts.put(key, counts.getOrDefault(key, 0L) + 1);
        }
        return counts;
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

    private record ProviderAuthSubject(User user, String conversationId, String subjectId, List<String> scopes, boolean system) {
        private static ProviderAuthSubject user(User user, String conversationId) {
            return new ProviderAuthSubject(user, conversationId, null, null, false);
        }

        private static ProviderAuthSubject system(String subjectId, String sessionId, List<String> scopes) {
            return new ProviderAuthSubject(null, sessionId, subjectId, scopes, true);
        }
    }

    public record AssistantContextRequest(
            String pageType,
            UUID productId,
            UUID packageId,
            UUID workspaceId,
            UUID milestoneId,
            UUID findingId
    ) {}

    public record AssistantSessionRequest(AssistantContextRequest context) {}

    public record AssistantQueryRequest(String conversationId, String query, String mode, String position, AssistantContextRequest context) {}

    public record AssistantSuggestionsRequest(String content, String conversationId, Integer maxSuggestions, AssistantContextRequest context) {}

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
            boolean success,
            String type,
            String answer,
            String safeSummary,
            String conversationId,
            double confidence,
            List<Map<String, Object>> sources,
            List<Map<String, Object>> actions,
            List<String> suggestions,
            String fallbackReason,
            String providerRequestId
    ) {}

    public record AssistantSuggestionsResponse(
            String provider,
            String mode,
            boolean success,
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
            boolean authContextConfigured,
            boolean knowledgeSyncConfigured,
            List<String> allowedActions,
            List<String> activeReadActions,
            List<String> confirmedActionCandidates
    ) {}

    public record LoomAIAuthContextResponse(
            String provider,
            String mode,
            boolean success,
            Map<String, Object> authContext,
            String fallbackReason,
            String providerRequestId
    ) {}

    public record KnowledgeSyncResponse(
            String status,
            int recordCount,
            String providerRequestId,
            Integer totalOperations,
            Integer succeededOperations,
            Integer failedOperations,
            List<Map<String, Object>> errors,
            String fallbackReason
    ) {}

    public record KnowledgeExportResponse(
            List<KnowledgeExportRecord> records,
            String nextCursor,
            boolean hasMore,
            int totalEstimate,
            String exportVersion
    ) {}

    public record KnowledgeExportRecord(
            String id,
            String type,
            String vectorSpace,
            String title,
            String body,
            Map<String, Object> metadata,
            boolean deleted
    ) {}

    public record SafeKnowledgeRecord(
            String id,
            String type,
            String title,
            String body,
            Map<String, Object> metadata
    ) {}
}
