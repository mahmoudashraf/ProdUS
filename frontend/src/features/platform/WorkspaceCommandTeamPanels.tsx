'use client';

import { FormEvent, ReactNode } from 'react';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import {
  PastelChip,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import {
  AttachmentScope,
  DisputeCase,
  SupportRequest,
  Team,
  WorkspaceParticipant,
} from './types';

interface FormController<TValues> {
  values: TValues;
  setValue: <TKey extends keyof TValues>(key: TKey, value: TValues[TKey]) => void;
  handleSubmit: (onSubmit: () => void) => (event: FormEvent<HTMLFormElement>) => void;
}

interface ParticipantFormValues {
  email: string;
  role: WorkspaceParticipant['role'];
  active: boolean;
}

interface SupportRequestFormValues {
  supportSubscriptionId: string | null;
  teamId: string | null;
  title: string;
  description: string;
  priority: SupportRequest['priority'];
  status: SupportRequest['status'];
  dueOn: string | null;
}

interface DisputeFormValues {
  teamId: string | null;
  title: string;
  description: string;
  severity: DisputeCase['severity'];
  responseDueOn: string | null;
}

interface SupportStatusPayload {
  status: SupportRequest['status'];
  resolution: string;
}

interface DisputeStatusPayload {
  status: DisputeCase['status'];
  resolution: string;
}

const participantRoles: WorkspaceParticipant['role'][] = ['COORDINATOR', 'TEAM_LEAD', 'SPECIALIST', 'ADVISOR', 'VIEWER'];
const supportPriorities: SupportRequest['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const supportStatuses: SupportRequest['status'][] = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'WAITING_ON_OWNER', 'RESOLVED', 'CANCELLED'];
const disputeSeverities: DisputeCase['severity'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const disputeStatuses: DisputeCase['status'][] = ['OPEN', 'UNDER_REVIEW', 'OWNER_RESPONSE_NEEDED', 'TEAM_RESPONSE_NEEDED', 'RESOLVED', 'CANCELLED'];

interface WorkspaceCommandTeamPanelsProps {
  canCoordinate: boolean;
  teams: Team[];
  participantList: WorkspaceParticipant[];
  supportList: SupportRequest[];
  disputeList: DisputeCase[];
  participantForm: FormController<ParticipantFormValues>;
  supportForm: FormController<SupportRequestFormValues>;
  disputeForm: FormController<DisputeFormValues>;
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
  return (
    <>
      <Surface>
        <SectionTitle title="Participants" action={<PastelChip label={`${participantList.length}`} accent={appleColors.cyan} bg="#e4f9fd" />} />
        {canCoordinate && (
          <Box component="form" onSubmit={participantForm.handleSubmit(onAddParticipant)} sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1, mb: 2 }}>
            <TextField size="small" label="Email" value={participantForm.values.email} onChange={(event) => participantForm.setValue('email', event.target.value)} />
            <TextField select size="small" label="Role" value={participantForm.values.role} onChange={(event) => participantForm.setValue('role', event.target.value as WorkspaceParticipant['role'])}>
              {participantRoles.map((role) => <MenuItem key={role} value={role}>{formatLabel(role)}</MenuItem>)}
            </TextField>
            <Button type="submit" variant="outlined" disabled={!participantForm.values.email || isAddingParticipant}>Add participant</Button>
          </Box>
        )}
        <Stack spacing={1}>
          {participantList.length ? (
            participantList.map((participant) => (
              <Stack key={participant.id} direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{participant.user.email}</Typography>
                  <Typography variant="caption" color="text.secondary">{participant.active ? formatLabel(participant.role) : 'Inactive'}</Typography>
                </Box>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: participant.active ? appleColors.green : appleColors.red, flex: '0 0 auto' }} />
              </Stack>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">Add owners, team leads, specialists, and advisors before delivery starts.</Typography>
          )}
        </Stack>
      </Surface>

      <Surface>
        <SectionTitle title="Support" action={<PastelChip label={`${supportList.length} requests`} accent={supportList.length ? appleColors.amber : appleColors.green} />} />
        {canCoordinate && (
          <Box component="form" onSubmit={supportForm.handleSubmit(onCreateSupport)} sx={{ mb: 2 }}>
            <Stack spacing={1}>
              <TextField select size="small" label="Team" value={supportForm.values.teamId || ''} onChange={(event) => supportForm.setValue('teamId', event.target.value || null)}>
                {teams.map((team) => <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>)}
              </TextField>
              <TextField size="small" label="Request title" value={supportForm.values.title} onChange={(event) => supportForm.setValue('title', event.target.value)} />
              <TextField select size="small" label="Priority" value={supportForm.values.priority} onChange={(event) => supportForm.setValue('priority', event.target.value as SupportRequest['priority'])}>
                {supportPriorities.map((priority) => <MenuItem key={priority} value={priority}>{formatLabel(priority)}</MenuItem>)}
              </TextField>
              <TextField size="small" label="Context" value={supportForm.values.description} onChange={(event) => supportForm.setValue('description', event.target.value)} multiline />
              <Button type="submit" variant="outlined" disabled={!supportForm.values.teamId || !supportForm.values.title || !supportForm.values.description || isCreatingSupport}>
                Open support request
              </Button>
            </Stack>
          </Box>
        )}
        <Stack spacing={1.25}>
          {supportList.length ? supportList.map((request) => (
            <Box key={request.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
              <Stack direction="row" spacing={1} justifyContent="space-between">
                <Typography variant="body2" sx={{ fontWeight: 900 }}>{request.title}</Typography>
                <StatusChip label={request.slaStatus} />
              </Stack>
              <Typography variant="caption" color="text.secondary">{request.team.name} · {formatLabel(request.priority)}</Typography>
              {request.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.5 }}>{request.description}</Typography>}
              {canCoordinate && (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <TextField select size="small" label="Status" value={supportStatusById[request.id] || request.status} onChange={(event) => onSupportStatusChange(request.id, event.target.value as SupportRequest['status'])}>
                    {supportStatuses.map((status) => <MenuItem key={status} value={status}>{formatLabel(status)}</MenuItem>)}
                  </TextField>
                  <TextField size="small" label="Resolution note" value={supportResolutionById[request.id] ?? request.resolution ?? ''} onChange={(event) => onSupportResolutionChange(request.id, event.target.value)} />
                  <Button
                    variant="outlined"
                    onClick={() => onUpdateSupport(request.id, { status: supportStatusById[request.id] || request.status, resolution: supportResolutionById[request.id] || request.resolution || '' })}
                    disabled={isUpdatingSupport}
                  >
                    Update request
                  </Button>
                </Stack>
              )}
            </Box>
          )) : <Typography variant="body2" color="text.secondary">No support requests are open.</Typography>}
        </Stack>
      </Surface>

      <Surface sx={{ background: disputeList.length ? '#fff7f8' : '#f4fbf7' }}>
        <SectionTitle title="Risks" action={<PastelChip label={`${disputeList.length}`} accent={disputeList.length ? appleColors.red : appleColors.green} />} />
        {canCoordinate && (
          <Box component="form" onSubmit={disputeForm.handleSubmit(onCreateDispute)} sx={{ mb: 2 }}>
            <Stack spacing={1}>
              <TextField select size="small" label="Team" value={disputeForm.values.teamId || ''} onChange={(event) => disputeForm.setValue('teamId', event.target.value || null)}>
                <MenuItem value="">Unassigned</MenuItem>
                {teams.map((team) => <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>)}
              </TextField>
              <TextField size="small" label="Issue title" value={disputeForm.values.title} onChange={(event) => disputeForm.setValue('title', event.target.value)} />
              <TextField select size="small" label="Severity" value={disputeForm.values.severity} onChange={(event) => disputeForm.setValue('severity', event.target.value as DisputeCase['severity'])}>
                {disputeSeverities.map((severity) => <MenuItem key={severity} value={severity}>{formatLabel(severity)}</MenuItem>)}
              </TextField>
              <TextField size="small" label="Context" value={disputeForm.values.description} onChange={(event) => disputeForm.setValue('description', event.target.value)} multiline />
              <Button type="submit" variant="outlined" disabled={!disputeForm.values.title || !disputeForm.values.description || isCreatingDispute}>Open risk</Button>
            </Stack>
          </Box>
        )}
        <Stack spacing={1.25}>
          {disputeList.length ? disputeList.map((dispute) => (
            <Box key={dispute.id} sx={{ border: 1, borderColor: '#fecdd3', borderRadius: 1, p: 1.25, background: '#fff' }}>
              <Stack direction="row" spacing={1} justifyContent="space-between">
                <Typography variant="body2" sx={{ fontWeight: 900 }}>{dispute.title}</Typography>
                <StatusChip label={dispute.status} />
              </Stack>
              <Typography variant="caption" color="text.secondary">{dispute.team?.name || 'Unassigned'} · {formatLabel(dispute.severity)}</Typography>
              {dispute.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.5 }}>{dispute.description}</Typography>}
              {canCoordinate && (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <TextField select size="small" label="Status" value={disputeStatusById[dispute.id] || dispute.status} onChange={(event) => onDisputeStatusChange(dispute.id, event.target.value as DisputeCase['status'])}>
                    {disputeStatuses.map((status) => <MenuItem key={status} value={status}>{formatLabel(status)}</MenuItem>)}
                  </TextField>
                  <TextField size="small" label="Resolution note" value={disputeResolutionById[dispute.id] ?? dispute.resolution ?? ''} onChange={(event) => onDisputeResolutionChange(dispute.id, event.target.value)} />
                  <Button
                    variant="outlined"
                    onClick={() => onUpdateDispute(dispute.id, { status: disputeStatusById[dispute.id] || dispute.status, resolution: disputeResolutionById[dispute.id] || dispute.resolution || '' })}
                    disabled={isUpdatingDispute}
                  >
                    Update risk
                  </Button>
                </Stack>
              )}
              {evidencePanel('DISPUTE', dispute.id)}
            </Box>
          )) : <Typography variant="body2" color="text.secondary">No risks are open for this workspace.</Typography>}
        </Stack>
      </Surface>
    </>
  );
}
