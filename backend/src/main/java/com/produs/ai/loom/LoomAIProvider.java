package com.produs.ai.loom;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.produs.ai.PackageGovernanceProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoomAIProvider implements PackageGovernanceProvider {

    private static final String PACKAGE_GOVERNANCE_PATH = "/api/v1/produs/package-governance";

    private final LoomAIProperties properties;
    private final ObjectMapper objectMapper;

    @Override
    public PackageGovernanceResult reviewPackage(PackageGovernanceRequest request) {
        if (!isConfigured()) {
            return fallback("LOOMAI_DISABLED", request.deterministicOutputJson(), request.fallbackConfidence(), null);
        }
        if (properties.isPrivateRuntimeMode()) {
            return fallback("LOOMAI_PRIVATE_RUNTIME_PACKAGE_GOVERNANCE_NOT_CONFIGURED", request.deterministicOutputJson(), request.fallbackConfidence(), null);
        }

        try {
            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "source", "ProdUS",
                    "task", "package_governance",
                    "requirementId", request.requirementId().toString(),
                    "packageId", request.packageId().toString(),
                    "productId", request.productId().toString(),
                    "productName", nullToEmpty(request.productName()),
                    "businessGoal", nullToEmpty(request.businessGoal()),
                    "riskSignals", nullToEmpty(request.riskSignals()),
                    "modules", List.copyOf(request.moduleNames()),
                    "deterministicPackage", parseOrText(request.deterministicOutputJson())
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
            String providerRequestId = firstHeader(response, "X-Request-ID");
            if (response.statusCode() < 200 || response.statusCode() > 299) {
                log.warn("loomai_package_governance_failed status={} packageId={}", response.statusCode(), request.packageId());
                return fallback("LOOMAI_HTTP_" + response.statusCode(), request.deterministicOutputJson(), request.fallbackConfidence(), providerRequestId);
            }
            return fromLoomAIResponse(response.body(), request.deterministicOutputJson(), request.fallbackConfidence(), providerRequestId);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log.warn("loomai_package_governance_interrupted packageId={}", request.packageId());
            return fallback("LOOMAI_INTERRUPTED", request.deterministicOutputJson(), request.fallbackConfidence(), null);
        } catch (Exception exception) {
            log.warn("loomai_package_governance_fallback packageId={} reason={}", request.packageId(), exception.getClass().getSimpleName());
            return fallback("LOOMAI_UNAVAILABLE", request.deterministicOutputJson(), request.fallbackConfidence(), null);
        }
    }

    private PackageGovernanceResult fromLoomAIResponse(String body, String deterministicOutputJson, double fallbackConfidence, String providerRequestId) {
        if (body == null || body.isBlank()) {
            return fallback("LOOMAI_EMPTY_RESPONSE", deterministicOutputJson, fallbackConfidence, providerRequestId);
        }
        try {
            JsonNode root = objectMapper.readTree(body);
            double confidence = root.path("confidence").isNumber() ? root.path("confidence").asDouble() : fallbackConfidence;
            String rationale = root.path("rationale").asText("LoomAI reviewed deterministic package composition and governance signals.");
            ObjectNode output = objectMapper.createObjectNode();
            output.put("provider", "LOOMAI");
            output.put("fallback", false);
            if (providerRequestId != null && !providerRequestId.isBlank()) {
                output.put("providerRequestId", providerRequestId);
            }
            output.set("loomaiResponse", root);
            output.set("deterministicPackage", parseOrText(deterministicOutputJson));
            return new PackageGovernanceResult(
                    "LOOMAI",
                    "loomai-package-governance-v1",
                    confidence,
                    rationale,
                    objectMapper.writeValueAsString(output),
                    false,
                    null,
                    providerRequestId
            );
        } catch (Exception exception) {
            ObjectNode output = baseFallbackOutput("LOOMAI_UNPARSEABLE_RESPONSE", deterministicOutputJson);
            output.put("responseSha256", sha256(body));
            return new PackageGovernanceResult(
                    "RULES_FALLBACK",
                    "rules-v1",
                    fallbackConfidence,
                    "LoomAI response could not be parsed, so ProdUS used deterministic package composition rules.",
                    writeJson(output),
                    true,
                    "LOOMAI_UNPARSEABLE_RESPONSE",
                    providerRequestId
            );
        }
    }

    private PackageGovernanceResult fallback(String reason, String deterministicOutputJson, double confidence, String providerRequestId) {
        ObjectNode output = baseFallbackOutput(reason, deterministicOutputJson);
        if (providerRequestId != null && !providerRequestId.isBlank()) {
            output.put("providerRequestId", providerRequestId);
        }
        return new PackageGovernanceResult(
                "RULES_FALLBACK",
                "rules-v1",
                confidence,
                "Composed a production package from the requested module and required catalog dependencies.",
                writeJson(output),
                true,
                reason,
                providerRequestId
        );
    }

    private ObjectNode baseFallbackOutput(String reason, String deterministicOutputJson) {
        ObjectNode output = objectMapper.createObjectNode();
        output.put("provider", "RULES_FALLBACK");
        output.put("fallback", true);
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

    private String firstHeader(HttpResponse<?> response, String headerName) {
        return response.headers().firstValue(headerName)
                .filter(value -> !value.isBlank())
                .orElse(null);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            return "unavailable";
        }
    }
}
