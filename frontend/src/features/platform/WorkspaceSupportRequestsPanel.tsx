'use client';

import { ArrowForwardOutlined, HandshakeOutlined } from '@mui/icons-material';
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
  const activeRequests = supportList.filter(
    request => !['RESOLVED', 'CANCELLED'].includes(request.status)
  );

  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #fffaf1 100%)' }}>
      <SectionTitle
        title="Team help"
        action={
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <PastelChip
              label={`${activeRequests.length} active`}
              accent={activeRequests.length ? appleColors.amber : appleColors.green}
              bg={activeRequests.length ? '#fff4dc' : '#e7f8ee'}
            />
            <PastelChip label={`${teams.length} teams available`} accent={appleColors.cyan} />
          </Stack>
        }
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.75, lineHeight: 1.6 }}>
        Ask a delivery team or specialist group to help with this workspace, then keep the request
        status visible here.
      </Typography>

      {canCoordinate && (
        <Box
          component="form"
          onSubmit={supportForm.handleSubmit(onCreateSupport)}
          sx={{
            mb: 2,
            p: 1.25,
            border: '1px solid',
            borderColor: appleColors.line,
            borderRadius: 1,
            background: '#fff',
          }}
        >
          <Stack spacing={1.1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: '#fff4dc',
                  color: appleColors.amber,
                  flex: '0 0 auto',
                }}
              >
                <HandshakeOutlined />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                  Ask for help
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pick a team, name the ask, and describe what they should handle.
                </Typography>
              </Box>
            </Stack>
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
              label="What do you need?"
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
              label="Helpful context"
              value={supportForm.values.description}
              onChange={event => supportForm.setValue('description', event.target.value)}
              multiline
            />
            <Button
              type="submit"
              variant="contained"
              disabled={
                !supportForm.values.teamId ||
                !supportForm.values.title ||
                !supportForm.values.description ||
                isCreatingSupport
              }
              sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, minHeight: 40 }}
            >
              Ask team
            </Button>
          </Stack>
        </Box>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 1.25,
        }}
      >
        {supportList.length ? (
          supportList.map(request => (
            <Box
              key={request.id}
              sx={{
                border: '1px solid',
                borderColor: request.status === 'RESOLVED' ? '#bbf7d0' : '#fed7aa',
                borderRadius: 1,
                p: 1.3,
                background: '#fff',
                minWidth: 0,
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Typography variant="body2" sx={{ fontWeight: 950, color: appleColors.ink }}>
                  {request.title}
                </Typography>
                <StatusChip label={request.slaStatus} />
              </Stack>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                <PastelChip
                  label={request.team?.name || 'No team selected'}
                  accent={request.team?.name ? appleColors.cyan : appleColors.amber}
                  bg={request.team?.name ? '#e4f9fd' : '#fff4dc'}
                />
                <PastelChip
                  label={formatLabel(request.priority)}
                  accent={priorityAccent(request.priority)}
                />
                <PastelChip
                  label={formatLabel(request.status)}
                  accent={requestStatusAccent(request.status)}
                />
              </Stack>
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
                  endIcon={<ArrowForwardOutlined />}
                  sx={{ mt: 0.5, px: 0, fontWeight: 800 }}
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
          <Box
            sx={{
              gridColumn: '1 / -1',
              border: '1px dashed',
              borderColor: appleColors.line,
              borderRadius: 1,
              p: 2,
              background: 'rgba(255,255,255,0.72)',
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              No team help is requested yet. When this workspace needs a designer, engineer,
              security reviewer, or delivery team, ask for help here.
            </Typography>
          </Box>
        )}
      </Box>
    </Surface>
  );
}

function priorityAccent(priority: SupportRequest['priority']) {
  if (priority === 'URGENT') return appleColors.red;
  if (priority === 'HIGH') return appleColors.amber;
  if (priority === 'LOW') return appleColors.green;
  return appleColors.purple;
}

function requestStatusAccent(status: SupportRequest['status']) {
  if (status === 'RESOLVED') return appleColors.green;
  if (status === 'CANCELLED') return appleColors.muted;
  if (status === 'WAITING_ON_OWNER') return appleColors.amber;
  if (status === 'IN_PROGRESS' || status === 'ACKNOWLEDGED') return appleColors.cyan;
  return appleColors.purple;
}
