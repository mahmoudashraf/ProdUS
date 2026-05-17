package com.produs.catalog;

import com.produs.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "catalog_template_definitions")
public class CatalogTemplateDefinition extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String slug;

    @Enumerated(EnumType.STRING)
    @Column(name = "template_type", nullable = false)
    private TemplateType templateType = TemplateType.PACKAGE;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "required_inputs", columnDefinition = "TEXT")
    private String requiredInputs;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "output_contract", columnDefinition = "TEXT")
    private String outputContract;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    public enum TemplateType {
        INTAKE,
        DIAGNOSIS,
        PACKAGE,
        MILESTONE,
        ACCEPTANCE_CRITERION,
        EVIDENCE,
        HANDOFF,
        SUPPORT,
        AI_CONTEXT
    }
}
