'use client';

import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import {
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { WorkspaceParticipant } from './types';
import {
  type ParticipantFormValues,
  type WorkspaceCommandFormController,
  participantRoles,
} from './workspaceCommandTeamTypes';

interface WorkspaceParticipantsPanelProps {
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
}: WorkspaceParticipantsPanelProps) {
  return (
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
  );
}
