package com.produs.engine;

import com.produs.entity.User;
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

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "handoff_documents")
public class HandoffDocument extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private ProjectWorkspace workspace;

    @ManyToOne(optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(nullable = false)
    private String title;

    @Column(name = "runbook", columnDefinition = "TEXT")
    private String runbook;

    @Column(name = "access_checklist", columnDefinition = "TEXT")
    private String accessChecklist;

    @Column(name = "known_issues", columnDefinition = "TEXT")
    private String knownIssues;

    @Column(name = "support_scope", columnDefinition = "TEXT")
    private String supportScope;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HandoffStatus status = HandoffStatus.DRAFT;

    public enum HandoffStatus {
        DRAFT,
        READY_FOR_OWNER,
        ACCEPTED,
        ARCHIVED
    }
}
