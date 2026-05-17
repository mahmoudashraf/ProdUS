package com.produs.experts;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExpertProfileRepository extends JpaRepository<ExpertProfile, UUID> {
    Optional<ExpertProfile> findByUserId(UUID userId);
    Optional<ExpertProfile> findByIdAndActiveTrue(UUID id);
    List<ExpertProfile> findByActiveTrueOrderByUpdatedAtDesc();

    @Query("""
            select profile from ExpertProfile profile
            where profile.active = true
              and (
                lower(profile.displayName) like lower(concat('%', :query, '%'))
                or lower(coalesce(profile.headline, '')) like lower(concat('%', :query, '%'))
                or lower(coalesce(profile.bio, '')) like lower(concat('%', :query, '%'))
                or lower(coalesce(profile.skills, '')) like lower(concat('%', :query, '%'))
                or lower(coalesce(profile.location, '')) like lower(concat('%', :query, '%'))
              )
            order by profile.updatedAt desc
            """)
    List<ExpertProfile> searchActive(@Param("query") String query);
}
