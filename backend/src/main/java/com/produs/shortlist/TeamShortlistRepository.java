package com.produs.shortlist;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamShortlistRepository extends JpaRepository<TeamShortlist, UUID> {
    List<TeamShortlist> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<TeamShortlist> findByOwnerIdAndPackageInstanceIdOrderByCreatedAtDesc(UUID ownerId, UUID packageInstanceId);
    Optional<TeamShortlist> findByOwnerIdAndPackageInstanceIdAndTeamId(UUID ownerId, UUID packageInstanceId, UUID teamId);
}
