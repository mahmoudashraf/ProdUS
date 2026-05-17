package com.produs.network;

import com.produs.entity.User;
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

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "network_formation_posts")
public class FormationPost extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;

    @Enumerated(EnumType.STRING)
    @Column(name = "post_type", nullable = false)
    private PostType postType = PostType.LOOKING_FOR_TEAM;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(name = "offered_services", columnDefinition = "TEXT")
    private String offeredServices;

    @Column(name = "needed_services", columnDefinition = "TEXT")
    private String neededServices;

    @Column(name = "working_style")
    private String workingStyle;

    @Column
    private String timezone;

    @Column(name = "package_size")
    private String packageSize;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostStatus status = PostStatus.ACTIVE;

    @Column(name = "expires_on")
    private LocalDate expiresOn;

    public enum PostType {
        LOOKING_FOR_TEAM,
        TEAM_OPENING
    }

    public enum PostStatus {
        ACTIVE,
        PAUSED,
        CLOSED
    }
}
