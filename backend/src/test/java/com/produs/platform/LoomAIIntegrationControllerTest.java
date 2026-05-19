package com.produs.platform;

import com.produs.catalog.ServiceCategory;
import com.produs.catalog.ServiceCategoryRepository;
import com.produs.catalog.ServiceModule;
import com.produs.catalog.ServiceModuleRepository;
import com.produs.entity.User;
import com.produs.product.ProductProfile;
import com.produs.product.ProductProfileRepository;
import com.produs.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class LoomAIIntegrationControllerTest {

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

    @Test
    void adminCanInspectLoomAIStatusAndSafeKnowledgePreview() throws Exception {
        User admin = saveUser("admin-ai@produs.test", User.UserRole.ADMIN);
        User owner = saveUser("owner-ai@produs.test", User.UserRole.PRODUCT_OWNER);
        saveCatalogRecord();

        mockMvc.perform(get("/api/ai/loomai/status").with(auth(owner)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/ai/loomai/status").with(auth(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false))
                .andExpect(jsonPath("$.configured").value(false))
                .andExpect(jsonPath("$.allowedActions[?(@ == 'produs.scan.status')]").exists())
                .andExpect(jsonPath("$.allowedActions[?(@ == 'produs.team.profile.update')]").doesNotExist());

        mockMvc.perform(get("/api/ai/loomai/knowledge-preview").with(auth(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$[0].type").exists());

        mockMvc.perform(post("/api/ai/loomai/knowledge-sync").with(auth(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SKIPPED"))
                .andExpect(jsonPath("$.fallbackReason").value("LOOMAI_DISABLED"));
    }

    @Test
    void adminCanInspectProductionReadinessWithoutSecretValues() throws Exception {
        User admin = saveUser("admin-readiness@produs.test", User.UserRole.ADMIN);
        User owner = saveUser("owner-readiness@produs.test", User.UserRole.PRODUCT_OWNER);

        mockMvc.perform(get("/api/admin/production-readiness").with(auth(owner)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/production-readiness").with(auth(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overallStatus").value("BLOCKED"))
                .andExpect(jsonPath("$.gates[?(@.key == 'database')].status").value(org.hamcrest.Matchers.hasItem("BLOCKED")))
                .andExpect(jsonPath("$.gates[?(@.key == 'supabase-auth')]").exists())
                .andExpect(jsonPath("$..detail").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.containsString("test-anon-key")))));
    }

    @Test
    void assistantBrokerUsesSafeContextAndExplicitFallbackWhenLoomAIIsDisabled() throws Exception {
        User owner = saveUser("owner-assistant@produs.test", User.UserRole.PRODUCT_OWNER);
        ProductProfile product = saveProduct(owner);

        mockMvc.perform(post("/api/ai/assistant/session")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "context": {
                                    "pageType": "owner-product-workspace",
                                    "productId": "%s"
                                  }
                                }
                                """.formatted(product.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provider").value("PRODUS_FALLBACK"))
                .andExpect(jsonPath("$.mode").value("FALLBACK"))
                .andExpect(jsonPath("$.allowedActions[?(@ == 'produs.evidence.upload_ci_result')]").exists());

        mockMvc.perform(post("/api/ai/assistant/query")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "sessionId": "fallback-session",
                                  "message": "What scanner evidence is missing?",
                                  "context": {
                                    "pageType": "scanner-evidence",
                                    "productId": "%s"
                                  }
                                }
                                """.formatted(product.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provider").value("PRODUS_FALLBACK"))
                .andExpect(jsonPath("$.fallbackReason").value("LOOMAI_DISABLED"))
                .andExpect(jsonPath("$.answer").value(containsString("LoomAI is not connected")));

        mockMvc.perform(post("/api/ai/assistant/suggestions")
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "context": {
                                    "pageType": "scanner-evidence",
                                    "productId": "%s"
                                  }
                                }
                                """.formatted(product.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.suggestions[0]").value(containsString("finding")));
    }

    @Test
    void loomAIMcpDiscoveryEndpointsExposeOnlyProductizationAllowlist() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));

        mockMvc.perform(get("/loomai/tool-allowlist"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ready").value(true))
                .andExpect(jsonPath("$.profile").value("loomai-productization"))
                .andExpect(jsonPath("$.tools[?(@.name == 'produs.scan.status')]").exists())
                .andExpect(jsonPath("$.tools[?(@.name == 'produs.team.profile.update')]").doesNotExist());

        mockMvc.perform(post("/mcp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"jsonrpc":"2.0","id":"tools","method":"tools/list","params":{}}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jsonrpc").value("2.0"))
                .andExpect(jsonPath("$.id").value("tools"))
                .andExpect(jsonPath("$.result.tools[?(@.name == 'produs.catalog.search')]").exists())
                .andExpect(jsonPath("$.result.tools[?(@.name == 'produs.team.invite')]").doesNotExist());
    }

    private User saveUser(String email, User.UserRole role) {
        User user = new User();
        user.setEmail(email);
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(role);
        user.setSupabaseId(email);
        return userRepository.save(user);
    }

    private ProductProfile saveProduct(User owner) {
        ProductProfile product = new ProductProfile();
        product.setOwner(owner);
        product.setName("Payments Hub");
        product.setSummary("Payment orchestration platform");
        product.setBusinessStage(ProductProfile.BusinessStage.PROTOTYPE);
        return productRepository.save(product);
    }

    private void saveCatalogRecord() {
        ServiceCategory category = new ServiceCategory();
        category.setName("Security");
        category.setSlug("security");
        category.setDescription("Security review and hardening");
        category = categoryRepository.save(category);

        ServiceModule module = new ServiceModule();
        module.setCategory(category);
        module.setName("API Security Review");
        module.setSlug("api-security-review");
        module.setStableCode("security.api_review");
        module.setDescription("Review API auth, authorization, rate limits, and secrets handling.");
        module.setOwnerOutcome("Owners understand and reduce API launch risk.");
        module.setExpectedDeliverables("Threat notes, remediation backlog, evidence requirements.");
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
