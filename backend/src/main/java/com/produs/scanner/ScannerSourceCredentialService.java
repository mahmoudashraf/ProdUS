package com.produs.scanner;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.URI;

@Service
@RequiredArgsConstructor
public class ScannerSourceCredentialService {

    private final GitHubAppTokenService gitHubAppTokenService;

    public String cloneReferenceFor(ScanSource source) {
        if (source == null || source.getExternalReference() == null || source.getExternalReference().isBlank()) {
            return null;
        }
        if (source.getProviderType() != ScanSource.ProviderType.GITHUB || source.getExternalInstallationId() == null || source.getExternalInstallationId().isBlank()) {
            return source.getExternalReference();
        }
        String token = gitHubAppTokenService.createInstallationToken(source.getExternalInstallationId());
        return withGithubToken(source.getExternalReference(), token);
    }

    private String withGithubToken(String cloneUrl, String token) {
        URI uri = URI.create(cloneUrl);
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || !uri.getHost().endsWith("github.com")) {
            return cloneUrl;
        }
        String path = uri.getRawPath() == null ? "" : uri.getRawPath();
        return "https://x-access-token:" + token + "@" + uri.getHost() + path;
    }
}
