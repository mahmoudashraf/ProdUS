'use client';

import NextLink from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import {
  ArrowForward,
  ChatBubbleOutline,
  ExploreOutlined,
  Inventory2Outlined,
  NotificationsNoneOutlined,
  PersonAddAltOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  formatLabel,
} from '@/features/platform/PlatformComponents';
import TeamProfilesPage from '@/features/platform/TeamProfilesPage';
import type { ExpertProfile, TeamJoinRequest } from '@/features/platform/types';
import { networkApi } from './api';
import { ActivityRow, NetworkNotice, PersonAvatar, TagRow } from './NetworkSharedPanels';
import {
  joinRequestForTeam,
  messageFor,
} from './networkPresentation';
import type { UserAccount } from './types';
import { useNetworkMessageAction } from './useNetworkMessageAction';

export { NetworkDashboardPage } from './NetworkDashboardPage';

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

export { NetworkDirectoryPage } from './NetworkDirectoryPage';
export { NetworkFormationPage } from './NetworkFormationPage';
export { NetworkMessagesPage } from './NetworkMessagesPage';
export { NetworkChannelsPage } from './NetworkChannelsPage';
export { NetworkJoinRequestsPage } from './NetworkJoinRequestsPage';
export { NetworkTrialsPage } from './NetworkTrialsPage';

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

export function NetworkTeamDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const queryClient = useQueryClient();
  const team = useQuery({ queryKey: ['network', 'team', id], queryFn: () => networkApi.team(id), enabled: !!id });
  const myTeams = useQuery({ queryKey: ['network', 'my-teams'], queryFn: networkApi.myTeams });
  const sentJoinRequests = useQuery({ queryKey: ['network', 'join-requests', 'mine'], queryFn: networkApi.myJoinRequests });
  const messageAction = useNetworkMessageAction();
  const join = useMutation({
    mutationFn: () => networkApi.requestToJoinTeam(id, { message: `I would like to discuss joining ${team.data?.name}.` }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['network', 'join-requests', 'mine'] }),
  });
  const cancelJoin = useMutation({
    mutationFn: (request: TeamJoinRequest) => networkApi.reviewJoinRequest(request.id, { status: 'CANCELLED', reviewNote: 'Cancelled by requester.' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['network', 'join-requests', 'mine'] }),
  });
  const record = team.data;
  const request = record ? joinRequestForTeam(sentJoinRequests.data, record.id) : undefined;
  const isMember = !!record && (myTeams.data || []).some((myTeam) => myTeam.id === record.id);
  const isPending = request?.status === 'PENDING';
  const isApproved = request?.status === 'APPROVED' || isMember;
  return (
    <Stack spacing={3}>
      <QueryState isLoading={team.isLoading || myTeams.isLoading || sentJoinRequests.isLoading} error={team.error || myTeams.error || sentJoinRequests.error} />
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
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
                <Button variant="outlined" startIcon={<ChatBubbleOutline />} onClick={() => messageAction.mutate({ scopeType: 'TEAM_PROFILE', scopeId: record.id, title: `Conversation with ${record.name}`, initialMessage: messageFor(record.name) })} sx={{ width: { xs: '100%', sm: 'auto' } }}>Message</Button>
                <Button
                  variant={isPending || isApproved ? 'outlined' : 'contained'}
                  color={isPending ? 'error' : isApproved ? 'success' : 'primary'}
                  startIcon={<PersonAddAltOutlined />}
                  onClick={() => {
                    if (isPending && request) {
                      cancelJoin.mutate(request);
                      return;
                    }
                    join.mutate();
                  }}
                  disabled={isApproved || join.isPending || cancelJoin.isPending}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  {isApproved ? 'Joined' : isPending ? 'Cancel Request' : 'Request To Join'}
                </Button>
              </Stack>
            </Stack>
          </Surface>
          {join.isSuccess && <Alert severity="success">Join request submitted.</Alert>}
          {cancelJoin.isSuccess && <Alert severity="success">Join request cancelled.</Alert>}
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
