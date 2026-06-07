'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, LinearProgress, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import useAuth from '@/hooks/useAuth';
import { uploadService } from '@/services/uploadService';
import { UserRole } from '@/types/auth';
import { getJson, postJson, putJson } from './api';
import WorkspaceAcceptanceReviewPanel from './WorkspaceAcceptanceReviewPanel';
import WorkspaceCommandHandoffPanels from './WorkspaceCommandHandoffPanels';
import WorkspaceCommandHero from './WorkspaceCommandHero';
import WorkspaceCommandJourneyNav, { type WorkspaceCommandView } from './WorkspaceCommandJourneyNav';
import WorkspaceCommandMetricsPanel from './WorkspaceCommandMetricsPanel';
import WorkspaceCommandSidebar from './WorkspaceCommandSidebar';
import WorkspaceCommandTeamPanels from './WorkspaceCommandTeamPanels';
import WorkspaceEvidenceAttachmentPanel from './WorkspaceEvidenceAttachmentPanel';
import WorkspaceOverviewDeliveryAnswerPanel from './WorkspaceOverviewDeliveryAnswerPanel';
import WorkspaceProofEvidencePanel from './WorkspaceProofEvidencePanel';
import WorkspaceProofMilestonesPanel from './WorkspaceProofMilestonesPanel';
import WorkspaceProofReadinessPanel from './WorkspaceProofReadinessPanel';
import { sortWorkspacesForOwner } from './displayOrder';
import {
  EmptyState,
  PageHeader,
  QueryState,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import {
  AcceptanceCriterion,
  AttachmentDownloadUrl,
  AttachmentScope,
  AutomatedCheck,
  Deliverable,
  DisputeCase,
  EvidenceAttachment,
  EvidenceRequirement,
  HandoffDocument,
  IntegrationConnection,
  IntegrationSignal,
  LaunchReadinessReport,
  Milestone,
  PackageInstance,
  ProductHealthReview,
  ProjectWorkspace,
  ReviewDecision,
  ScannerEvidenceItem,
  ScanRun,
  ShipConfidenceHistory,
  SupportRequest,
  Team,
  WorkspaceGovernance,
  WorkspaceParticipant,
  WorkspaceScannerReadiness,
} from './types';

interface WorkspacePayload {
  packageInstanceId: string;
  name: string;
  status: ProjectWorkspace['status'];
}

interface MilestonePayload {
  title: string;
  description: string;
  dueDate: string | null;
  status: Milestone['status'];
}

interface DeliverablePayload {
  title: string;
  evidence: string;
  status: Deliverable['status'];
}

interface ParticipantPayload {
  email: string;
  role: WorkspaceParticipant['role'];
  active: boolean;
}

interface SupportRequestPayload {
  supportSubscriptionId: string | null;
  teamId: string | null;
  title: string;
  description: string;
  priority: SupportRequest['priority'];
  status: SupportRequest['status'];
  dueOn: string | null;
}

interface SupportStatusPayload {
  status: SupportRequest['status'];
  resolution: string;
}

interface DisputePayload {
  teamId: string | null;
  title: string;
  description: string;
  severity: DisputeCase['severity'];
  responseDueOn: string | null;
}

interface DisputeStatusPayload {
  status: DisputeCase['status'];
  resolution: string;
}

interface EvidenceStatusPayload {
  status: EvidenceRequirement['status'];
  evidenceReference?: string;
}

interface CheckPayload {
  checkType: string;
  provider: string;
  externalRef?: string;
  status: AutomatedCheck['status'];
  summary?: string;
  rawPayload?: string;
}

interface ReviewPayload {
  decision: ReviewDecision['decision'];
  note: string;
}

interface HandoffPayload {
  title: string;
  runbook: string;
  accessChecklist: string;
  knownIssues: string;
  supportScope: string;
  status: HandoffDocument['status'];
}

interface HealthPayload {
  healthScore: number;
  summary: string;
  risks: string;
  actions: string;
  status: ProductHealthReview['status'];
}

interface IntegrationPayload {
  providerType: IntegrationConnection['providerType'];
  name: string;
  externalRef?: string;
  scopedAccessNote?: string;
  status: IntegrationConnection['status'];
}

interface SignalPayload {
  milestoneId?: string;
  criterionId?: string;
  signalType: string;
  status: IntegrationSignal['status'];
  summary?: string;
  evidencePayload?: string;
}

interface ScannerUploadPayload {
  productId: string;
  workspaceId: string;
  sourceId?: string;
  toolName: string;
  toolVersion: string;
  format: 'SARIF' | 'JSON' | 'JUNIT' | 'LOG';
  artifactFileName: string;
  artifactPayload: string;
  milestoneId?: string;
}

interface WorkspaceScannerReadinessPayload {
  createCriteria: boolean;
  createServiceRecommendations: boolean;
  includeAcceptedRisk: boolean;
  summary: string;
}

const workspaceAccent = (status?: string) => {
  if (!status) return appleColors.purple;
  if (status.includes('BLOCK')) return appleColors.red;
  if (status.includes('REVIEW') || status.includes('NEGOTIATION') || status.includes('AWAITING')) return appleColors.amber;
  if (status.includes('ACTIVE') || status.includes('DELIVER') || status.includes('SUPPORT')) return appleColors.green;
  return appleColors.purple;
};

const attachmentKey = (scopeType: AttachmentScope, scopeId: string) => `${scopeType}:${scopeId}`;

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Request failed');

export default function WorkspaceCommandPage() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canCoordinate = hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER, UserRole.TEAM_MANAGER]);
  const canAttachEvidence = hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER, UserRole.TEAM_MANAGER, UserRole.SPECIALIST]);

  const packages = useQuery({ queryKey: ['packages'], queryFn: () => getJson<PackageInstance[]>('/packages') });
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: () => getJson<ProjectWorkspace[]>('/workspaces') });
  const teams = useQuery({ queryKey: ['teams'], queryFn: () => getJson<Team[]>('/teams') });

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [attachmentFilesByKey, setAttachmentFilesByKey] = useState<Record<string, File | null>>({});
  const [attachmentLabelsByKey, setAttachmentLabelsByKey] = useState<Record<string, string>>({});
  const [attachmentProgressByKey, setAttachmentProgressByKey] = useState<Record<string, number>>({});
  const [attachmentErrorsByKey, setAttachmentErrorsByKey] = useState<Record<string, string>>({});
  const [uploadingAttachmentKey, setUploadingAttachmentKey] = useState('');
  const [attachmentOpenError, setAttachmentOpenError] = useState('');
  const [supportStatusById, setSupportStatusById] = useState<Record<string, SupportRequest['status']>>({});
  const [supportResolutionById, setSupportResolutionById] = useState<Record<string, string>>({});
  const [disputeStatusById, setDisputeStatusById] = useState<Record<string, DisputeCase['status']>>({});
  const [disputeResolutionById, setDisputeResolutionById] = useState<Record<string, string>>({});
  const [governanceNotice, setGovernanceNotice] = useState('');
  const [integrationProvider, setIntegrationProvider] = useState<IntegrationConnection['providerType']>('GITHUB');
  const [workspaceView, setWorkspaceView] = useState<WorkspaceCommandView>('overview');
  const [scannerUploadForm, setScannerUploadForm] = useState({
    toolName: 'CodeQL',
    toolVersion: '',
    format: 'SARIF' as ScannerUploadPayload['format'],
    artifactFileName: 'workspace-evidence.sarif',
    artifactPayload: '',
    milestoneId: '',
  });

  const workspaceForm = useAdvancedForm<WorkspacePayload>({
    initialValues: { packageInstanceId: '', name: '', status: 'ACTIVE_DELIVERY' },
    validationRules: {
      packageInstanceId: [{ type: 'required', message: 'Service plan is required' }],
    },
  });
  const milestoneForm = useAdvancedForm<MilestonePayload>({
    initialValues: { title: '', description: '', dueDate: null, status: 'PLANNED' },
    validationRules: {
      title: [{ type: 'required', message: 'Milestone title is required' }],
    },
  });
  const deliverableForm = useAdvancedForm<DeliverablePayload>({
    initialValues: { title: '', evidence: '', status: 'PENDING' },
    validationRules: {
      title: [{ type: 'required', message: 'Deliverable title is required' }],
    },
  });
  const participantForm = useAdvancedForm<ParticipantPayload>({
    initialValues: { email: '', role: 'SPECIALIST', active: true },
    validationRules: {
      email: [
        { type: 'required', message: 'Participant email is required' },
        { type: 'email', message: 'Use a valid email address' },
      ],
    },
  });
  const supportForm = useAdvancedForm<SupportRequestPayload>({
    initialValues: {
      supportSubscriptionId: null,
      teamId: null,
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'OPEN',
      dueOn: null,
    },
    validationRules: {
      title: [{ type: 'required', message: 'Support title is required' }],
      description: [{ type: 'required', message: 'Support context is required' }],
    },
  });
  const disputeForm = useAdvancedForm<DisputePayload>({
    initialValues: { teamId: null, title: '', description: '', severity: 'MEDIUM', responseDueOn: null },
    validationRules: {
      title: [{ type: 'required', message: 'Risk title is required' }],
      description: [{ type: 'required', message: 'Risk context is required' }],
    },
  });

  const workspaceList = useMemo(() => sortWorkspacesForOwner(workspaces.data || []), [workspaces.data]);
  const selectedWorkspace = useMemo(
    () => workspaceList.find((workspace) => workspace.id === selectedWorkspaceId) || workspaceList[0],
    [workspaceList, selectedWorkspaceId]
  );
  const selectedWorkspaceProductId = selectedWorkspace?.packageInstance?.productProfile?.id || '';

  useEffect(() => {
    if (!selectedWorkspaceId && workspaceList[0]) setSelectedWorkspaceId(workspaceList[0].id);
  }, [selectedWorkspaceId, workspaceList]);

  const milestones = useQuery({
    queryKey: ['workspaces', selectedWorkspace?.id, 'milestones'],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<Milestone[]>(`/workspaces/${selectedWorkspace?.id}/milestones`),
  });
  const milestoneList = milestones.data || [];
  const selectedMilestone = useMemo(
    () => milestoneList.find((milestone) => milestone.id === selectedMilestoneId) || milestoneList[0],
    [milestoneList, selectedMilestoneId]
  );

  useEffect(() => {
    if (!selectedMilestoneId && milestoneList[0]) setSelectedMilestoneId(milestoneList[0].id);
  }, [selectedMilestoneId, milestoneList]);

  const deliverables = useQuery({
    queryKey: ['workspaces', 'milestones', selectedMilestone?.id, 'deliverables'],
    enabled: !!selectedMilestone?.id,
    queryFn: () => getJson<Deliverable[]>(`/workspaces/milestones/${selectedMilestone?.id}/deliverables`),
  });
  const participants = useQuery({
    queryKey: ['workspaces', selectedWorkspace?.id, 'participants'],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<WorkspaceParticipant[]>(`/workspaces/${selectedWorkspace?.id}/participants`),
  });
  const supportRequests = useQuery({
    queryKey: ['commerce-support-requests', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<SupportRequest[]>(`/commerce/workspaces/${selectedWorkspace?.id}/support-requests`),
  });
  const disputes = useQuery({
    queryKey: ['commerce-disputes', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<DisputeCase[]>(`/commerce/workspaces/${selectedWorkspace?.id}/disputes`),
  });
  const attachments = useQuery({
    queryKey: ['attachments', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<EvidenceAttachment[]>(`/attachments?workspaceId=${selectedWorkspace?.id}`),
  });
  const governance = useQuery({
    queryKey: ['productization-engine', 'workspace-governance', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<WorkspaceGovernance>(`/productization-engine/workspaces/${selectedWorkspace?.id}/governance`),
  });
  const scannerEvidence = useQuery({
    queryKey: ['scanner-evidence', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<ScannerEvidenceItem[]>(`/scanner/evidence?workspaceId=${selectedWorkspace?.id}`),
  });
  const workspaceScannerReadiness = useQuery({
    queryKey: ['productization-engine', 'workspace-scanner-readiness', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<WorkspaceScannerReadiness>(`/productization-engine/workspaces/${selectedWorkspace?.id}/scanner-readiness`),
  });
  const shipConfidence = useQuery({
    queryKey: ['productization-engine', 'workspace-ship-confidence', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<ShipConfidenceHistory>(`/productization-engine/workspaces/${selectedWorkspace?.id}/ship-confidence`),
  });
  const launchReadinessReport = useQuery({
    queryKey: ['productization-engine', 'workspace-launch-readiness-report', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    retry: false,
    queryFn: async () => {
      try {
        return await getJson<LaunchReadinessReport>(`/productization-engine/workspaces/${selectedWorkspace?.id}/launch-readiness-report/latest`);
      } catch (error: any) {
        if (error?.response?.status === 400 && String(error?.response?.data?.detail || '').includes('No launch readiness report')) {
          return null;
        }
        throw error;
      }
    },
  });

  const attachmentsByScope = useMemo(
    () =>
      (attachments.data || []).reduce<Record<string, EvidenceAttachment[]>>((grouped, attachment) => {
        const key = attachmentKey(attachment.scopeType, attachment.scopeId);
        grouped[key] = [...(grouped[key] || []), attachment];
        return grouped;
      }, {}),
    [attachments.data]
  );

  const createWorkspace = useMutation({
    mutationFn: () => postJson<ProjectWorkspace, WorkspacePayload>('/workspaces', workspaceForm.values),
    onSuccess: async (workspace) => {
      workspaceForm.resetForm();
      setSelectedWorkspaceId(workspace.id);
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
  const createMilestone = useMutation({
    mutationFn: () => postJson<Milestone, MilestonePayload>(`/workspaces/${selectedWorkspace?.id}/milestones`, milestoneForm.values),
    onSuccess: async (milestone) => {
      milestoneForm.resetForm();
      setSelectedMilestoneId(milestone.id);
      await queryClient.invalidateQueries({ queryKey: ['workspaces', selectedWorkspace?.id, 'milestones'] });
    },
  });
  const createDeliverable = useMutation({
    mutationFn: () => postJson<Deliverable, DeliverablePayload>(`/workspaces/milestones/${selectedMilestone?.id}/deliverables`, deliverableForm.values),
    onSuccess: async () => {
      deliverableForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['workspaces', 'milestones', selectedMilestone?.id, 'deliverables'] });
    },
  });
  const addParticipant = useMutation({
    mutationFn: () => postJson<WorkspaceParticipant, ParticipantPayload>(`/workspaces/${selectedWorkspace?.id}/participants`, participantForm.values),
    onSuccess: async () => {
      participantForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['workspaces', selectedWorkspace?.id, 'participants'] });
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
  const createSupport = useMutation({
    mutationFn: () => postJson<SupportRequest, SupportRequestPayload>(`/commerce/workspaces/${selectedWorkspace?.id}/support-requests`, supportForm.values),
    onSuccess: async () => {
      supportForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['commerce-support-requests', selectedWorkspace?.id] });
    },
  });
  const updateSupport = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SupportStatusPayload }) =>
      putJson<SupportRequest, SupportStatusPayload>(`/commerce/support-requests/${id}/status`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['commerce-support-requests', selectedWorkspace?.id] });
    },
  });
  const createDispute = useMutation({
    mutationFn: () => postJson<DisputeCase, DisputePayload>(`/commerce/workspaces/${selectedWorkspace?.id}/disputes`, disputeForm.values),
    onSuccess: async () => {
      disputeForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['commerce-disputes', selectedWorkspace?.id] });
    },
  });
  const updateDispute = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DisputeStatusPayload }) =>
      putJson<DisputeCase, DisputeStatusPayload>(`/commerce/disputes/${id}/status`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['commerce-disputes', selectedWorkspace?.id] });
    },
  });
  const uploadAttachment = useMutation({
    mutationFn: (input: { key: string; scopeType: AttachmentScope; scopeId: string; file: File; label?: string | undefined }) => {
      setUploadingAttachmentKey(input.key);
      setAttachmentErrorsByKey((current) => ({ ...current, [input.key]: '' }));
      return uploadService.uploadEvidenceAttachment(
        { scopeType: input.scopeType, scopeId: input.scopeId, file: input.file, label: input.label },
        (progress) => setAttachmentProgressByKey((current) => ({ ...current, [input.key]: progress }))
      );
    },
    onSuccess: async (_attachment, input) => {
      setAttachmentFilesByKey((current) => ({ ...current, [input.key]: null }));
      setAttachmentLabelsByKey((current) => ({ ...current, [input.key]: '' }));
      setAttachmentProgressByKey((current) => ({ ...current, [input.key]: 0 }));
      await queryClient.invalidateQueries({ queryKey: ['attachments', selectedWorkspace?.id] });
    },
    onError: (error, input) => {
      setAttachmentErrorsByKey((current) => ({ ...current, [input.key]: errorMessage(error) }));
    },
    onSettled: () => setUploadingAttachmentKey(''),
  });
  const refreshGovernance = async () => {
    await queryClient.invalidateQueries({ queryKey: ['productization-engine', 'workspace-governance', selectedWorkspace?.id] });
    await queryClient.invalidateQueries({ queryKey: ['productization-engine', 'workspace-scanner-readiness', selectedWorkspace?.id] });
    await queryClient.invalidateQueries({ queryKey: ['productization-engine', 'workspace-ship-confidence', selectedWorkspace?.id] });
    await queryClient.invalidateQueries({ queryKey: ['productization-engine', 'workspace-launch-readiness-report', selectedWorkspace?.id] });
    await queryClient.invalidateQueries({ queryKey: ['workspaces', selectedWorkspace?.id, 'milestones'] });
  };
  const generateCriteria = useMutation({
    mutationFn: () => postJson<AcceptanceCriterion[], Record<string, never>>(`/productization-engine/milestones/${selectedMilestone?.id}/criteria/generate`, {}),
    onSuccess: async () => {
      setGovernanceNotice('Acceptance criteria generated from the service plan.');
      await refreshGovernance();
    },
  });
  const updateEvidenceRequirement = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EvidenceStatusPayload }) =>
      putJson<EvidenceRequirement, EvidenceStatusPayload>(`/productization-engine/evidence-requirements/${id}`, payload),
    onSuccess: async () => {
      setGovernanceNotice('Evidence requirement updated.');
      await refreshGovernance();
    },
  });
  const createCheck = useMutation({
    mutationFn: ({ criterionId, payload }: { criterionId: string; payload: CheckPayload }) =>
      postJson<AutomatedCheck, CheckPayload>(`/productization-engine/criteria/${criterionId}/checks`, payload),
    onSuccess: async () => {
      setGovernanceNotice('Manual check recorded.');
      await refreshGovernance();
    },
  });
  const reviewCriterion = useMutation({
    mutationFn: ({ criterionId, payload }: { criterionId: string; payload: ReviewPayload }) =>
      postJson<ReviewDecision, ReviewPayload>(`/productization-engine/criteria/${criterionId}/reviews`, payload),
    onSuccess: async () => {
      setGovernanceNotice('Review decision recorded.');
      await refreshGovernance();
    },
  });
  const upsertHandoff = useMutation({
    mutationFn: () =>
      postJson<HandoffDocument, HandoffPayload>(`/productization-engine/workspaces/${selectedWorkspace?.id}/handoff`, {
        title: `${selectedWorkspace?.name || 'Workspace'} owner handoff`,
        runbook: 'Operating runbook, release notes, rollback path, monitoring ownership, and escalation contacts are ready for owner review.',
        accessChecklist: 'Repository, deployment, database, monitoring, support, and billing access boundaries reviewed.',
        knownIssues: 'Open risks are tracked in the workspace risk section before handoff acceptance.',
        supportScope: 'Post-launch support covers monitoring, incident response, minor fixes, and owner health reporting.',
        status: 'READY_FOR_OWNER',
      }),
    onSuccess: async () => {
      setGovernanceNotice('Handoff document prepared for owner review.');
      await refreshGovernance();
    },
  });
  const createHealthReview = useMutation({
    mutationFn: () =>
      postJson<ProductHealthReview, HealthPayload>(`/productization-engine/workspaces/${selectedWorkspace?.id}/health-reviews`, {
        healthScore: Math.max(55, workspaceProgress || 70),
        summary: 'Workspace health review generated from milestone acceptance, open support, risk, and evidence status.',
        risks: disputeList.length ? `${disputeList.length} open workspace risk records need review.` : 'No open workspace disputes are recorded.',
        actions: supportList.length ? 'Review support requests and close overdue items before owner handoff.' : 'Keep evidence current and prepare handoff acceptance.',
        status: 'PUBLISHED',
      }),
    onSuccess: async () => {
      setGovernanceNotice('Health review published.');
      await refreshGovernance();
    },
  });
  const createIntegration = useMutation({
    mutationFn: (payload: IntegrationPayload) =>
      postJson<IntegrationConnection, IntegrationPayload>(`/productization-engine/workspaces/${selectedWorkspace?.id}/integrations`, payload),
    onSuccess: async () => {
      setGovernanceNotice('Integration connection registered.');
      await refreshGovernance();
    },
  });
  const createIntegrationSignal = useMutation({
    mutationFn: ({ connectionId, payload }: { connectionId: string; payload: SignalPayload }) =>
      postJson<IntegrationSignal, SignalPayload>(`/productization-engine/integrations/${connectionId}/signals`, payload),
    onSuccess: async () => {
      setGovernanceNotice('Integration signal recorded and linked to acceptance evidence.');
      await refreshGovernance();
    },
  });
  const enrichScannerReadiness = useMutation({
    mutationFn: () =>
      postJson<WorkspaceScannerReadiness, WorkspaceScannerReadinessPayload>(`/productization-engine/workspaces/${selectedWorkspace?.id}/scanner-readiness/enrich`, {
        createCriteria: true,
        createServiceRecommendations: true,
        includeAcceptedRisk: false,
        summary: 'Owner requested workspace scanner readiness refresh from the workspace board.',
      }),
    onSuccess: async () => {
      setGovernanceNotice('Workspace scanner readiness refreshed and linked to milestone evidence.');
      await refreshGovernance();
      await queryClient.invalidateQueries({ queryKey: ['scanner-evidence', selectedWorkspace?.id] });
    },
  });
  const generateLaunchReadinessReport = useMutation({
    mutationFn: () =>
      postJson<LaunchReadinessReport, { focus: string }>(`/productization-engine/workspaces/${selectedWorkspace?.id}/launch-readiness-report`, {
        focus: 'Summarize launch readiness for a prototype-to-product owner decision using current workspace proof, scanner findings, and selected services.',
      }),
    onSuccess: async () => {
      setGovernanceNotice('Launch readiness report generated from this workspace evidence.');
      await refreshGovernance();
    },
  });
  const uploadScannerEvidence = useMutation({
    mutationFn: () => {
      const payload: ScannerUploadPayload = {
        productId: selectedWorkspaceProductId,
        workspaceId: selectedWorkspace?.id || '',
        toolName: scannerUploadForm.toolName,
        toolVersion: scannerUploadForm.toolVersion,
        format: scannerUploadForm.format,
        artifactFileName: scannerUploadForm.artifactFileName,
        artifactPayload: scannerUploadForm.artifactPayload,
      };
      const milestoneId = scannerUploadForm.milestoneId || selectedMilestone?.id;
      if (milestoneId) payload.milestoneId = milestoneId;
      return postJson<ScanRun, ScannerUploadPayload>('/scanner/runs/ci-upload', payload);
    },
    onSuccess: async () => {
      setScannerUploadForm((current) => ({ ...current, artifactPayload: '' }));
      setGovernanceNotice('Scanner evidence normalized and attached to this workspace.');
      await queryClient.invalidateQueries({ queryKey: ['scanner-evidence', selectedWorkspace?.id] });
      await refreshGovernance();
    },
  });

  const deliverableList = deliverables.data || [];
  const participantList = participants.data || [];
  const supportList = supportRequests.data || [];
  const disputeList = disputes.data || [];
  const scannerEvidenceList = scannerEvidence.data || [];
  const readiness = workspaceScannerReadiness.data;
  const readinessScore = readiness?.diagnosis?.readinessScore ?? (scannerEvidenceList.length ? 100 : 0);
  const readinessStatus = readiness?.blockerCount
    ? 'Blocked by scanner evidence'
    : readiness?.diagnosis
      ? 'Evidence mapped'
      : 'No scanner map yet';
  const milestoneRiskById = useMemo(
    () =>
      (readiness?.milestoneRisks || []).reduce<Record<string, WorkspaceScannerReadiness['milestoneRisks'][number]>>((byId, risk) => {
        byId[risk.milestoneId] = risk;
        return byId;
      }, {}),
    [readiness?.milestoneRisks]
  );
  const governanceCriteria = governance.data?.criteria || [];
  const selectedMilestoneCriteria = selectedMilestone?.id
    ? governanceCriteria.filter((criterion) => criterion.milestoneId === selectedMilestone.id)
    : governanceCriteria;
  const latestHandoff = governance.data?.handoffs?.[0];
  const latestHealthReview = governance.data?.healthReviews?.[0];
  const integrationList = governance.data?.integrations || [];
  const latestIntegration = integrationList[0];
  const passedCriteriaCount = governanceCriteria.filter((criterion) => criterion.status === 'PASSED' || criterion.status === 'WAIVED').length;
  const missingEvidenceCount = governanceCriteria.flatMap((criterion) => criterion.evidenceRequirements).filter((requirement) => requirement.required && requirement.status === 'MISSING').length;
  const activeWorkspaceCount = workspaceList.filter((workspace) => workspace.status === 'ACTIVE_DELIVERY').length;
  const completedMilestones = milestoneList.filter((milestone) => milestone.status === 'ACCEPTED').length;
  const blockedItems = workspaceList.filter((workspace) => workspace.status === 'BLOCKED').length
    + supportList.filter((request) => request.priority === 'URGENT' || request.slaStatus === 'OVERDUE' || request.slaStatus === 'ESCALATED').length
    + disputeList.filter((dispute) => dispute.status !== 'RESOLVED' && dispute.status !== 'CANCELLED').length;
  const roughEdgeCount = supportList.length + disputeList.length;
  const workspaceProgress = milestoneList.length ? Math.round((completedMilestones / milestoneList.length) * 100) : 0;

  const scopedAttachments = (scopeType: AttachmentScope, scopeId: string) => attachmentsByScope[attachmentKey(scopeType, scopeId)] || [];
  const setAttachmentFile = (scopeType: AttachmentScope, scopeId: string, file: File | null) => {
    const key = attachmentKey(scopeType, scopeId);
    setAttachmentFilesByKey((current) => ({ ...current, [key]: file }));
    setAttachmentErrorsByKey((current) => ({ ...current, [key]: '' }));
  };
  const submitAttachment = (scopeType: AttachmentScope, scopeId: string) => {
    const key = attachmentKey(scopeType, scopeId);
    const file = attachmentFilesByKey[key];
    if (!file) {
      setAttachmentErrorsByKey((current) => ({ ...current, [key]: 'Choose a file before uploading evidence.' }));
      return;
    }
    uploadAttachment.mutate({ key, scopeType, scopeId, file, label: attachmentLabelsByKey[key] || undefined });
  };
  const openAttachment = async (attachment: EvidenceAttachment) => {
    setAttachmentOpenError('');
    const popup = window.open('about:blank', '_blank');
    try {
      const response = await getJson<AttachmentDownloadUrl>(`/attachments/${attachment.id}/download-url`);
      if (popup) {
        popup.opener = null;
        popup.location.href = response.downloadUrl;
      } else {
        window.location.assign(response.downloadUrl);
      }
    } catch (error) {
      popup?.close();
      setAttachmentOpenError(errorMessage(error));
    }
  };
  const evidencePanel = (scopeType: AttachmentScope, scopeId: string) => {
    const key = attachmentKey(scopeType, scopeId);
    const selectedFile = attachmentFilesByKey[key] || null;
    const isUploading = uploadingAttachmentKey === key && uploadAttachment.isPending;

    return (
      <WorkspaceEvidenceAttachmentPanel
        attachments={scopedAttachments(scopeType, scopeId)}
        canAttachEvidence={canAttachEvidence}
        selectedFile={selectedFile}
        labelValue={attachmentLabelsByKey[key] || ''}
        isUploading={isUploading}
        error={attachmentErrorsByKey[key]}
        progress={attachmentProgressByKey[key]}
        onOpenAttachment={openAttachment}
        onFileSelect={(file) => setAttachmentFile(scopeType, scopeId, file)}
        onClear={() => setAttachmentFile(scopeType, scopeId, null)}
        onLabelChange={(value) => setAttachmentLabelsByKey((current) => ({ ...current, [key]: value }))}
        onSubmit={() => submitAttachment(scopeType, scopeId)}
      />
    );
  };

  return (
    <>
      <PageHeader
        title="Productization Workspaces"
        description="One focused place to turn a prototype into a shippable product: fixes, proof, people, and next launch decisions."
      />
      <QueryState
        isLoading={packages.isLoading || workspaces.isLoading || teams.isLoading || milestones.isLoading || deliverables.isLoading || participants.isLoading || supportRequests.isLoading || disputes.isLoading || attachments.isLoading || governance.isLoading || scannerEvidence.isLoading || workspaceScannerReadiness.isLoading || shipConfidence.isLoading || launchReadinessReport.isLoading}
        error={
          packages.error
          || workspaces.error
          || teams.error
          || milestones.error
          || deliverables.error
          || participants.error
          || supportRequests.error
          || disputes.error
          || attachments.error
          || governance.error
          || scannerEvidence.error
          || workspaceScannerReadiness.error
          || shipConfidence.error
          || launchReadinessReport.error
          || createWorkspace.error
          || createMilestone.error
          || createDeliverable.error
          || addParticipant.error
          || createSupport.error
          || updateSupport.error
          || createDispute.error
          || updateDispute.error
          || uploadAttachment.error
          || generateCriteria.error
          || updateEvidenceRequirement.error
          || createCheck.error
          || reviewCriterion.error
          || upsertHandoff.error
          || createHealthReview.error
          || createIntegration.error
          || createIntegrationSignal.error
          || enrichScannerReadiness.error
          || generateLaunchReadinessReport.error
          || uploadScannerEvidence.error
        }
      />
      {governanceNotice && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setGovernanceNotice('')}>
          {governanceNotice}
        </Alert>
      )}
      {attachmentOpenError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setAttachmentOpenError('')}>
          {attachmentOpenError}
        </Alert>
      )}
      <WorkspaceCommandMetricsPanel
        activeWorkspaceCount={activeWorkspaceCount}
        blockedItems={blockedItems}
        completedMilestones={completedMilestones}
        scheduledMilestoneCount={milestoneList.filter((milestone) => milestone.dueDate).length}
        totalMilestoneCount={milestoneList.length}
        totalWorkspaceCount={workspaceList.length}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: '300px minmax(0, 1fr)',
            xl: '320px minmax(0, 1fr)',
          },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        <WorkspaceCommandSidebar
          packages={packages.data || []}
          workspaceList={workspaceList}
          selectedWorkspace={selectedWorkspace}
          workspaceForm={workspaceForm}
          isCreatingWorkspace={createWorkspace.isPending}
          onSelectWorkspace={(workspaceId) => {
            setSelectedWorkspaceId(workspaceId);
            setSelectedMilestoneId('');
          }}
          onCreateWorkspace={() => createWorkspace.mutate()}
        />

        <Stack spacing={2}>
          {selectedWorkspace ? (
            <>
              <WorkspaceCommandHero
                workspace={selectedWorkspace}
                progress={workspaceProgress}
                accent={workspaceAccent(selectedWorkspace.status)}
                milestoneCount={milestoneList.length}
                participantCount={participantList.length}
                deliverableCount={deliverableList.length}
                proofFileCount={scopedAttachments('WORKSPACE', selectedWorkspace.id).length}
                roughEdgeCount={roughEdgeCount}
              />

              {(milestones.isFetching || deliverables.isFetching || supportRequests.isFetching || disputes.isFetching || attachments.isFetching) && <LinearProgress />}

              <WorkspaceCommandJourneyNav
                value={workspaceView}
                onChange={setWorkspaceView}
                priorityFixes={readiness?.blockerCount || 0}
                proofGaps={readiness?.missingEvidenceCount || missingEvidenceCount}
                milestoneCount={milestoneList.length}
                participantCount={participantList.length}
                supportCount={supportList.length}
                riskCount={disputeList.length}
                integrationCount={integrationList.length}
                hasHandoff={!!latestHandoff}
              />

              {workspaceView === 'overview' && (
                <WorkspaceOverviewDeliveryAnswerPanel
                  blockerCount={readiness?.blockerCount || 0}
                  deliverableList={deliverableList}
                  milestoneCount={milestoneList.length}
                  missingEvidenceCount={missingEvidenceCount}
                  productId={selectedWorkspaceProductId}
                  roughEdgeCount={roughEdgeCount}
                  scannerEvidenceCount={scannerEvidenceList.length}
                  selectedMilestone={selectedMilestone}
                  selectedMilestoneCriteria={selectedMilestoneCriteria}
                  workspace={selectedWorkspace}
                  onPrepareHandoff={() => setWorkspaceView(roughEdgeCount ? 'team' : 'handoff')}
                  onReviewProof={() => setWorkspaceView('proof')}
                />
              )}

              {workspaceView === 'proof' && (
                <>
                  <WorkspaceProofReadinessPanel
                    canRefresh={!!selectedWorkspaceProductId}
                    isGeneratingLaunchReport={generateLaunchReadinessReport.isPending}
                    isLaunchReportLoading={launchReadinessReport.isFetching}
                    isRefreshing={enrichScannerReadiness.isPending}
                    isScannerLoading={workspaceScannerReadiness.isFetching}
                    isShipConfidenceLoading={shipConfidence.isFetching}
                    launchReport={launchReadinessReport.data ?? null}
                    productId={selectedWorkspaceProductId}
                    readiness={readiness}
                    readinessScore={readinessScore}
                    readinessStatus={readinessStatus}
                    scannerEvidenceCount={scannerEvidenceList.length}
                    selectedMilestone={selectedMilestone}
                    shipConfidence={shipConfidence.data}
                    workspace={selectedWorkspace}
                    onGenerateLaunchReport={() => generateLaunchReadinessReport.mutate()}
                    onRefresh={() => enrichScannerReadiness.mutate()}
                  />

              <WorkspaceProofMilestonesPanel
                milestoneList={milestoneList}
                selectedMilestone={selectedMilestone}
                deliverableList={deliverableList}
                milestoneRiskById={milestoneRiskById}
                milestoneForm={milestoneForm}
                deliverableForm={deliverableForm}
                isCreatingMilestone={createMilestone.isPending}
                isCreatingDeliverable={createDeliverable.isPending}
                onCreateMilestone={() => createMilestone.mutate()}
                onCreateDeliverable={() => createDeliverable.mutate()}
                onSelectMilestone={setSelectedMilestoneId}
                evidencePanel={evidencePanel}
              />

              <WorkspaceProofEvidencePanel
                workspaceId={selectedWorkspace.id}
                proofFileCount={scopedAttachments('WORKSPACE', selectedWorkspace.id).length}
                scannerEvidenceList={scannerEvidenceList}
                milestoneList={milestoneList}
                selectedMilestone={selectedMilestone}
                scannerUploadForm={scannerUploadForm}
                isUploadingScannerEvidence={uploadScannerEvidence.isPending}
                canSubmitScannerEvidence={!!selectedWorkspaceProductId && !!scannerUploadForm.toolName.trim() && !!scannerUploadForm.artifactPayload.trim()}
                onScannerUploadFormChange={setScannerUploadForm}
                onSubmitScannerEvidence={() => uploadScannerEvidence.mutate()}
                evidencePanel={evidencePanel}
              />

              <WorkspaceAcceptanceReviewPanel
                selectedMilestone={selectedMilestone}
                criteria={selectedMilestoneCriteria}
                totalCriteriaCount={governanceCriteria.length}
                passedCriteriaCount={passedCriteriaCount}
                isGovernanceFetching={governance.isFetching}
                isGeneratingCriteria={generateCriteria.isPending}
                isUpdatingEvidenceRequirement={updateEvidenceRequirement.isPending}
                isCreatingCheck={createCheck.isPending}
                isReviewingCriterion={reviewCriterion.isPending}
                onGenerateCriteria={() => generateCriteria.mutate()}
                onUpdateEvidenceRequirement={(id, payload) => updateEvidenceRequirement.mutate({ id, payload })}
                onCreateCheck={(criterionId, payload) => createCheck.mutate({ criterionId, payload })}
                onReviewCriterion={(criterionId, payload) => reviewCriterion.mutate({ criterionId, payload })}
              />
                </>
              )}
            </>
          ) : (
            <Surface>
              <EmptyState label="Open or create a workspace to coordinate milestones, evidence, and delivery participants." />
            </Surface>
          )}
        </Stack>

        <Stack
          spacing={2}
          sx={{
            display: selectedWorkspace && (workspaceView === 'team' || workspaceView === 'handoff') ? 'flex' : 'none',
            gridColumn: { lg: '2 / -1' },
          }}
        >
          {workspaceView === 'team' && (
            <WorkspaceCommandTeamPanels
              canCoordinate={canCoordinate}
              teams={teams.data || []}
              participantList={participantList}
              supportList={supportList}
              disputeList={disputeList}
              participantForm={participantForm}
              supportForm={supportForm}
              disputeForm={disputeForm}
              isAddingParticipant={addParticipant.isPending}
              isCreatingSupport={createSupport.isPending}
              isUpdatingSupport={updateSupport.isPending}
              isCreatingDispute={createDispute.isPending}
              isUpdatingDispute={updateDispute.isPending}
              supportStatusById={supportStatusById}
              supportResolutionById={supportResolutionById}
              disputeStatusById={disputeStatusById}
              disputeResolutionById={disputeResolutionById}
              onAddParticipant={() => addParticipant.mutate()}
              onCreateSupport={() => createSupport.mutate()}
              onUpdateSupport={(id, payload) => updateSupport.mutate({ id, payload })}
              onCreateDispute={() => createDispute.mutate()}
              onUpdateDispute={(id, payload) => updateDispute.mutate({ id, payload })}
              onSupportStatusChange={(id, status) => setSupportStatusById((current) => ({ ...current, [id]: status }))}
              onSupportResolutionChange={(id, resolution) => setSupportResolutionById((current) => ({ ...current, [id]: resolution }))}
              onDisputeStatusChange={(id, status) => setDisputeStatusById((current) => ({ ...current, [id]: status }))}
              onDisputeResolutionChange={(id, resolution) => setDisputeResolutionById((current) => ({ ...current, [id]: resolution }))}
              evidencePanel={evidencePanel}
            />
          )}
          {selectedWorkspace && workspaceView === 'handoff' && (
            <WorkspaceCommandHandoffPanels
              workspace={selectedWorkspace}
              productId={selectedWorkspaceProductId}
              selectedMilestone={selectedMilestone}
              completedCheckpointCount={milestoneList.filter((milestone) => ['ACCEPTED', 'COMPLETED', 'DONE'].includes(milestone.status)).length}
              milestoneCount={milestoneList.length}
              supportCount={supportList.length}
              riskCount={disputeList.length}
              missingEvidenceCount={missingEvidenceCount}
              workspaceProgress={workspaceProgress}
              canCoordinate={canCoordinate}
              latestHandoff={latestHandoff}
              latestHealthReview={latestHealthReview}
              integrationList={integrationList}
              latestIntegration={latestIntegration}
              integrationProvider={integrationProvider}
              isPreparingHandoff={upsertHandoff.isPending}
              isPublishingHealthReview={createHealthReview.isPending}
              isCreatingIntegration={createIntegration.isPending}
              isRecordingSignal={createIntegrationSignal.isPending}
              onIntegrationProviderChange={setIntegrationProvider}
              onPrepareHandoff={() => upsertHandoff.mutate()}
              onPublishHealthReview={() => createHealthReview.mutate()}
              onCreateIntegration={(providerType) => createIntegration.mutate({
                providerType,
                name: `${formatLabel(providerType)} workspace connection`,
                externalRef: `${selectedWorkspace.name}-${providerType.toLowerCase()}`,
                scopedAccessNote: 'Workspace-scoped access only; no long-lived broad permissions recorded.',
                status: 'CONFIGURED',
              })}
              onRecordIntegrationSignal={(connectionId) => createIntegrationSignal.mutate({
                connectionId,
                payload: {
                  ...(selectedMilestone?.id ? { milestoneId: selectedMilestone.id } : {}),
                  ...(selectedMilestoneCriteria[0]?.id ? { criterionId: selectedMilestoneCriteria[0].id } : {}),
                  signalType: 'workspace-readiness-signal',
                  status: missingEvidenceCount ? 'WARNING' : 'PASSED',
                  summary: missingEvidenceCount ? 'Integration signal recorded with missing acceptance evidence.' : 'Integration signal supports current acceptance evidence.',
                  evidencePayload: JSON.stringify({ workspaceId: selectedWorkspace.id, missingEvidenceCount }),
                },
              })}
            />
          )}
        </Stack>
      </Box>
    </>
  );
}
