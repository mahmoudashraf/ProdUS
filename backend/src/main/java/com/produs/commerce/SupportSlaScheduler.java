package com.produs.commerce;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.support.sla", name = "scheduler-enabled", havingValue = "true", matchIfMissing = true)
public class SupportSlaScheduler {

    private final SupportSlaService supportSlaService;
    private final SupportSlaProperties properties;

    @Scheduled(fixedDelayString = "${app.support.sla.scan-fixed-delay-ms:900000}")
    void scanSupportSla() {
        if (properties.isEnabled()) {
            supportSlaService.runSlaScan();
        }
    }
}
