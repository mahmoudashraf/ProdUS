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
    private String baseUrl = "";
    private String apiKey = "";
    private int timeoutMs = 2500;
    private String assistantSessionPath = "/api/public/chat/session";
    private String assistantQueryPath = "/api/chat/me/query";
    private String assistantSuggestionsPath = "/api/chat/me/suggestions";
    private String dataSyncBatchPath = "/api/ai/data-sync/batch";
    private String dataSyncDeletePath = "/api/ai/data-sync/delete";
}
