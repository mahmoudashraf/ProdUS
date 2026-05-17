package com.produs.network;

import com.produs.entity.User;
import com.produs.shared.BaseEntity;
import jakarta.persistence.Entity;
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
        name = "network_helpful_marks",
        uniqueConstraints = @UniqueConstraint(name = "uk_network_helpful_post_user", columnNames = {"post_id", "user_id"})
)
public class CommunityHelpfulMark extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private CommunityPost post;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
