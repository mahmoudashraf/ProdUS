'use client';

import type { ComponentProps } from 'react';
import OwnerFindingsRiskPanel from './OwnerFindingsRiskPanel';
import type { OwnerRiskGroupView } from './ownerRiskGroupRouteModel';

type RiskPanelProps = ComponentProps<typeof OwnerFindingsRiskPanel>;

interface OwnerWorkspaceRiskAreaProps {
  groups: RiskPanelProps['groups'];
  totalFindingCount: RiskPanelProps['totalFindingCount'];
  openGroups: RiskPanelProps['openGroups'];
  activeGroupView: RiskPanelProps['activeGroupView'];
  onGroupToggle: RiskPanelProps['onGroupToggle'];
  onReviewFinding: RiskPanelProps['onReviewFinding'];
  onOpenHub: () => void;
  onOpenGroupView: (view: OwnerRiskGroupView) => void;
  onOpenTechnicalProof: RiskPanelProps['onOpenTechnicalProof'];
}

export default function OwnerWorkspaceRiskArea({
  groups,
  totalFindingCount,
  openGroups,
  activeGroupView,
  onGroupToggle,
  onReviewFinding,
  onOpenHub,
  onOpenGroupView,
  onOpenTechnicalProof,
}: OwnerWorkspaceRiskAreaProps) {
  return (
    <OwnerFindingsRiskPanel
      groups={groups}
      totalFindingCount={totalFindingCount}
      openGroups={openGroups}
      activeGroupView={activeGroupView}
      onGroupToggle={onGroupToggle}
      onReviewFinding={onReviewFinding}
      onOpenHub={onOpenHub}
      onOpenGroupView={onOpenGroupView}
      onOpenTechnicalProof={onOpenTechnicalProof}
    />
  );
}
