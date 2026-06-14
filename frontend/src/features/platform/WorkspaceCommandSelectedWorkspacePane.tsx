'use client';

import { LinearProgress } from '@mui/material';
import type { ComponentProps } from 'react';

import { WorkspaceBreadcrumbs } from './OwnerWorkspaceJourneyNav';
import WorkspaceCommandHero from './WorkspaceCommandHero';
import WorkspaceCommandJourneyNav, {
  type WorkspaceCommandView,
} from './WorkspaceCommandJourneyNav';
import WorkspaceCommandProofStepPanel from './WorkspaceCommandProofStepPanel';
import WorkspaceCommandSelectedContextPanel from './WorkspaceCommandSelectedContextPanel';
import WorkspaceOverviewDeliveryAnswerPanel from './WorkspaceOverviewDeliveryAnswerPanel';

type WorkspaceHeroProps = ComponentProps<typeof WorkspaceCommandHero>;
type WorkspaceJourneyProps = Omit<
  ComponentProps<typeof WorkspaceCommandJourneyNav>,
  'value' | 'onChange'
>;
type WorkspaceOverviewProps = ComponentProps<typeof WorkspaceOverviewDeliveryAnswerPanel>;
type WorkspaceProofProps = ComponentProps<typeof WorkspaceCommandProofStepPanel>;

interface IWorkspaceCommandSelectedWorkspacePaneProps {
  view: WorkspaceCommandView;
  isFetchingWorkspaceDetail: boolean;
  hero: WorkspaceHeroProps;
  journey: WorkspaceJourneyProps;
  overview: WorkspaceOverviewProps;
  proof: WorkspaceProofProps;
  onViewChange: (view: WorkspaceCommandView) => void;
  onOpenHub: () => void;
}

const workspaceViewLabels: Record<WorkspaceCommandView, string> = {
  overview: 'Workspace',
  services: 'Services',
  proof: 'Fixes and proof',
  team: 'Team and risks',
  handoff: 'Handoff',
};

export default function WorkspaceCommandSelectedWorkspacePane({
  view,
  isFetchingWorkspaceDetail,
  hero,
  journey,
  overview,
  proof,
  onViewChange,
  onOpenHub,
}: IWorkspaceCommandSelectedWorkspacePaneProps) {
  if (view !== 'overview') {
    return (
      <>
        <WorkspaceBreadcrumbs
          items={[
            { label: 'Workspace home', onClick: onOpenHub },
            { label: workspaceViewLabels[view] },
          ]}
          backLabel="Back to workspace"
          onBack={onOpenHub}
        />

        <WorkspaceCommandSelectedContextPanel {...hero} />

        {isFetchingWorkspaceDetail && <LinearProgress />}

        {view === 'proof' && <WorkspaceCommandProofStepPanel {...proof} />}
      </>
    );
  }

  return (
    <>
      <WorkspaceOverviewDeliveryAnswerPanel {...overview} />

      {isFetchingWorkspaceDetail && <LinearProgress />}

      <WorkspaceCommandHero {...hero} />

      <WorkspaceCommandJourneyNav value={null} onChange={onViewChange} {...journey} />
    </>
  );
}
