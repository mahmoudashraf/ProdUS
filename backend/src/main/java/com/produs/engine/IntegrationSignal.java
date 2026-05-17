package com.produs.engine;

import com.produs.shared.BaseEntity;
import com.produs.workspace.Milestone;
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
@Table(name = "integration_signals")
public class IntegrationSignal extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "connection_id", nullable = false)
    private IntegrationConnection connection;

    @ManyToOne
    @JoinColumn(name = "workspace_id")
    private ProjectWorkspace workspace;

    @ManyToOne
    @JoinColumn(name = "milestone_id")
    private Milestone milestone;

    @ManyToOne
    @JoinColumn(name = "criterion_id")
    private AcceptanceCriterion criterion;

    @Column(name = "signal_type", nullable = false)
    private String signalType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SignalStatus status = SignalStatus.INFO;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "evidence_payload", columnDefinition = "TEXT")
    private String evidencePayload;

    @Column(name = "recorded_at")
    private LocalDateTime recordedAt;

    public enum SignalStatus {
        INFO,
        PASSED,
        WARNING,
        FAILED
    }
}
