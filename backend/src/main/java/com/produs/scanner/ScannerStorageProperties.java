package com.produs.scanner;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.scanner.storage")
public class ScannerStorageProperties {
    private int rawArtifactRetentionDays = 90;
    private int importPayloadRetentionDays = 90;
    private int evidenceArtifactRetentionDays = 365;
    private boolean retentionCleanupEnabled = false;
    private boolean exportEnabled = true;
    private int signedUrlDurationSeconds = 900;
}
