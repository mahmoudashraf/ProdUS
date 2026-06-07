'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Stack } from '@mui/material';
import { OwnerWorkspaceJourneyNav, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import { PastelChip, appleColors } from './PlatformComponents';
import WorkspaceParticipantsPanel from './WorkspaceParticipantsPanel';
import WorkspaceRisksPanel from './WorkspaceRisksPanel';
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

type WorkspaceCommandTeamView = 'participants' | 'support' | 'risks';

interface WorkspaceCommandTeamPanelsProps {
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
  evidencePanel: (scopeType: AttachmentScope, scopeId: string) => ReactNode;
}

export default function WorkspaceCommandTeamPanels({
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
  evidencePanel,
}: WorkspaceCommandTeamPanelsProps) {
  const [teamView, setTeamView] = useState<WorkspaceCommandTeamView>('participants');

  useEffect(() => {
    if (teamView !== 'participants') return;
    if (disputeList.length) {
      setTeamView('risks');
      return;
    }
    if (supportList.length) setTeamView('support');
  }, [disputeList.length, supportList.length, teamView]);

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

  return (
    <Stack spacing={2}>
      <OwnerWorkspaceJourneyNav
        label="Team and risk command"
        value={teamView}
        items={items}
        onChange={setTeamView}
      />

      {teamView === 'participants' && (
        <WorkspaceParticipantsPanel
          canCoordinate={canCoordinate}
          participantList={participantList}
          participantForm={participantForm}
          isAddingParticipant={isAddingParticipant}
          onAddParticipant={onAddParticipant}
        />
      )}

      {teamView === 'support' && (
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

      {teamView === 'risks' && (
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
