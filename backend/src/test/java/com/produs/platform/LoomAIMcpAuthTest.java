package com.produs.platform;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.beans.factory.annotation.Autowired;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "produs.mcp.require-auth=true",
        "produs.mcp.api-key=test-mcp-secret"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class LoomAIMcpAuthTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void mcpDiscoveryRequiresConfiguredApiKeyWhenEnabled() throws Exception {
        mockMvc.perform(get("/loomai/tool-allowlist"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("PRODUS_MCP_AUTH_REQUIRED"));

        mockMvc.perform(get("/loomai/tool-allowlist")
                        .header("X-MCP-API-KEY", "test-mcp-secret"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ready").value(true));

        mockMvc.perform(post("/mcp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"jsonrpc":"2.0","id":"tools","method":"tools/list","params":{}}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("PRODUS_MCP_AUTH_REQUIRED"));

        mockMvc.perform(post("/mcp")
                        .header("X-MCP-API-KEY", "test-mcp-secret")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"jsonrpc":"2.0","id":"tools","method":"tools/list","params":{}}
                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.tools[?(@.name == 'produs.catalog.search')]").exists())
                .andExpect(jsonPath("$.result.tools[?(@.name == 'produs.project_creation_document.read')]").exists());

        mockMvc.perform(post("/mcp")
                        .header("X-MCP-API-KEY", "test-mcp-secret")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "jsonrpc": "2.0",
                                  "id": "call-1",
                                  "method": "tools/call",
                                  "params": {
                                    "name": "produs.catalog.search",
                                    "arguments": {
                                      "query": "security",
                                      "limit": 3
                                    }
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jsonrpc").value("2.0"))
                .andExpect(jsonPath("$.id").value("call-1"))
                .andExpect(jsonPath("$.result.isError").value(false))
                .andExpect(jsonPath("$.result.structuredContent.status").value("OK"))
                .andExpect(jsonPath("$.result.structuredContent.tool").value("produs.catalog.search"))
                .andExpect(jsonPath("$.result.content[0].type").value("text"));
    }
}
