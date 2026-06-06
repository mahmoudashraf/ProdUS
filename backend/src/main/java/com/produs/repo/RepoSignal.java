package com.produs.repo;

import com.produs.product.ProductProfile;
import com.produs.shared.BaseEntity;
import com.produs.workspace.ProjectWorkspace;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
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
@Table(
        name = "repo_signals",
        indexes = {
                @Index(name = "idx_repo_signals_product", columnList = "product_profile_id"),
                @Index(name = "idx_repo_signals_workspace", columnList = "workspace_id"),
                @Index(name = "idx_repo_signals_type", columnList = "signal_type")
        }
)
public class RepoSignal extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_profile_id", nullable = false)
    private ProductProfile productProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id")
    private ProjectWorkspace workspace;

    @Enumerated(EnumType.STRING)
    @Column(name = "signal_type", nullable = false, length = 80)
    private SignalType signalType = SignalType.UNKNOWN;

    @Column(name = "signal_value", nullable = false, columnDefinition = "TEXT")
    private String signalValue;

    @Column(nullable = false)
    private double confidence = 0.5;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 80)
    private SignalSource source = SignalSource.BACKEND_INFERENCE;

    @Column(name = "source_tool")
    private String sourceTool;

    @Column(name = "source_path", length = 1000)
    private String sourcePath;

    @Enumerated(EnumType.STRING)
    @Column(name = "evidence_kind", nullable = false, length = 80)
    private EvidenceKind evidenceKind = EvidenceKind.INFERRED;

    @Column(name = "owner_safe_evidence", columnDefinition = "TEXT")
    private String ownerSafeEvidence;

    @Column(name = "detected_at", nullable = false)
    private LocalDateTime detectedAt = LocalDateTime.now();

    public enum SignalType {
        REPOSITORY_SOURCE,
        SOURCE_AUTHORIZATION,
        DEFAULT_BRANCH,
        PRODUCT_URL,
        DECLARED_TECH_STACK,
        LANGUAGE,
        FRAMEWORK,
        DATABASE,
        AUTH,
        CI_CD,
        TESTING,
        DEPLOYMENT,
        DOCUMENTATION,
        DEPENDENCY,
        SECURITY,
        RUNTIME,
        SCANNER_STATUS,
        SCANNER_FINDING,
        UNKNOWN
    }

    public enum SignalSource {
        PRODUCT_PROFILE,
        SCAN_SOURCE,
        SCAN_RUN,
        SCANNER_FINDING,
        BACKEND_INFERENCE
    }

    public enum EvidenceKind {
        OWNER_PROVIDED,
        AUTHORIZED_CONNECTOR,
        SCANNER_RESULT,
        RUNTIME_TARGET,
        INFERRED,
        UNKNOWN
    }
}
