package com.produs.experts;

import com.produs.entity.User;
import com.produs.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "expert_profiles")
public class ExpertProfile extends BaseEntity {

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String displayName;

    @Column
    private String headline;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "profile_photo_url", columnDefinition = "TEXT")
    private String profilePhotoUrl;

    @Column(name = "cover_photo_url", columnDefinition = "TEXT")
    private String coverPhotoUrl;

    @Column
    private String location;

    @Column
    private String timezone;

    @Column(name = "website_url")
    private String websiteUrl;

    @Column(name = "portfolio_url")
    private String portfolioUrl;

    @Column(name = "skills", columnDefinition = "TEXT")
    private String skills;

    @Column(name = "preferred_project_size")
    private String preferredProjectSize;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Availability availability = Availability.AVAILABLE;

    @Column(name = "solo_mode", nullable = false)
    private boolean soloMode = true;

    @Column(nullable = false)
    private boolean active = true;

    public enum Availability {
        AVAILABLE,
        LIMITED,
        BUSY,
        OFFLINE
    }
}
