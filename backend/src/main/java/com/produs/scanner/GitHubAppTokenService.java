package com.produs.scanner;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;

@Service
@RequiredArgsConstructor
public class GitHubAppTokenService {

    private final ScannerProviderProperties providerProperties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public boolean isConfigured() {
        ScannerProviderProperties.GitHub github = providerProperties.getGithub();
        return github.isEnabled()
                && !blank(github.getAppId())
                && !blank(github.getPrivateKeyPath())
                && Files.isRegularFile(Path.of(github.getPrivateKeyPath()));
    }

    public String createInstallationToken(String installationId) {
        if (blank(installationId)) {
            throw new IllegalArgumentException("GitHub installation id is required");
        }
        if (!isConfigured()) {
            throw new IllegalStateException("GitHub App credentials are not configured");
        }
        try {
            String jwt = createAppJwt();
            String baseUrl = providerProperties.getGithub().getApiBaseUrl();
            String normalized = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(normalized + "/app/installations/" + installationId + "/access_tokens"))
                    .timeout(Duration.ofSeconds(10))
                    .header("Accept", "application/vnd.github+json")
                    .header("Authorization", "Bearer " + jwt)
                    .header("X-GitHub-Api-Version", "2022-11-28")
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("GitHub installation token request failed with HTTP " + response.statusCode());
            }
            JsonNode body = objectMapper.readTree(response.body());
            String token = body.path("token").asText();
            if (blank(token)) {
                throw new IllegalStateException("GitHub installation token response did not include a token");
            }
            return token;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("GitHub installation token request interrupted", ex);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to create GitHub installation token", ex);
        }
    }

    private String createAppJwt() throws Exception {
        ScannerProviderProperties.GitHub github = providerProperties.getGithub();
        Instant now = Instant.now();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .issuer(github.getAppId())
                .issueTime(Date.from(now.minusSeconds(30)))
                .expirationTime(Date.from(now.plusSeconds(540)))
                .build();
        JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.RS256)
                .type(JOSEObjectType.JWT)
                .build();
        SignedJWT jwt = new SignedJWT(header, claims);
        jwt.sign(new RSASSASigner(readPrivateKey(github.getPrivateKeyPath())));
        return jwt.serialize();
    }

    private RSAPrivateKey readPrivateKey(String path) throws Exception {
        String pem = Files.readString(Path.of(path), StandardCharsets.UTF_8)
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        byte[] decoded = Base64.getDecoder().decode(pem);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decoded);
        return (RSAPrivateKey) KeyFactory.getInstance("RSA").generatePrivate(spec);
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
