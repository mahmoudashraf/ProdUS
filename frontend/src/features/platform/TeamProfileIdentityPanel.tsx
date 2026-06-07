'use client';

import { AddPhotoAlternateOutlined, GroupsOutlined } from '@mui/icons-material';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import ProfileHeroPanel from './ProfileHeroPanel';
import {
  SaveButton,
  SectionTitle,
  Surface,
  TextInput,
  appleColors,
} from './PlatformComponents';
import type { Team } from './types';
import type { TeamProfilePayload } from './teamProfileStudioTypes';

export default function TeamProfileIdentityPanel({
  selectedTeam,
  managedTeams,
  teamForm,
  isCreatingTeam,
  canLeadTeams,
  canSaveTeam,
  canManageSelectedTeam,
  createTeamPending,
  updateTeamPending,
  onSelectTeam,
  onStartNewTeam,
  onTeamValueChange,
  onSaveTeamProfile,
}: {
  selectedTeam?: Team | undefined;
  managedTeams: Team[];
  teamForm: TeamProfilePayload;
  isCreatingTeam: boolean;
  canLeadTeams: boolean;
  canSaveTeam: boolean;
  canManageSelectedTeam: boolean;
  createTeamPending: boolean;
  updateTeamPending: boolean;
  onSelectTeam: (teamId: string) => void;
  onStartNewTeam: () => void;
  onTeamValueChange: <K extends keyof TeamProfilePayload>(key: K, value: TeamProfilePayload[K]) => void;
  onSaveTeamProfile: () => void;
}) {
  return (
    <Stack spacing={2.5}>
      <Surface>
        <SectionTitle title="Team Profile" action={<GroupsOutlined sx={{ color: appleColors.purple }} />} />
        {selectedTeam ? (
          <ProfileHeroPanel
            title={selectedTeam.name}
            subtitle={selectedTeam.headline || selectedTeam.description}
            body={selectedTeam.bio || selectedTeam.capabilitiesSummary}
            avatarUrl={selectedTeam.profilePhotoUrl}
            coverUrl={selectedTeam.coverPhotoUrl}
            status={selectedTeam.verificationStatus}
          />
        ) : (
          <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
            Create a team profile to start inviting collaborators.
          </Typography>
        )}
      </Surface>

      <Surface>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ md: 'center' }}
          sx={{ mb: 2 }}
        >
          <SectionTitle title={selectedTeam ? (canManageSelectedTeam ? 'Edit Team Profile' : 'Team Profile Details') : 'Create Team Profile'} />
          {managedTeams.length > 0 && (
            <TextField
              select
              size="small"
              label="Team"
              value={selectedTeam?.id || ''}
              onChange={(event) => onSelectTeam(event.target.value)}
              sx={{ minWidth: 260 }}
            >
              <MenuItem value="" disabled>{isCreatingTeam ? 'New team profile' : 'Select team'}</MenuItem>
              {managedTeams.map((team) => <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>)}
            </TextField>
          )}
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
          <TextInput disabled={!canSaveTeam} label="Team name" value={teamForm.name} onChange={(value) => onTeamValueChange('name', value)} />
          <TextInput disabled={!canSaveTeam} label="Headline" value={teamForm.headline} onChange={(value) => onTeamValueChange('headline', value)} />
          <TextInput disabled={!canSaveTeam} label="Location / timezone" value={teamForm.timezone} onChange={(value) => onTeamValueChange('timezone', value)} />
          <TextInput disabled={!canSaveTeam} label="Website" value={teamForm.websiteUrl} onChange={(value) => onTeamValueChange('websiteUrl', value)} />
          <TextInput disabled={!canSaveTeam} label="Profile photo URL" value={teamForm.profilePhotoUrl} onChange={(value) => onTeamValueChange('profilePhotoUrl', value)} />
          <TextInput disabled={!canSaveTeam} label="Cover photo URL" value={teamForm.coverPhotoUrl} onChange={(value) => onTeamValueChange('coverPhotoUrl', value)} />
          <TextInput disabled={!canSaveTeam} label="Description" value={teamForm.description} onChange={(value) => onTeamValueChange('description', value)} multiline />
          <TextInput disabled={!canSaveTeam} label="Bio" value={teamForm.bio} onChange={(value) => onTeamValueChange('bio', value)} multiline />
          <TextInput disabled={!canSaveTeam} label="Capabilities summary" value={teamForm.capabilitiesSummary} onChange={(value) => onTeamValueChange('capabilitiesSummary', value)} multiline />
          <TextInput disabled={!canSaveTeam} label="Typical project size" value={teamForm.typicalProjectSize} onChange={(value) => onTeamValueChange('typicalProjectSize', value)} />
        </Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.25}
          justifyContent="space-between"
          alignItems={{ sm: 'center' }}
          sx={{ mt: 2 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <AddPhotoAlternateOutlined sx={{ color: appleColors.cyan }} />
            <Typography variant="body2" color="text.secondary">Photo fields are saved to the profile and rendered immediately.</Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={onStartNewTeam} disabled={!canLeadTeams}>
              New team
            </Button>
            <SaveButton
              disabled={!teamForm.name || createTeamPending || updateTeamPending || !canSaveTeam}
              label={selectedTeam ? 'Save team profile' : 'Create team'}
              onClick={onSaveTeamProfile}
            />
          </Stack>
        </Stack>
      </Surface>
    </Stack>
  );
}
