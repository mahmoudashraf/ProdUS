'use client';

import type { ComponentProps } from 'react';
import { LinearProgress } from '@mui/material';
import WorkspaceCommandHero from './WorkspaceCommandHero';
import WorkspaceCommandJourneyNav, { type WorkspaceCommandView } from './WorkspaceCommandJourneyNav';
import WorkspaceCommandSelectedContextPanel from './WorkspaceCommandSelectedContextPanel';
import WorkspaceCommandProofStepPanel from './WorkspaceCommandProofStepPanel';
import WorkspaceOverviewDeliveryAnswerPanel from './WorkspaceOverviewDeliveryAnswerPanel';
import { WorkspaceBreadcrumbs } from './OwnerWorkspaceJourneyNav';

type WorkspaceHeroProps = ComponentProps<typeof WorkspaceCommandHero>;
type WorkspaceJourneyProps = Omit<ComponentProps<typeof WorkspaceCommandJourneyNav>, 'value' | 'onChange'>;
type WorkspaceOverviewProps = ComponentProps<typeof WorkspaceOverviewDeliveryAnswerPanel>;
type WorkspaceProofProps = ComponentProps<typeof WorkspaceCommandProofStepPanel>;

interface WorkspaceCommandSelectedWorkspacePaneProps {
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
}: WorkspaceCommandSelectedWorkspacePaneProps) {
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
      <WorkspaceCommandHero {...hero} />

      {isFetchingWorkspaceDetail && <LinearProgress />}

      <WorkspaceCommandJourneyNav
        value={null}
        onChange={onViewChange}
        {...journey}
      />

      <WorkspaceOverviewDeliveryAnswerPanel {...overview} />
    </>
  );
}
