package com.produs.catalog;

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
@Table(name = "service_dependencies")
public class ServiceDependency extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "source_module_id", nullable = false)
    private ServiceModule sourceModule;

    @ManyToOne(optional = false)
    @JoinColumn(name = "depends_on_module_id", nullable = false)
    private ServiceModule dependsOnModule;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "dependency_type", nullable = false)
    private DependencyType dependencyType = DependencyType.HARD;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DependencySeverity severity = DependencySeverity.BLOCKER;

    @Column(name = "rule_metadata", columnDefinition = "TEXT")
    private String ruleMetadata;

    @Column(nullable = false)
    private boolean required = true;

    public enum DependencyType {
        HARD,
        SOFT,
        PARALLEL,
        APPROVAL,
        EVIDENCE,
        ACCESS,
        RISK,
        COMMERCIAL
    }

    public enum DependencySeverity {
        INFO,
        RECOMMENDED,
        WARNING,
        BLOCKER
    }
}
