package com.produs.product;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.ai.LoomAIIntegrationService;
import com.produs.ai.LoomAIIntegrationService.AssistantQueryResponse;
import com.produs.ai.LoomAIIntegrationService.ProjectCreationAssistantRequest;
import com.produs.ai.LoomAIIntegrationService.ProjectCreationDocumentReference;
import com.produs.audit.AuditEvent;
import com.produs.cart.ProductizationCartService;
import com.produs.catalog.ServiceModule;
import com.produs.catalog.ServiceModuleRepository;
import com.produs.dto.PlatformDtos.ProductProfileResponse;
import com.produs.entity.User;
import com.produs.scanner.ScanSource;
import com.produs.scanner.ScanSourceRepository;
import com.produs.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static com.produs.dto.PlatformDtos.toProductProfileResponse;

@Service
@RequiredArgsConstructor
public class AiAssistedProductCreationService {

    private static final int NAME_LIMIT = 120;
    private static final int TEXT_LIMIT = 2_000;

    private final ProductProfileRepository productRepository;
    private final ProductCreationIntentRepository intentRepository;
    private final ProductProjectAttachmentRepository attachmentRepository;
    private final ProductProjectIntelligenceRepository intelligenceRepository;
    private final ProductServiceRecommendationRepository serviceRecommendationRepository;
    private final ProductScannerRecommendationRepository scannerRecommendationRepository;
    private final ProductReadinessTaskRepository readinessTaskRepository;
    private final ProductProjectAttachmentService attachmentService;
    private final LoomAIIntegrationService loomAIIntegrationService;
    private final ServiceModuleRepository serviceModuleRepository;
    private final ProductizationCartService productizationCartService;
    private final ScanSourceRepository scanSourceRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.product-creation.intent-ttl-minutes:30}")
    private long creationIntentTtlMinutes;

    public AiAssistedProductAnalysisResponse analyze(
            User owner,
            AiAssistedProductCreationRequest request,
            List<MultipartFile> files,
            Set<Integer> aiSharedFileIndexes,
            String apiBaseUrl
    ) {
        if (request == null || request.ownerMessage() == null || request.ownerMessage().isBlank()) {
            throw new IllegalArgumentException("Project creation prompt is required");
        }

        String consentToken = createToken("pcint");
        AnalysisStart start = transactionTemplate.execute(status ->
                startAnalysis(owner, request, files, aiSharedFileIndexes, apiBaseUrl, consentToken)
        );
        if (start == null) {
            throw new IllegalStateException("Project creation analysis could not be started");
        }

        AssistantQueryResponse assistant = loomAIIntegrationService.projectCreation(owner, new ProjectCreationAssistantRequest(
                start.intentId(),
                request.ownerMessage(),
                request.businessStage() == null ? "" : request.businessStage().name(),
                request.techStack(),
                request.productUrl(),
                request.repositoryUrl(),
                request.knownRisks(),
                start.documentReferences()
        ));

        ProductCreationFields ownerProvidedFields = deterministicFields(request);
        Optional<ProductCreationFields> parsedFields = parseFields(assistant).filter(this::hasMeaningfulFields);
        ProductCreationFields fields = parsedFields
                .map(parsed -> mergeFields(parsed, ownerProvidedFields))
                .orElse(ownerProvidedFields);
        ProductCreationFields finalFields = ensureDocumentUsage(fields, start.documentReferences());

        ProductCreationIntent intent = transactionTemplate.execute(status ->
                completeAnalysis(start.intentId(), finalFields, assistant, start.temporaryAccess().size())
        );
        if (intent == null) {
            throw new IllegalStateException("Project creation analysis could not be completed");
        }

        return new AiAssistedProductAnalysisResponse(
                ProductCreationIntentResponse.from(intent, consentToken),
                finalFields,
                start.attachments(),
                start.documentReferences().stream()
                        .map(document -> new AiDocumentShareResponse(
                                document.documentId(),
                                document.attachmentId(),
                                document.fileName(),
                                document.contentType(),
                                document.sizeBytes(),
                                document.expiresAt(),
                                document.contentStatus()
                        ))
                        .toList(),
                assistant,
                parsedFields.isPresent(),
                assistant.fallbackReason(),
                projectCreationActionPayload(intent, consentToken, finalFields, start.attachments(), start.temporaryAccess())
        );
    }

    private AnalysisStart startAnalysis(
            User owner,
            AiAssistedProductCreationRequest request,
            List<MultipartFile> files,
            Set<Integer> aiSharedFileIndexes,
            String apiBaseUrl,
            String consentToken
    ) {
        ProductCreationIntent intent = new ProductCreationIntent();
        intent.setOwner(owner);
        intent.setStatus(ProductCreationIntent.Status.ANALYZING);
        intent.setExpiresAt(LocalDateTime.now().plusMinutes(Math.max(5, creationIntentTtlMinutes)));
        intent.setConsentTokenHash(sha256Hex(consentToken));
        intent.setIdempotencyKey("project-create:" + UUID.randomUUID());
        intent.setOwnerMessage(trim(request.ownerMessage(), TEXT_LIMIT));
        intent.setProductName(trim(request.productName(), NAME_LIMIT));
        intent.setBusinessStage(request.businessStage());
        intent.setTechStack(trim(request.techStack(), TEXT_LIMIT));
        intent.setProductUrl(trim(request.productUrl(), 500));
        intent.setRepositoryUrl(trim(request.repositoryUrl(), 500));
        intent.setRiskProfile(trim(request.knownRisks(), TEXT_LIMIT));
        intent = intentRepository.save(intent);

        List<ProductProjectAttachment> attachments = attachmentService.uploadForCreationIntent(owner, intent, files, aiSharedFileIndexes);
        List<ProductProjectAttachmentService.TemporaryAiDocumentAccess> temporaryAccess = attachments.stream()
                .filter(ProductProjectAttachment::isAiShareRequested)
                .map(attachment -> attachmentService.grantTemporaryAiAccess(attachment, apiBaseUrl))
                .toList();
        List<ProjectCreationDocumentReference> documentReferences = projectCreationDocumentReferences(temporaryAccess);
        return new AnalysisStart(
                intent.getId(),
                attachments.stream().map(ProductProjectAttachmentResponse::from).toList(),
                temporaryAccess,
                documentReferences
        );
    }

    private ProductCreationIntent completeAnalysis(
            UUID intentId,
            ProductCreationFields fields,
            AssistantQueryResponse assistant,
            int temporaryAccessCount
    ) {
        ProductCreationIntent intent = intentRepository.findById(intentId)
                .orElseThrow(() -> new IllegalArgumentException("Project creation intent not found"));
        applyAnalysis(intent, fields, assistant, temporaryAccessCount);
        intent.setStatus(ProductCreationIntent.Status.READY_FOR_ACTION);
        return intentRepository.save(intent);
    }

    private List<ProjectCreationDocumentReference> projectCreationDocumentReferences(
            List<ProductProjectAttachmentService.TemporaryAiDocumentAccess> temporaryAccess
    ) {
        List<ProjectCreationDocumentReference> references = new ArrayList<>();
        for (ProductProjectAttachmentService.TemporaryAiDocumentAccess document : temporaryAccess) {
            boolean temporaryUrlAvailable = hasText(document.temporaryAccessUrl());
            references.add(new ProjectCreationDocumentReference(
                    document.attachmentId() == null ? "" : document.attachmentId().toString(),
                    document.attachmentId(),
                    document.fileName(),
                    document.contentType(),
                    document.sizeBytes(),
                    document.temporaryAccessUrl(),
                    document.expiresAt(),
                    temporaryUrlAvailable ? "temporary-url-only" : "temporary-url-missing"
            ));
        }
        return references;
    }

    @Transactional
    public ProductCreationActionResponse createFromAction(ProductCreationActionRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Project creation action payload is required");
        }
        if (request.creationIntentId() == null) {
            throw new IllegalArgumentException("Project creation intent id is required");
        }
        ProductCreationIntent intent = intentRepository.findById(request.creationIntentId())
                .orElseThrow(() -> new IllegalArgumentException("Project creation intent not found"));
        validateActionRequest(intent, request);

        if (intent.getProductProfile() != null && intent.getStatus() == ProductCreationIntent.Status.CREATED) {
            return actionResponse(intent, intent.getProductProfile(), null, false);
        }

        ProductProfile product = new ProductProfile();
        product.setOwner(intent.getOwner());
        product.setName(firstNonBlank(trim(request.productName(), NAME_LIMIT), intent.getProductName(), initialName(intent)));
        product.setSummary(firstNonBlank(trim(request.summary(), TEXT_LIMIT), trim(request.projectDescription(), TEXT_LIMIT), intent.getSummary(), intent.getOwnerMessage()));
        product.setBusinessStage(parseStage(firstNonBlank(request.businessStage(), intent.getBusinessStage() == null ? "" : intent.getBusinessStage().name()))
                .orElse(ProductProfile.BusinessStage.PROTOTYPE));
        product.setTechStack(firstNonBlank(trim(request.techStack(), TEXT_LIMIT), intent.getTechStack()));
        product.setProductUrl(firstNonBlank(trim(request.productUrl(), 500), intent.getProductUrl()));
        product.setRepositoryUrl(firstNonBlank(trim(request.repositoryUrl(), 500), intent.getRepositoryUrl()));
        product.setRiskProfile(firstNonBlank(trim(request.riskProfile(), TEXT_LIMIT), intent.getRiskProfile()));
        product.setCreationMode(ProductProfile.CreationMode.AI_ASSISTED);
        product.setCreatedByAi(true);
        product.setAiProviderRequestId(firstNonBlank(request.analysisProviderRequestId(), intent.getAnalysisProviderRequestId()));
        product.setAiCreationSummary(firstNonBlank(enrichedActionCreationSummary(request), intent.getAiCreationSummary()));

        List<ProductProjectAttachment> attachments = attachmentRepository.findByCreationIntentIdOrderByCreatedAtDesc(intent.getId());
        Set<UUID> aiAccessibleIds = request.aiAccessibleAttachmentIds() == null
                ? Set.of()
                : Set.copyOf(request.aiAccessibleAttachmentIds());
        int aiSourceAttachmentCount = aiAccessibleIds.isEmpty()
                ? (int) attachments.stream().filter(ProductProjectAttachment::isAiShareRequested).count()
                : aiAccessibleIds.size();
        product.setAiSourceAttachmentCount(aiSourceAttachmentCount);
        ProductProfile saved = productRepository.save(product);

        for (ProductProjectAttachment attachment : attachments) {
            attachment.setProductProfile(saved);
            if (attachment.isAiShareRequested()) {
                attachment.setAiAccessRevokedAt(LocalDateTime.now());
            }
            attachmentRepository.save(attachment);
        }

        ProductProjectIntelligence intelligence = persistProjectIntelligence(intent, saved, request);
        int serviceRecommendationCount = persistServiceRecommendations(saved, request.recommendedServiceModules());
        int cartServiceItemCount = productizationCartService.seedAiAssistedServices(
                intent.getOwner(),
                saved,
                firstNonBlank(request.projectDescription(), request.summary(), request.aiCreationSummary()),
                request.recommendedServiceModules()
        );
        int scannerRecommendationCount = persistScannerRecommendations(saved, request.scannerFocusAreas());
        int readinessTaskCount = persistReadinessTasks(saved, request);
        UUID scanSourceId = seedRepositoryScanSource(saved, request);

        intent.setProductProfile(saved);
        intent.setStatus(ProductCreationIntent.Status.CREATED);
        intent.setCreatedProductAt(LocalDateTime.now());
        intent.setProductName(saved.getName());
        intent.setSummary(saved.getSummary());
        intent.setBusinessStage(saved.getBusinessStage());
        intent.setTechStack(saved.getTechStack());
        intent.setProductUrl(saved.getProductUrl());
        intent.setRepositoryUrl(saved.getRepositoryUrl());
        intent.setRiskProfile(saved.getRiskProfile());
        intent.setAiCreationSummary(saved.getAiCreationSummary());
        intent.setAnalysisProviderRequestId(saved.getAiProviderRequestId());
        intent.setAiSourceAttachmentCount(saved.getAiSourceAttachmentCount());
        intentRepository.save(intent);

        AuditEvent audit = auditService.logAction(
                intent.getOwner().getId(),
                "AI_PROJECT_CREATION_ACTION",
                "PRODUCT_PROFILE",
                saved.getId(),
                AuditEvent.RiskLevel.MEDIUM,
                "AI project creation action executed via ProdUS runtime action; intent=%s idempotencyKey=%s providerRequestId=%s serviceRecommendations=%d cartServices=%d scannerRecommendations=%d readinessTasks=%d scanSource=%s"
                        .formatted(intent.getId(), intent.getIdempotencyKey(), nullToEmpty(saved.getAiProviderRequestId()), serviceRecommendationCount, cartServiceItemCount, scannerRecommendationCount, readinessTaskCount, scanSourceId == null ? "" : scanSourceId)
        );

        return actionResponse(intent, saved, audit.getId(), true, intelligence.getId(), serviceRecommendationCount, scannerRecommendationCount, readinessTaskCount, cartServiceItemCount, scanSourceId);
    }

    @Transactional
    public ProductCreationActionResponse createFromActionForOwner(User owner, ProductCreationActionRequest request) {
        if (request == null || request.creationIntentId() == null) {
            throw new IllegalArgumentException("Project creation action payload is required");
        }
        ProductCreationIntent intent = intentRepository.findById(request.creationIntentId())
                .orElseThrow(() -> new IllegalArgumentException("Project creation intent not found"));
        if (owner.getRole() != User.UserRole.ADMIN && !intent.getOwner().getId().equals(owner.getId())) {
            throw new AccessDeniedException("Project creation intent belongs to another owner");
        }
        return createFromAction(request);
    }

    @Transactional
    public Map<String, Object> createFromMcpAction(Map<String, Object> args) {
        try {
            ProductCreationActionRequest request = ProductCreationActionRequest.from(args);
            ProductCreationActionResponse response = createFromAction(request);
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("tool", "produs.productization_project.create");
            payload.put("status", "OK");
            payload.put("productId", response.product().id().toString());
            payload.put("productName", response.product().name());
            payload.put("creationMode", response.product().creationMode());
            payload.put("createdByAi", response.product().createdByAi());
            payload.put("aiProviderRequestId", response.product().aiProviderRequestId());
            payload.put("attachmentCount", response.attachments().size());
            payload.put("aiSourceAttachmentCount", response.product().aiSourceAttachmentCount());
            payload.put("projectIntelligenceId", response.projectIntelligenceId() == null ? "" : response.projectIntelligenceId().toString());
            payload.put("serviceRecommendationCount", response.createdServiceRecommendations());
            payload.put("scannerRecommendationCount", response.createdScannerRecommendations());
            payload.put("readinessTaskCount", response.createdReadinessTasks());
            payload.put("cartServiceItemCount", response.createdCartServiceItems());
            payload.put("scanSourceId", response.createdScanSourceId() == null ? "" : response.createdScanSourceId().toString());
            payload.put("auditEventId", response.auditEventId() == null ? "" : response.auditEventId().toString());
            payload.put("idempotencyKey", response.intent().idempotencyKey());
            payload.put("idempotentReplay", response.idempotentReplay());
            return payload;
        } catch (RuntimeException exception) {
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("tool", "produs.productization_project.create");
            error.put("status", "FAILED");
            error.put("errors", List.of(Map.of(
                    "code", "PROJECT_CREATION_ACTION_REJECTED",
                    "message", exception.getMessage() == null ? "Project creation action rejected" : exception.getMessage()
            )));
            return error;
        }
    }

    private void validateActionRequest(ProductCreationIntent intent, ProductCreationActionRequest request) {
        if (intent.getStatus() == ProductCreationIntent.Status.CREATED && intent.getProductProfile() != null) {
            if (!intent.getIdempotencyKey().equals(request.idempotencyKey())) {
                throw new AccessDeniedException("Project creation idempotency key does not match the existing product");
            }
            return;
        }
        if (intent.getStatus() != ProductCreationIntent.Status.READY_FOR_ACTION) {
            throw new AccessDeniedException("Project creation intent is not ready for action execution");
        }
        if (intent.getExpiresAt() == null || intent.getExpiresAt().isBefore(LocalDateTime.now())) {
            intent.setStatus(ProductCreationIntent.Status.EXPIRED);
            intentRepository.save(intent);
            throw new AccessDeniedException("Project creation intent has expired");
        }
        if (request.consentToken() == null || request.consentToken().isBlank()
                || !MessageDigest.isEqual(
                intent.getConsentTokenHash().getBytes(java.nio.charset.StandardCharsets.UTF_8),
                sha256Hex(request.consentToken()).getBytes(java.nio.charset.StandardCharsets.UTF_8)
        )) {
            throw new AccessDeniedException("Project creation consent token is invalid");
        }
        if (request.idempotencyKey() == null || !intent.getIdempotencyKey().equals(request.idempotencyKey())) {
            throw new AccessDeniedException("Project creation idempotency key is invalid");
        }
        if (request.productName() == null || request.productName().isBlank()) {
            throw new IllegalArgumentException("Product name is required for AI project creation action");
        }
        if (request.summary() == null || request.summary().isBlank()) {
            throw new IllegalArgumentException("Product summary is required for AI project creation action");
        }
        parseStage(request.businessStage())
                .orElseThrow(() -> new IllegalArgumentException("Business stage is required for AI project creation action"));
        validateAttachmentOwnership(intent, request.sourceAttachmentIds());
        validateAttachmentOwnership(intent, request.aiAccessibleAttachmentIds());
    }

    private void validateAttachmentOwnership(ProductCreationIntent intent, List<UUID> attachmentIds) {
        if (attachmentIds == null || attachmentIds.isEmpty()) {
            return;
        }
        Set<UUID> ownedAttachmentIds = attachmentRepository.findByCreationIntentIdOrderByCreatedAtDesc(intent.getId()).stream()
                .map(ProductProjectAttachment::getId)
                .collect(java.util.stream.Collectors.toSet());
        List<UUID> invalid = attachmentIds.stream().filter(id -> !ownedAttachmentIds.contains(id)).toList();
        if (!invalid.isEmpty()) {
            throw new AccessDeniedException("Project creation action contains attachment ids outside the creation intent");
        }
    }

    private void applyAnalysis(
            ProductCreationIntent intent,
            ProductCreationFields fields,
            AssistantQueryResponse assistant,
            int temporaryAccessCount
    ) {
        intent.setProductName(firstNonBlank(trim(fields.productName(), NAME_LIMIT), intent.getProductName(), initialName(intent)));
        intent.setSummary(firstNonBlank(trim(fields.summary(), TEXT_LIMIT), trim(fields.projectDescription(), TEXT_LIMIT), intent.getSummary(), intent.getOwnerMessage()));
        intent.setBusinessStage(parseStage(fields.businessStage()).orElseGet(() ->
                intent.getBusinessStage() == null ? ProductProfile.BusinessStage.PROTOTYPE : intent.getBusinessStage()));
        intent.setTechStack(firstNonBlank(trim(fields.techStack(), TEXT_LIMIT), intent.getTechStack()));
        intent.setProductUrl(firstNonBlank(trim(fields.productUrl(), 500), intent.getProductUrl()));
        intent.setRepositoryUrl(firstNonBlank(trim(fields.repositoryUrl(), 500), intent.getRepositoryUrl()));
        intent.setRiskProfile(firstNonBlank(trim(fields.riskProfile(), TEXT_LIMIT), intent.getRiskProfile()));
        intent.setAnalysisProviderRequestId(assistant.providerRequestId());
        intent.setAiSourceAttachmentCount(temporaryAccessCount);
        intent.setAiCreationSummary(enrichedAnalysisSummary(fields, assistant));
        intent.setAssumptions(writeStringList(fields.assumptions()));
        intent.setMissingEvidence(writeStringList(fields.missingEvidence()));
        intent.setAnalysisFallbackReason(assistant.fallbackReason());
    }

    private String enrichedAnalysisSummary(ProductCreationFields fields, AssistantQueryResponse assistant) {
        List<String> parts = new ArrayList<>();
        addTextPart(parts, "Analysis", firstNonBlank(fields.aiCreationSummary(), assistant.safeSummary(), assistant.answer()));
        addTextPart(parts, "Project", fields.projectDescription());
        addTextPart(parts, "Problem", fields.businessProblem());
        addTextPart(parts, "Users", fields.targetUsers());
        addListPart(parts, "Capabilities", fields.coreCapabilities());
        addListPart(parts, "Outcomes", fields.businessOutcomes());
        addListPart(parts, "Readiness goals", fields.readinessGoals());
        addListPart(parts, "Recommended services", fields.recommendedServices());
        addListPart(parts, "Catalog service modules", serviceModuleRecommendationLabels(fields.recommendedServiceModules()));
        addListPart(parts, "Scanner focus", fields.scannerFocusAreas());
        addListPart(parts, "Next steps", fields.suggestedNextSteps());
        addListPart(parts, "Source insights", fields.sourceInsights());
        String summary = String.join("\n", parts);
        return trim(firstNonBlank(summary, fields.aiCreationSummary(), assistant.safeSummary(), assistant.answer()), TEXT_LIMIT);
    }

    private String enrichedActionCreationSummary(ProductCreationActionRequest request) {
        List<String> parts = new ArrayList<>();
        addTextPart(parts, "Analysis", request.aiCreationSummary());
        addTextPart(parts, "Project", request.projectDescription());
        addTextPart(parts, "Problem", request.businessProblem());
        addTextPart(parts, "Users", request.targetUsers());
        addListPart(parts, "Capabilities", request.coreCapabilities());
        addListPart(parts, "Outcomes", request.businessOutcomes());
        addListPart(parts, "Readiness goals", request.readinessGoals());
        addListPart(parts, "Recommended services", request.recommendedServices());
        addListPart(parts, "Catalog service modules", serviceModuleRecommendationLabels(request.recommendedServiceModules()));
        addListPart(parts, "Scanner focus", request.scannerFocusAreas());
        addListPart(parts, "Next steps", request.suggestedNextSteps());
        addListPart(parts, "Source insights", request.sourceInsights());
        return trim(String.join("\n", parts), TEXT_LIMIT);
    }

    private void addTextPart(List<String> parts, String label, String value) {
        String text = trim(value, TEXT_LIMIT);
        if (!text.isBlank()) {
            parts.add(label + ": " + text);
        }
    }

    private void addListPart(List<String> parts, String label, List<String> values) {
        List<String> cleaned = listOrEmpty(values).stream()
                .map(value -> trim(value, 260))
                .filter(value -> !value.isBlank())
                .limit(6)
                .toList();
        if (!cleaned.isEmpty()) {
            parts.add(label + ": " + String.join("; ", cleaned));
        }
    }

    private List<String> serviceModuleRecommendationLabels(List<ServiceModuleRecommendation> recommendations) {
        return listOrEmpty(recommendations).stream()
                .filter(ServiceModuleRecommendation::acceptedOrDefault)
                .map(recommendation -> firstNonBlank(recommendation.moduleName(), recommendation.moduleCode()))
                .filter(value -> !value.isBlank())
                .limit(6)
                .toList();
    }

    private Map<String, Object> projectCreationActionPayload(
            ProductCreationIntent intent,
            String consentToken,
            ProductCreationFields fields,
            List<ProductProjectAttachmentResponse> attachments,
            List<ProductProjectAttachmentService.TemporaryAiDocumentAccess> temporaryAccess
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("creationIntentId", intent.getId().toString());
        payload.put("consentToken", consentToken);
        payload.put("idempotencyKey", intent.getIdempotencyKey());
        payload.put("analysisProviderRequestId", nullToEmpty(intent.getAnalysisProviderRequestId()));
        payload.put("productName", intent.getProductName());
        payload.put("summary", intent.getSummary());
        payload.put("businessStage", intent.getBusinessStage() == null ? ProductProfile.BusinessStage.PROTOTYPE.name() : intent.getBusinessStage().name());
        payload.put("techStack", intent.getTechStack());
        payload.put("productUrl", intent.getProductUrl());
        payload.put("repositoryUrl", intent.getRepositoryUrl());
        payload.put("riskProfile", intent.getRiskProfile());
        payload.put("aiCreationSummary", intent.getAiCreationSummary());
        payload.put("projectDescription", fields.projectDescription());
        payload.put("businessProblem", fields.businessProblem());
        payload.put("targetUsers", fields.targetUsers());
        payload.put("coreCapabilities", fields.coreCapabilities());
        payload.put("businessOutcomes", fields.businessOutcomes());
        payload.put("readinessGoals", fields.readinessGoals());
        payload.put("recommendedServices", fields.recommendedServices());
        payload.put("recommendedServiceModules", fields.recommendedServiceModules());
        payload.put("missingCatalogCoverage", fields.missingCatalogCoverage());
        payload.put("scannerFocusAreas", fields.scannerFocusAreas());
        payload.put("suggestedNextSteps", fields.suggestedNextSteps());
        payload.put("sourceInsights", fields.sourceInsights());
        payload.put("assumptions", fields.assumptions());
        payload.put("missingEvidence", fields.missingEvidence());
        payload.put("sourceAttachmentIds", attachments.stream().map(attachment -> attachment.id().toString()).toList());
        payload.put("aiAccessibleAttachmentIds", temporaryAccess.stream().map(access -> access.attachmentId().toString()).toList());
        return payload;
    }

    private record AnalysisStart(
            UUID intentId,
            List<ProductProjectAttachmentResponse> attachments,
            List<ProductProjectAttachmentService.TemporaryAiDocumentAccess> temporaryAccess,
            List<ProjectCreationDocumentReference> documentReferences
    ) {}

    private ProductProjectIntelligence persistProjectIntelligence(
            ProductCreationIntent intent,
            ProductProfile product,
            ProductCreationActionRequest request
    ) {
        ProductProjectIntelligence intelligence = new ProductProjectIntelligence();
        intelligence.setProductProfile(product);
        intelligence.setCreationIntent(intent);
        intelligence.setAnalysisProvider("LOOMAI");
        intelligence.setAnalysisProviderRequestId(firstNonBlank(request.analysisProviderRequestId(), intent.getAnalysisProviderRequestId()));
        intelligence.setAnalysisSchemaVersion("produs-project-analysis-v1");
        intelligence.setAnalysisJson(writeAnalysisJson(request));
        intelligence.setOwnerApprovedAt(LocalDateTime.now());
        intelligence.setCreatedByAi(true);
        return intelligenceRepository.save(intelligence);
    }

    private int persistServiceRecommendations(
            ProductProfile product,
            List<ServiceModuleRecommendation> recommendations
    ) {
        List<ServiceModuleRecommendation> selected = listOrEmpty(recommendations).stream()
                .filter(recommendation -> recommendation != null && recommendation.acceptedOrDefault())
                .sorted(Comparator.comparingInt(ServiceModuleRecommendation::sequenceOrDefault))
                .limit(12)
                .toList();
        int sequence = 0;
        for (ServiceModuleRecommendation recommendation : selected) {
            ServiceModule module = resolveServiceModule(recommendation.moduleCode());
            sequence++;
            ProductServiceRecommendation entity = new ProductServiceRecommendation();
            entity.setProductProfile(product);
            entity.setServiceModule(module);
            entity.setModuleCode(moduleCode(module));
            entity.setPriority(normalizePriority(recommendation.priority()));
            entity.setSequenceNumber(sequence);
            entity.setReason(trim(recommendation.reason(), TEXT_LIMIT));
            entity.setExpectedOutcome(trim(recommendation.expectedOutcome(), TEXT_LIMIT));
            entity.setEvidenceBasisJson(writeStringList(recommendation.evidenceBasis()));
            entity.setConfidence(normalizeConfidence(recommendation.confidence()));
            entity.setStatus(ProductServiceRecommendation.Status.RECOMMENDED);
            entity.setCreatedByAi(true);
            serviceRecommendationRepository.save(entity);
        }
        return selected.size();
    }

    private int persistScannerRecommendations(ProductProfile product, List<String> scannerFocusAreas) {
        List<String> focusAreas = listOrEmpty(scannerFocusAreas).stream()
                .map(value -> trim(value, 255))
                .filter(value -> !value.isBlank())
                .distinct()
                .limit(8)
                .toList();
        for (String focusArea : focusAreas) {
            ProductScannerRecommendation recommendation = new ProductScannerRecommendation();
            recommendation.setProductProfile(product);
            recommendation.setScannerFocusArea(focusArea);
            recommendation.setSource("AI_PROJECT_ANALYSIS");
            recommendation.setReason("Created from owner-approved AI project analysis.");
            recommendation.setRecommendedChecksJson(writeStringList(List.of(focusArea)));
            recommendation.setStatus(ProductScannerRecommendation.Status.SUGGESTED);
            recommendation.setCreatedByAi(true);
            scannerRecommendationRepository.save(recommendation);
        }
        return focusAreas.size();
    }

    private int persistReadinessTasks(ProductProfile product, ProductCreationActionRequest request) {
        List<ReadinessTaskSeed> seeds = new ArrayList<>();
        listOrEmpty(request.readinessGoals()).stream()
                .map(value -> trim(value, 255))
                .filter(value -> !value.isBlank())
                .limit(6)
                .forEach(value -> seeds.add(new ReadinessTaskSeed(value, "Readiness goal recommended by AI project analysis.", "readinessGoals", "HIGH")));
        listOrEmpty(request.suggestedNextSteps()).stream()
                .map(value -> trim(value, 255))
                .filter(value -> !value.isBlank())
                .limit(6)
                .forEach(value -> seeds.add(new ReadinessTaskSeed(value, "Suggested next step from owner-approved AI analysis.", "suggestedNextSteps", "MEDIUM")));
        listOrEmpty(request.missingEvidence()).stream()
                .map(value -> trim(value, 255))
                .filter(value -> !value.isBlank())
                .limit(6)
                .forEach(value -> seeds.add(new ReadinessTaskSeed(value, "Evidence gap captured during AI project analysis.", "missingEvidence", "HIGH")));

        List<ReadinessTaskSeed> uniqueSeeds = seeds.stream()
                .filter(seed -> hasText(seed.title()))
                .collect(java.util.stream.Collectors.toMap(
                        seed -> seed.title().toLowerCase(Locale.ROOT),
                        seed -> seed,
                        (existing, duplicate) -> existing,
                        LinkedHashMap::new
                ))
                .values()
                .stream()
                .limit(12)
                .toList();
        for (ReadinessTaskSeed seed : uniqueSeeds) {
            ProductReadinessTask task = new ProductReadinessTask();
            task.setProductProfile(product);
            task.setTitle(seed.title());
            task.setDescription(seed.description());
            task.setSource("AI_PROJECT_ANALYSIS");
            task.setSourceAnalysisField(seed.sourceAnalysisField());
            task.setPriority(seed.priority());
            task.setStatus(ProductReadinessTask.Status.OPEN);
            task.setCreatedByAi(true);
            readinessTaskRepository.save(task);
        }
        return uniqueSeeds.size();
    }

    private UUID seedRepositoryScanSource(ProductProfile product, ProductCreationActionRequest request) {
        String repositoryUrl = firstNonBlank(trim(request.repositoryUrl(), 500), product.getRepositoryUrl());
        if (repositoryUrl.isBlank()) {
            return null;
        }
        String repositoryFullName = repositoryFullName(repositoryUrl);
        Optional<ScanSource> existing = scanSourceRepository.findByProductProfileIdOrderByCreatedAtDesc(product.getId()).stream()
                .filter(source -> sameRepositorySource(source, repositoryUrl, repositoryFullName))
                .findFirst();
        if (existing.isPresent()) {
            return existing.get().getId();
        }

        ScanSource source = new ScanSource();
        source.setOwner(product.getOwner());
        source.setProductProfile(product);
        source.setProviderType(repositoryProvider(repositoryUrl));
        source.setDisplayName(repositoryDisplayName(repositoryFullName, repositoryUrl));
        source.setExternalReference(repositoryUrl);
        source.setExternalRepositoryFullName(repositoryFullName.isBlank() ? null : repositoryFullName);
        source.setDefaultBranch("main");
        source.setAuthorizationStatus(ScanSource.AuthorizationStatus.AUTHORIZED);
        source.setScopeNote("Owner-approved repository captured during AI project creation. Connect the provider app if private repository access is required; this source is ready for governed scanner setup.");
        source.setCreatedBy(product.getOwner());
        return scanSourceRepository.save(source).getId();
    }

    private boolean sameRepositorySource(ScanSource source, String repositoryUrl, String repositoryFullName) {
        if (source == null) {
            return false;
        }
        if (hasText(repositoryFullName) && hasText(source.getExternalRepositoryFullName())
                && repositoryFullName.equalsIgnoreCase(source.getExternalRepositoryFullName())) {
            return true;
        }
        return normalizeRepositoryUrl(repositoryUrl).equals(normalizeRepositoryUrl(source.getExternalReference()));
    }

    private ScanSource.ProviderType repositoryProvider(String repositoryUrl) {
        String normalized = firstNonBlank(repositoryUrl).toLowerCase(Locale.ROOT);
        if (normalized.contains("github.com")) {
            return ScanSource.ProviderType.GITHUB;
        }
        if (normalized.contains("gitlab.com")) {
            return ScanSource.ProviderType.GITLAB;
        }
        return ScanSource.ProviderType.EXTERNAL_TOOL;
    }

    private String repositoryDisplayName(String repositoryFullName, String repositoryUrl) {
        if (hasText(repositoryFullName)) {
            return repositoryFullName + " repository";
        }
        String normalized = normalizeRepositoryUrl(repositoryUrl);
        if (normalized.isBlank()) {
            return "AI project repository";
        }
        int slash = normalized.lastIndexOf('/');
        return slash >= 0 && slash < normalized.length() - 1
                ? normalized.substring(slash + 1) + " repository"
                : "AI project repository";
    }

    private String repositoryFullName(String repositoryUrl) {
        String value = firstNonBlank(repositoryUrl).trim();
        if (value.isBlank()) {
            return "";
        }
        String normalized = value
                .replace("git@github.com:", "https://github.com/")
                .replace("git@gitlab.com:", "https://gitlab.com/");
        int marker = normalized.indexOf("github.com/");
        if (marker < 0) {
            marker = normalized.indexOf("gitlab.com/");
        }
        if (marker < 0) {
            return "";
        }
        String path = normalized.substring(normalized.indexOf('/', marker) + 1)
                .replaceAll("[?#].*$", "")
                .replaceAll("\\.git$", "")
                .replaceAll("/+$", "");
        String[] parts = path.split("/");
        if (parts.length < 2 || parts[0].isBlank() || parts[1].isBlank()) {
            return "";
        }
        return parts[0] + "/" + parts[1];
    }

    private String normalizeRepositoryUrl(String repositoryUrl) {
        return firstNonBlank(repositoryUrl)
                .trim()
                .replaceAll("\\.git$", "")
                .replaceAll("/+$", "")
                .toLowerCase(Locale.ROOT);
    }

    private record ReadinessTaskSeed(String title, String description, String sourceAnalysisField, String priority) {}

    private ServiceModule resolveServiceModule(String moduleCode) {
        String code = firstNonBlank(moduleCode).trim();
        if (code.isBlank()) {
            throw new IllegalArgumentException("AI service recommendation is missing moduleCode");
        }
        return serviceModuleRepository.findByStableCode(code)
                .or(() -> serviceModuleRepository.findBySlug(code))
                .orElseThrow(() -> new IllegalArgumentException("Recommended service module is not available: " + code));
    }

    private String moduleCode(ServiceModule module) {
        return firstNonBlank(module.getStableCode(), module.getSlug(), module.getId() == null ? "" : module.getId().toString());
    }

    private String normalizePriority(String priority) {
        String normalized = firstNonBlank(priority, "SHOULD").trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
        return switch (normalized) {
            case "MUST", "SHOULD", "COULD", "LATER" -> normalized;
            default -> "SHOULD";
        };
    }

    private Double normalizeConfidence(Double confidence) {
        if (confidence == null || confidence.isNaN() || confidence.isInfinite()) {
            return null;
        }
        return Math.max(0.0, Math.min(1.0, confidence));
    }

    private String writeAnalysisJson(ProductCreationActionRequest request) {
        Map<String, Object> analysis = new LinkedHashMap<>();
        analysis.put("productName", request.productName());
        analysis.put("summary", request.summary());
        analysis.put("projectDescription", request.projectDescription());
        analysis.put("businessProblem", request.businessProblem());
        analysis.put("targetUsers", request.targetUsers());
        analysis.put("businessStage", request.businessStage());
        analysis.put("techStack", request.techStack());
        analysis.put("productUrl", request.productUrl());
        analysis.put("repositoryUrl", request.repositoryUrl());
        analysis.put("riskProfile", request.riskProfile());
        analysis.put("aiCreationSummary", request.aiCreationSummary());
        analysis.put("coreCapabilities", listOrEmpty(request.coreCapabilities()));
        analysis.put("businessOutcomes", listOrEmpty(request.businessOutcomes()));
        analysis.put("readinessGoals", listOrEmpty(request.readinessGoals()));
        analysis.put("recommendedServices", listOrEmpty(request.recommendedServices()));
        analysis.put("recommendedServiceModules", listOrEmpty(request.recommendedServiceModules()));
        analysis.put("missingCatalogCoverage", listOrEmpty(request.missingCatalogCoverage()));
        analysis.put("scannerFocusAreas", listOrEmpty(request.scannerFocusAreas()));
        analysis.put("suggestedNextSteps", listOrEmpty(request.suggestedNextSteps()));
        analysis.put("sourceInsights", listOrEmpty(request.sourceInsights()));
        analysis.put("assumptions", listOrEmpty(request.assumptions()));
        analysis.put("missingEvidence", listOrEmpty(request.missingEvidence()));
        try {
            return objectMapper.writeValueAsString(analysis);
        } catch (Exception exception) {
            return "{}";
        }
    }

    private ProductCreationActionResponse actionResponse(
            ProductCreationIntent intent,
            ProductProfile product,
            UUID auditEventId,
            boolean createdNow
    ) {
        UUID intelligenceId = intelligenceRepository.findByProductProfileId(product.getId())
                .map(ProductProjectIntelligence::getId)
                .orElse(null);
        int serviceRecommendationCount = serviceRecommendationRepository.findByProductProfileIdOrderBySequenceNumberAscCreatedAtAsc(product.getId()).size();
        int scannerRecommendationCount = scannerRecommendationRepository.findByProductProfileIdOrderByCreatedAtAsc(product.getId()).size();
        int readinessTaskCount = readinessTaskRepository.findByProductProfileIdOrderByCreatedAtAsc(product.getId()).size();
        return actionResponse(
                intent,
                product,
                auditEventId,
                createdNow,
                intelligenceId,
                serviceRecommendationCount,
                scannerRecommendationCount,
                readinessTaskCount,
                0,
                null
        );
    }

    private ProductCreationActionResponse actionResponse(
            ProductCreationIntent intent,
            ProductProfile product,
            UUID auditEventId,
            boolean createdNow,
            UUID projectIntelligenceId,
            int createdServiceRecommendations,
            int createdScannerRecommendations,
            int createdReadinessTasks,
            int createdCartServiceItems,
            UUID createdScanSourceId
    ) {
        List<ProductProjectAttachmentResponse> attachments = attachmentRepository.findByCreationIntentIdOrderByCreatedAtDesc(intent.getId()).stream()
                .map(ProductProjectAttachmentResponse::from)
                .toList();
        return new ProductCreationActionResponse(
                toProductProfileResponse(product),
                ProductCreationIntentResponse.from(intent, null),
                attachments,
                auditEventId,
                !createdNow,
                projectIntelligenceId,
                createdServiceRecommendations,
                createdScannerRecommendations,
                createdReadinessTasks,
                createdCartServiceItems,
                createdScanSourceId
        );
    }

    private Optional<ProductCreationFields> parseFields(AssistantQueryResponse response) {
        if (response == null) {
            return Optional.empty();
        }
        return parseFields(response.answer())
                .or(() -> parseFields(response.safeSummary()))
                .or(() -> parseFieldsFromActionParameters(response));
    }

    private ProductCreationFields mergeFields(
            ProductCreationFields aiFields,
            ProductCreationFields ownerProvidedFields
    ) {
        return new ProductCreationFields(
                firstNonBlank(ownerProvidedFields.productName(), aiFields.productName()),
                firstNonBlank(aiFields.summary(), ownerProvidedFields.summary()),
                firstNonBlank(aiFields.projectDescription(), ownerProvidedFields.projectDescription()),
                firstNonBlank(aiFields.businessProblem(), ownerProvidedFields.businessProblem()),
                firstNonBlank(aiFields.targetUsers(), ownerProvidedFields.targetUsers()),
                firstNonBlank(ownerProvidedFields.businessStage(), aiFields.businessStage()),
                firstNonBlank(aiFields.techStack(), ownerProvidedFields.techStack()),
                firstNonBlank(ownerProvidedFields.productUrl(), aiFields.productUrl()),
                firstNonBlank(ownerProvidedFields.repositoryUrl(), aiFields.repositoryUrl()),
                firstNonBlank(aiFields.riskProfile(), ownerProvidedFields.riskProfile()),
                firstNonBlank(
                        aiFields.aiCreationSummary(),
                        "LoomAI analyzed the owner intake and produced the initial project attributes. ProdUS completed any missing required fields from owner-provided inputs."
                ),
                mergeList(aiFields.coreCapabilities(), ownerProvidedFields.coreCapabilities()),
                mergeList(aiFields.businessOutcomes(), ownerProvidedFields.businessOutcomes()),
                mergeList(aiFields.readinessGoals(), ownerProvidedFields.readinessGoals()),
                mergeList(aiFields.recommendedServices(), ownerProvidedFields.recommendedServices()),
                mergeServiceModuleRecommendations(aiFields.recommendedServiceModules(), ownerProvidedFields.recommendedServiceModules()),
                mergeMissingCatalogCoverage(aiFields.missingCatalogCoverage(), ownerProvidedFields.missingCatalogCoverage()),
                mergeList(aiFields.scannerFocusAreas(), ownerProvidedFields.scannerFocusAreas()),
                mergeList(aiFields.suggestedNextSteps(), ownerProvidedFields.suggestedNextSteps()),
                mergeList(sourceInsights(aiFields), ownerProvidedFields.sourceInsights()),
                listOrEmpty(aiFields.assumptions()),
                listOrEmpty(aiFields.missingEvidence()),
                listOrEmpty(aiFields.documentUsage())
        );
    }

    private ProductCreationFields ensureDocumentUsage(
            ProductCreationFields fields,
            List<ProjectCreationDocumentReference> documents
    ) {
        if (fields == null || documents == null || documents.isEmpty()) {
            return fields;
        }
        List<DocumentUsageEvidence> existingUsage = fields.documentUsage() == null
                ? List.of()
                : fields.documentUsage();
        List<DocumentUsageEvidence> completedUsage = new ArrayList<>(existingUsage);
        List<String> completedMissingEvidence = new ArrayList<>(fields.missingEvidence() == null
                ? List.of()
                : fields.missingEvidence());
        for (ProjectCreationDocumentReference document : documents) {
            String fileName = trim(document.fileName(), NAME_LIMIT);
            String documentId = trim(document.documentId(), NAME_LIMIT);
            boolean hasUsage = completedUsage.stream()
                    .anyMatch(usage -> sameDocumentUsage(usage, documentId, fileName));
            if (hasUsage) {
                continue;
            }
            String reason = "LoomAI did not return document usage evidence for this selected file.";
            completedUsage.add(new DocumentUsageEvidence(
                    documentId,
                    fileName,
                    "NOT_USED",
                    "NONE",
                    List.of(),
                    reason
            ));
            String missingEvidence = "Document " + fileName + " was not proven used by LoomAI.";
            if (completedMissingEvidence.stream().noneMatch(existing -> existing.equalsIgnoreCase(missingEvidence))) {
                completedMissingEvidence.add(missingEvidence);
            }
        }
        return new ProductCreationFields(
                fields.productName(),
                fields.summary(),
                fields.projectDescription(),
                fields.businessProblem(),
                fields.targetUsers(),
                fields.businessStage(),
                fields.techStack(),
                fields.productUrl(),
                fields.repositoryUrl(),
                fields.riskProfile(),
                documentAwareCreationSummary(fields.aiCreationSummary(), completedUsage),
                fields.coreCapabilities(),
                fields.businessOutcomes(),
                fields.readinessGoals(),
                fields.recommendedServices(),
                fields.recommendedServiceModules(),
                fields.missingCatalogCoverage(),
                fields.scannerFocusAreas(),
                fields.suggestedNextSteps(),
                fields.sourceInsights(),
                fields.assumptions(),
                completedMissingEvidence,
                completedUsage
        );
    }

    private String documentAwareCreationSummary(String aiCreationSummary, List<DocumentUsageEvidence> documentUsage) {
        if (documentUsage == null || documentUsage.isEmpty()) {
            return aiCreationSummary;
        }
        long used = documentUsage.stream()
                .filter(usage -> "USED".equals(usage.status()))
                .count();
        long notUsed = documentUsage.stream()
                .filter(usage -> "NOT_USED".equals(usage.status()))
                .count();
        if (used == 0 && notUsed > 0) {
            return "LoomAI analyzed the owner intake, but did not return owner-safe evidence proving that selected documents were used.";
        }
        if (used > 0 && notUsed > 0) {
            return "LoomAI used some selected documents and did not prove usage for others. Review document evidence before creating the project.";
        }
        return aiCreationSummary;
    }

    private boolean sameDocumentUsage(DocumentUsageEvidence usage, String documentId, String fileName) {
        if (usage == null) {
            return false;
        }
        if (hasText(documentId) && hasText(usage.documentId())) {
            return usage.documentId().equalsIgnoreCase(documentId);
        }
        return firstNonBlank(usage.fileName()).equalsIgnoreCase(firstNonBlank(fileName));
    }

    private boolean hasMeaningfulFields(ProductCreationFields fields) {
        return fields != null && (
                hasText(fields.productName())
                        || hasText(fields.summary())
                        || hasText(fields.projectDescription())
                        || hasText(fields.businessProblem())
                        || hasText(fields.targetUsers())
                        || hasText(fields.businessStage())
                        || hasText(fields.techStack())
                        || hasText(fields.productUrl())
                        || hasText(fields.repositoryUrl())
                        || hasText(fields.riskProfile())
                        || hasText(fields.aiCreationSummary())
                        || !listOrEmpty(fields.coreCapabilities()).isEmpty()
                        || !listOrEmpty(fields.businessOutcomes()).isEmpty()
                        || !listOrEmpty(fields.readinessGoals()).isEmpty()
                        || !listOrEmpty(fields.recommendedServices()).isEmpty()
                        || !listOrEmpty(fields.recommendedServiceModules()).isEmpty()
                        || !listOrEmpty(fields.missingCatalogCoverage()).isEmpty()
                        || !listOrEmpty(fields.scannerFocusAreas()).isEmpty()
                        || !listOrEmpty(fields.suggestedNextSteps()).isEmpty()
                        || !listOrEmpty(fields.sourceInsights()).isEmpty()
                        || (fields.assumptions() != null && !fields.assumptions().isEmpty())
                        || (fields.missingEvidence() != null && !fields.missingEvidence().isEmpty())
                        || (fields.documentUsage() != null && !fields.documentUsage().isEmpty())
        );
    }

    private <T> List<T> listOrEmpty(List<T> values) {
        return values == null ? List.of() : values;
    }

    private List<String> mergeList(List<String> preferred, List<String> fallback) {
        List<String> values = listOrEmpty(preferred);
        return values.isEmpty() ? listOrEmpty(fallback) : values;
    }

    private List<ServiceModuleRecommendation> mergeServiceModuleRecommendations(
            List<ServiceModuleRecommendation> preferred,
            List<ServiceModuleRecommendation> fallback
    ) {
        List<ServiceModuleRecommendation> values = listOrEmpty(preferred);
        return values.isEmpty() ? listOrEmpty(fallback) : values;
    }

    private List<MissingCatalogCoverage> mergeMissingCatalogCoverage(
            List<MissingCatalogCoverage> preferred,
            List<MissingCatalogCoverage> fallback
    ) {
        List<MissingCatalogCoverage> values = listOrEmpty(preferred);
        return values.isEmpty() ? listOrEmpty(fallback) : values;
    }

    private List<String> sourceInsights(ProductCreationFields fields) {
        List<String> explicit = listOrEmpty(fields.sourceInsights());
        if (!explicit.isEmpty()) {
            return explicit;
        }
        return listOrEmpty(fields.documentUsage()).stream()
                .filter(usage -> "USED".equals(usage.status()))
                .flatMap(usage -> listOrEmpty(usage.evidence()).stream()
                        .map(evidence -> "Document: " + evidence))
                .limit(6)
                .toList();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private Optional<ProductCreationFields> parseFieldsFromActionParameters(AssistantQueryResponse response) {
        if (response.actions() == null || response.actions().isEmpty()) {
            return Optional.empty();
        }
        for (Map<String, Object> action : response.actions()) {
            if (!isProjectCreationAction(action)) {
                continue;
            }
            Object provided = action.get("providedParameters");
            if (!(provided instanceof Map<?, ?> providedParameters) || providedParameters.isEmpty()) {
                continue;
            }
            JsonNode node = objectMapper.valueToTree(providedParameters);
            return Optional.of(new ProductCreationFields(
                    text(node, "productName", "draftName", "name"),
                    text(node, "summary", "outcomeSummary", "productSummary"),
                    text(node, "projectDescription", "projectOverview", "description"),
                    text(node, "businessProblem", "problemStatement"),
                    text(node, "targetUsers", "audience", "users"),
                    text(node, "businessStage", "stage"),
                    text(node, "techStack", "stack"),
                    text(node, "productUrl"),
                    text(node, "repositoryUrl", "repoUrl"),
                    text(node, "riskProfile", "riskNotes", "risks"),
                    text(node, "aiCreationSummary", "analysisSummary", "creationSummary"),
                    textList(node, "coreCapabilities", "capabilities", "keyFeatures"),
                    textList(node, "businessOutcomes", "outcomes"),
                    textList(node, "readinessGoals", "productionReadinessGoals"),
                    textList(node, "recommendedServices", "serviceRecommendations", "lifecycleServices"),
                    serviceModuleRecommendationList(node, "recommendedServiceModules", "catalogServiceRecommendations"),
                    missingCatalogCoverageList(node, "missingCatalogCoverage", "unmatchedServiceNeeds"),
                    textList(node, "scannerFocusAreas", "scannerPlan", "scanFocus"),
                    textList(node, "suggestedNextSteps", "nextSteps"),
                    textList(node, "sourceInsights", "linkInsights", "resourceInsights"),
                    textList(node, "assumptions"),
                    textList(node, "missingEvidence", "missing_evidence"),
                    documentUsageList(node, "documentUsage", "document_usage", "documentUse")
            ));
        }
        return Optional.empty();
    }

    private boolean isProjectCreationAction(Map<String, Object> action) {
        Object name = firstNonNull(action.get("action"), action.get("name"), action.get("actionId"), action.get("tool"));
        if (!(name instanceof String value) || value.isBlank()) {
            return false;
        }
        return "produs_productization_project_create".equals(value)
                || "produs.productization_project.create".equals(value);
    }

    private Optional<ProductCreationFields> parseFields(String raw) {
        String json = extractJson(raw);
        if (json.isBlank()) {
            return Optional.empty();
        }
        try {
            JsonNode node = objectMapper.readTree(json);
            if (!node.isObject()) {
                return Optional.empty();
            }
            return Optional.of(new ProductCreationFields(
                    text(node, "productName", "draftName", "name"),
                    text(node, "summary", "outcomeSummary", "productSummary"),
                    text(node, "projectDescription", "projectOverview", "description"),
                    text(node, "businessProblem", "problemStatement"),
                    text(node, "targetUsers", "audience", "users"),
                    text(node, "businessStage", "stage"),
                    text(node, "techStack", "stack"),
                    text(node, "productUrl"),
                    text(node, "repositoryUrl", "repoUrl"),
                    text(node, "riskProfile", "riskNotes", "risks"),
                    text(node, "aiCreationSummary", "analysisSummary", "creationSummary"),
                    textList(node, "coreCapabilities", "capabilities", "keyFeatures"),
                    textList(node, "businessOutcomes", "outcomes"),
                    textList(node, "readinessGoals", "productionReadinessGoals"),
                    textList(node, "recommendedServices", "serviceRecommendations", "lifecycleServices"),
                    serviceModuleRecommendationList(node, "recommendedServiceModules", "catalogServiceRecommendations"),
                    missingCatalogCoverageList(node, "missingCatalogCoverage", "unmatchedServiceNeeds"),
                    textList(node, "scannerFocusAreas", "scannerPlan", "scanFocus"),
                    textList(node, "suggestedNextSteps", "nextSteps"),
                    textList(node, "sourceInsights", "linkInsights", "resourceInsights"),
                    textList(node, "assumptions"),
                    textList(node, "missingEvidence", "missing_evidence"),
                    documentUsageList(node, "documentUsage", "document_usage", "documentUse")
            ));
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private String extractJson(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        String text = raw.trim();
        int fencedStart = text.indexOf("```");
        if (fencedStart >= 0) {
            int contentStart = text.indexOf('\n', fencedStart);
            int fencedEnd = text.indexOf("```", contentStart + 1);
            if (contentStart > fencedStart && fencedEnd > contentStart) {
                text = text.substring(contentStart + 1, fencedEnd).trim();
            }
        }
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return "";
    }

    private ProductCreationFields deterministicFields(AiAssistedProductCreationRequest request) {
        List<ServiceModuleRecommendation> serviceModules = deterministicServiceModuleRecommendations(request);
        List<String> recommendedServices = serviceModules.stream()
                .map(recommendation -> firstNonBlank(recommendation.moduleName(), recommendation.moduleCode()))
                .filter(value -> !value.isBlank())
                .toList();
        List<String> scannerFocusAreas = deterministicScannerFocusAreas(request);
        return new ProductCreationFields(
                firstNonBlank(request.productName(), firstLine(request.ownerMessage()), "AI-created product " + LocalDateTime.now().toLocalDate()),
                trim(request.ownerMessage(), TEXT_LIMIT),
                trim(request.ownerMessage(), TEXT_LIMIT),
                "",
                "",
                request.businessStage() == null ? ProductProfile.BusinessStage.PROTOTYPE.name() : request.businessStage().name(),
                request.techStack(),
                request.productUrl(),
                request.repositoryUrl(),
                request.knownRisks(),
                "Analysis prepared from owner-approved AI project intake. LoomAI response was unavailable or did not return the strict project analysis JSON contract.",
                List.of(),
                List.of(),
                List.of("Run product diagnosis, scanner evidence collection, and service selection after project creation."),
                recommendedServices,
                serviceModules,
                List.of(),
                scannerFocusAreas,
                List.of("Create the productization workspace and run the first diagnosis."),
                deterministicSourceInsights(request),
                List.of("ProdUS used owner-provided intake because AI analysis was unavailable."),
                List.of("Run diagnosis and scanner evidence collection after project creation."),
                List.of()
        );
    }

    private List<ServiceModuleRecommendation> deterministicServiceModuleRecommendations(AiAssistedProductCreationRequest request) {
        String needText = normalizeText(String.join(" ",
                firstNonBlank(request.ownerMessage()),
                firstNonBlank(request.productName()),
                firstNonBlank(request.techStack()),
                firstNonBlank(request.knownRisks()),
                firstNonBlank(request.productUrl()),
                firstNonBlank(request.repositoryUrl())
        ));
        boolean hasRepo = hasText(request.repositoryUrl());
        boolean asksTesting = containsAny(needText, "test", "testing", "qa", "quality", "coverage", "e2e", "smoke");
        boolean asksSecurity = containsAny(needText, "security", "secret", "auth", "credential", "vulnerability");
        boolean asksDeployment = containsAny(needText, "deploy", "deployment", "staging", "production", "release", "ci", "cd");
        boolean asksDatabase = containsAny(needText, "database", "postgres", "schema", "migration", "data");

        List<DeterministicServiceSeed> seeds = new ArrayList<>();
        addDeterministicSeed(seeds, "validation.product_readiness", "MUST",
                "Owner asked for a production-readiness productization project.",
                "Evidence-backed product diagnosis and service sequencing.");
        if (hasRepo) {
            addDeterministicSeed(seeds, "validation.codebase", "MUST",
                    "Repository URL was provided during project creation.",
                    "Codebase risks are visible before delivery teams scope implementation.");
            addDeterministicSeed(seeds, "security.secrets_scan", asksSecurity ? "MUST" : "SHOULD",
                    "Repository-backed productization should check for exposed credentials and unsafe configuration.",
                    "Secret exposure risk is surfaced before production access is granted.");
            addDeterministicSeed(seeds, "security.dependency_review", "SHOULD",
                    "Repository-backed productization should inspect dependency and supply-chain risk.",
                    "Dependency risk is visible and mapped to patch or acceptance decisions.");
        }
        if (asksDeployment || hasRepo) {
            addDeterministicSeed(seeds, "cloud.staging_setup", "SHOULD",
                    "The owner wants the project ready to connect the repo and start governed scanning.",
                    "A staging or scanner-ready environment path is available for evidence collection.");
            addDeterministicSeed(seeds, "cloud.cicd_setup", "SHOULD",
                    "Repository scanning and repeatable production readiness need CI/CD evidence.",
                    "Build, test, and deployment checks can gate production decisions.");
        }
        if (asksTesting || asksDeployment || hasRepo) {
            addDeterministicSeed(seeds, "quality.test_strategy", "SHOULD",
                    "Production readiness needs explicit test scope and evidence gates.",
                    "The owner knows which critical flows and checks prove release confidence.");
            if (asksTesting) {
                addDeterministicSeed(seeds, "quality.e2e_testing", "COULD",
                        "The owner input mentions testing or quality validation.",
                        "Critical user journeys can be verified end to end before launch.");
            }
        }
        if (asksDatabase) {
            addDeterministicSeed(seeds, "db.review", "SHOULD",
                    "The owner input or repository context references database or data readiness.",
                    "Schema, migration, integrity, and query risks are reviewed before productization.");
        }
        addDeterministicSeed(seeds, "launch.readiness_review", "SHOULD",
                "Production-level productization should end with an owner-readable launch decision.",
                "Launch-critical blockers, evidence, and approvals are visible.");

        List<ServiceModuleRecommendation> recommendations = new ArrayList<>();
        int sequence = 0;
        for (DeterministicServiceSeed seed : seeds) {
            Optional<ServiceModule> module = findServiceModule(seed.moduleCode());
            if (module.isEmpty()) {
                continue;
            }
            sequence++;
            ServiceModule serviceModule = module.get();
            recommendations.add(new ServiceModuleRecommendation(
                    moduleCode(serviceModule),
                    serviceModule.getName(),
                    serviceModule.getCategory() == null ? "" : serviceModule.getCategory().getSlug(),
                    seed.priority(),
                    sequence,
                    seed.reason(),
                    List.of("Owner intake", hasRepo ? "Repository URL provided" : "Owner-provided project context"),
                    firstNonBlank(serviceModule.getOwnerOutcome(), seed.expectedOutcome()),
                    0.72,
                    true
            ));
            if (recommendations.size() >= 6) {
                break;
            }
        }
        return recommendations;
    }

    private List<String> deterministicScannerFocusAreas(AiAssistedProductCreationRequest request) {
        List<String> focusAreas = new ArrayList<>();
        focusAreas.add("Codebase structure, build health, and maintainability readiness");
        focusAreas.add("Secrets, dependency, and API security posture");
        if (hasText(request.repositoryUrl())) {
            focusAreas.add("Repository-connected scanner setup and CI evidence import");
        }
        if (containsAny(normalizeText(firstNonBlank(request.techStack(), request.ownerMessage())), "postgres", "database", "schema", "migration")) {
            focusAreas.add("Database schema, migration, integrity, and query readiness");
        }
        focusAreas.add("Deployment, staging, monitoring, and rollback readiness");
        focusAreas.add("Critical flow testing and release acceptance evidence");
        return focusAreas.stream().distinct().limit(6).toList();
    }

    private List<String> deterministicSourceInsights(AiAssistedProductCreationRequest request) {
        List<String> insights = new ArrayList<>();
        if (hasText(request.repositoryUrl())) {
            insights.add("Owner provided repository URL: " + trim(request.repositoryUrl(), 180));
        }
        if (hasText(request.productUrl())) {
            insights.add("Owner provided product URL: " + trim(request.productUrl(), 180));
        }
        if (hasText(request.techStack())) {
            insights.add("Owner identified tech stack: " + trim(request.techStack(), 180));
        }
        return insights;
    }

    private Optional<ServiceModule> findServiceModule(String moduleCode) {
        if (!hasText(moduleCode)) {
            return Optional.empty();
        }
        Optional<ServiceModule> byStableCode = Optional.ofNullable(serviceModuleRepository.findByStableCode(moduleCode))
                .orElse(Optional.empty());
        return byStableCode.isPresent()
                ? byStableCode
                : Optional.ofNullable(serviceModuleRepository.findBySlug(moduleCode)).orElse(Optional.empty());
    }

    private void addDeterministicSeed(
            List<DeterministicServiceSeed> seeds,
            String moduleCode,
            String priority,
            String reason,
            String expectedOutcome
    ) {
        if (seeds.stream().noneMatch(seed -> seed.moduleCode().equals(moduleCode))) {
            seeds.add(new DeterministicServiceSeed(moduleCode, priority, reason, expectedOutcome));
        }
    }

    private boolean containsAny(String text, String... values) {
        if (text == null || text.isBlank()) {
            return false;
        }
        for (String value : values) {
            if (text.contains(value)) {
                return true;
            }
        }
        return false;
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
    }

    private record DeterministicServiceSeed(String moduleCode, String priority, String reason, String expectedOutcome) {}

    private String initialName(ProductCreationIntent intent) {
        String candidate = firstNonBlank(intent.getProductName(), firstLine(intent.getOwnerMessage()), "AI-created product " + LocalDateTime.now().toLocalDate());
        return trim(candidate, NAME_LIMIT);
    }

    private String firstLine(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String line = value.strip().split("\\R", 2)[0].trim();
        if (line.length() > 72) {
            line = line.substring(0, 72).trim();
        }
        return line;
    }

    private Optional<ProductProfile.BusinessStage> parseStage(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(ProductProfile.BusinessStage.valueOf(value.trim().toUpperCase(Locale.ROOT).replace(' ', '_')));
        } catch (IllegalArgumentException ignored) {
            return Optional.empty();
        }
    }

    private String text(JsonNode node, String... fields) {
        for (String field : fields) {
            JsonNode value = node.path(field);
            if (value.isTextual() && !value.asText().isBlank()) {
                return value.asText();
            }
        }
        return "";
    }

    private List<String> textList(JsonNode node, String... fields) {
        for (String field : fields) {
            JsonNode value = node.path(field);
            if (value.isArray()) {
                List<String> result = new ArrayList<>();
                value.forEach(item -> {
                    if (item.isTextual() && !item.asText().isBlank()) {
                        result.add(trim(item.asText(), 500));
                    }
                });
                return result;
            }
        }
        return List.of();
    }

    private List<DocumentUsageEvidence> documentUsageList(JsonNode node, String... fields) {
        for (String field : fields) {
            JsonNode value = node.path(field);
            if (!value.isArray()) {
                continue;
            }
            List<DocumentUsageEvidence> result = new ArrayList<>();
            value.forEach(item -> {
                if (!item.isObject()) {
                    return;
                }
                String fileName = firstNonBlank(
                        text(item, "fileName", "filename", "name"),
                        "Shared document"
                );
                String documentId = text(item, "documentId", "document_id", "id");
                String status = normalizedDocumentUsageStatus(text(item, "status", "usageStatus"));
                String accessMethod = normalizedDocumentAccessMethod(text(item, "accessMethod", "method"));
                List<String> evidence = textList(item, "evidence", "evidenceItems", "facts");
                String reason = text(item, "reason", "why", "notes");
                if ("USED".equals(status) && evidence.isEmpty()) {
                    String originalReason = reason;
                    status = "NOT_USED";
                    accessMethod = "NONE";
                    reason = hasText(originalReason)
                            ? "LoomAI did not return required owner-safe evidence for this file. Original LoomAI reason: "
                                    + trim(originalReason, TEXT_LIMIT)
                            : "LoomAI did not return the required owner-safe evidence for this file.";
                }
                if ("NOT_USED".equals(status) && reason.isBlank()) {
                    reason = "LoomAI did not use this file for the project creation analysis.";
                }
                result.add(new DocumentUsageEvidence(
                        trim(documentId, NAME_LIMIT),
                        trim(fileName, NAME_LIMIT),
                        status,
                        accessMethod,
                        evidence.stream().limit(4).toList(),
                        trim(reason, 500)
                ));
            });
            return result;
        }
        return List.of();
    }

    private List<ServiceModuleRecommendation> serviceModuleRecommendationList(JsonNode node, String... fields) {
        for (String field : fields) {
            JsonNode value = node.path(field);
            if (!value.isArray()) {
                continue;
            }
            List<ServiceModuleRecommendation> result = new ArrayList<>();
            value.forEach(item -> {
                if (!item.isObject()) {
                    return;
                }
                String moduleCode = text(item, "moduleCode", "stableCode", "slug", "code");
                if (!hasText(moduleCode)) {
                    return;
                }
                result.add(new ServiceModuleRecommendation(
                        trim(moduleCode, 255),
                        trim(text(item, "moduleName", "name"), 255),
                        trim(text(item, "categorySlug", "category"), 255),
                        normalizePriority(text(item, "priority")),
                        intValue(item.path("sequence"), result.size() + 1),
                        trim(text(item, "reason", "rationale"), TEXT_LIMIT),
                        textList(item, "evidenceBasis", "evidence", "signals"),
                        trim(text(item, "expectedOutcome", "outcome"), TEXT_LIMIT),
                        doubleValue(item.path("confidence")),
                        booleanValue(item.path("accepted"), true)
                ));
            });
            return result;
        }
        return List.of();
    }

    private List<MissingCatalogCoverage> missingCatalogCoverageList(JsonNode node, String... fields) {
        for (String field : fields) {
            JsonNode value = node.path(field);
            if (!value.isArray()) {
                continue;
            }
            List<MissingCatalogCoverage> result = new ArrayList<>();
            value.forEach(item -> {
                if (item.isTextual() && !item.asText().isBlank()) {
                    result.add(new MissingCatalogCoverage(trim(item.asText(), 500), "", ""));
                    return;
                }
                if (!item.isObject()) {
                    return;
                }
                result.add(new MissingCatalogCoverage(
                        trim(text(item, "need", "capability", "gap"), 500),
                        trim(text(item, "reason", "why"), 500),
                        trim(text(item, "suggestedCatalogAction", "catalogAction", "action"), 500)
                ));
            });
            return result;
        }
        return List.of();
    }

    private int intValue(JsonNode node, int fallback) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return fallback;
        }
        if (node.canConvertToInt()) {
            return node.asInt(fallback);
        }
        if (node.isTextual()) {
            try {
                return Integer.parseInt(node.asText().trim());
            } catch (NumberFormatException ignored) {
                return fallback;
            }
        }
        return fallback;
    }

    private Double doubleValue(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        if (node.isNumber()) {
            return normalizeConfidence(node.asDouble());
        }
        if (node.isTextual()) {
            try {
                return normalizeConfidence(Double.parseDouble(node.asText().trim()));
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private boolean booleanValue(JsonNode node, boolean fallback) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return fallback;
        }
        if (node.isBoolean()) {
            return node.asBoolean(fallback);
        }
        if (node.isTextual()) {
            String normalized = node.asText().trim().toLowerCase(Locale.ROOT);
            if ("true".equals(normalized) || "yes".equals(normalized)) {
                return true;
            }
            if ("false".equals(normalized) || "no".equals(normalized)) {
                return false;
            }
        }
        return fallback;
    }

    private String normalizedDocumentUsageStatus(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
        return switch (normalized) {
            case "USED", "NOT_USED" -> normalized;
            default -> "NOT_USED";
        };
    }

    private String normalizedDocumentAccessMethod(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
        return switch (normalized) {
            case "TEMPORARY_URL", "NONE" -> normalized;
            default -> "NONE";
        };
    }

    private String writeStringList(List<String> values) {
        try {
            return objectMapper.writeValueAsString(values == null ? List.of() : values);
        } catch (Exception exception) {
            return "[]";
        }
    }

    private String trim(String value, int limit) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String normalized = value.replaceAll("[\\p{Cntrl}&&[^\\n\\t]]", "").trim();
        return normalized.length() <= limit ? normalized : normalized.substring(0, limit).trim();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private Object firstNonNull(Object... values) {
        for (Object value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private String createToken(String prefix) {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return prefix + "_" + java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256Hex(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    public record AiAssistedProductCreationRequest(
            String productName,
            String ownerMessage,
            ProductProfile.BusinessStage businessStage,
            String techStack,
            String productUrl,
            String repositoryUrl,
            String knownRisks
    ) {}

    public record ProductCreationFields(
            String productName,
            String summary,
            String projectDescription,
            String businessProblem,
            String targetUsers,
            String businessStage,
            String techStack,
            String productUrl,
            String repositoryUrl,
            String riskProfile,
            String aiCreationSummary,
            List<String> coreCapabilities,
            List<String> businessOutcomes,
            List<String> readinessGoals,
            List<String> recommendedServices,
            List<ServiceModuleRecommendation> recommendedServiceModules,
            List<MissingCatalogCoverage> missingCatalogCoverage,
            List<String> scannerFocusAreas,
            List<String> suggestedNextSteps,
            List<String> sourceInsights,
            List<String> assumptions,
            List<String> missingEvidence,
            List<DocumentUsageEvidence> documentUsage
    ) {}

    public record DocumentUsageEvidence(
            String documentId,
            String fileName,
            String status,
            String accessMethod,
            List<String> evidence,
            String reason
    ) {}

    public record ServiceModuleRecommendation(
            String moduleCode,
            String moduleName,
            String categorySlug,
            String priority,
            Integer sequence,
            String reason,
            List<String> evidenceBasis,
            String expectedOutcome,
            Double confidence,
            Boolean accepted
    ) {
        boolean acceptedOrDefault() {
            return accepted == null || accepted;
        }

        int sequenceOrDefault() {
            return sequence == null || sequence < 1 ? 999 : sequence;
        }
    }

    public record MissingCatalogCoverage(
            String need,
            String reason,
            String suggestedCatalogAction
    ) {}

    public record AiAssistedProductAnalysisResponse(
            ProductCreationIntentResponse intent,
            ProductCreationFields analysis,
            List<ProductProjectAttachmentResponse> attachments,
            List<AiDocumentShareResponse> aiSharedDocuments,
            AssistantQueryResponse assistant,
            boolean aiApplied,
            String fallbackReason,
            Map<String, Object> runtimeActionPayload
    ) {}

    public record ProductCreationActionResponse(
            ProductProfileResponse product,
            ProductCreationIntentResponse intent,
            List<ProductProjectAttachmentResponse> attachments,
            UUID auditEventId,
            boolean idempotentReplay,
            UUID projectIntelligenceId,
            int createdServiceRecommendations,
            int createdScannerRecommendations,
            int createdReadinessTasks,
            int createdCartServiceItems,
            UUID createdScanSourceId
    ) {}

    public record ProductCreationIntentResponse(
            UUID id,
            ProductCreationIntent.Status status,
            LocalDateTime expiresAt,
            String consentToken,
            String idempotencyKey,
            String analysisProviderRequestId,
            UUID productId,
            int aiSourceAttachmentCount
    ) {
        static ProductCreationIntentResponse from(ProductCreationIntent intent, String consentToken) {
            return new ProductCreationIntentResponse(
                    intent.getId(),
                    intent.getStatus(),
                    intent.getExpiresAt(),
                    consentToken,
                    intent.getIdempotencyKey(),
                    intent.getAnalysisProviderRequestId(),
                    intent.getProductProfile() == null ? null : intent.getProductProfile().getId(),
                    intent.getAiSourceAttachmentCount()
            );
        }
    }

    public record ProductProjectAttachmentResponse(
            UUID id,
            LocalDateTime createdAt,
            String fileName,
            String contentType,
            long sizeBytes,
            String label,
            boolean aiShareRequested,
            LocalDateTime aiAccessExpiresAt
    ) {
        static ProductProjectAttachmentResponse from(ProductProjectAttachment attachment) {
            return new ProductProjectAttachmentResponse(
                    attachment.getId(),
                    attachment.getCreatedAt(),
                    attachment.getFileName(),
                    attachment.getContentType(),
                    attachment.getSizeBytes(),
                    attachment.getLabel(),
                    attachment.isAiShareRequested(),
                    attachment.getAiAccessExpiresAt()
            );
        }
    }

    public record AiDocumentShareResponse(
            String documentId,
            UUID attachmentId,
            String fileName,
            String contentType,
            long sizeBytes,
            LocalDateTime expiresAt,
            String contentStatus
    ) {}

    public record ProductCreationActionRequest(
            UUID creationIntentId,
            String consentToken,
            String idempotencyKey,
            String analysisProviderRequestId,
            String productName,
            String summary,
            String projectDescription,
            String businessProblem,
            String targetUsers,
            String businessStage,
            String techStack,
            String productUrl,
            String repositoryUrl,
            String riskProfile,
            String aiCreationSummary,
            List<String> coreCapabilities,
            List<String> businessOutcomes,
            List<String> readinessGoals,
            List<String> recommendedServices,
            List<ServiceModuleRecommendation> recommendedServiceModules,
            List<MissingCatalogCoverage> missingCatalogCoverage,
            List<String> scannerFocusAreas,
            List<String> suggestedNextSteps,
            List<String> sourceInsights,
            List<String> assumptions,
            List<String> missingEvidence,
            List<UUID> sourceAttachmentIds,
            List<UUID> aiAccessibleAttachmentIds
    ) {
        static ProductCreationActionRequest from(Map<String, Object> args) {
            Map<String, Object> value = args == null ? Map.of() : args;
            return new ProductCreationActionRequest(
                    uuid(value.get("creationIntentId")),
                    string(value.get("consentToken")),
                    string(value.get("idempotencyKey")),
                    string(value.get("analysisProviderRequestId")),
                    string(value.get("productName")),
                    string(value.get("summary")),
                    string(value.get("projectDescription")),
                    string(value.get("businessProblem")),
                    string(value.get("targetUsers")),
                    string(value.get("businessStage")),
                    string(value.get("techStack")),
                    string(value.get("productUrl")),
                    string(value.get("repositoryUrl")),
                    string(value.get("riskProfile")),
                    string(value.get("aiCreationSummary")),
                    stringList(value.get("coreCapabilities")),
                    stringList(value.get("businessOutcomes")),
                    stringList(value.get("readinessGoals")),
                    stringList(value.get("recommendedServices")),
                    serviceModuleRecommendationList(value.get("recommendedServiceModules")),
                    missingCatalogCoverageList(value.get("missingCatalogCoverage")),
                    stringList(value.get("scannerFocusAreas")),
                    stringList(value.get("suggestedNextSteps")),
                    stringList(value.get("sourceInsights")),
                    stringList(value.get("assumptions")),
                    stringList(value.get("missingEvidence")),
                    uuidList(value.get("sourceAttachmentIds")),
                    uuidList(value.get("aiAccessibleAttachmentIds"))
            );
        }

        private static UUID uuid(Object raw) {
            String value = string(raw);
            if (value.isBlank()) {
                return null;
            }
            return UUID.fromString(value);
        }

        private static String string(Object raw) {
            return raw == null ? "" : String.valueOf(raw);
        }

        private static List<String> stringList(Object raw) {
            if (!(raw instanceof List<?> values)) {
                return List.of();
            }
            return values.stream()
                    .map(ProductCreationActionRequest::string)
                    .filter(value -> !value.isBlank())
                    .toList();
        }

        private static List<UUID> uuidList(Object raw) {
            if (!(raw instanceof List<?> values)) {
                return List.of();
            }
            return values.stream()
                    .map(ProductCreationActionRequest::string)
                    .filter(value -> !value.isBlank())
                    .map(UUID::fromString)
                    .toList();
        }

        @SuppressWarnings("unchecked")
        private static List<ServiceModuleRecommendation> serviceModuleRecommendationList(Object raw) {
            if (!(raw instanceof List<?> values)) {
                return List.of();
            }
            List<ServiceModuleRecommendation> result = new ArrayList<>();
            for (Object value : values) {
                if (!(value instanceof Map<?, ?> item)) {
                    continue;
                }
                String moduleCode = firstString(item, "moduleCode", "stableCode", "slug", "code");
                if (moduleCode.isBlank()) {
                    continue;
                }
                result.add(new ServiceModuleRecommendation(
                        moduleCode,
                        firstString(item, "moduleName", "name"),
                        firstString(item, "categorySlug", "category"),
                        firstString(item, "priority"),
                        integer(item.get("sequence")),
                        firstString(item, "reason", "rationale"),
                        stringList(item.get("evidenceBasis")),
                        firstString(item, "expectedOutcome", "outcome"),
                        decimal(item.get("confidence")),
                        bool(item.get("accepted"), true)
                ));
            }
            return result;
        }

        private static List<MissingCatalogCoverage> missingCatalogCoverageList(Object raw) {
            if (!(raw instanceof List<?> values)) {
                return List.of();
            }
            List<MissingCatalogCoverage> result = new ArrayList<>();
            for (Object value : values) {
                if (value instanceof String text && !text.isBlank()) {
                    result.add(new MissingCatalogCoverage(text, "", ""));
                    continue;
                }
                if (!(value instanceof Map<?, ?> item)) {
                    continue;
                }
                result.add(new MissingCatalogCoverage(
                        firstString(item, "need", "capability", "gap"),
                        firstString(item, "reason", "why"),
                        firstString(item, "suggestedCatalogAction", "catalogAction", "action")
                ));
            }
            return result;
        }

        private static String firstString(Map<?, ?> item, String... keys) {
            for (String key : keys) {
                Object value = item.get(key);
                String text = string(value);
                if (!text.isBlank()) {
                    return text;
                }
            }
            return "";
        }

        private static Integer integer(Object raw) {
            if (raw instanceof Number number) {
                return number.intValue();
            }
            String value = string(raw);
            if (value.isBlank()) {
                return null;
            }
            try {
                return Integer.parseInt(value);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }

        private static Double decimal(Object raw) {
            if (raw instanceof Number number) {
                return number.doubleValue();
            }
            String value = string(raw);
            if (value.isBlank()) {
                return null;
            }
            try {
                return Double.parseDouble(value);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }

        private static Boolean bool(Object raw, boolean fallback) {
            if (raw instanceof Boolean value) {
                return value;
            }
            String value = string(raw).toLowerCase(Locale.ROOT);
            if ("true".equals(value) || "yes".equals(value)) {
                return true;
            }
            if ("false".equals(value) || "no".equals(value)) {
                return false;
            }
            return fallback;
        }
    }
}
