package com.produs.scanner;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import java.io.IOException;
import java.math.BigInteger;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateCrtKey;
import java.util.Base64;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GitHubAppTokenServiceTest {

    @Test
    void createsInstallationTokenWithBase64Pkcs1PrivateKey() throws Exception {
        KeyPair keyPair = generateRsaKeyPair();
        String pem = pkcs1Pem((RSAPrivateCrtKey) keyPair.getPrivate());
        String keyBase64 = Base64.getEncoder().encodeToString(pem.getBytes(StandardCharsets.UTF_8));

        try (MockGitHubApi api = MockGitHubApi.start("3832326")) {
            ScannerProviderProperties properties = properties(api.baseUrl(), keyBase64);
            GitHubAppTokenService service = new GitHubAppTokenService(properties, new ObjectMapper());

            String token = service.createInstallationToken("123456");

            assertEquals("github-installation-token", token);
            assertTrue(api.authorizationHeader.get().startsWith("Bearer "));
            SignedJWT jwt = SignedJWT.parse(api.authorizationHeader.get().substring("Bearer ".length()));
            assertEquals("3832326", jwt.getJWTClaimsSet().getIssuer());
            assertNotNull(jwt.getJWTClaimsSet().getExpirationTime());
        }
    }

    private ScannerProviderProperties properties(String apiBaseUrl, String privateKeyBase64) {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("app.scanner.providers.github.enabled", "true")
                .withProperty("app.scanner.providers.github.app-id", "3832326")
                .withProperty("app.scanner.providers.github.private-key-base64", privateKeyBase64)
                .withProperty("app.scanner.providers.github.api-base-url", apiBaseUrl);
        ScannerProviderProperties properties = new ScannerProviderProperties(environment);
        properties.applyEnvironmentOverlay();
        return properties;
    }

    private KeyPair generateRsaKeyPair() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        return generator.generateKeyPair();
    }

    private String pkcs1Pem(RSAPrivateCrtKey key) {
        byte[] sequence = sequence(
                integer(BigInteger.ZERO),
                integer(key.getModulus()),
                integer(key.getPublicExponent()),
                integer(key.getPrivateExponent()),
                integer(key.getPrimeP()),
                integer(key.getPrimeQ()),
                integer(key.getPrimeExponentP()),
                integer(key.getPrimeExponentQ()),
                integer(key.getCrtCoefficient())
        );
        return "-----BEGIN RSA PRIVATE KEY-----\n"
                + Base64.getMimeEncoder(64, "\n".getBytes(StandardCharsets.UTF_8)).encodeToString(sequence)
                + "\n-----END RSA PRIVATE KEY-----\n";
    }

    private byte[] sequence(byte[]... parts) {
        return concat(new byte[] { 0x30 }, derLength(totalLength(parts)), concat(parts));
    }

    private byte[] integer(BigInteger value) {
        byte[] bytes = value.toByteArray();
        return concat(new byte[] { 0x02 }, derLength(bytes.length), bytes);
    }

    private int totalLength(byte[]... arrays) {
        int length = 0;
        for (byte[] array : arrays) {
            length += array.length;
        }
        return length;
    }

    private byte[] derLength(int length) {
        if (length < 128) {
            return new byte[] { (byte) length };
        }
        int size = 0;
        int value = length;
        while (value > 0) {
            size++;
            value >>= 8;
        }
        byte[] encoded = new byte[size + 1];
        encoded[0] = (byte) (0x80 | size);
        for (int i = size; i > 0; i--) {
            encoded[i] = (byte) (length & 0xff);
            length >>= 8;
        }
        return encoded;
    }

    private byte[] concat(byte[]... arrays) {
        byte[] result = new byte[totalLength(arrays)];
        int position = 0;
        for (byte[] array : arrays) {
            System.arraycopy(array, 0, result, position, array.length);
            position += array.length;
        }
        return result;
    }

    private record MockGitHubApi(HttpServer server, AtomicReference<String> authorizationHeader) implements AutoCloseable {
        static MockGitHubApi start(String expectedIssuer) throws IOException {
            HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            AtomicReference<String> authorizationHeader = new AtomicReference<>("");
            server.createContext("/app/installations/123456/access_tokens", exchange -> {
                authorizationHeader.set(exchange.getRequestHeaders().getFirst("Authorization"));
                try {
                    assertEquals("POST", exchange.getRequestMethod());
                    assertTrue(authorizationHeader.get().startsWith("Bearer "));
                    SignedJWT jwt = SignedJWT.parse(authorizationHeader.get().substring("Bearer ".length()));
                    assertEquals(expectedIssuer, jwt.getJWTClaimsSet().getIssuer());
                    byte[] response = "{\"token\":\"github-installation-token\"}".getBytes(StandardCharsets.UTF_8);
                    exchange.getResponseHeaders().set("Content-Type", "application/json");
                    exchange.sendResponseHeaders(201, response.length);
                    exchange.getResponseBody().write(response);
                } catch (Exception ex) {
                    byte[] response = ex.getMessage().getBytes(StandardCharsets.UTF_8);
                    exchange.sendResponseHeaders(500, response.length);
                    exchange.getResponseBody().write(response);
                } finally {
                    exchange.close();
                }
            });
            server.start();
            return new MockGitHubApi(server, authorizationHeader);
        }

        String baseUrl() {
            return "http://127.0.0.1:" + server.getAddress().getPort();
        }

        @Override
        public void close() {
            server.stop(0);
        }
    }
}
