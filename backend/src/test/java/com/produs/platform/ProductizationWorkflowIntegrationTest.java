package com.produs.platform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.catalog.ServiceCategory;
import com.produs.catalog.ServiceCategoryRepository;
import com.produs.catalog.ServiceDependency;
import com.produs.catalog.ServiceDependencyRepository;
import com.produs.catalog.ServiceModule;
import com.produs.catalog.ServiceModuleRepository;
import com.produs.entity.User;
import com.produs.repository.UserRepository;
import com.produs.service.S3Service;
import com.produs.teams.Team;
import com.produs.teams.TeamCapability;
import com.produs.teams.TeamCapabilityRepository;
import com.produs.teams.TeamRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.HexFormat;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProductizationWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServiceCategoryRepository categoryRepository;

    @Autowired
    private ServiceModuleRepository moduleRepository;

    @Autowired
    private ServiceDependencyRepository dependencyRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TeamCapabilityRepository capabilityRepository;

    @MockBean
    private S3Service s3Service;

    @BeforeEach
    void mockObjectStorage() {
        when(s3Service.generateFileKey(anyString(), anyString()))
                .thenAnswer(invocation -> invocation.getArgument(0, String.class) + "/" + UUID.randomUUID() + ".txt");
        when(s3Service.uploadFile(anyString(), any(byte[].class), anyString()))
                .thenAnswer(invocation -> "https://storage.produs.test/produs/" + invocation.getArgument(0, String.class));
        when(s3Service.generatePresignedDownloadUrl(anyString()))
                .thenAnswer(invocation -> "https://storage.produs.test/signed/" + invocation.getArgument(0, String.class));
        doNothing().when(s3Service).deleteFile(anyString());
    }

    @Test
    void ownerCanRunProductizationWorkflowWithMockedPlatformData() throws Exception {
        User owner = saveUser("owner-workflow@produs.test", User.UserRole.PRODUCT_OWNER);
        User anotherOwner = saveUser("other-owner@produs.test", User.UserRole.PRODUCT_OWNER);
        User teamManager = saveUser("team-manager@produs.test", User.UserRole.TEAM_MANAGER);
        User specialist = saveUser("specialist@produs.test", User.UserRole.SPECIALIST);
        User admin = saveUser("admin-workflow@produs.test", User.UserRole.ADMIN);
        PlatformCatalog catalog = saveCatalog();
        Team recommendedTeam = saveRecommendedTeam(teamManager, catalog);

        mockMvc.perform(get("/api/catalog/dependencies").with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].sourceModule.id").value(catalog.launchReadiness().getId().toString()))
                .andExpect(jsonPath("$[0].dependsOnModule.id").value(catalog.securityReview().getId().toString()));

        mockMvc.perform(get("/api/catalog/dependencies")
                        .with(auth(owner))
                        .param("moduleId", catalog.launchReadiness().getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(post("/api/mcp/invocations")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "toolName": "produs.product.create",
                                  "requestId": "mcp-test-request",
                                  "targetType": "PRODUCT_PROFILE",
                                  "targetId": "pending",
                                  "inputHash": "sha256:test",
                                  "status": "SUCCEEDED",
                                  "backendStatus": 200
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.toolName").value("produs.product.create"))
                .andExpect(jsonPath("$.role").value("PRODUCT_OWNER"));

        mockMvc.perform(get("/api/mcp/invocations").with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].toolName").value("produs.product.create"));

        mockMvc.perform(get("/api/mcp/invocations").with(auth(anotherOwner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        mockMvc.perform(post("/api/teams/{id}/members", recommendedTeam.getId())
                        .with(auth(teamManager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "role": "SPECIALIST"
                                }
                                """.formatted(specialist.getEmail())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value(specialist.getEmail()))
                .andExpect(jsonPath("$.role").value("SPECIALIST"));

        mockMvc.perform(get("/api/teams/{id}/members", recommendedTeam.getId()).with(auth(specialist)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(get("/api/teams/{id}/members", recommendedTeam.getId()).with(auth(anotherOwner)))
                .andExpect(status().isForbidden());

        MvcResult productResult = mockMvc.perform(post("/api/products")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Inventory OS",
                                  "summary": "Operational inventory platform for local distributors",
                                  "businessStage": "PROTOTYPE",
                                  "techStack": "Next.js, Spring Boot, PostgreSQL",
                                  "riskProfile": "Needs launch governance and security readiness"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Request-ID"))
                .andExpect(jsonPath("$.name").value("Inventory OS"))
                .andReturn();
        UUID productId = readId(productResult);

        mockMvc.perform(get("/api/products/{id}", productId).with(auth(anotherOwner)))
                .andExpect(status().isForbidden());

        MvcResult requirementResult = mockMvc.perform(post("/api/requirements")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "productProfileId": "%s",
                                  "requestedServiceModuleId": "%s",
                                  "businessGoal": "Prepare the product for a controlled US launch",
                                  "currentProblems": "No delivery milestones or owner-ready evidence pack",
                                  "constraints": "Four week launch window",
                                  "riskSignals": "Security and operational readiness unknown",
                                  "requirementBrief": "Create launch readiness package",
                                  "status": "SUBMITTED"
                                }
                                """.formatted(productId, catalog.launchReadiness().getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andReturn();
        UUID requirementId = readId(requirementResult);

        MvcResult packageResult = mockMvc.perform(post("/api/packages/from-requirement/{id}", requirementId)
                        .with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("AWAITING_TEAM"))
                .andReturn();
        UUID packageId = readId(packageResult);

        mockMvc.perform(get("/api/packages/{id}/modules", packageId).with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].serviceModule.name").value("Launch Readiness"))
                .andExpect(jsonPath("$[1].serviceModule.name").value("Security Review"));

        mockMvc.perform(get("/api/packages/{id}/team-recommendations", packageId).with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].team.name").value("Launch Operations Team"))
                .andExpect(jsonPath("$[0].score").value(greaterThan(0.0)));

        mockMvc.perform(get("/api/ai/recommendations")
                        .with(auth(owner))
                        .param("sourceEntityType", "REQUIREMENT_INTAKE")
                        .param("sourceEntityId", requirementId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].recommendationType").value("PACKAGE_COMPOSITION"))
                .andExpect(jsonPath("$[0].promptVersion").value("rules-v1"))
                .andExpect(jsonPath("$[0].outputJson").value(containsString("RULES_FALLBACK")));

        MvcResult workspaceResult = mockMvc.perform(post("/api/workspaces")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "packageInstanceId": "%s",
                                  "name": "Inventory OS launch workspace",
                                  "status": "ACTIVE_DELIVERY"
                                }
                                """.formatted(packageId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Inventory OS launch workspace"))
                .andReturn();
        UUID workspaceId = readId(workspaceResult);

        mockMvc.perform(get("/api/workspaces/{id}/participants", workspaceId).with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].role").value("OWNER"));

        MvcResult proposalResult = mockMvc.perform(post("/api/commerce/packages/{id}/proposals", packageId)
                        .with(auth(teamManager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "teamId": "%s",
                                  "title": "Launch readiness delivery proposal",
                                  "scope": "Deliver launch readiness evidence, security notes, and owner handoff support.",
                                  "assumptions": "Owner provides repo and deployment access before kickoff.",
                                  "timelineDays": 21,
                                  "currency": "USD",
                                  "fixedPriceCents": 1250000,
                                  "platformFeeCents": 150000,
                                  "status": "SUBMITTED"
                                }
                                """.formatted(recommendedTeam.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.team.name").value("Launch Operations Team"))
                .andReturn();
        UUID proposalId = readId(proposalResult);

        mockMvc.perform(get("/api/notifications").with(auth(owner)).param("status", "UNREAD"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.type == 'PROPOSAL_SUBMITTED')]", hasSize(greaterThan(0))));

        mockMvc.perform(get("/api/commerce/packages/{id}/proposals", packageId).with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Launch readiness delivery proposal"));

        mockMvc.perform(get("/api/commerce/packages/{id}/proposals", packageId).with(auth(anotherOwner)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/commerce/proposals").with(auth(specialist)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(put("/api/commerce/proposals/{id}/status", proposalId)
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "status": "OWNER_ACCEPTED" }
                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OWNER_ACCEPTED"));

        mockMvc.perform(get("/api/notifications").with(auth(teamManager)).param("status", "UNREAD"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.type == 'PROPOSAL_STATUS_CHANGED')]", hasSize(greaterThan(0))));

        MvcResult contractResult = mockMvc.perform(post("/api/commerce/proposals/{id}/contract", proposalId)
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "workspaceId": "%s",
                                  "title": "Inventory OS launch delivery agreement",
                                  "terms": "Milestones require evidence-backed owner acceptance before payment release.",
                                  "effectiveOn": "2026-05-15",
                                  "status": "SENT"
                                }
                                """.formatted(workspaceId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SENT"))
                .andReturn();
        UUID contractId = readId(contractResult);

        String signaturePayload = """
                {
                  "provider": "mock-sign",
                  "eventId": "sig-event-001",
                  "eventType": "contract.completed",
                  "contractId": "%s",
                  "contractStatus": "SIGNED"
                }
                """.formatted(contractId);
        mockMvc.perform(post("/api/integrations/signatures/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-ProdUS-Signature", hmac(signaturePayload, "test-signature-webhook-secret"))
                        .content(signaturePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.processed").value(true))
                .andExpect(jsonPath("$.contractAgreement.status").value("SIGNED"))
                .andExpect(jsonPath("$.contractAgreement.signedAt").exists());

        MvcResult invoiceResult = mockMvc.perform(post("/api/commerce/contracts/{id}/invoices", contractId)
                        .with(auth(teamManager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "invoiceNumber": "INV-MOCK-001",
                                  "description": "Launch readiness kickoff invoice",
                                  "amountCents": 625000,
                                  "currency": "USD",
                                  "dueDate": "2026-05-22",
                                  "status": "ISSUED"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ISSUED"))
                .andReturn();
        UUID invoiceId = readId(invoiceResult);

        mockMvc.perform(get("/api/commerce/invoices").with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].invoiceNumber").value("INV-MOCK-001"));

        String paymentPayload = """
                {
                  "provider": "mock-pay",
                  "eventId": "pay-event-001",
                  "eventType": "invoice.payment_succeeded",
                  "invoiceNumber": "INV-MOCK-001",
                  "amountCents": 625000,
                  "currency": "USD",
                  "invoiceStatus": "PAID"
                }
                """;
        mockMvc.perform(post("/api/integrations/payments/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-ProdUS-Signature", "sha256=bad")
                        .content(paymentPayload))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/integrations/payments/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-ProdUS-Signature", hmac(paymentPayload, "test-payment-webhook-secret"))
                        .content(paymentPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.processed").value(true))
                .andExpect(jsonPath("$.invoice.status").value("PAID"));

        mockMvc.perform(get("/api/notifications/summary").with(auth(teamManager)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(greaterThan(0)))
                .andExpect(jsonPath("$.latest", hasSize(greaterThan(0))));

        mockMvc.perform(post("/api/integrations/payments/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-ProdUS-Signature", hmac(paymentPayload, "test-payment-webhook-secret"))
                        .content(paymentPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.processed").value(true))
                .andExpect(jsonPath("$.eventId").value("pay-event-001"));

        MvcResult supportSubscriptionResult = mockMvc.perform(post("/api/commerce/workspaces/{id}/support-subscriptions", workspaceId)
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "teamId": "%s",
                                  "planName": "Launch monitoring support",
                                  "sla": "Two business day response and monthly health report.",
                                  "monthlyAmountCents": 199000,
                                  "currency": "USD",
                                  "startsOn": "2026-06-01",
                                  "renewsOn": "2026-07-01",
                                  "status": "ACTIVE"
                                }
                                """.formatted(recommendedTeam.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andReturn();
        UUID supportSubscriptionId = readId(supportSubscriptionResult);

        MvcResult supportRequestResult = mockMvc.perform(post("/api/commerce/workspaces/{id}/support-requests", workspaceId)
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "supportSubscriptionId": "%s",
                                  "title": "Monitor launch week errors",
                                  "description": "Track post-launch failures and prepare owner report.",
                                  "priority": "HIGH",
                                  "dueOn": "2026-06-07"
                                }
                                """.formatted(supportSubscriptionId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andExpect(jsonPath("$.team.name").value("Launch Operations Team"))
                .andReturn();
        UUID supportRequestId = readId(supportRequestResult);

        mockMvc.perform(get("/api/commerce/workspaces/{id}/support-requests", workspaceId).with(auth(teamManager)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Monitor launch week errors"));

        mockMvc.perform(put("/api/commerce/support-requests/{id}/status", supportRequestId)
                        .with(auth(teamManager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "IN_PROGRESS",
                                  "resolution": "Launch week monitoring started."
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        mockMvc.perform(get("/api/notifications").with(auth(owner)).param("status", "UNREAD"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.type == 'SUPPORT_REQUEST_UPDATED')]", hasSize(greaterThan(0))));

        String overdueDate = LocalDate.now().minusDays(1).toString();
        mockMvc.perform(post("/api/commerce/workspaces/{id}/support-requests", workspaceId)
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "supportSubscriptionId": "%s",
                                  "title": "Escalate missed launch report",
                                  "description": "The weekly owner report is past the response due date.",
                                  "priority": "URGENT",
                                  "dueOn": "%s"
                                }
                                """.formatted(supportSubscriptionId, overdueDate)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slaStatus").value("OVERDUE"))
                .andExpect(jsonPath("$.escalationCount").value(0));

        mockMvc.perform(post("/api/commerce/support-requests/sla/run").with(auth(owner)))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/commerce/support-requests/sla/run").with(auth(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scannedCount").value(greaterThan(0)))
                .andExpect(jsonPath("$.escalatedCount").value(greaterThan(0)))
                .andExpect(jsonPath("$.updatedCount").value(greaterThan(0)));

        mockMvc.perform(get("/api/commerce/workspaces/{id}/support-requests", workspaceId).with(auth(teamManager)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.title == 'Escalate missed launch report' && @.slaStatus == 'ESCALATED')]", hasSize(1)))
                .andExpect(jsonPath("$[?(@.title == 'Escalate missed launch report' && @.escalationCount == 1)]", hasSize(1)));

        mockMvc.perform(get("/api/notifications").with(auth(teamManager)).param("status", "UNREAD"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.type == 'SUPPORT_REQUEST_SLA_ESCALATED')]", hasSize(greaterThan(0))));

        mockMvc.perform(post("/api/notifications/deliveries/dispatch").with(auth(owner)))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/notifications/deliveries/dispatch").with(auth(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scannedCount").value(greaterThan(0)))
                .andExpect(jsonPath("$.sentCount").value(greaterThan(0)));

        mockMvc.perform(get("/api/notifications/deliveries/config").with(auth(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailProvider").value("audit-log"))
                .andExpect(jsonPath("$.emailProviderConfigured").value(true))
                .andExpect(jsonPath("$.pushEnabled").value(false));

        mockMvc.perform(get("/api/notifications/deliveries").with(auth(admin)).param("status", "SENT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.channel == 'EMAIL' && @.status == 'SENT')]", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$[?(@.provider == 'audit-log')]", hasSize(greaterThan(0))));

        mockMvc.perform(put("/api/notifications/read-all").with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(0));

        mockMvc.perform(post("/api/commerce/teams/{id}/reputation", recommendedTeam.getId())
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "workspaceId": "%s",
                                  "eventType": "WORKSPACE_REVIEW",
                                  "rating": 5,
                                  "notes": "Evidence was structured and owner-ready."
                                }
                                """.formatted(workspaceId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true))
                .andExpect(jsonPath("$.rating").value(5));

        mockMvc.perform(get("/api/commerce/teams/{id}/reputation", recommendedTeam.getId()).with(auth(teamManager)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        MvcResult disputeResult = mockMvc.perform(post("/api/commerce/workspaces/{id}/disputes", workspaceId)
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "teamId": "%s",
                                  "title": "Milestone evidence needs review",
                                  "description": "Owner needs clearer acceptance evidence before release.",
                                  "severity": "HIGH",
                                  "responseDueOn": "2026-05-25"
                                }
                                """.formatted(recommendedTeam.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.severity").value("HIGH"))
                .andReturn();
        UUID disputeId = readId(disputeResult);

        MockMultipartFile disputeEvidence = new MockMultipartFile(
                "file",
                "dispute-response.txt",
                "text/plain",
                "Team response evidence for the dispute review".getBytes(StandardCharsets.UTF_8)
        );
        mockMvc.perform(multipart("/api/attachments")
                        .file(disputeEvidence)
                        .param("scopeType", "DISPUTE")
                        .param("scopeId", disputeId.toString())
                        .param("label", "Team response")
                        .with(auth(teamManager)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scopeType").value("DISPUTE"))
                .andExpect(jsonPath("$.fileName").value("dispute-response.txt"))
                .andExpect(jsonPath("$.uploadedBy.email").value(teamManager.getEmail()));

        mockMvc.perform(get("/api/commerce/workspaces/{id}/disputes", workspaceId).with(auth(teamManager)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(put("/api/commerce/disputes/{id}/status", disputeId)
                        .with(auth(teamManager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "RESOLVED",
                                  "resolution": "Team attached clearer evidence and owner accepted the remediation path."
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolution").value(containsString("owner accepted")));

        mockMvc.perform(post("/api/workspaces/{id}/participants", workspaceId)
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "role": "SPECIALIST"
                                }
                                """.formatted(specialist.getEmail())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value(specialist.getEmail()))
                .andExpect(jsonPath("$.role").value("SPECIALIST"));

        mockMvc.perform(get("/api/workspaces/{id}", workspaceId).with(auth(specialist)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Inventory OS launch workspace"));

        MvcResult milestonesResult = mockMvc.perform(get("/api/workspaces/{id}/milestones", workspaceId).with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].title").value("Launch Readiness"))
                .andReturn();
        UUID milestoneId = UUID.fromString(objectMapper.readTree(milestonesResult.getResponse().getContentAsString()).get(0).get("id").asText());

        mockMvc.perform(post("/api/workspaces/{id}/milestones", workspaceId)
                        .with(auth(specialist))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Specialist milestone should be blocked",
                                  "status": "PLANNED"
                                }
                                """))
                .andExpect(status().isForbidden());

        MvcResult deliverableResult = mockMvc.perform(post("/api/workspaces/milestones/{id}/deliverables", milestoneId)
                        .with(auth(specialist))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Launch readiness evidence pack",
                                  "evidence": "Mock evidence record for owner acceptance",
                                  "status": "SUBMITTED"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andReturn();
        UUID deliverableId = readId(deliverableResult);

        MockMultipartFile deliverableEvidence = new MockMultipartFile(
                "file",
                "launch-evidence.txt",
                "text/plain",
                "Launch readiness evidence pack contents".getBytes(StandardCharsets.UTF_8)
        );
        MvcResult attachmentResult = mockMvc.perform(multipart("/api/attachments")
                        .file(deliverableEvidence)
                        .param("scopeType", "DELIVERABLE")
                        .param("scopeId", deliverableId.toString())
                        .param("label", "Acceptance proof")
                        .with(auth(specialist)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scopeType").value("DELIVERABLE"))
                .andExpect(jsonPath("$.scopeId").value(deliverableId.toString()))
                .andExpect(jsonPath("$.fileName").value("launch-evidence.txt"))
                .andExpect(jsonPath("$.storageKey").doesNotExist())
                .andExpect(jsonPath("$.fileUrl").doesNotExist())
                .andReturn();
        UUID attachmentId = readId(attachmentResult);

        mockMvc.perform(get("/api/attachments")
                        .param("workspaceId", workspaceId.toString())
                        .with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        mockMvc.perform(get("/api/attachments/{id}/download-url", attachmentId).with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.downloadUrl").value(containsString("https://storage.produs.test/signed/evidence/deliverable")))
                .andExpect(jsonPath("$.expiresInSeconds").value(900));

        mockMvc.perform(get("/api/attachments/{id}/download-url", attachmentId).with(auth(anotherOwner)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/attachments")
                        .param("scopeType", "DELIVERABLE")
                        .param("scopeId", deliverableId.toString())
                        .with(auth(anotherOwner)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/attachments/{id}", attachmentId).with(auth(specialist)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/attachments")
                        .param("workspaceId", workspaceId.toString())
                        .with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(get("/api/workspaces/milestones/{id}/deliverables", milestoneId).with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Launch readiness evidence pack"));
    }

    private User saveUser(String email, User.UserRole role) {
        User user = new User();
        user.setEmail(email);
        user.setFirstName("Mock");
        user.setLastName("User");
        user.setRole(role);
        user.setSupabaseId("mock-" + email);
        return userRepository.save(user);
    }

    private PlatformCatalog saveCatalog() {
        ServiceCategory category = new ServiceCategory();
        category.setName("Product Operations");
        category.setSlug("product-operations");
        category.setDescription("Production launch and operating model services");
        category = categoryRepository.save(category);

        ServiceModule launchReadiness = new ServiceModule();
        launchReadiness.setCategory(category);
        launchReadiness.setName("Launch Readiness");
        launchReadiness.setSlug("launch-readiness-" + UUID.randomUUID());
        launchReadiness.setDescription("Owner-ready launch planning, milestones, and evidence");
        launchReadiness.setExpectedDeliverables("Launch plan, risk register, release milestones");
        launchReadiness.setAcceptanceCriteria("Owner can approve launch readiness evidence");
        launchReadiness = moduleRepository.save(launchReadiness);

        ServiceModule securityReview = new ServiceModule();
        securityReview.setCategory(category);
        securityReview.setName("Security Review");
        securityReview.setSlug("security-review-" + UUID.randomUUID());
        securityReview.setDescription("Security readiness check before production launch");
        securityReview.setExpectedDeliverables("Security notes and remediation decisions");
        securityReview.setAcceptanceCriteria("Critical launch risks are documented");
        securityReview = moduleRepository.save(securityReview);

        ServiceDependency dependency = new ServiceDependency();
        dependency.setSourceModule(launchReadiness);
        dependency.setDependsOnModule(securityReview);
        dependency.setReason("Launch readiness requires security review evidence");
        dependency.setRequired(true);
        dependencyRepository.save(dependency);

        return new PlatformCatalog(category, launchReadiness, securityReview);
    }

    private Team saveRecommendedTeam(User teamManager, PlatformCatalog catalog) {
        Team team = new Team();
        team.setManager(teamManager);
        team.setName("Launch Operations Team");
        team.setDescription("Specialist launch readiness and security review delivery team");
        team.setTimezone("America/New_York");
        team.setCapabilitiesSummary("Launch readiness, security review, milestone governance");
        team.setTypicalProjectSize("2-6 weeks");
        team.setVerificationStatus(Team.VerificationStatus.OPERATIONS_READY);
        team = teamRepository.save(team);

        TeamCapability capability = new TeamCapability();
        capability.setTeam(team);
        capability.setServiceCategory(catalog.category());
        capability.setServiceModule(catalog.launchReadiness());
        capability.setNotes("Delivered launch readiness operating packs and owner review cycles.");
        capabilityRepository.save(capability);
        return team;
    }

    private UUID readId(MvcResult result) throws Exception {
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return UUID.fromString(node.get("id").asText());
    }

    private String hmac(String payload, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return "sha256=" + HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
    }

    private RequestPostProcessor auth(User user) {
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                user,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
        return authentication(authenticationToken);
    }

    private record PlatformCatalog(ServiceCategory category, ServiceModule launchReadiness, ServiceModule securityReview) {}
}
