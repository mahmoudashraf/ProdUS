package com.produs.packages;

import com.produs.entity.User;
import com.produs.product.ProductProfile;
import com.produs.requirements.RequirementIntake;
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
@Table(name = "package_instances")
public class PackageInstance extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_profile_id", nullable = false)
    private ProductProfile productProfile;

    @ManyToOne
    @JoinColumn(name = "requirement_intake_id")
    private RequirementIntake requirementIntake;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PackageStatus status = PackageStatus.DRAFT;

    public enum PackageStatus {
        DRAFT,
        AWAITING_TEAM,
        SCOPE_NEGOTIATION,
        ACTIVE_DELIVERY,
        MILESTONE_REVIEW,
        DELIVERED,
        SUPPORT_HANDOFF,
        CLOSED
    }
}
