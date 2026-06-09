'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAdvancedForm } from '@/hooks/enterprise';
import type { TeamMatchView } from './ownerTeamMatchConfig';
import {
  type CapabilityPayload,
  type ReputationPayload,
  type TeamMemberPayload,
  type TeamPayload,
  initialCapabilityValues,
  initialMemberValues,
  initialReputationValues,
  initialTeamValues,
} from './teamMatchForms';

const isTeamMatchView = (value: string | null | undefined): value is TeamMatchView =>
  value === 'matches' || value === 'profile' || value === 'shortlist';

export function useTeamMatchUiState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedTeamStateId, setSelectedTeamStateId] = useState('');
  const queryString = searchParams?.toString() || '';
  const viewParam = searchParams?.get('view');
  const selectedPackageId = searchParams?.get('planId') || '';
  const teamParam = searchParams?.get('team') || '';
  const hasActiveView = !!selectedPackageId && isTeamMatchView(viewParam);
  const activeView: TeamMatchView = isTeamMatchView(viewParam) ? viewParam : 'matches';
  const routePath = pathname || '/teams';
  const routeForParams = (params: URLSearchParams) => {
    const nextQueryString = params.toString();
    return nextQueryString ? `${routePath}?${nextQueryString}` : routePath;
  };
  const setActiveView = (view: TeamMatchView, options?: { teamId?: string }) => {
    const params = new URLSearchParams(queryString);
    params.set('view', view);
    if (options?.teamId) {
      params.set('team', options.teamId);
    }
    router.push(routeForParams(params), { scroll: false });
  };
  const openTeamMatchHub = () => {
    const params = new URLSearchParams(queryString);
    params.delete('view');
    params.delete('team');
    router.push(routeForParams(params), { scroll: false });
  };
  const openTeamPlanPicker = () => {
    const params = new URLSearchParams(queryString);
    params.delete('planId');
    params.delete('view');
    params.delete('team');
    router.push(routeForParams(params), { scroll: false });
  };
  const setSelectedPackageId = (packageId: string) => {
    const params = new URLSearchParams(queryString);
    params.delete('view');
    params.delete('team');
    if (packageId) {
      params.set('planId', packageId);
    } else {
      params.delete('planId');
    }
    router.push(routeForParams(params), { scroll: false });
  };
  const setSelectedTeamId = (teamId: string) => {
    setSelectedTeamStateId(teamId);
    const params = new URLSearchParams(queryString);
    if (isTeamMatchView(params.get('view'))) {
      params.set('team', teamId);
      router.replace(routeForParams(params), { scroll: false });
    }
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

  return {
    activeView,
    capabilityForm,
    hasActiveView,
    memberForm,
    openTeamPlanPicker,
    openTeamMatchHub,
    reputationForm,
    selectedPackageId,
    selectedTeamId: teamParam || selectedTeamStateId,
    setActiveView,
    setSelectedPackageId,
    setSelectedTeamId,
    teamForm,
  };
}
