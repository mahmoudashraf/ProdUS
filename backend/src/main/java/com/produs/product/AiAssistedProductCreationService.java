package com.produs.product;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.ai.LoomAIIntegrationService;
import com.produs.ai.LoomAIIntegrationService.AssistantQueryResponse;
import com.produs.ai.LoomAIIntegrationService.ProjectCreationAssistantRequest;
import com.produs.ai.LoomAIIntegrationService.ProjectCreationDocumentReference;
import com.produs.audit.AuditEvent;
import com.produs.dto.PlatformDtos.ProductProfileResponse;
import com.produs.entity.User;
import com.produs.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
    private final ProductProjectAttachmentService attachmentService;
    private final LoomAIIntegrationService loomAIIntegrationService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.product-creation.intent-ttl-minutes:30}")
    private long creationIntentTtlMinutes;

    @Transactional
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

        AssistantQueryResponse assistant = loomAIIntegrationService.projectCreation(owner, new ProjectCreationAssistantRequest(
                intent.getId(),
                request.ownerMessage(),
                request.businessStage() == null ? "" : request.businessStage().name(),
                request.techStack(),
                request.productUrl(),
                request.repositoryUrl(),
                request.knownRisks(),
                documentReferences
        ));

        ProductCreationFields ownerProvidedFields = deterministicFields(request);
        Optional<ProductCreationFields> parsedFields = parseFields(assistant).filter(this::hasMeaningfulFields);
        ProductCreationFields fields = parsedFields
                .map(parsed -> mergeFields(parsed, ownerProvidedFields))
                .orElse(ownerProvidedFields);
        fields = ensureDocumentUsage(fields, documentReferences);
        applyAnalysis(intent, fields, assistant, temporaryAccess.size());
        intent.setStatus(ProductCreationIntent.Status.READY_FOR_ACTION);
        intent = intentRepository.save(intent);

        return new AiAssistedProductAnalysisResponse(
                ProductCreationIntentResponse.from(intent, consentToken),
                fields,
                attachments.stream().map(ProductProjectAttachmentResponse::from).toList(),
                documentReferences.stream()
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
                projectCreationActionPayload(intent, consentToken, fields, attachments, temporaryAccess)
        );
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
        product.setSummary(firstNonBlank(trim(request.summary(), TEXT_LIMIT), intent.getSummary(), intent.getOwnerMessage()));
        product.setBusinessStage(parseStage(firstNonBlank(request.businessStage(), intent.getBusinessStage() == null ? "" : intent.getBusinessStage().name()))
                .orElse(ProductProfile.BusinessStage.PROTOTYPE));
        product.setTechStack(firstNonBlank(trim(request.techStack(), TEXT_LIMIT), intent.getTechStack()));
        product.setProductUrl(firstNonBlank(trim(request.productUrl(), 500), intent.getProductUrl()));
        product.setRepositoryUrl(firstNonBlank(trim(request.repositoryUrl(), 500), intent.getRepositoryUrl()));
        product.setRiskProfile(firstNonBlank(trim(request.riskProfile(), TEXT_LIMIT), intent.getRiskProfile()));
        product.setCreationMode(ProductProfile.CreationMode.AI_ASSISTED);
        product.setCreatedByAi(true);
        product.setAiProviderRequestId(firstNonBlank(request.analysisProviderRequestId(), intent.getAnalysisProviderRequestId()));
        product.setAiCreationSummary(firstNonBlank(trim(request.aiCreationSummary(), TEXT_LIMIT), intent.getAiCreationSummary()));

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
                "AI project creation action executed via ProdUS runtime action; intent=%s idempotencyKey=%s providerRequestId=%s"
                        .formatted(intent.getId(), intent.getIdempotencyKey(), nullToEmpty(saved.getAiProviderRequestId()))
        );

        return actionResponse(intent, saved, audit.getId(), true);
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
        intent.setSummary(firstNonBlank(trim(fields.summary(), TEXT_LIMIT), intent.getSummary(), intent.getOwnerMessage()));
        intent.setBusinessStage(parseStage(fields.businessStage()).orElseGet(() ->
                intent.getBusinessStage() == null ? ProductProfile.BusinessStage.PROTOTYPE : intent.getBusinessStage()));
        intent.setTechStack(firstNonBlank(trim(fields.techStack(), TEXT_LIMIT), intent.getTechStack()));
        intent.setProductUrl(firstNonBlank(trim(fields.productUrl(), 500), intent.getProductUrl()));
        intent.setRepositoryUrl(firstNonBlank(trim(fields.repositoryUrl(), 500), intent.getRepositoryUrl()));
        intent.setRiskProfile(firstNonBlank(trim(fields.riskProfile(), TEXT_LIMIT), intent.getRiskProfile()));
        intent.setAnalysisProviderRequestId(assistant.providerRequestId());
        intent.setAiSourceAttachmentCount(temporaryAccessCount);
        intent.setAiCreationSummary(trim(firstNonBlank(fields.aiCreationSummary(), assistant.safeSummary(), assistant.answer()), TEXT_LIMIT));
        intent.setAssumptions(writeStringList(fields.assumptions()));
        intent.setMissingEvidence(writeStringList(fields.missingEvidence()));
        intent.setAnalysisFallbackReason(assistant.fallbackReason());
    }

    private Map<String, Object> projectCreationActionPayload(
            ProductCreationIntent intent,
            String consentToken,
            ProductCreationFields fields,
            List<ProductProjectAttachment> attachments,
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
        payload.put("assumptions", fields.assumptions());
        payload.put("missingEvidence", fields.missingEvidence());
        payload.put("sourceAttachmentIds", attachments.stream().map(attachment -> attachment.getId().toString()).toList());
        payload.put("aiAccessibleAttachmentIds", temporaryAccess.stream().map(access -> access.attachmentId().toString()).toList());
        return payload;
    }

    private ProductCreationActionResponse actionResponse(
            ProductCreationIntent intent,
            ProductProfile product,
            UUID auditEventId,
            boolean createdNow
    ) {
        List<ProductProjectAttachmentResponse> attachments = attachmentRepository.findByCreationIntentIdOrderByCreatedAtDesc(intent.getId()).stream()
                .map(ProductProjectAttachmentResponse::from)
                .toList();
        return new ProductCreationActionResponse(
                toProductProfileResponse(product),
                ProductCreationIntentResponse.from(intent, null),
                attachments,
                auditEventId,
                !createdNow
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
                firstNonBlank(aiFields.productName(), ownerProvidedFields.productName()),
                firstNonBlank(aiFields.summary(), ownerProvidedFields.summary()),
                firstNonBlank(aiFields.businessStage(), ownerProvidedFields.businessStage()),
                firstNonBlank(aiFields.techStack(), ownerProvidedFields.techStack()),
                firstNonBlank(aiFields.productUrl(), ownerProvidedFields.productUrl()),
                firstNonBlank(aiFields.repositoryUrl(), ownerProvidedFields.repositoryUrl()),
                firstNonBlank(aiFields.riskProfile(), ownerProvidedFields.riskProfile()),
                firstNonBlank(
                        aiFields.aiCreationSummary(),
                        "LoomAI analyzed the owner intake and produced the initial project attributes. ProdUS completed any missing required fields from owner-provided inputs."
                ),
                aiFields.assumptions() == null ? List.of() : aiFields.assumptions(),
                aiFields.missingEvidence() == null ? List.of() : aiFields.missingEvidence(),
                aiFields.documentUsage() == null ? List.of() : aiFields.documentUsage()
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
                fields.businessStage(),
                fields.techStack(),
                fields.productUrl(),
                fields.repositoryUrl(),
                fields.riskProfile(),
                documentAwareCreationSummary(fields.aiCreationSummary(), completedUsage),
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
                        || hasText(fields.businessStage())
                        || hasText(fields.techStack())
                        || hasText(fields.productUrl())
                        || hasText(fields.repositoryUrl())
                        || hasText(fields.riskProfile())
                        || hasText(fields.aiCreationSummary())
                        || (fields.assumptions() != null && !fields.assumptions().isEmpty())
                        || (fields.missingEvidence() != null && !fields.missingEvidence().isEmpty())
                        || (fields.documentUsage() != null && !fields.documentUsage().isEmpty())
        );
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
                    text(node, "productName", "name"),
                    text(node, "summary", "productSummary"),
                    text(node, "businessStage", "stage"),
                    text(node, "techStack"),
                    text(node, "productUrl"),
                    text(node, "repositoryUrl", "repoUrl"),
                    text(node, "riskProfile", "risks"),
                    text(node, "aiCreationSummary", "creationSummary"),
                    textList(node, "assumptions"),
                    textList(node, "missingEvidence", "missing_evidence"),
                    documentUsageList(node, "documentUsage", "document_usage")
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
                    text(node, "productName", "name"),
                    text(node, "summary", "productSummary"),
                    text(node, "businessStage", "stage"),
                    text(node, "techStack"),
                    text(node, "productUrl"),
                    text(node, "repositoryUrl", "repoUrl"),
                    text(node, "riskProfile", "risks"),
                    text(node, "aiCreationSummary", "creationSummary"),
                    textList(node, "assumptions"),
                    textList(node, "missingEvidence", "missing_evidence"),
                    documentUsageList(node, "documentUsage", "document_usage")
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
        return new ProductCreationFields(
                firstNonBlank(request.productName(), firstLine(request.ownerMessage()), "AI-created product " + LocalDateTime.now().toLocalDate()),
                trim(request.ownerMessage(), TEXT_LIMIT),
                request.businessStage() == null ? ProductProfile.BusinessStage.PROTOTYPE.name() : request.businessStage().name(),
                request.techStack(),
                request.productUrl(),
                request.repositoryUrl(),
                request.knownRisks(),
                "Analysis prepared from owner-approved AI project intake. LoomAI response was unavailable or did not return the strict project analysis JSON contract.",
                List.of("ProdUS used owner-provided intake because AI analysis was unavailable."),
                List.of("Run diagnosis and scanner evidence collection after project creation."),
                List.of()
        );
    }

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
            String businessStage,
            String techStack,
            String productUrl,
            String repositoryUrl,
            String riskProfile,
            String aiCreationSummary,
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
            boolean idempotentReplay
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
            String businessStage,
            String techStack,
            String productUrl,
            String repositoryUrl,
            String riskProfile,
            String aiCreationSummary,
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
                    string(value.get("businessStage")),
                    string(value.get("techStack")),
                    string(value.get("productUrl")),
                    string(value.get("repositoryUrl")),
                    string(value.get("riskProfile")),
                    string(value.get("aiCreationSummary")),
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
    }
}
