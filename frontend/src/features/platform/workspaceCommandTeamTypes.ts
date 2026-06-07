'use client';

import type { FormEvent } from 'react';
import { appleColors } from './PlatformComponents';
import type {
  Deliverable,
  DisputeCase,
  Milestone,
  ProjectWorkspace,
  SupportRequest,
  SupportSubscription,
  WorkspaceParticipant,
} from './types';

export interface WorkspaceCommandFormController<TValues> {
  values: TValues;
  setValue: <TKey extends keyof TValues>(key: TKey, value: TValues[TKey]) => void;
  handleSubmit: (onSubmit: () => void) => (event: FormEvent<HTMLFormElement>) => void;
}

export interface WorkspaceFormValues {
  packageInstanceId: string;
  name: string;
  status: ProjectWorkspace['status'];
}

export interface MilestoneFormValues {
  title: string;
  description: string;
  dueDate: string | null;
  status: Milestone['status'];
}

export interface DeliverableFormValues {
  title: string;
  evidence: string;
  status: Deliverable['status'];
}

export interface ParticipantFormValues {
  email: string;
  role: WorkspaceParticipant['role'];
  active: boolean;
}

export interface SupportSubscriptionFormValues {
  teamId: string;
  planName: string;
  sla: string;
  monthlyAmountCents: number;
  currency: string;
  startsOn: string | null;
  renewsOn: string | null;
  status: SupportSubscription['status'];
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

export interface WorkspaceScannerUploadFormValues {
  toolName: string;
  toolVersion: string;
  format: 'SARIF' | 'JSON' | 'JUNIT' | 'LOG';
  artifactFileName: string;
  artifactPayload: string;
  milestoneId: string;
}

export interface WorkspaceScannerUploadPayload {
  productId: string;
  workspaceId: string;
  sourceId?: string;
  toolName: string;
  toolVersion: string;
  format: WorkspaceScannerUploadFormValues['format'];
  artifactFileName: string;
  artifactPayload: string;
  milestoneId?: string;
}

export const participantRoles: WorkspaceParticipant['role'][] = ['COORDINATOR', 'TEAM_LEAD', 'SPECIALIST', 'ADVISOR', 'VIEWER'];
export const supportPriorities: SupportRequest['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
export const supportStatuses: SupportRequest['status'][] = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'WAITING_ON_OWNER', 'RESOLVED', 'CANCELLED'];
export const disputeSeverities: DisputeCase['severity'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const disputeStatuses: DisputeCase['status'][] = ['OPEN', 'UNDER_REVIEW', 'OWNER_RESPONSE_NEEDED', 'TEAM_RESPONSE_NEEDED', 'RESOLVED', 'CANCELLED'];

export const initialDraftWorkspaceValues: WorkspaceFormValues = {
  packageInstanceId: '',
  name: '',
  status: 'DRAFT_PACKAGE',
};

export const initialActiveWorkspaceValues: WorkspaceFormValues = {
  packageInstanceId: '',
  name: '',
  status: 'ACTIVE_DELIVERY',
};

export const initialMilestoneValues: MilestoneFormValues = {
  title: '',
  description: '',
  dueDate: null,
  status: 'PLANNED',
};

export const initialDeliverableValues: DeliverableFormValues = {
  title: '',
  evidence: '',
  status: 'PENDING',
};

export const initialParticipantValues: ParticipantFormValues = {
  email: '',
  role: 'SPECIALIST',
  active: true,
};

export const initialSupportSubscriptionValues: SupportSubscriptionFormValues = {
  teamId: '',
  planName: '',
  sla: '',
  monthlyAmountCents: 0,
  currency: 'USD',
  startsOn: null,
  renewsOn: null,
  status: 'PROPOSED',
};

export const initialSupportRequestValues: SupportRequestFormValues = {
  supportSubscriptionId: null,
  teamId: null,
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'OPEN',
  dueOn: null,
};

export const initialDisputeValues: DisputeFormValues = {
  teamId: null,
  title: '',
  description: '',
  severity: 'MEDIUM',
  responseDueOn: null,
};

export const initialWorkspaceScannerUploadValues: WorkspaceScannerUploadFormValues = {
  toolName: 'CodeQL',
  toolVersion: '',
  format: 'SARIF',
  artifactFileName: 'workspace-evidence.sarif',
  artifactPayload: '',
  milestoneId: '',
};

export const formatMoney = (amountCents: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format((amountCents || 0) / 100);

export const attachmentKey = (scopeType: string, scopeId: string) => `${scopeType}:${scopeId}`;

export const workspaceAccent = (status?: string) => {
  if (!status) return appleColors.purple;
  if (status.includes('BLOCK')) return appleColors.red;
  if (status.includes('REVIEW') || status.includes('NEGOTIATION') || status.includes('AWAITING')) return appleColors.amber;
  if (status.includes('ACTIVE') || status.includes('DELIVER') || status.includes('SUPPORT')) return appleColors.green;
  return appleColors.purple;
};

export const uploadErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Attachment upload failed';
};
