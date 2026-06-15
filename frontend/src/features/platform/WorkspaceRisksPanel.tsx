'use client';

import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import {
  PastelChip,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { AttachmentScope, DisputeCase, Team } from './types';
import {
  type DisputeFormValues,
  type DisputeStatusPayload,
  type WorkspaceCommandFormController,
  disputeSeverities,
  disputeStatuses,
} from './workspaceCommandTeamTypes';

interface IWorkspaceRisksPanelProps {
  canCoordinate: boolean;
  teams: Team[];
  disputeList: DisputeCase[];
  disputeForm: WorkspaceCommandFormController<DisputeFormValues>;
  isCreatingDispute: boolean;
  isUpdatingDispute: boolean;
  disputeStatusById: Record<string, DisputeCase['status']>;
  disputeResolutionById: Record<string, string>;
  onCreateDispute: () => void;
  onUpdateDispute: (id: string, payload: DisputeStatusPayload) => void;
  onDisputeStatusChange: (id: string, status: DisputeCase['status']) => void;
  onDisputeResolutionChange: (id: string, resolution: string) => void;
  evidencePanel: (scopeType: AttachmentScope, scopeId: string) => ReactNode;
}

export default function WorkspaceRisksPanel({
  canCoordinate,
  teams,
  disputeList,
  disputeForm,
  isCreatingDispute,
  isUpdatingDispute,
  disputeStatusById,
  disputeResolutionById,
  onCreateDispute,
  onUpdateDispute,
  onDisputeStatusChange,
  onDisputeResolutionChange,
  evidencePanel,
}: IWorkspaceRisksPanelProps) {
  return (
    <Surface sx={{ background: disputeList.length ? '#fff7f8' : '#f4fbf7' }}>
      <SectionTitle
        title="Delivery concerns"
        action={
          <PastelChip
            label={`${disputeList.length}`}
            accent={disputeList.length ? appleColors.red : appleColors.green}
          />
        }
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.75, lineHeight: 1.6 }}>
        Use this for blockers that are not scanner findings: missing access, unclear decisions,
        owner delays, or team follow-up.
      </Typography>
      {canCoordinate && (
        <Box component="form" onSubmit={disputeForm.handleSubmit(onCreateDispute)} sx={{ mb: 2 }}>
          <Stack spacing={1}>
            <TextField
              select
              size="small"
              label="Team"
              value={disputeForm.values.teamId || ''}
              onChange={event => disputeForm.setValue('teamId', event.target.value || null)}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {teams.map(team => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Concern title"
              value={disputeForm.values.title}
              onChange={event => disputeForm.setValue('title', event.target.value)}
            />
            <TextField
              select
              size="small"
              label="Severity"
              value={disputeForm.values.severity}
              onChange={event =>
                disputeForm.setValue('severity', event.target.value as DisputeCase['severity'])
              }
            >
              {disputeSeverities.map(severity => (
                <MenuItem key={severity} value={severity}>
                  {formatLabel(severity)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Context"
              value={disputeForm.values.description}
              onChange={event => disputeForm.setValue('description', event.target.value)}
              multiline
            />
            <Button
              type="submit"
              variant="outlined"
              disabled={
                !disputeForm.values.title || !disputeForm.values.description || isCreatingDispute
              }
            >
              Add concern
            </Button>
          </Stack>
        </Box>
      )}
      <Stack spacing={1.25}>
        {disputeList.length ? (
          disputeList.map(dispute => (
            <Box
              key={dispute.id}
              sx={{
                border: 1,
                borderColor: '#fecdd3',
                borderRadius: 1,
                p: 1.25,
                background: '#fff',
              }}
            >
              <Stack direction="row" spacing={1} justifyContent="space-between">
                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                  {dispute.title}
                </Typography>
                <StatusChip label={dispute.status} />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {dispute.team?.name || 'Unassigned'} · {formatLabel(dispute.severity)}
              </Typography>
              {dispute.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.75, lineHeight: 1.5 }}
                >
                  {dispute.description}
                </Typography>
              )}
              {canCoordinate && (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <TextField
                    select
                    size="small"
                    label="Status"
                    value={disputeStatusById[dispute.id] || dispute.status}
                    onChange={event =>
                      onDisputeStatusChange(dispute.id, event.target.value as DisputeCase['status'])
                    }
                  >
                    {disputeStatuses.map(status => (
                      <MenuItem key={status} value={status}>
                        {formatLabel(status)}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    size="small"
                    label="Resolution note"
                    value={disputeResolutionById[dispute.id] ?? dispute.resolution ?? ''}
                    onChange={event => onDisputeResolutionChange(dispute.id, event.target.value)}
                  />
                  <Button
                    variant="outlined"
                    onClick={() =>
                      onUpdateDispute(dispute.id, {
                        status: disputeStatusById[dispute.id] || dispute.status,
                        resolution: disputeResolutionById[dispute.id] || dispute.resolution || '',
                      })
                    }
                    disabled={isUpdatingDispute}
                  >
                    Update risk
                  </Button>
                </Stack>
              )}
              {evidencePanel('DISPUTE', dispute.id)}
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            No delivery concerns are open for this workspace.
          </Typography>
        )}
      </Stack>
    </Surface>
  );
}
