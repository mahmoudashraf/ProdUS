'use client';

import { Box } from '@mui/material';
import {
  OwnerOverviewEvidenceChecksCard,
  OwnerOverviewTopServiceCard,
} from './OwnerOverviewProofServiceCards';
import OwnerOverviewLaunchDecisionCard from './OwnerOverviewLaunchDecisionCard';
import {
  OwnerOverviewRecommendedActionsCard,
  OwnerOverviewTopRisksCard,
} from './OwnerOverviewRiskActionCards';
import type { OwnerOverviewDecisionPanelProps } from './ownerOverviewDecisionTypes';

export default function OwnerOverviewDecisionPanel({
  launchStatus,
  latestCompletedTools,
  totalScanTools,
  topRecommendedServiceName,
  topOwnerRisks,
  ownerActionGroups,
  scannerCoverageGroups,
  selectedPackage,
  scannerMappedServices,
  onOpenServicesRecommend,
  onOpenServicesPlan,
  onOpenFindingsEvidence,
  onOpenFindingsRisks,
  onOpenTimeline,
}: OwnerOverviewDecisionPanelProps) {
  return (
    <>
      <OwnerOverviewLaunchDecisionCard
        launchStatus={launchStatus}
        latestCompletedTools={latestCompletedTools}
        totalScanTools={totalScanTools}
        topRecommendedServiceName={topRecommendedServiceName}
        onOpenFindingsEvidence={onOpenFindingsEvidence}
        onOpenServicesRecommend={onOpenServicesRecommend}
        onOpenTimeline={onOpenTimeline}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)' }, gap: 2.5 }}>
        <OwnerOverviewTopRisksCard topOwnerRisks={topOwnerRisks} onOpenFindingsRisks={onOpenFindingsRisks} />
        <OwnerOverviewRecommendedActionsCard ownerActionGroups={ownerActionGroups} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) minmax(320px, 0.8fr)' }, gap: 2.5 }}>
        <OwnerOverviewEvidenceChecksCard
          latestCompletedTools={latestCompletedTools}
          totalScanTools={totalScanTools}
          scannerCoverageGroups={scannerCoverageGroups}
        />
        <OwnerOverviewTopServiceCard
          selectedPackage={selectedPackage}
          scannerMappedServices={scannerMappedServices}
          onOpenServicesPlan={onOpenServicesPlan}
          onOpenServicesRecommend={onOpenServicesRecommend}
        />
      </Box>
    </>
  );
}
