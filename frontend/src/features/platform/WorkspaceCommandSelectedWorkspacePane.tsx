'use client';

import type { ComponentProps } from 'react';
import { LinearProgress } from '@mui/material';
import WorkspaceCommandHero from './WorkspaceCommandHero';
import WorkspaceCommandJourneyNav, { type WorkspaceCommandView } from './WorkspaceCommandJourneyNav';
import WorkspaceCommandProofStepPanel from './WorkspaceCommandProofStepPanel';
import WorkspaceOverviewDeliveryAnswerPanel from './WorkspaceOverviewDeliveryAnswerPanel';

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
}

export default function WorkspaceCommandSelectedWorkspacePane({
  view,
  isFetchingWorkspaceDetail,
  hero,
  journey,
  overview,
  proof,
  onViewChange,
}: WorkspaceCommandSelectedWorkspacePaneProps) {
  return (
    <>
      <WorkspaceCommandHero {...hero} />

      {isFetchingWorkspaceDetail && <LinearProgress />}

      <WorkspaceCommandJourneyNav
        value={view}
        onChange={onViewChange}
        {...journey}
      />

      {view === 'overview' && <WorkspaceOverviewDeliveryAnswerPanel {...overview} />}

      {view === 'proof' && <WorkspaceCommandProofStepPanel {...proof} />}
    </>
  );
}
