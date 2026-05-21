package com.produs.platform;

import com.produs.entity.User;
import com.produs.catalog.ServiceCategory;
import com.produs.catalog.ServiceCategoryRepository;
import com.produs.catalog.ServiceModule;
import com.produs.catalog.ServiceModuleRepository;
import com.produs.product.ProductProfile;
import com.produs.product.ProductProfileRepository;
import com.produs.repository.UserRepository;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.List;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class LoomAIStagingIntegrationTest {

    private static HttpServer server;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductProfileRepository productRepository;

    @Autowired
    private ServiceCategoryRepository categoryRepository;

    @Autowired
    private ServiceModuleRepository moduleRepository;

    @DynamicPropertySource
    static void loomAIProperties(DynamicPropertyRegistry registry) throws IOException {
        ensureServer();
        registry.add("loomai.enabled", () -> "true");
        registry.add("loomai.environment", () -> "staging");
        registry.add("loomai.integration-mode", () -> "BACKEND_MEDIATED_PRIVATE_RUNTIME");
        registry.add("loomai.auth-mode", () -> "PRIVATE_RUNTIME_ASSERTION");
        registry.add("loomai.runtime-api-key", () -> "test-runtime-api-key");
        registry.add("loomai.assertion-issuer", () -> "produs-staging-backend");
        registry.add("loomai.assertion-audience", () -> "dep-7706fafb");
        registry.add("loomai.assertion-signing-secret", () -> "test-loomai-private-runtime-secret-32");
        registry.add("loomai.timeout-ms", () -> "1000");
        registry.add("loomai.base-url", () -> "http://127.0.0.1:" + server.getAddress().getPort());
    }

    @AfterAll
    static void stopServer() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void stagingLoomAIEndpointsAreCalledAndUnavailableProviderFallsBack() throws Exception {
        User owner = saveUser("loom-staging-owner@produs.test", User.UserRole.PRODUCT_OWNER);
        User admin = saveUser("loom-staging-admin@produs.test", User.UserRole.ADMIN);
        ProductProfile product = saveProduct(owner);
        saveCatalogRecord();

        mockMvc.perform(get("/api/ai/loomai/status").with(auth(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true))
                .andExpect(jsonPath("$.configured").value(true))
                .andExpect(jsonPath("$.environment").value("staging"))
                .andExpect(jsonPath("$.authContextConfigured").value(true));

        mockMvc.perform(get("/api/ai/loomai/auth-context").with(auth(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provider").value("LOOMAI"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.authContext.subjectType").value("END_USER"))
                .andExpect(jsonPath("$.authContext.deploymentId").value("dep-7706fafb"));

        mockMvc.perform(post("/api/ai/assistant/session")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"context":{"pageType":"owner-product-workspace","productId":"%s"}}
                                """.formatted(product.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provider").value("PRODUS_SESSION"))
                .andExpect(jsonPath("$.mode").value("LOCAL"));

        mockMvc.perform(post("/api/ai/assistant/query")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "conversationId": "loom-session-123",
                                  "query": "Summarize scanner readiness",
                                  "context": {"pageType":"scanner-evidence","productId":"%s"}
                                }
                                """.formatted(product.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provider").value("LOOMAI"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.type").value("INFORMATION_PROVIDED"))
                .andExpect(jsonPath("$.safeSummary").value(containsString("Use scanner evidence")))
                .andExpect(jsonPath("$.conversationId").value("loom-session-123"))
                .andExpect(jsonPath("$.answer").value(containsString("Use scanner evidence")))
                .andExpect(jsonPath("$.providerRequestId").value("loom-staging-request"));

        mockMvc.perform(post("/api/ai/assistant/query")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "conversationId": "loom-session-123",
                                  "query": "force fallback",
                                  "context": {"pageType":"scanner-evidence","productId":"%s"}
                                }
                                """.formatted(product.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provider").value("PRODUS_FALLBACK"))
                .andExpect(jsonPath("$.fallbackReason").value("LOOMAI_UNAVAILABLE"));

        mockMvc.perform(post("/api/ai/assistant/suggestions")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": "Suggest scanner readiness questions",
                                  "conversationId": "loom-session-123",
                                  "maxSuggestions": 4,
                                  "context": {"pageType":"scanner-evidence","productId":"%s"}
                                }
                                """.formatted(product.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provider").value("LOOMAI"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.suggestions[0]").value("Prioritize critical scanner findings"));

        mockMvc.perform(post("/api/ai/loomai/knowledge-sync").with(auth(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SYNCED"))
                .andExpect(jsonPath("$.providerRequestId").value("loom-data-sync-request"))
                .andExpect(jsonPath("$.totalOperations").value(2))
                .andExpect(jsonPath("$.succeededOperations").value(2))
                .andExpect(jsonPath("$.failedOperations").value(0));
    }

    private static void ensureServer() throws IOException {
        if (server != null) {
            return;
        }
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/public/chat/session", exchange -> respond(exchange, 200, "{\"sessionId\":\"loom-session-123\"}"));
        server.createContext("/api/chat/me/auth-context", exchange -> {
            if (!privateRuntimeAuthorized(exchange)) {
                respond(exchange, 401, "{\"error\":\"unauthorized\"}");
                return;
            }
            respond(exchange, 200, """
                    {
                      "subjectId": "loom-staging-admin@produs.test",
                      "subjectType": "END_USER",
                      "authMode": "PRIVATE_RUNTIME_BACKEND_MEDIATED",
                      "callerType": "TRUSTED_BACKEND",
                      "sessionId": "produs-admin-auth-context-smoke",
                      "deploymentId": "dep-7706fafb",
                      "issuer": "produs-staging-backend",
                      "grantedScopes": ["chat:query", "chat:suggestions", "chat:conversations"]
                    }
                    """);
        });
        server.createContext("/api/chat/me/query", exchange -> {
            if (!privateRuntimeAuthorized(exchange)) {
                respond(exchange, 401, "{\"error\":\"unauthorized\"}");
                return;
            }
            String requestBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            if (!requestBody.contains("\"query\"") || !requestBody.contains("\"conversationId\"")
                    || !requestBody.contains("\"mode\"") || !requestBody.contains("\"position\"")
                    || requestBody.contains("\"message\"") || requestBody.contains("\"allowedActions\"")) {
                respond(exchange, 400, "{\"error\":\"query and conversationId are required\"}");
                return;
            }
            if (!requestBody.contains("\"productSummary\"") || !requestBody.contains("\"scannerSummary\"")
                    || !requestBody.contains("\"actionProfile\":\"loomai-productization-read\"")
                    || requestBody.contains("sk-test-secret") || requestBody.contains("api.example.test")) {
                respond(exchange, 400, "{\"error\":\"safe context enrichment is required\"}");
                return;
            }
            if (requestBody.contains("force fallback")) {
                respond(exchange, 503, "{\"error\":\"temporarily unavailable\"}");
                return;
            }
            respond(exchange, 200, """
                    {
                      "success": true,
	                      "type": "INFORMATION_PROVIDED",
	                      "answer": "Use scanner evidence and product context to prioritize readiness.",
	                      "safeSummary": "Use scanner evidence and product context to prioritize readiness.",
                          "conversationId": "loom-session-123",
                          "providerRequestId": "loom-result-request",
	                      "sources": [{"type": "scanner"}],
	                      "actions": [],
	                      "metadata": {"requestId": "loom-result-request"}
                    }
                    """);
        });
        server.createContext("/api/chat/me/suggestions", exchange -> {
            if (!privateRuntimeAuthorized(exchange)) {
                respond(exchange, 401, "{\"error\":\"unauthorized\"}");
                return;
            }
            String requestBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            if (!requestBody.contains("\"content\"") || !requestBody.contains("\"maxSuggestions\"")
                    || requestBody.contains("\"conversationId\"") || requestBody.contains("\"context\"")) {
                respond(exchange, 400, "{\"error\":\"content and maxSuggestions are required; conversationId and context are not accepted\"}");
                return;
            }
            respond(exchange, 200, """
                    {
                      "success": true,
                      "suggestions": ["Prioritize critical scanner findings", "Export evidence for owner review"],
                      "metadata": {"requestId": "loom-suggestions-request"}
                    }
                    """);
        });
        server.createContext("/api/ai/data-sync/batch", exchange -> {
            if (!privateRuntimeAuthorized(exchange)) {
                respond(exchange, 401, "{\"error\":\"unauthorized\"}");
                return;
            }
            String assertionPayload = assertionPayload(exchange);
            String requestBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            if (!assertionPayload.contains("\"subjectType\":\"SYSTEM_PROCESS\"")
                    || !assertionPayload.contains("\"callerType\":\"SYSTEM_PROCESS\"")
                    || !assertionPayload.contains("\"data-sync:upsert\"")) {
                respond(exchange, 401, "{\"error\":\"system data-sync assertion is required\"}");
                return;
            }
            if (requestBody.contains("\"records\"")
                    || !requestBody.contains("\"trace\"") || !requestBody.contains("\"operations\"")
                    || !requestBody.contains("\"authContext\"")
                    || !requestBody.contains("\"subjectId\":\"system:produs-safe-knowledge-sync\"")
                    || !requestBody.contains("\"grantedScopes\":[\"data-sync:upsert\"]")
                    || !requestBody.contains("\"type\":\"UPSERT\"")
                    || !requestBody.contains("\"vectorSpace\":\"service-category\"")
                    || !requestBody.contains("\"vectorSpace\":\"service-module\"")
                    || !requestBody.contains("\"identity\"")
                    || !requestBody.contains("\"sourceRecordVersion\"")) {
                respond(exchange, 400, "{\"error\":\"canonical trace and operations are required\"}");
                return;
            }
            respond(exchange, 200, """
                    {
                      "status": "accepted",
                      "providerRequestId": "loom-data-sync-request",
                      "totalOperations": 2,
                      "succeededOperations": 2,
                      "failedOperations": 0,
                      "errors": []
                    }
                    """);
        });
        server.start();
    }

    private static boolean privateRuntimeAuthorized(HttpExchange exchange) {
        String runtimeKey = exchange.getRequestHeaders().getFirst("X-AIFABRIC-RUNTIME-API-KEY");
        String authorization = exchange.getRequestHeaders().getFirst("X-AIFABRIC-RUNTIME-AUTHORIZATION");
        if (!"test-runtime-api-key".equals(runtimeKey) || authorization == null || !authorization.startsWith("Bearer ")) {
            return false;
        }
        try {
            String assertion = authorization.substring("Bearer ".length());
            String[] segments = assertion.split("\\.");
            if (segments.length != 3 || !"rpa1".equals(segments[0])) {
                return false;
            }
            byte[] expectedSignature = hmacSha256(segments[1]);
            byte[] actualSignature = Base64.getUrlDecoder().decode(segments[2]);
            String payload = new String(Base64.getUrlDecoder().decode(segments[1]), StandardCharsets.UTF_8);
            return MessageDigest.isEqual(expectedSignature, actualSignature)
                    && payload.contains("\"iss\":\"produs-staging-backend\"")
                    && payload.contains("\"aud\":\"dep-7706fafb\"")
                    && payload.contains("\"deploymentId\":\"dep-7706fafb\"")
                    && payload.contains("\"customerId\":\"produs-staging\"")
                    && payload.contains("\"authMode\":\"PRIVATE_RUNTIME_BACKEND_MEDIATED\"")
                    && (
                        (
                            payload.contains("\"callerType\":\"TRUSTED_BACKEND\"")
                                    && payload.contains("\"chat:query\"")
                                    && payload.contains("\"chat:suggestions\"")
                                    && payload.contains("\"chat:conversations\"")
                        )
                        || (
                            payload.contains("\"callerType\":\"SYSTEM_PROCESS\"")
                                    && payload.contains("\"data-sync:upsert\"")
                        )
                    );
        } catch (Exception exception) {
            return false;
        }
    }

    private static String assertionPayload(HttpExchange exchange) {
        String authorization = exchange.getRequestHeaders().getFirst("X-AIFABRIC-RUNTIME-AUTHORIZATION");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return "";
        }
        String[] segments = authorization.substring("Bearer ".length()).split("\\.");
        if (segments.length != 3) {
            return "";
        }
        return new String(Base64.getUrlDecoder().decode(segments[1]), StandardCharsets.UTF_8);
    }

    private static byte[] hmacSha256(String payloadSegment) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec("test-loomai-private-runtime-secret-32".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return mac.doFinal(payloadSegment.getBytes(StandardCharsets.UTF_8));
    }

    private static void respond(HttpExchange exchange, int status, String body) throws IOException {
        byte[] payload = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.getResponseHeaders().add("X-Request-ID", "loom-staging-request");
        exchange.sendResponseHeaders(status, payload.length);
        exchange.getResponseBody().write(payload);
        exchange.close();
    }

    private User saveUser(String email, User.UserRole role) {
        User user = new User();
        user.setEmail(email);
        user.setFirstName("Loom");
        user.setLastName("Tester");
        user.setRole(role);
        user.setSupabaseId(email);
        return userRepository.save(user);
    }

    private ProductProfile saveProduct(User owner) {
        ProductProfile product = new ProductProfile();
        product.setOwner(owner);
        product.setName("LoomAI Scanner Product");
        product.setSummary("Product used for LoomAI staging integration tests. API_KEY=sk-test-secret should be redacted.");
        product.setBusinessStage(ProductProfile.BusinessStage.PROTOTYPE);
        product.setProductUrl("https://api.example.test/private");
        return productRepository.save(product);
    }

    private void saveCatalogRecord() {
        ServiceCategory category = new ServiceCategory();
        category.setName("Security");
        category.setSlug("security");
        category.setDescription("Security review and production hardening.");
        category = categoryRepository.save(category);

        ServiceModule module = new ServiceModule();
        module.setCategory(category);
        module.setName("API Security Review");
        module.setSlug("api-security-review");
        module.setStableCode("security.api_review");
        module.setDescription("Review API auth, authorization, rate limits, and secrets handling.");
        module.setOwnerOutcome("Owners understand and reduce API launch risk.");
        moduleRepository.save(module);
    }

    private RequestPostProcessor auth(User user) {
        return authentication(new UsernamePasswordAuthenticationToken(
                user,
                "n/a",
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        ));
    }
}
