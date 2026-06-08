'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const viewParam = searchParams?.get('view');
  const activeView: TeamMatchView = isTeamMatchView(viewParam) ? viewParam : 'matches';
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

  return {
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
  };
}
