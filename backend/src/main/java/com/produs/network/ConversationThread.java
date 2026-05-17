package com.produs.network;

import com.produs.entity.User;
import com.produs.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "network_conversation_threads")
public class ConversationThread extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "scope_type", nullable = false)
    private ScopeType scopeType = ScopeType.DIRECT;

    @Column(name = "scope_id")
    private UUID scopeId;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ThreadStatus status = ThreadStatus.OPEN;

    @ManyToOne(optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    public enum ScopeType {
        DIRECT,
        EXPERT_PROFILE,
        TEAM_PROFILE,
        TEAM_OPENING,
        FORMATION_POST,
        TEAM_JOIN_REQUEST,
        TRIAL_COLLABORATION
    }

    public enum ThreadStatus {
        OPEN,
        ARCHIVED,
        LOCKED
    }
}
