package com.produs.cart;

import com.produs.experts.ExpertProfile;
import com.produs.shared.BaseEntity;
import com.produs.teams.Team;
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
@Table(name = "productization_cart_talent_items")
public class ProductizationCartTalentItem extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "cart_id", nullable = false)
    private ProductizationCart cart;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false)
    private TalentItemType itemType;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;

    @ManyToOne
    @JoinColumn(name = "expert_profile_id")
    private ExpertProfile expertProfile;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public enum TalentItemType {
        TEAM,
        EXPERT
    }
}
