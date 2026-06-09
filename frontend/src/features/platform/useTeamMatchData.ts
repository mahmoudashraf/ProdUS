'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getJson } from './api';
import { sortPackagesForOwner } from './displayOrder';
import type {
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

interface TeamMatchDataInput {
  canManageTeamRoster: boolean;
  selectedPackageId: string;
  selectedTeamId: string;
  setSelectedPackageId: (packageId: string) => void;
  setSelectedTeamId: (teamId: string) => void;
}

export function useTeamMatchData({
  canManageTeamRoster,
  selectedPackageId,
  selectedTeamId,
  setSelectedPackageId,
  setSelectedTeamId,
}: TeamMatchDataInput) {
  const teams = useQuery({ queryKey: ['teams'], queryFn: () => getJson<Team[]>('/teams') });
  const packages = useQuery({ queryKey: ['packages'], queryFn: () => getJson<PackageInstance[]>('/packages') });
  const categories = useQuery({ queryKey: ['catalog-categories'], queryFn: () => getJson<ServiceCategory[]>('/catalog/categories') });
  const modules = useQuery({ queryKey: ['catalog-modules'], queryFn: () => getJson<ServiceModule[]>('/catalog/modules') });
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: () => getJson<ProjectWorkspace[]>('/workspaces') });

  const packageList = useMemo(() => sortPackagesForOwner(packages.data || []), [packages.data]);
  const teamList = teams.data || [];
  const selectedTeam = useMemo(
    () => teamList.find((team) => team.id === selectedTeamId) || teamList[0],
    [teamList, selectedTeamId]
  );

  useEffect(() => {
    if (selectedPackageId && packageList.length && !packageList.some((item) => item.id === selectedPackageId)) {
      setSelectedPackageId('');
    }
  }, [packageList, selectedPackageId, setSelectedPackageId]);

  useEffect(() => {
    if (!selectedTeamId && teamList[0]) {
      setSelectedTeamId(teamList[0].id);
    }
  }, [selectedTeamId, setSelectedTeamId, teamList]);

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

  const queryError = teams.error
    || packages.error
    || categories.error
    || modules.error
    || workspaces.error
    || recommendations.error
    || capabilities.error
    || reputation.error
    || shortlists.error
    || (canManageTeamRoster ? members.error : null);

  return {
    capabilities,
    categories,
    members,
    modules,
    packageList,
    packages,
    queryError,
    queriesLoading: teams.isLoading || packages.isLoading || categories.isLoading || modules.isLoading || workspaces.isLoading,
    recommendations,
    reputation,
    selectedTeam,
    shortlists,
    teamList,
    teams,
    workspaces,
  };
}
