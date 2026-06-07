'use client';

import type { FormEvent } from 'react';
import type { DisputeCase, SupportRequest, WorkspaceParticipant } from './types';

export interface WorkspaceCommandFormController<TValues> {
  values: TValues;
  setValue: <TKey extends keyof TValues>(key: TKey, value: TValues[TKey]) => void;
  handleSubmit: (onSubmit: () => void) => (event: FormEvent<HTMLFormElement>) => void;
}

export interface ParticipantFormValues {
  email: string;
  role: WorkspaceParticipant['role'];
  active: boolean;
}

export interface SupportRequestFormValues {
  supportSubscriptionId: string | null;
  teamId: string | null;
  title: string;
  description: string;
  priority: SupportRequest['priority'];
  status: SupportRequest['status'];
  dueOn: string | null;
}

export interface DisputeFormValues {
  teamId: string | null;
  title: string;
  description: string;
  severity: DisputeCase['severity'];
  responseDueOn: string | null;
}

export interface SupportStatusPayload {
  status: SupportRequest['status'];
  resolution: string;
}

export interface DisputeStatusPayload {
  status: DisputeCase['status'];
  resolution: string;
}

export const participantRoles: WorkspaceParticipant['role'][] = ['COORDINATOR', 'TEAM_LEAD', 'SPECIALIST', 'ADVISOR', 'VIEWER'];
export const supportPriorities: SupportRequest['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
export const supportStatuses: SupportRequest['status'][] = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'WAITING_ON_OWNER', 'RESOLVED', 'CANCELLED'];
export const disputeSeverities: DisputeCase['severity'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const disputeStatuses: DisputeCase['status'][] = ['OPEN', 'UNDER_REVIEW', 'OWNER_RESPONSE_NEEDED', 'TEAM_RESPONSE_NEEDED', 'RESOLVED', 'CANCELLED'];
