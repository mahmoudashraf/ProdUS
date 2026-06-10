package com.produs.product;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.ai.LoomAIIntegrationService;
import com.produs.cart.ProductizationCartService;
import com.produs.catalog.ServiceCategory;
import com.produs.catalog.ServiceModule;
import com.produs.catalog.ServiceModuleRepository;
import com.produs.scanner.ScanSourceRepository;
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
import static org.mockito.Mockito.when;

class AiAssistedProductCreationServiceTest {

    @Test
    void analysisModeSupportsFullAndAiOpportunitiesOnlyContract() {
        assertThat(AiAssistedProductCreationService.AnalysisMode.from("FULL_WITH_AI_OPPORTUNITIES"))
                .isEqualTo(AiAssistedProductCreationService.AnalysisMode.FULL_WITH_AI_OPPORTUNITIES);
        assertThat(AiAssistedProductCreationService.AnalysisMode.from("AI_OPPORTUNITIES"))
                .isEqualTo(AiAssistedProductCreationService.AnalysisMode.AI_OPPORTUNITIES);
        assertThat(AiAssistedProductCreationService.AnalysisMode.from("UNKNOWN_MODE"))
                .isEqualTo(AiAssistedProductCreationService.AnalysisMode.FULL_WITH_AI_OPPORTUNITIES);
        assertThat(AiAssistedProductCreationService.AnalysisMode.FULL_WITH_AI_OPPORTUNITIES.includesProjectAnalysis())
                .isTrue();
        assertThat(AiAssistedProductCreationService.AnalysisMode.AI_OPPORTUNITIES.includesProjectAnalysis())
                .isFalse();
        assertThat(AiAssistedProductCreationService.AnalysisMode.AI_OPPORTUNITIES.includesAiOpportunities())
                .isTrue();
    }

    @Test
    void aiOpportunityRefreshIntentResponseCanReturnProductIdWithoutLinkingIntent() {
        ProductCreationIntent intent = new ProductCreationIntent();
        intent.setStatus(ProductCreationIntent.Status.CREATED);
        intent.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        intent.setIdempotencyKey("refresh-idempotency-key");
        intent.setAnalysisProviderRequestId("provider-refresh-1");
        intent.setAiSourceAttachmentCount(2);
        UUID productId = UUID.randomUUID();

        AiAssistedProductCreationService.ProductCreationIntentResponse response =
                AiAssistedProductCreationService.ProductCreationIntentResponse.from(intent, null, productId);

        assertThat(response.productId()).isEqualTo(productId);
        assertThat(response.analysisProviderRequestId()).isEqualTo("provider-refresh-1");
        assertThat(response.aiSourceAttachmentCount()).isEqualTo(2);
        assertThat(intent.getProductProfile()).isNull();
    }

    @Test
    void trimsProviderMetadataBeforePersistingAnalysisIntent() throws Exception {
        AiAssistedProductCreationService service = service();
        ProductCreationIntent intent = new ProductCreationIntent();
        intent.setOwnerMessage("Refresh the existing product brief.");

        AiAssistedProductCreationService.ProductCreationFields fields =
                new AiAssistedProductCreationService.ProductCreationFields(
                        "Atlas Release Sentinel",
                        "Release readiness project.",
                        "A release readiness project for owner-governed production checks.",
                        "The owner needs reliable launch evidence.",
                        "Product owners and delivery teams.",
                        "VALIDATED",
                        "Next.js, Spring Boot, PostgreSQL",
                        "https://atlas.example.com",
                        "https://github.com/example/atlas",
                        "Needs scanner proof.",
                        "LoomAI analyzed owner input.",
                        List.of("Readiness diagnosis"),
                        List.of("Confident launch decision"),
                        List.of("Evidence-backed launch gate"),
                        List.of("Launch Readiness"),
                        List.of(),
                        List.of(),
                        List.of("Security and deployment checks"),
                        List.of("Create the workspace"),
                        List.of("Owner brief names launch readiness"),
                        List.of(),
                        List.of(),
                        List.of()
                );
        String longProviderRequestId = "provider-" + "x".repeat(260);
        String longFallbackReason = "fallback-" + "y".repeat(260);
        LoomAIIntegrationService.AssistantQueryResponse assistant =
                new LoomAIIntegrationService.AssistantQueryResponse(
                        "LOOMAI",
                        "LIVE",
                        true,
                        "INFORMATION_PROVIDED",
                        "{}",
                        "Live AI analysis completed.",
                        "conversation",
                        0.82,
                        List.of(),
                        List.of(),
                        List.of(),
                        longFallbackReason,
                        longProviderRequestId
                );

        Method method = AiAssistedProductCreationService.class.getDeclaredMethod(
                "applyAnalysis",
                ProductCreationIntent.class,
                AiAssistedProductCreationService.ProductCreationFields.class,
                LoomAIIntegrationService.AssistantQueryResponse.class,
                int.class
        );
        method.setAccessible(true);
        method.invoke(service, intent, fields, assistant, 0);

        assertThat(intent.getAnalysisProviderRequestId()).hasSize(180);
        assertThat(intent.getAnalysisFallbackReason()).hasSize(180);
    }

    @Test
    void normalizesLoomAiCapabilityCodesWhenProviderReturnsLabelsOnly() throws Exception {
        AiAssistedProductCreationService service = service();
        LoomAIIntegrationService.AssistantQueryResponse response = new LoomAIIntegrationService.AssistantQueryResponse(
                "LOOMAI",
                "LIVE",
                true,
                "INFORMATION_PROVIDED",
                """
                        {
                          "status": "READY",
                          "summary": "LoomAI opportunities are available.",
                          "opportunityScore": 0.8,
                          "confidence": 0.7,
                          "strategicRationale": "Use LoomAI where it improves owner decisions.",
                          "useCases": [
                            {
                              "title": "Production-readiness copilot",
                              "workflow": "Owner questions during diagnosis.",
                              "userValue": "Owners understand blockers.",
                              "businessValue": "Shortens discovery.",
                              "loomaiCapability": "LoomAI backend-mediated private runtime with read-only ProdUS context.",
                              "integrationPattern": "BACKEND_MEDIATED_PRIVATE_RUNTIME",
                              "priority": "MUST",
                              "confidence": 0.74,
                              "evidenceBasis": ["Repository URL provided"],
                              "recommendedServiceModules": []
                            },
                            {
                              "title": "Scanner finding explainer",
                              "workflow": "Summarize findings through MCP-backed read actions.",
                              "userValue": "Owners see what findings mean.",
                              "businessValue": "Improves conversion.",
                              "loomaiCapability": "LoomAI query-once or analysis chat grounded by product, scan, finding, and evidence context.",
                              "integrationPattern": "READ_ONLY_CONTEXT_AND_MCP_ACTIONS",
                              "priority": "SHOULD",
                              "confidence": 0.68,
                              "evidenceBasis": [],
                              "recommendedServiceModules": []
                            }
                          ]
                        }
                        """,
                "",
                "conversation-1",
                0.7,
                List.of(),
                List.of(),
                List.of(),
                "",
                "rag-test"
        );

        Method parser = AiAssistedProductCreationService.class
                .getDeclaredMethod("parseAiOpportunityReport", LoomAIIntegrationService.AssistantQueryResponse.class);
        parser.setAccessible(true);

        @SuppressWarnings("unchecked")
        Optional<AiAssistedProductCreationService.AiOpportunityReport> report =
                (Optional<AiAssistedProductCreationService.AiOpportunityReport>) parser.invoke(service, response);

        assertThat(report).isPresent();
        assertThat(report.orElseThrow().useCases())
                .extracting(AiAssistedProductCreationService.AiOpportunityUseCase::loomaiCapabilityCode)
                .containsExactly("loomai_runtime_auth_assignment", "loomai_tool_mcp_orchestration");
    }

    @Test
    void keepsConciseTextOpportunitiesFromSuccessfulLoomAiResult() throws Exception {
        AiAssistedProductCreationService service = service();
        LoomAIIntegrationService.AssistantQueryResponse response = new LoomAIIntegrationService.AssistantQueryResponse(
                "LOOMAI",
                "thinker",
                true,
                "INFORMATION_PROVIDED",
                """
                        {
                          "status": "REVIEW",
                          "summary": "Business AI opportunities are available for owner review.",
                          "useCases": [
                            "Explain launch blockers in owner language",
                            "Suggest the next service plan from current evidence"
                          ],
                          "suggestedNextSteps": ["Review the opportunities with the product owner"]
                        }
                        """,
                "",
                "conversation-1",
                0.6,
                List.of(),
                List.of(),
                List.of(),
                "",
                "rag-test"
        );

        Method parser = AiAssistedProductCreationService.class
                .getDeclaredMethod("parseAiOpportunityReport", LoomAIIntegrationService.AssistantQueryResponse.class);
        parser.setAccessible(true);

        @SuppressWarnings("unchecked")
        Optional<AiAssistedProductCreationService.AiOpportunityReport> report =
                (Optional<AiAssistedProductCreationService.AiOpportunityReport>) parser.invoke(service, response);

        assertThat(report).isPresent();
        assertThat(report.orElseThrow().live()).isTrue();
        assertThat(report.orElseThrow().useCases())
                .extracting(AiAssistedProductCreationService.AiOpportunityUseCase::title)
                .containsExactly(
                        "Explain launch blockers in owner language",
                        "Suggest the next service plan from current evidence"
                );
        assertThat(report.orElseThrow().useCases())
                .extracting(AiAssistedProductCreationService.AiOpportunityUseCase::priority)
                .containsExactly("COULD", "COULD");
    }

    @Test
    void derivesLoomAiOverviewFromLiveOpportunityReportWhenOverviewCallFails() throws Exception {
        AiAssistedProductCreationService service = service();
        AiAssistedProductCreationService.AiOpportunityReport report =
                new AiAssistedProductCreationService.AiOpportunityReport(
                        "REVIEW",
                        "AI opportunities are available for owner review.",
                        0.72,
                        0.66,
                        "Start with owner-visible AI value.",
                        List.of(
                                new AiAssistedProductCreationService.AiOpportunityUseCase(
                                        "Founder inbox triage",
                                        "Sort inbound requests.",
                                        "Owners know what needs attention first.",
                                        "Reduces manual review time.",
                                        "",
                                        "",
                                        "BACKEND_MEDIATED_PRIVATE_RUNTIME",
                                        "SHOULD",
                                        0.74,
                                        List.of("Owner described manual triage."),
                                        List.of()
                                )
                        ),
                        List.of(),
                        List.of(),
                        List.of(),
                        List.of("Validate with two owners before implementation."),
                        List.of("Live LoomAI opportunity report returned one owner-facing use case."),
                        List.of(),
                        List.of("Missing uploaded support tickets."),
                        "LOOMAI",
                        "opportunity-trace-1",
                        true
                );
        LoomAIIntegrationService.AssistantQueryResponse failedOverview = new LoomAIIntegrationService.AssistantQueryResponse(
                "LOOMAI",
                "ERROR",
                false,
                "OUT_OF_SCOPE",
                "",
                "The overview request could not be completed.",
                "conversation-2",
                0.0,
                List.of(),
                List.of(),
                List.of(),
                "OUT_OF_SCOPE",
                "overview-trace-1"
        );

        Method overviewMethod = AiAssistedProductCreationService.class
                .getDeclaredMethod(
                        "derivedLoomAIOverview",
                        AiAssistedProductCreationService.AiOpportunityReport.class,
                        LoomAIIntegrationService.AssistantQueryResponse.class
                );
        overviewMethod.setAccessible(true);

        AiAssistedProductCreationService.LoomAIIntegrationOverview overview =
                (AiAssistedProductCreationService.LoomAIIntegrationOverview) overviewMethod.invoke(service, report, failedOverview);

        assertThat(overview.live()).isTrue();
        assertThat(overview.provider()).isEqualTo("LOOMAI");
        assertThat(overview.providerRequestId()).isEqualTo("opportunity-trace-1");
        assertThat(overview.summary()).contains("Founder inbox triage");
        assertThat(overview.recommendedStartingPoint()).contains("Founder inbox triage");
        assertThat(overview.capabilities()).contains("AI support for Founder inbox triage");
        assertThat(overview.risks()).contains("This integration view is derived from the live AI opportunity result.");
        assertThat(overview.sourceInsights()).contains("LoomAI integration overview derived from live AI opportunity report opportunity-trace-1.");
    }

    @Test
    void actionRequestParsesDocumentUsageForCreationGuard() {
        AiAssistedProductCreationService.ProductCreationActionRequest request =
                AiAssistedProductCreationService.ProductCreationActionRequest.from(Map.of(
                        "analysisMode", "FULL_WITH_AI_OPPORTUNITIES",
                        "documentUsage", List.of(Map.of(
                                "documentId", "doc-project-overview",
                                "fileName", "PROJECT_OVERVIEW.md",
                                "status", "USED",
                                "accessMethod", "TEMPORARY_URL",
                                "evidence", List.of("Document identifies Spring Boot and PostgreSQL."),
                                "reason", "Temporary URL opened and parsed."
                        ))
                ));

        assertThat(request.documentUsage()).hasSize(1);
        assertThat(request.documentUsage().get(0).documentId()).isEqualTo("doc-project-overview");
        assertThat(request.documentUsage().get(0).status()).isEqualTo("USED");
        assertThat(request.documentUsage().get(0).accessMethod()).isEqualTo("TEMPORARY_URL");
        assertThat(request.documentUsage().get(0).evidence())
                .containsExactly("Document identifies Spring Boot and PostgreSQL.");
    }

    @Test
    void parsesProjectCreationFieldsFromLoomAiActionParameters() throws Exception {
        AiAssistedProductCreationService service = service();
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
                                "summary", "Initial product attributes for production readiness.",
                                "businessStage", "IDEA",
                                "techStack", "Next.js, Spring Boot, PostgreSQL",
                                "repositoryUrl", "https://github.com/mahmoudashraf/easy-luxury",
                                "riskProfile", "Deployment evidence and database migration proof are missing.",
                                "aiCreationSummary", "AI-assisted analysis prepared the initial product attributes.",
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
        AiAssistedProductCreationService service = service();
        LoomAIIntegrationService.AssistantQueryResponse response = new LoomAIIntegrationService.AssistantQueryResponse(
                "LOOMAI",
                "LIVE",
                false,
                "COMPLETE",
                "",
                """
                        {
                          "productName": "Orion Launch Auditor",
                          "summary": "Product creation attributes.",
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
        AiAssistedProductCreationService service = service();
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
        AiAssistedProductCreationService service = service();
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
                        List.of(),
                        List.of(),
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
        AiAssistedProductCreationService service = service();
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
                        List.of(),
                        List.of(),
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

        assertThat(fields.productName()).isEqualTo("Owner fallback");
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

    @Test
    void validatesCatalogBackedServiceRecommendationsBeforeCreationPayload() throws Exception {
        ServiceModuleRepository moduleRepository = mock(ServiceModuleRepository.class);
        ServiceCategory security = new ServiceCategory();
        security.setName("Security");
        security.setSlug("security");
        ServiceModule apiReview = new ServiceModule();
        apiReview.setName("API security review");
        apiReview.setSlug("api-security-review");
        apiReview.setStableCode("security.api_review");
        apiReview.setCategory(security);
        apiReview.setOwnerOutcome("API risk is understood before launch.");
        when(moduleRepository.findByStableCode("security.api_review")).thenReturn(Optional.of(apiReview));
        when(moduleRepository.findByStableCode("imaginary.audit")).thenReturn(Optional.empty());
        when(moduleRepository.findBySlug("imaginary.audit")).thenReturn(Optional.empty());
        when(moduleRepository.findByActiveTrueAndVisibleTrueOrderBySortOrderAscNameAsc()).thenReturn(List.of(apiReview));

        AiAssistedProductCreationService service = service(moduleRepository);
        AiAssistedProductCreationService.ProductCreationFields fields =
                new AiAssistedProductCreationService.ProductCreationFields(
                        "ProdUS Launch",
                        "Owner wants production readiness.",
                        "Productization project.",
                        "Launch readiness is unclear.",
                        "Startup product owner.",
                        "PROTOTYPE",
                        "Spring Boot, Next.js",
                        "",
                        "https://github.com/mahmoudashraf/ProdUS",
                        "",
                        "LoomAI analyzed the intake.",
                        List.of(),
                        List.of(),
                        List.of(),
                        List.of("Free text validation"),
                        List.of(
                                new AiAssistedProductCreationService.ServiceModuleRecommendation(
                                        "security.api_review",
                                        "Security API Review",
                                        "",
                                        "must",
                                        4,
                                        "",
                                        List.of("Repository URL provided"),
                                        "",
                                        0.82,
                                        true
                                ),
                                new AiAssistedProductCreationService.ServiceModuleRecommendation(
                                        "imaginary.audit",
                                        "Imaginary audit",
                                        "",
                                        "SHOULD",
                                        5,
                                        "AI invented a module.",
                                        List.of(),
                                        "",
                                        0.6,
                                        true
                                )
                        ),
                        List.of(),
                        List.of(),
                        List.of(),
                        List.of(),
                        List.of(),
                        List.of(),
                        List.of()
                );

        Method validator = AiAssistedProductCreationService.class
                .getDeclaredMethod("validateCatalogBackedServiceRecommendations", AiAssistedProductCreationService.ProductCreationFields.class);
        validator.setAccessible(true);

        AiAssistedProductCreationService.ProductCreationFields validated =
                (AiAssistedProductCreationService.ProductCreationFields) validator.invoke(service, fields);

        assertThat(validated.recommendedServiceModules()).hasSize(1);
        assertThat(validated.recommendedServiceModules().get(0).moduleCode()).isEqualTo("security.api_review");
        assertThat(validated.recommendedServiceModules().get(0).moduleName()).isEqualTo("API security review");
        assertThat(validated.recommendedServiceModules().get(0).categorySlug()).isEqualTo("security");
        assertThat(validated.recommendedServiceModules().get(0).priority()).isEqualTo("MUST");
        assertThat(validated.recommendedServices()).contains("API security review");
        assertThat(validated.missingCatalogCoverage()).hasSize(1);
        assertThat(validated.missingCatalogCoverage().get(0).need()).isEqualTo("Imaginary audit");
    }

    private AiAssistedProductCreationService service() {
        return service(mock(ServiceModuleRepository.class));
    }

    private AiAssistedProductCreationService service(ServiceModuleRepository serviceModuleRepository) {
        return new AiAssistedProductCreationService(
                mock(ProductProfileRepository.class),
                mock(ProductCreationIntentRepository.class),
                mock(ProductProjectAttachmentRepository.class),
                mock(ProductProjectIntelligenceRepository.class),
                mock(ProductServiceRecommendationRepository.class),
                mock(ProductScannerRecommendationRepository.class),
                mock(ProductReadinessTaskRepository.class),
                mock(ProductProjectAttachmentService.class),
                mock(LoomAIIntegrationService.class),
                serviceModuleRepository,
                mock(ProductizationCartService.class),
                mock(ScanSourceRepository.class),
                mock(AuditService.class),
                new ObjectMapper(),
                mock(TransactionTemplate.class)
        );
    }
}
