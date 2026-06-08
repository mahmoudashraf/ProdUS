'use client';

import type { ComponentProps } from 'react';
import OwnerFindingsRiskPanel from './OwnerFindingsRiskPanel';

type RiskPanelProps = ComponentProps<typeof OwnerFindingsRiskPanel>;

interface OwnerWorkspaceRiskAreaProps {
  groups: RiskPanelProps['groups'];
  totalFindingCount: RiskPanelProps['totalFindingCount'];
  openGroups: RiskPanelProps['openGroups'];
  onGroupToggle: RiskPanelProps['onGroupToggle'];
  onReviewFinding: RiskPanelProps['onReviewFinding'];
  onOpenTechnicalProof: RiskPanelProps['onOpenTechnicalProof'];
}

export default function OwnerWorkspaceRiskArea({
  groups,
  totalFindingCount,
  openGroups,
  onGroupToggle,
  onReviewFinding,
  onOpenTechnicalProof,
}: OwnerWorkspaceRiskAreaProps) {
  return (
    <OwnerFindingsRiskPanel
      groups={groups}
      totalFindingCount={totalFindingCount}
      openGroups={openGroups}
      onGroupToggle={onGroupToggle}
      onReviewFinding={onReviewFinding}
      onOpenTechnicalProof={onOpenTechnicalProof}
    />
  );
}
