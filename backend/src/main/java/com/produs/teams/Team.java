package com.produs.teams;

import com.produs.entity.User;
import com.produs.shared.BaseEntity;
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
@Table(name = "teams")
public class Team extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "manager_id", nullable = false)
    private User manager;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column
    private String timezone;

    @Column(name = "capabilities_summary", columnDefinition = "TEXT")
    private String capabilitiesSummary;

    @Column(name = "typical_project_size")
    private String typicalProjectSize;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false)
    private VerificationStatus verificationStatus = VerificationStatus.APPLIED;

    @Column(nullable = false)
    private boolean active = true;

    public enum VerificationStatus {
        APPLIED,
        VERIFIED,
        CERTIFIED,
        SPECIALIST,
        OPERATIONS_READY,
        SUSPENDED
    }
}
