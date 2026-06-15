package com.produs.workspace;

import com.produs.network.ConversationMessage;
import com.produs.scanner.ScannerRiskThread;
import com.produs.shared.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "workspace_chat_message_risk_mentions",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_workspace_chat_message_risk",
                columnNames = {"message_id", "risk_thread_id"}
        )
)
public class WorkspaceChatMessageRiskMention extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "message_id", nullable = false)
    private ConversationMessage message;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "risk_thread_id", nullable = false)
    private ScannerRiskThread riskThread;
}
