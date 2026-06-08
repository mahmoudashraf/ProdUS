'use client';

import { FormEvent, useState } from 'react';
import { AddOutlined, ChatBubbleOutline, PersonAddAltOutlined } from '@mui/icons-material';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import {
  EmptyState,
  PageHeader,
  QueryState,
  SectionTitle,
  StatusChip,
  Surface,
  TextInput,
} from '@/features/platform/PlatformComponents';
import type { Team, TeamJoinRequest } from '@/features/platform/types';
import { networkApi } from './api';
import { NetworkNotice, PersonAvatar, TagRow, displayName, formatDate } from './NetworkSharedPanels';
import { joinRequestForTeam } from './networkPresentation';
import type { FormationPostPayload } from './types';
import { useNetworkMessageAction } from './useNetworkMessageAction';

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
