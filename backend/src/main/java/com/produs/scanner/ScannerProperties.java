package com.produs.scanner;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.scanner")
public class ScannerProperties {
    private boolean schedulerEnabled = true;
    private boolean workerEnabled = true;
    private boolean separateWorkerEnabled = false;
    private long pollFixedDelayMs = 10_000;
    private int maxAttempts = 1;
    private int defaultTimeoutSeconds = 300;
    private String workRoot = "";
    private int maxOutputBytes = 2_000_000;
    private boolean requireRuntimeToolAvailability = false;
    private String runtimeImageName = "produs-scanner-worker";
    private String runtimeImageTag = "local";
    private List<String> requiredToolKeys = List.of(
            "gitleaks",
            "trufflehog",
            "osv-scanner",
            "semgrep",
            "opengrep",
            "bearer",
            "trivy-fs",
            "checkov",
            "hadolint",
            "kics",
            "kube-linter",
            "syft",
            "grype",
            "trivy-image",
            "lighthouse",
            "zap-baseline",
            "testssl",
            "nuclei-safe"
    );
    private Map<String, ToolProperties> tools = defaultTools();

    public ToolProperties tool(String key) {
        return tools.get(key);
    }

    private Map<String, ToolProperties> defaultTools() {
        Map<String, ToolProperties> defaults = new LinkedHashMap<>();
        defaults.put("gitleaks", tool(
                "Gitleaks",
                "gitleaks detect --source {target} --report-format json --report-path {output} --no-banner --redact --exit-code 0",
                "gitleaks version",
                "JSON",
                "repository"
        ));
        defaults.put("trufflehog", tool(
                "TruffleHog",
                "produs-trufflehog-json {target} {output}",
                "trufflehog --version",
                "JSON",
                "repository"
        ));
        ToolProperties osv = tool(
                "OSV-Scanner",
                "osv-scanner scan source -r {target} --format json --output {output}",
                "osv-scanner --version",
                "JSON",
                "repository"
        );
        osv.setAcceptedExitCodes(List.of(0, 1));
        defaults.put("osv-scanner", osv);
        ToolProperties semgrep = tool(
                "Semgrep",
                "semgrep scan --config auto --json --output {output} {target}",
                "semgrep --version",
                "JSON",
                "repository"
        );
        semgrep.setRequiredPathGlobs(codePathGlobs());
        defaults.put("semgrep", semgrep);
        ToolProperties opengrep = tool(
                "OpenGrep",
                "opengrep scan --config /opt/produs/opengrep-rules --json --output {output} {target}",
                "opengrep --version",
                "JSON",
                "repository"
        );
        opengrep.setAcceptedExitCodes(List.of(0, 1));
        opengrep.setRequiredPathGlobs(codePathGlobs());
        defaults.put("opengrep", opengrep);
        ToolProperties bearer = tool(
                "Bearer",
                "produs-bearer-sarif {target} {output}",
                "bearer version",
                "SARIF",
                "repository"
        );
        bearer.setAcceptedExitCodes(List.of(0, 1, 2));
        bearer.setRequiredPathGlobs(codePathGlobs());
        defaults.put("bearer", bearer);
        defaults.put("trivy-fs", tool(
                "Trivy FS/Config",
                "trivy fs --format json --output {output} --exit-code 0 {target}",
                "trivy --version",
                "JSON",
                "repository"
        ));
        ToolProperties checkov = tool(
                "Checkov",
                "produs-checkov-json {target} {output}",
                "checkov --version",
                "JSON",
                "repository"
        );
        checkov.setRequiresIac(true);
        checkov.setAcceptedExitCodes(List.of(0, 1, 2));
        defaults.put("checkov", checkov);
        ToolProperties hadolint = tool(
                "Hadolint",
                "produs-hadolint-json {target} {output}",
                "hadolint --version",
                "JSON",
                "repository"
        );
        hadolint.setAcceptedExitCodes(List.of(0, 1));
        hadolint.setRequiredPathGlobs(List.of("Dockerfile", "**/Dockerfile", "**/*.Dockerfile"));
        defaults.put("hadolint", hadolint);
        ToolProperties kics = tool(
                "KICS",
                "produs-kics-sarif {target} {output}",
                "kics version",
                "SARIF",
                "repository"
        );
        kics.setRequiresIac(true);
        kics.setAcceptedExitCodes(List.of(0, 1, 2));
        defaults.put("kics", kics);
        ToolProperties kubeLinter = tool(
                "KubeLinter",
                "produs-kube-linter-sarif {target} {output}",
                "kube-linter version",
                "SARIF",
                "repository"
        );
        kubeLinter.setRequiresKubernetes(true);
        kubeLinter.setAcceptedExitCodes(List.of(0, 1));
        defaults.put("kube-linter", kubeLinter);
        defaults.put("syft", tool(
                "Syft",
                "syft {image} -o cyclonedx-json={output}",
                "syft version",
                "JSON",
                "container-image"
        ));
        defaults.put("grype", tool(
                "Grype",
                "grype {image} -o json --file {output}",
                "grype version",
                "JSON",
                "container-image"
        ));
        defaults.put("trivy-image", tool(
                "Trivy Image",
                "trivy image --format json --output {output} --exit-code 0 {image}",
                "trivy --version",
                "JSON",
                "container-image"
        ));
        defaults.put("lighthouse", tool(
                "Lighthouse",
                "lighthouse {url} --output json --output-path {output} --quiet --chrome-flags=\"--headless --no-sandbox\"",
                "lighthouse --version",
                "JSON",
                "runtime-url"
        ));
        ToolProperties zap = tool(
                "OWASP ZAP Baseline",
                "produs-zap-baseline --autooff -t {url} -J {output} -m 0 -T 5 -I -z \"-dir {target}/zap-home\"",
                "zap-baseline.py --version",
                "JSON",
                "runtime-url"
        );
        zap.setAcceptedExitCodes(List.of(0, 1, 2));
        defaults.put("zap-baseline", zap);
        ToolProperties testssl = tool(
                "testssl.sh",
                "produs-testssl-json {url} {output}",
                "testssl.sh --version",
                "JSON",
                "runtime-url"
        );
        testssl.setAcceptedExitCodes(List.of(0, 1));
        defaults.put("testssl", testssl);
        ToolProperties nucleiSafe = tool(
                "Nuclei Safe Baseline",
                "produs-nuclei-safe-json {url} {output}",
                "nuclei -version",
                "JSON",
                "runtime-url"
        );
        nucleiSafe.setAcceptedExitCodes(List.of(0, 1));
        defaults.put("nuclei-safe", nucleiSafe);
        return defaults;
    }

    private List<String> codePathGlobs() {
        return List.of(
                "**/*.js",
                "**/*.jsx",
                "**/*.ts",
                "**/*.tsx",
                "**/*.mjs",
                "**/*.cjs",
                "**/*.py",
                "**/*.rb",
                "**/*.go",
                "**/*.java",
                "**/*.kt",
                "**/*.php",
                "**/*.cs",
                "**/*.swift"
        );
    }

    private ToolProperties tool(String displayName, String command, String versionCommand, String outputFormat, String targetType) {
        ToolProperties tool = new ToolProperties();
        tool.setEnabled(true);
        tool.setDisplayName(displayName);
        tool.setCommand(command);
        tool.setVersionCommand(versionCommand);
        tool.setOutputFormat(outputFormat);
        tool.setTargetType(targetType);
        tool.setTimeoutSeconds(defaultTimeoutSeconds);
        return tool;
    }

    @Getter
    @Setter
    public static class ToolProperties {
        private boolean enabled = true;
        private String displayName;
        private String command;
        private String versionCommand;
        private String outputFormat = "JSON";
        private String targetType = "repository";
        private boolean requiresIac;
        private boolean requiresKubernetes;
        private List<String> requiredPathGlobs = List.of();
        private int timeoutSeconds = 300;
        private List<Integer> acceptedExitCodes = List.of(0);
    }
}
