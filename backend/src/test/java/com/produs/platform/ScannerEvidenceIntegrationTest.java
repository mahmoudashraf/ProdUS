package com.produs.platform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.entity.User;
import com.produs.repository.UserRepository;
import com.produs.service.S3Service;
import org.junit.jupiter.api.BeforeEach;
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
