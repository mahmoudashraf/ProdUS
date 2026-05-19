package com.produs.mcp;

import com.produs.ai.LoomAIToolAllowlist;
import com.produs.ai.LoomAIToolAllowlist.ToolDefinition;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
public class LoomAIMcpDiscoveryController {

    @GetMapping("/loomai/tool-allowlist")
    public ResponseEntity<Map<String, Object>> allowlist() {
        return ResponseEntity.ok(Map.of(
                "ready", true,
                "profile", "loomai-productization",
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
    public ResponseEntity<Map<String, Object>> mcp(@RequestBody(required = false) Map<String, Object> request) {
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
