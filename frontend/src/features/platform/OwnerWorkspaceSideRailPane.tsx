'use client';

import type { ComponentProps } from 'react';
import { Stack } from '@mui/material';
import OwnerProjectStartPanel from './OwnerProjectStartPanel';
import {
  OwnerAiBriefPanel,
  OwnerDeliveryWorkspacePanel,
  OwnerNextDecisionPanel,
  OwnerSupportRiskPanel,
} from './OwnerWorkspaceSideRailPanels';
import { OwnerControlPanel } from './OwnerJourneyCards';

type ControlProps = ComponentProps<typeof OwnerControlPanel>;
type ProjectStartProps = ComponentProps<typeof OwnerProjectStartPanel>;
type AiBriefProps = ComponentProps<typeof OwnerAiBriefPanel>;
type DeliveryWorkspaceProps = ComponentProps<typeof OwnerDeliveryWorkspacePanel>;
type SupportRiskProps = ComponentProps<typeof OwnerSupportRiskPanel>;
type NextDecisionProps = ComponentProps<typeof OwnerNextDecisionPanel>;

interface OwnerWorkspaceSideRailPaneProps {
  control?: ControlProps | undefined;
  projectStart?: ProjectStartProps | undefined;
  aiBrief?: AiBriefProps | undefined;
  deliveryWorkspace?: DeliveryWorkspaceProps | undefined;
  supportRisk?: SupportRiskProps | undefined;
  nextDecision: NextDecisionProps;
}

export default function OwnerWorkspaceSideRailPane({
  control,
  projectStart,
  aiBrief,
  deliveryWorkspace,
  supportRisk,
  nextDecision,
}: OwnerWorkspaceSideRailPaneProps) {
  return (
    <Stack spacing={2.5}>
      {control && <OwnerControlPanel {...control} />}
      {projectStart && <OwnerProjectStartPanel {...projectStart} />}
      {aiBrief && <OwnerAiBriefPanel {...aiBrief} />}
      {deliveryWorkspace && <OwnerDeliveryWorkspacePanel {...deliveryWorkspace} />}
      {supportRisk && <OwnerSupportRiskPanel {...supportRisk} />}
      <OwnerNextDecisionPanel {...nextDecision} />
    </Stack>
  );
}
