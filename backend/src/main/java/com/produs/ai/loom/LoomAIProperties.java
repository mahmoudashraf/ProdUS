package com.produs.ai.loom;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "loomai")
public class LoomAIProperties {
    private boolean enabled = false;
    private String environment = "local";
    private String integrationMode = "BACKEND_MEDIATED_PRIVATE_RUNTIME";
    private String authMode = "PRIVATE_RUNTIME_ASSERTION";
    private String baseUrl = "";
    private String apiKey = "";
    private String apiKeyHeaderName = "X-PLATFORM-API-KEY";
    private String runtimeApiKey = "";
    private String runtimeApiKeyHeaderName = "X-AIFABRIC-RUNTIME-API-KEY";
    private String runtimeAuthorizationHeaderName = "X-AIFABRIC-RUNTIME-AUTHORIZATION";
    private String assertionIssuer = "";
    private String assertionAudience = "";
    private String assertionCustomerId = "produs-staging";
    private String assertionTenantId = "";
    private String assertionSigningAlgorithm = "HS256";
    private String assertionSigningSecret = "";
    private String assertionPrivateKeyPath = "";
    private int assertionTtlSeconds = 300;
    private String assertionScopes = "chat:query,chat:suggestions,chat:conversations";
    private String defaultMode = "support_assistant";
    private String defaultPosition = "productization";
    private int timeoutMs = 2500;
    private String assistantSessionPath = "/api/public/chat/session";
    private String assistantQueryPath = "/api/chat/me/query";
    private String assistantSuggestionsPath = "/api/chat/me/suggestions";
    private String authContextPath = "/api/chat/me/auth-context";
    private String dataSyncBatchPath = "/api/ai/data-sync/batch";
    private String dataSyncDeletePath = "/api/ai/data-sync/delete";
    private String safeKnowledgeDatasetId = "produs-safe-knowledge";
    private boolean safeKnowledgeAutoSyncEnabled = false;
    private long safeKnowledgeAutoSyncDelayMs = 300000;
    private long safeKnowledgeAutoSyncInitialDelayMs = 60000;

    public boolean isPlatformBridgeMode() {
        return "PLATFORM_BRIDGE".equalsIgnoreCase(integrationMode)
                || (assistantQueryPath != null && assistantQueryPath.contains("/bridge/chat/"));
    }

    public boolean isPrivateRuntimeMode() {
        return "BACKEND_MEDIATED_PRIVATE_RUNTIME".equalsIgnoreCase(integrationMode)
                || "DIRECT_PRIVATE_RUNTIME".equalsIgnoreCase(integrationMode)
                || isPrivateRuntimeAssertionAuth();
    }

    public boolean isPlatformApiKeyAuth() {
        return "PLATFORM_API_KEY".equalsIgnoreCase(authMode);
    }

    public boolean isPrivateRuntimeAssertionAuth() {
        return "PRIVATE_RUNTIME_ASSERTION".equalsIgnoreCase(authMode);
    }
}
