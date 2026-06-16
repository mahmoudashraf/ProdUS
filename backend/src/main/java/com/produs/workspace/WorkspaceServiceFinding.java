package com.produs.workspace;

import com.produs.catalog.ServiceModule;
import com.produs.entity.User;
import com.produs.scanner.ScannerRiskThread;
import com.produs.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "workspace_service_findings",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_workspace_service_finding_scope",
                columnNames = {"workspace_id", "service_module_id", "risk_thread_id"}
        )
)
public class WorkspaceServiceFinding extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private ProjectWorkspace workspace;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_module_id", nullable = false)
    private ServiceModule serviceModule;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "risk_thread_id", nullable = false)
    private ScannerRiskThread riskThread;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkspaceServiceFindingStatus status = WorkspaceServiceFindingStatus.INCLUDED;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "added_by_id")
    private User addedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "removed_by_id")
    private User removedBy;

    public enum WorkspaceServiceFindingStatus {
        INCLUDED,
        EXCLUDED
    }
}
