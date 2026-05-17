package com.produs.scanner;

import com.produs.entity.User;
import com.produs.product.ProductProfile;
import com.produs.shared.BaseEntity;
import com.produs.workspace.ProjectWorkspace;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "scanner_import_runs")
public class ScannerImportRun extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_profile_id", nullable = false)
    private ProductProfile productProfile;

    @ManyToOne
    @JoinColumn(name = "workspace_id")
    private ProjectWorkspace workspace;

    @ManyToOne(optional = false)
    @JoinColumn(name = "scan_source_id", nullable = false)
    private ScanSource scanSource;

    @ManyToOne
    @JoinColumn(name = "scan_run_id")
    private ScanRun scanRun;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false)
    private ExternalProvider provider = ExternalProvider.GENERIC_JSON;

    @Enumerated(EnumType.STRING)
    @Column(name = "import_method", nullable = false)
    private ImportMethod importMethod = ImportMethod.MANUAL_API_IMPORT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ImportStatus status = ImportStatus.RUNNING;

    @Column(name = "external_reference", length = 1000)
    private String externalReference;

    @Column(name = "source_recorded_at")
    private LocalDateTime sourceRecordedAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "imported_count", nullable = false)
    private int importedCount;

    @Column(name = "skipped_count", nullable = false)
    private int skippedCount;

    @Column(name = "artifact_ref", length = 1000)
    private String artifactRef;

    @Column(name = "storage_key", length = 1000)
    private String storageKey;

    @Column(name = "error_summary", columnDefinition = "TEXT")
    private String errorSummary;

    @ManyToOne(optional = false)
    @JoinColumn(name = "requested_by", nullable = false)
    private User requestedBy;

    public enum ExternalProvider {
        GITHUB_CODE_SCANNING,
        GITHUB_DEPENDABOT,
        GITHUB_SECRET_SCANNING,
        GITLAB_SECURITY,
        SNYK,
        SONARQUBE,
        SONARCLOUD,
        SEMGREP_PLATFORM,
        SARIF,
        GENERIC_JSON
    }

    public enum ImportMethod {
        MANUAL_API_IMPORT,
        CI_TEMPLATE,
        WEBHOOK,
        CONNECTOR_SYNC
    }

    public enum ImportStatus {
        RUNNING,
        COMPLETED,
        FAILED
    }
}
