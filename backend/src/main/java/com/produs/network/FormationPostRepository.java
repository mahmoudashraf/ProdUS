package com.produs.network;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FormationPostRepository extends JpaRepository<FormationPost, UUID> {
    List<FormationPost> findByStatusOrderByCreatedAtDesc(FormationPost.PostStatus status);
    List<FormationPost> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);
    Optional<FormationPost> findByTitleAndAuthorId(String title, UUID authorId);

    @Query("""
            select post from FormationPost post
            where post.status = com.produs.network.FormationPost.PostStatus.ACTIVE
              and (
                lower(post.title) like lower(concat('%', :query, '%'))
                or lower(coalesce(post.body, '')) like lower(concat('%', :query, '%'))
                or lower(coalesce(post.offeredServices, '')) like lower(concat('%', :query, '%'))
                or lower(coalesce(post.neededServices, '')) like lower(concat('%', :query, '%'))
                or lower(coalesce(post.workingStyle, '')) like lower(concat('%', :query, '%'))
              )
            order by post.updatedAt desc
            """)
    List<FormationPost> searchActive(@Param("query") String query);
}
