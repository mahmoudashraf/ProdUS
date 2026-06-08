'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ExpertProfile, Team, TeamMember } from './types';
import type { ExpertProfilePayload, TeamProfilePayload } from './teamProfileStudioTypes';

export const emptyTeamForm: TeamProfilePayload = {
  name: '',
  description: '',
  headline: '',
  bio: '',
  profilePhotoUrl: '',
  coverPhotoUrl: '',
  websiteUrl: '',
  timezone: '',
  capabilitiesSummary: '',
  typicalProjectSize: '',
  verificationStatus: 'APPLIED',
  active: true,
};

const emptyExpertForm: ExpertProfilePayload = {
  displayName: '',
  headline: '',
  bio: '',
  profilePhotoUrl: '',
  coverPhotoUrl: '',
  location: '',
  timezone: '',
  websiteUrl: '',
  portfolioUrl: '',
  skills: '',
  preferredProjectSize: '',
  availability: 'AVAILABLE',
  soloMode: true,
  active: true,
};

const teamToForm = (team?: Team): TeamProfilePayload => ({
  ...emptyTeamForm,
  name: team?.name || '',
  description: team?.description || '',
  headline: team?.headline || '',
  bio: team?.bio || '',
  profilePhotoUrl: team?.profilePhotoUrl || '',
  coverPhotoUrl: team?.coverPhotoUrl || '',
  websiteUrl: team?.websiteUrl || '',
  timezone: team?.timezone || '',
  capabilitiesSummary: team?.capabilitiesSummary || '',
  typicalProjectSize: team?.typicalProjectSize || '',
  verificationStatus: team?.verificationStatus || 'APPLIED',
  active: team?.active ?? true,
});

const expertToForm = (profile?: ExpertProfile): ExpertProfilePayload => ({
  ...emptyExpertForm,
  displayName: profile?.displayName || '',
  headline: profile?.headline || '',
  bio: profile?.bio || '',
  profilePhotoUrl: profile?.profilePhotoUrl || '',
  coverPhotoUrl: profile?.coverPhotoUrl || '',
  location: profile?.location || '',
  timezone: profile?.timezone || '',
  websiteUrl: profile?.websiteUrl || '',
  portfolioUrl: profile?.portfolioUrl || '',
  skills: profile?.skills || '',
  preferredProjectSize: profile?.preferredProjectSize || '',
  availability: profile?.availability || 'AVAILABLE',
  soloMode: profile?.soloMode ?? true,
  active: profile?.active ?? true,
});

export function useTeamProfileStudioState({
  expertProfile,
  managedTeams,
}: {
  expertProfile?: ExpertProfile | undefined;
  managedTeams: Team[];
}) {
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamForm, setTeamForm] = useState<TeamProfilePayload>(emptyTeamForm);
  const [expertForm, setExpertForm] = useState<ExpertProfilePayload>(emptyExpertForm);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'SPECIALIST' as TeamMember['role'], message: '' });
  const [inviteNotice, setInviteNotice] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);
  const [joinMessage, setJoinMessage] = useState('I can help with backend, security, and launch evidence for this team.');

  const selectedTeam = useMemo(
    () => isCreatingTeam ? undefined : managedTeams.find((team) => team.id === selectedTeamId) || managedTeams[0],
    [isCreatingTeam, managedTeams, selectedTeamId]
  );

  useEffect(() => {
    if (!selectedTeamId && managedTeams[0] && !isCreatingTeam) {
      setSelectedTeamId(managedTeams[0].id);
    }
  }, [isCreatingTeam, managedTeams, selectedTeamId]);

  useEffect(() => {
    setTeamForm(teamToForm(selectedTeam));
  }, [isCreatingTeam, selectedTeam?.id]);

  useEffect(() => {
    if (expertProfile) {
      setExpertForm(expertToForm(expertProfile));
    }
  }, [expertProfile]);

  const setTeamValue = <K extends keyof TeamProfilePayload>(key: K, value: TeamProfilePayload[K]) => {
    setTeamForm((current) => ({ ...current, [key]: value }));
  };
  const setExpertValue = <K extends keyof ExpertProfilePayload>(key: K, value: ExpertProfilePayload[K]) => {
    setExpertForm((current) => ({ ...current, [key]: value }));
  };
  const selectTeam = (teamId: string) => {
    setIsCreatingTeam(false);
    setSelectedTeamId(teamId);
  };
  const startNewTeam = () => {
    setIsCreatingTeam(true);
    setSelectedTeamId('');
    setTeamForm(emptyTeamForm);
  };

  return {
    expertForm,
    inviteForm,
    inviteNotice,
    isCreatingTeam,
    joinMessage,
    selectedTeam,
    selectedTeamId,
    selectTeam,
    setExpertForm,
    setExpertValue,
    setInviteForm,
    setInviteNotice,
    setIsCreatingTeam,
    setJoinMessage,
    setSelectedTeamId,
    setTeamForm,
    setTeamValue,
    startNewTeam,
    teamForm,
  };
}
