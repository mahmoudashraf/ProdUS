'use client';

import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import NextLink from 'next/link';

import {
  PastelChip,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { SupportRequest, Team } from './types';
import {
  type SupportRequestFormValues,
  type SupportStatusPayload,
  type WorkspaceCommandFormController,
  supportPriorities,
  supportStatuses,
} from './workspaceCommandTeamTypes';

interface IWorkspaceSupportRequestsPanelProps {
  canCoordinate: boolean;
  teams: Team[];
  supportList: SupportRequest[];
  supportForm: WorkspaceCommandFormController<SupportRequestFormValues>;
  isCreatingSupport: boolean;
  isUpdatingSupport: boolean;
  supportStatusById: Record<string, SupportRequest['status']>;
  supportResolutionById: Record<string, string>;
  onCreateSupport: () => void;
  onUpdateSupport: (id: string, payload: SupportStatusPayload) => void;
  onSupportStatusChange: (id: string, status: SupportRequest['status']) => void;
  onSupportResolutionChange: (id: string, resolution: string) => void;
}

export default function WorkspaceSupportRequestsPanel({
  canCoordinate,
  teams,
  supportList,
  supportForm,
  isCreatingSupport,
  isUpdatingSupport,
  supportStatusById,
  supportResolutionById,
  onCreateSupport,
  onUpdateSupport,
  onSupportStatusChange,
  onSupportResolutionChange,
}: IWorkspaceSupportRequestsPanelProps) {
  return (
    <Surface>
      <SectionTitle
        title="Support"
        action={
          <PastelChip
            label={`${supportList.length} requests`}
            accent={supportList.length ? appleColors.amber : appleColors.green}
          />
        }
      />
      {canCoordinate && (
        <Box component="form" onSubmit={supportForm.handleSubmit(onCreateSupport)} sx={{ mb: 2 }}>
          <Stack spacing={1}>
            <TextField
              select
              size="small"
              label="Team"
              value={supportForm.values.teamId || ''}
              onChange={event => supportForm.setValue('teamId', event.target.value || null)}
            >
              {teams.map(team => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Request title"
              value={supportForm.values.title}
              onChange={event => supportForm.setValue('title', event.target.value)}
            />
            <TextField
              select
              size="small"
              label="Priority"
              value={supportForm.values.priority}
              onChange={event =>
                supportForm.setValue('priority', event.target.value as SupportRequest['priority'])
              }
            >
              {supportPriorities.map(priority => (
                <MenuItem key={priority} value={priority}>
                  {formatLabel(priority)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Context"
              value={supportForm.values.description}
              onChange={event => supportForm.setValue('description', event.target.value)}
              multiline
            />
            <Button
              type="submit"
              variant="outlined"
              disabled={
                !supportForm.values.teamId ||
                !supportForm.values.title ||
                !supportForm.values.description ||
                isCreatingSupport
              }
            >
              Open support request
            </Button>
          </Stack>
        </Box>
      )}
      <Stack spacing={1.25}>
        {supportList.length ? (
          supportList.map(request => (
            <Box
              key={request.id}
              sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.25 }}
            >
              <Stack direction="row" spacing={1} justifyContent="space-between">
                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                  {request.title}
                </Typography>
                <StatusChip label={request.slaStatus} />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {request.team?.name || 'Unassigned'} · {formatLabel(request.priority)}
              </Typography>
              {request.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.75, lineHeight: 1.5 }}
                >
                  {request.description}
                </Typography>
              )}
              {request.team?.id && (
                <Button
                  component={NextLink}
                  href={`/teams/${request.team.id}`}
                  variant="text"
                  sx={{ mt: 0.5, px: 0 }}
                >
                  Open team page
                </Button>
              )}
              {canCoordinate && (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <TextField
                    select
                    size="small"
                    label="Status"
                    value={supportStatusById[request.id] || request.status}
                    onChange={event =>
                      onSupportStatusChange(
                        request.id,
                        event.target.value as SupportRequest['status']
                      )
                    }
                  >
                    {supportStatuses.map(status => (
                      <MenuItem key={status} value={status}>
                        {formatLabel(status)}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    size="small"
                    label="Resolution note"
                    value={supportResolutionById[request.id] ?? request.resolution ?? ''}
                    onChange={event => onSupportResolutionChange(request.id, event.target.value)}
                  />
                  <Button
                    variant="outlined"
                    onClick={() =>
                      onUpdateSupport(request.id, {
                        status: supportStatusById[request.id] || request.status,
                        resolution: supportResolutionById[request.id] || request.resolution || '',
                      })
                    }
                    disabled={isUpdatingSupport}
                  >
                    Update request
                  </Button>
                </Stack>
              )}
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            No support requests are open.
          </Typography>
        )}
      </Stack>
    </Surface>
  );
}
