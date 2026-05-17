package com.produs.network;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationThreadRepository extends JpaRepository<ConversationThread, UUID> {
    Optional<ConversationThread> findByScopeTypeAndScopeIdAndCreatedById(
            ConversationThread.ScopeType scopeType,
            UUID scopeId,
            UUID createdById
    );

    @Query("""
            select distinct thread
            from ConversationThread thread
            join ConversationParticipant participant on participant.thread.id = thread.id
            where participant.user.id = :userId
            order by coalesce(thread.lastMessageAt, thread.createdAt) desc
            """)
    List<ConversationThread> findVisibleThreads(@Param("userId") UUID userId);
}
