package com.produs.product;

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
@Table(name = "product_scanner_recommendations")
public class ProductScannerRecommendation extends BaseEntity {

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "product_profile_id", nullable = false)
    private ProductProfile productProfile;

    @Column(name = "scanner_focus_area", nullable = false)
    private String scannerFocusArea;

    @Column(nullable = false)
    private String source = "AI_PROJECT_ANALYSIS";

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "recommended_checks_json", columnDefinition = "TEXT")
    private String recommendedChecksJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.SUGGESTED;

    @Column(name = "created_by_ai", nullable = false)
    private boolean createdByAi = true;

    public enum Status {
        SUGGESTED,
        CONFIGURED,
        SKIPPED
    }
}
