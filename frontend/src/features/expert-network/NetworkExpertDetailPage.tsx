'use client';

import { useParams } from 'next/navigation';
import { ChatBubbleOutline } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
  PastelChip,
  QueryState,
  SectionTitle,
  StatusChip,
  Surface,
} from '@/features/platform/PlatformComponents';
import { networkApi } from './api';
import { PersonAvatar, TagRow } from './NetworkSharedPanels';
import { messageFor } from './networkPresentation';
import { useNetworkMessageAction } from './useNetworkMessageAction';

export function NetworkExpertDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const expert = useQuery({ queryKey: ['network', 'expert', id], queryFn: () => networkApi.expert(id), enabled: !!id });
  const messageAction = useNetworkMessageAction();
  const profile = expert.data;
  return (
    <Stack spacing={3}>
      <QueryState isLoading={expert.isLoading} error={expert.error} />
      {profile && (
        <>
          <Surface sx={{ p: 0, overflow: 'hidden' }}>
            <Box sx={{ height: 220, background: profile.coverPhotoUrl ? `url(${profile.coverPhotoUrl}) center/cover` : 'linear-gradient(135deg, #eef2ff, #ecfeff)' }} />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-end' }} sx={{ px: 3, pb: 3, mt: -4 }}>
              <PersonAvatar name={profile.displayName} src={profile.profilePhotoUrl} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h1">{profile.displayName}</Typography>
                <Typography color="text.secondary">{profile.headline}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                  <StatusChip label={profile.availability} />
                  <PastelChip label={profile.location || 'Remote'} />
                </Stack>
              </Box>
              <Button variant="contained" startIcon={<ChatBubbleOutline />} onClick={() => messageAction.mutate({ scopeType: 'EXPERT_PROFILE', scopeId: profile.id, targetUserId: profile.user?.id, title: `Conversation with ${profile.displayName}`, initialMessage: messageFor(profile.displayName) })}>Message</Button>
            </Stack>
          </Surface>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 0.8fr' }, gap: 2.5 }}>
            <Surface>
              <SectionTitle title="About" />
              <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>{profile.bio}</Typography>
            </Surface>
            <Surface>
              <SectionTitle title="Services and skills" />
              <TagRow value={profile.skills} limit={12} />
            </Surface>
          </Box>
        </>
      )}
    </Stack>
  );
}
