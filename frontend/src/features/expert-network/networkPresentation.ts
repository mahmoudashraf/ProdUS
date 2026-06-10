'use client';

import type { ButtonProps } from '@mui/material';
import type { ExpertProfile, TeamInvitation, TeamJoinRequest, TeamMember } from '@/features/platform/types';
import { appleColors } from '@/features/platform/PlatformComponents';
import type { TrialStatus } from './types';

export const serviceColors = ['#6366f1', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];

export const splitTags = (value?: string) =>
  (value || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

export const initials = (value?: string) =>
  (value || 'ProdUS')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

export const displayName = (email?: string) => {
  if (!email) return 'ProdUS user';
  return (email.split('@')[0] ?? email)
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export const formatDate = (value?: string) => {
  if (!value) return 'Recently';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
};

export const messageFor = (name: string) =>
  `I saw ${name} on ProdUS Network and would like to discuss service fit, availability, and a scoped collaboration path for product work.`;

export type ActionVariant = NonNullable<ButtonProps['variant']>;
export type ActionColor = NonNullable<ButtonProps['color']>;
export type TrialAction = 'accept' | 'activate' | 'complete' | 'cancel';

export const sameEmail = (left?: string, right?: string) => !!left && !!right && left.trim().toLowerCase() === right.trim().toLowerCase();

export const joinRequestForTeam = (requests: TeamJoinRequest[] | undefined, teamId: string) =>
  (requests || []).find((request) => request.team?.id === teamId);

export const memberForExpert = (members: TeamMember[] | undefined, expert: ExpertProfile) =>
  (members || []).find((member) => member.active && sameEmail(member.user?.email, expert.user?.email));

export const invitationForExpert = (invitations: TeamInvitation[] | undefined, expert: ExpertProfile) =>
  (invitations || []).find((invitation) => sameEmail(invitation.email, expert.user?.email));

export const trialActionsForStatus = (status: TrialStatus): Array<{ action?: TrialAction; label: string; variant: ActionVariant; color: ActionColor; disabled?: boolean }> => {
  switch (status) {
    case 'PROPOSED':
    case 'NEGOTIATING':
      return [
        { action: 'accept', label: 'Accept Trial', variant: 'contained', color: 'primary' },
        { action: 'cancel', label: 'Cancel', variant: 'outlined', color: 'error' },
      ];
    case 'ACCEPTED':
      return [
        { action: 'activate', label: 'Activate', variant: 'contained', color: 'primary' },
        { action: 'cancel', label: 'Cancel', variant: 'outlined', color: 'error' },
      ];
    case 'ACTIVE':
    case 'MILESTONE_REVIEW':
    case 'FORM_TEAM_PROPOSED':
      return [
        { action: 'complete', label: 'Complete', variant: 'contained', color: 'primary' },
        { action: 'cancel', label: 'Cancel', variant: 'outlined', color: 'error' },
      ];
    case 'COMPLETED':
      return [{ label: 'Completed', variant: 'outlined', color: 'success', disabled: true }];
    case 'TEAM_FORMED':
      return [{ label: 'Team Formed', variant: 'outlined', color: 'success', disabled: true }];
    case 'CANCELLED':
      return [{ label: 'Cancelled', variant: 'outlined', color: 'error', disabled: true }];
    default:
      return [{ action: 'activate', label: 'Activate', variant: 'contained', color: 'primary' }];
  }
};

export const availabilityColor = (availability?: ExpertProfile['availability']) =>
  availability === 'AVAILABLE' ? appleColors.green : appleColors.amber;
