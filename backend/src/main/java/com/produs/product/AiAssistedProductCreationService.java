package com.produs.product;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.ai.LoomAIIntegrationService;
import com.produs.ai.LoomAIIntegrationService.AssistantQueryResponse;
import com.produs.ai.LoomAIIntegrationService.ProjectCreationAssistantRequest;
import com.produs.ai.LoomAIIntegrationService.ProjectCreationDocumentReference;
import com.produs.dto.PlatformDtos.ProductProfileResponse;
import com.produs.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
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
    private final ProductProjectAttachmentService attachmentService;
    private final LoomAIIntegrationService loomAIIntegrationService;
    private final ObjectMapper objectMapper;

    @Transactional
    public AiAssistedProductCreationResponse create(
            User owner,
            AiAssistedProductCreationRequest request,
            List<MultipartFile> files,
            Set<Integer> aiSharedFileIndexes,
            String apiBaseUrl
    ) {
        if (request == null || request.ownerMessage() == null || request.ownerMessage().isBlank()) {
            throw new IllegalArgumentException("Project creation prompt is required");
        }

        ProductProfile product = new ProductProfile();
        product.setOwner(owner);
        product.setName(initialName(request));
        product.setSummary(trim(request.ownerMessage(), TEXT_LIMIT));
        product.setBusinessStage(request.businessStage() == null ? ProductProfile.BusinessStage.PROTOTYPE : request.businessStage());
        product.setTechStack(trim(request.techStack(), TEXT_LIMIT));
        product.setProductUrl(trim(request.productUrl(), 500));
        product.setRepositoryUrl(trim(request.repositoryUrl(), 500));
        product.setRiskProfile(trim(request.knownRisks(), TEXT_LIMIT));
        product.setCreationMode(ProductProfile.CreationMode.AI_ASSISTED);
        product.setCreatedByAi(true);
        product = productRepository.save(product);

        List<ProductProjectAttachment> attachments = attachmentService.uploadForProductCreation(owner, product, files, aiSharedFileIndexes);
        List<ProductProjectAttachmentService.TemporaryAiDocumentAccess> temporaryAccess = attachments.stream()
                .filter(ProductProjectAttachment::isAiShareRequested)
                .map(attachment -> attachmentService.grantTemporaryAiAccess(attachment, apiBaseUrl))
                .toList();

        AssistantQueryResponse assistant = loomAIIntegrationService.projectCreation(owner, new ProjectCreationAssistantRequest(
                product.getId(),
                request.ownerMessage(),
                product.getBusinessStage().name(),
                request.techStack(),
                request.productUrl(),
                request.repositoryUrl(),
                request.knownRisks(),
                temporaryAccess.stream()
                        .map(document -> new ProjectCreationDocumentReference(
                                document.attachmentId(),
                                document.fileName(),
                                document.contentType(),
                                document.sizeBytes(),
                                document.temporaryAccessUrl(),
                                document.expiresAt()
                        ))
                        .toList()
        ));

        Optional<ProductCreationFields> parsedFields = parseFields(assistant);
        ProductCreationFields fields = parsedFields.orElseGet(() -> deterministicFields(request));
        applyAiFields(product, fields);
        product.setAiProviderRequestId(assistant.providerRequestId());
        product.setAiSourceAttachmentCount(temporaryAccess.size());
        product.setAiCreationSummary(trim(firstNonBlank(fields.aiCreationSummary(), assistant.safeSummary(), assistant.answer()), TEXT_LIMIT));
        ProductProfile saved = productRepository.save(product);

        return new AiAssistedProductCreationResponse(
                toProductProfileResponse(saved),
                attachments.stream().map(ProductProjectAttachmentResponse::from).toList(),
                temporaryAccess.stream()
                        .map(access -> new AiDocumentShareResponse(
                                access.attachmentId(),
                                access.fileName(),
                                access.contentType(),
                                access.sizeBytes(),
                                access.expiresAt()
                        ))
                        .toList(),
                assistant,
                parsedFields.isPresent(),
                assistant.fallbackReason()
        );
    }

    private void applyAiFields(ProductProfile product, ProductCreationFields fields) {
        product.setName(firstNonBlank(trim(fields.productName(), NAME_LIMIT), product.getName()));
        product.setSummary(firstNonBlank(trim(fields.summary(), TEXT_LIMIT), product.getSummary()));
        product.setBusinessStage(parseStage(fields.businessStage()).orElse(product.getBusinessStage()));
        product.setTechStack(firstNonBlank(trim(fields.techStack(), TEXT_LIMIT), product.getTechStack()));
        product.setProductUrl(firstNonBlank(trim(fields.productUrl(), 500), product.getProductUrl()));
        product.setRepositoryUrl(firstNonBlank(trim(fields.repositoryUrl(), 500), product.getRepositoryUrl()));
        product.setRiskProfile(firstNonBlank(trim(fields.riskProfile(), TEXT_LIMIT), product.getRiskProfile()));
    }

    private Optional<ProductCreationFields> parseFields(AssistantQueryResponse response) {
        if (response == null) {
            return Optional.empty();
        }
        return parseFields(response.answer()).or(() -> parseFields(response.safeSummary()));
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
                    text(node, "aiCreationSummary", "creationSummary")
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
                initialName(request),
                trim(request.ownerMessage(), TEXT_LIMIT),
                request.businessStage() == null ? ProductProfile.BusinessStage.PROTOTYPE.name() : request.businessStage().name(),
                request.techStack(),
                request.productUrl(),
                request.repositoryUrl(),
                request.knownRisks(),
                "Created from owner-approved AI project intake. LoomAI response was unavailable or did not return the strict product profile JSON contract."
        );
    }

    private String initialName(AiAssistedProductCreationRequest request) {
        String candidate = firstNonBlank(request.productName(), firstLine(request.ownerMessage()), "AI-created product " + LocalDateTime.now().toLocalDate());
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

    public record AiAssistedProductCreationRequest(
            String productName,
            String ownerMessage,
            ProductProfile.BusinessStage businessStage,
            String techStack,
            String productUrl,
            String repositoryUrl,
            String knownRisks
    ) {}

    private record ProductCreationFields(
            String productName,
            String summary,
            String businessStage,
            String techStack,
            String productUrl,
            String repositoryUrl,
            String riskProfile,
            String aiCreationSummary
    ) {}

    public record AiAssistedProductCreationResponse(
            ProductProfileResponse product,
            List<ProductProjectAttachmentResponse> attachments,
            List<AiDocumentShareResponse> aiSharedDocuments,
            AssistantQueryResponse assistant,
            boolean aiApplied,
            String fallbackReason
    ) {}

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
            UUID attachmentId,
            String fileName,
            String contentType,
            long sizeBytes,
            LocalDateTime expiresAt
    ) {}
}
