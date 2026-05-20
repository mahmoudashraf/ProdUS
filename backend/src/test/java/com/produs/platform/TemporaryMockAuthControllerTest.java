package com.produs.platform;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "app.mock-auth.enabled=true",
        "app.mock-auth.allowed-profiles=test",
        "loomai.enabled=false"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TemporaryMockAuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Test
    void loginCreatesDatabaseUserAndTokenAuthenticatesProtectedApi() throws Exception {
        String response = mockMvc.perform(post("/api/mock/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"owner@produs.com","password":"owner123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.role").value("PRODUCT_OWNER"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        @SuppressWarnings("unchecked")
        Map<String, Object> body = objectMapper.readValue(response, Map.class);
        String token = String.valueOf(body.get("token"));

        assertThat(userRepository.findByEmail("owner@produs.com")).isPresent();

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("owner@produs.com"));
    }

    @Test
    void invalidCredentialsAreRejected() throws Exception {
        mockMvc.perform(post("/api/mock/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"owner@produs.com","password":"wrong"}
                                """))
                .andExpect(status().isBadRequest());
    }
}
