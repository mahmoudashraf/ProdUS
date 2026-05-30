package com.produs.product;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.ai.LoomAIIntegrationService;
import com.produs.service.AuditService;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionTemplate;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class AiAssistedProductCreationServiceTest {

    @Test
    void parsesProjectCreationFieldsFromLoomAiActionParameters() throws Exception {
        AiAssistedProductCreationService service = new AiAssistedProductCreationService(
                mock(ProductProfileRepository.class),
                mock(ProductCreationIntentRepository.class),
                mock(ProductProjectAttachmentRepository.class),
                mock(ProductProjectAttachmentService.class),
                mock(LoomAIIntegrationService.class),
                mock(AuditService.class),
                new ObjectMapper(),
                mock(TransactionTemplate.class)
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
                                        "documentId", "doc-project-overview",
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
        assertThat(fields.orElseThrow().documentUsage().get(0).documentId()).isEqualTo("doc-project-overview");
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
                new ObjectMapper(),
                mock(TransactionTemplate.class)
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
                              "documentId": "doc-project-overview",
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
    void parsesNeutralOwnerIntakeAnalysisFields() throws Exception {
        AiAssistedProductCreationService service = new AiAssistedProductCreationService(
                mock(ProductProfileRepository.class),
                mock(ProductCreationIntentRepository.class),
                mock(ProductProjectAttachmentRepository.class),
                mock(ProductProjectAttachmentService.class),
                mock(LoomAIIntegrationService.class),
                mock(AuditService.class),
                new ObjectMapper(),
                mock(TransactionTemplate.class)
        );
        LoomAIIntegrationService.AssistantQueryResponse response = new LoomAIIntegrationService.AssistantQueryResponse(
                "LOOMAI",
                "LIVE",
                true,
                "INFORMATION_PROVIDED",
                "",
                """
                        {
                          "draftName": "Matchly Evidence Router",
                          "outcomeSummary": "Routes owner evidence into a production-readiness workspace.",
                          "stage": "PROTOTYPE",
                          "stack": "Next.js 15, Spring Boot 3, PostgreSQL",
                          "productUrl": "https://produs-staging.46.224.145.148.sslip.io/",
                          "repositoryUrl": "https://github.com/mahmoudashraf/ProdUS",
                          "riskNotes": "CI evidence and deployment runbook are missing.",
                          "analysisSummary": "Temporary document URL was opened and used for intake analysis.",
                          "assumptions": ["Owner wants production-readiness workflow support."],
                          "missingEvidence": [],
                          "documentUsage": [
                            {
                              "documentId": "doc-project-overview",
                              "fileName": "PROJECT_OVERVIEW.md",
                              "status": "USED",
                              "accessMethod": "TEMPORARY_URL",
                              "evidence": ["The document names Next.js 15 and Spring Boot 3."],
                              "reason": "Temporary URL opened and parsed successfully."
                            }
                          ]
                        }
                        """,
                "conversation-1",
                0.0,
                List.of(),
                List.of(),
                List.of(),
                "",
                "rag-test"
        );

        Method parser = AiAssistedProductCreationService.class
                .getDeclaredMethod("parseFields", LoomAIIntegrationService.AssistantQueryResponse.class);
        parser.setAccessible(true);

        @SuppressWarnings("unchecked")
        Optional<AiAssistedProductCreationService.ProductCreationFields> fields =
                (Optional<AiAssistedProductCreationService.ProductCreationFields>) parser.invoke(service, response);

        assertThat(fields).isPresent();
        assertThat(fields.orElseThrow().productName()).isEqualTo("Matchly Evidence Router");
        assertThat(fields.orElseThrow().summary()).contains("production-readiness workspace");
        assertThat(fields.orElseThrow().businessStage()).isEqualTo("PROTOTYPE");
        assertThat(fields.orElseThrow().techStack()).contains("Spring Boot 3");
        assertThat(fields.orElseThrow().riskProfile()).contains("deployment runbook");
        assertThat(fields.orElseThrow().aiCreationSummary()).contains("Temporary document URL");
        assertThat(fields.orElseThrow().documentUsage().get(0).status()).isEqualTo("USED");
        assertThat(fields.orElseThrow().documentUsage().get(0).evidence())
                .containsExactly("The document names Next.js 15 and Spring Boot 3.");
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
                new ObjectMapper(),
                mock(TransactionTemplate.class)
        );
        AiAssistedProductCreationService.ProductCreationFields fields =
                new AiAssistedProductCreationService.ProductCreationFields(
                        "Atlas Release Sentinel",
                        "Release readiness project.",
                        "A release readiness project for owner-governed production checks.",
                        "The owner needs reliable launch evidence.",
                        "Product owners and delivery teams.",
                        "VALIDATED",
                        "",
                        "",
                        "",
                        "",
                        "LoomAI analyzed owner input.",
                        List.of("Readiness diagnosis"),
                        List.of("Confident launch decision"),
                        List.of("Evidence-backed launch gate"),
                        List.of("Launch Readiness"),
                        List.of("Security and deployment checks"),
                        List.of("Create the workspace"),
                        List.of("Owner brief names launch readiness"),
                        List.of(),
                        List.of(),
                        List.of()
                );
        List<LoomAIIntegrationService.ProjectCreationDocumentReference> documents = List.of(
                new LoomAIIntegrationService.ProjectCreationDocumentReference(
                        "doc-project-overview",
                        UUID.randomUUID(),
                        "PROJECT_OVERVIEW.md",
                        "text/markdown",
                        128,
                        "https://produs-api.example/api/product-attachments/ai-access/pdoc_test",
                        LocalDateTime.now().plusMinutes(10),
                        "temporary-url-only"
                )
        );

        Method method = AiAssistedProductCreationService.class
                .getDeclaredMethod("ensureDocumentUsage", AiAssistedProductCreationService.ProductCreationFields.class, List.class);
        method.setAccessible(true);

        AiAssistedProductCreationService.ProductCreationFields completed =
                (AiAssistedProductCreationService.ProductCreationFields) method.invoke(service, fields, documents);

        assertThat(completed.documentUsage()).hasSize(1);
        assertThat(completed.documentUsage().get(0).documentId()).isEqualTo("doc-project-overview");
        assertThat(completed.documentUsage().get(0).fileName()).isEqualTo("PROJECT_OVERVIEW.md");
        assertThat(completed.documentUsage().get(0).status()).isEqualTo("NOT_USED");
        assertThat(completed.documentUsage().get(0).reason()).contains("did not return document usage evidence");
        assertThat(completed.missingEvidence()).contains("Document PROJECT_OVERVIEW.md was not proven used by LoomAI.");
        assertThat(completed.aiCreationSummary()).contains("did not return owner-safe evidence");
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
                new ObjectMapper(),
                mock(TransactionTemplate.class)
        );
        AiAssistedProductCreationService.ProductCreationFields partialAiFields =
                new AiAssistedProductCreationService.ProductCreationFields(
                        "ProdUS",
                        "ProdUS helps owners productize prototypes.",
                        "ProdUS turns project context into production readiness plans.",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        List.of("AI intake analysis"),
                        List.of("Clear owner decision"),
                        List.of(),
                        List.of("Validation"),
                        List.of(),
                        List.of(),
                        List.of("AI read the owner brief"),
                        List.of(),
                        List.of(),
                        List.of()
                );
        AiAssistedProductCreationService.ProductCreationFields ownerProvidedFields =
                new AiAssistedProductCreationService.ProductCreationFields(
                        "Owner fallback",
                        "Owner-provided productization brief.",
                        "Owner fallback description.",
                        "Owner fallback problem.",
                        "Owner fallback users.",
                        "PROTOTYPE",
                        "Next.js, Spring Boot, PostgreSQL",
                        "https://produs-staging.46.224.145.148.sslip.io/",
                        "https://github.com/mahmoudashraf/ProdUS",
                        "Scanner and production readiness evidence is incomplete.",
                        "Fallback summary",
                        List.of("Fallback capability"),
                        List.of("Fallback outcome"),
                        List.of("Fallback readiness"),
                        List.of("Fallback service"),
                        List.of("Fallback scanner"),
                        List.of("Fallback next step"),
                        List.of("Fallback source"),
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
