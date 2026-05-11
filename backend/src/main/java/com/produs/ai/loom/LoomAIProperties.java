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
    private String baseUrl = "";
    private String apiKey = "";
    private int timeoutMs = 2500;
}
