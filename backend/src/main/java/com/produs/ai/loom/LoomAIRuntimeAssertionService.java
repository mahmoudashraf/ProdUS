package com.produs.ai.loom;

import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.produs.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoomAIRuntimeAssertionService {

    private final LoomAIProperties properties;

    public boolean isConfigured() {
        if (!properties.isPrivateRuntimeAssertionAuth()) {
            return true;
        }
        return !blank(properties.getRuntimeApiKey())
                && !blank(properties.getAssertionIssuer())
                && !blank(properties.getAssertionAudience())
                && signingMaterialConfigured();
    }

    public String createAssertion(User user, String sessionId) {
        if (!properties.isPrivateRuntimeAssertionAuth()) {
            throw new IllegalStateException("Private runtime assertion auth is not enabled");
        }
        if (!isConfigured()) {
            throw new IllegalStateException("Private runtime assertion signing is not configured");
        }
        try {
            Instant now = Instant.now();
            String subject = stableSubject(user);
            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                    .issuer(properties.getAssertionIssuer())
                    .audience(properties.getAssertionAudience())
                    .subject(subject)
                    .jwtID(java.util.UUID.randomUUID().toString())
                    .issueTime(Date.from(now.minusSeconds(5)))
                    .expirationTime(Date.from(now.plusSeconds(Math.max(30, properties.getAssertionTtlSeconds()))))
                    .claim("sid", safeSessionId(sessionId, subject))
                    .claim("sessionId", safeSessionId(sessionId, subject))
                    .claim("scopes", scopes())
                    .claim("actorRole", user.getRole().name())
                    .claim("environment", properties.getEnvironment())
                    .build();

            SignedJWT jwt = new SignedJWT(
                    new JWSHeader.Builder(algorithm()).type(JOSEObjectType.JWT).build(),
                    claims
            );
            if (algorithm().getName().startsWith("HS")) {
                jwt.sign(new MACSigner(properties.getAssertionSigningSecret().getBytes(StandardCharsets.UTF_8)));
            } else {
                jwt.sign(new RSASSASigner(readPrivateKey(properties.getAssertionPrivateKeyPath())));
            }
            return jwt.serialize();
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to create LoomAI private runtime assertion", exception);
        }
    }

    private boolean signingMaterialConfigured() {
        if (algorithm().getName().startsWith("HS")) {
            return !blank(properties.getAssertionSigningSecret())
                    && properties.getAssertionSigningSecret().getBytes(StandardCharsets.UTF_8).length >= 32;
        }
        return !blank(properties.getAssertionPrivateKeyPath())
                && Files.isRegularFile(Path.of(properties.getAssertionPrivateKeyPath()));
    }

    private JWSAlgorithm algorithm() {
        String value = blank(properties.getAssertionSigningAlgorithm())
                ? "HS256"
                : properties.getAssertionSigningAlgorithm().trim().toUpperCase();
        return switch (value) {
            case "RS256" -> JWSAlgorithm.RS256;
            case "RS384" -> JWSAlgorithm.RS384;
            case "RS512" -> JWSAlgorithm.RS512;
            case "HS384" -> JWSAlgorithm.HS384;
            case "HS512" -> JWSAlgorithm.HS512;
            default -> JWSAlgorithm.HS256;
        };
    }

    private RSAPrivateKey readPrivateKey(String path) throws Exception {
        String pem = Files.readString(Path.of(path), StandardCharsets.UTF_8)
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace("-----BEGIN RSA PRIVATE KEY-----", "")
                .replace("-----END RSA PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        byte[] decoded = Base64.getDecoder().decode(pem);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decoded);
        return (RSAPrivateKey) KeyFactory.getInstance("RSA").generatePrivate(spec);
    }

    private String stableSubject(User user) {
        if (!blank(user.getSupabaseId())) {
            return user.getSupabaseId();
        }
        return user.getId() == null ? user.getEmail() : user.getId().toString();
    }

    private String safeSessionId(String sessionId, String subject) {
        if (!blank(sessionId)) {
            return sessionId;
        }
        return "produs-" + subject;
    }

    private List<String> scopes() {
        if (blank(properties.getAssertionScopes())) {
            return List.of("chat:read");
        }
        return Arrays.stream(properties.getAssertionScopes().split("[,\\s]+"))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .toList();
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
