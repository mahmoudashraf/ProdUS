'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MenuItem, Stack, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson, postJson, putJson } from './api';
import { TeamDeliveryFocusNav, TeamDeliveryView } from './TeamDeliveryFocusNav';
import TeamDeliveryHeroPanel from './TeamDeliveryHeroPanel';
import TeamDeliveryOpportunitiesPanel from './TeamDeliveryOpportunitiesPanel';
import TeamDeliveryProofPanel from './TeamDeliveryProofPanel';
import TeamDeliverySupportPanel from './TeamDeliverySupportPanel';
import TeamDeliveryTeamPanel from './TeamDeliveryTeamPanel';
import { PageHeader, QueryState } from './PlatformComponents';
import { teamDeliveryScore } from './teamDeliveryUtils';
import {
  AttachmentDownloadUrl,
  EvidenceAttachment,
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

export default function TeamDeliveryWorkspace() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasRole, user } = useAuth();
  const canManageRoster = hasRole([UserRole.ADMIN, UserRole.TEAM_MANAGER]);
  const teamsMine = useQuery({ queryKey: ['teams-mine'], queryFn: () => getJson<Team[]>('/teams/mine'), retry: false });
  const proposals = useQuery({ queryKey: ['commerce-proposals'], queryFn: () => getJson<QuoteProposal[]>('/commerce/proposals') });
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: () => getJson<ProjectWorkspace[]>('/workspaces') });
  const supportRequests = useQuery({ queryKey: ['commerce-support-requests'], queryFn: () => getJson<SupportRequest[]>('/commerce/support-requests') });
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [attachmentOpenError, setAttachmentOpenError] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<TeamMember['role']>('SPECIALIST');
  const viewParam = searchParams?.get('view');
  const activeView: TeamDeliveryView =
    viewParam === 'delivery' || viewParam === 'support' || viewParam === 'team' ? viewParam : 'opportunities';
  const setActiveView = (view: TeamDeliveryView) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('view', view);
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  };

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
  const selectedWorkspace = activeWorkspaces.find((workspace) => workspace.id === selectedWorkspaceId) || activeWorkspaces[0];

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
  const milestones = useQuery({
    queryKey: ['workspaces', selectedWorkspace?.id, 'milestones'],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<Milestone[]>(`/workspaces/${selectedWorkspace?.id}/milestones`),
  });
  const attachments = useQuery({
    queryKey: ['attachments', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<EvidenceAttachment[]>(`/attachments?workspaceId=${selectedWorkspace?.id}`),
    retry: false,
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
  const updateSupportRequest = useMutation({
    mutationFn: ({ requestId, status, resolution }: { requestId: string; status: SupportRequest['status']; resolution?: string }) =>
      putJson<SupportRequest, { status: SupportRequest['status']; resolution?: string }>(`/commerce/support-requests/${requestId}/status`, { status, ...(resolution ? { resolution } : {}) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['commerce-support-requests'] });
      await queryClient.invalidateQueries({ queryKey: ['notification-summary'] });
    },
  });

  const score = teamDeliveryScore(selectedTeam, capabilities.data, reputation.data);
  const blockedWorkspaces = activeWorkspaces.filter((workspace) => workspace.status === 'BLOCKED').length;
  const overdueSupport = teamSupport.filter((request) => request.slaStatus === 'OVERDUE' || request.slaStatus === 'ESCALATED').length;
  const averageRating = reputation.data?.length
    ? (reputation.data.reduce((total, event) => total + event.rating, 0) / reputation.data.length).toFixed(1)
    : 'New';
  const viewCounts: Record<TeamDeliveryView, number> = {
    opportunities: teamProposals.length,
    delivery: activeWorkspaces.length + (attachments.data?.length || 0) + (milestones.data?.length || 0),
    support: teamSupport.length,
    team: (members.data || []).length + (capabilities.data || []).length + (reputation.data || []).length,
  };

  const openAttachment = async (attachment: EvidenceAttachment) => {
    setAttachmentOpenError('');
    const popup = window.open('about:blank', '_blank');
    try {
      const response = await getJson<AttachmentDownloadUrl>(`/attachments/${attachment.id}/download-url`);
      if (popup) {
        popup.opener = null;
        popup.location.href = response.downloadUrl;
      } else {
        window.location.assign(response.downloadUrl);
      }
    } catch (error) {
      popup?.close();
      setAttachmentOpenError(error instanceof Error ? error.message : 'Could not open evidence attachment.');
    }
  };

  const loading = [teamsMine, proposals, workspaces, supportRequests, capabilities, members, reputation, milestones, attachments].some((query) => query.isLoading);
  const error = [teamsMine, proposals, workspaces, supportRequests, capabilities, members, reputation, milestones, attachments].find((query) => query.error)?.error || addMember.error || updateSupportRequest.error;

  return (
    <>
      <PageHeader
        title="Delivery Control"
        description="Team-focused workspace for proposals, delivery proof, support risk, roster strength, and verified reputation."
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

      <Stack spacing={2.5}>
        <TeamDeliveryHeroPanel
          selectedTeam={selectedTeam}
          fallbackRole={user?.role}
          score={score}
          teamProposals={teamProposals}
          activeWorkspaceCount={activeWorkspaces.length}
          blockedWorkspaceCount={blockedWorkspaces}
          teamSupport={teamSupport}
          overdueSupportCount={overdueSupport}
          averageRating={averageRating}
        />
        <TeamDeliveryFocusNav activeView={activeView} counts={viewCounts} onChange={setActiveView} />

        {activeView === 'opportunities' && (
          <TeamDeliveryOpportunitiesPanel proposals={teamProposals} />
        )}

        {activeView === 'delivery' && (
          <TeamDeliveryProofPanel
            activeWorkspaces={activeWorkspaces}
            selectedWorkspace={selectedWorkspace}
            selectedTeam={selectedTeam}
            milestones={milestones.data || []}
            attachments={attachments.data || []}
            teamSupportCount={teamSupport.length}
            blockedWorkspaceCount={blockedWorkspaces}
            attachmentOpenError={attachmentOpenError}
            onSelectWorkspace={setSelectedWorkspaceId}
            onOpenAttachment={openAttachment}
          />
        )}

        {activeView === 'support' && (
          <TeamDeliverySupportPanel
            supportRequests={teamSupport}
            overdueSupportCount={overdueSupport}
            isUpdating={updateSupportRequest.isPending}
            onUpdateSupportRequest={(requestId, status, resolution) => updateSupportRequest.mutate({ requestId, status, ...(resolution ? { resolution } : {}) })}
          />
        )}

        {activeView === 'team' && (
          <TeamDeliveryTeamPanel
            selectedTeam={selectedTeam}
            score={score}
            capabilities={capabilities.data || []}
            canManageRoster={canManageRoster}
            members={members.data || []}
            reputation={reputation.data || []}
            memberEmail={memberEmail}
            memberRole={memberRole}
            isAddingMember={addMember.isPending}
            onMemberEmailChange={setMemberEmail}
            onMemberRoleChange={setMemberRole}
            onAddMember={() => addMember.mutate()}
          />
        )}
      </Stack>
    </>
  );
}
