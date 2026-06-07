'use client';

import { RocketLaunchOutlined } from '@mui/icons-material';
import { Box, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material';
import ProfileHeroPanel from './ProfileHeroPanel';
import {
  SaveButton,
  SectionTitle,
  Surface,
  TextInput,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { ExpertProfile } from './types';
import type { ExpertProfilePayload } from './teamProfileStudioTypes';

const availabilityOptions: ExpertProfile['availability'][] = ['AVAILABLE', 'LIMITED', 'BUSY', 'OFFLINE'];

export default function ExpertProfileStudioPanel({
  expertForm,
  userEmail,
  saveExpertPending,
  onExpertValueChange,
  onSaveExpertProfile,
}: {
  expertForm: ExpertProfilePayload;
  userEmail?: string | undefined;
  saveExpertPending: boolean;
  onExpertValueChange: <K extends keyof ExpertProfilePayload>(key: K, value: ExpertProfilePayload[K]) => void;
  onSaveExpertProfile: () => void;
}) {
  return (
    <Surface>
      <SectionTitle title="Solo Expert Profile" action={<RocketLaunchOutlined sx={{ color: appleColors.cyan }} />} />
      <ProfileHeroPanel
        title={expertForm.displayName || userEmail || 'Expert profile'}
        subtitle={expertForm.headline}
        body={expertForm.bio}
        avatarUrl={expertForm.profilePhotoUrl}
        coverUrl={expertForm.coverPhotoUrl}
        status={expertForm.availability}
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.5, mt: 2 }}>
        <TextInput label="Display name" value={expertForm.displayName} onChange={(value) => onExpertValueChange('displayName', value)} />
        <TextInput label="Headline" value={expertForm.headline} onChange={(value) => onExpertValueChange('headline', value)} />
        <TextInput label="Bio" value={expertForm.bio} onChange={(value) => onExpertValueChange('bio', value)} multiline />
        <TextInput label="Profile photo URL" value={expertForm.profilePhotoUrl} onChange={(value) => onExpertValueChange('profilePhotoUrl', value)} />
        <TextInput label="Cover photo URL" value={expertForm.coverPhotoUrl} onChange={(value) => onExpertValueChange('coverPhotoUrl', value)} />
        <TextInput label="Location" value={expertForm.location} onChange={(value) => onExpertValueChange('location', value)} />
        <TextInput label="Skills" value={expertForm.skills} onChange={(value) => onExpertValueChange('skills', value)} multiline />
        <TextInput label="Portfolio URL" value={expertForm.portfolioUrl} onChange={(value) => onExpertValueChange('portfolioUrl', value)} />
        <TextInput label="Preferred project size" value={expertForm.preferredProjectSize} onChange={(value) => onExpertValueChange('preferredProjectSize', value)} />
        <TextField
          select
          fullWidth
          label="Availability"
          value={expertForm.availability}
          onChange={(event) => onExpertValueChange('availability', event.target.value as ExpertProfile['availability'])}
        >
          {availabilityOptions.map((option) => <MenuItem key={option} value={option}>{formatLabel(option)}</MenuItem>)}
        </TextField>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography sx={{ fontWeight: 800 }}>Solo mode</Typography>
            <Typography variant="body2" color="text.secondary">Show this profile as an independent expert, separate from team identity.</Typography>
          </Box>
          <Switch checked={expertForm.soloMode} onChange={(event) => onExpertValueChange('soloMode', event.target.checked)} />
        </Stack>
        <SaveButton disabled={!expertForm.displayName || saveExpertPending} label="Save expert profile" onClick={onSaveExpertProfile} />
      </Box>
    </Surface>
  );
}
