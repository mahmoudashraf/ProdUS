'use client';

import NextLink from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AddOutlined,
  ArrowForward,
  AutoAwesomeOutlined,
  ChatBubbleOutline,
  ExploreOutlined,
  FavoriteBorderOutlined,
  GroupAddOutlined,
  GroupsOutlined,
  HandshakeOutlined,
  Inventory2Outlined,
  NotificationsNoneOutlined,
  PersonAddAltOutlined,
  SendOutlined,
  TuneOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Divider,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import {
  DotLabel,
  EmptyState,
  MetricTile,
  PageHeader,
  PastelChip,
  ProgressRing,
  QueryState,
  SectionTitle,
  StatusChip,
  Surface,
  TextInput,
  appleColors,
  formatLabel,
} from '@/features/platform/PlatformComponents';
import TeamProfilesPage from '@/features/platform/TeamProfilesPage';
import type { ExpertProfile, PlatformNotification, Team, TeamJoinRequest } from '@/features/platform/types';
import { networkApi } from './api';
import type { ConversationCreatePayload, FormationPostPayload, TrialPayload, UserAccount } from './types';

const serviceColors = ['#6366f1', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];

const splitTags = (value?: string) =>
  (value || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const initials = (value?: string) =>
  (value || 'ProdUS')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

const displayName = (email?: string) => {
  if (!email) return 'ProdUS user';
  return (email.split('@')[0] ?? email)
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatDate = (value?: string) => {
  if (!value) return 'Recently';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
};

const messageFor = (name: string) =>
  `I saw ${name} on ProdUS Network and would like to discuss service fit, availability, and a scoped collaboration path for productization work.`;

function TagRow({ value, limit = 5 }: { value?: string | undefined; limit?: number | undefined }) {
  const tags = splitTags(value).slice(0, limit);
  if (!tags.length) return <Typography color="text.secondary">No service tags yet.</Typography>;
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {tags.map((tag, index) => (
        <PastelChip key={tag} label={tag} accent={serviceColors[index % serviceColors.length] || appleColors.purple} />
      ))}
    </Stack>
  );
}

function PersonAvatar({ name, src, square }: { name?: string | undefined; src?: string | undefined; square?: boolean | undefined }) {
  return (
    <Avatar
      variant={square ? 'rounded' : 'circular'}
      {...(src ? { src } : {})}
      sx={{
        width: 52,
        height: 52,
        bgcolor: '#eef2ff',
        color: appleColors.purple,
        fontWeight: 900,
        borderRadius: square ? 2 : undefined,
      }}
    >
      {initials(name)}
    </Avatar>
  );
}

function NetworkNotice({ message, severity = 'success' }: { message: string | null; severity?: 'success' | 'error' | 'info' }) {
  if (!message) return null;
  return <Alert severity={severity} sx={{ mb: 2, borderRadius: 2 }}>{message}</Alert>;
}

function ActivityRow({ notification, action }: { notification: PlatformNotification; action?: ReactNode }) {
  const unread = notification.status === 'UNREAD';
  return (
    <Box sx={{ p: 1.5, border: `1px solid ${unread ? appleColors.purple : appleColors.line}`, borderRadius: 2, bgcolor: unread ? '#eef2ff' : '#fff' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
        <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ minWidth: 0 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: unread ? appleColors.purple : appleColors.line, mt: 0.7, flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900 }}>{notification.title}</Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>{notification.body || formatLabel(notification.type)}</Typography>
            <Typography variant="caption" color="text.secondary">{formatDate(notification.createdAt)} · {formatLabel(notification.priority)}</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
          {notification.actionUrl && <Button component={NextLink} href={notification.actionUrl} size="small">Open</Button>}
          {action}
        </Stack>
      </Stack>
    </Box>
  );
}

function useMessageAction() {
  const router = useRouter();
  return useMutation({
    mutationFn: (payload: ConversationCreatePayload) => networkApi.createConversation(payload),
    onSuccess: (thread) => router.push(`/expert-network/messages?thread=${thread.id}`),
  });
}

function TeamCard({
  team,
  onMessage,
  onApply,
  busy,
}: {
  team: Team;
  onMessage: () => void;
  onApply: () => void;
  busy?: boolean | undefined;
}) {
  return (
    <Surface sx={{ height: '100%', p: 0, overflow: 'hidden' }}>
      <Box
        sx={{
          height: 92,
          background: team.coverPhotoUrl
            ? `linear-gradient(90deg, rgba(99,102,241,0.28), rgba(8,145,178,0.12)), url(${team.coverPhotoUrl}) center/cover`
            : 'linear-gradient(135deg, #eef2ff, #ecfeff)',
          borderBottom: `1px solid ${appleColors.line}`,
        }}
      />
      <Stack spacing={2} sx={{ p: 2.5, pt: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mt: -3 }}>
          <PersonAvatar name={team.name} src={team.profilePhotoUrl} square />
          <ProgressRing value={team.verificationStatus === 'OPERATIONS_READY' ? 96 : team.verificationStatus === 'CERTIFIED' ? 88 : 82} size={70} label="fit" />
        </Stack>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="h3">{team.name}</Typography>
            <StatusChip label={team.verificationStatus} />
          </Stack>
          <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65 }}>
            {team.headline || team.description || 'Verified productization team.'}
          </Typography>
        </Box>
        <TagRow value={team.capabilitiesSummary || team.description} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button component={NextLink} href={`/expert-network/teams/${team.id}`} variant="outlined" fullWidth sx={{ minHeight: 42 }}>
            View Team
          </Button>
          <Button onClick={onApply} variant="contained" fullWidth disabled={!!busy} startIcon={<PersonAddAltOutlined />} sx={{ minHeight: 42 }}>
            Request To Join
          </Button>
          <Button onClick={onMessage} variant="outlined" fullWidth disabled={!!busy} startIcon={<ChatBubbleOutline />} sx={{ minHeight: 42 }}>
            Message
          </Button>
        </Stack>
      </Stack>
    </Surface>
  );
}

function ExpertCard({
  expert,
  onMessage,
  onInvite,
  busy,
}: {
  expert: ExpertProfile;
  onMessage: () => void;
  onInvite: () => void;
  busy?: boolean | undefined;
}) {
  return (
    <Surface sx={{ height: '100%', p: 0, overflow: 'hidden' }}>
      <Box
        sx={{
          height: 92,
          background: expert.coverPhotoUrl
            ? `linear-gradient(90deg, rgba(8,145,178,0.22), rgba(99,102,241,0.12)), url(${expert.coverPhotoUrl}) center/cover`
            : 'linear-gradient(135deg, #ecfeff, #f8f7ff)',
          borderBottom: `1px solid ${appleColors.line}`,
        }}
      />
      <Stack spacing={2} sx={{ p: 2.5, pt: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mt: -3 }}>
          <PersonAvatar name={expert.displayName} src={expert.profilePhotoUrl} />
          <DotLabel label={formatLabel(expert.availability)} color={expert.availability === 'AVAILABLE' ? appleColors.green : appleColors.amber} />
        </Stack>
        <Box>
          <Typography variant="h3">{expert.displayName}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65 }}>
            {expert.headline || 'Independent productization expert.'}
          </Typography>
        </Box>
        <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
          {expert.bio || 'Profile evidence, services, and availability are maintained by the expert.'}
        </Typography>
        <TagRow value={expert.skills} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button component={NextLink} href={`/expert-network/experts/${expert.id}`} variant="outlined" fullWidth sx={{ minHeight: 42 }}>
            View Profile
          </Button>
          <Button onClick={onMessage} variant="outlined" fullWidth disabled={!!busy} startIcon={<ChatBubbleOutline />} sx={{ minHeight: 42 }}>
            Message
          </Button>
          <Button onClick={onInvite} variant="contained" fullWidth disabled={!!busy} startIcon={<GroupAddOutlined />} sx={{ minHeight: 42 }}>
            Invite
          </Button>
        </Stack>
      </Stack>
    </Surface>
  );
}

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
              <AutoAwesomeOutlined sx={{ color: appleColors.purple }} />
              <Typography variant="h3">AI suggestion</Typography>
            </Stack>
            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {isTeamLead
                ? 'Recent service demand suggests adding frontend and documentation coverage before accepting larger Studio packages.'
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

export function NetworkSearchPage() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQuery = params?.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);
  const results = useQuery({
    queryKey: ['network', 'search', initialQuery],
    queryFn: () => networkApi.search(initialQuery),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(`/expert-network/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <Stack spacing={3}>
      <PageHeader title="Network Search" description="Search experts, teams, formation posts, service channels, and community answers from one place." />
      <Box component="form" onSubmit={submit}>
        <Surface>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField fullWidth label="Search Network" value={query} onChange={(event) => setQuery(event.target.value)} />
            <Button type="submit" variant="contained" startIcon={<ExploreOutlined />} sx={{ minHeight: 52, minWidth: 150 }}>
              Search
            </Button>
          </Stack>
        </Surface>
      </Box>
      <QueryState isLoading={results.isLoading} error={results.error} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, 1fr)' }, gap: 2 }}>
        {(results.data?.results || []).map((result) => (
          <Surface key={`${result.resultType}-${result.id}`}>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: result.accent || appleColors.purple, mt: 0.75, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h3">{result.title}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>{result.description || 'Network result'}</Typography>
                </Box>
              </Stack>
              <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="center">
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <StatusChip label={formatLabel(result.resultType)} />
                  {result.meta && <PastelChip label={formatLabel(result.meta)} accent={result.accent || appleColors.cyan} />}
                </Stack>
                <Button component={NextLink} href={result.href} endIcon={<ArrowForward />}>Open</Button>
              </Stack>
            </Stack>
          </Surface>
        ))}
      </Box>
      {!results.data?.results?.length && (
        <EmptyState label={initialQuery ? 'No matching experts, teams, posts, or channels found.' : 'Start with a service, skill, team, or delivery question.'} />
      )}
    </Stack>
  );
}

export function NetworkNotificationsPage() {
  const queryClient = useQueryClient();
  const notifications = useQuery({ queryKey: ['network', 'notifications'], queryFn: networkApi.notifications });
  const markRead = useMutation({
    mutationFn: (id: string) => networkApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network', 'notifications'] });
      queryClient.invalidateQueries({ queryKey: ['network', 'notification-summary'] });
    },
  });
  const markAllRead = useMutation({
    mutationFn: networkApi.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network', 'notifications'] });
      queryClient.invalidateQueries({ queryKey: ['network', 'notification-summary'] });
    },
  });
  const unreadCount = (notifications.data || []).filter((notification) => notification.status === 'UNREAD').length;

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Notifications"
        description="Network activity from messages, formation posts, join requests, channel replies, and trial collaboration."
        action={<Button variant="outlined" onClick={() => markAllRead.mutate()} disabled={!unreadCount || markAllRead.isPending}>Mark all read</Button>}
      />
      <QueryState isLoading={notifications.isLoading} error={notifications.error} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '280px 1fr' }, gap: 2.5 }}>
        <Surface>
          <Stack spacing={2}>
            <MetricTile label="Unread" value={unreadCount} detail="Need attention" icon={<NotificationsNoneOutlined />} accent={appleColors.purple} />
            <MetricTile label="All activity" value={notifications.data?.length || 0} detail="Latest 50 events" icon={<Inventory2Outlined />} accent={appleColors.cyan} />
          </Stack>
        </Surface>
        <Surface>
          <Stack spacing={1.25}>
            {(notifications.data || []).map((notification) => (
              <ActivityRow
                key={notification.id}
                notification={notification}
                action={
                  notification.status === 'UNREAD' ? (
                    <Button size="small" variant="outlined" onClick={() => markRead.mutate(notification.id)} disabled={markRead.isPending}>
                      Mark read
                    </Button>
                  ) : undefined
                }
              />
            ))}
            {!notifications.data?.length && <EmptyState label="No notifications yet. Network activity will appear here as teams and experts collaborate." />}
          </Stack>
        </Surface>
      </Box>
    </Stack>
  );
}

export function NetworkDirectoryPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const experts = useQuery({ queryKey: ['network', 'experts'], queryFn: networkApi.experts });
  const teams = useQuery({ queryKey: ['network', 'teams'], queryFn: networkApi.teams });
  const myTeams = useQuery({ queryKey: ['network', 'my-teams'], queryFn: networkApi.myTeams });
  const messageAction = useMessageAction();
  const invite = useMutation({
    mutationFn: (expert: ExpertProfile) => {
      const team = myTeams.data?.[0];
      if (!team || !expert.user?.email) throw new Error('Create or join a team before inviting experts.');
      return networkApi.inviteToTeam(team.id, {
        email: expert.user.email,
        role: 'SPECIALIST',
        message: `We think your ${expert.headline || 'expert'} profile fits ${team.name}. Would you like to discuss joining?`,
      });
    },
    onSuccess: () => {
      setNotice('Invitation recorded and attached to your team.');
      queryClient.invalidateQueries({ queryKey: ['network', 'my-teams'] });
    },
    onError: (error: Error) => setNotice(error.message),
  });
  const join = useMutation({
    mutationFn: (team: Team) => networkApi.requestToJoinTeam(team.id, { message: `I would like to discuss joining ${team.name}. My profile includes production-ready service experience and I can share evidence.` }),
    onSuccess: () => setNotice('Join request submitted to the team lead.'),
    onError: (error: Error) => setNotice(error.message),
  });

  const visibleExperts = (experts.data || []).filter((expert) =>
    `${expert.displayName} ${expert.headline} ${expert.skills}`.toLowerCase().includes(query.toLowerCase())
  );
  const visibleTeams = (teams.data || []).filter((team) =>
    `${team.name} ${team.headline} ${team.capabilitiesSummary}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Stack spacing={3}>
      <PageHeader title="Expert Directory" description="Find experts and teams to collaborate with, message with context, invite credible specialists, or request to join verified teams." />
      <QueryState isLoading={experts.isLoading || teams.isLoading} error={experts.error || teams.error} />
      <NetworkNotice message={notice} severity={invite.isError || join.isError ? 'error' : 'success'} />
      <Surface>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ lg: 'center' }}>
          <TextField fullWidth label="Search by name, skill, service, or team" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button variant="outlined" startIcon={<TuneOutlined />} sx={{ minHeight: 52, minWidth: 140 }}>Filters</Button>
        </Stack>
      </Surface>
      <Surface sx={{ bgcolor: '#f8f7ff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography variant="h3">Suggested for your formation path</Typography>
            <Typography color="text.secondary">Security, backend, frontend, and launch-readiness partners are prioritized because those services complete Studio packages.</Typography>
          </Stack>
          <Button component={NextLink} href="/expert-network/formation" endIcon={<ArrowForward />}>See openings</Button>
        </Stack>
      </Surface>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          <SectionTitle title={`Experts (${visibleExperts.length})`} />
          {visibleExperts.map((expert) => (
            <ExpertCard
              key={expert.id}
              expert={expert}
              busy={messageAction.isPending || invite.isPending}
              onMessage={() => messageAction.mutate({ scopeType: 'EXPERT_PROFILE', scopeId: expert.id, targetUserId: expert.user?.id, title: `Conversation with ${expert.displayName}`, initialMessage: messageFor(expert.displayName) })}
              onInvite={() => invite.mutate(expert)}
            />
          ))}
        </Stack>
        <Stack spacing={2.5}>
          <SectionTitle title={`Teams (${visibleTeams.length})`} />
          {visibleTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              busy={messageAction.isPending || join.isPending}
              onApply={() => join.mutate(team)}
              onMessage={() => messageAction.mutate({ scopeType: 'TEAM_PROFILE', scopeId: team.id, title: `Conversation with ${team.name}`, initialMessage: messageFor(team.name) })}
            />
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}

export function NetworkFormationPage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState<FormationPostPayload>({
    postType: 'LOOKING_FOR_TEAM',
    title: '',
    body: '',
    offeredServices: '',
    neededServices: '',
    workingStyle: 'Async-first, evidence-led collaboration',
    timezone: 'Remote with US/EU overlap',
    packageSize: '$15K-$80K',
  });
  const posts = useQuery({ queryKey: ['network', 'formation-posts'], queryFn: networkApi.formationPosts });
  const teams = useQuery({ queryKey: ['network', 'my-teams'], queryFn: networkApi.myTeams });
  const messageAction = useMessageAction();
  const create = useMutation({
    mutationFn: () => networkApi.createFormationPost({ ...form, teamId: form.postType === 'TEAM_OPENING' ? teams.data?.[0]?.id : undefined }),
    onSuccess: () => {
      setNotice('Formation post published.');
      setForm((current) => ({ ...current, title: '', body: '', offeredServices: '', neededServices: '' }));
      queryClient.invalidateQueries({ queryKey: ['network', 'formation-posts'] });
    },
  });
  const join = useMutation({
    mutationFn: (team: Team) => networkApi.requestToJoinTeam(team.id, { message: `I saw your formation opening and would like to discuss fit with ${team.name}.` }),
    onSuccess: () => setNotice('Join request created from the formation board.'),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate();
  };

  return (
    <Stack spacing={3}>
      <PageHeader title="Formation Board" description="Find teammates, publish clear openings, and start scoped conversations from real collaboration context." />
      <QueryState isLoading={posts.isLoading} error={posts.error} />
      <NetworkNotice message={notice} />
      <Surface>
        <Box component="form" onSubmit={submit}>
          <SectionTitle title="Create formation post" />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px 1fr 1fr' }, gap: 2 }}>
            <TextField select label="Post type" value={form.postType} onChange={(event) => setForm({ ...form, postType: event.target.value as FormationPostPayload['postType'] })}>
              <MenuItem value="LOOKING_FOR_TEAM">Looking for team</MenuItem>
              <MenuItem value="TEAM_OPENING">Team opening</MenuItem>
            </TextField>
            <TextField label="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            <TextField label="Package size" value={form.packageSize} onChange={(event) => setForm({ ...form, packageSize: event.target.value })} />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mt: 2 }}>
            <TextInput label="Services you bring" value={form.offeredServices || ''} onChange={(value) => setForm({ ...form, offeredServices: value })} />
            <TextInput label="Services you need" value={form.neededServices || ''} onChange={(value) => setForm({ ...form, neededServices: value })} />
          </Box>
          <TextInput label="Collaboration statement" value={form.body || ''} onChange={(value) => setForm({ ...form, body: value })} multiline />
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" startIcon={<AddOutlined />} disabled={create.isPending || !form.title}>Publish Post</Button>
          </Stack>
        </Box>
      </Surface>
      <Stack spacing={2}>
        {(posts.data || []).map((post) => (
          <Surface key={post.id}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                <Stack direction="row" spacing={1.5}>
                  <PersonAvatar name={post.team?.name || post.author?.email} src={post.team?.profilePhotoUrl} square={post.postType === 'TEAM_OPENING'} />
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="h3">{post.title}</Typography>
                      <StatusChip label={post.postType === 'TEAM_OPENING' ? 'Team Opening' : 'Looking For Team'} />
                    </Stack>
                    <Typography color="text.secondary">{post.team?.name || displayName(post.author?.email)} · Posted {formatDate(post.createdAt)}</Typography>
                  </Box>
                </Stack>
              </Stack>
              <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>{post.body}</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 900 }}>BRINGS</Typography>
                  <TagRow value={post.offeredServices} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 900 }}>NEEDS</Typography>
                  <TagRow value={post.neededServices} />
                </Box>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                {post.team && <Button onClick={() => join.mutate(post.team!)} variant="contained" startIcon={<PersonAddAltOutlined />}>Apply</Button>}
                <Button onClick={() => messageAction.mutate({ scopeType: 'FORMATION_POST', scopeId: post.id, targetUserId: post.author?.id, title: `Formation: ${post.title}`, initialMessage: `I saw your formation post: ${post.title}. I would like to discuss fit.` })} variant="outlined" startIcon={<ChatBubbleOutline />}>Message</Button>
              </Stack>
            </Stack>
          </Surface>
        ))}
        {!posts.data?.length && <EmptyState label="No formation posts yet. Create the first focused collaboration post." />}
      </Stack>
    </Stack>
  );
}

export function NetworkMessagesPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(() => searchParams?.get('thread') ?? null);
  const [body, setBody] = useState('');
  const threads = useQuery({ queryKey: ['network', 'conversations'], queryFn: networkApi.conversations });
  const selected = selectedId || threads.data?.[0]?.id;
  useEffect(() => {
    if (!selectedId && threads.data?.[0]?.id) {
      setSelectedId(threads.data[0].id);
    }
  }, [selectedId, threads.data]);
  const detail = useQuery({ queryKey: ['network', 'conversation', selected], queryFn: () => networkApi.conversation(selected!), enabled: !!selected });
  const send = useMutation({
    mutationFn: () => networkApi.addMessage(selected!, { body }),
    onSuccess: () => {
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['network', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['network', 'conversation', selected] });
    },
  });
  const mute = useMutation({
    mutationFn: () => networkApi.mute(selected!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['network', 'conversation', selected] }),
  });

  return (
    <Stack spacing={3}>
      <PageHeader title="Messages" description="Every conversation is attached to a profile, opening, request, trial, or formation context." />
      <QueryState isLoading={threads.isLoading || detail.isLoading} error={threads.error || detail.error} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '360px 1fr' }, gap: 2.5, minHeight: 640 }}>
        <Surface>
          <Stack spacing={1.5}>
            <TextField size="small" label="Search threads" />
            {(threads.data || []).map((thread) => (
              <Button
                key={thread.id}
                onClick={() => setSelectedId(thread.id)}
                sx={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  border: `1px solid ${selected === thread.id ? appleColors.purple : appleColors.line}`,
                  bgcolor: selected === thread.id ? '#eef2ff' : '#fff',
                  borderRadius: 2,
                  p: 1.5,
                  color: appleColors.ink,
                }}
              >
                <Stack spacing={0.5} sx={{ width: '100%' }}>
                  <Typography sx={{ fontWeight: 900 }}>{thread.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{formatLabel(thread.scopeType)} · {formatDate(thread.lastMessageAt || thread.createdAt)}</Typography>
                </Stack>
              </Button>
            ))}
            {!threads.data?.length && <EmptyState label="No messages yet. Start from an expert, team, or formation post." />}
          </Stack>
        </Surface>
        <Surface sx={{ display: 'flex', flexDirection: 'column' }}>
          {detail.data ? (
            <Stack spacing={2} sx={{ flex: 1 }}>
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Box>
                  <Typography variant="h3">{detail.data.title}</Typography>
                  <Typography color="text.secondary">{formatLabel(detail.data.scopeType)} · {detail.data.participants.length} participants</Typography>
                </Box>
                <Button variant="outlined" onClick={() => mute.mutate()} disabled={mute.isPending}>Mute</Button>
              </Stack>
              <Divider />
              <Stack spacing={1.5} sx={{ flex: 1, minHeight: 420 }}>
                {detail.data.messages.map((message) => (
                  <Box key={message.id} sx={{ alignSelf: message.sender?.id === detail.data?.createdBy?.id ? 'flex-start' : 'flex-end', maxWidth: '72%' }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: message.messageType === 'SYSTEM' ? '#f8fafc' : '#fff', border: `1px solid ${appleColors.line}` }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>{displayName(message.sender?.email)} · {formatDate(message.createdAt)}</Typography>
                      <Typography sx={{ mt: 0.5, lineHeight: 1.65 }}>{message.body}</Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField fullWidth label="Type a message" value={body} onChange={(event) => setBody(event.target.value)} />
                <Button variant="contained" startIcon={<SendOutlined />} disabled={!body || send.isPending} onClick={() => send.mutate()} sx={{ minWidth: 130 }}>Send</Button>
              </Stack>
            </Stack>
          ) : (
            <EmptyState label="Select a message thread." />
          )}
        </Surface>
      </Box>
    </Stack>
  );
}

export function NetworkChannelsPage() {
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const channels = useQuery({ queryKey: ['network', 'channels'], queryFn: networkApi.channels });
  const selectedSlug = params?.get('channel') || channels.data?.[0]?.slug || 'introductions';
  const posts = useQuery({ queryKey: ['network', 'channel-posts', selectedSlug], queryFn: () => networkApi.channelPosts(selectedSlug), enabled: !!selectedSlug });
  const [postForm, setPostForm] = useState({ title: '', body: '', serviceTags: '' });
  const [reply, setReply] = useState<Record<string, string>>({});
  const createPost = useMutation({
    mutationFn: () => networkApi.createChannelPost(selectedSlug, postForm),
    onSuccess: () => {
      setPostForm({ title: '', body: '', serviceTags: '' });
      queryClient.invalidateQueries({ queryKey: ['network', 'channel-posts', selectedSlug] });
    },
  });
  const helpful = useMutation({
    mutationFn: (postId: string) => networkApi.markHelpful(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['network', 'channel-posts', selectedSlug] }),
  });
  const comment = useMutation({
    mutationFn: (postId: string) => networkApi.addComment(postId, { body: reply[postId] || '' }),
    onSuccess: (_, postId) => {
      setReply((current) => ({ ...current, [postId]: '' }));
      queryClient.invalidateQueries({ queryKey: ['network', 'channel-posts', selectedSlug] });
    },
  });

  return (
    <Stack spacing={3}>
      <PageHeader title="Channels" description="Professional service-category discussion for experts and teams. No noisy public feed mechanics." />
      <QueryState isLoading={channels.isLoading || posts.isLoading} error={channels.error || posts.error} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '320px 1fr' }, gap: 2.5 }}>
        <Surface>
          <SectionTitle title="All channels" />
          <Stack spacing={1}>
            {(channels.data || []).map((channel) => (
              <Button
                key={channel.id}
                component={NextLink}
                href={`/expert-network/channels?channel=${channel.slug}`}
                sx={{
                  justifyContent: 'flex-start',
                  border: `1px solid ${selectedSlug === channel.slug ? channel.color || appleColors.purple : appleColors.line}`,
                  bgcolor: selectedSlug === channel.slug ? '#eef2ff' : '#fff',
                  borderRadius: 2,
                  minHeight: 48,
                  color: appleColors.ink,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, width: '100%' }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: channel.color || appleColors.purple }} />
                  <Box sx={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 900 }}>#{channel.slug}</Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {channel.description}
                    </Typography>
                  </Box>
                </Stack>
              </Button>
            ))}
          </Stack>
        </Surface>
        <Stack spacing={2.5}>
          <Surface>
            <SectionTitle title="New post" />
            <Stack spacing={2}>
              <TextField label="Title" value={postForm.title} onChange={(event) => setPostForm({ ...postForm, title: event.target.value })} />
              <TextField label="Body" multiline minRows={3} value={postForm.body} onChange={(event) => setPostForm({ ...postForm, body: event.target.value })} />
              <TextField label="Service tags" value={postForm.serviceTags} onChange={(event) => setPostForm({ ...postForm, serviceTags: event.target.value })} />
              <Button variant="contained" startIcon={<AddOutlined />} disabled={!postForm.title || !postForm.body || createPost.isPending} onClick={() => createPost.mutate()} sx={{ alignSelf: 'flex-end' }}>Publish</Button>
            </Stack>
          </Surface>
          {(posts.data || []).map((post) => (
            <Surface key={post.id}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5}>
                  <PersonAvatar name={post.author?.email} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h3">{post.title}</Typography>
                    <Typography color="text.secondary">{displayName(post.author?.email)} · {formatDate(post.createdAt)}</Typography>
                  </Box>
                  <StatusChip label={post.channel.name} />
                </Stack>
                <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>{post.body}</Typography>
                <TagRow value={post.serviceTags} />
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Button variant="outlined" startIcon={<FavoriteBorderOutlined />} onClick={() => helpful.mutate(post.id)}>Helpful {post.helpfulCount}</Button>
                  <PastelChip label={`${post.replyCount} replies`} accent={appleColors.cyan} />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField fullWidth size="small" label="Reply with useful context" value={reply[post.id] || ''} onChange={(event) => setReply({ ...reply, [post.id]: event.target.value })} />
                  <Button variant="contained" disabled={!reply[post.id] || comment.isPending} onClick={() => comment.mutate(post.id)}>Reply</Button>
                </Stack>
              </Stack>
            </Surface>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}

export function NetworkJoinRequestsPage() {
  const queryClient = useQueryClient();
  const sent = useQuery({ queryKey: ['network', 'my-join-requests'], queryFn: networkApi.myJoinRequests });
  const myTeams = useQuery({ queryKey: ['network', 'my-teams'], queryFn: networkApi.myTeams });
  const selectedTeam = myTeams.data?.[0];
  const received = useQuery({
    queryKey: ['network', 'team-join-requests', selectedTeam?.id],
    queryFn: () => networkApi.teamJoinRequests(selectedTeam!.id),
    enabled: !!selectedTeam,
  });
  const review = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TeamJoinRequest['status'] }) => networkApi.reviewJoinRequest(id, { status, reviewNote: `Marked ${status.toLowerCase()} from Network join-request console.` }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['network', 'team-join-requests', selectedTeam?.id] }),
  });

  return (
    <Stack spacing={3}>
      <PageHeader title="Join Requests" description="Structured membership decisions with clear team, requester, status, and review trail." />
      <QueryState isLoading={sent.isLoading || myTeams.isLoading || received.isLoading} error={sent.error || myTeams.error || received.error} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
        <Surface>
          <SectionTitle title="Requests you sent" />
          <Stack spacing={1.5}>
            {(sent.data || []).map((request) => (
              <Box key={request.id} sx={{ p: 1.5, border: `1px solid ${appleColors.line}`, borderRadius: 2 }}>
                <Stack direction="row" justifyContent="space-between" spacing={2}>
                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>{request.team?.name}</Typography>
                    <Typography color="text.secondary">{request.message}</Typography>
                  </Box>
                  <StatusChip label={request.status} />
                </Stack>
              </Box>
            ))}
            {!sent.data?.length && <EmptyState label="No join requests sent yet. Apply from Directory or Formation Board." />}
          </Stack>
        </Surface>
        <Surface>
          <SectionTitle title={`Requests for ${selectedTeam?.name || 'your team'}`} />
          <Stack spacing={1.5}>
            {(received.data || []).map((request) => (
              <Box key={request.id} sx={{ p: 1.5, border: `1px solid ${appleColors.line}`, borderRadius: 2 }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Box>
                      <Typography sx={{ fontWeight: 900 }}>{displayName(request.requester?.email)}</Typography>
                      <Typography color="text.secondary">{request.message}</Typography>
                    </Box>
                    <StatusChip label={request.status} />
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" disabled={review.isPending} onClick={() => review.mutate({ id: request.id, status: 'APPROVED' })}>Accept</Button>
                    <Button variant="outlined" color="error" disabled={review.isPending} onClick={() => review.mutate({ id: request.id, status: 'DECLINED' })}>Decline</Button>
                  </Stack>
                </Stack>
              </Box>
            ))}
            {!received.data?.length && <EmptyState label="No pending requests for your active team." />}
          </Stack>
        </Surface>
      </Box>
    </Stack>
  );
}

export function NetworkTrialsPage() {
  const queryClient = useQueryClient();
  const trials = useQuery({ queryKey: ['network', 'trials'], queryFn: networkApi.trials });
  const myTeams = useQuery({ queryKey: ['network', 'my-teams'], queryFn: networkApi.myTeams });
  const [form, setForm] = useState<TrialPayload>({ title: '', scope: '', proposedStartDate: '', proposedEndDate: '' });
  const create = useMutation({
    mutationFn: () => networkApi.createTrial({ ...form, teamId: myTeams.data?.[0]?.id }),
    onSuccess: () => {
      setForm({ title: '', scope: '', proposedStartDate: '', proposedEndDate: '' });
      queryClient.invalidateQueries({ queryKey: ['network', 'trials'] });
    },
  });
  const action = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'accept' | 'activate' | 'complete' | 'cancel' }) => networkApi.updateTrial(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['network', 'trials'] }),
  });

  return (
    <Stack spacing={3}>
      <PageHeader title="Trial Collaborations" description="Run controlled collaboration before permanent team membership or team formation." />
      <QueryState isLoading={trials.isLoading || myTeams.isLoading} error={trials.error || myTeams.error} />
      <Surface>
        <SectionTitle title="Propose trial" />
        <Stack spacing={2}>
          <TextField label="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <TextField label="Scope" multiline minRows={3} value={form.scope} onChange={(event) => setForm({ ...form, scope: event.target.value })} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="Start date" type="date" InputLabelProps={{ shrink: true }} value={form.proposedStartDate} onChange={(event) => setForm({ ...form, proposedStartDate: event.target.value })} />
            <TextField label="End date" type="date" InputLabelProps={{ shrink: true }} value={form.proposedEndDate} onChange={(event) => setForm({ ...form, proposedEndDate: event.target.value })} />
          </Box>
          <Button variant="contained" disabled={!form.title || create.isPending} onClick={() => create.mutate()} sx={{ alignSelf: 'flex-end' }}>Create Trial</Button>
        </Stack>
      </Surface>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 2.5 }}>
        {(trials.data || []).map((trial) => (
          <Surface key={trial.id}>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Box>
                  <Typography variant="h3">{trial.title}</Typography>
                  <Typography color="text.secondary">{trial.team?.name || 'Independent collaboration'} · {formatDate(trial.proposedStartDate)} to {formatDate(trial.proposedEndDate)}</Typography>
                </Box>
                <StatusChip label={trial.status} />
              </Stack>
              <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>{trial.scope}</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="outlined" onClick={() => action.mutate({ id: trial.id, status: 'accept' })} disabled={action.isPending}>Accept</Button>
                <Button variant="outlined" onClick={() => action.mutate({ id: trial.id, status: 'activate' })} disabled={action.isPending}>Activate</Button>
                <Button variant="contained" onClick={() => action.mutate({ id: trial.id, status: 'complete' })} disabled={action.isPending}>Complete</Button>
                <Button variant="outlined" color="error" onClick={() => action.mutate({ id: trial.id, status: 'cancel' })} disabled={action.isPending}>Cancel</Button>
              </Stack>
            </Stack>
          </Surface>
        ))}
      </Box>
    </Stack>
  );
}

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

export function NetworkTeamProfilePage() {
  return <TeamProfilesPage />;
}

export function NetworkSettingsPage() {
  const queryClient = useQueryClient();
  const account = useQuery({ queryKey: ['network', 'account'], queryFn: networkApi.account });
  const [form, setForm] = useState<Partial<UserAccount>>({});
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (account.data) {
      setForm({
        firstName: account.data.firstName || '',
        lastName: account.data.lastName || '',
      });
    }
  }, [account.data]);
  const save = useMutation({
    mutationFn: () => networkApi.updateAccount({ firstName: form.firstName || '', lastName: form.lastName || '' }),
    onSuccess: () => {
      setNotice('Account settings saved.');
      queryClient.invalidateQueries({ queryKey: ['network', 'account'] });
    },
  });

  return (
    <Stack spacing={3}>
      <PageHeader title="Account Settings" description="Manage identity details shared across Studio and Network. Email, role, and auth provider are controlled by the platform." />
      <QueryState isLoading={account.isLoading} error={account.error} />
      <NetworkNotice message={notice} />
      <Surface>
        <Stack spacing={2.5}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <TextField label="First name" value={form.firstName || ''} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
            <TextField label="Last name" value={form.lastName || ''} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <TextField label="Email" value={account.data?.email || ''} InputProps={{ readOnly: true }} />
            <TextField label="Role" value={formatLabel(account.data?.role || 'SPECIALIST')} InputProps={{ readOnly: true }} />
          </Box>
          <Box sx={{ p: 2, border: `1px solid ${appleColors.line}`, borderRadius: 2, bgcolor: '#f8fafc' }}>
            <Typography sx={{ fontWeight: 900, mb: 0.5 }}>Subdomain session model</Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
              Production auth should use a server-managed session cookie scoped to .produs.com so Network and Studio share the same signed-in account.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between">
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button component={NextLink} href="/expert-network/profile" variant="outlined">Expert profile</Button>
              <Button component={NextLink} href="/expert-network/team-profile" variant="outlined">Team profile</Button>
              <Button component={NextLink} href="/dashboard" variant="outlined">Dashboard</Button>
            </Stack>
            <Button variant="contained" onClick={() => save.mutate()} disabled={save.isPending} sx={{ minHeight: 44 }}>
              Save Settings
            </Button>
          </Stack>
        </Stack>
      </Surface>
    </Stack>
  );
}

export function NetworkExpertDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const expert = useQuery({ queryKey: ['network', 'expert', id], queryFn: () => networkApi.expert(id), enabled: !!id });
  const messageAction = useMessageAction();
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

export function NetworkTeamDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const team = useQuery({ queryKey: ['network', 'team', id], queryFn: () => networkApi.team(id), enabled: !!id });
  const messageAction = useMessageAction();
  const join = useMutation({ mutationFn: () => networkApi.requestToJoinTeam(id, { message: `I would like to discuss joining ${team.data?.name}.` }) });
  const record = team.data;
  return (
    <Stack spacing={3}>
      <QueryState isLoading={team.isLoading} error={team.error} />
      {record && (
        <>
          <Surface sx={{ p: 0, overflow: 'hidden' }}>
            <Box sx={{ height: 220, background: record.coverPhotoUrl ? `url(${record.coverPhotoUrl}) center/cover` : 'linear-gradient(135deg, #eef2ff, #ecfeff)' }} />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-end' }} sx={{ px: 3, pb: 3, mt: -4 }}>
              <PersonAvatar name={record.name} src={record.profilePhotoUrl} square />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h1">{record.name}</Typography>
                <Typography color="text.secondary">{record.headline || record.description}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                  <StatusChip label={record.verificationStatus} />
                  <PastelChip label={record.typicalProjectSize || 'Scoped packages'} />
                </Stack>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" startIcon={<ChatBubbleOutline />} onClick={() => messageAction.mutate({ scopeType: 'TEAM_PROFILE', scopeId: record.id, title: `Conversation with ${record.name}`, initialMessage: messageFor(record.name) })}>Message</Button>
                <Button variant="contained" startIcon={<PersonAddAltOutlined />} onClick={() => join.mutate()} disabled={join.isPending}>Request To Join</Button>
              </Stack>
            </Stack>
          </Surface>
          {join.isSuccess && <Alert severity="success">Join request submitted.</Alert>}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 0.8fr' }, gap: 2.5 }}>
            <Surface>
              <SectionTitle title="Team focus" />
              <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>{record.bio || record.description}</Typography>
            </Surface>
            <Surface>
              <SectionTitle title="Verified capabilities" />
              <TagRow value={record.capabilitiesSummary} limit={12} />
            </Surface>
          </Box>
        </>
      )}
    </Stack>
  );
}
