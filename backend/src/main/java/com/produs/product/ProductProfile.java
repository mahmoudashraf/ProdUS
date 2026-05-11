package com.produs.product;

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
@Table(name = "product_profiles")
public class ProductProfile extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Enumerated(EnumType.STRING)
    @Column(name = "business_stage", nullable = false)
    private BusinessStage businessStage = BusinessStage.PROTOTYPE;

    @Column(name = "tech_stack", columnDefinition = "TEXT")
    private String techStack;

    @Column(name = "product_url")
    private String productUrl;

    @Column(name = "repository_url")
    private String repositoryUrl;

    @Column(name = "risk_profile", columnDefinition = "TEXT")
    private String riskProfile;

    public enum BusinessStage {
        IDEA,
        PROTOTYPE,
        VALIDATED,
        LIVE,
        SCALING
    }
}
