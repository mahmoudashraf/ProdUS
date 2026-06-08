'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postJson } from './api';
import type {
  CapabilityPayload,
  ReputationPayload,
  ShortlistPayload,
  TeamMemberPayload,
  TeamPayload,
} from './teamMatchForms';
import type {
  Team,
  TeamCapability,
  TeamMember,
  TeamReputationEvent,
  TeamShortlist,
} from './types';

interface TeamMatchMutationForm<TValues> {
  values: TValues;
  resetForm: () => void;
}

interface TeamMatchActionsInput {
  capabilityForm: TeamMatchMutationForm<CapabilityPayload>;
  memberForm: TeamMatchMutationForm<TeamMemberPayload>;
  reputationForm: TeamMatchMutationForm<ReputationPayload>;
  selectedPackageId: string;
  selectedTeamId: string | undefined;
  setSelectedTeamId: (teamId: string) => void;
  teamForm: TeamMatchMutationForm<TeamPayload>;
}

export function useTeamMatchActions({
  capabilityForm,
  memberForm,
  reputationForm,
  selectedPackageId,
  selectedTeamId,
  setSelectedTeamId,
  teamForm,
}: TeamMatchActionsInput) {
  const queryClient = useQueryClient();

  const createTeam = useMutation({
    mutationFn: () => postJson<Team, TeamPayload>('/teams', teamForm.values),
    onSuccess: async (team) => {
      teamForm.resetForm();
      setSelectedTeamId(team.id);
      await queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
  const createCapability = useMutation({
    mutationFn: () => postJson<TeamCapability, CapabilityPayload>(`/teams/${selectedTeamId}/capabilities`, capabilityForm.values),
    onSuccess: async () => {
      capabilityForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['teams', selectedTeamId, 'capabilities'] });
      await queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });
  const addMember = useMutation({
    mutationFn: () => postJson<TeamMember, TeamMemberPayload>(`/teams/${selectedTeamId}/members`, memberForm.values),
    onSuccess: async () => {
      memberForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['teams', selectedTeamId, 'members'] });
    },
  });
  const addReputation = useMutation({
    mutationFn: () => postJson<TeamReputationEvent, ReputationPayload>(`/commerce/teams/${selectedTeamId}/reputation`, reputationForm.values),
    onSuccess: async () => {
      reputationForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['teams', selectedTeamId, 'reputation'] });
    },
  });
  const upsertShortlist = useMutation({
    mutationFn: (payload: ShortlistPayload) => postJson<TeamShortlist, ShortlistPayload>('/shortlists', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['shortlists', selectedPackageId] });
    },
  });

  const actionError = createTeam.error
    || createCapability.error
    || addMember.error
    || addReputation.error
    || upsertShortlist.error;

  return {
    actionError,
    addMember,
    addReputation,
    createCapability,
    createTeam,
    upsertShortlist,
  };
}
