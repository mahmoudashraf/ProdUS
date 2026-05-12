package com.produs.shortlist;

import com.produs.entity.User;
import com.produs.packages.PackageInstance;
import com.produs.shared.BaseEntity;
import com.produs.teams.Team;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "team_shortlists",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_team_shortlists_owner_package_team",
                        columnNames = {"owner_id", "package_instance_id", "team_id"}
                )
        }
)
public class TeamShortlist extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(optional = false)
    @JoinColumn(name = "package_instance_id", nullable = false)
    private PackageInstance packageInstance;

    @ManyToOne(optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShortlistStatus status = ShortlistStatus.ACTIVE;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public enum ShortlistStatus {
        ACTIVE,
        COMPARED,
        REQUESTED_PROPOSAL,
        ARCHIVED
    }
}
