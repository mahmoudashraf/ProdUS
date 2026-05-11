'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson, postJson } from './api';
import { EmptyState, PageHeader, QueryState, SaveButton, StatusChip, Surface, TextInput } from './PlatformComponents';
import { ProjectWorkspace, ServiceCategory, ServiceModule, Team, TeamCapability, TeamMember, TeamReputationEvent } from './types';

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

export default function TeamsPage() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canManageTeamRoster = hasRole([UserRole.ADMIN, UserRole.TEAM_MANAGER]);
  const canCreateReputation = hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER]);
  const teams = useQuery({ queryKey: ['teams'], queryFn: () => getJson<Team[]>('/teams') });
  const categories = useQuery({ queryKey: ['catalog-categories'], queryFn: () => getJson<ServiceCategory[]>('/catalog/categories') });
  const modules = useQuery({ queryKey: ['catalog-modules'], queryFn: () => getJson<ServiceModule[]>('/catalog/modules') });
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: () => getJson<ProjectWorkspace[]>('/workspaces') });
  const [selectedTeamId, setSelectedTeamId] = useState('');
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

  return (
    <>
      <PageHeader title="Teams" description="Represent independent productization teams and their verified capability areas." />
      <QueryState
        isLoading={teams.isLoading || categories.isLoading || modules.isLoading || workspaces.isLoading}
        error={teams.error || categories.error || modules.error || workspaces.error || capabilities.error || reputation.error || (canManageTeamRoster ? members.error : null) || createTeam.error || createCapability.error || addMember.error || addReputation.error}
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '380px 1fr' }, gap: 2 }}>
        <Stack spacing={1.5}>
          <Surface>
            <Box component="form" onSubmit={submit}>
              <Stack spacing={2}>
                <TextInput label="Team name" value={teamForm.values.name} onChange={(name) => teamForm.setValue('name', name)} />
                <TextInput label="Description" value={teamForm.values.description} onChange={(description) => teamForm.setValue('description', description)} multiline />
                <TextInput label="Timezone" value={teamForm.values.timezone} onChange={(timezone) => teamForm.setValue('timezone', timezone)} />
                <TextInput label="Capabilities" value={teamForm.values.capabilitiesSummary} onChange={(capabilitiesSummary) => teamForm.setValue('capabilitiesSummary', capabilitiesSummary)} multiline />
                <TextInput label="Typical project size" value={teamForm.values.typicalProjectSize} onChange={(typicalProjectSize) => teamForm.setValue('typicalProjectSize', typicalProjectSize)} />
                <TextField
                  select
                  fullWidth
                  label="Verification"
                  value={teamForm.values.verificationStatus}
                  onChange={(event) => teamForm.setValue('verificationStatus', event.target.value as Team['verificationStatus'])}
                >
                  {statuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.replaceAll('_', ' ').toLowerCase()}
                    </MenuItem>
                  ))}
                </TextField>
                <SaveButton disabled={!teamForm.values.name || createTeam.isPending} label="Create team" />
              </Stack>
            </Box>
          </Surface>
          {teamList.length ? (
            <Surface>
              <Stack spacing={1}>
                {teamList.map((team) => (
                  <Button
                    key={team.id}
                    variant={selectedTeam?.id === team.id ? 'contained' : 'outlined'}
                    color={selectedTeam?.id === team.id ? 'primary' : 'inherit'}
                    onClick={() => setSelectedTeamId(team.id)}
                    sx={{ justifyContent: 'space-between', textAlign: 'left' }}
                  >
                    <span>{team.name}</span>
                    <span>{team.verificationStatus.replaceAll('_', ' ').toLowerCase()}</span>
                  </Button>
                ))}
              </Stack>
            </Surface>
          ) : (
            <EmptyState label="No teams have been added yet." />
          )}
        </Stack>
        <Surface>
          {selectedTeam ? (
            <Stack spacing={2.5}>
              <Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                  <Typography variant="h3">{selectedTeam.name}</Typography>
                  <StatusChip label={selectedTeam.verificationStatus} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {selectedTeam.capabilitiesSummary || selectedTeam.description || 'No capabilities described yet.'}
                </Typography>
              </Box>
              <Box component="form" onSubmit={submitCapability}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  <TextField
                    select
                    fullWidth
                    label="Category"
                    value={capabilityForm.values.serviceCategoryId}
                    onChange={(event) => {
                      capabilityForm.setValue('serviceCategoryId', event.target.value);
                      capabilityForm.setValue('serviceModuleId', null);
                    }}
                  >
                    {(categories.data || []).map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    fullWidth
                    label="Module"
                    value={capabilityForm.values.serviceModuleId || ''}
                    onChange={(event) => capabilityForm.setValue('serviceModuleId', event.target.value || null)}
                  >
                    <MenuItem value="">Category level</MenuItem>
                    {(modules.data || [])
                      .filter((module) => !capabilityForm.values.serviceCategoryId || module.category?.id === capabilityForm.values.serviceCategoryId)
                      .map((module) => (
                        <MenuItem key={module.id} value={module.id}>
                          {module.name}
                        </MenuItem>
                      ))}
                  </TextField>
                  <Button type="submit" variant="outlined" disabled={!capabilityForm.values.serviceCategoryId || createCapability.isPending}>
                    Add
                  </Button>
                </Stack>
              </Box>
              <Stack spacing={1.5}>
                {canManageTeamRoster && (
                <Box>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
                    <Typography variant="h4">Members</Typography>
                    <Box component="form" onSubmit={submitMember} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <TextField
                        size="small"
                        label="Email"
                        value={memberForm.values.email}
                        onChange={(event) => memberForm.setValue('email', event.target.value)}
                      />
                      <TextField
                        select
                        size="small"
                        label="Role"
                        value={memberForm.values.role}
                        onChange={(event) => memberForm.setValue('role', event.target.value as TeamMember['role'])}
                        sx={{ minWidth: 180 }}
                      >
                        {memberRoles.map((role) => (
                          <MenuItem key={role} value={role}>
                            {role.replaceAll('_', ' ').toLowerCase()}
                          </MenuItem>
                        ))}
                      </TextField>
                      <Button type="submit" variant="outlined" disabled={!memberForm.values.email || addMember.isPending}>
                        Add
                      </Button>
                    </Box>
                  </Stack>
                  <Stack spacing={1} sx={{ mt: 1.5 }}>
                    {members.data?.length ? (
                      members.data.map((member) => (
                        <Stack
                          key={member.id}
                          direction={{ xs: 'column', md: 'row' }}
                          spacing={1}
                          justifyContent="space-between"
                          sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}
                        >
                          <Typography variant="body2">{member.user.email}</Typography>
                          <Typography variant="body2" color={member.active ? 'text.secondary' : 'error.main'}>
                            {member.active ? member.role.replaceAll('_', ' ').toLowerCase() : 'inactive'}
                          </Typography>
                        </Stack>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Add specialists and advisors so this team can be staffed into workspaces.
                      </Typography>
                    )}
                  </Stack>
                </Box>
                )}
                <Box>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
                    <Typography variant="h4">Reputation</Typography>
                    {canCreateReputation && (
                      <Box component="form" onSubmit={submitReputation} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <TextField
                          select
                          size="small"
                          label="Workspace"
                          value={reputationForm.values.workspaceId}
                          onChange={(event) => reputationForm.setValue('workspaceId', event.target.value)}
                          sx={{ minWidth: 210 }}
                        >
                          {(workspaces.data || []).map((workspace) => (
                            <MenuItem key={workspace.id} value={workspace.id}>
                              {workspace.name}
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          size="small"
                          type="number"
                          label="Rating"
                          value={reputationForm.values.rating}
                          onChange={(event) => reputationForm.setValue('rating', Number(event.target.value))}
                          inputProps={{ min: 1, max: 5 }}
                          sx={{ width: 110 }}
                        />
                        <TextField
                          size="small"
                          label="Notes"
                          value={reputationForm.values.notes}
                          onChange={(event) => reputationForm.setValue('notes', event.target.value)}
                        />
                        <Button type="submit" variant="outlined" disabled={!reputationForm.values.workspaceId || addReputation.isPending}>
                          Add
                        </Button>
                      </Box>
                    )}
                  </Stack>
                  <Stack spacing={1} sx={{ mt: 1.5 }}>
                    {reputation.data?.length ? (
                      reputation.data.map((event) => (
                        <Box key={event.id} sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}>
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                            <Typography variant="body2">
                              {event.rating}/5 · {event.eventType.replaceAll('_', ' ').toLowerCase()}
                            </Typography>
                            <Typography variant="caption" color={event.verified ? 'success.main' : 'text.secondary'}>
                              {event.verified ? 'verified' : 'unverified'}
                            </Typography>
                          </Stack>
                          {event.notes && (
                            <Typography variant="caption" color="text.secondary">
                              {event.notes}
                            </Typography>
                          )}
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Reputation events appear after workspace-backed owner reviews.
                      </Typography>
                    )}
                  </Stack>
                </Box>
                {capabilities.data?.length ? (
                  capabilities.data.map((capability) => (
                    <Box key={capability.id} sx={{ borderTop: 1, borderColor: 'divider', pt: 1.5 }}>
                      <Typography variant="subtitle1">
                        {capability.serviceModule?.name || capability.serviceCategory.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {capability.notes || capability.evidenceUrl || 'Verified capability coverage.'}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Add service capabilities so packages can recommend this team.
                  </Typography>
                )}
              </Stack>
            </Stack>
          ) : (
            <Typography color="text.secondary">Create or select a team to manage capabilities.</Typography>
          )}
        </Surface>
      </Box>
    </>
  );
}
