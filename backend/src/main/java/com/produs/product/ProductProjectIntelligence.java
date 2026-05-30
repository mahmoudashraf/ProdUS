package com.produs.product;

import com.produs.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "product_project_intelligence")
public class ProductProjectIntelligence extends BaseEntity {

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "product_profile_id", nullable = false)
    private ProductProfile productProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creation_intent_id")
    private ProductCreationIntent creationIntent;

    @Column(name = "analysis_provider")
    private String analysisProvider;

    @Column(name = "analysis_provider_request_id")
    private String analysisProviderRequestId;

    @Column(name = "analysis_schema_version", nullable = false)
    private String analysisSchemaVersion = "produs-project-analysis-v1";

    @Column(name = "analysis_json", nullable = false, columnDefinition = "TEXT")
    private String analysisJson;

    @Column(name = "owner_approved_at", nullable = false)
    private LocalDateTime ownerApprovedAt;

    @Column(name = "created_by_ai", nullable = false)
    private boolean createdByAi = true;
}
