package com.produs.scanner;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class ScannerProcessRunner {

    private static final int MAX_LOG_BYTES = 128_000;
    private final ScannerProperties properties;

    public ProcessResult run(String commandTemplate, Path workDir, Map<String, String> placeholders, Duration timeout) {
        List<String> command = renderCommand(commandTemplate, placeholders);
        if (command.isEmpty()) {
            throw new IllegalArgumentException("Scanner command is empty");
        }
        if (!isExecutableAvailable(command.getFirst())) {
            throw new IllegalStateException("Scanner executable is not available on PATH: " + command.getFirst());
        }
        try {
            Files.createDirectories(workDir);
            ProcessBuilder builder = new ProcessBuilder(command);
            builder.directory(workDir.toFile());
            builder.environment().put("NO_COLOR", "1");
            long started = System.nanoTime();
            Process process = builder.start();
            CompletableFuture<String> stdout = CompletableFuture.supplyAsync(() -> readLimited(process.getInputStream(), MAX_LOG_BYTES));
            CompletableFuture<String> stderr = CompletableFuture.supplyAsync(() -> readLimited(process.getErrorStream(), MAX_LOG_BYTES));
            boolean finished = process.waitFor(timeout.toMillis(), TimeUnit.MILLISECONDS);
            if (!finished) {
                process.destroyForcibly();
                return new ProcessResult(-1, stdout.join(), stderr.join(), Duration.ofMillis(timeout.toMillis()), true);
            }
            Duration duration = Duration.ofNanos(System.nanoTime() - started);
            return new ProcessResult(process.exitValue(), stdout.join(), stderr.join(), duration, false);
        } catch (IOException ex) {
            throw new IllegalStateException("Scanner process failed to start: " + ex.getMessage(), ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Scanner process was interrupted", ex);
        }
    }

    public boolean isExecutableAvailable(String executable) {
        if (executable == null || executable.isBlank()) {
            return false;
        }
        Path path = Path.of(executable);
        if (path.isAbsolute() || executable.contains("/")) {
            return Files.isExecutable(path);
        }
        String pathValue = System.getenv("PATH");
        if (pathValue == null || pathValue.isBlank()) {
            return false;
        }
        for (String directory : pathValue.split(java.io.File.pathSeparator)) {
            Path candidate = Path.of(directory, executable);
            if (Files.isExecutable(candidate)) {
                return true;
            }
        }
        return false;
    }

    public List<String> renderCommand(String commandTemplate, Map<String, String> placeholders) {
        if (commandTemplate == null || commandTemplate.isBlank()) {
            return List.of();
        }
        String rendered = commandTemplate;
        for (Map.Entry<String, String> entry : placeholders.entrySet()) {
            rendered = rendered.replace("{" + entry.getKey() + "}", entry.getValue() == null ? "" : entry.getValue());
        }
        return tokenize(rendered);
    }

    private List<String> tokenize(String command) {
        List<String> tokens = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean single = false;
        boolean dbl = false;
        boolean escaping = false;
        for (int i = 0; i < command.length(); i++) {
            char ch = command.charAt(i);
            if (escaping) {
                current.append(ch);
                escaping = false;
                continue;
            }
            if (ch == '\\') {
                escaping = true;
                continue;
            }
            if (ch == '\'' && !dbl) {
                single = !single;
                continue;
            }
            if (ch == '"' && !single) {
                dbl = !dbl;
                continue;
            }
            if (Character.isWhitespace(ch) && !single && !dbl) {
                if (!current.isEmpty()) {
                    tokens.add(current.toString());
                    current.setLength(0);
                }
                continue;
            }
            current.append(ch);
        }
        if (!current.isEmpty()) {
            tokens.add(current.toString());
        }
        return tokens;
    }

    private String readLimited(InputStream stream, int maxBytes) {
        try (stream; ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int total = 0;
            int read;
            while ((read = stream.read(buffer)) != -1 && total < maxBytes) {
                int accepted = Math.min(read, maxBytes - total);
                output.write(buffer, 0, accepted);
                total += accepted;
            }
            return output.toString(StandardCharsets.UTF_8);
        } catch (IOException ex) {
            return "Unable to read scanner process output: " + ex.getMessage();
        }
    }

    public record ProcessResult(
            int exitCode,
            String stdout,
            String stderr,
            Duration duration,
            boolean timedOut
    ) {}
}
