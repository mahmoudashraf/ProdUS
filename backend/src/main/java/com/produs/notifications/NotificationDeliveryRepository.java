package com.produs.notifications;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface NotificationDeliveryRepository extends JpaRepository<NotificationDelivery, UUID> {
    @Query("""
            select delivery
            from NotificationDelivery delivery
            where delivery.status = :status
              and (delivery.nextAttemptAt is null or delivery.nextAttemptAt <= :nextAttemptAt)
            order by delivery.createdAt asc
            """)
    List<NotificationDelivery> findReadyForDispatch(
            @Param("status") NotificationDelivery.DeliveryStatus status,
            @Param("nextAttemptAt") LocalDateTime nextAttemptAt,
            Pageable pageable
    );

    List<NotificationDelivery> findTop100ByOrderByCreatedAtDesc();
    List<NotificationDelivery> findTop100ByStatusOrderByCreatedAtDesc(NotificationDelivery.DeliveryStatus status);
}
