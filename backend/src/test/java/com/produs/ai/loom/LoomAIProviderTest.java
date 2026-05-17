package com.produs.ai.loom;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.ai.PackageGovernanceProvider;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;

class LoomAIProviderTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void disabledProviderReturnsDeterministicFallback() {
        LoomAIProperties properties = new LoomAIProperties();
        properties.setEnabled(false);
        LoomAIProvider provider = new LoomAIProvider(properties, objectMapper);

        PackageGovernanceProvider.PackageGovernanceResult result = provider.reviewPackage(request());

        assertThat(result.provider()).isEqualTo("RULES_FALLBACK");
        assertThat(result.fallback()).isTrue();
        assertThat(result.fallbackReason()).isEqualTo("LOOMAI_DISABLED");
        assertThat(result.outputJson()).contains("DETERMINISTIC_CATALOG");
    }

    @Test
    void successfulResponseReturnsLoomAITraceWithoutChangingPackageAuthority() throws IOException {
        HttpServer server = startServer(200, """
                {
                  "confidence": 0.91,
                  "rationale": "Governance review confirms dependency coverage and evidence needs.",
                  "riskLevel": "LOW",
                  "sourceRefs": ["deterministicPackage.modules"]
                }
                """, Duration.ZERO);
        try {
            LoomAIProvider provider = new LoomAIProvider(propertiesFor(server, 1000), objectMapper);

            PackageGovernanceProvider.PackageGovernanceResult result = provider.reviewPackage(request());

            assertThat(result.provider()).isEqualTo("LOOMAI");
            assertThat(result.fallback()).isFalse();
            assertThat(result.confidence()).isEqualTo(0.91);
            assertThat(result.providerRequestId()).isEqualTo("loom-test-request");
            assertThat(result.outputJson()).contains("loomaiResponse", "deterministicPackage");
        } finally {
            server.stop(0);
        }
    }

    @Test
    void nonSuccessResponseFallsBackWithProviderRequestId() throws IOException {
        HttpServer server = startServer(500, "{\"error\":\"unavailable\"}", Duration.ZERO);
        try {
            LoomAIProvider provider = new LoomAIProvider(propertiesFor(server, 1000), objectMapper);

            PackageGovernanceProvider.PackageGovernanceResult result = provider.reviewPackage(request());

            assertThat(result.provider()).isEqualTo("RULES_FALLBACK");
            assertThat(result.fallbackReason()).isEqualTo("LOOMAI_HTTP_500");
            assertThat(result.providerRequestId()).isEqualTo("loom-test-request");
        } finally {
            server.stop(0);
        }
    }

    @Test
    void unparsableResponseDoesNotPersistRawProviderBody() throws IOException {
        HttpServer server = startServer(200, "provider sent non-json body with possibly sensitive text", Duration.ZERO);
        try {
            LoomAIProvider provider = new LoomAIProvider(propertiesFor(server, 1000), objectMapper);

            PackageGovernanceProvider.PackageGovernanceResult result = provider.reviewPackage(request());

            assertThat(result.provider()).isEqualTo("RULES_FALLBACK");
            assertThat(result.fallbackReason()).isEqualTo("LOOMAI_UNPARSEABLE_RESPONSE");
            assertThat(result.outputJson()).contains("responseSha256");
            assertThat(result.outputJson()).doesNotContain("possibly sensitive text");
        } finally {
            server.stop(0);
        }
    }

    @Test
    void timeoutFallsBackWithoutBreakingPackageBuild() throws IOException {
        HttpServer server = startServer(200, "{\"confidence\":0.9}", Duration.ofMillis(300));
        try {
            LoomAIProvider provider = new LoomAIProvider(propertiesFor(server, 50), objectMapper);

            PackageGovernanceProvider.PackageGovernanceResult result = provider.reviewPackage(request());

            assertThat(result.provider()).isEqualTo("RULES_FALLBACK");
            assertThat(result.fallbackReason()).isEqualTo("LOOMAI_UNAVAILABLE");
        } finally {
            server.stop(0);
        }
    }

    private PackageGovernanceProvider.PackageGovernanceRequest request() {
        return new PackageGovernanceProvider.PackageGovernanceRequest(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                "Payments Hub",
                "Prepare for production",
                "Security and deployment evidence incomplete",
                List.of("Validation", "Security"),
                "{\"mode\":\"DETERMINISTIC_CATALOG\"}",
                0.86
        );
    }

    private LoomAIProperties propertiesFor(HttpServer server, int timeoutMs) {
        LoomAIProperties properties = new LoomAIProperties();
        properties.setEnabled(true);
        properties.setBaseUrl("http://127.0.0.1:" + server.getAddress().getPort());
        properties.setApiKey("test-key");
        properties.setTimeoutMs(timeoutMs);
        return properties;
    }

    private HttpServer startServer(int status, String body, Duration delay) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/v1/produs/package-governance", exchange -> {
            if (!"Bearer test-key".equals(exchange.getRequestHeaders().getFirst("Authorization"))) {
                exchange.sendResponseHeaders(401, 0);
                exchange.close();
                return;
            }
            if (!delay.isZero()) {
                try {
                    Thread.sleep(delay.toMillis());
                } catch (InterruptedException interruptedException) {
                    Thread.currentThread().interrupt();
                }
            }
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.getResponseHeaders().add("X-Request-ID", "loom-test-request");
            exchange.sendResponseHeaders(status, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.setExecutor(Executors.newCachedThreadPool());
        server.start();
        return server;
    }
}
