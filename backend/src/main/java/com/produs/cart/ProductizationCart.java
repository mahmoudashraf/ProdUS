package com.produs.cart;

import com.produs.entity.User;
import com.produs.packages.PackageInstance;
import com.produs.product.ProductProfile;
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
@Table(name = "productization_carts")
public class ProductizationCart extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne
    @JoinColumn(name = "product_profile_id")
    private ProductProfile productProfile;

    @Column(nullable = false)
    private String title = "Productization cart";

    @Column(name = "business_goal", columnDefinition = "TEXT")
    private String businessGoal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CartStatus status = CartStatus.DRAFT;

    @ManyToOne
    @JoinColumn(name = "converted_package_id")
    private PackageInstance convertedPackage;

    @ManyToOne
    @JoinColumn(name = "converted_workspace_id")
    private ProjectWorkspace convertedWorkspace;

    public enum CartStatus {
        DRAFT,
        CONVERTED,
        ARCHIVED
    }
}
