'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BookmarkBorderOutlined,
  ManageAccountsOutlined,
  TuneOutlined,
  VerifiedOutlined,
} from '@mui/icons-material';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson, postJson } from './api';
import TeamProfilesPage from './TeamProfilesPage';
import {
  DotLabel,
  EmptyState,
  PageHeader,
  PastelChip,
  ProgressRing,
  QueryState,
  SaveButton,
  SectionTitle,
  StatusChip,
  Surface,
  TextInput,
  appleColors,
  categoryPalette,
  formatLabel,
} from './PlatformComponents';
import {
  PackageInstance,
  ProjectWorkspace,
  ServiceCategory,
  ServiceModule,
  Team,
  TeamCapability,
  TeamMember,
  TeamRecommendation,
  TeamReputationEvent,
  TeamShortlist,
} from './types';

const statuses: Team['verificationStatus'][] = ['APPLIED', 'VERIFIED', 'CERTIFIED', 'SPECIALIST', 'OPERATIONS_READY'];
const memberRoles: TeamMember['role'][] = ['LEAD', 'DELIVERY_MANAGER', 'SPECIALIST', 'ADVISOR', 'QUALITY_REVIEWER'];

interface TeamPayload {
  name: string;
  description: string;
  timezone: string;
  capabilitiesSummary: string;
  typicalProjectSize: string;
  verificationStatus: Team['verificationStatus'];
  active: boolean;
}

interface CapabilityPayload {
  serviceCategoryId: string;
  serviceModuleId: string | null;
  evidenceUrl: string;
  notes: string;
}

interface TeamMemberPayload {
  email: string;
  role: TeamMember['role'];
  active: boolean;
}

interface ReputationPayload {
  workspaceId: string;
  eventType: TeamReputationEvent['eventType'];
  rating: number;
  notes: string;
}

interface ShortlistPayload {
  packageInstanceId: string;
  teamId: string;
  status: TeamShortlist['status'];
  notes: string;
}

const initialTeamValues: TeamPayload = {
  name: '',
  description: '',
  timezone: '',
  capabilitiesSummary: '',
  typicalProjectSize: '',
  verificationStatus: 'APPLIED',
  active: true,
};

const initialCapabilityValues: CapabilityPayload = {
  serviceCategoryId: '',
  serviceModuleId: null,
  evidenceUrl: '',
  notes: '',
};

const initialMemberValues: TeamMemberPayload = {
  email: '',
  role: 'SPECIALIST',
  active: true,
};

const initialReputationValues: ReputationPayload = {
  workspaceId: '',
  eventType: 'WORKSPACE_REVIEW',
  rating: 5,
  notes: '',
};

const verificationScore = (team: Team) => {
  const scoreByStatus = {
    APPLIED: 48,
    VERIFIED: 74,
    CERTIFIED: 84,
    SPECIALIST: 91,
    OPERATIONS_READY: 96,
    SUSPENDED: 20,
  };
  return scoreByStatus[team.verificationStatus] || 60;
};

export default function TeamsPage() {
  const { hasRole } = useAuth();
  const shouldShowProfileStudio = hasRole([UserRole.TEAM_MANAGER, UserRole.SPECIALIST, UserRole.ADVISOR])
    && !hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER]);

  return shouldShowProfileStudio ? <TeamProfilesPage /> : <MatchedTeamsPage />;
}

function MatchedTeamsPage() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canManageTeamRoster = hasRole([UserRole.ADMIN, UserRole.TEAM_MANAGER]);
  const canCreateReputation = hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER]);
  const teams = useQuery({ queryKey: ['teams'], queryFn: () => getJson<Team[]>('/teams') });
  const packages = useQuery({ queryKey: ['packages'], queryFn: () => getJson<PackageInstance[]>('/packages') });
  const categories = useQuery({ queryKey: ['catalog-categories'], queryFn: () => getJson<ServiceCategory[]>('/catalog/categories') });
  const modules = useQuery({ queryKey: ['catalog-modules'], queryFn: () => getJson<ServiceModule[]>('/catalog/modules') });
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: () => getJson<ProjectWorkspace[]>('/workspaces') });
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');

  const teamForm = useAdvancedForm<TeamPayload>({
    initialValues: initialTeamValues,
    validationRules: {
      name: [{ type: 'required', message: 'Team name is required' }],
    },
  });
  const capabilityForm = useAdvancedForm<CapabilityPayload>({
    initialValues: initialCapabilityValues,
    validationRules: {
      serviceCategoryId: [{ type: 'required', message: 'Service category is required' }],
    },
  });
  const memberForm = useAdvancedForm<TeamMemberPayload>({
    initialValues: initialMemberValues,
    validationRules: {
      email: [
        { type: 'required', message: 'Member email is required' },
        { type: 'email', message: 'Use a valid email address' },
      ],
    },
  });
  const reputationForm = useAdvancedForm<ReputationPayload>({
    initialValues: initialReputationValues,
    validationRules: {
      workspaceId: [{ type: 'required', message: 'Workspace is required' }],
    },
  });

  const packageList = packages.data || [];
  useEffect(() => {
    if (!selectedPackageId && packageList[0]) {
      setSelectedPackageId(packageList[0].id);
    }
  }, [packageList, selectedPackageId]);

  const createTeam = useMutation({
    mutationFn: () => postJson<Team, TeamPayload>('/teams', teamForm.values),
    onSuccess: async (team) => {
      teamForm.resetForm();
      setSelectedTeamId(team.id);
      await queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  const teamList = teams.data || [];
  const selectedTeam = useMemo(
    () => teamList.find((team) => team.id === selectedTeamId) || teamList[0],
    [teamList, selectedTeamId]
  );

  useEffect(() => {
    if (!selectedTeamId && teamList[0]) {
      setSelectedTeamId(teamList[0].id);
    }
  }, [selectedTeamId, teamList]);

  const recommendations = useQuery({
    queryKey: ['packages', selectedPackageId, 'team-recommendations'],
    enabled: !!selectedPackageId,
    queryFn: () => getJson<TeamRecommendation[]>(`/packages/${selectedPackageId}/team-recommendations`),
  });
  const capabilities = useQuery({
    queryKey: ['teams', selectedTeam?.id, 'capabilities'],
    enabled: !!selectedTeam?.id,
    queryFn: () => getJson<TeamCapability[]>(`/teams/${selectedTeam?.id}/capabilities`),
  });
  const members = useQuery({
    queryKey: ['teams', selectedTeam?.id, 'members'],
    enabled: canManageTeamRoster && !!selectedTeam?.id,
    queryFn: () => getJson<TeamMember[]>(`/teams/${selectedTeam?.id}/members`),
  });
  const reputation = useQuery({
    queryKey: ['teams', selectedTeam?.id, 'reputation'],
    enabled: !!selectedTeam?.id,
    queryFn: () => getJson<TeamReputationEvent[]>(`/commerce/teams/${selectedTeam?.id}/reputation`),
  });
  const shortlists = useQuery({
    queryKey: ['shortlists', selectedPackageId],
    enabled: !!selectedPackageId,
    queryFn: () => getJson<TeamShortlist[]>(`/shortlists?packageId=${selectedPackageId}`),
    retry: false,
  });

  const createCapability = useMutation({
    mutationFn: () => postJson<TeamCapability, CapabilityPayload>(`/teams/${selectedTeam?.id}/capabilities`, capabilityForm.values),
    onSuccess: async () => {
      capabilityForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['teams', selectedTeam?.id, 'capabilities'] });
      await queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });
  const addMember = useMutation({
    mutationFn: () => postJson<TeamMember, TeamMemberPayload>(`/teams/${selectedTeam?.id}/members`, memberForm.values),
    onSuccess: async () => {
      memberForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['teams', selectedTeam?.id, 'members'] });
    },
  });
  const addReputation = useMutation({
    mutationFn: () => postJson<TeamReputationEvent, ReputationPayload>(`/commerce/teams/${selectedTeam?.id}/reputation`, reputationForm.values),
    onSuccess: async () => {
      reputationForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['teams', selectedTeam?.id, 'reputation'] });
    },
  });
  const upsertShortlist = useMutation({
    mutationFn: (payload: ShortlistPayload) => postJson<TeamShortlist, ShortlistPayload>('/shortlists', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['shortlists', selectedPackageId] });
    },
  });

  const submit = teamForm.handleSubmit(() => {
    createTeam.mutate();
  });
  const submitCapability = capabilityForm.handleSubmit(() => {
    if (selectedTeam?.id) {
      createCapability.mutate();
    }
  });
  const submitMember = memberForm.handleSubmit(() => {
    if (selectedTeam?.id) {
      addMember.mutate();
    }
  });
  const submitReputation = reputationForm.handleSubmit(() => {
    if (selectedTeam?.id) {
      addReputation.mutate();
    }
  });

  const matchedTeams = recommendations.data?.length
    ? recommendations.data
    : teamList.map((team) => ({ team, score: verificationScore(team) / 100, reasons: [team.capabilitiesSummary || team.description || 'Verified profile available'] }));
  const avgMatch = matchedTeams.length
    ? Math.round((matchedTeams.reduce((total, item) => total + item.score, 0) / matchedTeams.length) * 100)
    : 0;
  const activeShortlists = (shortlists.data || []).filter((shortlist) => shortlist.status !== 'ARCHIVED');
  const recordShortlist = (teamId: string, status: TeamShortlist['status']) => {
    if (!selectedPackageId) return;
    upsertShortlist.mutate({
      packageInstanceId: selectedPackageId,
      teamId,
      status,
      notes: status === 'COMPARED'
        ? 'Compared against this package requirements, team capabilities, delivery history, and expected budget.'
        : 'Shortlisted for owner review and proposal follow-up.',
    });
  };

  return (
    <>
      <PageHeader
        title="Matched Teams"
        description="Rank verified specialist teams against package needs, maintain capability evidence, and capture workspace-backed reputation."
      />
      <QueryState
        isLoading={teams.isLoading || packages.isLoading || categories.isLoading || modules.isLoading || workspaces.isLoading}
        error={teams.error || packages.error || categories.error || modules.error || workspaces.error || recommendations.error || capabilities.error || reputation.error || shortlists.error || (canManageTeamRoster ? members.error : null) || createTeam.error || createCapability.error || addMember.error || addReputation.error || upsertShortlist.error}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 330px' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          <Surface>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ md: 'center' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }}>
                <Typography color="text.secondary" sx={{ fontWeight: 800 }}>Top teams matched for</Typography>
                <TextField select size="small" value={selectedPackageId} onChange={(event) => setSelectedPackageId(event.target.value)} sx={{ minWidth: 280 }}>
                  {packageList.map((item) => (
                    <MenuItem key={item.id} value={item.id}>{item.productProfile?.name || item.name}</MenuItem>
                  ))}
                </TextField>
              </Stack>
              <PastelChip label="Adjust requirements" accent={appleColors.purple} />
            </Stack>
          </Surface>

          <Surface>
            <Stack spacing={0}>
              {matchedTeams.length ? (
                matchedTeams.slice(0, 6).map((recommendation, index) => {
                  const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
                  const score = Math.round(recommendation.score * 100);

                  return (
                    <Box
                      key={recommendation.team.id}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', lg: '70px 92px 1.4fr 1.6fr auto' },
                        gap: 1.5,
                        alignItems: 'center',
                        py: 2,
                        borderTop: index === 0 ? 0 : '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography sx={{ fontWeight: 900, color: 'text.secondary' }}>{index + 1}</Typography>
                      <ProgressRing value={score} size={72} color={score >= 90 ? appleColors.green : score >= 75 ? appleColors.purple : appleColors.amber} label="match" />
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 46, height: 46, borderRadius: 1, bgcolor: palette.bg, color: palette.accent, display: 'grid', placeItems: 'center', fontWeight: 900 }}>
                          {recommendation.team.name.charAt(0)}
                        </Box>
                        <Box>
                          <Typography variant="h4">{recommendation.team.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{recommendation.team.timezone || recommendation.team.typicalProjectSize}</Typography>
                          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                            <PastelChip label={formatLabel(recommendation.team.verificationStatus)} accent={palette.accent} bg={palette.bg} />
                            <PastelChip label={recommendation.team.typicalProjectSize || 'Available'} accent={appleColors.green} />
                          </Stack>
                        </Box>
                      </Stack>
                      <Box>
                        <Typography sx={{ fontWeight: 800, mb: 0.75 }}>Why this team?</Typography>
                        <Stack spacing={0.5}>
                          {recommendation.reasons.slice(0, 3).map((reason) => (
                            <DotLabel key={reason} label={reason} color={appleColors.green} />
                          ))}
                        </Stack>
                      </Box>
                      <Stack spacing={1}>
                        <Button
                          variant={activeShortlists.some((item) => item.team.id === recommendation.team.id && item.status === 'COMPARED') ? 'contained' : 'outlined'}
                          size="small"
                          startIcon={<TuneOutlined />}
                          onClick={() => recordShortlist(recommendation.team.id, 'COMPARED')}
                          disabled={!selectedPackageId || upsertShortlist.isPending}
                        >
                          Compare
                        </Button>
                        <Button
                          variant={activeShortlists.some((item) => item.team.id === recommendation.team.id) ? 'contained' : 'outlined'}
                          size="small"
                          startIcon={<BookmarkBorderOutlined />}
                          onClick={() => recordShortlist(recommendation.team.id, 'ACTIVE')}
                          disabled={!selectedPackageId || upsertShortlist.isPending}
                        >
                          Shortlist
                        </Button>
                        <Button variant="contained" size="small" onClick={() => setSelectedTeamId(recommendation.team.id)}>Inspect</Button>
                      </Stack>
                    </Box>
                  );
                })
              ) : (
                <EmptyState label="No teams have been added yet." />
              )}
            </Stack>
          </Surface>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '380px 1fr' }, gap: 2.5 }}>
            <Surface>
              <SectionTitle title="Create Team" action={<ManageAccountsOutlined sx={{ color: appleColors.purple }} />} />
              <Box component="form" onSubmit={submit}>
                <Stack spacing={1.5}>
                  <TextInput label="Team name" value={teamForm.values.name} onChange={(name) => teamForm.setValue('name', name)} />
                  <TextInput label="Description" value={teamForm.values.description} onChange={(description) => teamForm.setValue('description', description)} multiline />
                  <TextInput label="Location / timezone" value={teamForm.values.timezone} onChange={(timezone) => teamForm.setValue('timezone', timezone)} />
                  <TextInput label="Capabilities" value={teamForm.values.capabilitiesSummary} onChange={(capabilitiesSummary) => teamForm.setValue('capabilitiesSummary', capabilitiesSummary)} multiline />
                  <TextInput label="Typical project size" value={teamForm.values.typicalProjectSize} onChange={(typicalProjectSize) => teamForm.setValue('typicalProjectSize', typicalProjectSize)} />
                  <TextField select fullWidth label="Verification" value={teamForm.values.verificationStatus} onChange={(event) => teamForm.setValue('verificationStatus', event.target.value as Team['verificationStatus'])}>
                    {statuses.map((status) => (
                      <MenuItem key={status} value={status}>{formatLabel(status)}</MenuItem>
                    ))}
                  </TextField>
                  <SaveButton disabled={!teamForm.values.name || createTeam.isPending} label="Create team" />
                </Stack>
              </Box>
            </Surface>

            <Surface>
              <SectionTitle title={selectedTeam?.name || 'Team Profile'} action={selectedTeam && <StatusChip label={selectedTeam.verificationStatus} color="success" />} />
              {selectedTeam ? (
                <Stack spacing={2.5}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                    <ProgressRing value={verificationScore(selectedTeam)} size={88} color={appleColors.cyan} label="profile" />
                    <Box>
                      <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {selectedTeam.capabilitiesSummary || selectedTeam.description || 'No capabilities described yet.'}
                      </Typography>
                    </Box>
                  </Stack>

                  <Box component="form" onSubmit={submitCapability}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr auto' }, gap: 1 }}>
                      <TextField
                        select
                        size="small"
                        label="Category"
                        value={capabilityForm.values.serviceCategoryId}
                        onChange={(event) => {
                          capabilityForm.setValue('serviceCategoryId', event.target.value);
                          capabilityForm.setValue('serviceModuleId', null);
                        }}
                      >
                        {(categories.data || []).map((category) => (
                          <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                        ))}
                      </TextField>
                      <TextField select size="small" label="Module" value={capabilityForm.values.serviceModuleId || ''} onChange={(event) => capabilityForm.setValue('serviceModuleId', event.target.value || null)}>
                        <MenuItem value="">Category level</MenuItem>
                        {(modules.data || [])
                          .filter((module) => !capabilityForm.values.serviceCategoryId || module.category?.id === capabilityForm.values.serviceCategoryId)
                          .map((module) => (
                            <MenuItem key={module.id} value={module.id}>{module.name}</MenuItem>
                          ))}
                      </TextField>
                      <Button type="submit" variant="outlined" disabled={!capabilityForm.values.serviceCategoryId || createCapability.isPending}>Add</Button>
                    </Box>
                  </Box>

                  <Box>
                    <SectionTitle title="Verified Capabilities" />
                    {capabilities.data?.length ? (
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {capabilities.data.map((capability) => (
                          <PastelChip
                            key={capability.id}
                            label={capability.serviceModule?.name || capability.serviceCategory.name}
                            accent={appleColors.cyan}
                          />
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Add service capabilities so packages can recommend this team.</Typography>
                    )}
                  </Box>

                  {canManageTeamRoster && (
                    <Box>
                      <SectionTitle title="Members" />
                      <Box component="form" onSubmit={submitMember} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 190px auto' }, gap: 1, mb: 1.5 }}>
                        <TextField size="small" label="Email" value={memberForm.values.email} onChange={(event) => memberForm.setValue('email', event.target.value)} />
                        <TextField select size="small" label="Role" value={memberForm.values.role} onChange={(event) => memberForm.setValue('role', event.target.value as TeamMember['role'])}>
                          {memberRoles.map((role) => (
                            <MenuItem key={role} value={role}>{formatLabel(role)}</MenuItem>
                          ))}
                        </TextField>
                        <Button type="submit" variant="outlined" disabled={!memberForm.values.email || addMember.isPending}>Add</Button>
                      </Box>
                      <Stack spacing={1}>
                        {members.data?.map((member) => (
                          <Stack key={member.id} direction="row" justifyContent="space-between" sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                            <Typography variant="body2">{member.user.email}</Typography>
                            <Typography variant="body2" color="text.secondary">{formatLabel(member.role)}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  <Box>
                    <SectionTitle title="Reputation" />
                    {canCreateReputation && (
                      <Box component="form" onSubmit={submitReputation} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 110px 1fr auto' }, gap: 1, mb: 1.5 }}>
                        <TextField select size="small" label="Workspace" value={reputationForm.values.workspaceId} onChange={(event) => reputationForm.setValue('workspaceId', event.target.value)}>
                          {(workspaces.data || []).map((workspace) => (
                            <MenuItem key={workspace.id} value={workspace.id}>{workspace.name}</MenuItem>
                          ))}
                        </TextField>
                        <TextField size="small" type="number" label="Rating" value={reputationForm.values.rating} onChange={(event) => reputationForm.setValue('rating', Number(event.target.value))} inputProps={{ min: 1, max: 5 }} />
                        <TextField size="small" label="Notes" value={reputationForm.values.notes} onChange={(event) => reputationForm.setValue('notes', event.target.value)} />
                        <Button type="submit" variant="outlined" disabled={!reputationForm.values.workspaceId || addReputation.isPending}>Add</Button>
                      </Box>
                    )}
                    <Stack spacing={1}>
                      {reputation.data?.length ? (
                        reputation.data.map((event) => (
                          <Stack key={event.id} direction="row" justifyContent="space-between" sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                            <Typography variant="body2">{event.rating}/5 · {formatLabel(event.eventType)}</Typography>
                            <Typography variant="body2" color={event.verified ? 'success.main' : 'text.secondary'}>{event.verified ? 'Verified' : 'Unverified'}</Typography>
                          </Stack>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">Reputation events appear after workspace-backed owner reviews.</Typography>
                      )}
                    </Stack>
                  </Box>
                </Stack>
              ) : (
                <EmptyState label="Create or select a team to manage capabilities." />
              )}
            </Surface>
          </Box>
        </Stack>

        <Stack spacing={2.5}>
          <Surface>
            <SectionTitle title="Your Shortlist" action={<VerifiedOutlined sx={{ color: appleColors.purple }} />} />
            <Stack spacing={1.5}>
              {(activeShortlists.length
                ? activeShortlists.map((shortlist) => ({
                    team: shortlist.team,
                    score: matchedTeams.find((match) => match.team.id === shortlist.team.id)?.score || 0.82,
                    status: shortlist.status,
                  }))
                : matchedTeams.slice(0, 3).map((item) => ({ team: item.team, score: item.score, status: 'SUGGESTED' }))
              ).slice(0, 4).map((item, index) => {
                const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
                return (
                  <Stack key={item.team.id} direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Typography sx={{ fontWeight: 900 }}>{index + 1}</Typography>
                      <Box sx={{ width: 34, height: 34, borderRadius: 1, bgcolor: `${palette.accent}14`, color: palette.accent, display: 'grid', placeItems: 'center', fontWeight: 900 }}>
                        {item.team.name.charAt(0)}
                      </Box>
                      <Typography sx={{ fontWeight: 800 }}>{item.team.name}</Typography>
                    </Stack>
                    <Stack alignItems="flex-end" spacing={0.25}>
                      <Typography color="success.main" sx={{ fontWeight: 800 }}>{Math.round(item.score * 100)}%</Typography>
                      <Typography variant="caption" color="text.secondary">{formatLabel(item.status)}</Typography>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          </Surface>

          <Surface>
            <SectionTitle title="Match Summary" />
            <Stack direction="row" spacing={2} alignItems="center">
              <ProgressRing value={avgMatch} size={92} color={appleColors.purple} label="avg" />
              <Box>
                <Typography variant="h4">Average Match</Typography>
                <Typography color="text.secondary">Top teams average</Typography>
              </Box>
            </Stack>
            <Stack spacing={1} sx={{ mt: 2 }}>
              <DotLabel label="Excellent (90%+)" color={appleColors.green} />
              <DotLabel label="Great (80-89%)" color={appleColors.purple} />
              <DotLabel label="Fair (60-79%)" color={appleColors.amber} />
            </Stack>
          </Surface>

          <Surface sx={{ background: '#f4fdfe' }}>
            <SectionTitle title="How We Match" />
            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
              Matching combines package modules, catalog categories, verification status, capability evidence, and workspace reputation.
            </Typography>
          </Surface>
        </Stack>
      </Box>
    </>
  );
}
