package com.produs.cart;

import com.produs.catalog.ServiceModule;
import com.produs.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
        name = "productization_cart_service_items",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_cart_service_items_cart_module",
                columnNames = {"cart_id", "service_module_id"}
        )
)
public class ProductizationCartServiceItem extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "cart_id", nullable = false)
    private ProductizationCart cart;

    @ManyToOne(optional = false)
    @JoinColumn(name = "service_module_id", nullable = false)
    private ServiceModule serviceModule;

    @Column(name = "sequence_order", nullable = false)
    private Integer sequenceOrder = 0;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
