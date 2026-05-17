package com.produs.platform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.entity.User;
import com.produs.repository.UserRepository;
import com.produs.scanner.ScannerProperties;
import com.produs.scanner.ScannerWorker;
import com.produs.service.S3Service;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
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
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class ScannerEvidenceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ScannerWorker scannerWorker;

    @Autowired
    private ScannerProperties scannerProperties;

    @MockBean
    private S3Service s3Service;

    @BeforeEach
    void mockObjectStorage() {
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
                .andReturn();
        UUID findingId = UUID.fromString(objectMapper.readTree(findingsResult.getResponse().getContentAsString()).get(0).get("id").asText());

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

    private void run(Path directory, String... command) throws Exception {
        Process process = new ProcessBuilder(command).directory(directory.toFile()).start();
        int exit = process.waitFor();
        org.assertj.core.api.Assertions.assertThat(exit).as(String.join(" ", command)).isZero();
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
