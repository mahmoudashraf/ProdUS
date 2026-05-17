package com.produs.network;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CommunityHelpfulMarkRepository extends JpaRepository<CommunityHelpfulMark, UUID> {
    boolean existsByPostIdAndUserId(UUID postId, UUID userId);
}
