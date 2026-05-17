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
@Table(name = "automated_checks")
public class AutomatedCheck extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private ProjectWorkspace workspace;

    @ManyToOne
    @JoinColumn(name = "milestone_id")
    private Milestone milestone;

    @ManyToOne
    @JoinColumn(name = "criterion_id")
    private AcceptanceCriterion criterion;

    @Column(name = "check_type", nullable = false)
    private String checkType;

    @Column(nullable = false)
    private String provider;

    @Column(name = "external_ref")
    private String externalRef;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CheckStatus status = CheckStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "raw_payload", columnDefinition = "TEXT")
    private String rawPayload;

    @Column(name = "observed_at")
    private LocalDateTime observedAt;

    public enum CheckStatus {
        PENDING,
        PASSED,
        WARNING,
        FAILED
    }
}
