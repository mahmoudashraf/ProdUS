'use client';

import NextLink from 'next/link';
import { Button, Stack } from '@mui/material';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import PublicTalentDirectoryPage from './PublicTalentDirectoryPage';
import TeamProfilesPage from './TeamProfilesPage';
import {
  TeamMatchDecisionPanel,
  TeamMatchFocusNav,
  TeamMatchMethodPanel,
} from './OwnerTeamMatchDecisionPanels';
import { TeamRecommendationsPanel } from './OwnerTeamRecommendationsPanel';
import { TeamProfileInspectorPanel } from './OwnerTeamProfileInspectorPanel';
import { TeamMatchShortlistPanel } from './OwnerTeamShortlistPanel';
import {
  TeamMatchView,
  teamVerificationScore,
} from './ownerTeamMatchConfig';
import {
  CapabilityManagementPanel,
  MemberManagementPanel,
  ReputationManagementPanel,
  TeamCreatePanel,
} from './TeamMatchManagementPanels';
import {
  PageHeader,
  QueryState,
} from './PlatformComponents';
import {
  TeamShortlist,
} from './types';
import { PROJECT_START_PLAN_HREF } from './projectStartPlanLinks';
import { useTeamMatchData } from './useTeamMatchData';
import { useTeamMatchActions } from './useTeamMatchActions';
import { useTeamMatchUiState } from './useTeamMatchUiState';

export default function TeamsPage() {
  const { hasRole, isLoggedIn } = useAuth();
  if (!isLoggedIn) {
    return <PublicTalentDirectoryPage />;
  }

  const shouldShowProfileStudio = hasRole([UserRole.TEAM_MANAGER, UserRole.SPECIALIST, UserRole.ADVISOR])
    && !hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER]);

  return shouldShowProfileStudio ? <TeamProfilesPage /> : <MatchedTeamsPage />;
}

function MatchedTeamsPage() {
  const { hasRole } = useAuth();
  const canManageTeams = hasRole([UserRole.ADMIN, UserRole.TEAM_MANAGER]);
  const canManageTeamRoster = hasRole([UserRole.ADMIN, UserRole.TEAM_MANAGER]);
  const canCreateReputation = hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER]);
  const {
    activeView,
    capabilityForm,
    memberForm,
    reputationForm,
    selectedPackageId,
    selectedTeamId,
    setActiveView,
    setSelectedPackageId,
    setSelectedTeamId,
    teamForm,
  } = useTeamMatchUiState();
  const {
    capabilities,
    categories,
    members,
    modules,
    packageList,
    queriesLoading,
    queryError,
    recommendations,
    reputation,
    selectedTeam,
    shortlists,
    teamList,
    workspaces,
  } = useTeamMatchData({
    canManageTeamRoster,
    selectedPackageId,
    selectedTeamId,
    setSelectedPackageId,
    setSelectedTeamId,
  });

  const {
    actionError,
    addMember,
    addReputation,
    createCapability,
    createTeam,
    upsertShortlist,
  } = useTeamMatchActions({
    capabilityForm,
    memberForm,
    reputationForm,
    selectedPackageId,
    selectedTeamId: selectedTeam?.id,
    setSelectedTeamId,
    teamForm,
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

  const matchedTeams = selectedPackageId
    ? recommendations.data || []
    : teamList.map((team) => ({ team, score: teamVerificationScore(team) / 100, reasons: [team.capabilitiesSummary || team.description || 'Verified profile available'] }));
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
        ? 'Compared against this service plan, team capabilities, delivery history, and expected budget.'
        : 'Shortlisted for owner review and proposal follow-up.',
    });
  };
  const inspectTeam = (teamId: string) => {
    setSelectedTeamId(teamId);
    setActiveView('profile');
  };
  const compareTeam = (teamId: string) => {
    setSelectedTeamId(teamId);
    recordShortlist(teamId, 'COMPARED');
    setActiveView('profile');
  };
  const chooseTeam = (teamId: string) => {
    recordShortlist(teamId, 'ACTIVE');
    setActiveView('shortlist');
  };
  const viewCounts: Record<TeamMatchView, number> = {
    matches: matchedTeams.length,
    profile: selectedTeam ? 1 : 0,
    shortlist: activeShortlists.length || Math.min(matchedTeams.length, 3),
  };
  const capabilityManagementPanel = canManageTeams ? (
    <CapabilityManagementPanel
      categories={categories.data || []}
      form={capabilityForm}
      isSaving={createCapability.isPending}
      modules={modules.data || []}
      onSubmit={submitCapability}
    />
  ) : null;
  const memberManagementPanel = canManageTeamRoster ? (
    <MemberManagementPanel
      form={memberForm}
      isSaving={addMember.isPending}
      onSubmit={submitMember}
    />
  ) : null;
  const reputationManagementPanel = canCreateReputation ? (
    <ReputationManagementPanel
      form={reputationForm}
      isSaving={addReputation.isPending}
      workspaces={workspaces.data || []}
      onSubmit={submitReputation}
    />
  ) : null;

  return (
    <>
      <PageHeader
        title="Team Match"
        description="Choose the delivery team that can move the selected start plan into launch-hardening work."
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button component={NextLink} href={PROJECT_START_PLAN_HREF} variant="outlined" sx={{ minHeight: 42 }}>
              Open Project Start Plan
            </Button>
            <Button component={NextLink} href="/packages?view=team" variant="contained" sx={{ minHeight: 42 }}>
              Review service plan
            </Button>
          </Stack>
        }
      />
      <QueryState
        isLoading={queriesLoading}
        error={queryError || actionError}
      />

      <Stack spacing={2.5}>
        <TeamMatchDecisionPanel
          selectedPackageId={selectedPackageId}
          packages={packageList}
          topRecommendation={matchedTeams[0]}
          averageMatch={avgMatch}
          shortlistCount={activeShortlists.length}
          onPackageChange={setSelectedPackageId}
          onOpenShortlist={() => setActiveView('shortlist')}
        />

        <TeamMatchFocusNav activeView={activeView} counts={viewCounts} onChange={setActiveView} />

        {activeView === 'matches' && (
          <TeamRecommendationsPanel
            recommendations={matchedTeams}
            activeShortlists={activeShortlists}
            isLoading={recommendations.isLoading || recommendations.isFetching}
            selectedPackageId={selectedPackageId}
            isUpdating={upsertShortlist.isPending}
            onCompare={compareTeam}
            onChoose={chooseTeam}
            onInspect={inspectTeam}
          />
        )}

        {activeView === 'profile' && (
          <Stack spacing={2.5}>
            <TeamProfileInspectorPanel
              team={selectedTeam}
              capabilities={capabilities.data || []}
              members={members.data || []}
              reputation={reputation.data || []}
              canManageRoster={canManageTeamRoster}
              capabilityForm={capabilityManagementPanel}
              memberForm={memberManagementPanel}
              reputationForm={reputationManagementPanel}
            />
            {canManageTeams && (
              <TeamCreatePanel
                form={teamForm}
                isSaving={createTeam.isPending}
                onSubmit={submit}
              />
            )}
          </Stack>
        )}

        {activeView === 'shortlist' && (
          <TeamMatchShortlistPanel
            activeShortlists={activeShortlists}
            recommendations={matchedTeams}
            onInspect={inspectTeam}
          />
        )}

        <TeamMatchMethodPanel />
      </Stack>
    </>
  );
}
