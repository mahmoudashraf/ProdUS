package com.produs.ai.loom;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.produs.packages.PackageInstance;
import com.produs.requirements.RequirementIntake;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoomAIProvider {

    private static final String PACKAGE_GOVERNANCE_PATH = "/api/v1/produs/package-governance";

    private final LoomAIProperties properties;
    private final ObjectMapper objectMapper;

    public PackageGovernanceResult reviewPackage(
            RequirementIntake requirement,
            PackageInstance packageInstance,
            List<String> moduleNames,
            String deterministicOutputJson,
            double fallbackConfidence
    ) {
        if (!isConfigured()) {
            return fallback("LOOMAI_DISABLED", deterministicOutputJson, fallbackConfidence);
        }

        try {
            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "source", "ProdUS",
                    "task", "package_governance",
                    "requirementId", requirement.getId().toString(),
                    "packageId", packageInstance.getId().toString(),
                    "productName", packageInstance.getProductProfile().getName(),
                    "businessGoal", nullToEmpty(requirement.getBusinessGoal()),
                    "riskSignals", nullToEmpty(requirement.getRiskSignals()),
                    "modules", moduleNames,
                    "deterministicPackage", parseOrText(deterministicOutputJson)
            ));
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(normalizedBaseUrl() + PACKAGE_GOVERNANCE_PATH))
                    .timeout(Duration.ofMillis(properties.getTimeoutMs()))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody));
            if (properties.getApiKey() != null && !properties.getApiKey().isBlank()) {
                requestBuilder.header("Authorization", "Bearer " + properties.getApiKey().trim());
            }
            String requestId = MDC.get("requestId");
            if (requestId != null && !requestId.isBlank()) {
                requestBuilder.header("X-Request-ID", requestId);
            }

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofMillis(properties.getTimeoutMs()))
                    .build();
            HttpResponse<String> response = client.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() > 299) {
                log.warn("loomai_package_governance_failed status={} packageId={}", response.statusCode(), packageInstance.getId());
                return fallback("LOOMAI_HTTP_" + response.statusCode(), deterministicOutputJson, fallbackConfidence);
            }
            return fromLoomAIResponse(response.body(), deterministicOutputJson, fallbackConfidence);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log.warn("loomai_package_governance_interrupted packageId={}", packageInstance.getId());
            return fallback("LOOMAI_INTERRUPTED", deterministicOutputJson, fallbackConfidence);
        } catch (Exception exception) {
            log.warn("loomai_package_governance_fallback packageId={} reason={}", packageInstance.getId(), exception.getClass().getSimpleName());
            return fallback("LOOMAI_UNAVAILABLE", deterministicOutputJson, fallbackConfidence);
        }
    }

    private PackageGovernanceResult fromLoomAIResponse(String body, String deterministicOutputJson, double fallbackConfidence) {
        if (body == null || body.isBlank()) {
            return fallback("LOOMAI_EMPTY_RESPONSE", deterministicOutputJson, fallbackConfidence);
        }
        try {
            JsonNode root = objectMapper.readTree(body);
            double confidence = root.path("confidence").isNumber() ? root.path("confidence").asDouble() : fallbackConfidence;
            String rationale = root.path("rationale").asText("LoomAI reviewed deterministic package composition and governance signals.");
            return new PackageGovernanceResult(
                    "LOOMAI",
                    "loomai-package-governance-v1",
                    confidence,
                    rationale,
                    objectMapper.writeValueAsString(root),
                    false
            );
        } catch (Exception exception) {
            ObjectNode output = baseFallbackOutput("LOOMAI_UNPARSEABLE_RESPONSE", deterministicOutputJson);
            output.put("rawLoomAIResponse", body);
            return new PackageGovernanceResult(
                    "RULES_FALLBACK",
                    "rules-v1",
                    fallbackConfidence,
                    "LoomAI response could not be parsed, so ProdUS used deterministic package composition rules.",
                    writeJson(output),
                    true
            );
        }
    }

    private PackageGovernanceResult fallback(String reason, String deterministicOutputJson, double confidence) {
        ObjectNode output = baseFallbackOutput(reason, deterministicOutputJson);
        return new PackageGovernanceResult(
                "RULES_FALLBACK",
                "rules-v1",
                confidence,
                "Composed a production package from the requested module and required catalog dependencies.",
                writeJson(output),
                true
        );
    }

    private ObjectNode baseFallbackOutput(String reason, String deterministicOutputJson) {
        ObjectNode output = objectMapper.createObjectNode();
        output.put("provider", "RULES_FALLBACK");
        output.put("fallbackReason", reason);
        output.set("deterministicPackage", parseOrText(deterministicOutputJson));
        return output;
    }

    private JsonNode parseOrText(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (Exception exception) {
            ObjectNode text = objectMapper.createObjectNode();
            text.put("raw", json == null ? "" : json);
            return text;
        }
    }

    private String writeJson(ObjectNode node) {
        try {
            return objectMapper.writeValueAsString(node);
        } catch (Exception exception) {
            return "{\"provider\":\"RULES_FALLBACK\",\"fallbackReason\":\"JSON_WRITE_FAILED\"}";
        }
    }

    private boolean isConfigured() {
        return properties.isEnabled()
                && properties.getBaseUrl() != null
                && !properties.getBaseUrl().isBlank();
    }

    private String normalizedBaseUrl() {
        String baseUrl = properties.getBaseUrl().trim();
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    public record PackageGovernanceResult(
            String provider,
            String promptVersion,
            double confidence,
            String rationale,
            String outputJson,
            boolean fallback
    ) {}
}
