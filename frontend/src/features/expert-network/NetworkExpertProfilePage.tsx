'use client';

import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PageHeader,
  QueryState,
  Surface,
  appleColors,
  formatLabel,
} from '@/features/platform/PlatformComponents';
import type { ExpertProfile } from '@/features/platform/types';
import { networkApi } from './api';
import { NetworkNotice } from './NetworkSharedPanels';

export function NetworkExpertProfilePage() {
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ['network', 'my-profile'], queryFn: networkApi.myExpertProfile });
  const [form, setForm] = useState<Partial<ExpertProfile>>({});
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (profile.data) setForm(profile.data);
  }, [profile.data]);
  const save = useMutation({
    mutationFn: () => networkApi.updateExpertProfile({
      displayName: form.displayName || '',
      headline: form.headline || '',
      bio: form.bio || '',
      profilePhotoUrl: form.profilePhotoUrl || '',
      coverPhotoUrl: form.coverPhotoUrl || '',
      location: form.location || '',
      timezone: form.timezone || '',
      websiteUrl: form.websiteUrl || '',
      portfolioUrl: form.portfolioUrl || '',
      skills: form.skills || '',
      preferredProjectSize: form.preferredProjectSize || '',
      availability: form.availability || 'AVAILABLE',
      soloMode: form.soloMode ?? true,
      active: form.active ?? true,
    }),
    onSuccess: () => {
      setNotice('Expert profile saved.');
      queryClient.invalidateQueries({ queryKey: ['network', 'my-profile'] });
    },
  });

  return (
    <Stack spacing={3}>
      <PageHeader title="Edit Expert Profile" description="Manage your public expert identity, availability, skills, services, proof, and formation intent." action={<Button component={NextLink} href={`/expert-network/experts/${profile.data?.id || ''}`} variant="outlined">Preview</Button>} />
      <QueryState isLoading={profile.isLoading} error={profile.error} />
      <NetworkNotice message={notice} />
      <Surface>
        <Stack spacing={2.5}>
          <Box sx={{ height: 180, borderRadius: 2, border: `1px dashed ${appleColors.line}`, background: form.coverPhotoUrl ? `url(${form.coverPhotoUrl}) center/cover` : 'linear-gradient(135deg, #eef2ff, #ecfeff)' }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '180px 1fr 1fr' }, gap: 2 }}>
            <TextField label="Profile photo URL" value={form.profilePhotoUrl || ''} onChange={(event) => setForm({ ...form, profilePhotoUrl: event.target.value })} />
            <TextField label="Display name" value={form.displayName || ''} onChange={(event) => setForm({ ...form, displayName: event.target.value })} required />
            <TextField label="Headline" value={form.headline || ''} onChange={(event) => setForm({ ...form, headline: event.target.value })} />
          </Box>
          <TextField label="Cover photo URL" value={form.coverPhotoUrl || ''} onChange={(event) => setForm({ ...form, coverPhotoUrl: event.target.value })} />
          <TextField label="Bio" multiline minRows={4} value={form.bio || ''} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            <TextField label="Location" value={form.location || ''} onChange={(event) => setForm({ ...form, location: event.target.value })} />
            <TextField label="Timezone" value={form.timezone || ''} onChange={(event) => setForm({ ...form, timezone: event.target.value })} />
            <TextField select label="Availability" value={form.availability || 'AVAILABLE'} onChange={(event) => setForm({ ...form, availability: event.target.value as ExpertProfile['availability'] })}>
              {['AVAILABLE', 'LIMITED', 'BUSY', 'OFFLINE'].map((option) => <MenuItem key={option} value={option}>{formatLabel(option)}</MenuItem>)}
            </TextField>
          </Box>
          <TextField label="Skills and service categories" value={form.skills || ''} onChange={(event) => setForm({ ...form, skills: event.target.value })} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            <TextField label="Preferred project size" value={form.preferredProjectSize || ''} onChange={(event) => setForm({ ...form, preferredProjectSize: event.target.value })} />
            <TextField label="Website URL" value={form.websiteUrl || ''} onChange={(event) => setForm({ ...form, websiteUrl: event.target.value })} />
            <TextField label="Portfolio URL" value={form.portfolioUrl || ''} onChange={(event) => setForm({ ...form, portfolioUrl: event.target.value })} />
          </Box>
          <Stack direction="row" justifyContent="flex-end">
            <Button variant="contained" onClick={() => save.mutate()} disabled={save.isPending || !form.displayName} sx={{ minHeight: 44 }}>Save Profile</Button>
          </Stack>
        </Stack>
      </Surface>
    </Stack>
  );
}
