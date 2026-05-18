package com.produs.scanner;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.audit.AuditEvent;
import com.produs.entity.User;
import com.produs.exception.ResourceNotFoundException;
import com.produs.product.ProductProfile;
import com.produs.product.ProductProfileRepository;
import com.produs.service.AuditService;
import com.produs.workspace.ProjectWorkspace;
import com.produs.workspace.ProjectWorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ScannerProviderConnectorService {

    private final ScannerProviderProperties providerProperties;
    private final ProductProfileRepository productRepository;
    private final ProjectWorkspaceRepository workspaceRepository;
    private final ScanSourceRepository sourceRepository;
    private final ScannerConnectorAuthStateRepository authStateRepository;
    private final ScannerConnectorInstallationRepository installationRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @Transactional
    public ConnectorInstallUrlResponse githubInstallUrl(User actor, ConnectorInstallUrlRequest request) {
        ScannerProviderProperties.GitHub github = providerProperties.getGithub();
        String state = UUID.randomUUID() + "." + UUID.randomUUID();
        ScannerConnectorAuthState authState = new ScannerConnectorAuthState();
        authState.setProviderType(ScanSource.ProviderType.GITHUB);
        authState.setStateHash(hashState(state));
        authState.setRequestedBy(actor);
        authState.setReturnPath(request == null ? null : trimToNull(request.returnPath()));
        authState.setExpiresAt(LocalDateTime.now().plusMinutes(20));
        authStateRepository.save(authState);
        String installUrl = blank(github.getInstallUrl())
                ? "https://github.com/apps/produs-network/installations/new"
                : github.getInstallUrl();
        String separator = installUrl.contains("?") ? "&" : "?";
        String url = installUrl + separator + "state=" + encode(state);
        return new ConnectorInstallUrlResponse(ScanSource.ProviderType.GITHUB, github.isEnabled(), url, state, github.getCallbackUrl(), "GitHub App installation");
    }

    @Transactional
    public ConnectorInstallUrlResponse gitlabInstallUrl(User actor, ConnectorInstallUrlRequest request) {
        ScannerProviderProperties.GitLab gitlab = providerProperties.getGitlab();
        String state = UUID.randomUUID() + "." + UUID.randomUUID();
        ScannerConnectorAuthState authState = new ScannerConnectorAuthState();
        authState.setProviderType(ScanSource.ProviderType.GITLAB);
        authState.setStateHash(hashState(state));
        authState.setRequestedBy(actor);
        authState.setReturnPath(request == null ? null : trimToNull(request.returnPath()));
        authState.setExpiresAt(LocalDateTime.now().plusMinutes(20));
        authStateRepository.save(authState);
        String base = blank(gitlab.getBaseUrl()) ? "https://gitlab.com" : gitlab.getBaseUrl();
        String redirect = blank(gitlab.getRedirectUri()) ? "" : gitlab.getRedirectUri();
        String url = base.replaceAll("/$", "") + "/oauth/authorize?client_id=" + encode(gitlab.getClientId())
                + "&redirect_uri=" + encode(redirect)
                + "&response_type=code&scope=read_repository+read_api&state=" + encode(state);
        return new ConnectorInstallUrlResponse(ScanSource.ProviderType.GITLAB, gitlab.isEnabled(), url, state, redirect, "GitLab OAuth authorization");
    }

    @Transactional
    public ConnectorInstallationResponse githubCallback(User actor, GitHubCallbackRequest request) {
        consumeState(ScanSource.ProviderType.GITHUB, request.state(), actor);
        ScannerConnectorInstallation installation = installationRepository
                .findByProviderTypeAndExternalInstallationId(ScanSource.ProviderType.GITHUB, request.installationId())
                .orElseGet(ScannerConnectorInstallation::new);
        installation.setProviderType(ScanSource.ProviderType.GITHUB);
        installation.setOwner(actor);
        installation.setCreatedBy(actor);
        installation.setExternalInstallationId(cleanRequired(request.installationId(), "GitHub installation id is required"));
        installation.setAccountLogin(trimToNull(request.accountLogin()));
        installation.setAccountType(trimToNull(request.accountType()));
        installation.setPermissionsJson(defaultString(request.permissionsJson(), "{}"));
        installation.setStatus(ScannerConnectorInstallation.InstallationStatus.ACTIVE);
        installation.setConnectedAt(LocalDateTime.now());
        installation.setDisconnectedAt(null);
        ScannerConnectorInstallation saved = installationRepository.save(installation);
        audit(actor, "SCANNER_GITHUB_INSTALLATION_CONNECTED", "SCANNER_CONNECTOR_INSTALLATION", saved.getId(), AuditEvent.RiskLevel.MEDIUM,
                "Connected GitHub installation " + saved.getExternalInstallationId());
        return toInstallationResponse(saved);
    }

    @Transactional
    public ConnectorInstallationResponse gitlabCallback(User actor, GitLabCallbackRequest request) {
        consumeState(ScanSource.ProviderType.GITLAB, request.state(), actor);
        ScannerConnectorInstallation installation = new ScannerConnectorInstallation();
        installation.setProviderType(ScanSource.ProviderType.GITLAB);
        installation.setOwner(actor);
        installation.setCreatedBy(actor);
        installation.setExternalInstallationId(cleanRequired(request.projectOrGroupId(), "GitLab project or group id is required"));
        installation.setAccountLogin(trimToNull(request.accountPath()));
        installation.setAccountType("project_or_group");
        installation.setPermissionsJson("{\"scope\":\"read_repository read_api\"}");
        installation.setStatus(ScannerConnectorInstallation.InstallationStatus.ACTIVE);
        ScannerConnectorInstallation saved = installationRepository.save(installation);
        audit(actor, "SCANNER_GITLAB_INSTALLATION_CONNECTED", "SCANNER_CONNECTOR_INSTALLATION", saved.getId(), AuditEvent.RiskLevel.MEDIUM,
                "Connected GitLab project/group " + saved.getExternalInstallationId());
        return toInstallationResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ConnectorInstallationResponse> listInstallations(User actor) {
        if (actor.getRole() == User.UserRole.ADMIN) {
            return installationRepository.findAll().stream().map(this::toInstallationResponse).toList();
        }
        return installationRepository.findByOwnerIdOrderByCreatedAtDesc(actor.getId()).stream()
                .map(this::toInstallationResponse)
                .toList();
    }

    @Transactional
    public ScannerService.ScanSourceResponse createGitHubSource(User actor, CreateProviderSourceRequest request, ScannerService scannerService) {
        ScannerConnectorInstallation installation = installationRepository.findById(request.installationId())
                .orElseThrow(() -> new ResourceNotFoundException("Scanner connector installation not found"));
        requireInstallationOwner(actor, installation);
        return scannerService.createSource(actor, new ScannerService.CreateScanSourceRequest(
                request.productId(),
                request.workspaceId(),
                ScanSource.ProviderType.GITHUB,
                defaultString(request.displayName(), request.repositoryFullName()),
                defaultString(request.cloneUrl(), "https://github.com/" + request.repositoryFullName() + ".git"),
                installation.getExternalInstallationId(),
                request.repositoryFullName(),
                request.defaultBranch(),
                ScanSource.AuthorizationStatus.AUTHORIZED,
                "GitHub App installation " + installation.getExternalInstallationId() + " authorized this repository."
        ));
    }

    @Transactional
    public ScannerService.ScanSourceResponse createGitLabSource(User actor, CreateProviderSourceRequest request, ScannerService scannerService) {
        ScannerConnectorInstallation installation = installationRepository.findById(request.installationId())
                .orElseThrow(() -> new ResourceNotFoundException("Scanner connector installation not found"));
        requireInstallationOwner(actor, installation);
        return scannerService.createSource(actor, new ScannerService.CreateScanSourceRequest(
                request.productId(),
                request.workspaceId(),
                ScanSource.ProviderType.GITLAB,
                defaultString(request.displayName(), request.repositoryFullName()),
                defaultString(request.cloneUrl(), providerProperties.getGitlab().getBaseUrl().replaceAll("/$", "") + "/" + request.repositoryFullName() + ".git"),
                installation.getExternalInstallationId(),
                request.repositoryFullName(),
                request.defaultBranch(),
                ScanSource.AuthorizationStatus.AUTHORIZED,
                "GitLab app/OAuth connection " + installation.getExternalInstallationId() + " authorized this repository."
        ));
    }

    @Transactional
    public WebhookResultResponse handleGithubWebhook(String event, String signature, String payload) {
        verifyGithubSignature(signature, payload);
        try {
            JsonNode root = objectMapper.readTree(defaultString(payload, "{}"));
            JsonNode installationNode = root.path("installation");
            String installationId = installationNode.path("id").asText("");
            ScannerConnectorInstallation installation = installationRepository
                    .findByProviderTypeAndExternalInstallationId(ScanSource.ProviderType.GITHUB, installationId)
                    .orElse(null);
            if (installation != null) {
                installation.setLastWebhookAt(LocalDateTime.now());
                installation.setLastWebhookEvent(event);
                if ("installation".equals(event)) {
                    String action = root.path("action").asText("");
                    if ("deleted".equals(action) || "suspend".equals(action)) {
                        installation.setStatus(ScannerConnectorInstallation.InstallationStatus.DISCONNECTED);
                        installation.setDisconnectedAt(LocalDateTime.now());
                    }
                }
                installationRepository.save(installation);
            }
            return new WebhookResultResponse(ScanSource.ProviderType.GITHUB, event, true, installationId, installation == null ? "No matching installation record" : "Processed");
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid GitHub webhook payload", ex);
        }
    }

    @Transactional
    public WebhookResultResponse handleGitlabWebhook(String event, String token, String payload) {
        verifyGitlabToken(token);
        try {
            JsonNode root = objectMapper.readTree(defaultString(payload, "{}"));
            String projectId = root.path("project").path("id").asText(root.path("project_id").asText(""));
            ScannerConnectorInstallation installation = installationRepository
                    .findByProviderTypeAndExternalInstallationId(ScanSource.ProviderType.GITLAB, projectId)
                    .orElse(null);
            if (installation != null) {
                installation.setLastWebhookAt(LocalDateTime.now());
                installation.setLastWebhookEvent(event);
                installationRepository.save(installation);
            }
            return new WebhookResultResponse(ScanSource.ProviderType.GITLAB, event, true, projectId, installation == null ? "No matching installation record" : "Processed");
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid GitLab webhook payload", ex);
        }
    }

    private void consumeState(ScanSource.ProviderType providerType, String state, User actor) {
        ScannerConnectorAuthState authState = authStateRepository.findByStateHash(hashState(state))
                .orElseThrow(() -> new AccessDeniedException("Connector authorization state is invalid"));
        if (authState.getProviderType() != providerType || authState.isExpired() || authState.getConsumedAt() != null || !authState.getRequestedBy().getId().equals(actor.getId())) {
            throw new AccessDeniedException("Connector authorization state is invalid or expired");
        }
        authState.setConsumedAt(LocalDateTime.now());
        authStateRepository.save(authState);
    }

    private void verifyGithubSignature(String signature, String payload) {
        String secret = providerProperties.getGithub().getWebhookSecret();
        if (blank(secret)) {
            throw new AccessDeniedException("GitHub webhook secret is not configured");
        }
        String expected = "sha256=" + hmacSha256(secret, defaultString(payload, ""));
        if (!MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), defaultString(signature, "").getBytes(StandardCharsets.UTF_8))) {
            throw new AccessDeniedException("Invalid GitHub webhook signature");
        }
    }

    private void verifyGitlabToken(String token) {
        String secret = providerProperties.getGitlab().getWebhookSecret();
        if (blank(secret) || !MessageDigest.isEqual(secret.getBytes(StandardCharsets.UTF_8), defaultString(token, "").getBytes(StandardCharsets.UTF_8))) {
            throw new AccessDeniedException("Invalid GitLab webhook token");
        }
    }

    private String hmacSha256(String secret, String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to compute webhook signature", ex);
        }
    }

    private String hashState(String state) {
        if (blank(state)) {
            throw new AccessDeniedException("Connector authorization state is required");
        }
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(state.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to hash connector state", ex);
        }
    }

    private void requireInstallationOwner(User actor, ScannerConnectorInstallation installation) {
        if (actor.getRole() == User.UserRole.ADMIN || installation.getOwner().getId().equals(actor.getId())) {
            return;
        }
        throw new AccessDeniedException("You do not have access to this connector installation");
    }

    private ConnectorInstallationResponse toInstallationResponse(ScannerConnectorInstallation installation) {
        return new ConnectorInstallationResponse(
                installation.getId(),
                installation.getCreatedAt(),
                installation.getProviderType(),
                installation.getExternalInstallationId(),
                installation.getAccountLogin(),
                installation.getAccountType(),
                installation.getStatus(),
                installation.getConnectedAt(),
                installation.getDisconnectedAt(),
                installation.getLastWebhookAt(),
                installation.getLastWebhookEvent(),
                installation.getLastError()
        );
    }

    private void audit(User actor, String action, String entityType, UUID entityId, AuditEvent.RiskLevel riskLevel, String details) {
        auditService.logAction(actor == null ? null : actor.getId(), action, entityType, entityId, riskLevel, details);
    }

    private String cleanRequired(String value, String message) {
        String clean = trimToNull(value);
        if (clean == null) {
            throw new IllegalArgumentException(message);
        }
        return clean;
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String defaultString(String value, String fallback) {
        return blank(value) ? fallback : value;
    }

    private String defaultString(String value) {
        return value == null ? "" : value;
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private String encode(String value) {
        return URLEncoder.encode(defaultString(value), StandardCharsets.UTF_8);
    }

    public record ConnectorInstallUrlRequest(String returnPath) {}

    public record ConnectorInstallUrlResponse(ScanSource.ProviderType providerType, boolean providerEnabled, String url, String state, String callbackUrl, String note) {}

    public record GitHubCallbackRequest(String installationId, String setupAction, String state, String accountLogin, String accountType, String permissionsJson) {}

    public record GitLabCallbackRequest(String code, String state, String projectOrGroupId, String accountPath) {}

    public record CreateProviderSourceRequest(UUID installationId, UUID productId, UUID workspaceId, String repositoryFullName, String cloneUrl, String defaultBranch, String displayName) {}

    public record WebhookResultResponse(ScanSource.ProviderType providerType, String event, boolean accepted, String externalInstallationId, String message) {}

    public record ConnectorInstallationResponse(
            UUID id,
            LocalDateTime createdAt,
            ScanSource.ProviderType providerType,
            String externalInstallationId,
            String accountLogin,
            String accountType,
            ScannerConnectorInstallation.InstallationStatus status,
            LocalDateTime connectedAt,
            LocalDateTime disconnectedAt,
            LocalDateTime lastWebhookAt,
            String lastWebhookEvent,
            String lastError
    ) {}
}
