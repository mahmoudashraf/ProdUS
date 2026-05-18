package com.produs.scanner;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ScannerJobScheduler {

    private final ScannerProperties properties;
    private final ScannerService scannerService;
    private final ScannerWorker worker;

    @Scheduled(fixedDelayString = "${app.scanner.poll-fixed-delay-ms:10000}")
    public void runDueScannerJobs() {
        if (!properties.isSchedulerEnabled() || !properties.isWorkerEnabled()) {
            return;
        }
        scannerService.enqueueDueSchedules();
        worker.executeNextQueuedJob();
    }
}
