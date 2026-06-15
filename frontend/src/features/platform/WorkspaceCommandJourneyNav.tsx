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
  milestoneCount,
  participantCount,
  supportCount,
  riskCount,
  integrationCount,
  hasHandoff,
}: IWorkspaceCommandJourneyNavProps) {
  const items: JourneyStepItem<WorkspaceCommandView>[] = [
    {
      value: 'overview',
      label: 'Workspace answer',
      detail: 'Launch confidence, current status, and the safest next decision.',
      accent: appleColors.green,
      meta: (
        <PastelChip
          label={`${milestoneCount} checkpoints`}
          accent={appleColors.green}
          bg="#e7f8ee"
        />
      ),
    },
    {
      value: 'plan',
      label: 'Plan work',
      detail: 'Services, findings, people, and next steps in one practical plan.',
      accent: serviceCount || priorityFixes ? appleColors.purple : appleColors.amber,
      meta: (
        <PastelChip
          label={`${serviceCount} services`}
          accent={serviceCount ? appleColors.purple : appleColors.amber}
          bg={serviceCount ? '#f3edff' : '#fff4dc'}
        />
      ),
    },
    {
      value: 'services',
      label: 'Services',
      detail: 'Choose the work this workspace owns before people start fixing it.',
      accent: serviceCount ? appleColors.purple : appleColors.amber,
      meta: (
        <PastelChip
          label={`${serviceCount} selected`}
          accent={serviceCount ? appleColors.purple : appleColors.amber}
          bg={serviceCount ? '#f3edff' : '#fff4dc'}
        />
      ),
    },
    {
      value: 'proof',
      label: 'Fixes and proof',
      detail: 'Priority fixes, workspace steps, saved proof, and approval checks.',
      accent: priorityFixes || proofGaps ? appleColors.amber : appleColors.cyan,
      meta: (
        <PastelChip
          label={`${priorityFixes + proofGaps} gaps`}
          accent={priorityFixes ? appleColors.red : appleColors.amber}
          bg={priorityFixes ? '#fff1f1' : '#fff4dc'}
        />
      ),
    },
    {
      value: 'team',
      label: 'People and help',
      detail: 'Participants, service help, and delivery concerns that need attention.',
      accent: riskCount || supportCount ? appleColors.amber : appleColors.purple,
      meta: (
        <PastelChip label={`${participantCount} people`} accent={appleColors.cyan} bg="#e4f9fd" />
      ),
    },
    {
      value: 'chat',
      label: 'Workspace chat',
      detail: 'Discuss decisions and mention the exact findings being fixed.',
      accent: appleColors.cyan,
      meta: (
        <PastelChip label="Team updates" accent={appleColors.cyan} bg="#e4f9fd" />
      ),
    },
    {
      value: 'milestones',
      label: 'Steps',
      detail: 'Workspace steps, outputs, proof links, and acceptance progress.',
      accent: milestoneCount ? appleColors.green : appleColors.amber,
      meta: (
        <PastelChip
          label={`${milestoneCount} step${milestoneCount === 1 ? '' : 's'}`}
          accent={milestoneCount ? appleColors.green : appleColors.amber}
          bg={milestoneCount ? '#e7f8ee' : '#fff4dc'}
        />
      ),
    },
    {
      value: 'handoff',
      label: 'Handoff',
      detail: 'Runbook, health review, integration signals, and owner acceptance.',
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
