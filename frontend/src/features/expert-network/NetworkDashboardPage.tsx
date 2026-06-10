'use client';

import NextLink from 'next/link';
import { useState } from 'react';
import {
  ArrowForward,
  ChatBubbleOutline,
  ExploreOutlined,
  GroupsOutlined,
  HandshakeOutlined,
  Inventory2Outlined,
} from '@mui/icons-material';
import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import {
  EmptyState,
  MetricTile,
  PageHeader,
  PastelChip,
  QueryState,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
} from '@/features/platform/PlatformComponents';
import type { ExpertProfile } from '@/features/platform/types';
import { networkApi } from './api';
import { ActivityRow, NetworkNotice, displayName } from './NetworkSharedPanels';

export function NetworkDashboardPage() {
  const queryClient = useQueryClient();
  const { user, hasRole } = useAuth();
  const home = useQuery({ queryKey: ['network', 'home'], queryFn: networkApi.home });
  const notificationSummary = useQuery({ queryKey: ['network', 'notification-summary'], queryFn: networkApi.notificationSummary });
  const [notice, setNotice] = useState<string | null>(null);
  const updateProfile = useMutation({
    mutationFn: (profile: ExpertProfile) =>
      networkApi.updateExpertProfile({
        displayName: profile.displayName,
        headline: profile.headline || '',
        bio: profile.bio || '',
        profilePhotoUrl: profile.profilePhotoUrl || '',
        coverPhotoUrl: profile.coverPhotoUrl || '',
        location: profile.location || '',
        timezone: profile.timezone || '',
        websiteUrl: profile.websiteUrl || '',
        portfolioUrl: profile.portfolioUrl || '',
        skills: profile.skills || '',
        preferredProjectSize: profile.preferredProjectSize || '',
        availability: profile.availability === 'AVAILABLE' ? 'LIMITED' : 'AVAILABLE',
        soloMode: profile.soloMode,
        active: profile.active,
      }),
    onSuccess: () => {
      setNotice('Availability updated.');
      queryClient.invalidateQueries({ queryKey: ['network', 'home'] });
    },
  });
  const isTeamLead = hasRole([UserRole.TEAM_MANAGER, UserRole.ADMIN]);
  const profile = home.data?.expertProfile;

  return (
    <Stack spacing={3}>
      <PageHeader
        title={`Good morning, ${displayName(user?.email)}`}
        description={isTeamLead ? 'Review team formation, join requests, and conversations that need a decision.' : 'Build your expert profile, find collaborators, and turn credible signals into team opportunities.'}
        action={<Button component={NextLink} href="/expert-network/directory" variant="contained" startIcon={<ExploreOutlined />}>Browse Network</Button>}
      />
      <QueryState isLoading={home.isLoading} error={home.error} />
      <NetworkNotice message={notice} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' }, gap: 2.5 }}>
        <Surface>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h3">{isTeamLead ? 'Team formation control' : 'Profile readiness'}</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                  {isTeamLead ? `${home.data?.myTeams.length || 0} managed or joined teams` : 'Complete your profile and stay visible to compatible teams.'}
                </Typography>
              </Box>
              {profile && (
                <Button variant="outlined" onClick={() => updateProfile.mutate(profile)} disabled={updateProfile.isPending} sx={{ minHeight: 42 }}>
                  {profile.availability === 'AVAILABLE' ? 'Set Limited' : 'Set Available'}
                </Button>
              )}
            </Stack>
            <LinearProgress variant="determinate" value={profile?.coverPhotoUrl && profile?.portfolioUrl ? 92 : 78} sx={{ height: 8, borderRadius: 999 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <StatusChip label={profile?.availability || 'AVAILABLE'} color="success" />
              <PastelChip label={profile?.soloMode ? 'Solo expert mode' : 'Team lead mode'} />
              <PastelChip label={profile?.preferredProjectSize || 'Scoped project range'} accent={appleColors.cyan} />
            </Stack>
          </Stack>
        </Surface>

        <Surface sx={{ bgcolor: '#f8f7ff' }}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ExploreOutlined sx={{ color: appleColors.purple }} />
              <Typography variant="h3">Formation signal</Typography>
            </Stack>
            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {isTeamLead
                ? 'Recent service demand points to frontend and documentation coverage before accepting larger Studio packages.'
                : 'Your backend and launch profile complements frontend-heavy teams. Apply to a team opening or publish a focused formation post.'}
            </Typography>
            <Button component={NextLink} href="/expert-network/formation" endIcon={<ArrowForward />} sx={{ alignSelf: 'flex-start' }}>
              Open Formation Board
            </Button>
          </Stack>
        </Surface>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2.5 }}>
        <MetricTile label="Open teams" value={home.data?.myTeams.length || 0} detail="Managed or joined" icon={<GroupsOutlined />} accent={appleColors.purple} />
        <MetricTile label="Join requests" value={home.data?.myJoinRequests.length || 0} detail="Sent by you" icon={<Inventory2Outlined />} accent={appleColors.cyan} />
        <MetricTile label="Messages" value={home.data?.conversations.length || 0} detail="Recent threads" icon={<ChatBubbleOutline />} accent={appleColors.green} />
        <MetricTile label="Trials" value={home.data?.trials.length || 0} detail="Collaboration paths" icon={<HandshakeOutlined />} accent={appleColors.amber} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
        <Surface>
          <SectionTitle title="Recommended formation activity" action={<Button component={NextLink} href="/expert-network/formation">View all</Button>} />
          <Stack spacing={1.5}>
            {(home.data?.formationPosts || []).map((post) => (
              <Box key={post.id} sx={{ p: 1.5, border: `1px solid ${appleColors.line}`, borderRadius: 2 }}>
                <Stack direction="row" justifyContent="space-between" spacing={2}>
                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>{post.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{post.body}</Typography>
                  </Box>
                  <StatusChip label={post.postType === 'TEAM_OPENING' ? 'Opening' : 'Looking'} />
                </Stack>
              </Box>
            ))}
            {!home.data?.formationPosts?.length && <EmptyState label="No formation activity yet." />}
          </Stack>
        </Surface>

        <Surface>
          <SectionTitle title="Your channels" action={<Button component={NextLink} href="/expert-network/channels">Browse</Button>} />
          <Stack spacing={1.25}>
            {(home.data?.channels || []).map((channel) => (
              <Button key={channel.id} component={NextLink} href={`/expert-network/channels?channel=${channel.slug}`} sx={{ justifyContent: 'space-between', minHeight: 48, border: `1px solid ${appleColors.line}`, borderRadius: 2, px: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: channel.color || appleColors.purple }} />
                  <Typography sx={{ fontWeight: 900, color: appleColors.ink }}>#{channel.slug}</Typography>
                </Stack>
                <ArrowForward fontSize="small" />
              </Button>
            ))}
          </Stack>
        </Surface>
      </Box>

      <Surface>
        <SectionTitle title="Recent Network activity" action={<Button component={NextLink} href="/expert-network/notifications">View notifications</Button>} />
        <Stack spacing={1.25}>
          {(notificationSummary.data?.latest || []).slice(0, 6).map((notification) => (
            <ActivityRow key={notification.id} notification={notification} />
          ))}
          {!notificationSummary.data?.latest?.length && <EmptyState label="No Network activity yet. Posts, messages, requests, and trials will appear here." />}
        </Stack>
      </Surface>
    </Stack>
  );
}
