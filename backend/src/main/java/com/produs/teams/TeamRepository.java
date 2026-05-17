package com.produs.teams;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamRepository extends JpaRepository<Team, UUID> {
    List<Team> findByActiveTrueOrderByCreatedAtDesc();
    Optional<Team> findByIdAndActiveTrue(UUID id);
    List<Team> findByManagerIdOrderByCreatedAtDesc(UUID managerId);

    @Query("""
            select team from Team team
            where team.active = true
              and (
                lower(team.name) like lower(concat('%', :query, '%'))
                or lower(coalesce(team.description, '')) like lower(concat('%', :query, '%'))
                or lower(coalesce(team.headline, '')) like lower(concat('%', :query, '%'))
                or lower(coalesce(team.bio, '')) like lower(concat('%', :query, '%'))
                or lower(coalesce(team.capabilitiesSummary, '')) like lower(concat('%', :query, '%'))
                or lower(coalesce(team.timezone, '')) like lower(concat('%', :query, '%'))
              )
            order by team.updatedAt desc
            """)
    List<Team> searchActive(@Param("query") String query);
}
