import type { Team, TeamMember, TeamReputationEvent, TeamShortlist } from './types';

export const teamVerificationStatuses: Team['verificationStatus'][] = ['APPLIED', 'VERIFIED', 'CERTIFIED', 'SPECIALIST', 'OPERATIONS_READY'];
export const memberRoles: TeamMember['role'][] = ['LEAD', 'DELIVERY_MANAGER', 'SPECIALIST', 'ADVISOR', 'QUALITY_REVIEWER'];

export interface TeamPayload {
  name: string;
  description: string;
  timezone: string;
  capabilitiesSummary: string;
  typicalProjectSize: string;
  verificationStatus: Team['verificationStatus'];
  active: boolean;
}

export interface CapabilityPayload {
  serviceCategoryId: string;
  serviceModuleId: string | null;
  evidenceUrl: string;
  notes: string;
}

export interface TeamMemberPayload {
  email: string;
  role: TeamMember['role'];
  active: boolean;
}

export interface ReputationPayload {
  workspaceId: string;
  eventType: TeamReputationEvent['eventType'];
  rating: number;
  notes: string;
}

export interface ShortlistPayload {
  packageInstanceId: string;
  teamId: string;
  status: TeamShortlist['status'];
  notes: string;
}

export const initialTeamValues: TeamPayload = {
  name: '',
  description: '',
  timezone: '',
  capabilitiesSummary: '',
  typicalProjectSize: '',
  verificationStatus: 'APPLIED',
  active: true,
};

export const initialCapabilityValues: CapabilityPayload = {
  serviceCategoryId: '',
  serviceModuleId: null,
  evidenceUrl: '',
  notes: '',
};

export const initialMemberValues: TeamMemberPayload = {
  email: '',
  role: 'SPECIALIST',
  active: true,
};

export const initialReputationValues: ReputationPayload = {
  workspaceId: '',
  eventType: 'WORKSPACE_REVIEW',
  rating: 5,
  notes: '',
};
