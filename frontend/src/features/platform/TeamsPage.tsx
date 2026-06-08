'use client';

import NextLink from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ManageAccountsOutlined } from '@mui/icons-material';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useAdvancedForm } from '@/hooks/enterprise';
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
  type CapabilityPayload,
  type ReputationPayload,
  type TeamMemberPayload,
  type TeamPayload,
  initialCapabilityValues,
  initialMemberValues,
  initialReputationValues,
  initialTeamValues,
  memberRoles,
  teamVerificationStatuses,
} from './teamMatchForms';
import {
  PageHeader,
  QueryState,
  SaveButton,
  SectionTitle,
  Surface,
  TextInput,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import {
  Team,
  TeamMember,
  TeamShortlist,
} from './types';
import { useTeamMatchData } from './useTeamMatchData';
import { useTeamMatchActions } from './useTeamMatchActions';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const canManageTeams = hasRole([UserRole.ADMIN, UserRole.TEAM_MANAGER]);
  const canManageTeamRoster = hasRole([UserRole.ADMIN, UserRole.TEAM_MANAGER]);
  const canCreateReputation = hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
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
  const viewParam = searchParams?.get('view');
  const activeView: TeamMatchView = viewParam === 'profile' || viewParam === 'shortlist' ? viewParam : 'matches';
  const setActiveView = (view: TeamMatchView) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('view', view);
    router.replace(`/teams?${params.toString()}`, { scroll: false });
  };

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
    <Box component="form" onSubmit={submitCapability}>
      <SectionTitle title="Maintain Capability Evidence" />
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
        <Button type="submit" variant="outlined" disabled={!capabilityForm.values.serviceCategoryId || createCapability.isPending}>
          Save capability
        </Button>
      </Box>
    </Box>
  ) : null;
  const memberManagementPanel = canManageTeamRoster ? (
    <Box component="form" onSubmit={submitMember}>
      <SectionTitle title="Maintain Delivery Roster" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 190px auto' }, gap: 1 }}>
        <TextField size="small" label="Email" value={memberForm.values.email} onChange={(event) => memberForm.setValue('email', event.target.value)} />
        <TextField select size="small" label="Role" value={memberForm.values.role} onChange={(event) => memberForm.setValue('role', event.target.value as TeamMember['role'])}>
          {memberRoles.map((role) => (
            <MenuItem key={role} value={role}>{formatLabel(role)}</MenuItem>
          ))}
        </TextField>
        <Button type="submit" variant="outlined" disabled={!memberForm.values.email || addMember.isPending}>
          Save member
        </Button>
      </Box>
    </Box>
  ) : null;
  const reputationManagementPanel = canCreateReputation ? (
    <Box component="form" onSubmit={submitReputation}>
      <SectionTitle title="Capture Workspace Review" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 110px 1fr auto' }, gap: 1 }}>
        <TextField select size="small" label="Workspace" value={reputationForm.values.workspaceId} onChange={(event) => reputationForm.setValue('workspaceId', event.target.value)}>
          {(workspaces.data || []).map((workspace) => (
            <MenuItem key={workspace.id} value={workspace.id}>{workspace.name}</MenuItem>
          ))}
        </TextField>
        <TextField size="small" type="number" label="Rating" value={reputationForm.values.rating} onChange={(event) => reputationForm.setValue('rating', Number(event.target.value))} inputProps={{ min: 1, max: 5 }} />
        <TextField size="small" label="Notes" value={reputationForm.values.notes} onChange={(event) => reputationForm.setValue('notes', event.target.value)} />
        <Button type="submit" variant="outlined" disabled={!reputationForm.values.workspaceId || addReputation.isPending}>
          Save review
        </Button>
      </Box>
    </Box>
  ) : null;

  return (
    <>
      <PageHeader
        title="Team Match"
        description="Choose the delivery team that can move the selected start plan into launch-hardening work."
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button component={NextLink} href="/owner/project-cart" variant="outlined" sx={{ minHeight: 42 }}>
              Open start plan
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
                      {teamVerificationStatuses.map((status) => (
                        <MenuItem key={status} value={status}>{formatLabel(status)}</MenuItem>
                      ))}
                    </TextField>
                    <SaveButton disabled={!teamForm.values.name || createTeam.isPending} label="Create team" />
                  </Stack>
                </Box>
              </Surface>
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
