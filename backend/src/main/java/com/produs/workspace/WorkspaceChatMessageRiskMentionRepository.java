package com.produs.workspace;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface WorkspaceChatMessageRiskMentionRepository
        extends JpaRepository<WorkspaceChatMessageRiskMention, UUID> {

    @Query("""
            select mention
            from WorkspaceChatMessageRiskMention mention
            join fetch mention.riskThread risk
            left join fetch risk.recommendedModule
            where mention.message.id in :messageIds
            order by mention.createdAt asc
            """)
    List<WorkspaceChatMessageRiskMention> findByMessageIds(@Param("messageIds") Collection<UUID> messageIds);
}
