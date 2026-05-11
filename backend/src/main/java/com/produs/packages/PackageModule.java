package com.produs.packages;

import com.produs.catalog.ServiceModule;
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
@Table(name = "package_modules")
public class PackageModule extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "package_instance_id", nullable = false)
    private PackageInstance packageInstance;

    @ManyToOne(optional = false)
    @JoinColumn(name = "service_module_id", nullable = false)
    private ServiceModule serviceModule;

    @Column(name = "sequence_order", nullable = false)
    private Integer sequenceOrder = 0;

    @Column(nullable = false)
    private boolean required = true;

    @Column(columnDefinition = "TEXT")
    private String rationale;

    @Column(name = "deliverables", columnDefinition = "TEXT")
    private String deliverables;

    @Column(name = "acceptance_criteria", columnDefinition = "TEXT")
    private String acceptanceCriteria;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ModuleStatus status = ModuleStatus.PLANNED;

    public enum ModuleStatus {
        PLANNED,
        IN_PROGRESS,
        REVIEW,
        ACCEPTED,
        BLOCKED
    }
}
