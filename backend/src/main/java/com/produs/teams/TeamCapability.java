package com.produs.teams;

import com.produs.catalog.ServiceCategory;
import com.produs.catalog.ServiceModule;
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
@Table(name = "team_capabilities")
public class TeamCapability extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(optional = false)
    @JoinColumn(name = "service_category_id", nullable = false)
    private ServiceCategory serviceCategory;

    @ManyToOne
    @JoinColumn(name = "service_module_id")
    private ServiceModule serviceModule;

    @Column(name = "evidence_url")
    private String evidenceUrl;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
