package com.produs.ai;

import com.produs.ai.LoomAIIntegrationService.KnowledgeSyncResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "loomai", name = "safe-knowledge-auto-sync-enabled", havingValue = "true")
public class LoomAISafeKnowledgeSyncScheduler {

    private final LoomAIIntegrationService integrationService;

    @Scheduled(
            initialDelayString = "${loomai.safe-knowledge-auto-sync-initial-delay-ms:60000}",
            fixedDelayString = "${loomai.safe-knowledge-auto-sync-delay-ms:300000}"
    )
    void syncSafeKnowledge() {
        KnowledgeSyncResponse response = integrationService.syncSafeKnowledgeSystem();
        log.info(
                "loomai_safe_knowledge_sync status={} records={} providerRequestId={} succeeded={} failed={} fallback={}",
                response.status(),
                response.recordCount(),
                response.providerRequestId(),
                response.succeededOperations(),
                response.failedOperations(),
                response.fallbackReason()
        );
    }
}
