package com.produs.scanner;

import com.produs.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/scanner/connectors")
@RequiredArgsConstructor
public class ScannerConnectorController {

    private final ScannerProviderConnectorService connectorService;
    private final ScannerService scannerService;

    @GetMapping
    public List<ScannerProviderConnectorService.ConnectorInstallationResponse> listInstallations(@AuthenticationPrincipal User user) {
        return connectorService.listInstallations(user);
    }

    @PostMapping("/github/install-url")
    public ScannerProviderConnectorService.ConnectorInstallUrlResponse githubInstallUrl(
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) ScannerProviderConnectorService.ConnectorInstallUrlRequest request
    ) {
        return connectorService.githubInstallUrl(user, request);
    }

    @GetMapping("/github/callback")
    public ScannerProviderConnectorService.ConnectorInstallationResponse githubCallback(
            @AuthenticationPrincipal User user,
            @RequestParam("installation_id") String installationId,
            @RequestParam(value = "setup_action", required = false) String setupAction,
            @RequestParam("state") String state,
            @RequestParam(value = "account", required = false) String accountLogin,
            @RequestParam(value = "account_type", required = false) String accountType
    ) {
        return connectorService.githubCallback(user, new ScannerProviderConnectorService.GitHubCallbackRequest(
                installationId,
                setupAction,
                state,
                accountLogin,
                accountType,
                "{}"
        ));
    }

    @PostMapping("/github/sources")
    public ScannerService.ScanSourceResponse createGitHubSource(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ScannerProviderConnectorService.CreateProviderSourceRequest request
    ) {
        return connectorService.createGitHubSource(user, request, scannerService);
    }

    @PostMapping("/github/webhook")
    public ScannerProviderConnectorService.WebhookResultResponse githubWebhook(
            @RequestHeader(value = "X-GitHub-Event", required = false, defaultValue = "unknown") String event,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestBody(required = false) String payload
    ) {
        return connectorService.handleGithubWebhook(event, signature, payload);
    }

    @PostMapping("/gitlab/install-url")
    public ScannerProviderConnectorService.ConnectorInstallUrlResponse gitlabInstallUrl(
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) ScannerProviderConnectorService.ConnectorInstallUrlRequest request
    ) {
        return connectorService.gitlabInstallUrl(user, request);
    }

    @GetMapping("/gitlab/callback")
    public ScannerProviderConnectorService.ConnectorInstallationResponse gitlabCallback(
            @AuthenticationPrincipal User user,
            @RequestParam("code") String code,
            @RequestParam("state") String state,
            @RequestParam(value = "project_or_group_id", required = false) String projectOrGroupId,
            @RequestParam(value = "account_path", required = false) String accountPath
    ) {
        return connectorService.gitlabCallback(user, new ScannerProviderConnectorService.GitLabCallbackRequest(
                code,
                state,
                projectOrGroupId,
                accountPath
        ));
    }

    @PostMapping("/gitlab/sources")
    public ScannerService.ScanSourceResponse createGitLabSource(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ScannerProviderConnectorService.CreateProviderSourceRequest request
    ) {
        return connectorService.createGitLabSource(user, request, scannerService);
    }

    @PostMapping("/gitlab/webhook")
    public ScannerProviderConnectorService.WebhookResultResponse gitlabWebhook(
            @RequestHeader(value = "X-Gitlab-Event", required = false, defaultValue = "unknown") String event,
            @RequestHeader(value = "X-Gitlab-Token", required = false) String token,
            @RequestBody(required = false) String payload
    ) {
        return connectorService.handleGitlabWebhook(event, token, payload);
    }
}
