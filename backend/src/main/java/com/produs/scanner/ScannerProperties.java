package com.produs.scanner;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.scanner")
public class ScannerProperties {
    private boolean schedulerEnabled = true;
    private boolean workerEnabled = true;
    private long pollFixedDelayMs = 10_000;
    private int maxAttempts = 1;
    private int defaultTimeoutSeconds = 300;
    private String workRoot = "";
    private int maxOutputBytes = 2_000_000;
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
        defaults.put("osv-scanner", tool(
                "OSV-Scanner",
                "osv-scanner scan source -r {target} --format json --output {output}",
                "osv-scanner --version",
                "JSON",
                "repository"
        ));
        defaults.put("semgrep", tool(
                "Semgrep",
                "semgrep scan --config auto --json --output {output} {target}",
                "semgrep --version",
                "JSON",
                "repository"
        ));
        defaults.put("trivy-fs", tool(
                "Trivy FS/Config",
                "trivy fs --format json --output {output} --exit-code 0 {target}",
                "trivy --version",
                "JSON",
                "repository"
        ));
        ToolProperties checkov = tool(
                "Checkov",
                "checkov -d {target} -o json --output-file-path {output} --soft-fail",
                "checkov --version",
                "JSON",
                "repository"
        );
        checkov.setRequiresIac(true);
        defaults.put("checkov", checkov);
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
                "lighthouse {url} --output json --output-path {output} --quiet --chrome-flags=--headless",
                "lighthouse --version",
                "JSON",
                "runtime-url"
        ));
        defaults.put("zap-baseline", tool(
                "OWASP ZAP Baseline",
                "zap-baseline.py -t {url} -J {output}",
                "zap-baseline.py --version",
                "JSON",
                "runtime-url"
        ));
        return defaults;
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
        private int timeoutSeconds = 300;
    }
}
