package com.produs.network;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, UUID> {
    List<CommunityPost> findByStatusOrderByCreatedAtDesc(CommunityPost.PostStatus status);
    List<CommunityPost> findByChannelSlugAndStatusOrderByCreatedAtDesc(String slug, CommunityPost.PostStatus status);
    Optional<CommunityPost> findByTitleAndChannelSlug(String title, String slug);

    @Query("""
            select post from CommunityPost post
            join post.channel channel
            where post.status = com.produs.network.CommunityPost.PostStatus.ACTIVE
              and channel.active = true
              and (
                lower(post.title) like lower(concat('%', :query, '%'))
                or lower(coalesce(post.body, '')) like lower(concat('%', :query, '%'))
                or lower(coalesce(post.serviceTags, '')) like lower(concat('%', :query, '%'))
                or lower(channel.name) like lower(concat('%', :query, '%'))
                or lower(channel.slug) like lower(concat('%', :query, '%'))
              )
            order by post.updatedAt desc
            """)
    List<CommunityPost> searchActive(@Param("query") String query);
}
