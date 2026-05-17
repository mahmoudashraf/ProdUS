package com.produs.network;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConversationMessageRepository extends JpaRepository<ConversationMessage, UUID> {
    List<ConversationMessage> findByThreadIdAndDeletedAtIsNullOrderByCreatedAtAsc(UUID threadId);
}
