'use client';

import type { ComponentProps } from 'react';
import { Stack } from '@mui/material';
import LaunchReadinessReportPanel from './LaunchReadinessReportPanel';
import OwnerOverviewDecisionPanel from './OwnerOverviewDecisionPanel';
import { OwnerLaunchReadyCelebration } from './OwnerJourneyCards';
import type { OverviewJourneyView } from './ownerWorkspaceJourneyConfig';
import { Surface } from './PlatformComponents';
import ShipConfidencePanel from './ShipConfidencePanel';

type LaunchCelebrationProps = ComponentProps<typeof OwnerLaunchReadyCelebration>;
type DecisionPanelProps = ComponentProps<typeof OwnerOverviewDecisionPanel>;
type ShipConfidenceProps = ComponentProps<typeof ShipConfidencePanel>;
type LaunchReadinessReportProps = ComponentProps<typeof LaunchReadinessReportPanel>;

interface OwnerWorkspaceOverviewPaneProps {
  view: OverviewJourneyView;
  detailOpen: boolean;
  launchCelebration: LaunchCelebrationProps;
  decision: DecisionPanelProps;
  shipConfidence: ShipConfidenceProps;
  launchReadinessReport: LaunchReadinessReportProps;
}

export default function OwnerWorkspaceOverviewPane({
  view,
  detailOpen,
  launchCelebration,
  decision,
  shipConfidence,
  launchReadinessReport,
}: OwnerWorkspaceOverviewPaneProps) {
  return (
    <Stack spacing={2.5}>
      <OwnerLaunchReadyCelebration {...launchCelebration} />

      {detailOpen && view === 'decision' && (
        <OwnerOverviewDecisionPanel {...decision} />
      )}

      {detailOpen && view === 'progress' && (
        <>
          <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f9fcff 100%)' }}>
            <ShipConfidencePanel {...shipConfidence} />
          </Surface>
          <LaunchReadinessReportPanel {...launchReadinessReport} />
        </>
      )}
    </Stack>
  );
}
