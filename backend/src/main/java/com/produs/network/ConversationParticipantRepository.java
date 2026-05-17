package com.produs.network;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, UUID> {
    boolean existsByThreadIdAndUserId(UUID threadId, UUID userId);
    Optional<ConversationParticipant> findByThreadIdAndUserId(UUID threadId, UUID userId);
    List<ConversationParticipant> findByThreadIdOrderByCreatedAtAsc(UUID threadId);
}
