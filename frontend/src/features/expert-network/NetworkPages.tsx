'use client';

import NextLink from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import {
  AddOutlined,
  ArrowForward,
  ChatBubbleOutline,
  ExploreOutlined,
  FavoriteBorderOutlined,
  Inventory2Outlined,
  NotificationsNoneOutlined,
  PersonAddAltOutlined,
  SendOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
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
  TextInput,
  appleColors,
  formatLabel,
} from '@/features/platform/PlatformComponents';
import TeamProfilesPage from '@/features/platform/TeamProfilesPage';
import type { ExpertProfile, Team, TeamJoinRequest } from '@/features/platform/types';
import { networkApi } from './api';
import { ActivityRow, NetworkNotice, PersonAvatar, TagRow, displayName, formatDate } from './NetworkSharedPanels';
import {
  joinRequestForTeam,
  messageFor,
  trialActionsForStatus,
  type TrialAction,
} from './networkPresentation';
import type { FormationPostPayload, TrialPayload, UserAccount } from './types';
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

export function NetworkFormationPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
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
  const managedTeams = (teams.data || []).filter((team) => team.manager?.id === user?.id || user?.role === UserRole.ADMIN);
  const sentJoinRequests = useQuery({ queryKey: ['network', 'join-requests', 'mine'], queryFn: networkApi.myJoinRequests });
  const messageAction = useNetworkMessageAction();
  const create = useMutation({
    mutationFn: () => networkApi.createFormationPost({ ...form, teamId: form.postType === 'TEAM_OPENING' ? form.teamId : undefined }),
    onSuccess: () => {
      setNotice('Formation post published.');
      setForm((current) => ({ ...current, title: '', body: '', offeredServices: '', neededServices: '' }));
      queryClient.invalidateQueries({ queryKey: ['network', 'formation-posts'] });
    },
    onError: (error: Error) => setNotice(error.message),
  });
  const join = useMutation({
    mutationFn: (team: Team) => networkApi.requestToJoinTeam(team.id, { message: `I saw your formation opening and would like to discuss fit with ${team.name}.` }),
    onSuccess: () => {
      setNotice('Join request created from the formation board.');
      queryClient.invalidateQueries({ queryKey: ['network', 'join-requests', 'mine'] });
    },
    onError: (error: Error) => setNotice(error.message),
  });
  const cancelJoin = useMutation({
    mutationFn: (request: TeamJoinRequest) => networkApi.reviewJoinRequest(request.id, { status: 'CANCELLED', reviewNote: 'Cancelled by requester.' }),
    onSuccess: () => {
      setNotice('Join request cancelled.');
      queryClient.invalidateQueries({ queryKey: ['network', 'join-requests', 'mine'] });
    },
    onError: (error: Error) => setNotice(error.message),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate();
  };
  const canPublish = !!form.title && (form.postType !== 'TEAM_OPENING' || !!form.teamId);

  return (
    <Stack spacing={3}>
      <PageHeader title="Formation Board" description="Find teammates, publish clear openings, and start scoped conversations from real collaboration context." />
      <QueryState isLoading={posts.isLoading || teams.isLoading || sentJoinRequests.isLoading} error={posts.error || teams.error || sentJoinRequests.error} />
      <NetworkNotice message={notice} severity={create.isError || join.isError || cancelJoin.isError ? 'error' : 'success'} />
      <Surface>
        <Box component="form" onSubmit={submit}>
          <SectionTitle title="Create formation post" />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px 1fr 1fr' }, gap: 2 }}>
            <TextField
              select
              label="Post type"
              value={form.postType}
              onChange={(event) => {
                const postType = event.target.value as FormationPostPayload['postType'];
                setForm({ ...form, postType, teamId: postType === 'TEAM_OPENING' ? managedTeams[0]?.id : undefined });
              }}
            >
              <MenuItem value="LOOKING_FOR_TEAM">Looking for team</MenuItem>
              <MenuItem value="TEAM_OPENING">Team opening</MenuItem>
            </TextField>
            <TextField label="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            <TextField label="Package size" value={form.packageSize} onChange={(event) => setForm({ ...form, packageSize: event.target.value })} />
          </Box>
          {form.postType === 'TEAM_OPENING' && (
            <TextField
              select
              fullWidth
              label="Team publishing this opening"
              value={form.teamId || ''}
              onChange={(event) => setForm({ ...form, teamId: event.target.value })}
              helperText={managedTeams.length ? 'Applicants will request to join this team.' : 'Create or manage a team before publishing a team opening.'}
              sx={{ mt: 2 }}
            >
              {managedTeams.map((team) => (
                <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
              ))}
            </TextField>
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mt: 2 }}>
            <TextInput label="Services you bring" value={form.offeredServices || ''} onChange={(value) => setForm({ ...form, offeredServices: value })} />
            <TextInput label="Services you need" value={form.neededServices || ''} onChange={(value) => setForm({ ...form, neededServices: value })} />
          </Box>
          <TextInput label="Collaboration statement" value={form.body || ''} onChange={(value) => setForm({ ...form, body: value })} multiline />
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" startIcon={<AddOutlined />} disabled={create.isPending || !canPublish} sx={{ minHeight: 44, width: { xs: '100%', sm: 'auto' } }}>Publish Post</Button>
          </Stack>
        </Box>
      </Surface>
      <Stack spacing={2}>
        {(posts.data || []).map((post) => {
          const request = post.team ? joinRequestForTeam(sentJoinRequests.data, post.team.id) : undefined;
          const isMember = !!post.team && (teams.data || []).some((team) => team.id === post.team?.id);
          const isPending = request?.status === 'PENDING';
          const isApproved = request?.status === 'APPROVED' || isMember;
          return (
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
                  {post.team && (
                    <Button
                      onClick={() => {
                        if (isPending && request) {
                          cancelJoin.mutate(request);
                          return;
                        }
                        join.mutate(post.team!);
                      }}
                      variant={isPending || isApproved ? 'outlined' : 'contained'}
                      color={isPending ? 'error' : isApproved ? 'success' : 'primary'}
                      disabled={isApproved || join.isPending || cancelJoin.isPending}
                      startIcon={<PersonAddAltOutlined />}
                      sx={{ minHeight: 42, width: { xs: '100%', sm: 'auto' } }}
                    >
                      {isApproved ? 'Joined' : isPending ? 'Cancel Request' : 'Request To Join'}
                    </Button>
                  )}
                  <Button onClick={() => messageAction.mutate({ scopeType: 'FORMATION_POST', scopeId: post.id, targetUserId: post.author?.id, title: `Formation: ${post.title}`, initialMessage: `I saw your formation post: ${post.title}. I would like to discuss fit.` })} variant="outlined" startIcon={<ChatBubbleOutline />} sx={{ minHeight: 42, width: { xs: '100%', sm: 'auto' } }}>Message</Button>
                </Stack>
              </Stack>
            </Surface>
          );
        })}
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
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h3">{detail.data.title}</Typography>
                  <Typography color="text.secondary">{formatLabel(detail.data.scopeType)} · {detail.data.participants.length} participants</Typography>
                </Box>
                <Button variant="outlined" onClick={() => mute.mutate()} disabled={mute.isPending} sx={{ width: { xs: '100%', sm: 'auto' } }}>Mute</Button>
              </Stack>
              <Divider />
              <Stack spacing={1.5} sx={{ flex: 1, minHeight: 420 }}>
                {detail.data.messages.map((message) => (
                  <Box key={message.id} sx={{ alignSelf: message.sender?.id === detail.data?.createdBy?.id ? 'flex-start' : 'flex-end', maxWidth: { xs: '100%', sm: '72%' } }}>
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
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 900 }}>{request.team?.name}</Typography>
                    <Typography color="text.secondary">{request.message}</Typography>
                  </Box>
                  <StatusChip label={formatLabel(request.status)} />
                </Stack>
              </Box>
            ))}
            {!sent.data?.length && <EmptyState label="No join requests sent yet. Apply from Directory or Formation Board." />}
          </Stack>
        </Surface>
        <Surface>
          <SectionTitle title={`Requests for ${selectedTeam?.name || 'your team'}`} />
          <Stack spacing={1.5}>
            {(received.data || []).map((request) => {
              const canReview = request.status === 'PENDING';
              return (
                <Box key={request.id} sx={{ p: 1.5, border: `1px solid ${appleColors.line}`, borderRadius: 2 }}>
                  <Stack spacing={1.5}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900 }}>{displayName(request.requester?.email)}</Typography>
                        <Typography color="text.secondary">{request.message}</Typography>
                      </Box>
                      <StatusChip label={formatLabel(request.status)} />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      <Button variant="contained" disabled={!canReview || review.isPending} onClick={() => review.mutate({ id: request.id, status: 'APPROVED' })} sx={{ width: { xs: '100%', sm: 'auto' } }}>Accept</Button>
                      <Button variant="outlined" color="error" disabled={!canReview || review.isPending} onClick={() => review.mutate({ id: request.id, status: 'DECLINED' })} sx={{ width: { xs: '100%', sm: 'auto' } }}>Decline</Button>
                    </Stack>
                  </Stack>
                </Box>
              );
            })}
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
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState<TrialPayload>({ title: '', scope: '', proposedStartDate: '', proposedEndDate: '' });
  const create = useMutation({
    mutationFn: () => networkApi.createTrial({ ...form, teamId: myTeams.data?.[0]?.id }),
    onSuccess: () => {
      setForm({ title: '', scope: '', proposedStartDate: '', proposedEndDate: '' });
      setNotice('Trial collaboration created.');
      queryClient.invalidateQueries({ queryKey: ['network', 'trials'] });
    },
    onError: (error: Error) => setNotice(error.message),
  });
  const action = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TrialAction }) => networkApi.updateTrial(id, status),
    onSuccess: (trial) => {
      setNotice(`Trial status updated to ${formatLabel(trial.status)}.`);
      queryClient.invalidateQueries({ queryKey: ['network', 'trials'] });
    },
    onError: (error: Error) => setNotice(error.message),
  });

  return (
    <Stack spacing={3}>
      <PageHeader title="Trial Collaborations" description="Run scoped trial collaborations before team formation." />
      <QueryState isLoading={trials.isLoading || myTeams.isLoading} error={trials.error || myTeams.error} />
      <NetworkNotice message={notice} severity={create.isError || action.isError ? 'error' : 'success'} />
      <Surface>
        <SectionTitle title="Propose trial" />
        <Stack spacing={2}>
          <TextField label="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <TextField label="Scope" multiline minRows={3} value={form.scope} onChange={(event) => setForm({ ...form, scope: event.target.value })} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="Start date" type="date" InputLabelProps={{ shrink: true }} value={form.proposedStartDate} onChange={(event) => setForm({ ...form, proposedStartDate: event.target.value })} />
            <TextField label="End date" type="date" InputLabelProps={{ shrink: true }} value={form.proposedEndDate} onChange={(event) => setForm({ ...form, proposedEndDate: event.target.value })} />
          </Box>
          <Button variant="contained" disabled={!form.title || create.isPending} onClick={() => create.mutate()} sx={{ alignSelf: 'flex-end', width: { xs: '100%', sm: 'auto' }, minHeight: 44 }}>Create Trial</Button>
        </Stack>
      </Surface>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 2.5 }}>
        {(trials.data || []).map((trial) => (
          <Surface key={trial.id}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h3">{trial.title}</Typography>
                  <Typography color="text.secondary">{trial.team?.name || 'Independent collaboration'} · {formatDate(trial.proposedStartDate)} to {formatDate(trial.proposedEndDate)}</Typography>
                </Box>
                <StatusChip label={formatLabel(trial.status)} />
              </Stack>
              <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>{trial.scope}</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {trialActionsForStatus(trial.status).map((trialAction) => {
                  const isBusy = action.isPending && action.variables?.id === trial.id;
                  return (
                    <Button
                      key={trialAction.label}
                      variant={trialAction.variant}
                      color={trialAction.color}
                      onClick={() => trialAction.action && action.mutate({ id: trial.id, status: trialAction.action })}
                      disabled={trialAction.disabled || isBusy}
                      sx={{ minHeight: 42, width: { xs: '100%', sm: 'auto' } }}
                    >
                      {trialAction.label}
                    </Button>
                  );
                })}
              </Stack>
            </Stack>
          </Surface>
        ))}
        {!trials.data?.length && <EmptyState label="No trial collaborations yet. Propose a scoped trial when a team or specialist relationship needs evidence before commitment." />}
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
