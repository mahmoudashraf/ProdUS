package com.produs.product;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.ai.LoomAIIntegrationService;
import com.produs.service.AuditService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class AiAssistedProductCreationServiceTest {

    @Test
    void extractsSharedMarkdownDocumentContentForLoomAiAndRedactsSecrets() throws Exception {
        AiAssistedProductCreationService service = new AiAssistedProductCreationService(
                mock(ProductProfileRepository.class),
                mock(ProductCreationIntentRepository.class),
                mock(ProductProjectAttachmentRepository.class),
                mock(ProductProjectAttachmentService.class),
                mock(LoomAIIntegrationService.class),
                mock(AuditService.class),
                new ObjectMapper()
        );
        MockMultipartFile sharedMarkdown = new MockMultipartFile(
                "files",
                "PROJECT_OVERVIEW.md",
                "application/octet-stream",
                """
                        # Matchly Project Overview
                        Product name: Matchly Vendor Matching
                        Tech stack: Next.js 15, Spring Boot 3, PostgreSQL, Supabase Auth
                        Known risks: webhook replay protection and scanner evidence mapping
                        api_key: should-not-leak
                        """.getBytes(StandardCharsets.UTF_8)
        );
        MockMultipartFile notSharedMarkdown = new MockMultipartFile(
                "files",
                "PRIVATE_NOTES.md",
                "text/markdown",
                "This should not be sent to AI.".getBytes(StandardCharsets.UTF_8)
        );

        Method extractor = AiAssistedProductCreationService.class
                .getDeclaredMethod("selectedDocumentContent", List.class, Set.class);
        extractor.setAccessible(true);

        @SuppressWarnings("unchecked")
        List<Object> extracted = (List<Object>) extractor.invoke(
                service,
                List.<MultipartFile>of(sharedMarkdown, notSharedMarkdown),
                Set.of(0)
        );

        assertThat(extracted).hasSize(1);
        Object content = extracted.get(0);
        Method excerptMethod = content.getClass().getDeclaredMethod("excerpt");
        Method statusMethod = content.getClass().getDeclaredMethod("status");
        excerptMethod.setAccessible(true);
        statusMethod.setAccessible(true);
        String excerpt = (String) excerptMethod.invoke(content);
        String status = (String) statusMethod.invoke(content);

        assertThat(status).isEqualTo("excerpt-included");
        assertThat(excerpt).contains("Matchly Vendor Matching");
        assertThat(excerpt).contains("Next.js 15, Spring Boot 3, PostgreSQL, Supabase Auth");
        assertThat(excerpt).contains("webhook replay protection and scanner evidence mapping");
        assertThat(excerpt).doesNotContain("should-not-leak");
        assertThat(excerpt).doesNotContain("This should not be sent to AI");
        assertThat(excerpt).contains("[redacted-secret]");
    }

    @Test
    void parsesProjectCreationFieldsFromLoomAiActionParameters() throws Exception {
        AiAssistedProductCreationService service = new AiAssistedProductCreationService(
                mock(ProductProfileRepository.class),
                mock(ProductCreationIntentRepository.class),
                mock(ProductProjectAttachmentRepository.class),
                mock(ProductProjectAttachmentService.class),
                mock(LoomAIIntegrationService.class),
                mock(AuditService.class),
                new ObjectMapper()
        );
        LoomAIIntegrationService.AssistantQueryResponse response = new LoomAIIntegrationService.AssistantQueryResponse(
                "LOOMAI",
                "LIVE",
                false,
                "CLARIFICATION_REQUIRED",
                "This action needs context.",
                "This action needs context.",
                "conversation-1",
                0.0,
                List.of(),
                List.of(Map.of(
                        "action", "produs_productization_project_create",
                        "providedParameters", Map.of(
                                "productName", "AI Inventory Ops",
                                "summary", "Initial project attributes for production readiness.",
                                "businessStage", "IDEA",
                                "techStack", "Next.js, Spring Boot, PostgreSQL",
                                "repositoryUrl", "https://github.com/mahmoudashraf/easy-luxury",
                                "riskProfile", "Deployment evidence and database migration proof are missing.",
                                "aiCreationSummary", "AI-assisted analysis prepared the initial project attributes.",
                                "assumptions", List.of("Owner wants an AI-assisted productization path."),
                                "missingEvidence", List.of("Run scanner evidence collection."),
                                "documentUsage", List.of(Map.of(
                                        "fileName", "PROJECT_OVERVIEW.md",
                                        "status", "USED",
                                        "accessMethod", "TEMPORARY_URL",
                                        "evidence", List.of("The document identifies Spring Boot and PostgreSQL."),
                                        "reason", "Temporary URL was opened and parsed."
                                ))
                        )
                )),
                List.of(),
                "CLARIFICATION_REQUIRED",
                "rag-test"
        );

        Method parser = AiAssistedProductCreationService.class
                .getDeclaredMethod("parseFields", LoomAIIntegrationService.AssistantQueryResponse.class);
        parser.setAccessible(true);

        @SuppressWarnings("unchecked")
        Optional<AiAssistedProductCreationService.ProductCreationFields> fields =
                (Optional<AiAssistedProductCreationService.ProductCreationFields>) parser.invoke(service, response);

        assertThat(fields).isPresent();
        assertThat(fields.orElseThrow().productName()).isEqualTo("AI Inventory Ops");
        assertThat(fields.orElseThrow().businessStage()).isEqualTo("IDEA");
        assertThat(fields.orElseThrow().repositoryUrl()).isEqualTo("https://github.com/mahmoudashraf/easy-luxury");
        assertThat(fields.orElseThrow().assumptions()).containsExactly("Owner wants an AI-assisted productization path.");
        assertThat(fields.orElseThrow().missingEvidence()).containsExactly("Run scanner evidence collection.");
        assertThat(fields.orElseThrow().documentUsage()).hasSize(1);
        assertThat(fields.orElseThrow().documentUsage().get(0).status()).isEqualTo("USED");
        assertThat(fields.orElseThrow().documentUsage().get(0).accessMethod()).isEqualTo("TEMPORARY_URL");
        assertThat(fields.orElseThrow().documentUsage().get(0).evidence())
                .containsExactly("The document identifies Spring Boot and PostgreSQL.");
    }

    @Test
    void downgradesClaimedDocumentUsageWhenEvidenceIsMissing() throws Exception {
        AiAssistedProductCreationService service = new AiAssistedProductCreationService(
                mock(ProductProfileRepository.class),
                mock(ProductCreationIntentRepository.class),
                mock(ProductProjectAttachmentRepository.class),
                mock(ProductProjectAttachmentService.class),
                mock(LoomAIIntegrationService.class),
                mock(AuditService.class),
                new ObjectMapper()
        );
        LoomAIIntegrationService.AssistantQueryResponse response = new LoomAIIntegrationService.AssistantQueryResponse(
                "LOOMAI",
                "LIVE",
                false,
                "COMPLETE",
                "",
                """
                        {
                          "productName": "Orion Launch Auditor",
                          "summary": "Project creation attributes.",
                          "documentUsage": [
                            {
                              "fileName": "PROJECT_OVERVIEW.md",
                              "status": "USED",
                              "accessMethod": "TEMPORARY_URL",
                              "evidence": [],
                              "reason": "Document was accessed successfully."
                            }
                          ]
                        }
                        """,
                "conversation-1",
                0.0,
                List.of(),
                List.of(),
                List.of(),
                "COMPLETE",
                "rag-test"
        );

        Method parser = AiAssistedProductCreationService.class
                .getDeclaredMethod("parseFields", LoomAIIntegrationService.AssistantQueryResponse.class);
        parser.setAccessible(true);

        @SuppressWarnings("unchecked")
        Optional<AiAssistedProductCreationService.ProductCreationFields> fields =
                (Optional<AiAssistedProductCreationService.ProductCreationFields>) parser.invoke(service, response);

        assertThat(fields).isPresent();
        AiAssistedProductCreationService.DocumentUsageEvidence documentUsage =
                fields.orElseThrow().documentUsage().get(0);
        assertThat(documentUsage.status()).isEqualTo("NOT_USED");
        assertThat(documentUsage.accessMethod()).isEqualTo("NONE");
        assertThat(documentUsage.reason()).contains("did not return required owner-safe evidence");
        assertThat(documentUsage.reason()).contains("Original LoomAI reason: Document was accessed successfully.");
    }

    @Test
    void addsNotUsedEvidenceWhenLoomAiOmitsSelectedDocumentUsage() throws Exception {
        AiAssistedProductCreationService service = new AiAssistedProductCreationService(
                mock(ProductProfileRepository.class),
                mock(ProductCreationIntentRepository.class),
                mock(ProductProjectAttachmentRepository.class),
                mock(ProductProjectAttachmentService.class),
                mock(LoomAIIntegrationService.class),
                mock(AuditService.class),
                new ObjectMapper()
        );
        AiAssistedProductCreationService.ProductCreationFields fields =
                new AiAssistedProductCreationService.ProductCreationFields(
                        "Atlas Release Sentinel",
                        "Release readiness project.",
                        "VALIDATED",
                        "",
                        "",
                        "",
                        "",
                        "LoomAI analyzed owner input.",
                        List.of(),
                        List.of(),
                        List.of()
                );
        List<LoomAIIntegrationService.ProjectCreationDocumentReference> documents = List.of(
                new LoomAIIntegrationService.ProjectCreationDocumentReference(
                        UUID.randomUUID(),
                        "PROJECT_OVERVIEW.md",
                        "text/markdown",
                        128,
                        "https://produs-api.example/api/product-attachments/ai-access/pdoc_test",
                        LocalDateTime.now().plusMinutes(10),
                        "",
                        false,
                        false,
                        "temporary-url-only"
                )
        );

        Method method = AiAssistedProductCreationService.class
                .getDeclaredMethod("ensureDocumentUsage", AiAssistedProductCreationService.ProductCreationFields.class, List.class);
        method.setAccessible(true);

        AiAssistedProductCreationService.ProductCreationFields completed =
                (AiAssistedProductCreationService.ProductCreationFields) method.invoke(service, fields, documents);

        assertThat(completed.documentUsage()).hasSize(1);
        assertThat(completed.documentUsage().get(0).fileName()).isEqualTo("PROJECT_OVERVIEW.md");
        assertThat(completed.documentUsage().get(0).status()).isEqualTo("NOT_USED");
        assertThat(completed.documentUsage().get(0).reason()).contains("did not return document usage evidence");
        assertThat(completed.missingEvidence()).contains("Document PROJECT_OVERVIEW.md was not proven used by LoomAI.");
    }

    @Test
    void mergesPartialLoomAiFieldsWithOwnerProvidedIntake() throws Exception {
        AiAssistedProductCreationService service = new AiAssistedProductCreationService(
                mock(ProductProfileRepository.class),
                mock(ProductCreationIntentRepository.class),
                mock(ProductProjectAttachmentRepository.class),
                mock(ProductProjectAttachmentService.class),
                mock(LoomAIIntegrationService.class),
                mock(AuditService.class),
                new ObjectMapper()
        );
        AiAssistedProductCreationService.ProductCreationFields partialAiFields =
                new AiAssistedProductCreationService.ProductCreationFields(
                        "ProdUS",
                        "ProdUS helps owners productize prototypes.",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        List.of(),
                        List.of(),
                        List.of()
                );
        AiAssistedProductCreationService.ProductCreationFields ownerProvidedFields =
                new AiAssistedProductCreationService.ProductCreationFields(
                        "Owner fallback",
                        "Owner-provided productization brief.",
                        "PROTOTYPE",
                        "Next.js, Spring Boot, PostgreSQL",
                        "https://produs-staging.46.224.145.148.sslip.io/",
                        "https://github.com/mahmoudashraf/ProdUS",
                        "Scanner and production readiness evidence is incomplete.",
                        "Fallback summary",
                        List.of("Fallback assumption"),
                        List.of("Fallback evidence"),
                        List.of()
                );

        Method merger = AiAssistedProductCreationService.class
                .getDeclaredMethod(
                        "mergeFields",
                        AiAssistedProductCreationService.ProductCreationFields.class,
                        AiAssistedProductCreationService.ProductCreationFields.class
                );
        merger.setAccessible(true);

        AiAssistedProductCreationService.ProductCreationFields fields =
                (AiAssistedProductCreationService.ProductCreationFields) merger.invoke(
                        service,
                        partialAiFields,
                        ownerProvidedFields
                );

        assertThat(fields.productName()).isEqualTo("ProdUS");
        assertThat(fields.summary()).isEqualTo("ProdUS helps owners productize prototypes.");
        assertThat(fields.businessStage()).isEqualTo("PROTOTYPE");
        assertThat(fields.techStack()).isEqualTo("Next.js, Spring Boot, PostgreSQL");
        assertThat(fields.productUrl()).isEqualTo("https://produs-staging.46.224.145.148.sslip.io/");
        assertThat(fields.repositoryUrl()).isEqualTo("https://github.com/mahmoudashraf/ProdUS");
        assertThat(fields.riskProfile()).isEqualTo("Scanner and production readiness evidence is incomplete.");
        assertThat(fields.aiCreationSummary()).contains("LoomAI analyzed the owner intake");
        assertThat(fields.assumptions()).isEmpty();
        assertThat(fields.missingEvidence()).isEmpty();
        assertThat(fields.documentUsage()).isEmpty();
    }
}
