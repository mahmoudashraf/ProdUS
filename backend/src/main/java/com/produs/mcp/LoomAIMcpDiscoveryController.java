package com.produs.mcp;

import com.produs.ai.LoomAIToolAllowlist;
import com.produs.ai.LoomAIToolAllowlist.ToolDefinition;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class LoomAIMcpDiscoveryController {

    private final LoomAIMcpToolService toolService;

    @Value("${produs.mcp.require-auth:${PRODUS_MCP_REQUIRE_AUTH:false}}")
    private boolean requireAuth;

    @Value("${produs.mcp.api-key:${PRODUS_MCP_API_KEY:}}")
    private String apiKey;

    @Value("${produs.mcp.tool-profile:${PRODUS_MCP_TOOL_PROFILE:loomai-productization}}")
    private String toolProfile;

    @GetMapping("/loomai/tool-allowlist")
    public ResponseEntity<Map<String, Object>> allowlist(@RequestHeader(value = "X-MCP-API-KEY", required = false) String providedApiKey) {
        ResponseEntity<Map<String, Object>> unauthorized = unauthorizedIfRequired(providedApiKey);
        if (unauthorized != null) {
            return unauthorized;
        }
        return ResponseEntity.ok(Map.of(
                "ready", true,
                "profile", toolProfile,
                "tools", toolMetadata(),
                "excludedGroups", List.of(
                        "team creation",
                        "team invitations",
                        "solo expert join requests",
                        "profile/account settings",
                        "community messages",
                        "payments/commercial actions",
                        "broad admin operations"
                )
        ));
    }

    @PostMapping("/mcp")
    public ResponseEntity<Map<String, Object>> mcp(
            @RequestHeader(value = "X-MCP-API-KEY", required = false) String providedApiKey,
            @RequestBody(required = false) Map<String, Object> request
    ) {
        ResponseEntity<Map<String, Object>> unauthorized = unauthorizedIfRequired(providedApiKey);
        if (unauthorized != null) {
            return unauthorized;
        }
        Object id = request == null ? null : request.get("id");
        String method = request == null ? "" : String.valueOf(request.getOrDefault("method", ""));
        if ("initialize".equals(method)) {
            return ResponseEntity.ok(jsonRpc(id, Map.of(
                    "protocolVersion", "2024-11-05",
                    "capabilities", Map.of("tools", Map.of("listChanged", false)),
                    "serverInfo", Map.of("name", "produs-loomai-productization", "version", "1.0.0")
            )));
        }
        if ("tools/list".equals(method)) {
            return ResponseEntity.ok(jsonRpc(id, Map.of("tools", mcpTools())));
        }
        if ("tools/call".equals(method)) {
            return ResponseEntity.ok(jsonRpc(id, toolService.toMcpResult(toolService.call(toolName(request), toolArguments(request)))));
        }
        if ("ping".equals(method)) {
            return ResponseEntity.ok(jsonRpc(id, Map.of()));
        }
        Map<String, Object> error = new LinkedHashMap<>();
        error.put("code", -32601);
        error.put("message", "Method is not available during discovery");

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("jsonrpc", "2.0");
        response.put("id", id);
        response.put("error", error);
        return ResponseEntity.ok(response);
    }

    @SuppressWarnings("unchecked")
    private String toolName(Map<String, Object> request) {
        Object paramsRaw = request == null ? null : request.get("params");
        if (!(paramsRaw instanceof Map<?, ?> params)) {
            return "";
        }
        Object name = params.get("name");
        if (name == null) {
            name = params.get("toolName");
        }
        return name == null ? "" : String.valueOf(name);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> toolArguments(Map<String, Object> request) {
        Object paramsRaw = request == null ? null : request.get("params");
        if (!(paramsRaw instanceof Map<?, ?> params)) {
            return Map.of();
        }
        Object arguments = params.get("arguments");
        if (!(arguments instanceof Map<?, ?> argumentMap)) {
            return Map.of();
        }
        Map<String, Object> typed = new LinkedHashMap<>();
        argumentMap.forEach((key, value) -> {
            if (key != null) {
                typed.put(String.valueOf(key), value);
            }
        });
        return typed;
    }

    private ResponseEntity<Map<String, Object>> unauthorizedIfRequired(String providedApiKey) {
        if (!requireAuth) {
            return null;
        }
        if (apiKey == null || apiKey.isBlank() || providedApiKey == null || providedApiKey.isBlank()
                || !constantTimeEquals(apiKey.trim(), providedApiKey.trim())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "ready", false,
                    "errorCode", "PRODUS_MCP_AUTH_REQUIRED"
            ));
        }
        return null;
    }

    private boolean constantTimeEquals(String expected, String actual) {
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8)
        );
    }

    private Map<String, Object> jsonRpc(Object id, Map<String, Object> result) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("jsonrpc", "2.0");
        response.put("id", id);
        response.put("result", result);
        return response;
    }

    private List<Map<String, Object>> mcpTools() {
        return LoomAIToolAllowlist.tools().stream()
                .map(tool -> {
                    Map<String, Object> schema = new LinkedHashMap<>();
                    schema.put("type", "object");
                    schema.put("additionalProperties", true);

                    Map<String, Object> annotations = new LinkedHashMap<>();
                    annotations.put("mode", tool.mode());
                    annotations.put("confirmationRequired", tool.confirmationRequired());

                    Map<String, Object> value = new LinkedHashMap<>();
                    value.put("name", tool.name());
                    value.put("description", tool.description());
                    value.put("inputSchema", schema);
                    value.put("annotations", annotations);
                    return value;
                })
                .toList();
    }

    private List<Map<String, Object>> toolMetadata() {
        return LoomAIToolAllowlist.tools().stream()
                .map(this::toolMetadata)
                .toList();
    }

    private Map<String, Object> toolMetadata(ToolDefinition tool) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("name", tool.name());
        value.put("mode", tool.mode());
        value.put("confirmationRequired", tool.confirmationRequired());
        value.put("description", tool.description());
        return value;
    }
}
