package com.produs.scanner;

import com.produs.audit.AuditEvent;
import com.produs.entity.User;
import com.produs.exception.ResourceNotFoundException;
import com.produs.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ScannerWorker {

    private final ScannerProperties properties;
    private final ScannerJobRepository jobRepository;
    private final ScanSourceRepository sourceRepository;
    private final ScanRunRepository scanRunRepository;
    private final ToolRunRepository toolRunRepository;
    private final ScannerService scannerService;
    private final ScannerProcessRunner processRunner;
    private final AuditService auditService;
    private final ScannerSourceCredentialService sourceCredentialService;

    public boolean executeNextQueuedJob() {
        return jobRepository.findTopByStatusAndNextRunAtLessThanEqualOrderByCreatedAtAsc(ScannerJob.JobStatus.QUEUED, LocalDateTime.now())
                .map(job -> {
                    executeJob(job.getId());
                    return true;
                })
                .orElse(false);
    }

    public void executeJob(UUID jobId) {
        ScannerJob job = startJob(jobId);
        ScanRun run = job.getScanRun();
        User actor = run.getRequestedBy();
        Path jobRoot = workRoot().resolve(run.getId().toString());
        Path target = null;
        try {
            Files.createDirectories(jobRoot);
            target = prepareTarget(run, jobRoot);
            List<ToolRun> toolRuns = toolRunRepository.findByScanRunIdOrderByCreatedAtAsc(run.getId());
            for (ToolRun toolRun : toolRuns) {
                ScanRun current = scanRunRepository.findById(run.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Scan run not found"));
                if (current.isCancelRequested()) {
                    scannerService.markToolCanceled(toolRun.getId(), "Scan was canceled before this tool started.");
                    continue;
                }
                runTool(actor, current, toolRun, target, jobRoot);
            }
            scannerService.completeHostedScanRun(run.getId());
            completeJob(job.getId(), ScannerJob.JobStatus.COMPLETED, null);
        } catch (RuntimeException | IOException ex) {
            String failure = scannerService.safeScannerFailure(ex);
            scannerService.failHostedScanRun(run.getId(), failure);
            completeJob(job.getId(), ScannerJob.JobStatus.FAILED, failure);
        } finally {
            cleanup(jobRoot);
        }
    }

    @Transactional
    protected ScannerJob startJob(UUID jobId) {
        ScannerJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Scanner job not found"));
        if (job.getStatus() == ScannerJob.JobStatus.CANCELED) {
            return job;
        }
        job.setStatus(ScannerJob.JobStatus.RUNNING);
        job.setAttemptCount(job.getAttemptCount() + 1);
        job.setStartedAt(LocalDateTime.now());
        job.setLockedAt(LocalDateTime.now());
        job.setLockOwner(hostLockOwner());
        ScannerJob saved = jobRepository.save(job);
        ScanRun run = saved.getScanRun();
        run.setStatus(ScanRun.RunStatus.RUNNING);
        if (run.getStartedAt() == null) {
            run.setStartedAt(LocalDateTime.now());
        }
        scanRunRepository.save(run);
        audit(run.getRequestedBy(), "SCANNER_JOB_STARTED", "SCAN_RUN", run.getId(), AuditEvent.RiskLevel.MEDIUM,
                "Started hosted scanner job for product " + run.getProductProfile().getId());
        return saved;
    }

    @Transactional
    protected void completeJob(UUID jobId, ScannerJob.JobStatus status, String failure) {
        ScannerJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Scanner job not found"));
        if (job.getStatus() != ScannerJob.JobStatus.CANCELED) {
            job.setStatus(status);
        }
        job.setFailureSummary(failure);
        job.setCompletedAt(LocalDateTime.now());
        jobRepository.save(job);
    }

    private void runTool(User actor, ScanRun run, ToolRun toolRun, Path target, Path jobRoot) {
        String key = toolRun.getToolKey();
        ScannerProperties.ToolProperties tool = properties.tool(key);
        if (tool == null) {
            scannerService.markToolFailed(toolRun.getId(), "Scanner tool is not registered: " + key, null, null, null);
            return;
        }
        if (!tool.isEnabled()) {
            scannerService.markToolSkipped(toolRun.getId(), "Scanner tool is disabled by platform configuration.");
            return;
        }
        if (tool.isRequiresIac() && !containsIacFiles(target)) {
            scannerService.markToolSkipped(toolRun.getId(), "No IaC files were found for this product source.");
            return;
        }
        if (tool.isRequiresKubernetes() && !containsKubernetesFiles(target)) {
            scannerService.markToolSkipped(toolRun.getId(), "No Kubernetes manifests or Helm charts were found for this product source.");
            return;
        }
        if (tool.getRequiredPathGlobs() != null
                && !tool.getRequiredPathGlobs().isEmpty()
                && !containsRequiredPaths(target, tool.getRequiredPathGlobs())) {
            scannerService.markToolSkipped(toolRun.getId(), "No files matched this scanner's target patterns.");
            return;
        }
        scannerService.markToolRunning(toolRun.getId(), resolveVersion(tool));
        Path output = jobRoot.resolve("outputs").resolve(key + ".json");
        try {
            Files.createDirectories(output.getParent());
            Map<String, String> placeholders = placeholders(run, target, output);
            Duration timeout = Duration.ofSeconds(tool.getTimeoutSeconds() > 0 ? tool.getTimeoutSeconds() : properties.getDefaultTimeoutSeconds());
            ScannerProcessRunner.ProcessResult result = processRunner.run(tool.getCommand(), jobRoot, placeholders, timeout);
            String payload = readPayload(output, result);
            String logs = scannerService.redactScannerText((defaultString(result.stdout()) + "\n" + defaultString(result.stderr())).trim());
            if (result.timedOut()) {
                scannerService.markToolFailed(toolRun.getId(), "Scanner timed out after " + timeout.toSeconds() + " seconds", result.exitCode(), result.duration().toMillis(), logs);
                return;
            }
            if (!acceptedExitCodes(tool).contains(result.exitCode())) {
                scannerService.markToolFailed(toolRun.getId(), "Scanner exited with code " + result.exitCode(), result.exitCode(), result.duration().toMillis(), logs);
                return;
            }
            scannerService.recordToolOutput(
                    actor,
                    toolRun.getId(),
                    format(tool.getOutputFormat()),
                    output.getFileName().toString(),
                    payload,
                    result.exitCode(),
                    result.duration().toMillis(),
                    logs
            );
        } catch (RuntimeException | IOException ex) {
            scannerService.markToolFailed(toolRun.getId(), scannerService.safeScannerFailure(ex), null, null, null);
        }
    }

    private Path prepareTarget(ScanRun run, Path jobRoot) throws IOException {
        if (run.getDepth() == ScanRun.ScanDepth.RUNTIME_BASELINE) {
            return jobRoot;
        }
        if (run.getDepth() == ScanRun.ScanDepth.DEPENDENCY_CONTAINER) {
            return jobRoot;
        }
        ScanSource scanSource = sourceRepository.findById(run.getScanSource().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Scanner source not found"));
        String source = sourceCredentialService.cloneReferenceFor(scanSource);
        if (source == null || source.isBlank()) {
            throw new IllegalArgumentException("Hosted repository scan requires an authorized repository source");
        }
        Path checkout = jobRoot.resolve("repo");
        List<String> command = new ArrayList<>();
        command.add("git");
        command.add("clone");
        command.add("--depth");
        command.add("1");
        if (run.getBranchRef() != null && !run.getBranchRef().isBlank()) {
            command.add("--branch");
            command.add(run.getBranchRef());
        }
        command.add(source);
        command.add(checkout.toString());
        if (!processRunner.isExecutableAvailable("git")) {
            throw new IllegalStateException("git executable is required for hosted repository scans");
        }
        ScannerProcessRunner.ProcessResult result = processRunner.run(
                joinCommand(command),
                jobRoot,
                Map.of(),
                Duration.ofSeconds(Math.max(60, properties.getDefaultTimeoutSeconds()))
        );
        if (result.timedOut()) {
            throw new IllegalStateException("Repository clone timed out");
        }
        if (result.exitCode() != 0) {
            throw new IllegalStateException("Repository clone failed: " + scannerService.redactScannerText(result.stderr()));
        }
        return checkout;
    }

    private Map<String, String> placeholders(ScanRun run, Path target, Path output) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("target", target.toString());
        values.put("output", output.toString());
        values.put("url", defaultString(run.getRuntimeTargetUrl()));
        values.put("image", defaultString(run.getContainerImageRef()));
        return values;
    }

    private String readPayload(Path output, ScannerProcessRunner.ProcessResult result) throws IOException {
        if (Files.exists(output) && Files.isRegularFile(output)) {
            long maxBytes = properties.getMaxOutputBytes();
            if (Files.size(output) > maxBytes) {
                throw new IllegalArgumentException("Scanner output exceeds configured artifact limit");
            }
            return Files.readString(output, StandardCharsets.UTF_8);
        }
        String stdout = defaultString(result.stdout());
        if (stdout.getBytes(StandardCharsets.UTF_8).length > properties.getMaxOutputBytes()) {
            throw new IllegalArgumentException("Scanner stdout exceeds configured artifact limit");
        }
        return stdout;
    }

    private ScannerService.CiEvidenceFormat format(String value) {
        if (value == null || value.isBlank()) {
            return ScannerService.CiEvidenceFormat.JSON;
        }
        return ScannerService.CiEvidenceFormat.valueOf(value.toUpperCase(Locale.ROOT));
    }

    private String resolveVersion(ScannerProperties.ToolProperties tool) {
        if (tool.getVersionCommand() == null || tool.getVersionCommand().isBlank()) {
            return null;
        }
        try {
            List<String> command = processRunner.renderCommand(tool.getVersionCommand(), Map.of());
            if (command.isEmpty() || !processRunner.isExecutableAvailable(command.getFirst())) {
                return null;
            }
            ScannerProcessRunner.ProcessResult result = processRunner.run(tool.getVersionCommand(), workRoot(), Map.of(), Duration.ofSeconds(5));
            if (result.exitCode() == 0) {
                return scannerService.redactScannerText((defaultString(result.stdout()) + " " + defaultString(result.stderr())).trim());
            }
        } catch (RuntimeException ignored) {
            return null;
        }
        return null;
    }

    private List<Integer> acceptedExitCodes(ScannerProperties.ToolProperties tool) {
        if (tool.getAcceptedExitCodes() == null || tool.getAcceptedExitCodes().isEmpty()) {
            return List.of(0);
        }
        return tool.getAcceptedExitCodes();
    }

    private boolean containsIacFiles(Path target) {
        if (target == null || !Files.exists(target)) {
            return false;
        }
        try (var stream = Files.walk(target, 8)) {
            return stream
                    .filter(Files::isRegularFile)
                    .map(path -> path.getFileName().toString().toLowerCase(Locale.ROOT))
                    .anyMatch(name -> name.endsWith(".tf")
                            || name.endsWith(".tf.json")
                            || name.endsWith(".yaml")
                            || name.endsWith(".yml")
                            || name.endsWith(".template")
                            || name.equals("dockerfile")
                            || name.equals("serverless.yml")
                            || name.equals("serverless.yaml"));
        } catch (IOException ex) {
            return false;
        }
    }

    private boolean containsRequiredPaths(Path target, List<String> globs) {
        if (target == null || !Files.exists(target) || globs == null || globs.isEmpty()) {
            return false;
        }
        try (var stream = Files.walk(target, 8)) {
            return stream
                    .filter(Files::isRegularFile)
                    .anyMatch(path -> pathMatches(target.relativize(path), globs));
        } catch (IOException ex) {
            return false;
        }
    }

    private boolean pathMatches(Path relativePath, List<String> globs) {
        String normalized = relativePath.toString().replace(java.io.File.separatorChar, '/');
        String fileName = relativePath.getFileName() == null ? normalized : relativePath.getFileName().toString();
        for (String glob : globs) {
            if (glob == null || glob.isBlank()) {
                continue;
            }
            String normalizedGlob = glob.replace('\\', '/');
            if (normalizedGlob.equals(fileName) || normalizedGlob.equals(normalized)) {
                return true;
            }
            if (normalizedGlob.startsWith("**/*.") && fileName.endsWith(normalizedGlob.substring(4))) {
                return true;
            }
            try {
                if (java.nio.file.FileSystems.getDefault().getPathMatcher("glob:" + normalizedGlob).matches(Path.of(normalized))) {
                    return true;
                }
            } catch (IllegalArgumentException ignored) {
                // Ignore invalid custom glob patterns; the scanner can still run if another pattern matches.
            }
        }
        return false;
    }

    private boolean containsKubernetesFiles(Path target) {
        if (target == null || !Files.exists(target)) {
            return false;
        }
        try (var stream = Files.walk(target, 8)) {
            return stream.anyMatch(path -> {
                String name = path.getFileName() == null ? "" : path.getFileName().toString().toLowerCase(Locale.ROOT);
                if (Files.isDirectory(path)) {
                    return name.equals("k8s") || name.equals("kubernetes") || name.equals("helm");
                }
                if (!Files.isRegularFile(path)) {
                    return false;
                }
                if (name.equals("chart.yaml") || name.equals("kustomization.yaml") || name.equals("kustomization.yml")) {
                    return true;
                }
                return (name.endsWith(".yaml") || name.endsWith(".yml")) && looksLikeKubernetesManifest(path);
            });
        } catch (IOException ex) {
            return false;
        }
    }

    private boolean looksLikeKubernetesManifest(Path path) {
        try {
            if (Files.size(path) > 512_000) {
                return false;
            }
            String content = Files.readString(path, StandardCharsets.UTF_8).toLowerCase(Locale.ROOT);
            return content.contains("apiversion:") && content.contains("kind:");
        } catch (IOException | RuntimeException ex) {
            return false;
        }
    }

    private Path workRoot() {
        if (properties.getWorkRoot() != null && !properties.getWorkRoot().isBlank()) {
            return Path.of(properties.getWorkRoot());
        }
        return Path.of(System.getProperty("java.io.tmpdir"), "produs-scanner");
    }

    private void cleanup(Path path) {
        if (path == null || !Files.exists(path)) {
            return;
        }
        try (var stream = Files.walk(path)) {
            stream.sorted(Comparator.reverseOrder()).forEach(candidate -> {
                try {
                    Files.deleteIfExists(candidate);
                } catch (IOException ignored) {
                    // Best-effort cleanup; stale directories are visible through scanner job failure logs.
                }
            });
        } catch (IOException ignored) {
            // Best-effort cleanup.
        }
    }

    private String hostLockOwner() {
        try {
            return java.net.InetAddress.getLocalHost().getHostName();
        } catch (Exception ex) {
            return "produs-backend";
        }
    }

    private String joinCommand(List<String> command) {
        return command.stream().map(this::quoteIfNeeded).reduce((a, b) -> a + " " + b).orElse("");
    }

    private String quoteIfNeeded(String value) {
        if (value == null) {
            return "";
        }
        if (value.matches("[A-Za-z0-9_./:=@+\\-]+")) {
            return value;
        }
        return "'" + value.replace("'", "'\\''") + "'";
    }

    private String defaultString(String value) {
        return value == null ? "" : value;
    }

    private void audit(User actor, String action, String entityType, UUID entityId, AuditEvent.RiskLevel riskLevel, String details) {
        auditService.logAction(actor == null ? null : actor.getId(), action, entityType, entityId, riskLevel, details);
    }
}
