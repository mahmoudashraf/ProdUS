'use client';

import { Stack } from '@mui/material';
import { OwnerWorkspaceJourneyNav, WorkspaceBreadcrumbs, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import { PastelChip, appleColors, formatLabel } from './PlatformComponents';
import WorkspaceHandoffAssistantPanel from './WorkspaceHandoffAssistantPanel';
import WorkspaceHandoffReviewPanel from './WorkspaceHandoffReviewPanel';
import WorkspaceIntegrationSignalsPanel from './WorkspaceIntegrationSignalsPanel';
import type {
  HandoffDocument,
  IntegrationConnection,
  Milestone,
  ProductHealthReview,
  ProjectWorkspace,
} from './types';

export type WorkspaceCommandHandoffView = 'review' | 'signals' | 'assistant';

const handoffViewLabel: Record<WorkspaceCommandHandoffView, string> = {
  review: 'Owner Handoff',
  signals: 'Signals',
  assistant: 'Ask AI',
};

interface WorkspaceCommandHandoffPanelsProps {
  view: WorkspaceCommandHandoffView | null;
  workspace: ProjectWorkspace;
  productId: string;
  selectedMilestone: Milestone | undefined;
  completedCheckpointCount: number;
  milestoneCount: number;
  supportCount: number;
  riskCount: number;
  missingEvidenceCount: number;
  workspaceProgress: number;
  canCoordinate: boolean;
  latestHandoff: HandoffDocument | undefined;
  latestHealthReview: ProductHealthReview | undefined;
  integrationList: IntegrationConnection[];
  latestIntegration: IntegrationConnection | undefined;
  integrationProvider: IntegrationConnection['providerType'];
  isPreparingHandoff: boolean;
  isPublishingHealthReview: boolean;
  isCreatingIntegration: boolean;
  isRecordingSignal: boolean;
  onIntegrationProviderChange: (provider: IntegrationConnection['providerType']) => void;
  onPrepareHandoff: () => void;
  onPublishHealthReview: () => void;
  onCreateIntegration: (provider: IntegrationConnection['providerType']) => void;
  onRecordIntegrationSignal: (connectionId: string) => void;
  onOpenHub: () => void;
  onViewChange: (view: WorkspaceCommandHandoffView) => void;
}

export default function WorkspaceCommandHandoffPanels({
  view,
  workspace,
  productId,
  selectedMilestone,
  completedCheckpointCount,
  milestoneCount,
  supportCount,
  riskCount,
  missingEvidenceCount,
  workspaceProgress,
  canCoordinate,
  latestHandoff,
  latestHealthReview,
  integrationList,
  latestIntegration,
  integrationProvider,
  isPreparingHandoff,
  isPublishingHealthReview,
  isCreatingIntegration,
  isRecordingSignal,
  onIntegrationProviderChange,
  onPrepareHandoff,
  onPublishHealthReview,
  onCreateIntegration,
  onRecordIntegrationSignal,
  onOpenHub,
  onViewChange,
}: WorkspaceCommandHandoffPanelsProps) {
  const items: JourneyStepItem<WorkspaceCommandHandoffView>[] = [
    {
      value: 'review',
      label: 'Owner Handoff',
      detail: 'Runbook, health review, and open handoff gaps.',
      accent: missingEvidenceCount ? appleColors.amber : appleColors.green,
      meta: <PastelChip label={latestHandoff ? formatLabel(latestHandoff.status) : 'Not ready'} accent={latestHandoff ? appleColors.green : appleColors.amber} bg={latestHandoff ? '#e7f8ee' : '#fff4dc'} />,
    },
    {
      value: 'signals',
      label: 'Signals',
      detail: 'Workspace-scoped integrations and readiness records.',
      accent: integrationList.length ? appleColors.blue : appleColors.purple,
      meta: <PastelChip label={`${integrationList.length} connected`} accent={appleColors.blue} bg="#eaf3ff" />,
    },
    {
      value: 'assistant',
      label: 'Ask AI',
      detail: 'Optional handoff questions after the owner review.',
      accent: supportCount || riskCount || missingEvidenceCount ? appleColors.amber : appleColors.purple,
      meta: <PastelChip label="Optional" accent={appleColors.purple} bg="#f1efff" />,
    },
  ];

  return (
    <Stack spacing={2}>
      {view && (
        <WorkspaceBreadcrumbs
          items={[
            { label: 'Handoff', onClick: onOpenHub },
            { label: handoffViewLabel[view] },
          ]}
          backLabel="Handoff hub"
          onBack={onOpenHub}
        />
      )}

      <OwnerWorkspaceJourneyNav
        label="Handoff command"
        value={view}
        items={items}
        onChange={onViewChange}
      />

      {view === 'review' && (
        <WorkspaceHandoffReviewPanel
          latestHandoff={latestHandoff}
          latestHealthReview={latestHealthReview}
          missingEvidenceCount={missingEvidenceCount}
          workspaceProgress={workspaceProgress}
          canCoordinate={canCoordinate}
          isPreparingHandoff={isPreparingHandoff}
          isPublishingHealthReview={isPublishingHealthReview}
          onPrepareHandoff={onPrepareHandoff}
          onPublishHealthReview={onPublishHealthReview}
        />
      )}

      {view === 'signals' && (
        <WorkspaceIntegrationSignalsPanel
          canCoordinate={canCoordinate}
          integrationList={integrationList}
          latestIntegration={latestIntegration}
          integrationProvider={integrationProvider}
          isCreatingIntegration={isCreatingIntegration}
          isRecordingSignal={isRecordingSignal}
          onIntegrationProviderChange={onIntegrationProviderChange}
          onCreateIntegration={onCreateIntegration}
          onRecordIntegrationSignal={onRecordIntegrationSignal}
        />
      )}

      {view === 'assistant' && (
        <WorkspaceHandoffAssistantPanel
          workspace={workspace}
          productId={productId}
          selectedMilestone={selectedMilestone}
          completedCheckpointCount={completedCheckpointCount}
          milestoneCount={milestoneCount}
          supportCount={supportCount}
          riskCount={riskCount}
          missingEvidenceCount={missingEvidenceCount}
          integrationCount={integrationList.length}
          hasHandoff={!!latestHandoff}
        />
      )}
    </Stack>
  );
}
