package com.produs.network;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FormationPostRepository extends JpaRepository<FormationPost, UUID> {
    List<FormationPost> findByStatusOrderByCreatedAtDesc(FormationPost.PostStatus status);
    List<FormationPost> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);
    Optional<FormationPost> findByTitleAndAuthorId(String title, UUID authorId);
}
