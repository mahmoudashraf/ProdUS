package com.produs.scanner;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.scanner.providers")
public class ScannerProviderProperties {
    private GitHub github = new GitHub();
    private GitLab gitlab = new GitLab();
    private final Environment environment;

    public ScannerProviderProperties(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    void applyEnvironmentOverlay() {
        github.setEnabled(bool("app.scanner.providers.github.enabled", github.isEnabled()));
        github.setAppId(text("app.scanner.providers.github.app-id", github.getAppId()));
        github.setClientId(text("app.scanner.providers.github.client-id", github.getClientId()));
        github.setClientSecret(text("app.scanner.providers.github.client-secret", github.getClientSecret()));
        github.setPrivateKeyPath(text("app.scanner.providers.github.private-key-path", github.getPrivateKeyPath()));
        github.setPrivateKeyBase64(text("app.scanner.providers.github.private-key-base64", github.getPrivateKeyBase64()));
        github.setWebhookSecret(text("app.scanner.providers.github.webhook-secret", github.getWebhookSecret()));
        github.setInstallUrl(text("app.scanner.providers.github.install-url", github.getInstallUrl()));
        github.setCallbackUrl(text("app.scanner.providers.github.callback-url", github.getCallbackUrl()));
        github.setApiBaseUrl(text("app.scanner.providers.github.api-base-url", github.getApiBaseUrl()));

        gitlab.setEnabled(bool("app.scanner.providers.gitlab.enabled", gitlab.isEnabled()));
        gitlab.setClientId(text("app.scanner.providers.gitlab.client-id", gitlab.getClientId()));
        gitlab.setClientSecret(text("app.scanner.providers.gitlab.client-secret", gitlab.getClientSecret()));
        gitlab.setRedirectUri(text("app.scanner.providers.gitlab.redirect-uri", gitlab.getRedirectUri()));
        gitlab.setWebhookSecret(text("app.scanner.providers.gitlab.webhook-secret", gitlab.getWebhookSecret()));
        gitlab.setBaseUrl(text("app.scanner.providers.gitlab.base-url", gitlab.getBaseUrl()));
    }

    private String text(String key, String fallback) {
        return environment.getProperty(key, fallback);
    }

    private boolean bool(String key, boolean fallback) {
        return environment.getProperty(key, Boolean.class, fallback);
    }

    @Getter
    @Setter
    public static class GitHub {
        private boolean enabled = false;
        private String appId = "";
        private String clientId = "";
        private String clientSecret = "";
        private String privateKeyPath = "";
        private String privateKeyBase64 = "";
        private String webhookSecret = "";
        private String installUrl = "";
        private String callbackUrl = "";
        private String apiBaseUrl = "https://api.github.com";
    }

    @Getter
    @Setter
    public static class GitLab {
        private boolean enabled = false;
        private String clientId = "";
        private String clientSecret = "";
        private String redirectUri = "";
        private String webhookSecret = "";
        private String baseUrl = "https://gitlab.com";
    }
}
