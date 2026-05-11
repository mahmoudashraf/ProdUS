package com.produs.commerce;

import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@Component
public class WebhookSignatureVerifier {

    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final String SIGNATURE_PREFIX = "sha256=";

    public boolean verify(String payload, String signatureHeader, String secret) {
        if (secret == null || secret.isBlank()) {
            return false;
        }
        if (signatureHeader == null || !signatureHeader.startsWith(SIGNATURE_PREFIX)) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
            byte[] expected = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            byte[] supplied = HexFormat.of().parseHex(signatureHeader.substring(SIGNATURE_PREFIX.length()));
            return MessageDigest.isEqual(expected, supplied);
        } catch (Exception exception) {
            return false;
        }
    }
}
