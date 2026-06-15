'use client';

import { CheckCircleOutline, PersonAddAltOutlined } from '@mui/icons-material';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';

import { PastelChip, SectionTitle, Surface, appleColors, formatLabel } from './PlatformComponents';
import type { WorkspaceParticipant } from './types';
import {
  type ParticipantFormValues,
  type WorkspaceCommandFormController,
  participantRoles,
} from './workspaceCommandTeamTypes';

interface IWorkspaceParticipantsPanelProps {
  canCoordinate: boolean;
  participantList: WorkspaceParticipant[];
  participantForm: WorkspaceCommandFormController<ParticipantFormValues>;
  isAddingParticipant: boolean;
  onAddParticipant: () => void;
}

export default function WorkspaceParticipantsPanel({
  canCoordinate,
  participantList,
  participantForm,
  isAddingParticipant,
  onAddParticipant,
}: IWorkspaceParticipantsPanelProps) {
  const activeCount = participantList.filter(participant => participant.active).length;

  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f5fdff 100%)' }}>
      <SectionTitle
        title="People and experts"
        action={
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <PastelChip
              label={`${activeCount} active`}
              accent={activeCount ? appleColors.cyan : appleColors.amber}
              bg={activeCount ? '#e4f9fd' : '#fff4dc'}
            />
            <PastelChip label={`${participantList.length} total`} accent={appleColors.purple} />
          </Stack>
        }
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.75, lineHeight: 1.6 }}>
        Invite the people who can move this workspace forward: owner, team lead, specialist,
        advisor, or viewer.
      </Typography>

      {canCoordinate && (
        <Box
          component="form"
          onSubmit={participantForm.handleSubmit(onAddParticipant)}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.5fr) minmax(160px, 0.7fr) auto' },
            gap: 1,
            mb: 2,
            p: 1.25,
            border: '1px solid',
            borderColor: appleColors.line,
            borderRadius: 1,
            background: '#fff',
          }}
        >
          <TextField
            size="small"
            label="Email"
            value={participantForm.values.email}
            onChange={event => participantForm.setValue('email', event.target.value)}
          />
          <TextField
            select
            size="small"
            label="Role"
            value={participantForm.values.role}
            onChange={event =>
              participantForm.setValue('role', event.target.value as WorkspaceParticipant['role'])
            }
          >
            {participantRoles.map(role => (
              <MenuItem key={role} value={role}>
                {formatLabel(role)}
              </MenuItem>
            ))}
          </TextField>
          <Button
            type="submit"
            variant="contained"
            startIcon={<PersonAddAltOutlined />}
            disabled={!participantForm.values.email || isAddingParticipant}
            sx={{ minHeight: 40 }}
          >
            Invite
          </Button>
        </Box>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 1,
        }}
      >
        {participantList.length ? (
          participantList.map(participant => (
            <Box
              key={participant.id}
              sx={{
                border: '1px solid',
                borderColor: participant.active ? '#bae6fd' : '#fecaca',
                borderRadius: 1,
                p: 1.25,
                background: '#fff',
                minWidth: 0,
              }}
            >
              <Stack direction="row" spacing={1.1} alignItems="center">
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    display: 'grid',
                    placeItems: 'center',
                    flex: '0 0 auto',
                    bgcolor: participant.active ? '#e4f9fd' : '#fff1f1',
                    color: participant.active ? appleColors.cyan : appleColors.red,
                    fontWeight: 950,
                  }}
                >
                  {participantInitials(participant.user.email)}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 900,
                      color: appleColors.ink,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {participant.user.email}
                  </Typography>
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
                    <PastelChip
                      label={formatLabel(participant.role)}
                      accent={roleAccent(participant.role)}
                    />
                    {participant.active ? (
                      <CheckCircleOutline sx={{ color: appleColors.green, fontSize: 18 }} />
                    ) : (
                      <PastelChip label="Inactive" accent={appleColors.red} bg="#fff1f1" />
                    )}
                  </Stack>
                </Box>
              </Stack>
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
              No people are added yet. Invite an owner, team lead, specialist, or advisor when this
              workspace is ready for help.
            </Typography>
          </Box>
        )}
      </Box>
    </Surface>
  );
}

function participantInitials(email: string) {
  const [name = ''] = email.split('@');
  const parts = name.split(/[._-]/).filter(Boolean);
  if (!parts.length) return 'P';
  return parts
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');
}

function roleAccent(role: WorkspaceParticipant['role']) {
  if (role === 'OWNER') return appleColors.green;
  if (role === 'TEAM_LEAD') return appleColors.cyan;
  if (role === 'SPECIALIST') return appleColors.purple;
  if (role === 'ADVISOR') return appleColors.amber;
  return appleColors.blue;
}
