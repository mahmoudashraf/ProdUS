'use client';

import type { ReactNode } from 'react';
import { Stack } from '@mui/material';
import { OwnerWorkspaceJourneyNav, WorkspaceBreadcrumbs, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import { PastelChip, appleColors } from './PlatformComponents';
import WorkspaceParticipantsPanel from './WorkspaceParticipantsPanel';
import WorkspaceRisksPanel from './WorkspaceRisksPanel';
import WorkspaceCommandSubrouteActions, { type WorkspaceCommandSubrouteItem } from './WorkspaceCommandSubrouteActions';
import WorkspaceSupportRequestsPanel from './WorkspaceSupportRequestsPanel';
import type {
  AttachmentScope,
  DisputeCase,
  SupportRequest,
  Team,
  WorkspaceParticipant,
} from './types';
import type {
  DisputeFormValues,
  DisputeStatusPayload,
  ParticipantFormValues,
  SupportRequestFormValues,
  SupportStatusPayload,
  WorkspaceCommandFormController,
} from './workspaceCommandTeamTypes';

export type WorkspaceCommandTeamView = 'participants' | 'support' | 'risks';

const teamViewLabel: Record<WorkspaceCommandTeamView, string> = {
  participants: 'Participants',
  support: 'Support',
  risks: 'Risks',
};

interface WorkspaceCommandTeamPanelsProps {
  view: WorkspaceCommandTeamView | null;
  canCoordinate: boolean;
  teams: Team[];
  participantList: WorkspaceParticipant[];
  supportList: SupportRequest[];
  disputeList: DisputeCase[];
  participantForm: WorkspaceCommandFormController<ParticipantFormValues>;
  supportForm: WorkspaceCommandFormController<SupportRequestFormValues>;
  disputeForm: WorkspaceCommandFormController<DisputeFormValues>;
  isAddingParticipant: boolean;
  isCreatingSupport: boolean;
  isUpdatingSupport: boolean;
  isCreatingDispute: boolean;
  isUpdatingDispute: boolean;
  supportStatusById: Record<string, SupportRequest['status']>;
  supportResolutionById: Record<string, string>;
  disputeStatusById: Record<string, DisputeCase['status']>;
  disputeResolutionById: Record<string, string>;
  onAddParticipant: () => void;
  onCreateSupport: () => void;
  onUpdateSupport: (id: string, payload: SupportStatusPayload) => void;
  onCreateDispute: () => void;
  onUpdateDispute: (id: string, payload: DisputeStatusPayload) => void;
  onSupportStatusChange: (id: string, status: SupportRequest['status']) => void;
  onSupportResolutionChange: (id: string, resolution: string) => void;
  onDisputeStatusChange: (id: string, status: DisputeCase['status']) => void;
  onDisputeResolutionChange: (id: string, resolution: string) => void;
  onOpenHub: () => void;
  onViewChange: (view: WorkspaceCommandTeamView) => void;
  evidencePanel: (scopeType: AttachmentScope, scopeId: string) => ReactNode;
}

export default function WorkspaceCommandTeamPanels({
  view,
  canCoordinate,
  teams,
  participantList,
  supportList,
  disputeList,
  participantForm,
  supportForm,
  disputeForm,
  isAddingParticipant,
  isCreatingSupport,
  isUpdatingSupport,
  isCreatingDispute,
  isUpdatingDispute,
  supportStatusById,
  supportResolutionById,
  disputeStatusById,
  disputeResolutionById,
  onAddParticipant,
  onCreateSupport,
  onUpdateSupport,
  onCreateDispute,
  onUpdateDispute,
  onSupportStatusChange,
  onSupportResolutionChange,
  onDisputeStatusChange,
  onDisputeResolutionChange,
  onOpenHub,
  onViewChange,
  evidencePanel,
}: WorkspaceCommandTeamPanelsProps) {
  const items: JourneyStepItem<WorkspaceCommandTeamView>[] = [
    {
      value: 'participants',
      label: 'Participants',
      detail: 'Confirm who owns delivery, review, and escalation.',
      accent: appleColors.cyan,
      meta: <PastelChip label={`${participantList.length} people`} accent={appleColors.cyan} bg="#e4f9fd" />,
    },
    {
      value: 'support',
      label: 'Support',
      detail: 'Handle owner asks and specialist follow-up.',
      accent: supportList.length ? appleColors.amber : appleColors.green,
      meta: <PastelChip label={`${supportList.length} requests`} accent={supportList.length ? appleColors.amber : appleColors.green} bg={supportList.length ? '#fff4dc' : '#e7f8ee'} />,
    },
    {
      value: 'risks',
      label: 'Risks',
      detail: 'Resolve blockers before owner handoff.',
      accent: disputeList.length ? appleColors.red : appleColors.green,
      meta: <PastelChip label={`${disputeList.length} open`} accent={disputeList.length ? appleColors.red : appleColors.green} bg={disputeList.length ? '#fff1f1' : '#e7f8ee'} />,
    },
  ];
  const subrouteItems: WorkspaceCommandSubrouteItem<WorkspaceCommandTeamView>[] = items.map((item) => ({
    value: item.value,
    label: item.label,
    accent: item.accent || appleColors.purple,
  }));

  return (
    <Stack spacing={2}>
      {view && (
        <WorkspaceBreadcrumbs
          items={[
            { label: 'Team And Risks', onClick: onOpenHub },
            { label: teamViewLabel[view] },
          ]}
          backLabel="Team home"
          onBack={onOpenHub}
        />
      )}

      {view ? (
        <WorkspaceCommandSubrouteActions
          ariaLabel="Team and risk internal pages"
          currentValue={view}
          items={subrouteItems}
          onChange={onViewChange}
        />
      ) : (
        <OwnerWorkspaceJourneyNav
          label="Team and risks"
          value={null}
          items={items}
          onChange={onViewChange}
        />
      )}

      {view === 'participants' && (
        <WorkspaceParticipantsPanel
          canCoordinate={canCoordinate}
          participantList={participantList}
          participantForm={participantForm}
          isAddingParticipant={isAddingParticipant}
          onAddParticipant={onAddParticipant}
        />
      )}

      {view === 'support' && (
        <WorkspaceSupportRequestsPanel
          canCoordinate={canCoordinate}
          teams={teams}
          supportList={supportList}
          supportForm={supportForm}
          isCreatingSupport={isCreatingSupport}
          isUpdatingSupport={isUpdatingSupport}
          supportStatusById={supportStatusById}
          supportResolutionById={supportResolutionById}
          onCreateSupport={onCreateSupport}
          onUpdateSupport={onUpdateSupport}
          onSupportStatusChange={onSupportStatusChange}
          onSupportResolutionChange={onSupportResolutionChange}
        />
      )}

      {view === 'risks' && (
        <WorkspaceRisksPanel
          canCoordinate={canCoordinate}
          teams={teams}
          disputeList={disputeList}
          disputeForm={disputeForm}
          isCreatingDispute={isCreatingDispute}
          isUpdatingDispute={isUpdatingDispute}
          disputeStatusById={disputeStatusById}
          disputeResolutionById={disputeResolutionById}
          onCreateDispute={onCreateDispute}
          onUpdateDispute={onUpdateDispute}
          onDisputeStatusChange={onDisputeStatusChange}
          onDisputeResolutionChange={onDisputeResolutionChange}
          evidencePanel={evidencePanel}
        />
      )}
    </Stack>
  );
}
