package com.produs.platform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.ai.loom.LoomAIProperties;
import com.produs.ai.loom.LoomAIRuntimeAssertionService;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class LoomAIRuntimeAssertionServiceTest {

    private static final String SIGNING_SECRET = "test-signing-secret-with-more-than-32-bytes";

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void anonymousAssertionUsesSessionAsSubjectAndSignsRpa1Payload() throws Exception {
        LoomAIProperties properties = new LoomAIProperties();
        properties.setRuntimeApiKey("runtime-key");
        properties.setAssertionIssuer("produs-staging-backend");
        properties.setAssertionAudience("dep-7706fafb");
        properties.setAssertionCustomerId("produs-staging");
        properties.setAssertionSigningSecret(SIGNING_SECRET);

        LoomAIRuntimeAssertionService service = new LoomAIRuntimeAssertionService(properties, objectMapper);

        String token = service.createAssertion(null, "produs-ui-session-123");

        String[] segments = token.split("\\.");
        assertThat(segments).hasSize(3);
        assertThat(segments[0]).isEqualTo("rpa1");
        assertThat(segments[2]).isEqualTo(signature(segments[1]));

        JsonNode payload = objectMapper.readTree(Base64.getUrlDecoder().decode(segments[1]));
        assertThat(payload.path("sub").asText()).isEqualTo("produs-ui-session-123");
        assertThat(payload.path("sessionId").asText()).isEqualTo("produs-ui-session-123");
        assertThat(payload.path("subjectType").asText()).isEqualTo("ANONYMOUS_SESSION");
        assertThat(payload.path("deploymentId").asText()).isEqualTo("dep-7706fafb");
        assertThat(payload.path("customerId").asText()).isEqualTo("produs-staging");
        assertThat(payload.path("iat").isTextual()).isTrue();
        assertThat(payload.path("exp").isTextual()).isTrue();
        assertThat(Instant.parse(payload.path("exp").asText())).isAfter(Instant.parse(payload.path("iat").asText()));
        assertThat(payload.path("scopes").toString()).contains("chat:query", "chat:suggestions", "chat:conversations");
    }

    @Test
    void systemAssertionUsesSystemSubjectAndRequestedScopes() throws Exception {
        LoomAIProperties properties = new LoomAIProperties();
        properties.setRuntimeApiKey("runtime-key");
        properties.setAssertionIssuer("produs-staging-backend");
        properties.setAssertionAudience("dep-7706fafb");
        properties.setAssertionCustomerId("produs-staging");
        properties.setAssertionSigningSecret(SIGNING_SECRET);

        LoomAIRuntimeAssertionService service = new LoomAIRuntimeAssertionService(properties, objectMapper);

        String token = service.createSystemAssertion(
                "system:produs-safe-knowledge-sync",
                "produs-safe-knowledge-sync",
                List.of("data-sync:upsert")
        );

        String[] segments = token.split("\\.");
        assertThat(segments).hasSize(3);
        assertThat(segments[0]).isEqualTo("rpa1");
        assertThat(segments[2]).isEqualTo(signature(segments[1]));

        JsonNode payload = objectMapper.readTree(Base64.getUrlDecoder().decode(segments[1]));
        assertThat(payload.path("sub").asText()).isEqualTo("system:produs-safe-knowledge-sync");
        assertThat(payload.path("sessionId").asText()).isEqualTo("produs-safe-knowledge-sync");
        assertThat(payload.path("subjectType").asText()).isEqualTo("SYSTEM_PROCESS");
        assertThat(payload.path("callerType").asText()).isEqualTo("SYSTEM_PROCESS");
        assertThat(payload.path("scopes").toString()).contains("data-sync:upsert");
        assertThat(payload.path("scopes").toString()).doesNotContain("chat:query");
        assertThat(payload.path("exp").isTextual()).isTrue();
    }

    private String signature(String payloadSegment) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(SIGNING_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(payloadSegment.getBytes(StandardCharsets.UTF_8)));
    }
}
