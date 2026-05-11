'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Button, LinearProgress, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson, postJson, putJson } from './api';
import { EmptyState, PageHeader, QueryState, StatusChip, Surface } from './PlatformComponents';
import { Deliverable, DisputeCase, Milestone, PackageInstance, ProjectWorkspace, SupportSubscription, Team, WorkspaceParticipant } from './types';

const participantRoles: WorkspaceParticipant['role'][] = ['COORDINATOR', 'TEAM_LEAD', 'SPECIALIST', 'ADVISOR', 'VIEWER'];
const disputeSeverities: DisputeCase['severity'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const disputeStatuses: DisputeCase['status'][] = ['OPEN', 'UNDER_REVIEW', 'OWNER_RESPONSE_NEEDED', 'TEAM_RESPONSE_NEEDED', 'RESOLVED', 'CANCELLED'];

interface WorkspacePayload {
  packageInstanceId: string;
  name: string;
  status: ProjectWorkspace['status'];
}

interface MilestonePayload {
  title: string;
  description: string;
  dueDate: string | null;
  status: Milestone['status'];
}

interface DeliverablePayload {
  title: string;
  evidence: string;
  status: Deliverable['status'];
}

interface WorkspaceParticipantPayload {
  email: string;
  role: WorkspaceParticipant['role'];
  active: boolean;
}

interface SupportSubscriptionPayload {
  teamId: string;
  planName: string;
  sla: string;
  monthlyAmountCents: number;
  currency: string;
  startsOn: string | null;
  renewsOn: string | null;
  status: SupportSubscription['status'];
}

interface DisputePayload {
  teamId: string | null;
  title: string;
  description: string;
  severity: DisputeCase['severity'];
  responseDueOn: string | null;
}

interface DisputeStatusPayload {
  status: DisputeCase['status'];
  resolution: string;
}

const initialWorkspaceValues: WorkspacePayload = {
  packageInstanceId: '',
  name: '',
  status: 'DRAFT_PACKAGE',
};

const initialMilestoneValues: MilestonePayload = {
  title: '',
  description: '',
  dueDate: null,
  status: 'PLANNED',
};

const initialDeliverableValues: DeliverablePayload = {
  title: '',
  evidence: '',
  status: 'PENDING',
};

const initialParticipantValues: WorkspaceParticipantPayload = {
  email: '',
  role: 'SPECIALIST',
  active: true,
};

const initialSupportValues: SupportSubscriptionPayload = {
  teamId: '',
  planName: '',
  sla: '',
  monthlyAmountCents: 0,
  currency: 'USD',
  startsOn: null,
  renewsOn: null,
  status: 'PROPOSED',
};

const initialDisputeValues: DisputePayload = {
  teamId: null,
  title: '',
  description: '',
  severity: 'MEDIUM',
  responseDueOn: null,
};

const formatMoney = (amountCents: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format((amountCents || 0) / 100);

export default function WorkspacesPage() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canInviteParticipants = hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER, UserRole.TEAM_MANAGER]);
  const canManageSupport = hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER, UserRole.TEAM_MANAGER]);
  const canManageDisputes = hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER, UserRole.TEAM_MANAGER]);
  const packages = useQuery({ queryKey: ['packages'], queryFn: () => getJson<PackageInstance[]>('/packages') });
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: () => getJson<ProjectWorkspace[]>('/workspaces') });
  const teams = useQuery({ queryKey: ['teams'], queryFn: () => getJson<Team[]>('/teams') });
  const supportSubscriptions = useQuery({
    queryKey: ['commerce-support-subscriptions'],
    queryFn: () => getJson<SupportSubscription[]>('/commerce/support-subscriptions'),
  });
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [disputeStatusById, setDisputeStatusById] = useState<Record<string, DisputeCase['status']>>({});
  const [disputeResolutionById, setDisputeResolutionById] = useState<Record<string, string>>({});

  const workspaceForm = useAdvancedForm<WorkspacePayload>({
    initialValues: initialWorkspaceValues,
    validationRules: {
      packageInstanceId: [{ type: 'required', message: 'Package is required' }],
    },
  });
  const milestoneForm = useAdvancedForm<MilestonePayload>({
    initialValues: initialMilestoneValues,
    validationRules: {
      title: [{ type: 'required', message: 'Milestone title is required' }],
    },
  });
  const deliverableForm = useAdvancedForm<DeliverablePayload>({
    initialValues: initialDeliverableValues,
    validationRules: {
      title: [{ type: 'required', message: 'Deliverable title is required' }],
    },
  });
  const participantForm = useAdvancedForm<WorkspaceParticipantPayload>({
    initialValues: initialParticipantValues,
    validationRules: {
      email: [
        { type: 'required', message: 'Participant email is required' },
        { type: 'email', message: 'Use a valid email address' },
      ],
    },
  });
  const supportForm = useAdvancedForm<SupportSubscriptionPayload>({
    initialValues: initialSupportValues,
    validationRules: {
      teamId: [{ type: 'required', message: 'Team is required' }],
      planName: [{ type: 'required', message: 'Plan name is required' }],
    },
  });
  const disputeForm = useAdvancedForm<DisputePayload>({
    initialValues: initialDisputeValues,
    validationRules: {
      title: [{ type: 'required', message: 'Dispute title is required' }],
      description: [{ type: 'required', message: 'Dispute context is required' }],
    },
  });

  const createWorkspace = useMutation({
    mutationFn: () => postJson<ProjectWorkspace, WorkspacePayload>('/workspaces', workspaceForm.values),
    onSuccess: async (workspace) => {
      workspaceForm.resetForm();
      setSelectedWorkspaceId(workspace.id);
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const workspaceList = workspaces.data || [];
  const selectedWorkspace = useMemo(
    () => workspaceList.find((workspace) => workspace.id === selectedWorkspaceId) || workspaceList[0],
    [workspaceList, selectedWorkspaceId]
  );

  useEffect(() => {
    if (!selectedWorkspaceId && workspaceList[0]) {
      setSelectedWorkspaceId(workspaceList[0].id);
    }
  }, [selectedWorkspaceId, workspaceList]);

  const milestones = useQuery({
    queryKey: ['workspaces', selectedWorkspace?.id, 'milestones'],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<Milestone[]>(`/workspaces/${selectedWorkspace?.id}/milestones`),
  });

  const milestoneList = milestones.data || [];
  const selectedMilestone = useMemo(
    () => milestoneList.find((milestone) => milestone.id === selectedMilestoneId) || milestoneList[0],
    [milestoneList, selectedMilestoneId]
  );

  useEffect(() => {
    if (!selectedMilestoneId && milestoneList[0]) {
      setSelectedMilestoneId(milestoneList[0].id);
    }
  }, [selectedMilestoneId, milestoneList]);

  const deliverables = useQuery({
    queryKey: ['workspaces', 'milestones', selectedMilestone?.id, 'deliverables'],
    enabled: !!selectedMilestone?.id,
    queryFn: () => getJson<Deliverable[]>(`/workspaces/milestones/${selectedMilestone?.id}/deliverables`),
  });
  const participants = useQuery({
    queryKey: ['workspaces', selectedWorkspace?.id, 'participants'],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<WorkspaceParticipant[]>(`/workspaces/${selectedWorkspace?.id}/participants`),
  });
  const disputes = useQuery({
    queryKey: ['commerce-disputes', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<DisputeCase[]>(`/commerce/workspaces/${selectedWorkspace?.id}/disputes`),
  });
  const selectedSupportSubscriptions = (supportSubscriptions.data || []).filter(
    (subscription) => subscription.workspace?.id === selectedWorkspace?.id
  );

  const createMilestone = useMutation({
    mutationFn: () => postJson<Milestone, MilestonePayload>(`/workspaces/${selectedWorkspace?.id}/milestones`, milestoneForm.values),
    onSuccess: async (milestone) => {
      milestoneForm.resetForm();
      setSelectedMilestoneId(milestone.id);
      await queryClient.invalidateQueries({ queryKey: ['workspaces', selectedWorkspace?.id, 'milestones'] });
    },
  });

  const createDeliverable = useMutation({
    mutationFn: () => postJson<Deliverable, DeliverablePayload>(`/workspaces/milestones/${selectedMilestone?.id}/deliverables`, deliverableForm.values),
    onSuccess: async () => {
      deliverableForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['workspaces', 'milestones', selectedMilestone?.id, 'deliverables'] });
    },
  });
  const addParticipant = useMutation({
    mutationFn: () => postJson<WorkspaceParticipant, WorkspaceParticipantPayload>(`/workspaces/${selectedWorkspace?.id}/participants`, participantForm.values),
    onSuccess: async () => {
      participantForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['workspaces', selectedWorkspace?.id, 'participants'] });
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
  const createSupportSubscription = useMutation({
    mutationFn: () => postJson<SupportSubscription, SupportSubscriptionPayload>(`/commerce/workspaces/${selectedWorkspace?.id}/support-subscriptions`, supportForm.values),
    onSuccess: async () => {
      supportForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['commerce-support-subscriptions'] });
    },
  });
  const createDispute = useMutation({
    mutationFn: () => postJson<DisputeCase, DisputePayload>(`/commerce/workspaces/${selectedWorkspace?.id}/disputes`, disputeForm.values),
    onSuccess: async () => {
      disputeForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['commerce-disputes', selectedWorkspace?.id] });
    },
  });
  const updateDisputeStatus = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DisputeStatusPayload }) => putJson<DisputeCase, DisputeStatusPayload>(`/commerce/disputes/${id}/status`, payload),
    onSuccess: async (dispute) => {
      setDisputeStatusById((current) => ({ ...current, [dispute.id]: dispute.status }));
      setDisputeResolutionById((current) => ({ ...current, [dispute.id]: dispute.resolution || '' }));
      await queryClient.invalidateQueries({ queryKey: ['commerce-disputes', selectedWorkspace?.id] });
    },
  });

  const submit = workspaceForm.handleSubmit(() => {
    createWorkspace.mutate();
  });
  const submitMilestone = milestoneForm.handleSubmit(() => {
    if (selectedWorkspace?.id) {
      createMilestone.mutate();
    }
  });
  const submitDeliverable = deliverableForm.handleSubmit(() => {
    if (selectedMilestone?.id) {
      createDeliverable.mutate();
    }
  });
  const submitParticipant = participantForm.handleSubmit(() => {
    if (selectedWorkspace?.id) {
      addParticipant.mutate();
    }
  });
  const submitSupport = supportForm.handleSubmit(() => {
    if (selectedWorkspace?.id) {
      createSupportSubscription.mutate();
    }
  });
  const submitDispute = disputeForm.handleSubmit(() => {
    if (selectedWorkspace?.id) {
      createDispute.mutate();
    }
  });
  const submitDisputeStatus = (dispute: DisputeCase) => {
    updateDisputeStatus.mutate({
      id: dispute.id,
      payload: {
        status: disputeStatusById[dispute.id] || dispute.status,
        resolution: disputeResolutionById[dispute.id] || dispute.resolution || '',
      },
    });
  };

  return (
    <>
      <PageHeader title="Workspaces" description="Coordinate package execution through milestones, deliverables, decisions, and handoff." />
      <QueryState
        isLoading={packages.isLoading || workspaces.isLoading || teams.isLoading || supportSubscriptions.isLoading || disputes.isLoading}
        error={packages.error || workspaces.error || teams.error || supportSubscriptions.error || milestones.error || deliverables.error || participants.error || disputes.error || createWorkspace.error || createMilestone.error || createDeliverable.error || addParticipant.error || createSupportSubscription.error || createDispute.error || updateDisputeStatus.error}
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '380px 1fr' }, gap: 2 }}>
        <Stack spacing={1.5}>
          <Surface>
            <Box component="form" onSubmit={submit}>
              <Stack spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="Package"
                  value={workspaceForm.values.packageInstanceId}
                  onChange={(event) => workspaceForm.setValue('packageInstanceId', event.target.value)}
                >
                  {(packages.data || []).map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  label="Workspace name"
                  value={workspaceForm.values.name}
                  onChange={(event) => workspaceForm.setValue('name', event.target.value)}
                />
                <Button type="submit" variant="contained" disabled={!workspaceForm.values.packageInstanceId || createWorkspace.isPending}>
                  Open workspace
                </Button>
              </Stack>
            </Box>
          </Surface>
          {workspaceList.length ? (
            <Surface>
              <Stack spacing={1}>
                {workspaceList.map((workspace) => (
                  <Button
                    key={workspace.id}
                    variant={selectedWorkspace?.id === workspace.id ? 'contained' : 'outlined'}
                    color={selectedWorkspace?.id === workspace.id ? 'primary' : 'inherit'}
                    onClick={() => {
                      setSelectedWorkspaceId(workspace.id);
                      setSelectedMilestoneId('');
                    }}
                    sx={{ justifyContent: 'space-between', textAlign: 'left' }}
                  >
                    <span>{workspace.name}</span>
                    <span>{workspace.status.replaceAll('_', ' ').toLowerCase()}</span>
                  </Button>
                ))}
              </Stack>
            </Surface>
          ) : (
            <EmptyState label="No workspaces have been opened yet." />
          )}
        </Stack>
        <Surface>
          {selectedWorkspace ? (
            <Stack spacing={2.5}>
              <Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                  <Typography variant="h3">{selectedWorkspace.name}</Typography>
                  <StatusChip label={selectedWorkspace.status} />
                </Stack>
              </Box>
              {(milestones.isFetching || deliverables.isFetching || disputes.isFetching) && <LinearProgress />}
              <Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
                  <Typography variant="h4">Participants</Typography>
                  {canInviteParticipants && (
                    <Box component="form" onSubmit={submitParticipant} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <TextField
                        size="small"
                        label="Email"
                        value={participantForm.values.email}
                        onChange={(event) => participantForm.setValue('email', event.target.value)}
                      />
                      <TextField
                        select
                        size="small"
                        label="Role"
                        value={participantForm.values.role}
                        onChange={(event) => participantForm.setValue('role', event.target.value as WorkspaceParticipant['role'])}
                        sx={{ minWidth: 170 }}
                      >
                        {participantRoles.map((role) => (
                          <MenuItem key={role} value={role}>
                            {role.replaceAll('_', ' ').toLowerCase()}
                          </MenuItem>
                        ))}
                      </TextField>
                      <Button type="submit" variant="outlined" disabled={!participantForm.values.email || addParticipant.isPending}>
                        Add
                      </Button>
                    </Box>
                  )}
                </Stack>
                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  {participants.data?.length ? (
                    participants.data.map((participant) => (
                      <Stack
                        key={participant.id}
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={1}
                        justifyContent="space-between"
                        sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}
                      >
                        <Typography variant="body2">{participant.user.email}</Typography>
                        <Typography variant="body2" color={participant.active ? 'text.secondary' : 'error.main'}>
                          {participant.active ? participant.role.replaceAll('_', ' ').toLowerCase() : 'inactive'}
                        </Typography>
                      </Stack>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Add delivery specialists, team leads, and advisors before execution starts.
                    </Typography>
                  )}
                </Stack>
              </Box>
              <Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
                  <Typography variant="h4">Support</Typography>
                  {canManageSupport && (
                    <Box component="form" onSubmit={submitSupport} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <TextField
                        select
                        size="small"
                        label="Team"
                        value={supportForm.values.teamId}
                        onChange={(event) => supportForm.setValue('teamId', event.target.value)}
                        sx={{ minWidth: 180 }}
                      >
                        {(teams.data || []).map((team) => (
                          <MenuItem key={team.id} value={team.id}>
                            {team.name}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        size="small"
                        label="Plan"
                        value={supportForm.values.planName}
                        onChange={(event) => supportForm.setValue('planName', event.target.value)}
                      />
                      <TextField
                        size="small"
                        type="number"
                        label="Monthly cents"
                        value={supportForm.values.monthlyAmountCents}
                        onChange={(event) => supportForm.setValue('monthlyAmountCents', Number(event.target.value))}
                        sx={{ width: 150 }}
                      />
                      <Button type="submit" variant="outlined" disabled={!supportForm.values.teamId || !supportForm.values.planName || createSupportSubscription.isPending}>
                        Add
                      </Button>
                    </Box>
                  )}
                </Stack>
                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  {selectedSupportSubscriptions.length ? (
                    selectedSupportSubscriptions.map((subscription) => (
                      <Stack
                        key={subscription.id}
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={1}
                        justifyContent="space-between"
                        sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}
                      >
                        <Box>
                          <Typography variant="body2">{subscription.planName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {subscription.team.name} · {formatMoney(subscription.monthlyAmountCents, subscription.currency)}
                          </Typography>
                        </Box>
                        <StatusChip label={subscription.status} />
                      </Stack>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Add a support subscription when the workspace moves into handoff or ongoing operations.
                    </Typography>
                  )}
                </Stack>
              </Box>
              <Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
                  <Typography variant="h4">Disputes</Typography>
                  {canManageDisputes && (
                    <Box component="form" onSubmit={submitDispute} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <TextField
                        select
                        size="small"
                        label="Team"
                        value={disputeForm.values.teamId || ''}
                        onChange={(event) => disputeForm.setValue('teamId', event.target.value || null)}
                        sx={{ minWidth: 180 }}
                      >
                        <MenuItem value="">Unassigned</MenuItem>
                        {(teams.data || []).map((team) => (
                          <MenuItem key={team.id} value={team.id}>
                            {team.name}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        size="small"
                        label="Title"
                        value={disputeForm.values.title}
                        onChange={(event) => disputeForm.setValue('title', event.target.value)}
                      />
                      <TextField
                        select
                        size="small"
                        label="Severity"
                        value={disputeForm.values.severity}
                        onChange={(event) => disputeForm.setValue('severity', event.target.value as DisputeCase['severity'])}
                        sx={{ minWidth: 140 }}
                      >
                        {disputeSeverities.map((severity) => (
                          <MenuItem key={severity} value={severity}>
                            {severity.toLowerCase()}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        size="small"
                        type="date"
                        label="Response due"
                        value={disputeForm.values.responseDueOn || ''}
                        onChange={(event) => disputeForm.setValue('responseDueOn', event.target.value || null)}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        size="small"
                        label="Context"
                        value={disputeForm.values.description}
                        onChange={(event) => disputeForm.setValue('description', event.target.value)}
                        sx={{ minWidth: { xs: '100%', sm: 260 } }}
                      />
                      <Button type="submit" variant="outlined" disabled={!disputeForm.values.title || !disputeForm.values.description || createDispute.isPending}>
                        Open
                      </Button>
                    </Box>
                  )}
                </Stack>
                <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                  {disputes.data?.length ? (
                    disputes.data.map((dispute) => (
                      <Box key={dispute.id} sx={{ borderTop: 1, borderColor: 'divider', pt: 1.5 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                          <Box>
                            <Typography variant="subtitle1">{dispute.title}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {dispute.team?.name || 'Unassigned'} · {dispute.severity.toLowerCase()}
                              {dispute.responseDueOn ? ` · due ${dispute.responseDueOn}` : ''}
                            </Typography>
                          </Box>
                          <StatusChip label={dispute.status} />
                        </Stack>
                        {dispute.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                            {dispute.description}
                          </Typography>
                        )}
                        {canManageDisputes && (
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 1 }}>
                            <TextField
                              select
                              size="small"
                              label="Status"
                              value={disputeStatusById[dispute.id] || dispute.status}
                              onChange={(event) =>
                                setDisputeStatusById((current) => ({ ...current, [dispute.id]: event.target.value as DisputeCase['status'] }))
                              }
                              sx={{ minWidth: 210 }}
                            >
                              {disputeStatuses.map((statusOption) => (
                                <MenuItem key={statusOption} value={statusOption}>
                                  {statusOption.replaceAll('_', ' ').toLowerCase()}
                                </MenuItem>
                              ))}
                            </TextField>
                            <TextField
                              size="small"
                              label="Resolution note"
                              value={disputeResolutionById[dispute.id] ?? dispute.resolution ?? ''}
                              onChange={(event) =>
                                setDisputeResolutionById((current) => ({ ...current, [dispute.id]: event.target.value }))
                              }
                              sx={{ minWidth: { xs: '100%', md: 320 } }}
                            />
                            <Button
                              variant="outlined"
                              onClick={() => submitDisputeStatus(dispute)}
                              disabled={updateDisputeStatus.isPending}
                            >
                              Update
                            </Button>
                          </Stack>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No disputes are open for this workspace.
                    </Typography>
                  )}
                </Stack>
              </Box>
              <Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
                  <Typography variant="h4">Milestones</Typography>
                  <Box component="form" onSubmit={submitMilestone} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <TextField
                      size="small"
                      label="Milestone"
                      value={milestoneForm.values.title}
                      onChange={(event) => milestoneForm.setValue('title', event.target.value)}
                    />
                    <TextField
                      size="small"
                      type="date"
                      label="Due"
                      value={milestoneForm.values.dueDate || ''}
                      onChange={(event) => milestoneForm.setValue('dueDate', event.target.value || null)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <Button type="submit" variant="outlined" disabled={!milestoneForm.values.title || createMilestone.isPending}>
                      Add
                    </Button>
                  </Box>
                </Stack>
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  {milestoneList.length ? (
                    milestoneList.map((milestone) => (
                      <Box key={milestone.id} sx={{ borderTop: 1, borderColor: 'divider', pt: 1.5 }}>
                        <Button
                          fullWidth
                          variant={selectedMilestone?.id === milestone.id ? 'contained' : 'text'}
                          onClick={() => setSelectedMilestoneId(milestone.id)}
                          sx={{ justifyContent: 'space-between', textAlign: 'left' }}
                        >
                          <span>{milestone.title}</span>
                          <span>{milestone.status.replaceAll('_', ' ').toLowerCase()}</span>
                        </Button>
                        {milestone.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                            {milestone.description}
                          </Typography>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No milestones yet.
                    </Typography>
                  )}
                </Stack>
              </Box>
              <Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
                  <Typography variant="h4">Deliverables</Typography>
                  <Box component="form" onSubmit={submitDeliverable} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <TextField
                      size="small"
                      label="Deliverable"
                      value={deliverableForm.values.title}
                      onChange={(event) => deliverableForm.setValue('title', event.target.value)}
                    />
                    <Button type="submit" variant="outlined" disabled={!selectedMilestone?.id || !deliverableForm.values.title || createDeliverable.isPending}>
                      Add
                    </Button>
                  </Box>
                </Stack>
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  {deliverables.data?.length ? (
                    deliverables.data.map((deliverable) => (
                      <Box key={deliverable.id} sx={{ borderTop: 1, borderColor: 'divider', pt: 1.5 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                          <Typography variant="subtitle1">{deliverable.title}</Typography>
                          <StatusChip label={deliverable.status} />
                        </Stack>
                        {deliverable.evidence && (
                          <Typography variant="body2" color="text.secondary">
                            {deliverable.evidence}
                          </Typography>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Select a milestone and add deliverables as evidence appears.
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Stack>
          ) : (
            <Typography color="text.secondary">Open a workspace to coordinate milestones and deliverables.</Typography>
          )}
        </Surface>
      </Box>
    </>
  );
}
