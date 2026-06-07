'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson, postJson, putJson } from './api';
import ExpertProfileStudioPanel from './ExpertProfileStudioPanel';
import TeamAccessPanel from './TeamAccessPanel';
import { TeamProfileStudioFocusNav, TeamProfileStudioView } from './TeamProfileStudioNavigation';
import TeamProfileIdentityPanel from './TeamProfileIdentityPanel';
import TeamProfilePeoplePanel from './TeamProfilePeoplePanel';
import {
  PageHeader,
  QueryState,
} from './PlatformComponents';
import { ExpertProfile, Team, TeamInvitation, TeamJoinRequest, TeamMember } from './types';
import type { ExpertProfilePayload, TeamInvitationPayload, TeamProfilePayload } from './teamProfileStudioTypes';

const emptyTeamForm: TeamProfilePayload = {
  name: '',
  description: '',
  headline: '',
  bio: '',
  profilePhotoUrl: '',
  coverPhotoUrl: '',
  websiteUrl: '',
  timezone: '',
  capabilitiesSummary: '',
  typicalProjectSize: '',
  verificationStatus: 'APPLIED',
  active: true,
};

const emptyExpertForm: ExpertProfilePayload = {
  displayName: '',
  headline: '',
  bio: '',
  profilePhotoUrl: '',
  coverPhotoUrl: '',
  location: '',
  timezone: '',
  websiteUrl: '',
  portfolioUrl: '',
  skills: '',
  preferredProjectSize: '',
  availability: 'AVAILABLE',
  soloMode: true,
  active: true,
};

const teamToForm = (team?: Team): TeamProfilePayload => ({
  ...emptyTeamForm,
  name: team?.name || '',
  description: team?.description || '',
  headline: team?.headline || '',
  bio: team?.bio || '',
  profilePhotoUrl: team?.profilePhotoUrl || '',
  coverPhotoUrl: team?.coverPhotoUrl || '',
  websiteUrl: team?.websiteUrl || '',
  timezone: team?.timezone || '',
  capabilitiesSummary: team?.capabilitiesSummary || '',
  typicalProjectSize: team?.typicalProjectSize || '',
  verificationStatus: team?.verificationStatus || 'APPLIED',
  active: team?.active ?? true,
});

const expertToForm = (profile?: ExpertProfile): ExpertProfilePayload => ({
  ...emptyExpertForm,
  displayName: profile?.displayName || '',
  headline: profile?.headline || '',
  bio: profile?.bio || '',
  profilePhotoUrl: profile?.profilePhotoUrl || '',
  coverPhotoUrl: profile?.coverPhotoUrl || '',
  location: profile?.location || '',
  timezone: profile?.timezone || '',
  websiteUrl: profile?.websiteUrl || '',
  portfolioUrl: profile?.portfolioUrl || '',
  skills: profile?.skills || '',
  preferredProjectSize: profile?.preferredProjectSize || '',
  availability: profile?.availability || 'AVAILABLE',
  soloMode: profile?.soloMode ?? true,
  active: profile?.active ?? true,
});

export default function TeamProfilesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, hasRole } = useAuth();
  const canLeadTeams = hasRole([UserRole.TEAM_MANAGER, UserRole.SPECIALIST, UserRole.ADMIN]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamForm, setTeamForm] = useState<TeamProfilePayload>(emptyTeamForm);
  const [expertForm, setExpertForm] = useState<ExpertProfilePayload>(emptyExpertForm);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'SPECIALIST' as TeamMember['role'], message: '' });
  const [inviteNotice, setInviteNotice] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);
  const [joinMessage, setJoinMessage] = useState('I can help with backend, security, and launch evidence for this team.');
  const viewParam = searchParams?.get('view');
  const activeView: TeamProfileStudioView =
    viewParam === 'team' || viewParam === 'expert' || viewParam === 'requests' ? viewParam : 'profile';
  const setActiveView = (view: TeamProfileStudioView) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('view', view);
    router.replace(`/teams?${params.toString()}`, { scroll: false });
  };

  const allTeams = useQuery({ queryKey: ['teams'], queryFn: () => getJson<Team[]>('/teams') });
  const myTeams = useQuery({ queryKey: ['teams', 'mine'], queryFn: () => getJson<Team[]>('/teams/mine') });
  const expertProfile = useQuery({ queryKey: ['expert-profile', 'me'], queryFn: () => getJson<ExpertProfile>('/expert-profiles/me') });
  const myJoinRequests = useQuery({ queryKey: ['team-join-requests', 'mine'], queryFn: () => getJson<TeamJoinRequest[]>('/teams/join-requests/mine') });
  const myInvitations = useQuery({ queryKey: ['team-invitations', 'mine'], queryFn: () => getJson<TeamInvitation[]>('/teams/invitations/mine') });

  const managedTeams = myTeams.data || [];
  const directoryTeams = allTeams.data || [];
  const selectedTeam = useMemo(
    () => isCreatingTeam ? undefined : managedTeams.find((team) => team.id === selectedTeamId) || managedTeams[0],
    [isCreatingTeam, managedTeams, selectedTeamId]
  );
  const canManageSelectedTeam = !!selectedTeam && (hasRole(UserRole.ADMIN) || selectedTeam.manager?.id === user?.id);
  const canSaveTeam = canLeadTeams && (!selectedTeam || canManageSelectedTeam);
  const joinableTeams = directoryTeams.filter((team) => !managedTeams.some((mine) => mine.id === team.id));

  const members = useQuery({
    queryKey: ['teams', selectedTeam?.id, 'members'],
    enabled: !!selectedTeam?.id,
    queryFn: () => getJson<TeamMember[]>(`/teams/${selectedTeam?.id}/members`),
  });
  const invitations = useQuery({
    queryKey: ['teams', selectedTeam?.id, 'invitations'],
    enabled: !!selectedTeam?.id && canManageSelectedTeam,
    queryFn: () => getJson<TeamInvitation[]>(`/teams/${selectedTeam?.id}/invitations`),
  });
  const joinRequests = useQuery({
    queryKey: ['teams', selectedTeam?.id, 'join-requests'],
    enabled: !!selectedTeam?.id && canManageSelectedTeam,
    queryFn: () => getJson<TeamJoinRequest[]>(`/teams/${selectedTeam?.id}/join-requests`),
  });

  useEffect(() => {
    if (!selectedTeamId && managedTeams[0] && !isCreatingTeam) {
      setSelectedTeamId(managedTeams[0].id);
    }
  }, [isCreatingTeam, managedTeams, selectedTeamId]);

  useEffect(() => {
    setTeamForm(teamToForm(selectedTeam));
  }, [isCreatingTeam, selectedTeam?.id]);

  useEffect(() => {
    if (expertProfile.data) {
      setExpertForm(expertToForm(expertProfile.data));
    }
  }, [expertProfile.data]);

  const createTeam = useMutation({
    mutationFn: () => postJson<Team, TeamProfilePayload>('/teams', teamForm),
    onSuccess: async (team) => {
      setIsCreatingTeam(false);
      setSelectedTeamId(team.id);
      await queryClient.invalidateQueries({ queryKey: ['teams'] });
      await queryClient.invalidateQueries({ queryKey: ['teams', 'mine'] });
    },
  });

  const updateTeam = useMutation({
    mutationFn: () => putJson<Team, TeamProfilePayload>(`/teams/${selectedTeam?.id}`, teamForm),
    onSuccess: async (team) => {
      setSelectedTeamId(team.id);
      await queryClient.invalidateQueries({ queryKey: ['teams'] });
      await queryClient.invalidateQueries({ queryKey: ['teams', 'mine'] });
    },
  });

  const saveExpert = useMutation({
    mutationFn: () => putJson<ExpertProfile, ExpertProfilePayload>('/expert-profiles/me', expertForm),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['expert-profile', 'me'] });
      await queryClient.invalidateQueries({ queryKey: ['expert-profiles'] });
    },
  });

  const inviteMember = useMutation({
    mutationFn: (payload: TeamInvitationPayload) => postJson<TeamInvitation, TeamInvitationPayload>(`/teams/${selectedTeam?.id}/invitations`, payload),
    onMutate: () => setInviteNotice(null),
    onSuccess: async (invitation) => {
      setInviteForm({ email: '', role: 'SPECIALIST', message: '' });
      setInviteNotice({
        severity: 'success',
        message: invitation.status === 'ACCEPTED'
          ? `${invitation.email} is now an active team member.`
          : `Invitation sent to ${invitation.email}.`,
      });
      await queryClient.invalidateQueries({ queryKey: ['teams', selectedTeam?.id, 'invitations'] });
      await queryClient.invalidateQueries({ queryKey: ['teams', selectedTeam?.id, 'members'] });
      await queryClient.invalidateQueries({ queryKey: ['team-invitations', 'mine'] });
    },
    onError: () => {
      setInviteNotice({ severity: 'error', message: 'Invitation failed. Check the email and team permissions, then try again.' });
    },
  });

  const respondInvitation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TeamInvitation['status'] }) =>
      putJson<TeamInvitation, { status: TeamInvitation['status'] }>(`/teams/invitations/${id}`, { status }),
    onSuccess: async (invitation) => {
      await queryClient.invalidateQueries({ queryKey: ['team-invitations', 'mine'] });
      await queryClient.invalidateQueries({ queryKey: ['teams'] });
      await queryClient.invalidateQueries({ queryKey: ['teams', 'mine'] });
      if (invitation.team?.id) {
        await queryClient.invalidateQueries({ queryKey: ['teams', invitation.team.id, 'members'] });
        await queryClient.invalidateQueries({ queryKey: ['teams', invitation.team.id, 'invitations'] });
      }
    },
  });

  const requestJoin = useMutation({
    mutationFn: (teamId: string) => postJson<TeamJoinRequest, { message: string }>(`/teams/${teamId}/join-requests`, { message: joinMessage }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['team-join-requests', 'mine'] });
    },
  });

  const reviewJoin = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TeamJoinRequest['status'] }) =>
      putJson<TeamJoinRequest, { status: TeamJoinRequest['status']; reviewNote: string }>(`/teams/join-requests/${id}`, {
        status,
        reviewNote: status === 'APPROVED' ? 'Approved from team profile studio.' : 'Declined from team profile studio.',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teams', selectedTeam?.id, 'join-requests'] });
      await queryClient.invalidateQueries({ queryKey: ['teams', selectedTeam?.id, 'members'] });
    },
  });

  const saveTeamProfile = () => {
    if (!canSaveTeam) return;
    if (selectedTeam?.id && canManageSelectedTeam) {
      updateTeam.mutate();
    } else {
      createTeam.mutate();
    }
  };

  const setTeamValue = <K extends keyof TeamProfilePayload>(key: K, value: TeamProfilePayload[K]) => {
    setTeamForm((current) => ({ ...current, [key]: value }));
  };
  const setExpertValue = <K extends keyof ExpertProfilePayload>(key: K, value: ExpertProfilePayload[K]) => {
    setExpertForm((current) => ({ ...current, [key]: value }));
  };
  const submitInvitation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTeam || !canManageSelectedTeam || inviteMember.isPending) return;

    const email = inviteForm.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteNotice({ severity: 'error', message: 'Use a valid email address before sending an invitation.' });
      return;
    }

    inviteMember.mutate({
      email,
      role: inviteForm.role,
      message: inviteForm.message.trim(),
    });
  };
  const viewCounts: Record<TeamProfileStudioView, number> = {
    profile: selectedTeam ? 1 : 0,
    team: (members.data || []).length + (invitations.data || []).length + (joinRequests.data || []).length,
    expert: expertProfile.data ? 1 : 0,
    requests: (myInvitations.data || []).length + (myJoinRequests.data || []).length + joinableTeams.length,
  };

  return (
    <>
      <PageHeader
        title={hasRole([UserRole.SPECIALIST, UserRole.ADVISOR]) ? 'Expert Profile Studio' : 'Team Profile Studio'}
        description="Maintain team identity, solo expert proof, invitations, and join requests from one governed profile surface."
      />
      <QueryState
        isLoading={allTeams.isLoading || myTeams.isLoading || expertProfile.isLoading || myJoinRequests.isLoading || myInvitations.isLoading}
        error={allTeams.error || myTeams.error || expertProfile.error || myJoinRequests.error || myInvitations.error || members.error || (canManageSelectedTeam ? invitations.error : null) || (canManageSelectedTeam ? joinRequests.error : null) || createTeam.error || updateTeam.error || saveExpert.error || inviteMember.error || respondInvitation.error || requestJoin.error || reviewJoin.error}
      />
      <TeamProfileStudioFocusNav activeView={activeView} counts={viewCounts} onChange={setActiveView} />

      <Stack spacing={2.5}>
        {activeView === 'profile' && (
          <TeamProfileIdentityPanel
            selectedTeam={selectedTeam}
            managedTeams={managedTeams}
            teamForm={teamForm}
            isCreatingTeam={isCreatingTeam}
            canLeadTeams={canLeadTeams}
            canSaveTeam={canSaveTeam}
            canManageSelectedTeam={canManageSelectedTeam}
            createTeamPending={createTeam.isPending}
            updateTeamPending={updateTeam.isPending}
            onSelectTeam={(teamId) => {
              setIsCreatingTeam(false);
              setSelectedTeamId(teamId);
            }}
            onStartNewTeam={() => {
              setIsCreatingTeam(true);
              setSelectedTeamId('');
              setTeamForm(emptyTeamForm);
            }}
            onTeamValueChange={setTeamValue}
            onSaveTeamProfile={saveTeamProfile}
          />
        )}

        {activeView === 'team' && (
          <TeamProfilePeoplePanel
            selectedTeam={selectedTeam}
            canManageSelectedTeam={canManageSelectedTeam}
            inviteForm={inviteForm}
            inviteNotice={inviteNotice}
            invitePending={inviteMember.isPending}
            respondInvitationPending={respondInvitation.isPending}
            reviewJoinPending={reviewJoin.isPending}
            members={members.data || []}
            invitations={invitations.data || []}
            joinRequests={joinRequests.data || []}
            onInviteFormChange={(patch) => setInviteForm((current) => ({ ...current, ...patch }))}
            onSubmitInvitation={submitInvitation}
            onCancelInvitation={(id) => respondInvitation.mutate({ id, status: 'CANCELLED' })}
            onReviewJoinRequest={(id, status) => reviewJoin.mutate({ id, status })}
          />
        )}

        {activeView === 'expert' && (
          <ExpertProfileStudioPanel
            expertForm={expertForm}
            userEmail={user?.email}
            saveExpertPending={saveExpert.isPending}
            onExpertValueChange={setExpertValue}
            onSaveExpertProfile={() => saveExpert.mutate()}
          />
        )}

        {activeView === 'requests' && (
          <TeamAccessPanel
            invitations={myInvitations.data || []}
            joinableTeams={joinableTeams}
            joinRequests={myJoinRequests.data || []}
            joinMessage={joinMessage}
            respondInvitationPending={respondInvitation.isPending}
            requestJoinPending={requestJoin.isPending}
            onJoinMessageChange={setJoinMessage}
            onRespondInvitation={(id, status) => respondInvitation.mutate({ id, status })}
            onRequestJoin={(teamId) => requestJoin.mutate(teamId)}
          />
        )}
      </Stack>
    </>
  );
}
