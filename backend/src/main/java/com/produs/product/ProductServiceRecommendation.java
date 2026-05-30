package com.produs.product;

import com.produs.catalog.ServiceModule;
import com.produs.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
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
@Table(name = "product_service_recommendations")
public class ProductServiceRecommendation extends BaseEntity {

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "product_profile_id", nullable = false)
    private ProductProfile productProfile;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "service_module_id", nullable = false)
    private ServiceModule serviceModule;

    @Column(name = "module_code", nullable = false)
    private String moduleCode;

    @Column(nullable = false)
    private String priority = "SHOULD";

    @Column(name = "sequence_number", nullable = false)
    private int sequenceNumber;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "evidence_basis_json", columnDefinition = "TEXT")
    private String evidenceBasisJson;

    @Column(name = "expected_outcome", columnDefinition = "TEXT")
    private String expectedOutcome;

    @Column
    private Double confidence;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.RECOMMENDED;

    @Column(name = "created_by_ai", nullable = false)
    private boolean createdByAi = true;

    public enum Status {
        RECOMMENDED,
        ACCEPTED,
        DECLINED,
        ADDED_TO_PLAN
    }
}
