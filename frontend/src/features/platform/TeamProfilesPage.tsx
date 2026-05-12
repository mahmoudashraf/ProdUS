'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AddPhotoAlternateOutlined,
  GroupsOutlined,
  HowToRegOutlined,
  PersonAddAltOutlined,
  RocketLaunchOutlined,
} from '@mui/icons-material';
import { Avatar, Box, Button, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson, postJson, putJson } from './api';
import {
  DotLabel,
  EmptyState,
  PageHeader,
  PastelChip,
  QueryState,
  SaveButton,
  SectionTitle,
  StatusChip,
  Surface,
  TextInput,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { ExpertProfile, Team, TeamInvitation, TeamJoinRequest, TeamMember } from './types';

type TeamProfilePayload = {
  name: string;
  description: string;
  headline: string;
  bio: string;
  profilePhotoUrl: string;
  coverPhotoUrl: string;
  websiteUrl: string;
  timezone: string;
  capabilitiesSummary: string;
  typicalProjectSize: string;
  verificationStatus: Team['verificationStatus'];
  active: boolean;
};

type ExpertProfilePayload = {
  displayName: string;
  headline: string;
  bio: string;
  profilePhotoUrl: string;
  coverPhotoUrl: string;
  location: string;
  timezone: string;
  websiteUrl: string;
  portfolioUrl: string;
  skills: string;
  preferredProjectSize: string;
  availability: ExpertProfile['availability'];
  soloMode: boolean;
  active: boolean;
};

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

const roleOptions: TeamMember['role'][] = ['SPECIALIST', 'DELIVERY_MANAGER', 'QUALITY_REVIEWER', 'ADVISOR', 'LEAD'];
const availabilityOptions: ExpertProfile['availability'][] = ['AVAILABLE', 'LIMITED', 'BUSY', 'OFFLINE'];

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

const initials = (value: string) => value.split(' ').filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || 'P';

function ProfileHero({
  title,
  subtitle,
  body,
  avatarUrl,
  coverUrl,
  status,
}: {
  title: string;
  subtitle?: string | undefined;
  body?: string | undefined;
  avatarUrl?: string | undefined;
  coverUrl?: string | undefined;
  status?: string | undefined;
}) {
  return (
    <Box>
      <Box
        sx={{
          height: 150,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          background: coverUrl
            ? `linear-gradient(180deg, rgba(15, 23, 42, 0.05), rgba(15, 23, 42, 0.25)), url(${coverUrl}) center/cover`
            : 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 45%, #ecfeff 100%)',
        }}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.75} alignItems={{ sm: 'flex-end' }} sx={{ mt: -4, px: 1 }}>
        <Avatar
          {...(avatarUrl ? { src: avatarUrl } : {})}
          sx={{
            width: 88,
            height: 88,
            border: '4px solid #fff',
            bgcolor: appleColors.purple,
            color: '#fff',
            fontWeight: 900,
            boxShadow: '0 18px 45px rgba(15,23,42,0.14)',
          }}
        >
          {initials(title)}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1, pb: 0.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="h3" sx={{ mb: 0 }}>{title}</Typography>
            {status && <StatusChip label={status} color="success" />}
          </Stack>
          {subtitle && <Typography color="text.secondary" sx={{ fontWeight: 800 }}>{subtitle}</Typography>}
          {body && <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.7 }}>{body}</Typography>}
        </Box>
      </Stack>
    </Box>
  );
}

export default function TeamProfilesPage() {
  const queryClient = useQueryClient();
  const { user, hasRole } = useAuth();
  const canLeadTeams = hasRole([UserRole.TEAM_MANAGER, UserRole.SPECIALIST, UserRole.ADMIN]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamForm, setTeamForm] = useState<TeamProfilePayload>(emptyTeamForm);
  const [expertForm, setExpertForm] = useState<ExpertProfilePayload>(emptyExpertForm);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'SPECIALIST' as TeamMember['role'], message: '' });
  const [joinMessage, setJoinMessage] = useState('I can help with backend, security, and launch evidence for this team.');

  const allTeams = useQuery({ queryKey: ['teams'], queryFn: () => getJson<Team[]>('/teams') });
  const myTeams = useQuery({ queryKey: ['teams', 'mine'], queryFn: () => getJson<Team[]>('/teams/mine') });
  const expertProfile = useQuery({ queryKey: ['expert-profile', 'me'], queryFn: () => getJson<ExpertProfile>('/expert-profiles/me') });
  const myJoinRequests = useQuery({ queryKey: ['team-join-requests', 'mine'], queryFn: () => getJson<TeamJoinRequest[]>('/teams/join-requests/mine') });

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
    mutationFn: () => postJson<TeamInvitation, typeof inviteForm>(`/teams/${selectedTeam?.id}/invitations`, inviteForm),
    onSuccess: async () => {
      setInviteForm({ email: '', role: 'SPECIALIST', message: '' });
      await queryClient.invalidateQueries({ queryKey: ['teams', selectedTeam?.id, 'invitations'] });
      await queryClient.invalidateQueries({ queryKey: ['teams', selectedTeam?.id, 'members'] });
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

  return (
    <>
      <PageHeader
        title={hasRole([UserRole.SPECIALIST, UserRole.ADVISOR]) ? 'Expert Profile Studio' : 'Team Profile Studio'}
        description="Maintain team identity, solo expert proof, invitations, and join requests from one governed profile surface."
      />
      <QueryState
        isLoading={allTeams.isLoading || myTeams.isLoading || expertProfile.isLoading || myJoinRequests.isLoading}
        error={allTeams.error || myTeams.error || expertProfile.error || myJoinRequests.error || members.error || (canManageSelectedTeam ? invitations.error : null) || (canManageSelectedTeam ? joinRequests.error : null) || createTeam.error || updateTeam.error || saveExpert.error || inviteMember.error || requestJoin.error || reviewJoin.error}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.35fr 0.9fr' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          <Surface>
            <SectionTitle title="Team Profile" action={<GroupsOutlined sx={{ color: appleColors.purple }} />} />
            {selectedTeam ? (
              <ProfileHero
                title={selectedTeam.name}
                subtitle={selectedTeam.headline || selectedTeam.description}
                body={selectedTeam.bio || selectedTeam.capabilitiesSummary}
                avatarUrl={selectedTeam.profilePhotoUrl}
                coverUrl={selectedTeam.coverPhotoUrl}
                status={selectedTeam.verificationStatus}
              />
            ) : (
              <EmptyState label="Create a team profile to start inviting collaborators." />
            )}
          </Surface>

          <Surface>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ md: 'center' }} sx={{ mb: 2 }}>
              <SectionTitle title={selectedTeam ? (canManageSelectedTeam ? 'Edit Team Profile' : 'Team Profile Details') : 'Create Team Profile'} />
              {managedTeams.length > 0 && (
                <TextField
                  select
                  size="small"
                  label="Team"
                  value={selectedTeam?.id || ''}
                  onChange={(event) => {
                    setIsCreatingTeam(false);
                    setSelectedTeamId(event.target.value);
                  }}
                  sx={{ minWidth: 260 }}
                >
                  <MenuItem value="" disabled>{isCreatingTeam ? 'New team profile' : 'Select team'}</MenuItem>
                  {managedTeams.map((team) => <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>)}
                </TextField>
              )}
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
              <TextInput disabled={!canSaveTeam} label="Team name" value={teamForm.name} onChange={(value) => setTeamValue('name', value)} />
              <TextInput disabled={!canSaveTeam} label="Headline" value={teamForm.headline} onChange={(value) => setTeamValue('headline', value)} />
              <TextInput disabled={!canSaveTeam} label="Location / timezone" value={teamForm.timezone} onChange={(value) => setTeamValue('timezone', value)} />
              <TextInput disabled={!canSaveTeam} label="Website" value={teamForm.websiteUrl} onChange={(value) => setTeamValue('websiteUrl', value)} />
              <TextInput disabled={!canSaveTeam} label="Profile photo URL" value={teamForm.profilePhotoUrl} onChange={(value) => setTeamValue('profilePhotoUrl', value)} />
              <TextInput disabled={!canSaveTeam} label="Cover photo URL" value={teamForm.coverPhotoUrl} onChange={(value) => setTeamValue('coverPhotoUrl', value)} />
              <TextInput disabled={!canSaveTeam} label="Description" value={teamForm.description} onChange={(value) => setTeamValue('description', value)} multiline />
              <TextInput disabled={!canSaveTeam} label="Bio" value={teamForm.bio} onChange={(value) => setTeamValue('bio', value)} multiline />
              <TextInput disabled={!canSaveTeam} label="Capabilities summary" value={teamForm.capabilitiesSummary} onChange={(value) => setTeamValue('capabilitiesSummary', value)} multiline />
              <TextInput disabled={!canSaveTeam} label="Typical project size" value={teamForm.typicalProjectSize} onChange={(value) => setTeamValue('typicalProjectSize', value)} />
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AddPhotoAlternateOutlined sx={{ color: appleColors.cyan }} />
                <Typography variant="body2" color="text.secondary">Photo fields are saved to the profile and rendered immediately.</Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={() => { setIsCreatingTeam(true); setSelectedTeamId(''); setTeamForm(emptyTeamForm); }} disabled={!canLeadTeams}>
                  New team
                </Button>
                <SaveButton disabled={!teamForm.name || createTeam.isPending || updateTeam.isPending || !canSaveTeam} label={selectedTeam ? 'Save team profile' : 'Create team'} onClick={saveTeamProfile} />
              </Stack>
            </Stack>
          </Surface>

          {selectedTeam && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
              <Surface>
                <SectionTitle title="Members and Invitations" action={<PersonAddAltOutlined sx={{ color: appleColors.green }} />} />
                <Stack spacing={1.5}>
                  {canManageSelectedTeam && (
                    <>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 170px' }, gap: 1 }}>
                        <TextField size="small" label="Invite email" value={inviteForm.email} onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))} />
                        <TextField select size="small" label="Role" value={inviteForm.role} onChange={(event) => setInviteForm((current) => ({ ...current, role: event.target.value as TeamMember['role'] }))}>
                          {roleOptions.map((role) => <MenuItem key={role} value={role}>{formatLabel(role)}</MenuItem>)}
                        </TextField>
                      </Box>
                      <TextInput label="Invitation note" value={inviteForm.message} onChange={(value) => setInviteForm((current) => ({ ...current, message: value }))} multiline />
                      <Button variant="contained" onClick={() => inviteMember.mutate()} disabled={!inviteForm.email || inviteMember.isPending}>
                        Invite to team
                      </Button>
                    </>
                  )}
                  <Stack spacing={1}>
                    {(members.data || []).map((member) => (
                      <Stack key={member.id} direction="row" justifyContent="space-between" sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                        <Typography sx={{ fontWeight: 800 }}>{member.user.email}</Typography>
                        <PastelChip label={formatLabel(member.role)} accent={appleColors.cyan} />
                      </Stack>
                    ))}
                    {canManageSelectedTeam && (invitations.data || []).slice(0, 4).map((invitation) => (
                      <Stack key={invitation.id} direction="row" justifyContent="space-between" sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                        <Typography color="text.secondary">{invitation.email}</Typography>
                        <StatusChip label={invitation.status} color={invitation.status === 'PENDING' ? 'warning' : 'success'} />
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </Surface>

              {canManageSelectedTeam && <Surface>
                <SectionTitle title="Join Requests" action={<HowToRegOutlined sx={{ color: appleColors.amber }} />} />
                <Stack spacing={1.25}>
                  {(joinRequests.data || []).length ? (joinRequests.data || []).map((request) => (
                    <Box key={request.id} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.25 }}>
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography sx={{ fontWeight: 800 }}>{request.requester?.email}</Typography>
                          <Typography variant="body2" color="text.secondary">{request.message || 'No note provided.'}</Typography>
                        </Box>
                        <StatusChip label={request.status} color={request.status === 'PENDING' ? 'warning' : 'success'} />
                      </Stack>
                      {request.status === 'PENDING' && (
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <Button size="small" variant="contained" onClick={() => reviewJoin.mutate({ id: request.id, status: 'APPROVED' })} disabled={reviewJoin.isPending}>Approve</Button>
                          <Button size="small" variant="outlined" onClick={() => reviewJoin.mutate({ id: request.id, status: 'DECLINED' })} disabled={reviewJoin.isPending}>Decline</Button>
                        </Stack>
                      )}
                    </Box>
                  )) : (
                    <Typography variant="body2" color="text.secondary">Requests from solo experts appear here for team lead review.</Typography>
                  )}
                </Stack>
              </Surface>}
            </Box>
          )}
        </Stack>

        <Stack spacing={2.5}>
          <Surface>
            <SectionTitle title="Solo Expert Profile" action={<RocketLaunchOutlined sx={{ color: appleColors.cyan }} />} />
            <ProfileHero
              title={expertForm.displayName || user?.email || 'Expert profile'}
              subtitle={expertForm.headline}
              body={expertForm.bio}
              avatarUrl={expertForm.profilePhotoUrl}
              coverUrl={expertForm.coverPhotoUrl}
              status={expertForm.availability}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.5, mt: 2 }}>
              <TextInput label="Display name" value={expertForm.displayName} onChange={(value) => setExpertValue('displayName', value)} />
              <TextInput label="Headline" value={expertForm.headline} onChange={(value) => setExpertValue('headline', value)} />
              <TextInput label="Bio" value={expertForm.bio} onChange={(value) => setExpertValue('bio', value)} multiline />
              <TextInput label="Profile photo URL" value={expertForm.profilePhotoUrl} onChange={(value) => setExpertValue('profilePhotoUrl', value)} />
              <TextInput label="Cover photo URL" value={expertForm.coverPhotoUrl} onChange={(value) => setExpertValue('coverPhotoUrl', value)} />
              <TextInput label="Location" value={expertForm.location} onChange={(value) => setExpertValue('location', value)} />
              <TextInput label="Skills" value={expertForm.skills} onChange={(value) => setExpertValue('skills', value)} multiline />
              <TextInput label="Portfolio URL" value={expertForm.portfolioUrl} onChange={(value) => setExpertValue('portfolioUrl', value)} />
              <TextInput label="Preferred project size" value={expertForm.preferredProjectSize} onChange={(value) => setExpertValue('preferredProjectSize', value)} />
              <TextField select fullWidth label="Availability" value={expertForm.availability} onChange={(event) => setExpertValue('availability', event.target.value as ExpertProfile['availability'])}>
                {availabilityOptions.map((option) => <MenuItem key={option} value={option}>{formatLabel(option)}</MenuItem>)}
              </TextField>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>Solo mode</Typography>
                  <Typography variant="body2" color="text.secondary">Show this profile as an independent expert, separate from team identity.</Typography>
                </Box>
                <Switch checked={expertForm.soloMode} onChange={(event) => setExpertValue('soloMode', event.target.checked)} />
              </Stack>
              <SaveButton disabled={!expertForm.displayName || saveExpert.isPending} label="Save expert profile" onClick={() => saveExpert.mutate()} />
            </Box>
          </Surface>

          <Surface>
            <SectionTitle title="Join or Create" />
            <Stack spacing={1.5}>
              <TextInput label="Join request note" value={joinMessage} onChange={setJoinMessage} multiline />
              {joinableTeams.slice(0, 5).map((team) => {
                const existingRequest = (myJoinRequests.data || []).find((request) => request.team?.id === team.id);
                return (
                  <Stack key={team.id} direction="row" spacing={1.25} alignItems="center" justifyContent="space-between" sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.25 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900 }}>{team.name}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>{team.headline || team.capabilitiesSummary || team.description}</Typography>
                    </Box>
                    {existingRequest ? (
                      <StatusChip label={existingRequest.status} color={existingRequest.status === 'PENDING' ? 'warning' : 'success'} />
                    ) : (
                      <Button size="small" variant="outlined" onClick={() => requestJoin.mutate(team.id)} disabled={requestJoin.isPending}>
                        Ask to join
                      </Button>
                    )}
                  </Stack>
                );
              })}
              {!joinableTeams.length && <DotLabel label="You currently lead or belong to every available team." color={appleColors.green} />}
            </Stack>
          </Surface>
        </Stack>
      </Box>
    </>
  );
}
