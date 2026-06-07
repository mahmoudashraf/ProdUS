'use client';

import { GroupsOutlined } from '@mui/icons-material';
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import {
  PastelChip,
  ProgressRing,
  SaveButton,
  SectionTitle,
  Surface,
  TextInput,
  appleColors,
  categoryPalette,
  formatLabel,
} from './PlatformComponents';
import type { Team, TeamCapability, TeamMember, TeamReputationEvent } from './types';

const memberRoles: TeamMember['role'][] = ['LEAD', 'DELIVERY_MANAGER', 'SPECIALIST', 'ADVISOR', 'QUALITY_REVIEWER'];

export default function TeamDeliveryTeamPanel({
  selectedTeam,
  score,
  capabilities,
  canManageRoster,
  members,
  reputation,
  memberEmail,
  memberRole,
  isAddingMember,
  onMemberEmailChange,
  onMemberRoleChange,
  onAddMember,
}: {
  selectedTeam?: Team | undefined;
  score: number;
  capabilities: TeamCapability[];
  canManageRoster: boolean;
  members: TeamMember[];
  reputation: TeamReputationEvent[];
  memberEmail: string;
  memberRole: TeamMember['role'];
  isAddingMember: boolean;
  onMemberEmailChange: (value: string) => void;
  onMemberRoleChange: (value: TeamMember['role']) => void;
  onAddMember: () => void;
}) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
      <Surface>
        <SectionTitle title="Profile Completeness" action={<GroupsOutlined sx={{ color: appleColors.cyan }} />} />
        <Stack direction="row" spacing={2} alignItems="center">
          <ProgressRing value={score || 72} size={92} color={appleColors.cyan} label="/100" />
          <Box>
            <Typography variant="h4">Verified capability base</Typography>
            <Typography color="text.secondary">Used by owner matching and shortlist ranking.</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
          {capabilities.slice(0, 8).map((capability, index) => {
            const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
            return <PastelChip key={capability.id} label={capability.serviceModule?.name || capability.serviceCategory.name} accent={palette.accent} bg={palette.bg} />;
          })}
          {!capabilities.length && <PastelChip label="Publish service capabilities" accent={appleColors.amber} bg="#fff4dc" />}
        </Stack>
      </Surface>

      <Surface>
        <SectionTitle title="Roster" />
        {canManageRoster && selectedTeam && (
          <Box component="form" onSubmit={(event) => { event.preventDefault(); onAddMember(); }} sx={{ mb: 1.5 }}>
            <Stack spacing={1}>
              <TextInput label="Member email" value={memberEmail} onChange={onMemberEmailChange} />
              <TextField select size="small" label="Role" value={memberRole} onChange={(event) => onMemberRoleChange(event.target.value as TeamMember['role'])}>
                {memberRoles.map((role) => <MenuItem key={role} value={role}>{formatLabel(role)}</MenuItem>)}
              </TextField>
              <SaveButton disabled={!memberEmail || isAddingMember} label="Add member" />
            </Stack>
          </Box>
        )}
        <Stack spacing={1}>
          {members.slice(0, 7).map((member) => (
            <Stack key={member.id} direction="row" justifyContent="space-between" sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
              <Typography variant="body2">{member.user.email}</Typography>
              <Typography variant="body2" color="text.secondary">{formatLabel(member.role)}</Typography>
            </Stack>
          ))}
          {!members.length && <Typography variant="body2" color="text.secondary">Team members appear after invitations or approved access.</Typography>}
        </Stack>
      </Surface>

      <Surface>
        <SectionTitle title="Reputation Signals" />
        {reputation.length ? (
          <Stack spacing={1.25}>
            {reputation.slice(0, 5).map((event) => (
              <Stack key={event.id} direction="row" spacing={1} justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{formatLabel(event.eventType)}</Typography>
                  <Typography variant="caption" color="text.secondary">{event.notes || event.workspace?.name}</Typography>
                </Box>
                <Typography color="success.main" sx={{ fontWeight: 900 }}>{event.rating}/5</Typography>
              </Stack>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">Workspace-backed reviews will appear here.</Typography>
        )}
      </Surface>
    </Box>
  );
}
