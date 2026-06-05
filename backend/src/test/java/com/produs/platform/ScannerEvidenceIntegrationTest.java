package com.produs.platform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.catalog.CatalogCoreSeedService;
import com.produs.catalog.ServiceModule;
import com.produs.catalog.ServiceModuleRepository;
import com.produs.entity.User;
import com.produs.packages.PackageInstance;
import com.produs.packages.PackageInstanceRepository;
import com.produs.packages.PackageModule;
import com.produs.packages.PackageModuleRepository;
import com.produs.product.ProductProfile;
import com.produs.product.ProductProfileRepository;
import com.produs.repository.UserRepository;
import com.produs.scanner.ScannerProperties;
import com.produs.scanner.ScannerWorker;
import com.produs.service.S3Service;
import com.produs.workspace.Milestone;
import com.produs.workspace.MilestoneRepository;
import com.produs.workspace.ProjectWorkspace;
import com.produs.workspace.ProjectWorkspaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.HexFormat;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "app.scanner.providers.github.enabled=true",
        "app.scanner.providers.github.app-id=test-github-app",
        "app.scanner.providers.github.client-id=test-github-client",
        "app.scanner.providers.github.client-secret=test-github-secret",
        "app.scanner.providers.github.webhook-secret=test-github-webhook-secret",
        "app.scanner.providers.github.install-url=https://github.com/apps/produs-test/installations/new",
        "app.scanner.providers.github.callback-url=http://localhost:8080/api/scanner/connectors/github/callback",
        "app.scanner.providers.gitlab.enabled=true",
        "app.scanner.providers.gitlab.client-id=test-gitlab-client",
        "app.scanner.providers.gitlab.client-secret=test-gitlab-secret",
        "app.scanner.providers.gitlab.redirect-uri=http://localhost:8080/api/scanner/connectors/gitlab/callback",
        "app.scanner.providers.gitlab.webhook-secret=test-gitlab-webhook-secret",
        "app.scanner.providers.gitlab.base-url=https://gitlab.com"
})
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class ScannerEvidenceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductProfileRepository productProfileRepository;

    @Autowired
    private ServiceModuleRepository serviceModuleRepository;

    @Autowired
    private PackageInstanceRepository packageInstanceRepository;

    @Autowired
    private PackageModuleRepository packageModuleRepository;

    @Autowired
    private ProjectWorkspaceRepository workspaceRepository;

    @Autowired
    private MilestoneRepository milestoneRepository;

    @Autowired
    private ScannerWorker scannerWorker;

    @Autowired
    private ScannerProperties scannerProperties;

    @Autowired
    private CatalogCoreSeedService catalogCoreSeedService;

    @MockBean
    private S3Service s3Service;

    @BeforeEach
    void mockObjectStorage() {
        catalogCoreSeedService.seedCoreCatalog();
        when(s3Service.generateFileKey(anyString(), anyString()))
                .thenAnswer(invocation -> invocation.getArgument(0, String.class) + "/" + UUID.randomUUID() + ".sarif");
        when(s3Service.uploadFile(anyString(), any(byte[].class), anyString()))
                .thenAnswer(invocation -> "https://storage.produs.test/produs/" + invocation.getArgument(0, String.class));
        when(s3Service.generatePresignedDownloadUrl(anyString()))
                .thenAnswer(invocation -> "https://storage.produs.test/signed/" + invocation.getArgument(0, String.class));
        doNothing().when(s3Service).deleteFile(anyString());
    }

    @Test
    void ciEvidenceUploadNormalizesSarifRedactsSecretsAndGatesRiskAcceptance() throws Exception {
        User owner = saveUser("scanner-owner@produs.test", User.UserRole.PRODUCT_OWNER);
        UUID productId = createProduct(owner);

        MvcResult sourceResult = mockMvc.perform(post("/api/scanner/sources")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "productId": "%s",
                                  "providerType": "GITHUB",
                                  "displayName": "GitHub Security Pipeline",
                                  "externalReference": "https://github.com/acme/payments"
                                }
                                """.formatted(productId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authorizationStatus").value("AUTHORIZED"))
                .andReturn();
        UUID sourceId = readId(sourceResult);

        String sarif = """
                {
                  "version": "2.1.0",
                  "runs": [{
                    "tool": {
                      "driver": {
                        "name": "CodeQL",
                        "rules": [{
                          "id": "js/hardcoded-credentials",
                          "properties": { "security-severity": "9.1" }
                        }]
                      }
                    },
                    "results": [{
                      "ruleId": "js/hardcoded-credentials",
                      "level": "error",
                      "message": {
                        "text": "Hardcoded API key sk_live_123456789abcdef detected in configuration"
                      },
                      "locations": [{
                        "physicalLocation": {
                          "artifactLocation": { "uri": "src/config.ts" },
                          "region": { "startLine": 12 }
                        }
                      }]
                    }]
                  }]
                }
                """;

        MvcResult runResult = mockMvc.perform(post("/api/scanner/runs/ci-upload")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", productId.toString(),
                                "sourceId", sourceId.toString(),
                                "toolName", "CodeQL",
                                "toolVersion", "2.17.0",
                                "format", "SARIF",
                                "artifactFileName", "codeql.sarif",
                                "artifactPayload", sarif
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.toolRuns[0].normalizedCount").value(1))
                .andReturn();
        UUID runId = readId(runResult);

        MvcResult findingsResult = mockMvc.perform(get("/api/scanner/runs/{runId}/findings", runId).with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].severity").value("CRITICAL"))
                .andExpect(jsonPath("$[0].description", not(containsString("sk_live"))))
                .andExpect(jsonPath("$[0].description").value(containsString("[REDACTED_SECRET]")))
                .andExpect(jsonPath("$[0].evidenceItemId").exists())
                .andExpect(jsonPath("$[0].findingCategory").value("SECRET_EXPOSURE"))
                .andExpect(jsonPath("$[0].readinessArea").value("Security and secrets"))
                .andExpect(jsonPath("$[0].mappingSource").value("RULE_BASED_SCANNER_CATALOG"))
                .andReturn();
        UUID findingId = UUID.fromString(objectMapper.readTree(findingsResult.getResponse().getContentAsString()).get(0).get("id").asText());

        mockMvc.perform(get("/api/productization-engine/products/{productId}/diagnoses", productId).with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].diagnosisSource").value("SCANNER_READINESS"))
                .andExpect(jsonPath("$[0].generatedFromScanRunIds").value(runId.toString()))
                .andExpect(jsonPath("$[0].topBlockerCount").value(1))
                .andExpect(jsonPath("$[0].findings[0].recommendedModuleCode").value("security.secrets_scan"))
                .andExpect(jsonPath("$[0].findings[0].businessRisk").value(containsString("credential")));

        mockMvc.perform(get("/api/scanner/products/{productId}/summary", productId).with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.counts.total").value(1))
                .andExpect(jsonPath("$.counts.critical").value(1))
                .andExpect(jsonPath("$.recentRuns[0].status").value("COMPLETED"))
                .andExpect(jsonPath("$.evidence[0].redactionStatus").value("REDACTED"));

        mockMvc.perform(patch("/api/scanner/findings/{findingId}/status", findingId)
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "status": "ACCEPTED_RISK", "reason": "Temporary acceptance during launch freeze." }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value(containsString("Risk review due date")));

        mockMvc.perform(patch("/api/scanner/findings/{findingId}/status", findingId)
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "ACCEPTED_RISK",
                                  "reason": "Compensating control is active while the credential is rotated.",
                                  "reviewDueOn": "2026-06-30"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED_RISK"))
                .andExpect(jsonPath("$.riskReviewDueOn").value("2026-06-30"));
    }

    @Test
    void workspaceScopedScannerEvidenceCreatesReadinessCriteriaAndMilestoneRisk() throws Exception {
        User owner = saveUser("scanner-workspace-owner@produs.test", User.UserRole.PRODUCT_OWNER);
        UUID productId = createProduct(owner);
        ProjectWorkspace workspace = createWorkspaceWithModule(owner, productId, "security.secrets_scan");
        Milestone milestone = createMilestone(workspace, "Test & Secure");

        String sarif = """
                {
                  "version": "2.1.0",
                  "runs": [{
                    "tool": {
                      "driver": {
                        "name": "Gitleaks",
                        "rules": [{ "id": "generic-api-key" }]
                      }
                    },
                    "results": [{
                      "ruleId": "generic-api-key",
                      "level": "error",
                      "message": {
                        "text": "Hardcoded API key prod_live_123456789abcdef detected in env sample"
                      },
                      "locations": [{
                        "physicalLocation": {
                          "artifactLocation": { "uri": ".env.example" },
                          "region": { "startLine": 4 }
                        }
                      }]
                    }]
                  }]
                }
                """;

        mockMvc.perform(post("/api/scanner/runs/ci-upload")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", productId.toString(),
                                "workspaceId", workspace.getId().toString(),
                                "milestoneId", milestone.getId().toString(),
                                "toolName", "Gitleaks",
                                "format", "SARIF",
                                "artifactFileName", "gitleaks.sarif",
                                "artifactPayload", sarif
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        MvcResult readinessResult = mockMvc.perform(get("/api/productization-engine/workspaces/{workspaceId}/scanner-readiness", workspace.getId())
                        .with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.diagnosis.diagnosisSource").value("SCANNER_READINESS"))
                .andExpect(jsonPath("$.mappedFindingCount").value(1))
                .andExpect(jsonPath("$.blockerCount").value(1))
                .andExpect(jsonPath("$.enrichedCriterionCount").value(1))
                .andExpect(jsonPath("$.milestoneRisks[0].mappedServices[0]").value("Secrets scan"))
                .andReturn();
        JsonNode readiness = objectMapper.readTree(readinessResult.getResponse().getContentAsString());
        org.assertj.core.api.Assertions.assertThat(readiness.get("missingEvidenceCount").asInt()).isGreaterThan(0);

        mockMvc.perform(get("/api/productization-engine/products/{productId}/ship-confidence", productId)
                        .with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productId").value(productId.toString()))
                .andExpect(jsonPath("$.latest.source").value("SCANNER_READINESS"))
                .andExpect(jsonPath("$.latest.priorityFixCount").value(1))
                .andExpect(jsonPath("$.latest.mappedFindingCount").value(1))
                .andExpect(jsonPath("$.latest.recommendedServices[0]").value("Secrets scan"))
                .andExpect(jsonPath("$.latest.suggestedNextStep").value(containsString("service")));

        mockMvc.perform(get("/api/productization-engine/workspaces/{workspaceId}/ship-confidence", workspace.getId())
                        .with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workspaceId").value(workspace.getId().toString()))
                .andExpect(jsonPath("$.latest.workspaceId").value(workspace.getId().toString()))
                .andExpect(jsonPath("$.latest.statusLabel").value("Needs key fixes"));

        MvcResult governanceResult = mockMvc.perform(get("/api/productization-engine/workspaces/{workspaceId}/governance", workspace.getId())
                        .with(auth(owner)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode governance = objectMapper.readTree(governanceResult.getResponse().getContentAsString());
        JsonNode criterion = governance.get("criteria").get(0);
        org.assertj.core.api.Assertions.assertThat(criterion.get("title").asText()).contains("Scanner blocker");
        org.assertj.core.api.Assertions.assertThat(criterion.get("description").asText()).contains("Scanner finding ID");
        org.assertj.core.api.Assertions.assertThat(criterion.get("evidenceRequirements").size()).isEqualTo(3);
        org.assertj.core.api.Assertions.assertThat(criterion.get("automatedChecks").get(0).get("checkType").asText()).isEqualTo("scanner-readiness-map");

        mockMvc.perform(post("/api/productization-engine/workspaces/{workspaceId}/scanner-readiness/enrich", workspace.getId())
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"createCriteria\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enrichedCriterionCount").value(1));
    }

    @Test
    void productScannerSummaryIsRestrictedToProductOwner() throws Exception {
        User owner = saveUser("scanner-owner-private@produs.test", User.UserRole.PRODUCT_OWNER);
        User otherOwner = saveUser("scanner-other-owner@produs.test", User.UserRole.PRODUCT_OWNER);
        UUID productId = createProduct(owner);

        mockMvc.perform(get("/api/scanner/products/{productId}/summary", productId).with(auth(otherOwner)))
                .andExpect(status().isForbidden());
    }

    @Test
    void hostedSafeStaticScanRunsConfiguredToolAndPersistsNormalizedFindings(@org.junit.jupiter.api.io.TempDir Path tempDir) throws Exception {
        assumeGitAvailable();
        User owner = saveUser("scanner-hosted-owner@produs.test", User.UserRole.PRODUCT_OWNER);
        UUID productId = createProduct(owner);
        Path repo = createGitRepository(tempDir.resolve("repo"));
        Path fakeScanner = createFakeGitleaksScanner(tempDir.resolve("fake-gitleaks.sh"));
        ScannerProperties.ToolProperties gitleaks = scannerProperties.getTools().get("gitleaks");
        gitleaks.setCommand("'" + fakeScanner + "' {target} {output}");
        gitleaks.setVersionCommand("'" + fakeScanner + "' --version");
        gitleaks.setEnabled(true);

        MvcResult sourceResult = mockMvc.perform(post("/api/scanner/sources")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "productId": "%s",
                                  "providerType": "GITHUB",
                                  "displayName": "Local authorized repository",
                                  "externalReference": "%s",
                                  "scopeNote": "Test repository authorized for safe static scanner execution."
                                }
                                """.formatted(productId, repo.toUri())))
                .andExpect(status().isOk())
                .andReturn();
        UUID sourceId = readId(sourceResult);

        MvcResult runResult = mockMvc.perform(post("/api/scanner/runs/hosted")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "productId": "%s",
                                  "sourceId": "%s",
                                  "depth": "SAFE_STATIC",
                                  "toolKeys": ["gitleaks"],
                                  "authorizationConfirmed": true,
                                  "reason": "Owner authorized safe static scan for productization readiness."
                                }
                                """.formatted(productId, sourceId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("QUEUED"))
                .andExpect(jsonPath("$.toolRuns[0].toolKey").value("gitleaks"))
                .andReturn();
        UUID runId = readId(runResult);

        org.assertj.core.api.Assertions.assertThat(scannerWorker.executeNextQueuedJob()).isTrue();

        mockMvc.perform(get("/api/scanner/runs/{runId}", runId).with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.toolRuns[0].status").value("COMPLETED"))
                .andExpect(jsonPath("$.toolRuns[0].normalizedCount").value(1));

        mockMvc.perform(get("/api/scanner/runs/{runId}/findings", runId).with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sourceTool").value("Gitleaks"))
                .andExpect(jsonPath("$[0].severity").value("HIGH"))
                .andExpect(jsonPath("$[0].description", not(containsString("ghp_"))))
                .andExpect(jsonPath("$[0].description").value(containsString("[REDACTED_SECRET]")));
    }

    @Test
    void hostedScannerTreatsAcceptedNonZeroFindingExitAsCompleted(@org.junit.jupiter.api.io.TempDir Path tempDir) throws Exception {
        assumeGitAvailable();
        User owner = saveUser("scanner-osv-owner@produs.test", User.UserRole.PRODUCT_OWNER);
        UUID productId = createProduct(owner);
        Path repo = createGitRepository(tempDir.resolve("repo"));
        Path fakeScanner = createFakeOsvScanner(tempDir.resolve("fake-osv.sh"));
        ScannerProperties.ToolProperties osv = scannerProperties.getTools().get("osv-scanner");
        osv.setCommand("'" + fakeScanner + "' {target} {output}");
        osv.setVersionCommand("'" + fakeScanner + "' --version");
        osv.setAcceptedExitCodes(List.of(0, 1));
        osv.setEnabled(true);

        MvcResult sourceResult = mockMvc.perform(post("/api/scanner/sources")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "productId": "%s",
                                  "providerType": "GITHUB",
                                  "displayName": "Local authorized repository",
                                  "externalReference": "%s",
                                  "scopeNote": "Test repository authorized for safe static scanner execution."
                                }
                                """.formatted(productId, repo.toUri())))
                .andExpect(status().isOk())
                .andReturn();
        UUID sourceId = readId(sourceResult);

        MvcResult runResult = mockMvc.perform(post("/api/scanner/runs/hosted")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "productId": "%s",
                                  "sourceId": "%s",
                                  "depth": "SAFE_STATIC",
                                  "toolKeys": ["osv-scanner"],
                                  "authorizationConfirmed": true,
                                  "reason": "Owner authorized safe static scan for productization readiness."
                                }
                                """.formatted(productId, sourceId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("QUEUED"))
                .andReturn();
        UUID runId = readId(runResult);

        org.assertj.core.api.Assertions.assertThat(scannerWorker.executeNextQueuedJob()).isTrue();

        mockMvc.perform(get("/api/scanner/runs/{runId}", runId).with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.toolRuns[0].status").value("COMPLETED"))
                .andExpect(jsonPath("$.toolRuns[0].exitCode").value(1))
                .andExpect(jsonPath("$.toolRuns[0].normalizedCount").value(1));

        mockMvc.perform(get("/api/scanner/runs/{runId}/findings", runId).with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sourceTool").value("OSV-Scanner"))
                .andExpect(jsonPath("$[0].severity").value("HIGH"))
                .andExpect(jsonPath("$[0].title").value(containsString("Prototype pollution")));
    }

    @Test
    void hostedScanCanBeCanceledBeforeExecution(@org.junit.jupiter.api.io.TempDir Path tempDir) throws Exception {
        assumeGitAvailable();
        User owner = saveUser("scanner-cancel-owner@produs.test", User.UserRole.PRODUCT_OWNER);
        UUID productId = createProduct(owner);
        Path repo = createGitRepository(tempDir.resolve("repo"));

        MvcResult sourceResult = mockMvc.perform(post("/api/scanner/sources")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "productId": "%s",
                                  "providerType": "GITHUB",
                                  "displayName": "Cancelable repository",
                                  "externalReference": "%s"
                                }
                                """.formatted(productId, repo.toUri())))
                .andExpect(status().isOk())
                .andReturn();
        UUID sourceId = readId(sourceResult);

        MvcResult runResult = mockMvc.perform(post("/api/scanner/runs/hosted")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "productId": "%s",
                                  "sourceId": "%s",
                                  "depth": "SAFE_STATIC",
                                  "toolKeys": ["gitleaks"],
                                  "authorizationConfirmed": true,
                                  "reason": "Owner authorized safe static scan."
                                }
                                """.formatted(productId, sourceId)))
                .andExpect(status().isOk())
                .andReturn();
        UUID runId = readId(runResult);

        mockMvc.perform(post("/api/scanner/runs/{runId}/cancel", runId)
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"No longer needed.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELED"))
                .andExpect(jsonPath("$.cancelRequested").value(true))
                .andExpect(jsonPath("$.toolRuns[0].status").value("CANCELED"));

        org.assertj.core.api.Assertions.assertThat(scannerWorker.executeNextQueuedJob()).isFalse();
    }

    @Test
    void externalGithubCodeScanningImportCreatesImportRunAndNormalizedFinding() throws Exception {
        User owner = saveUser("scanner-import-owner@produs.test", User.UserRole.PRODUCT_OWNER);
        UUID productId = createProduct(owner);
        String githubAlerts = """
                {
                  "alerts": [{
                    "rule": {
                      "id": "js/sql-injection",
                      "description": "SQL query built from user-controlled data",
                      "security_severity_level": "high"
                    },
                    "most_recent_instance": {
                      "message": "Unsanitized input reaches a SQL query",
                      "location": {
                        "path": "src/api/payments.ts",
                        "start_line": 44
                      }
                    }
                  }]
                }
                """;

        MvcResult importResult = mockMvc.perform(post("/api/scanner/imports/external")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", productId.toString(),
                                "provider", "GITHUB_CODE_SCANNING",
                                "importMethod", "CONNECTOR_SYNC",
                                "toolName", "GitHub Code Scanning",
                                "format", "JSON",
                                "artifactFileName", "github-code-scanning.json",
                                "artifactPayload", githubAlerts,
                                "externalReference", "https://github.com/acme/payments/security/code-scanning"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.provider").value("GITHUB_CODE_SCANNING"))
                .andExpect(jsonPath("$.importedCount").value(1))
                .andExpect(jsonPath("$.scanRun.status").value("COMPLETED"))
                .andReturn();
        UUID importId = readId(importResult);
        JsonNode importJson = objectMapper.readTree(importResult.getResponse().getContentAsString());
        UUID runId = UUID.fromString(importJson.get("scanRunId").asText());

        mockMvc.perform(get("/api/scanner/runs/{runId}/findings", runId).with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sourceTool").value("GitHub Code Scanning"))
                .andExpect(jsonPath("$[0].sourceRuleId").value("js/sql-injection"))
                .andExpect(jsonPath("$[0].severity").value("HIGH"))
                .andExpect(jsonPath("$[0].affectedComponent").value("src/api/payments.ts:44"))
                .andExpect(jsonPath("$[0].mappingSource").value("RULE_BASED_SCANNER_CATALOG"))
                .andExpect(jsonPath("$[0].readinessArea").value("API and integration security"));

        mockMvc.perform(get("/api/productization-engine/products/{productId}/diagnoses", productId).with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].diagnosisSource").value("SCANNER_READINESS"))
                .andExpect(jsonPath("$[0].generatedFromScanRunIds").value(runId.toString()))
                .andExpect(jsonPath("$[0].findings[0].recommendedModuleCode").value("security.api_review"));

        mockMvc.perform(get("/api/scanner/imports")
                        .with(auth(owner))
                        .param("productId", productId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(importId.toString()));

        mockMvc.perform(get("/api/scanner/products/{productId}/summary", productId).with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imports[0].provider").value("GITHUB_CODE_SCANNING"))
                .andExpect(jsonPath("$.counts.high").value(1));

        User admin = saveUser("scanner-import-admin@produs.test", User.UserRole.ADMIN);
        mockMvc.perform(get("/api/scanner/admin/health").with(auth(owner)))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/scanner/admin/health").with(auth(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recentJobs").exists())
                .andExpect(jsonPath("$.recentImports[0].id").value(importId.toString()))
                .andExpect(jsonPath("$.recentImports[0].scanRun.status").value("COMPLETED"));
    }

    @Test
    void ciTemplateEndpointGeneratesProductScopedTemplateAndSourceCanDisconnect() throws Exception {
        User owner = saveUser("scanner-template-owner@produs.test", User.UserRole.PRODUCT_OWNER);
        UUID productId = createProduct(owner);
        MvcResult sourceResult = mockMvc.perform(post("/api/scanner/sources")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "productId": "%s",
                                  "providerType": "CI_UPLOAD",
                                  "displayName": "Customer CI",
                                  "externalReference": "https://github.com/acme/payments/actions"
                                }
                                """.formatted(productId)))
                .andExpect(status().isOk())
                .andReturn();
        UUID sourceId = readId(sourceResult);

        mockMvc.perform(get("/api/scanner/ci-templates/GITHUB_ACTIONS")
                        .with(auth(owner))
                        .param("productId", productId.toString())
                        .param("sourceId", sourceId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.template").value(containsString(productId.toString())))
                .andExpect(jsonPath("$.template").value(containsString(sourceId.toString())))
                .andExpect(jsonPath("$.template").value(containsString("PRODUS_CI_UPLOAD_TOKEN")))
                .andExpect(jsonPath("$.template").value(containsString("/api/scanner/runs/ci-upload")));

        mockMvc.perform(post("/api/scanner/runs/ci-upload")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", productId.toString(),
                                "sourceId", sourceId.toString(),
                                "toolName", "Semgrep",
                                "format", "SARIF",
                                "artifactFileName", "semgrep.sarif",
                                "artifactPayload", "{\"runs\":[]}"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        mockMvc.perform(post("/api/scanner/sources/{sourceId}/disconnect", sourceId)
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Rotating CI source.\",\"deleteArtifacts\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authorizationStatus").value("REVOKED"))
                .andExpect(jsonPath("$.scopeNote").value("Rotating CI source."));
        verify(s3Service).deleteFiles(org.mockito.ArgumentMatchers.anyList());
    }

    @Test
    void connectorPermissionsRuntimeScanAndSchedulesAreExposedAndEnforced(@org.junit.jupiter.api.io.TempDir Path tempDir) throws Exception {
        User owner = saveUser("scanner-runtime-owner@produs.test", User.UserRole.PRODUCT_OWNER);
        UUID productId = createProduct(owner);
        Path fakeLighthouse = createFakeLighthouseScanner(tempDir.resolve("fake-lighthouse.sh"));
        ScannerProperties.ToolProperties lighthouse = scannerProperties.getTools().get("lighthouse");
        lighthouse.setCommand("'" + fakeLighthouse + "' {url} {output}");
        lighthouse.setVersionCommand("'" + fakeLighthouse + "' --version");
        lighthouse.setEnabled(true);

        mockMvc.perform(get("/api/scanner/connector-permissions").with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].providerType").value("GITHUB"))
                .andExpect(jsonPath("$[0].permissions[0]").exists());

        MvcResult sourceResult = mockMvc.perform(post("/api/scanner/sources")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "productId": "%s",
                                  "providerType": "RUNTIME_URL",
                                  "displayName": "Authorized staging URL",
                                  "externalReference": "https://staging.example.test",
                                  "scopeNote": "Owner confirmed domain authorization."
                                }
                                """.formatted(productId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authorizationStatus").value("AUTHORIZED"))
                .andReturn();
        UUID sourceId = readId(sourceResult);

        mockMvc.perform(post("/api/scanner/runs/hosted")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "productId": "%s",
                                  "sourceId": "%s",
                                  "depth": "RUNTIME_BASELINE",
                                  "toolKeys": ["lighthouse"],
                                  "authorizationConfirmed": true,
                                  "runtimeAuthorizationConfirmed": false,
                                  "reason": "Owner forgot runtime authorization confirmation."
                                }
                                """.formatted(productId, sourceId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value(containsString("Runtime baseline scan requires explicit URL/domain authorization")));

        MvcResult runResult = mockMvc.perform(post("/api/scanner/runs/hosted")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "productId": "%s",
                                  "sourceId": "%s",
                                  "depth": "RUNTIME_BASELINE",
                                  "toolKeys": ["lighthouse"],
                                  "authorizationConfirmed": true,
                                  "runtimeAuthorizationConfirmed": true,
                                  "reason": "Owner authorized baseline runtime scan."
                                }
                                """.formatted(productId, sourceId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("QUEUED"))
                .andReturn();
        UUID runId = readId(runResult);
        org.assertj.core.api.Assertions.assertThat(scannerWorker.executeNextQueuedJob()).isTrue();
        mockMvc.perform(get("/api/scanner/runs/{runId}/findings", runId).with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sourceTool").value("Lighthouse"))
                .andExpect(jsonPath("$[0].sourceRuleId").value("lighthouse-performance"));

        MvcResult scheduleResult = mockMvc.perform(post("/api/scanner/schedules")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "productId": "%s",
                                  "sourceId": "%s",
                                  "depth": "RUNTIME_BASELINE",
                                  "toolKeys": ["lighthouse"],
                                  "intervalDays": 7,
                                  "nextRunAt": "2026-05-18T10:00:00",
                                  "active": true,
                                  "reason": "Weekly runtime baseline evidence refresh."
                                }
                                """.formatted(productId, sourceId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.intervalDays").value(7))
                .andReturn();
        UUID scheduleId = readId(scheduleResult);

        mockMvc.perform(patch("/api/scanner/schedules/{scheduleId}", scheduleId)
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        mockMvc.perform(get("/api/scanner/products/{productId}/summary", productId).with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.schedules[0].id").value(scheduleId.toString()));
    }

    @Test
    void providerConnectorFlowCreatesSourcesAndVerifiesWebhookSignatures() throws Exception {
        User owner = saveUser("scanner-connector-owner@produs.test", User.UserRole.PRODUCT_OWNER);
        UUID productId = createProduct(owner);

        MvcResult installUrlResult = mockMvc.perform(post("/api/scanner/connectors/github/install-url")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"returnPath\":\"/owner/productization\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.providerType").value("GITHUB"))
                .andExpect(jsonPath("$.url").value(containsString("state=")))
                .andReturn();
        String state = objectMapper.readTree(installUrlResult.getResponse().getContentAsString()).get("state").asText();

        MvcResult installationResult = mockMvc.perform(get("/api/scanner/connectors/github/callback")
                        .with(auth(owner))
                        .param("installation_id", "123456")
                        .param("setup_action", "install")
                        .param("state", state)
                        .param("account", "acme")
                        .param("account_type", "Organization"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.externalInstallationId").value("123456"))
                .andReturn();
        UUID installationId = readId(installationResult);

        mockMvc.perform(post("/api/scanner/connectors/github/sources")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "installationId": "%s",
                                  "productId": "%s",
                                  "repositoryFullName": "acme/payments",
                                  "defaultBranch": "main",
                                  "displayName": "Acme Payments Repository"
                                }
                                """.formatted(installationId, productId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.providerType").value("GITHUB"))
                .andExpect(jsonPath("$.authorizationStatus").value("AUTHORIZED"))
                .andExpect(jsonPath("$.externalInstallationId").value("123456"))
                .andExpect(jsonPath("$.externalRepositoryFullName").value("acme/payments"))
                .andExpect(jsonPath("$.defaultBranch").value("main"));

        String githubPayload = "{\"action\":\"suspend\",\"installation\":{\"id\":123456}}";
        mockMvc.perform(post("/api/scanner/connectors/github/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-GitHub-Event", "installation")
                        .header("X-Hub-Signature-256", githubSignature(githubPayload))
                        .content(githubPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accepted").value(true))
                .andExpect(jsonPath("$.externalInstallationId").value("123456"));

        mockMvc.perform(post("/api/scanner/connectors/gitlab/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Gitlab-Event", "Project Hook")
                        .header("X-Gitlab-Token", "bad-token")
                        .content("{\"project_id\": 77}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/scanner/connectors/gitlab/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Gitlab-Event", "Project Hook")
                        .header("X-Gitlab-Token", "test-gitlab-webhook-secret")
                        .content("{\"project_id\": 77}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accepted").value(true));
    }

    @Test
    void scannerStorageGovernanceSignsArtifactsExportsEvidenceAndRestrictsRetention() throws Exception {
        User owner = saveUser("scanner-storage-owner@produs.test", User.UserRole.PRODUCT_OWNER);
        User admin = saveUser("scanner-storage-admin@produs.test", User.UserRole.ADMIN);
        UUID productId = createProduct(owner);

        String sarif = """
                {
                  "version": "2.1.0",
                  "runs": [{
                    "tool": {"driver": {"name": "Semgrep", "rules": [{"id": "python.lang.security.audit.subprocess-shell-true"}]}},
                    "results": [{
                      "ruleId": "python.lang.security.audit.subprocess-shell-true",
                      "level": "warning",
                      "message": {"text": "Shell=True subprocess invocation should be reviewed"},
                      "locations": [{
                        "physicalLocation": {
                          "artifactLocation": { "uri": "workers/job.py" },
                          "region": { "startLine": 88 }
                        }
                      }]
                    }]
                  }]
                }
                """;

        mockMvc.perform(post("/api/scanner/runs/ci-upload")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", productId.toString(),
                                "toolName", "Semgrep",
                                "format", "SARIF",
                                "artifactFileName", "semgrep.sarif",
                                "artifactPayload", sarif
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        MvcResult summary = mockMvc.perform(get("/api/scanner/products/{productId}/summary", productId).with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.evidence[0].storageKey").exists())
                .andReturn();
        String evidenceId = objectMapper.readTree(summary.getResponse().getContentAsString()).get("evidence").get(0).get("id").asText();

        mockMvc.perform(get("/api/scanner/evidence/{evidenceId}/artifact-url", evidenceId).with(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.entityType").value("SCANNER_EVIDENCE"))
                .andExpect(jsonPath("$.signedUrl").value(containsString("https://storage.produs.test/signed/")));

        mockMvc.perform(post("/api/scanner/evidence-exports")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"%s\"}".formatted(productId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.findingCount").value(1))
                .andExpect(jsonPath("$.evidenceCount").value(1))
                .andExpect(jsonPath("$.signedUrl").value(containsString("https://storage.produs.test/signed/")));

        mockMvc.perform(post("/api/scanner/admin/storage/retention")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dryRun\":true}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/scanner/admin/storage/retention")
                        .with(auth(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dryRun\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dryRun").value(true))
                .andExpect(jsonPath("$.candidateCount").value(0));
    }

    private UUID createProduct(User owner) throws Exception {
        MvcResult productResult = mockMvc.perform(post("/api/products")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Scanner Ready Payments",
                                  "summary": "Payment product with security evidence imports",
                                  "businessStage": "PROTOTYPE",
                                  "techStack": "Next.js, Spring Boot, PostgreSQL",
                                  "riskProfile": "Security evidence must be reviewed before launch"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();
        return readId(productResult);
    }

    private ProjectWorkspace createWorkspaceWithModule(User owner, UUID productId, String serviceModuleCode) {
        ProductProfile product = productProfileRepository.findById(productId).orElseThrow();
        ServiceModule serviceModule = serviceModuleRepository.findByStableCode(serviceModuleCode).orElseThrow();

        PackageInstance packageInstance = new PackageInstance();
        packageInstance.setOwner(owner);
        packageInstance.setProductProfile(product);
        packageInstance.setName("Scanner readiness service plan");
        packageInstance.setSummary("Service plan seeded for workspace scanner readiness tests.");
        packageInstance.setStatus(PackageInstance.PackageStatus.ACTIVE_DELIVERY);
        packageInstance = packageInstanceRepository.save(packageInstance);

        PackageModule packageModule = new PackageModule();
        packageModule.setPackageInstance(packageInstance);
        packageModule.setServiceModule(serviceModule);
        packageModule.setSequenceOrder(1);
        packageModule.setRequired(true);
        packageModule.setRationale("Scanner readiness mapping requires this service.");
        packageModule.setDeliverables(serviceModule.getExpectedDeliverables());
        packageModule.setAcceptanceCriteria(serviceModule.getAcceptanceCriteria());
        packageModuleRepository.save(packageModule);

        ProjectWorkspace workspace = new ProjectWorkspace();
        workspace.setOwner(owner);
        workspace.setPackageInstance(packageInstance);
        workspace.setName("Scanner readiness workspace");
        workspace.setStatus(ProjectWorkspace.WorkspaceStatus.ACTIVE_DELIVERY);
        return workspaceRepository.save(workspace);
    }

    private Milestone createMilestone(ProjectWorkspace workspace, String title) {
        Milestone milestone = new Milestone();
        milestone.setWorkspace(workspace);
        milestone.setTitle(title);
        milestone.setDescription("Security and scanner readiness evidence for owner review.");
        milestone.setStatus(Milestone.MilestoneStatus.IN_PROGRESS);
        return milestoneRepository.save(milestone);
    }

    private UUID readId(MvcResult result) throws Exception {
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return UUID.fromString(json.get("id").asText());
    }

    private void assumeGitAvailable() {
        try {
            Process process = new ProcessBuilder("git", "--version").start();
            Assumptions.assumeTrue(process.waitFor() == 0, "git is required for hosted scan tests");
        } catch (Exception ex) {
            Assumptions.assumeTrue(false, "git is required for hosted scan tests");
        }
    }

    private Path createGitRepository(Path repo) throws Exception {
        Files.createDirectories(repo);
        Files.writeString(repo.resolve("config.env"), "API_TOKEN=ghp_12345678901234567890");
        run(repo, "git", "init");
        run(repo, "git", "config", "user.email", "scanner@produs.test");
        run(repo, "git", "config", "user.name", "Scanner Test");
        run(repo, "git", "add", ".");
        run(repo, "git", "commit", "-m", "fixture");
        return repo;
    }

    private Path createFakeGitleaksScanner(Path script) throws Exception {
        Files.writeString(script, """
                #!/bin/sh
                if [ "$1" = "--version" ]; then
                  echo "fake-gitleaks 1.0.0"
                  exit 0
                fi
                output="$2"
                cat > "$output" <<'JSON'
                [{
                  "RuleID": "generic-api-key",
                  "Description": "Hardcoded token ghp_12345678901234567890 found in repository",
                  "File": "config.env",
                  "StartLine": 1
                }]
                JSON
                exit 0
                """);
        script.toFile().setExecutable(true);
        return script;
    }

    private Path createFakeOsvScanner(Path script) throws Exception {
        Files.writeString(script, """
                #!/bin/sh
                if [ "$1" = "--version" ]; then
                  echo "fake-osv 1.0.0"
                  exit 0
                fi
                output="$2"
                cat > "$output" <<'JSON'
                {
                  "results": [{
                    "packages": [{
                      "package": { "name": "lodash", "version": "4.17.20" },
                      "vulnerabilities": [{
                        "id": "GHSA-test",
                        "summary": "Prototype pollution vulnerability",
                        "details": "Dependency needs upgrade before production use.",
                        "database_specific": { "severity": "HIGH" }
                      }]
                    }]
                  }]
                }
                JSON
                exit 1
                """);
        script.toFile().setExecutable(true);
        return script;
    }

    private Path createFakeLighthouseScanner(Path script) throws Exception {
        Files.writeString(script, """
                #!/bin/sh
                if [ "$1" = "--version" ]; then
                  echo "fake-lighthouse 1.0.0"
                  exit 0
                fi
                output="$2"
                cat > "$output" <<'JSON'
                {
                  "categories": {
                    "performance": { "title": "Performance", "score": 0.42 },
                    "accessibility": { "title": "Accessibility", "score": 0.98 }
                  }
                }
                JSON
                exit 0
                """);
        script.toFile().setExecutable(true);
        return script;
    }

    private void run(Path directory, String... command) throws Exception {
        Process process = new ProcessBuilder(command).directory(directory.toFile()).start();
        int exit = process.waitFor();
        org.assertj.core.api.Assertions.assertThat(exit).as(String.join(" ", command)).isZero();
    }

    private String githubSignature(String payload) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec("test-github-webhook-secret".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return "sha256=" + HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
    }

    private User saveUser(String email, User.UserRole role) {
        User user = new User();
        user.setEmail(email);
        user.setFirstName("Scanner");
        user.setLastName("Tester");
        user.setRole(role);
        user.setSupabaseId(email);
        return userRepository.save(user);
    }

    private RequestPostProcessor auth(User user) {
        return authentication(new UsernamePasswordAuthenticationToken(
                user,
                "n/a",
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        ));
    }
}
