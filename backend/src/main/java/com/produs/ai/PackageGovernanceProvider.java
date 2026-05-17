package com.produs.ai;

import java.util.List;
import java.util.UUID;

public interface PackageGovernanceProvider {

    PackageGovernanceResult reviewPackage(PackageGovernanceRequest request);

    record PackageGovernanceRequest(
            UUID requirementId,
            UUID packageId,
            UUID productId,
            String productName,
            String businessGoal,
            String riskSignals,
            List<String> moduleNames,
            String deterministicOutputJson,
            double fallbackConfidence
    ) {}

    record PackageGovernanceResult(
            String provider,
            String promptVersion,
            double confidence,
            String rationale,
            String outputJson,
            boolean fallback,
            String fallbackReason,
            String providerRequestId
    ) {}
}
