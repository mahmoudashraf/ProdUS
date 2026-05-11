package com.produs.commerce;

import com.produs.entity.User;
import com.produs.shared.BaseEntity;
import com.produs.teams.Team;
import com.produs.workspace.ProjectWorkspace;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "contract_agreements")
public class ContractAgreement extends BaseEntity {

    @OneToOne(optional = false)
    @JoinColumn(name = "proposal_id", nullable = false, unique = true)
    private QuoteProposal proposal;

    @ManyToOne
    @JoinColumn(name = "workspace_id")
    private ProjectWorkspace workspace;

    @ManyToOne(optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String terms;

    @Column(name = "effective_on")
    private LocalDate effectiveOn;

    @Column(name = "signed_at")
    private LocalDateTime signedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContractStatus status = ContractStatus.DRAFT;

    public enum ContractStatus {
        DRAFT,
        SENT,
        SIGNED,
        ACTIVE,
        COMPLETED,
        CANCELLED
    }
}
