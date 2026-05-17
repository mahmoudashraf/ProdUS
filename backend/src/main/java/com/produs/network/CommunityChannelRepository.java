package com.produs.network;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CommunityChannelRepository extends JpaRepository<CommunityChannel, UUID> {
    List<CommunityChannel> findByActiveTrueOrderBySortOrderAsc();
    Optional<CommunityChannel> findBySlug(String slug);
    Optional<CommunityChannel> findBySlugAndActiveTrue(String slug);
}
