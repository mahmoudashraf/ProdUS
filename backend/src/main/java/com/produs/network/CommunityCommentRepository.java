package com.produs.network;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommunityCommentRepository extends JpaRepository<CommunityComment, UUID> {
    List<CommunityComment> findByPostIdAndStatusOrderByCreatedAtAsc(UUID postId, CommunityComment.CommentStatus status);
    long countByPostIdAndStatus(UUID postId, CommunityComment.CommentStatus status);
}
