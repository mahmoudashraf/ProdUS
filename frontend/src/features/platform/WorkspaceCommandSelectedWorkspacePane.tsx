'use client';

import { LinearProgress } from '@mui/material';
import type { ComponentProps } from 'react';

import { WorkspaceBreadcrumbs } from './OwnerWorkspaceJourneyNav';
import WorkspaceCommandHero from './WorkspaceCommandHero';
import WorkspaceCommandJourneyNav, {
  type WorkspaceCommandView,
} from './WorkspaceCommandJourneyNav';
import WorkspaceCommandPlanPanel from './WorkspaceCommandPlanPanel';
import WorkspaceCommandProofStepPanel from './WorkspaceCommandProofStepPanel';
import WorkspaceCommandSelectedContextPanel from './WorkspaceCommandSelectedContextPanel';
import WorkspaceOverviewDeliveryAnswerPanel from './WorkspaceOverviewDeliveryAnswerPanel';
import WorkspaceProofMilestonesPanel from './WorkspaceProofMilestonesPanel';

type WorkspaceHeroProps = ComponentProps<typeof WorkspaceCommandHero>;
type WorkspaceJourneyProps = Omit<
  ComponentProps<typeof WorkspaceCommandJourneyNav>,
  'value' | 'onChange'
>;
type WorkspaceOverviewProps = ComponentProps<typeof WorkspaceOverviewDeliveryAnswerPanel>;
type WorkspacePlanProps = ComponentProps<typeof WorkspaceCommandPlanPanel>;
type WorkspaceProofProps = ComponentProps<typeof WorkspaceCommandProofStepPanel>;

interface IWorkspaceCommandSelectedWorkspacePaneProps {
  view: WorkspaceCommandView;
  isFetchingWorkspaceDetail: boolean;
  hero: WorkspaceHeroProps;
  journey: WorkspaceJourneyProps;
  overview: WorkspaceOverviewProps;
  plan: WorkspacePlanProps;
  proof: WorkspaceProofProps;
  onViewChange: (view: WorkspaceCommandView) => void;
  onOpenHub: () => void;
}

const workspaceViewLabels: Record<WorkspaceCommandView, string> = {
  overview: 'Workspace',
  plan: 'Plan work',
  services: 'Services',
  proof: 'Fixes and proof',
  team: 'People and help',
  chat: 'Workspace chat',
  milestones: 'Steps',
  handoff: 'Handoff',
};

export default function WorkspaceCommandSelectedWorkspacePane({
  view,
  isFetchingWorkspaceDetail,
  hero,
  journey,
  overview,
  plan,
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

        {view === 'plan' && <WorkspaceCommandPlanPanel {...plan} />}
        {view === 'proof' && <WorkspaceCommandProofStepPanel {...proof} />}
        {view === 'milestones' && (
          <WorkspaceProofMilestonesPanel
            milestoneList={proof.milestoneList}
            selectedMilestone={proof.selectedMilestone}
            deliverableList={proof.deliverableList}
            milestoneRiskById={proof.milestoneRiskById}
            milestoneForm={proof.milestoneForm}
            deliverableForm={proof.deliverableForm}
            isCreatingMilestone={proof.isCreatingMilestone}
            isCreatingDeliverable={proof.isCreatingDeliverable}
            onCreateMilestone={proof.onCreateMilestone}
            onCreateDeliverable={proof.onCreateDeliverable}
            onSelectMilestone={proof.onSelectMilestone}
            evidencePanel={proof.evidencePanel}
          />
        )}
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
