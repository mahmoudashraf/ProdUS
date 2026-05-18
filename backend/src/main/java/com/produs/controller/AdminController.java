package com.produs.controller;

import com.produs.ai.loom.LoomAIProperties;
import com.produs.dto.PlatformDtos.AdminReadinessGateResponse;
import com.produs.dto.PlatformDtos.AdminReadinessResponse;
import com.produs.dto.PlatformDtos.AdminDashboardResponse;
import com.produs.dto.PlatformDtos.CurrentUserSummary;
import com.produs.entity.User;
import com.produs.scanner.ScannerProcessRunner;
import com.produs.scanner.ScannerProperties;
import com.produs.scanner.ScannerProviderProperties;
import com.produs.scanner.ScannerStorageProperties;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Admin management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class AdminController {

    private final Environment environment;
    private final LoomAIProperties loomAIProperties;
    private final ScannerProperties scannerProperties;
    private final ScannerProcessRunner scannerProcessRunner;
    private final ScannerProviderProperties scannerProviderProperties;
    private final ScannerStorageProperties scannerStorageProperties;

    @GetMapping("/dashboard")
    @Operation(summary = "Get admin dashboard", description = "Returns admin dashboard information")
    @ApiResponse(responseCode = "200", description = "Dashboard data retrieved successfully")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "403", description = "Forbidden - Admin role required")
    public ResponseEntity<AdminDashboardResponse> getDashboard(
            @AuthenticationPrincipal User admin
    ) {
        return ResponseEntity.ok(new AdminDashboardResponse(
                "Admin dashboard",
                new CurrentUserSummary(admin.getId(), admin.getEmail(), admin.getRole().name())
        ));
    }

    @GetMapping("/production-readiness")
    @Operation(summary = "Get production readiness gates", description = "Returns scanner, MCP, LoomAI, auth, and operations readiness gates without exposing secrets")
    public ResponseEntity<AdminReadinessResponse> productionReadiness() {
        List<AdminReadinessGateResponse> gates = new ArrayList<>();
        String datasourceUrl = property("spring.datasource.url");
        String datasourceDriver = property("spring.datasource.driver-class-name");
        String supabaseUrl = property("supabase.url");
        String supabaseApiKey = property("supabase.api-key");
        String corsOrigins = property("app.cors.allowed-origins");
        boolean productionProfile = Arrays.asList(environment.getActiveProfiles()).contains("prod");
        boolean mockAuthEnabled = boolProperty("app.mock-auth.enabled", false);

        addGate(gates, "database", "Data", datasourceUrl.startsWith("jdbc:postgresql:") || datasourceDriver.contains("postgresql") ? "PASS" : "BLOCKED",
                "PostgreSQL datasource",
                datasourceUrl.startsWith("jdbc:postgresql:") ? "Backend is configured for PostgreSQL migrations and runtime persistence." : "Backend is not using a PostgreSQL datasource.",
                "Set SPRING_DATASOURCE_URL or DATABASE_URL to a PostgreSQL connection before production enablement.");
        addGate(gates, "supabase-auth", "Auth", configured(supabaseUrl) && configured(supabaseApiKey) && !supabaseUrl.contains("your-project") ? "PASS" : "BLOCKED",
                "Supabase auth configured",
                "Supabase URL and anon key presence are checked without returning secret values.",
                "Configure SUPABASE_URL, SUPABASE_API_KEY, and SUPABASE_SERVICE_ROLE_KEY for the production project.");
        addGate(gates, "mock-auth", "Auth", !mockAuthEnabled ? "PASS" : "BLOCKED",
                "Mock auth disabled",
                mockAuthEnabled ? "Mock authentication is enabled." : "Mock authentication is disabled.",
                "Set app.mock-auth.enabled=false and avoid dev profile for production.");
        addGate(gates, "cors", "Security", productionProfile && corsOrigins.contains("localhost") ? "BLOCKED" : "PASS",
                "CORS origin scope",
                configured(corsOrigins) ? "CORS origins are configured." : "CORS origins are empty.",
                "Restrict APP_CORS_ALLOWED_ORIGINS to production Studio and Network domains.");
        addGate(gates, "rate-limit", "Security", boolProperty("app.security.rate-limit.enabled", true) ? "PASS" : "BLOCKED",
                "API rate limiting",
                "API rate limit filter protects authenticated API paths and emits rate limit headers.",
                "Enable APP_RATE_LIMIT_ENABLED and set a production limit.");
        addGate(gates, "scanner-worker", "Scanner", scannerProperties.isWorkerEnabled() ? "PASS" : "WARN",
                "Scanner worker",
                scannerProperties.isWorkerEnabled() ? "Hosted scanner worker is enabled." : "Hosted scanner worker is disabled; evidence views still work.",
                "Enable APP_SCANNER_WORKER_ENABLED only after scanner image, isolation, and tool licensing are approved.");
        addGate(gates, "scanner-tool-pack", "Scanner", requiredScannerToolsConfigured() ? "PASS" : "BLOCKED",
                "Scanner tool pack configured",
                "Required scanner commands are present in scanner configuration.",
                "Configure gitleaks, semgrep, osv-scanner, and trivy-fs command templates.");
        addGate(gates, "scanner-runtime-tools", "Scanner", scannerRuntimeToolsStatus(),
                "Scanner runtime executable availability",
                scannerRuntimeToolsDetail(),
                scannerProperties.isRequireRuntimeToolAvailability()
                        ? "Build and run the hardened scanner image or install required scanner binaries on PATH before enabling production hosted scans."
                        : "Set APP_SCANNER_REQUIRE_RUNTIME_TOOL_AVAILABILITY=true in production after the scanner image is approved.");
        addGate(gates, "scanner-runtime-image", "Scanner", configured(scannerProperties.getRuntimeImageName()) && configured(scannerProperties.getRuntimeImageTag()) ? "PASS" : "WARN",
                "Scanner runtime image configured",
                "Runtime image reference: " + scannerProperties.getRuntimeImageName() + ":" + scannerProperties.getRuntimeImageTag(),
                "Build and publish the scanner runtime image from backend/Dockerfile.scanner, then set APP_SCANNER_RUNTIME_IMAGE_NAME and APP_SCANNER_RUNTIME_IMAGE_TAG.");
        addGate(gates, "scanner-storage-governance", "Evidence", scannerStorageProperties.isExportEnabled() ? "PASS" : "WARN",
                "Scanner storage export and retention",
                "Evidence exports are " + (scannerStorageProperties.isExportEnabled() ? "enabled" : "disabled")
                        + "; retention cleanup is " + (scannerStorageProperties.isRetentionCleanupEnabled() ? "enabled" : "manual/dry-run only") + ".",
                "Enable retention cleanup only after storage lifecycle and audit export policy are approved.");
        addGate(gates, "github-scanner-connector", "Integrations", providerGateStatus(scannerProviderProperties.getGithub().isEnabled(), githubConnectorConfigured()),
                "GitHub scanner connector",
                scannerProviderProperties.getGithub().isEnabled() ? "GitHub App connector is enabled." : "GitHub App connector is disabled until credentials are provided.",
                "Configure APP_SCANNER_GITHUB_* values: app id, client id/secret, private key path, install URL, callback URL, and webhook secret.");
        addGate(gates, "gitlab-scanner-connector", "Integrations", providerGateStatus(scannerProviderProperties.getGitlab().isEnabled(), gitlabConnectorConfigured()),
                "GitLab scanner connector",
                scannerProviderProperties.getGitlab().isEnabled() ? "GitLab connector is enabled." : "GitLab connector is disabled until credentials are provided.",
                "Configure APP_SCANNER_GITLAB_* values: client id/secret, redirect URI, base URL, and webhook secret.");
        addGate(gates, "loomai-runtime", "AI", loomAIProperties.isEnabled() ? (configured(loomAIProperties.getBaseUrl()) ? "PASS" : "BLOCKED") : "WARN",
                "LoomAI runtime",
                loomAIProperties.isEnabled() ? "LoomAI is enabled for " + loomAIProperties.getEnvironment() + "." : "LoomAI is disabled; deterministic fallback remains active.",
                "Set LOOMAI_ENABLED=true only after staging gates pass, and configure LOOMAI_BASE_URL plus provider credentials.");
        addGate(gates, "mcp-profile", "MCP", mcpToolProfileReady() ? "PASS" : "WARN",
                "MCP LoomAI allowlist profile",
                "Production readiness expects the MCP gateway to run with PRODUS_MCP_TOOL_PROFILE=loomai-productization for LoomAI import.",
                "Set PRODUS_MCP_REQUIRE_AUTH=true and PRODUS_MCP_TOOL_PROFILE=loomai-productization on the MCP service.");
        addGate(gates, "webhook-secrets", "Integrations", webhooksConfiguredForProduction(productionProfile) ? "PASS" : "WARN",
                "Webhook secrets",
                "Payment and signature webhook secret presence is checked without returning values.",
                "Configure non-empty APP_PAYMENT_WEBHOOK_SECRET and APP_SIGNATURE_WEBHOOK_SECRET in production.");
        addGate(gates, "private-storage", "Evidence", configured(property("aws.s3.bucket")) && configured(property("aws.s3.access-key")) ? "PASS" : "BLOCKED",
                "Evidence object storage",
                "S3-compatible bucket and access key presence are configured.",
                "Configure private object storage and short-lived signed downloads before production evidence upload.");

        String overall = gates.stream().anyMatch(gate -> "BLOCKED".equals(gate.status()))
                ? "BLOCKED"
                : gates.stream().anyMatch(gate -> "WARN".equals(gate.status())) ? "WARN" : "PASS";
        return ResponseEntity.ok(new AdminReadinessResponse(overall, LocalDateTime.now(), gates));
    }

    private void addGate(List<AdminReadinessGateResponse> gates, String key, String area, String status, String title, String detail, String remediation) {
        gates.add(new AdminReadinessGateResponse(key, area, status, title, detail, remediation));
    }

    private boolean configured(String value) {
        return value != null && !value.isBlank();
    }

    private String property(String key) {
        String value = environment.getProperty(key, "");
        return value == null ? "" : value;
    }

    private boolean boolProperty(String key, boolean fallback) {
        return environment.getProperty(key, Boolean.class, fallback);
    }

    private boolean requiredScannerToolsConfigured() {
        return scannerProperties.getRequiredToolKeys().stream()
                .allMatch(key -> scannerProperties.getTools().containsKey(key)
                        && scannerProperties.getTools().get(key).isEnabled()
                        && configured(scannerProperties.getTools().get(key).getCommand()));
    }

    private String scannerRuntimeToolsStatus() {
        boolean available = requiredScannerToolsExecutableAvailable();
        if (available) {
            return "PASS";
        }
        return scannerProperties.isRequireRuntimeToolAvailability() ? "BLOCKED" : "WARN";
    }

    private String scannerRuntimeToolsDetail() {
        List<String> missing = scannerProperties.getRequiredToolKeys().stream()
                .filter(key -> scannerProperties.getTools().containsKey(key))
                .filter(key -> !scannerProcessRunner.isExecutableAvailable(executableFor(scannerProperties.getTools().get(key))))
                .toList();
        if (missing.isEmpty()) {
            return "Required scanner binaries are available on the current runtime PATH.";
        }
        return "Missing scanner binaries on current runtime PATH: " + String.join(", ", missing) + ".";
    }

    private boolean requiredScannerToolsExecutableAvailable() {
        return scannerProperties.getRequiredToolKeys().stream()
                .allMatch(key -> scannerProperties.getTools().containsKey(key)
                        && scannerProcessRunner.isExecutableAvailable(executableFor(scannerProperties.getTools().get(key))));
    }

    private String executableFor(ScannerProperties.ToolProperties tool) {
        List<String> command = scannerProcessRunner.renderCommand(tool.getCommand(), Map.of());
        return command.isEmpty() ? "" : command.getFirst();
    }

    private String providerGateStatus(boolean enabled, boolean configured) {
        if (!enabled) {
            return "WARN";
        }
        return configured ? "PASS" : "BLOCKED";
    }

    private boolean githubConnectorConfigured() {
        ScannerProviderProperties.GitHub github = scannerProviderProperties.getGithub();
        return configured(github.getAppId())
                && configured(github.getClientId())
                && configured(github.getClientSecret())
                && configured(github.getPrivateKeyPath())
                && configured(github.getWebhookSecret())
                && configured(github.getInstallUrl())
                && configured(github.getCallbackUrl());
    }

    private boolean gitlabConnectorConfigured() {
        ScannerProviderProperties.GitLab gitlab = scannerProviderProperties.getGitlab();
        return configured(gitlab.getClientId())
                && configured(gitlab.getClientSecret())
                && configured(gitlab.getRedirectUri())
                && configured(gitlab.getWebhookSecret())
                && configured(gitlab.getBaseUrl());
    }

    private boolean mcpToolProfileReady() {
        return "loomai-productization".equals(environment.getProperty("PRODUS_MCP_TOOL_PROFILE"))
                || "loomai-productization".equals(environment.getProperty("produs.mcp.tool-profile"));
    }

    private boolean webhooksConfiguredForProduction(boolean productionProfile) {
        String paymentSecret = property("app.integrations.webhooks.payments.secret");
        String signatureSecret = property("app.integrations.webhooks.signatures.secret");
        if (!productionProfile) {
            return configured(paymentSecret) && configured(signatureSecret);
        }
        return configured(paymentSecret)
                && configured(signatureSecret)
                && !paymentSecret.startsWith("dev-")
                && !signatureSecret.startsWith("dev-")
                && !paymentSecret.startsWith("test-")
                && !signatureSecret.startsWith("test-");
    }
}
