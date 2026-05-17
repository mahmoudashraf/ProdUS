package com.produs.network;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, UUID> {
    List<CommunityPost> findByStatusOrderByCreatedAtDesc(CommunityPost.PostStatus status);
    List<CommunityPost> findByChannelSlugAndStatusOrderByCreatedAtDesc(String slug, CommunityPost.PostStatus status);
    Optional<CommunityPost> findByTitleAndChannelSlug(String title, String slug);
}
