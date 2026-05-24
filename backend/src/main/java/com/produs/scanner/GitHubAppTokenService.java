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
                && hasConfiguredPrivateKey(github);
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
        jwt.sign(new RSASSASigner(readPrivateKey(github)));
        return jwt.serialize();
    }

    private boolean hasConfiguredPrivateKey(ScannerProviderProperties.GitHub github) {
        if (!blank(github.getPrivateKeyBase64())) {
            return true;
        }
        return !blank(github.getPrivateKeyPath()) && Files.isRegularFile(Path.of(github.getPrivateKeyPath()));
    }

    private RSAPrivateKey readPrivateKey(ScannerProviderProperties.GitHub github) throws Exception {
        String pem = !blank(github.getPrivateKeyBase64())
                ? new String(Base64.getDecoder().decode(github.getPrivateKeyBase64()), StandardCharsets.UTF_8)
                : Files.readString(Path.of(github.getPrivateKeyPath()), StandardCharsets.UTF_8);
        byte[] decoded = decodePrivateKey(pem);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decoded);
        return (RSAPrivateKey) KeyFactory.getInstance("RSA").generatePrivate(spec);
    }

    private byte[] decodePrivateKey(String pem) {
        if (pem.contains("-----BEGIN RSA PRIVATE KEY-----")) {
            return wrapPkcs1RsaPrivateKey(extractPemBlock(pem, "RSA PRIVATE KEY"));
        }
        if (pem.contains("-----BEGIN PRIVATE KEY-----")) {
            return extractPemBlock(pem, "PRIVATE KEY");
        }
        return Base64.getDecoder().decode(pem.replaceAll("\\s", ""));
    }

    private byte[] extractPemBlock(String pem, String type) {
        return Base64.getDecoder().decode(pem
                .replace("-----BEGIN " + type + "-----", "")
                .replace("-----END " + type + "-----", "")
                .replaceAll("\\s", ""));
    }

    private byte[] wrapPkcs1RsaPrivateKey(byte[] pkcs1) {
        byte[] version = new byte[] { 0x02, 0x01, 0x00 };
        byte[] rsaAlgorithmIdentifier = new byte[] {
                0x30, 0x0d,
                0x06, 0x09,
                0x2a, (byte) 0x86, 0x48, (byte) 0x86, (byte) 0xf7, 0x0d, 0x01, 0x01, 0x01,
                0x05, 0x00
        };
        byte[] privateKeyOctetString = concat(new byte[] { 0x04 }, derLength(pkcs1.length), pkcs1);
        byte[] privateKeyInfo = concat(version, rsaAlgorithmIdentifier, privateKeyOctetString);
        return concat(new byte[] { 0x30 }, derLength(privateKeyInfo.length), privateKeyInfo);
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
        int length = 0;
        for (byte[] array : arrays) {
            length += array.length;
        }
        byte[] result = new byte[length];
        int position = 0;
        for (byte[] array : arrays) {
            System.arraycopy(array, 0, result, position, array.length);
            position += array.length;
        }
        return result;
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
