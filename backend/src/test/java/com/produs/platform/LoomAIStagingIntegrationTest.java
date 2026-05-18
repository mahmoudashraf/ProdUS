package com.produs.platform;

import com.produs.entity.User;
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
import java.util.List;

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

    @DynamicPropertySource
    static void loomAIProperties(DynamicPropertyRegistry registry) throws IOException {
        ensureServer();
        registry.add("loomai.enabled", () -> "true");
        registry.add("loomai.environment", () -> "staging");
        registry.add("loomai.api-key", () -> "test-loomai-api-key");
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

        mockMvc.perform(get("/api/ai/loomai/status").with(auth(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true))
                .andExpect(jsonPath("$.configured").value(true))
                .andExpect(jsonPath("$.environment").value("staging"));

        mockMvc.perform(post("/api/ai/assistant/session")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"context":{"pageType":"owner-product-workspace","productId":"%s"}}
                                """.formatted(product.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provider").value("LOOMAI"))
                .andExpect(jsonPath("$.mode").value("LIVE"))
                .andExpect(jsonPath("$.providerRequestId").value("loom-staging-request"));

        mockMvc.perform(post("/api/ai/assistant/query")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "sessionId": "loom-session-123",
                                  "message": "Summarize scanner readiness",
                                  "context": {"pageType":"scanner-evidence","productId":"%s"}
                                }
                                """.formatted(product.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provider").value("LOOMAI"))
                .andExpect(jsonPath("$.answer").value(containsString("Use scanner evidence")));

        mockMvc.perform(post("/api/ai/assistant/query")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "sessionId": "loom-session-123",
                                  "message": "force fallback",
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
                                {"context":{"pageType":"scanner-evidence","productId":"%s"}}
                                """.formatted(product.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provider").value("LOOMAI"))
                .andExpect(jsonPath("$.suggestions[0]").value("Prioritize critical scanner findings"));

        mockMvc.perform(post("/api/ai/loomai/knowledge-sync").with(auth(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SYNCED"))
                .andExpect(jsonPath("$.providerRequestId").value("loom-staging-request"));
    }

    private static void ensureServer() throws IOException {
        if (server != null) {
            return;
        }
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/public/chat/session", exchange -> respond(exchange, 200, "{\"sessionId\":\"loom-session-123\"}"));
        server.createContext("/api/chat/me/query", exchange -> {
            String requestBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            if (requestBody.contains("force fallback")) {
                respond(exchange, 503, "{\"error\":\"temporarily unavailable\"}");
                return;
            }
            respond(exchange, 200, "{\"answer\":\"Use scanner evidence and product context to prioritize readiness.\",\"confidence\":0.86,\"sources\":[{\"type\":\"scanner\"}],\"actions\":[]}");
        });
        server.createContext("/api/chat/me/suggestions", exchange -> respond(exchange, 200, "{\"suggestions\":[\"Prioritize critical scanner findings\",\"Export evidence for owner review\"]}"));
        server.createContext("/api/ai/data-sync/batch", exchange -> respond(exchange, 200, "{\"status\":\"accepted\"}"));
        server.start();
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
        product.setSummary("Product used for LoomAI staging integration tests");
        product.setBusinessStage(ProductProfile.BusinessStage.PROTOTYPE);
        return productRepository.save(product);
    }

    private RequestPostProcessor auth(User user) {
        return authentication(new UsernamePasswordAuthenticationToken(
                user,
                "n/a",
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        ));
    }
}
