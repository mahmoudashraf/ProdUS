'use client';

import NextLink from 'next/link';
import { ArrowForward, TuneOutlined } from '@mui/icons-material';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import {
  EmptyState,
  PageHeader,
  QueryState,
  SectionTitle,
  Surface,
} from '@/features/platform/PlatformComponents';
import type { ExpertProfile, Team, TeamInvitation, TeamJoinRequest } from '@/features/platform/types';
import { networkApi } from './api';
import { ExpertCard, TeamCard } from './NetworkProfileCards';
import { NetworkNotice } from './NetworkSharedPanels';
import {
  invitationForExpert,
  joinRequestForTeam,
  memberForExpert,
  messageFor,
} from './networkPresentation';
import { useNetworkMessageAction } from './useNetworkMessageAction';

export function NetworkDirectoryPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [entityFilter, setEntityFilter] = useState<'ALL' | 'EXPERTS' | 'TEAMS'>('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | ExpertProfile['availability']>('ALL');
  const [verificationFilter, setVerificationFilter] = useState<'ALL' | Team['verificationStatus']>('ALL');
  const experts = useQuery({ queryKey: ['network', 'experts'], queryFn: networkApi.experts });
  const teams = useQuery({ queryKey: ['network', 'teams'], queryFn: networkApi.teams });
  const myTeams = useQuery({ queryKey: ['network', 'my-teams'], queryFn: networkApi.myTeams });
  const managedTeam = (myTeams.data || []).find((team) => team.manager?.id === user?.id || user?.role === UserRole.ADMIN);
  const teamInvitations = useQuery({
    queryKey: ['network', 'team-invitations', managedTeam?.id],
    queryFn: () => networkApi.teamInvitations(managedTeam!.id),
    enabled: !!managedTeam?.id,
  });
  const teamMembers = useQuery({
    queryKey: ['network', 'team-members', managedTeam?.id],
    queryFn: () => networkApi.teamMembers(managedTeam!.id),
    enabled: !!managedTeam?.id,
  });
  const sentJoinRequests = useQuery({ queryKey: ['network', 'join-requests', 'mine'], queryFn: networkApi.myJoinRequests });
  const messageAction = useNetworkMessageAction();
  const invite = useMutation({
    mutationFn: (expert: ExpertProfile) => {
      const team = managedTeam;
      if (!team || !expert.user?.email) throw new Error('Create or join a team before inviting experts.');
      return networkApi.inviteToTeam(team.id, {
        email: expert.user.email,
        role: 'SPECIALIST',
        message: `We think your ${expert.headline || 'expert'} profile fits ${team.name}. Would you like to discuss joining?`,
      });
    },
    onSuccess: (invitation) => {
      setNotice(invitation.status === 'ACCEPTED' ? 'Expert added to your team.' : 'Invitation sent and waiting for a response.');
      queryClient.invalidateQueries({ queryKey: ['network', 'my-teams'] });
      queryClient.invalidateQueries({ queryKey: ['network', 'team-invitations', managedTeam?.id] });
      queryClient.invalidateQueries({ queryKey: ['network', 'team-members', managedTeam?.id] });
    },
    onError: (error: Error) => setNotice(error.message),
  });
  const cancelInvite = useMutation({
    mutationFn: (invitation: TeamInvitation) => networkApi.reviewInvitation(invitation.id, { status: 'CANCELLED' }),
    onSuccess: () => {
      setNotice('Invitation cancelled. You can invite this expert again when ready.');
      queryClient.invalidateQueries({ queryKey: ['network', 'team-invitations', managedTeam?.id] });
    },
    onError: (error: Error) => setNotice(error.message),
  });
  const join = useMutation({
    mutationFn: (team: Team) => networkApi.requestToJoinTeam(team.id, { message: `I would like to discuss joining ${team.name}. My profile includes production-ready service experience and I can share evidence.` }),
    onSuccess: () => {
      setNotice('Join request submitted to the team lead.');
      queryClient.invalidateQueries({ queryKey: ['network', 'join-requests', 'mine'] });
    },
    onError: (error: Error) => setNotice(error.message),
  });
  const cancelJoin = useMutation({
    mutationFn: (request: TeamJoinRequest) => networkApi.reviewJoinRequest(request.id, { status: 'CANCELLED', reviewNote: 'Cancelled by requester.' }),
    onSuccess: () => {
      setNotice('Join request cancelled. You can request to join again later.');
      queryClient.invalidateQueries({ queryKey: ['network', 'join-requests', 'mine'] });
    },
    onError: (error: Error) => setNotice(error.message),
  });

  const normalizedQuery = query.trim().toLowerCase();
  const visibleExperts = (experts.data || []).filter((expert) =>
    entityFilter !== 'TEAMS'
    && (availabilityFilter === 'ALL' || expert.availability === availabilityFilter)
    && `${expert.displayName} ${expert.headline} ${expert.skills}`.toLowerCase().includes(normalizedQuery)
  );
  const visibleTeams = (teams.data || []).filter((team) =>
    entityFilter !== 'EXPERTS'
    && (verificationFilter === 'ALL' || team.verificationStatus === verificationFilter)
    && `${team.name} ${team.headline} ${team.capabilitiesSummary}`.toLowerCase().includes(normalizedQuery)
  );

  return (
    <Stack spacing={3}>
      <PageHeader title="Expert Directory" description="Find experts and teams to collaborate with, message with context, invite credible specialists, or request to join verified teams." />
      <QueryState isLoading={experts.isLoading || teams.isLoading} error={experts.error || teams.error} />
      <NetworkNotice message={notice} severity={invite.isError || join.isError ? 'error' : 'success'} />
      <Surface>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ lg: 'center' }}>
          <TextField fullWidth label="Search by name, skill, service, or team" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button variant={filtersOpen ? 'contained' : 'outlined'} startIcon={<TuneOutlined />} onClick={() => setFiltersOpen((value) => !value)} sx={{ minHeight: 52, minWidth: 140 }}>
            Filters
          </Button>
        </Stack>
        {filtersOpen && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5, mt: 2 }}>
            <TextField select label="Show" value={entityFilter} onChange={(event) => setEntityFilter(event.target.value as typeof entityFilter)}>
              <MenuItem value="ALL">Experts and teams</MenuItem>
              <MenuItem value="EXPERTS">Experts only</MenuItem>
              <MenuItem value="TEAMS">Teams only</MenuItem>
            </TextField>
            <TextField select label="Expert availability" value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value as typeof availabilityFilter)} disabled={entityFilter === 'TEAMS'}>
              <MenuItem value="ALL">Any availability</MenuItem>
              <MenuItem value="AVAILABLE">Available</MenuItem>
              <MenuItem value="LIMITED">Limited</MenuItem>
              <MenuItem value="BUSY">Busy</MenuItem>
              <MenuItem value="OFFLINE">Offline</MenuItem>
            </TextField>
            <TextField select label="Team status" value={verificationFilter} onChange={(event) => setVerificationFilter(event.target.value as typeof verificationFilter)} disabled={entityFilter === 'EXPERTS'}>
              <MenuItem value="ALL">Any team status</MenuItem>
              <MenuItem value="APPLIED">Applied</MenuItem>
              <MenuItem value="VERIFIED">Verified</MenuItem>
              <MenuItem value="CERTIFIED">Certified</MenuItem>
              <MenuItem value="SPECIALIST">Specialist</MenuItem>
              <MenuItem value="OPERATIONS_READY">Operations ready</MenuItem>
            </TextField>
          </Box>
        )}
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
          {visibleExperts.map((expert) => {
            const invitation = invitationForExpert(teamInvitations.data, expert);
            const member = memberForExpert(teamMembers.data, expert);
            const isAdded = !!member || invitation?.status === 'ACCEPTED';
            const isPending = invitation?.status === 'PENDING';
            return (
              <ExpertCard
                key={expert.id}
                expert={expert}
                busy={messageAction.isPending || invite.isPending || cancelInvite.isPending}
                inviteLabel={isAdded ? 'Added' : isPending ? 'Cancel Invite' : managedTeam ? 'Invite' : 'No Managed Team'}
                inviteVariant={isPending ? 'outlined' : isAdded || !managedTeam ? 'outlined' : 'contained'}
                inviteColor={isPending ? 'error' : isAdded ? 'success' : 'primary'}
                inviteDisabled={isAdded || !managedTeam}
                onMessage={() => messageAction.mutate({ scopeType: 'EXPERT_PROFILE', scopeId: expert.id, targetUserId: expert.user?.id, title: `Conversation with ${expert.displayName}`, initialMessage: messageFor(expert.displayName) })}
                onInvite={() => {
                  if (isPending && invitation) {
                    cancelInvite.mutate(invitation);
                    return;
                  }
                  invite.mutate(expert);
                }}
              />
            );
          })}
          {!visibleExperts.length && <EmptyState label="No experts match the current search and filters." />}
        </Stack>
        <Stack spacing={2.5}>
          <SectionTitle title={`Teams (${visibleTeams.length})`} />
          {visibleTeams.map((team) => {
            const request = joinRequestForTeam(sentJoinRequests.data, team.id);
            const isMember = (myTeams.data || []).some((myTeam) => myTeam.id === team.id);
            const isPending = request?.status === 'PENDING';
            const isApproved = request?.status === 'APPROVED' || isMember;
            return (
              <TeamCard
                key={team.id}
                team={team}
                busy={messageAction.isPending || join.isPending || cancelJoin.isPending}
                applyLabel={isApproved ? 'Joined' : isPending ? 'Cancel Request' : 'Request To Join'}
                applyVariant={isPending || isApproved ? 'outlined' : 'contained'}
                applyColor={isPending ? 'error' : isApproved ? 'success' : 'primary'}
                applyDisabled={isApproved}
                onApply={() => {
                  if (isPending && request) {
                    cancelJoin.mutate(request);
                    return;
                  }
                  join.mutate(team);
                }}
                onMessage={() => messageAction.mutate({ scopeType: 'TEAM_PROFILE', scopeId: team.id, title: `Conversation with ${team.name}`, initialMessage: messageFor(team.name) })}
              />
            );
          })}
          {!visibleTeams.length && <EmptyState label="No teams match the current search and filters." />}
        </Stack>
      </Box>
    </Stack>
  );
}
