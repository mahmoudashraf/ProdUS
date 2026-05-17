package com.produs.network;

import com.produs.entity.User;
import com.produs.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "network_conversation_participants",
        uniqueConstraints = @UniqueConstraint(name = "uk_network_thread_user", columnNames = {"thread_id", "user_id"})
)
public class ConversationParticipant extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "thread_id", nullable = false)
    private ConversationThread thread;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "participant_role", nullable = false)
    private String participantRole = "participant";

    @Column(nullable = false)
    private boolean muted = false;

    @Column(nullable = false)
    private boolean archived = false;

    @Column(name = "last_read_at")
    private LocalDateTime lastReadAt;
}
