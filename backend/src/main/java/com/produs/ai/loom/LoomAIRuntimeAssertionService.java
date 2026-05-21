package com.produs.ai.loom;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LoomAIRuntimeAssertionService {

    private final LoomAIProperties properties;
    private final ObjectMapper objectMapper;

    public boolean isConfigured() {
        if (!properties.isPrivateRuntimeAssertionAuth()) {
            return true;
        }
        return !blank(properties.getRuntimeApiKey())
                && !blank(properties.getAssertionIssuer())
                && !blank(properties.getAssertionAudience())
                && !blank(properties.getAssertionCustomerId())
                && signingMaterialConfigured();
    }

    public String createAssertion(User user, String conversationId) {
        return createAssertion(user, conversationId, null);
    }

    public String createAssertion(User user, String conversationId, List<String> requestedScopes) {
        if (!properties.isPrivateRuntimeAssertionAuth()) {
            throw new IllegalStateException("Private runtime assertion auth is not enabled");
        }
        if (!isConfigured()) {
            throw new IllegalStateException("Private runtime assertion signing is not configured");
        }
        try {
            Instant now = Instant.now();
            String sessionId = user == null
                    ? safeSessionId(conversationId, "anonymous-" + UUID.randomUUID())
                    : safeSessionId(conversationId, stableSubject(user));
            String subject = user == null ? sessionId : stableSubject(user);
            Map<String, Object> payload = assertionPayload(
                    subject,
                    user == null ? "ANONYMOUS_SESSION" : "END_USER",
                    "TRUSTED_BACKEND",
                    sessionId,
                    scopes(requestedScopes),
                    now
            );

            String payloadSegment = base64Url(objectMapper.writeValueAsBytes(payload));
            String signatureSegment = base64Url(hmacSha256(payloadSegment));
            return "rpa1." + payloadSegment + "." + signatureSegment;
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to create LoomAI private runtime assertion", exception);
        }
    }

    public String createSystemAssertion(String subjectId, String sessionId, List<String> requestedScopes) {
        if (!properties.isPrivateRuntimeAssertionAuth()) {
            throw new IllegalStateException("Private runtime assertion auth is not enabled");
        }
        if (!isConfigured()) {
            throw new IllegalStateException("Private runtime assertion signing is not configured");
        }
        if (blank(subjectId)) {
            throw new IllegalArgumentException("System assertion subject is required");
        }
        try {
            Instant now = Instant.now();
            Map<String, Object> payload = assertionPayload(
                    subjectId.trim(),
                    "SYSTEM_PROCESS",
                    "SYSTEM_PROCESS",
                    safeSessionId(sessionId, subjectId.trim()),
                    scopes(requestedScopes),
                    now
            );
            String payloadSegment = base64Url(objectMapper.writeValueAsBytes(payload));
            String signatureSegment = base64Url(hmacSha256(payloadSegment));
            return "rpa1." + payloadSegment + "." + signatureSegment;
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to create LoomAI private runtime system assertion", exception);
        }
    }

    private Map<String, Object> assertionPayload(String subject, String subjectType, String callerType, String sessionId, List<String> scopes, Instant now) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", subject);
        payload.put("subjectType", subjectType);
        payload.put("authMode", "PRIVATE_RUNTIME_BACKEND_MEDIATED");
        payload.put("callerType", callerType);
        payload.put("sessionId", sessionId);
        payload.put("deploymentId", properties.getAssertionAudience().trim());
        payload.put("customerId", properties.getAssertionCustomerId().trim());
        if (!blank(properties.getAssertionTenantId())) {
            payload.put("tenantId", properties.getAssertionTenantId().trim());
        }
        payload.put("iss", properties.getAssertionIssuer().trim());
        payload.put("aud", properties.getAssertionAudience().trim());
        payload.put("iat", now.toString());
        payload.put("exp", now.plusSeconds(Math.max(30, properties.getAssertionTtlSeconds())).toString());
        payload.put("jti", UUID.randomUUID().toString());
        payload.put("scopes", scopes);
        return payload;
    }

    private boolean signingMaterialConfigured() {
        return "HS256".equals(signingAlgorithm())
                && !blank(properties.getAssertionSigningSecret())
                && properties.getAssertionSigningSecret().getBytes(StandardCharsets.UTF_8).length >= 32;
    }

    private String signingAlgorithm() {
        return blank(properties.getAssertionSigningAlgorithm())
                ? "HS256"
                : properties.getAssertionSigningAlgorithm().trim().toUpperCase();
    }

    private String stableSubject(User user) {
        if (!blank(user.getSupabaseId())) {
            return user.getSupabaseId();
        }
        return user.getId() == null ? user.getEmail() : user.getId().toString();
    }

    private String safeSessionId(String sessionId, String subject) {
        if (!blank(sessionId)) {
            return sessionId.trim();
        }
        return "produs-" + subject;
    }

    private List<String> scopes(List<String> requestedScopes) {
        if (requestedScopes != null && !requestedScopes.isEmpty()) {
            List<String> scopes = requestedScopes.stream()
                    .map(value -> value == null ? "" : value.trim())
                    .filter(value -> !value.isBlank())
                    .distinct()
                    .toList();
            if (!scopes.isEmpty()) {
                return scopes;
            }
        }
        if (blank(properties.getAssertionScopes())) {
            return List.of("chat:query", "chat:suggestions", "chat:conversations");
        }
        return Arrays.stream(properties.getAssertionScopes().split("[,\\s]+"))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .toList();
    }

    private byte[] hmacSha256(String payloadSegment) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(properties.getAssertionSigningSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return mac.doFinal(payloadSegment.getBytes(StandardCharsets.UTF_8));
    }

    private String base64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
