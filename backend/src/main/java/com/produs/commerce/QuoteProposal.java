package com.produs.commerce;

import com.produs.entity.User;
import com.produs.packages.PackageInstance;
import com.produs.shared.BaseEntity;
import com.produs.teams.Team;
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
@Table(name = "quote_proposals")
public class QuoteProposal extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "package_instance_id", nullable = false)
    private PackageInstance packageInstance;

    @ManyToOne(optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(optional = false)
    @JoinColumn(name = "submitted_by", nullable = false)
    private User submittedBy;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String scope;

    @Column(columnDefinition = "TEXT")
    private String assumptions;

    @Column(name = "timeline_days", nullable = false)
    private Integer timelineDays = 14;

    @Column(nullable = false, length = 3)
    private String currency = "USD";

    @Column(name = "fixed_price_cents", nullable = false)
    private Long fixedPriceCents = 0L;

    @Column(name = "platform_fee_cents", nullable = false)
    private Long platformFeeCents = 0L;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProposalStatus status = ProposalStatus.DRAFT;

    public enum ProposalStatus {
        DRAFT,
        SUBMITTED,
        OWNER_ACCEPTED,
        OWNER_REJECTED,
        WITHDRAWN,
        EXPIRED
    }
}
