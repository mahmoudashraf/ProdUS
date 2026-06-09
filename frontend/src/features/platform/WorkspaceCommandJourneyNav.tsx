'use client';

import { OwnerWorkspaceJourneyNav, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import { PastelChip, appleColors } from './PlatformComponents';

export type WorkspaceCommandView = 'overview' | 'proof' | 'team' | 'handoff';

interface WorkspaceCommandJourneyNavProps {
  value?: WorkspaceCommandView | null;
  onChange: (value: WorkspaceCommandView) => void;
  priorityFixes: number;
  proofGaps: number;
  milestoneCount: number;
  participantCount: number;
  supportCount: number;
  riskCount: number;
  integrationCount: number;
  hasHandoff: boolean;
}

export default function WorkspaceCommandJourneyNav({
  value,
  onChange,
  priorityFixes,
  proofGaps,
  milestoneCount,
  participantCount,
  supportCount,
  riskCount,
  integrationCount,
  hasHandoff,
}: WorkspaceCommandJourneyNavProps) {
  const items: JourneyStepItem<WorkspaceCommandView>[] = [
    {
      value: 'overview',
      label: 'Delivery Answer',
      detail: 'Ship confidence, launch report, and the safe next decision.',
      accent: appleColors.green,
      meta: <PastelChip label={`${milestoneCount} checkpoints`} accent={appleColors.green} bg="#e7f8ee" />,
    },
    {
      value: 'proof',
      label: 'Fixes And Proof',
      detail: 'Scanner-mapped blockers, milestone work, deliverables, and evidence.',
      accent: priorityFixes || proofGaps ? appleColors.amber : appleColors.cyan,
      meta: <PastelChip label={`${priorityFixes + proofGaps} gaps`} accent={priorityFixes ? appleColors.red : appleColors.amber} bg={priorityFixes ? '#fff1f1' : '#fff4dc'} />,
    },
    {
      value: 'team',
      label: 'Team And Risks',
      detail: 'People, support requests, delivery risks, and escalation ownership.',
      accent: riskCount || supportCount ? appleColors.amber : appleColors.purple,
      meta: <PastelChip label={`${participantCount} people`} accent={appleColors.cyan} bg="#e4f9fd" />,
    },
    {
      value: 'handoff',
      label: 'Handoff',
      detail: 'Runbook, health review, integration signals, and owner acceptance.',
      accent: hasHandoff ? appleColors.green : appleColors.blue,
      meta: <PastelChip label={`${integrationCount} signals`} accent={appleColors.blue} bg="#eaf3ff" />,
    },
  ];

  return <OwnerWorkspaceJourneyNav label="Workspace delivery journey" value={value ?? null} items={items} onChange={onChange} />;
}
