import type {
  AutomatedCheck,
  EvidenceRequirement,
  HandoffDocument,
  IntegrationConnection,
  IntegrationSignal,
  ProductHealthReview,
  ReviewDecision,
} from './types';

export interface EvidenceStatusPayload {
  status: EvidenceRequirement['status'];
  evidenceReference?: string;
}

export interface CheckPayload {
  checkType: string;
  provider: string;
  externalRef?: string;
  status: AutomatedCheck['status'];
  summary?: string;
  rawPayload?: string;
}

export interface ReviewPayload {
  decision: ReviewDecision['decision'];
  note: string;
}

export interface HandoffPayload {
  title: string;
  runbook: string;
  accessChecklist: string;
  knownIssues: string;
  supportScope: string;
  status: HandoffDocument['status'];
}

export interface HealthPayload {
  healthScore: number;
  summary: string;
  risks: string;
  actions: string;
  status: ProductHealthReview['status'];
}

export interface IntegrationPayload {
  providerType: IntegrationConnection['providerType'];
  name: string;
  externalRef?: string;
  scopedAccessNote?: string;
  status: IntegrationConnection['status'];
}

export interface SignalPayload {
  milestoneId?: string;
  criterionId?: string;
  signalType: string;
  status: IntegrationSignal['status'];
  summary?: string;
  evidencePayload?: string;
}

export interface WorkspaceScannerReadinessPayload {
  createCriteria: boolean;
  createServiceRecommendations: boolean;
  includeAcceptedRisk: boolean;
  summary: string;
}
