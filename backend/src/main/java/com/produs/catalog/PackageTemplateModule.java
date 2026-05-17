package com.produs.catalog;

import com.produs.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "catalog_package_template_modules")
public class PackageTemplateModule extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "template_id", nullable = false)
    private PackageTemplate template;

    @ManyToOne(optional = false)
    @JoinColumn(name = "service_module_id", nullable = false)
    private ServiceModule serviceModule;

    @Column(name = "sequence_order", nullable = false)
    private Integer sequenceOrder = 0;

    @Column(nullable = false)
    private boolean required = true;

    @Column(name = "phase_name")
    private String phaseName;

    @Column(columnDefinition = "TEXT")
    private String rationale;
}
