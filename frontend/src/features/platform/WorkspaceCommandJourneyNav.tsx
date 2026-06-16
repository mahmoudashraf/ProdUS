'use client';

import { OwnerWorkspaceJourneyNav, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import { PastelChip, appleColors } from './PlatformComponents';

export type WorkspaceCommandView =
  | 'overview'
  | 'plan'
  | 'services'
  | 'proof'
  | 'team'
  | 'chat'
  | 'milestones'
  | 'handoff';

interface IWorkspaceCommandJourneyNavProps {
  value?: WorkspaceCommandView | null;
  onChange: (value: WorkspaceCommandView) => void;
  priorityFixes: number;
  proofGaps: number;
  serviceCount?: number;
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
  serviceCount = 0,
  participantCount,
  supportCount,
  riskCount,
  integrationCount,
  hasHandoff,
}: IWorkspaceCommandJourneyNavProps) {
  const items: JourneyStepItem<WorkspaceCommandView>[] = [
    {
      value: 'overview',
      label: 'Overview',
      detail: 'Current state, blockers, ownership, and the safest next action.',
      accent: appleColors.green,
      meta: (
        <PastelChip
          label={`${riskCount} risks`}
          accent={appleColors.green}
          bg="#e7f8ee"
        />
      ),
    },
    {
      value: 'services',
      label: 'Work scope',
      detail: 'Services, included findings, and practical work checklists.',
      accent: serviceCount ? appleColors.purple : appleColors.amber,
      meta: (
        <PastelChip
          label={`${serviceCount} service${serviceCount === 1 ? '' : 's'}`}
          accent={serviceCount ? appleColors.purple : appleColors.amber}
          bg={serviceCount ? '#f3edff' : '#fff4dc'}
        />
      ),
    },
    {
      value: 'proof',
      label: 'Fix and verify',
      detail: 'Service-owned findings, proof state, and targeted checks.',
      accent: priorityFixes || proofGaps ? appleColors.amber : appleColors.cyan,
      meta: (
        <PastelChip
          label={`${priorityFixes + proofGaps} open`}
          accent={priorityFixes ? appleColors.red : appleColors.amber}
          bg={priorityFixes ? '#fff1f1' : '#fff4dc'}
        />
      ),
    },
    {
      value: 'team',
      label: 'People',
      detail: 'Participants, service owners, team help, and unowned work.',
      accent: riskCount || supportCount ? appleColors.amber : appleColors.purple,
      meta: (
        <PastelChip label={`${participantCount} people`} accent={appleColors.cyan} bg="#e4f9fd" />
      ),
    },
    {
      value: 'chat',
      label: 'Discussion / decisions',
      detail: 'Workspace-attached decisions with finding and service mentions.',
      accent: appleColors.cyan,
      meta: (
        <PastelChip label="Workspace log" accent={appleColors.cyan} bg="#e4f9fd" />
      ),
    },
    {
      value: 'handoff',
      label: 'Handoff',
      detail: 'Continuity summary once fixes, proof, and ownership are clear.',
      accent: hasHandoff ? appleColors.green : appleColors.blue,
      meta: (
        <PastelChip label={`${integrationCount} signals`} accent={appleColors.blue} bg="#eaf3ff" />
      ),
    },
  ];

  return (
    <OwnerWorkspaceJourneyNav
      label="Workspace delivery journey"
      value={value ?? null}
      items={items}
      onChange={onChange}
    />
  );
}
