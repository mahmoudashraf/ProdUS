package com.produs.mcp;

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

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "mcp_tool_invocations")
public class McpToolInvocation extends BaseEntity {

    public enum InvocationStatus {
        SUCCEEDED,
        FAILED,
        FORBIDDEN
    }

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "role", nullable = false, length = 40)
    private String role;

    @Column(name = "tool_name", nullable = false, length = 160)
    private String toolName;

    @Column(name = "request_id", length = 120)
    private String requestId;

    @Column(name = "target_type", length = 120)
    private String targetType;

    @Column(name = "target_id", length = 120)
    private String targetId;

    @Column(name = "input_hash", length = 128)
    private String inputHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private InvocationStatus status;

    @Column(name = "backend_status")
    private Integer backendStatus;

    @Column(name = "error_summary", columnDefinition = "TEXT")
    private String errorSummary;
}
