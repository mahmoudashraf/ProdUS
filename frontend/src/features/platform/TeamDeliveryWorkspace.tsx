'use client';

import { useMemo, useState } from 'react';
import {
  AssignmentTurnedInOutlined,
  CheckCircleOutlineOutlined,
  EngineeringOutlined,
  GroupsOutlined,
  StarOutlineOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { Box, Button, LinearProgress, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson, postJson } from './api';
import {
  DotLabel,
  EmptyState,
  MetricTile,
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
  clampScore,
  formatLabel,
} from './PlatformComponents';
import {
  Milestone,
  ProjectWorkspace,
  QuoteProposal,
  SupportRequest,
  Team,
  TeamCapability,
  TeamMember,
  TeamReputationEvent,
} from './types';

interface TeamMemberPayload {
  email: string;
  role: TeamMember['role'];
  active: boolean;
}

const memberRoles: TeamMember['role'][] = ['LEAD', 'DELIVERY_MANAGER', 'SPECIALIST', 'ADVISOR', 'QUALITY_REVIEWER'];

const statusAccent = (status?: string) => {
  if (!status) return appleColors.purple;
  if (status.includes('BLOCK') || status.includes('REJECT') || status.includes('URGENT') || status.includes('OVERDUE')) return appleColors.red;
  if (status.includes('REVIEW') || status.includes('NEGOTIATION') || status.includes('AWAITING') || status.includes('SUBMITTED')) return appleColors.amber;
  if (status.includes('ACTIVE') || status.includes('ACCEPT') || status.includes('DELIVER') || status.includes('RESOLVED')) return appleColors.green;
  return appleColors.purple;
};

const formatMoney = (amountCents: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format((amountCents || 0) / 100);

const teamScore = (team?: Team, capabilities?: TeamCapability[], reputation?: TeamReputationEvent[]) => {
  if (!team) return 0;
  const statusScore = {
    APPLIED: 44,
    VERIFIED: 72,
    CERTIFIED: 82,
    SPECIALIST: 90,
    OPERATIONS_READY: 96,
    SUSPENDED: 20,
  }[team.verificationStatus] || 58;
  const capabilityBonus = Math.min(12, (capabilities?.length || 0) * 2);
  const ratingBonus = reputation?.length
    ? Math.round((reputation.reduce((total, event) => total + event.rating, 0) / reputation.length - 4) * 7)
    : 0;
  return clampScore(statusScore + capabilityBonus + ratingBonus);
};

export default function TeamDeliveryWorkspace() {
  const queryClient = useQueryClient();
  const { hasRole, user } = useAuth();
  const canManageRoster = hasRole([UserRole.ADMIN, UserRole.TEAM_MANAGER]);
  const teamsMine = useQuery({ queryKey: ['teams-mine'], queryFn: () => getJson<Team[]>('/teams/mine'), retry: false });
  const proposals = useQuery({ queryKey: ['commerce-proposals'], queryFn: () => getJson<QuoteProposal[]>('/commerce/proposals') });
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: () => getJson<ProjectWorkspace[]>('/workspaces') });
  const supportRequests = useQuery({ queryKey: ['commerce-support-requests'], queryFn: () => getJson<SupportRequest[]>('/commerce/support-requests') });
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<TeamMember['role']>('SPECIALIST');

  const visibleTeams = useMemo(() => {
    const byId = new Map<string, Team>();
    (teamsMine.data || []).forEach((team) => byId.set(team.id, team));
    (proposals.data || []).forEach((proposal) => byId.set(proposal.team.id, proposal.team));
    (supportRequests.data || []).forEach((request) => byId.set(request.team.id, request.team));
    return Array.from(byId.values());
  }, [proposals.data, supportRequests.data, teamsMine.data]);
  const selectedTeam = visibleTeams.find((team) => team.id === selectedTeamId) || visibleTeams[0];
  const teamProposals = (proposals.data || []).filter((proposal) => !selectedTeam || proposal.team.id === selectedTeam.id);
  const activeWorkspaces = (workspaces.data || []).filter((workspace) => workspace.status !== 'CLOSED' && workspace.status !== 'DELIVERED');
  const teamSupport = (supportRequests.data || []).filter((request) => !selectedTeam || request.team.id === selectedTeam.id);

  const capabilities = useQuery({
    queryKey: ['teams', selectedTeam?.id, 'capabilities'],
    enabled: !!selectedTeam?.id,
    queryFn: () => getJson<TeamCapability[]>(`/teams/${selectedTeam?.id}/capabilities`),
  });
  const members = useQuery({
    queryKey: ['teams', selectedTeam?.id, 'members'],
    enabled: !!selectedTeam?.id,
    queryFn: () => getJson<TeamMember[]>(`/teams/${selectedTeam?.id}/members`),
    retry: false,
  });
  const reputation = useQuery({
    queryKey: ['teams', selectedTeam?.id, 'reputation'],
    enabled: !!selectedTeam?.id,
    queryFn: () => getJson<TeamReputationEvent[]>(`/commerce/teams/${selectedTeam?.id}/reputation`),
    retry: false,
  });
  const selectedWorkspace = activeWorkspaces[0];
  const milestones = useQuery({
    queryKey: ['workspaces', selectedWorkspace?.id, 'milestones'],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<Milestone[]>(`/workspaces/${selectedWorkspace?.id}/milestones`),
  });
  const addMember = useMutation({
    mutationFn: () =>
      postJson<TeamMember, TeamMemberPayload>(`/teams/${selectedTeam?.id}/members`, {
        email: memberEmail,
        role: memberRole,
        active: true,
      }),
    onSuccess: async () => {
      setMemberEmail('');
      setMemberRole('SPECIALIST');
      await queryClient.invalidateQueries({ queryKey: ['teams', selectedTeam?.id, 'members'] });
    },
  });

  const score = teamScore(selectedTeam, capabilities.data, reputation.data);
  const blockedWorkspaces = activeWorkspaces.filter((workspace) => workspace.status === 'BLOCKED').length;
  const overdueSupport = teamSupport.filter((request) => request.slaStatus === 'OVERDUE' || request.slaStatus === 'ESCALATED').length;
  const averageRating = reputation.data?.length
    ? (reputation.data.reduce((total, event) => total + event.rating, 0) / reputation.data.length).toFixed(1)
    : 'New';

  const loading = [teamsMine, proposals, workspaces, supportRequests, capabilities, members, reputation, milestones].some((query) => query.isLoading);
  const error = [teamsMine, proposals, workspaces, supportRequests, capabilities, members, reputation, milestones].find((query) => query.error)?.error || addMember.error;

  return (
    <>
      <PageHeader
        title="Delivery Control"
        description="Team-focused workspace for proposals, active delivery, evidence milestones, support risk, roster strength, and verified reputation."
        action={
          visibleTeams.length ? (
            <TextField
              select
              size="small"
              label="Team"
              value={selectedTeam?.id || ''}
              onChange={(event) => setSelectedTeamId(event.target.value)}
              sx={{ minWidth: { xs: '100%', md: 300 } }}
            >
              {visibleTeams.map((team) => (
                <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
              ))}
            </TextField>
          ) : null
        }
      />
      <QueryState isLoading={loading} error={error} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 330px' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          <Surface>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} alignItems={{ lg: 'center' }} justifyContent="space-between">
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <Box sx={{ width: 64, height: 64, borderRadius: 1, bgcolor: '#e4f9fd', color: appleColors.cyan, display: 'grid', placeItems: 'center' }}>
                  <EngineeringOutlined />
                </Box>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="h2">{selectedTeam?.name || `${formatLabel(user?.role)} Workspace`}</Typography>
                    {selectedTeam && <PastelChip label={formatLabel(selectedTeam.verificationStatus)} accent={appleColors.green} />}
                  </Stack>
                  <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 760, lineHeight: 1.7 }}>
                    {selectedTeam?.capabilitiesSummary || 'Track scoped opportunities, evidence, milestones, and owner commitments from one team-side surface.'}
                  </Typography>
                </Box>
              </Stack>
              <ProgressRing value={score || 72} size={104} color={appleColors.cyan} label="profile" />
            </Stack>
          </Surface>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            <MetricTile label="Open proposals" value={teamProposals.filter((proposal) => proposal.status === 'SUBMITTED').length} detail={`${teamProposals.length} total proposals`} accent={appleColors.purple} icon={<AssignmentTurnedInOutlined />} />
            <MetricTile label="Active deliveries" value={activeWorkspaces.length} detail={`${blockedWorkspaces} blocked`} accent={blockedWorkspaces ? appleColors.red : appleColors.green} icon={<CheckCircleOutlineOutlined />} />
            <MetricTile label="Support risk" value={overdueSupport} detail={`${teamSupport.length} support requests`} accent={overdueSupport ? appleColors.red : appleColors.amber} icon={<WarningAmberOutlined />} />
            <MetricTile label="Reputation" value={averageRating} detail={`${reputation.data?.length || 0} verified events`} accent={appleColors.cyan} icon={<StarOutlineOutlined />} />
          </Box>

          <Surface>
            <SectionTitle title="Proposal Queue" action={<PastelChip label={`${teamProposals.length} records`} accent={appleColors.purple} />} />
            {teamProposals.length ? (
              <Stack spacing={0}>
                {teamProposals.slice(0, 6).map((proposal, index) => (
                  <Box key={proposal.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.3fr 1fr 130px 120px' }, gap: 1.5, alignItems: 'center', py: 1.75, borderTop: index === 0 ? 0 : '1px solid', borderColor: 'divider' }}>
                    <Box>
                      <Typography sx={{ fontWeight: 900 }}>{proposal.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{proposal.packageInstance?.productProfile?.name || proposal.packageInstance?.name}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">{proposal.scope || 'Scope details pending.'}</Typography>
                    <Typography sx={{ fontWeight: 900 }}>{formatMoney(proposal.fixedPriceCents + proposal.platformFeeCents, proposal.currency)}</Typography>
                    <StatusChip label={proposal.status} color={proposal.status === 'OWNER_ACCEPTED' ? 'success' : 'default'} />
                  </Box>
                ))}
              </Stack>
            ) : (
              <EmptyState label="No proposals are visible for this team yet." />
            )}
          </Surface>

          <Surface>
            <SectionTitle title="Active Deliveries" action={<PastelChip label={`${activeWorkspaces.length} workspaces`} accent={appleColors.green} />} />
            {activeWorkspaces.length ? (
              <Stack spacing={0}>
                {activeWorkspaces.slice(0, 5).map((workspace, index) => (
                  <Box key={workspace.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr 160px auto' }, gap: 1.5, py: 1.75, alignItems: 'center', borderTop: index === 0 ? 0 : '1px solid', borderColor: 'divider' }}>
                    <Box>
                      <Typography sx={{ fontWeight: 900 }}>{workspace.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{workspace.packageInstance?.productProfile?.name || workspace.packageInstance?.name}</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={workspace.status === 'BLOCKED' ? 42 : workspace.status === 'MILESTONE_REVIEW' ? 78 : 64}
                      sx={{ height: 8, borderRadius: 999, bgcolor: '#edf1f7', '& .MuiLinearProgress-bar': { bgcolor: statusAccent(workspace.status), borderRadius: 999 } }}
                    />
                    <DotLabel label={formatLabel(workspace.status)} color={statusAccent(workspace.status)} />
                    <Button size="small" variant="outlined">Open evidence</Button>
                  </Box>
                ))}
              </Stack>
            ) : (
              <EmptyState label="No active delivery workspace is assigned to this user yet." />
            )}
          </Surface>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
            <Surface>
              <SectionTitle title="Milestone Evidence" />
              {milestones.data?.length ? (
                <Stack spacing={1.25}>
                  {milestones.data.slice(0, 6).map((milestone) => (
                    <Stack key={milestone.id} direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{milestone.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{milestone.dueDate || 'No due date'}</Typography>
                      </Box>
                      <StatusChip label={milestone.status} />
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">Milestones appear when a delivery workspace is selected.</Typography>
              )}
            </Surface>

            <Surface sx={{ background: overdueSupport ? '#fff7f8' : '#f6fffb' }}>
              <SectionTitle title="Support Queue" />
              {teamSupport.length ? (
                <Stack spacing={1.25}>
                  {teamSupport.slice(0, 5).map((request) => (
                    <Stack key={request.id} direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 900 }}>{request.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{formatLabel(request.status)} · {formatLabel(request.slaStatus)}</Typography>
                      </Box>
                      <PastelChip label={formatLabel(request.priority)} accent={statusAccent(request.priority)} />
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">No support requests assigned to this team.</Typography>
              )}
            </Surface>
          </Box>
        </Stack>

        <Stack spacing={2.5}>
          <Surface>
            <SectionTitle title="Profile Completeness" action={<GroupsOutlined sx={{ color: appleColors.cyan }} />} />
            <Stack direction="row" spacing={2} alignItems="center">
              <ProgressRing value={score || 72} size={92} color={appleColors.cyan} label="/100" />
              <Box>
                <Typography variant="h4">Verified capability base</Typography>
                <Typography color="text.secondary">Used by owner matching and shortlist ranking.</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
              {(capabilities.data || []).slice(0, 8).map((capability, index) => {
                const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
                return <PastelChip key={capability.id} label={capability.serviceModule?.name || capability.serviceCategory.name} accent={palette.accent} bg={palette.bg} />;
              })}
            </Stack>
          </Surface>

          <Surface>
            <SectionTitle title="Roster" />
            {canManageRoster && selectedTeam && (
              <Box component="form" onSubmit={(event) => { event.preventDefault(); addMember.mutate(); }} sx={{ mb: 1.5 }}>
                <Stack spacing={1}>
                  <TextInput label="Member email" value={memberEmail} onChange={setMemberEmail} />
                  <TextField select size="small" label="Role" value={memberRole} onChange={(event) => setMemberRole(event.target.value as TeamMember['role'])}>
                    {memberRoles.map((role) => <MenuItem key={role} value={role}>{formatLabel(role)}</MenuItem>)}
                  </TextField>
                  <SaveButton disabled={!memberEmail || addMember.isPending} label="Add member" />
                </Stack>
              </Box>
            )}
            <Stack spacing={1}>
              {(members.data || []).slice(0, 7).map((member) => (
                <Stack key={member.id} direction="row" justifyContent="space-between" sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                  <Typography variant="body2">{member.user.email}</Typography>
                  <Typography variant="body2" color="text.secondary">{formatLabel(member.role)}</Typography>
                </Stack>
              ))}
            </Stack>
          </Surface>

          <Surface>
            <SectionTitle title="Reputation Signals" />
            {reputation.data?.length ? (
              <Stack spacing={1.25}>
                {reputation.data.slice(0, 5).map((event) => (
                  <Stack key={event.id} direction="row" spacing={1} justifyContent="space-between">
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{formatLabel(event.eventType)}</Typography>
                      <Typography variant="caption" color="text.secondary">{event.notes || event.workspace?.name}</Typography>
                    </Box>
                    <Typography color="success.main" sx={{ fontWeight: 900 }}>{event.rating}/5</Typography>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">Workspace-backed reviews will appear here.</Typography>
            )}
          </Surface>
        </Stack>
      </Box>
    </>
  );
}
