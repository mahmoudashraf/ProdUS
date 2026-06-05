'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AddOutlined,
  AutoAwesomeOutlined,
  CalendarMonthOutlined,
  CloudUploadOutlined,
  ErrorOutlineOutlined,
  FactCheckOutlined,
  ShieldOutlined,
  SyncOutlined,
  TaskAltOutlined,
} from '@mui/icons-material';
import { Alert, Box, Button, Divider, LinearProgress, Link, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FileUpload from '@/components/ui-component/FileUpload';
import { useAdvancedForm } from '@/hooks/enterprise';
import useAuth from '@/hooks/useAuth';
import { uploadService } from '@/services/uploadService';
import { UserRole } from '@/types/auth';
import { getJson, postJson, putJson } from './api';
import PlatformAssistantCard from './PlatformAssistantCard';
import { sortWorkspacesForOwner } from './displayOrder';
import {
  DotLabel,
  EmptyState,
  MetricTile,
  PageHeader,
  PastelChip,
  ProgressRing,
  QueryState,
  SectionTitle,
  StatusChip,
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
  Milestone,
  PackageInstance,
  ProductHealthReview,
  ProjectWorkspace,
  ReviewDecision,
  ScannerEvidenceItem,
  ScanRun,
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

const participantRoles: WorkspaceParticipant['role'][] = ['COORDINATOR', 'TEAM_LEAD', 'SPECIALIST', 'ADVISOR', 'VIEWER'];
const supportPriorities: SupportRequest['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const supportStatuses: SupportRequest['status'][] = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'WAITING_ON_OWNER', 'RESOLVED', 'CANCELLED'];
const disputeSeverities: DisputeCase['severity'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const disputeStatuses: DisputeCase['status'][] = ['OPEN', 'UNDER_REVIEW', 'OWNER_RESPONSE_NEEDED', 'TEAM_RESPONSE_NEEDED', 'RESOLVED', 'CANCELLED'];
const integrationProviderOptions: IntegrationConnection['providerType'][] = ['GITHUB', 'CI_CD', 'DEPENDENCY_SCAN', 'SECRETS_SCAN', 'DEPLOYMENT', 'MONITORING', 'DATABASE', 'ISSUE_TRACKER', 'SUPPORT_TOOL', 'OTHER'];

const workspaceAccent = (status?: string) => {
  if (!status) return appleColors.purple;
  if (status.includes('BLOCK')) return appleColors.red;
  if (status.includes('REVIEW') || status.includes('NEGOTIATION') || status.includes('AWAITING')) return appleColors.amber;
  if (status.includes('ACTIVE') || status.includes('DELIVER') || status.includes('SUPPORT')) return appleColors.green;
  return appleColors.purple;
};

const severityAccent = (severity?: string) => {
  if (severity === 'CRITICAL' || severity === 'HIGH') return appleColors.red;
  if (severity === 'MEDIUM') return appleColors.amber;
  if (severity === 'LOW') return appleColors.cyan;
  return appleColors.green;
};

const attachmentKey = (scopeType: AttachmentScope, scopeId: string) => `${scopeType}:${scopeId}`;

const fileSize = (bytes: number) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

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
      <Stack spacing={1} sx={{ mt: 1.25 }}>
        {scopedAttachments(scopeType, scopeId).map((attachment) => (
          <Box key={attachment.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, px: 1.25, py: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75} justifyContent="space-between">
              <Box>
                <Link component="button" type="button" underline="hover" variant="body2" onClick={() => openAttachment(attachment)} sx={{ cursor: 'pointer', textAlign: 'left' }}>
                  {attachment.label || attachment.fileName}
                </Link>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {attachment.fileName}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">{fileSize(attachment.sizeBytes)}</Typography>
            </Stack>
          </Box>
        ))}
        {canAttachEvidence && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: selectedFile ? 'minmax(220px, 1fr) 220px auto' : 'minmax(220px, 1fr)' }, gap: 1 }}>
            <FileUpload
              label="Attach evidence"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.csv,.json,.zip,.docx,.xlsx,.pptx"
              maxSize={10}
              selectedFile={selectedFile}
              loading={isUploading}
              error={attachmentErrorsByKey[key]}
              helperText={attachmentProgressByKey[key] ? `${attachmentProgressByKey[key]}% uploaded` : undefined}
              onFileSelect={(file) => setAttachmentFile(scopeType, scopeId, file)}
              onClear={() => setAttachmentFile(scopeType, scopeId, null)}
            />
            {selectedFile && (
              <>
                <TextField
                  size="small"
                  label="Evidence label"
                  value={attachmentLabelsByKey[key] || ''}
                  onChange={(event) => setAttachmentLabelsByKey((current) => ({ ...current, [key]: event.target.value }))}
                />
                <Button variant="contained" onClick={() => submitAttachment(scopeType, scopeId)} disabled={isUploading}>
                  Upload
                </Button>
              </>
            )}
          </Box>
        )}
      </Stack>
    );
  };

  return (
    <>
      <PageHeader
        title="Project Workspaces"
        description="One focused place to run a productization workspace: milestones, evidence, people, support, and risk."
      />
      <QueryState
        isLoading={packages.isLoading || workspaces.isLoading || teams.isLoading || milestones.isLoading || deliverables.isLoading || participants.isLoading || supportRequests.isLoading || disputes.isLoading || attachments.isLoading || governance.isLoading || scannerEvidence.isLoading || workspaceScannerReadiness.isLoading}
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
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2, mb: 2.5 }}>
        <MetricTile label="Active projects" value={activeWorkspaceCount} detail={`${workspaceList.length} total workspaces`} accent={appleColors.cyan} icon={<FactCheckOutlined />} />
        <MetricTile label="Milestones accepted" value={completedMilestones} detail={`${milestoneList.length} in selected workspace`} accent={appleColors.green} icon={<TaskAltOutlined />} />
        <MetricTile label="Needs attention" value={blockedItems} detail="Workspace, SLA, or dispute risk" accent={appleColors.red} icon={<ErrorOutlineOutlined />} />
        <MetricTile label="Dated milestones" value={milestoneList.filter((milestone) => milestone.dueDate).length} detail="Scheduled delivery checks" accent={appleColors.purple} icon={<CalendarMonthOutlined />} />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '300px minmax(0, 1fr) 320px', xl: '320px minmax(0, 1fr) 360px' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        <Stack spacing={2}>
          <Surface sx={{ maxHeight: { lg: 'calc(100vh - 260px)' }, overflow: { lg: 'auto' } }}>
            <SectionTitle title="Workspaces" action={<PastelChip label={`${workspaceList.length}`} accent={appleColors.cyan} bg="#e4f9fd" />} />
            {workspaceList.length ? (
              <Stack spacing={1}>
                {workspaceList.map((workspace) => (
                  <Button
                    key={workspace.id}
                    variant={selectedWorkspace?.id === workspace.id ? 'contained' : 'outlined'}
                    color={selectedWorkspace?.id === workspace.id ? 'primary' : 'inherit'}
                    onClick={() => {
                      setSelectedWorkspaceId(workspace.id);
                      setSelectedMilestoneId('');
                    }}
                    sx={{ justifyContent: 'space-between', minHeight: 56, textAlign: 'left', borderRadius: 1, gap: 1.5 }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workspace.name}</Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: selectedWorkspace?.id === workspace.id ? 'inherit' : 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {workspace.packageInstance?.productProfile?.name || workspace.packageInstance?.name || 'Service plan'}
                      </Typography>
                    </Box>
                    <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: workspaceAccent(workspace.status), flex: '0 0 auto' }} />
                  </Button>
                ))}
              </Stack>
            ) : (
              <EmptyState label="No workspaces have been opened yet." />
            )}
          </Surface>

          <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8f7ff)' }}>
            <SectionTitle title="Create Workspace" action={<AddOutlined sx={{ color: appleColors.purple }} />} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.6 }}>
              Use this when a service plan exists and delivery needs its own workspace.
            </Typography>
            <Box component="form" onSubmit={workspaceForm.handleSubmit(() => createWorkspace.mutate())}>
              <Stack spacing={1.5}>
                <TextField select fullWidth label="Service plan" value={workspaceForm.values.packageInstanceId} onChange={(event) => workspaceForm.setValue('packageInstanceId', event.target.value)}>
                  {(packages.data || []).map((item) => (
                    <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                  ))}
                </TextField>
                <TextField fullWidth label="Workspace name" value={workspaceForm.values.name} onChange={(event) => workspaceForm.setValue('name', event.target.value)} />
                <Button type="submit" variant="contained" disabled={!workspaceForm.values.packageInstanceId || createWorkspace.isPending} sx={{ minHeight: 42 }}>
                  Create workspace
                </Button>
              </Stack>
            </Box>
          </Surface>
        </Stack>

        <Stack spacing={2}>
          {selectedWorkspace ? (
            <>
              <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)' }}>
                <Stack direction={{ xs: 'column', xl: 'row' }} spacing={2.5} alignItems={{ xl: 'center' }} justifyContent="space-between">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <ProgressRing value={workspaceProgress} size={104} color={workspaceAccent(selectedWorkspace.status)} label="done" />
                    <Box>
                      <Typography variant="h2" sx={{ fontSize: { xs: 26, md: 30 }, lineHeight: 1.12 }}>{selectedWorkspace.name}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
                        {selectedWorkspace.packageInstance?.name || 'Service plan'} for {selectedWorkspace.packageInstance?.productProfile?.name || 'selected product'}.
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
                        <StatusChip label={selectedWorkspace.status} />
                        <PastelChip label={`${milestoneList.length} milestones`} accent={appleColors.purple} />
                        <PastelChip label={`${participantList.length} participants`} accent={appleColors.cyan} bg="#e4f9fd" />
                      </Stack>
                    </Box>
                  </Stack>
                  <Stack direction={{ xs: 'row', xl: 'column' }} spacing={0.75} flexWrap="wrap" useFlexGap>
                    <DotLabel label={`${deliverableList.length} deliverables in focus`} color={appleColors.green} />
                    <DotLabel label={`${scopedAttachments('WORKSPACE', selectedWorkspace.id).length} workspace evidence files`} color={appleColors.purple} />
                    <DotLabel label={`${supportList.length + disputeList.length} support/risk records`} color={supportList.length + disputeList.length ? appleColors.amber : appleColors.green} />
                  </Stack>
                </Stack>
              </Surface>

              {(milestones.isFetching || deliverables.isFetching || supportRequests.isFetching || disputes.isFetching || attachments.isFetching) && <LinearProgress />}

              <PlatformAssistantCard
                title="AI Launch Proof Advisor"
                description="Summarize what is supported, what is still fuzzy, and what decision is safe next."
                prompt={`Do not call tools for this answer. Use only the facts in this prompt and the supplied safe summaries. Create an owner-facing proof readiness note for the delivery named "${selectedWorkspace.name}". Product is ${selectedWorkspace.packageInstance?.productProfile?.name || 'not recorded'}. Service plan is ${selectedWorkspace.packageInstance?.name || 'not recorded'}. Current review area is "${selectedMilestone?.title || 'not selected'}", status ${selectedMilestone?.status || 'unknown'}. Deliverables in focus: ${deliverableList.slice(0, 5).map((deliverable) => `${deliverable.title} (${deliverable.status})`).join('; ') || 'none'}. Acceptance checklist: ${selectedMilestoneCriteria.slice(0, 5).map((criterion) => `${criterion.title} (${criterion.status})`).join('; ') || 'none generated'}. Missing proof count is ${missingEvidenceCount}. Scanner proof count is ${scannerEvidenceList.length}. Explain what is already supported, what is still missing, what needs human review, and what owner decision is safe next. Do not certify production readiness.`}
                conversationId={`workspace-evidence-advisor-${selectedWorkspace.id}-${selectedMilestone?.id || 'summary'}`}
                context={{
                  pageType: 'milestone-review',
                  productId: selectedWorkspaceProductId,
                  packageId: selectedWorkspace.packageInstance?.id,
                  workspaceId: selectedWorkspace.id,
                  milestoneId: selectedMilestone?.id,
                }}
                accent={missingEvidenceCount ? appleColors.amber : appleColors.green}
                cta="Review Proof"
              />

              <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f5fbff 46%, #fffaf2 100%)' }}>
                <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} alignItems={{ lg: 'center' }} justifyContent="space-between">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <ProgressRing
                      value={readinessScore}
                      size={110}
                      color={readiness?.blockerCount ? appleColors.red : readiness?.diagnosis ? appleColors.green : appleColors.cyan}
                      label="ready"
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <ShieldOutlined sx={{ color: readiness?.blockerCount ? appleColors.red : appleColors.cyan }} />
                        <Typography variant="h3" sx={{ fontSize: { xs: 22, md: 26 } }}>Scanner Fix Path</Typography>
                        <PastelChip label={readinessStatus} accent={readiness?.blockerCount ? appleColors.red : appleColors.green} bg={readiness?.blockerCount ? '#fff1f1' : '#e7f8ee'} />
                      </Stack>
                      <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6, maxWidth: 760 }}>
                        Scanner findings become clear fix paths, suggested services, and proof tasks. This is stored and deterministic; AI explanation only runs when you ask for it.
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
                        <PastelChip label={`${readiness?.mappedFindingCount || 0} mapped`} accent={appleColors.green} bg="#e7f8ee" />
                        <PastelChip label={`${readiness?.blockerCount || 0} priority fixes`} accent={readiness?.blockerCount ? appleColors.red : appleColors.green} bg={readiness?.blockerCount ? '#fff1f1' : '#e7f8ee'} />
                        <PastelChip label={`${readiness?.missingEvidenceCount || 0} proof gaps`} accent={readiness?.missingEvidenceCount ? appleColors.amber : appleColors.green} bg={readiness?.missingEvidenceCount ? '#fff4dc' : '#e7f8ee'} />
                        <PastelChip label={`${readiness?.unmappedFindingCount || 0} unmapped`} accent={readiness?.unmappedFindingCount ? appleColors.amber : appleColors.cyan} bg={readiness?.unmappedFindingCount ? '#fff4dc' : '#e4f9fd'} />
                      </Stack>
                    </Box>
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row', lg: 'column' }} spacing={1} sx={{ flex: { lg: '0 0 230px' } }}>
                    <Button
                      variant="contained"
                      startIcon={<SyncOutlined />}
                      disabled={!selectedWorkspaceProductId || enrichScannerReadiness.isPending}
                      onClick={() => enrichScannerReadiness.mutate()}
                      sx={{ minHeight: 42 }}
                    >
                      Refresh Fix Path
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                      Refresh is deterministic and stored. Use the AI explainer below when you want a plain-English readout.
                    </Typography>
                  </Stack>
                </Stack>
                {(workspaceScannerReadiness.isFetching || enrichScannerReadiness.isPending) && <LinearProgress sx={{ mt: 1.5, borderRadius: 999 }} />}
                {readiness?.milestoneRisks?.length ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1.25, mt: 2 }}>
                    {readiness.milestoneRisks.slice(0, 4).map((risk) => (
                      <Box key={risk.milestoneId} sx={{ p: 1.35, border: '1px solid', borderColor: '#e1eaf6', borderRadius: 1, bgcolor: '#fff' }}>
                        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 900 }} noWrap>{risk.milestoneTitle}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {risk.scannerFindingCount} scanner finding{risk.scannerFindingCount === 1 ? '' : 's'} · {risk.missingEvidenceCount} proof gap{risk.missingEvidenceCount === 1 ? '' : 's'}
                            </Typography>
                          </Box>
                          <PastelChip label={risk.highestSeverity || 'Mapped'} accent={severityAccent(risk.highestSeverity)} bg={risk.highestSeverity === 'CRITICAL' || risk.highestSeverity === 'HIGH' ? '#fff1f1' : '#f1efff'} />
                        </Stack>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                          {risk.mappedServices.length ? risk.mappedServices.slice(0, 4).map((service) => (
                            <PastelChip key={service} label={service} accent={appleColors.cyan} bg="#e4f9fd" />
                          )) : <Typography variant="caption" color="text.secondary">Needs service mapping review</Typography>}
                        </Stack>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ mt: 2, p: 1.5, border: '1px dashed', borderColor: '#cfe3f8', borderRadius: 1, bgcolor: '#fbfdff' }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ md: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {scannerEvidenceList.length
                          ? 'Scanner proof exists. Refresh the fix path to create mapped milestone risks and proof tasks.'
                          : 'Run or attach workspace-scoped scanner proof to build a fix path for this delivery.'}
                      </Typography>
                      <AutoAwesomeOutlined sx={{ color: appleColors.purple }} />
                    </Stack>
                  </Box>
                )}
              </Surface>

              <PlatformAssistantCard
                title="AI Fix Path Explainer"
                description="Explain mapped findings and owner decisions from the stored scanner fix path."
                prompt={`Use thinker mode and read-only context only. Explain the scanner fix path for workspace "${selectedWorkspace.name}". Product: ${selectedWorkspace.packageInstance?.productProfile?.name || 'not recorded'}. Readiness score: ${readinessScore}. Status: ${readinessStatus}. Mapped findings: ${readiness?.mappedFindingCount || 0}. Priority fixes: ${readiness?.blockerCount || 0}. Missing proof: ${readiness?.missingEvidenceCount || 0}. Unmapped findings: ${readiness?.unmappedFindingCount || 0}. Mapped services: ${(readiness?.milestoneRisks || []).flatMap((risk) => risk.mappedServices).slice(0, 8).join(', ') || 'none'}. Milestone risks: ${(readiness?.milestoneRisks || []).slice(0, 6).map((risk) => `${risk.milestoneTitle}: ${risk.scannerFindingCount} findings, ${risk.missingEvidenceCount} proof gaps, highest ${risk.highestSeverity || 'none'}`).join('; ') || 'none'}. Tell the owner what could stop shipping, which service work addresses it, what proof is missing, and what decision is safe next. Do not mutate workspace state.`}
                conversationId={`workspace-scanner-readiness-${selectedWorkspace.id}`}
                context={{
                  pageType: 'workspace-scanner-readiness',
                  productId: selectedWorkspaceProductId,
                  packageId: selectedWorkspace.packageInstance?.id,
                  workspaceId: selectedWorkspace.id,
                  milestoneId: selectedMilestone?.id,
                }}
                accent={readiness?.blockerCount ? appleColors.red : appleColors.cyan}
                cta="Ask AI"
              />

              <Surface>
                <SectionTitle title="Milestones" action={selectedMilestone && <PastelChip label={`Selected: ${selectedMilestone.title}`} accent={workspaceAccent(selectedMilestone.status)} />} />
                <Box component="form" onSubmit={milestoneForm.handleSubmit(() => createMilestone.mutate())} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(220px, 1fr) 170px auto' }, gap: 1, mb: 2 }}>
                  <TextField size="small" label="New milestone" value={milestoneForm.values.title} onChange={(event) => milestoneForm.setValue('title', event.target.value)} />
                  <TextField size="small" type="date" label="Due" value={milestoneForm.values.dueDate || ''} onChange={(event) => milestoneForm.setValue('dueDate', event.target.value || null)} InputLabelProps={{ shrink: true }} />
                  <Button type="submit" variant="outlined" disabled={!milestoneForm.values.title || createMilestone.isPending}>Add</Button>
                </Box>
                {milestoneList.length ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
                    {milestoneList.map((milestone) => {
                      const milestoneRisk = milestoneRiskById[milestone.id];
                      const selected = selectedMilestone?.id === milestone.id;
                      return (
                        <Button
                          key={milestone.id}
                          variant={selected ? 'contained' : 'outlined'}
                          color={selected ? 'primary' : 'inherit'}
                          onClick={() => setSelectedMilestoneId(milestone.id)}
                          sx={{ justifyContent: 'flex-start', textAlign: 'left', minHeight: 104, p: 1.5, borderRadius: 1, whiteSpace: 'normal' }}
                        >
                          <Box sx={{ width: '100%', minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: workspaceAccent(milestone.status) }} />
                              <Typography sx={{ fontWeight: 900, minWidth: 0 }} noWrap>{milestone.title}</Typography>
                            </Stack>
                            <Typography variant="caption" sx={{ color: selected ? 'inherit' : 'text.secondary', display: 'block' }}>
                              {formatLabel(milestone.status)}{milestone.dueDate ? ` · due ${milestone.dueDate}` : ''}
                            </Typography>
                            {milestoneRisk && (
                              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                                <PastelChip
                                  label={`${milestoneRisk.scannerFindingCount} scanner ${milestoneRisk.scannerFindingCount === 1 ? 'finding' : 'findings'}`}
                                  accent={severityAccent(milestoneRisk.highestSeverity)}
                                  bg={milestoneRisk.highestSeverity === 'CRITICAL' || milestoneRisk.highestSeverity === 'HIGH' ? '#fff1f1' : '#fff4dc'}
                                />
                                <PastelChip
                                  label={`${milestoneRisk.missingEvidenceCount} proof ${milestoneRisk.missingEvidenceCount === 1 ? 'gap' : 'gaps'}`}
                                  accent={milestoneRisk.missingEvidenceCount ? appleColors.amber : appleColors.green}
                                  bg={milestoneRisk.missingEvidenceCount ? '#fff4dc' : '#e7f8ee'}
                                />
                                {milestoneRisk.mappedServices.slice(0, 2).map((service) => (
                                  <PastelChip key={service} label={service} accent={appleColors.cyan} bg="#e4f9fd" />
                                ))}
                              </Stack>
                            )}
                            {milestone.description && (
                              <Typography variant="body2" sx={{ color: selected ? 'inherit' : 'text.secondary', mt: 0.75, lineHeight: 1.45 }}>
                                {milestone.description}
                              </Typography>
                            )}
                          </Box>
                        </Button>
                      );
                    })}
                  </Box>
                ) : (
                  <EmptyState label="No milestones yet. Add the first production milestone for this workspace." />
                )}
              </Surface>

              <Surface>
                <SectionTitle title={selectedMilestone ? `${selectedMilestone.title} Deliverables` : 'Deliverables'} />
                <Box component="form" onSubmit={deliverableForm.handleSubmit(() => createDeliverable.mutate())} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(240px, 1fr) auto' }, gap: 1, mb: 2 }}>
                  <TextField size="small" label="New deliverable" value={deliverableForm.values.title} onChange={(event) => deliverableForm.setValue('title', event.target.value)} />
                  <Button type="submit" variant="outlined" disabled={!selectedMilestone?.id || !deliverableForm.values.title || createDeliverable.isPending}>Add</Button>
                </Box>
                <Stack spacing={1.5}>
                  {deliverableList.length ? (
                    deliverableList.map((deliverable) => (
                      <Box key={deliverable.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ md: 'center' }}>
                          <Box>
                            <Typography sx={{ fontWeight: 900 }}>{deliverable.title}</Typography>
                            {deliverable.evidence && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>{deliverable.evidence}</Typography>}
                          </Box>
                          <StatusChip label={deliverable.status} />
                        </Stack>
                        {evidencePanel('DELIVERABLE', deliverable.id)}
                      </Box>
                    ))
                  ) : (
                    <EmptyState label={selectedMilestone ? 'No deliverables yet. Add evidence-backed outputs for this milestone.' : 'Select a milestone to see deliverables.'} />
                  )}
                </Stack>
              </Surface>

              <Surface>
                <SectionTitle title="Workspace Evidence" action={<PastelChip label={`${scopedAttachments('WORKSPACE', selectedWorkspace.id).length} files`} accent={appleColors.purple} />} />
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Attach workspace-level documents such as kickoff notes, architecture decisions, acceptance records, and operating handoff material.
                </Typography>
                {evidencePanel('WORKSPACE', selectedWorkspace.id)}
                <Divider sx={{ my: 2 }} />
                <Box component="form" onSubmit={(event) => {
                  event.preventDefault();
                  if (selectedWorkspaceProductId && scannerUploadForm.toolName.trim() && scannerUploadForm.artifactPayload.trim()) uploadScannerEvidence.mutate();
                }}>
                  <Stack spacing={1.25}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ md: 'center' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CloudUploadOutlined sx={{ color: appleColors.cyan }} />
                        <Box>
                          <Typography sx={{ fontWeight: 900 }}>CI scanner evidence</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Normalize real scanner output against this workspace and selected milestone.
                          </Typography>
                        </Box>
                      </Stack>
                      <PastelChip label={`${scannerEvidenceList.length} scanner evidence records`} accent={appleColors.cyan} bg="#e4f9fd" />
                    </Stack>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 140px 180px' }, gap: 1 }}>
                      <TextField
                        size="small"
                        label="Tool"
                        value={scannerUploadForm.toolName}
                        onChange={(event) => setScannerUploadForm((current) => ({ ...current, toolName: event.target.value }))}
                      />
                      <TextField
                        select
                        size="small"
                        label="Format"
                        value={scannerUploadForm.format}
                        onChange={(event) => setScannerUploadForm((current) => ({ ...current, format: event.target.value as ScannerUploadPayload['format'] }))}
                      >
                        <MenuItem value="SARIF">SARIF</MenuItem>
                        <MenuItem value="JSON">JSON</MenuItem>
                        <MenuItem value="JUNIT">JUnit</MenuItem>
                        <MenuItem value="LOG">Log</MenuItem>
                      </TextField>
                      <TextField
                        select
                        size="small"
                        label="Milestone"
                        value={scannerUploadForm.milestoneId || selectedMilestone?.id || ''}
                        onChange={(event) => setScannerUploadForm((current) => ({ ...current, milestoneId: event.target.value }))}
                      >
                        <MenuItem value="">Workspace-level</MenuItem>
                        {milestoneList.map((milestone) => (
                          <MenuItem key={milestone.id} value={milestone.id}>{milestone.title}</MenuItem>
                        ))}
                      </TextField>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 180px' }, gap: 1 }}>
                      <TextField
                        size="small"
                        label="Artifact file name"
                        value={scannerUploadForm.artifactFileName}
                        onChange={(event) => setScannerUploadForm((current) => ({ ...current, artifactFileName: event.target.value }))}
                      />
                      <TextField
                        size="small"
                        label="Version"
                        value={scannerUploadForm.toolVersion}
                        onChange={(event) => setScannerUploadForm((current) => ({ ...current, toolVersion: event.target.value }))}
                      />
                    </Box>
                    <TextField
                      size="small"
                      label="Scanner payload"
                      placeholder="Paste SARIF, JSON, JUnit XML, or scanner log output from the team CI run."
                      value={scannerUploadForm.artifactPayload}
                      onChange={(event) => setScannerUploadForm((current) => ({ ...current, artifactPayload: event.target.value }))}
                      multiline
                      minRows={5}
                      InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13, alignItems: 'flex-start' } }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<CloudUploadOutlined />}
                      disabled={!selectedWorkspaceProductId || !scannerUploadForm.toolName.trim() || !scannerUploadForm.artifactPayload.trim() || uploadScannerEvidence.isPending}
                      sx={{ minHeight: 44, alignSelf: { md: 'flex-start' } }}
                    >
                      Normalize Workspace Evidence
                    </Button>
                    {scannerEvidenceList.length ? (
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
                        {scannerEvidenceList.slice(0, 4).map((item) => (
                          <Box key={item.id} sx={{ p: 1, border: '1px solid', borderColor: '#e5edf7', borderRadius: 1, bgcolor: item.redactionStatus === 'NONE' ? '#fbfdff' : '#fff7f8' }}>
                            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>{item.title}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {item.source} · {formatLabel(item.confidenceLevel)}
                                </Typography>
                              </Box>
                              <StatusChip label={item.redactionStatus} color={item.redactionStatus === 'NONE' ? 'success' : 'warning'} />
                            </Stack>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No scanner evidence is attached to this workspace yet.
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Surface>

              <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)' }}>
                <SectionTitle
                  title="Acceptance And Evidence Review"
                  action={<PastelChip label={`${passedCriteriaCount}/${governanceCriteria.length || 0} passed`} accent={passedCriteriaCount === governanceCriteria.length && governanceCriteria.length ? appleColors.green : appleColors.amber} bg={passedCriteriaCount === governanceCriteria.length && governanceCriteria.length ? '#e7f8ee' : '#fff4dc'} />}
                />
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" sx={{ mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, maxWidth: 720 }}>
                    Generate acceptance criteria from the service plan, attach or verify required evidence, record checks, and make owner review decisions from one place.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => generateCriteria.mutate()}
                    disabled={!selectedMilestone?.id || generateCriteria.isPending}
                    sx={{ minHeight: 40, flex: { md: '0 0 auto' } }}
                  >
                    Generate checklist
                  </Button>
                </Stack>
                {(governance.isFetching || generateCriteria.isPending) && <LinearProgress sx={{ mb: 1.5, borderRadius: 999 }} />}
                {selectedMilestoneCriteria.length ? (
                  <Stack spacing={1.25}>
                    {selectedMilestoneCriteria.map((criterion) => {
                      const hasMissingRequired = criterion.evidenceRequirements.some((requirement) => requirement.required && requirement.status === 'MISSING');
                      return (
                        <Box key={criterion.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: '#fff' }}>
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ md: 'flex-start' }}>
                            <Box sx={{ minWidth: 0 }}>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                                <Typography sx={{ fontWeight: 900 }}>{criterion.title}</Typography>
                                {criterion.serviceName && <PastelChip label={criterion.serviceName} accent={appleColors.cyan} bg="#e4f9fd" />}
                              </Stack>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
                                {criterion.description || 'Acceptance criterion requires owner-visible evidence before approval.'}
                              </Typography>
                            </Box>
                            <StatusChip label={criterion.status} color={criterion.status === 'PASSED' ? 'success' : criterion.status === 'FAILED' ? 'error' : 'default'} />
                          </Stack>

                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) 250px' }, gap: 1.25, mt: 1.25 }}>
                            <Stack spacing={0.75}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
                                Required evidence
                              </Typography>
                              {criterion.evidenceRequirements.map((requirement) => (
                                <Box key={requirement.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) auto' }, gap: 1, alignItems: 'center', border: '1px solid', borderColor: '#e5edf7', borderRadius: 1, p: 1 }}>
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{requirement.evidenceType}</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                      {requirement.evidenceReference || requirement.description || 'No reference attached'}
                                    </Typography>
                                  </Box>
                                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                    <Button
                                      size="small"
                                      variant={requirement.status === 'ATTACHED' ? 'contained' : 'outlined'}
                                      onClick={() => updateEvidenceRequirement.mutate({ id: requirement.id, payload: { status: 'ATTACHED', evidenceReference: requirement.evidenceReference || 'Workspace evidence attached' } })}
                                      disabled={updateEvidenceRequirement.isPending}
                                      sx={{ minHeight: 32 }}
                                    >
                                      Attach
                                    </Button>
                                    <Button
                                      size="small"
                                      variant={requirement.status === 'VERIFIED' ? 'contained' : 'outlined'}
                                      onClick={() => updateEvidenceRequirement.mutate({ id: requirement.id, payload: { status: 'VERIFIED', evidenceReference: requirement.evidenceReference || 'Verified workspace evidence' } })}
                                      disabled={updateEvidenceRequirement.isPending}
                                      sx={{ minHeight: 32 }}
                                    >
                                      Verify
                                    </Button>
                                    <Button
                                      size="small"
                                      variant={requirement.status === 'WAIVED' ? 'contained' : 'outlined'}
                                      color="warning"
                                      onClick={() => updateEvidenceRequirement.mutate({ id: requirement.id, payload: { status: 'WAIVED', evidenceReference: requirement.evidenceReference || 'Waived by workspace coordinator' } })}
                                      disabled={updateEvidenceRequirement.isPending}
                                      sx={{ minHeight: 32 }}
                                    >
                                      Waive
                                    </Button>
                                  </Stack>
                                </Box>
                              ))}
                            </Stack>
                            <Stack spacing={0.75}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
                                Review actions
                              </Typography>
                              <Button
                                variant="outlined"
                                onClick={() => createCheck.mutate({
                                  criterionId: criterion.id,
                                  payload: {
                                    checkType: 'manual-evidence-review',
                                    provider: 'ProdUS Workspace',
                                    status: hasMissingRequired ? 'WARNING' : 'PASSED',
                                    summary: hasMissingRequired ? 'Evidence review found missing required proof.' : 'Evidence review passed with available proof.',
                                  },
                                })}
                                disabled={createCheck.isPending}
                                sx={{ minHeight: 38 }}
                              >
                                Record check
                              </Button>
                              <Button
                                variant="contained"
                                color="success"
                                onClick={() => reviewCriterion.mutate({ criterionId: criterion.id, payload: { decision: 'APPROVE', note: 'Evidence is acceptable for this milestone criterion.' } })}
                                disabled={hasMissingRequired || reviewCriterion.isPending}
                                sx={{ minHeight: 38 }}
                              >
                                Approve criterion
                              </Button>
                              <Button
                                variant="outlined"
                                color="warning"
                                onClick={() => reviewCriterion.mutate({ criterionId: criterion.id, payload: { decision: 'REQUEST_CHANGES', note: 'Additional evidence or remediation is required before approval.' } })}
                                disabled={reviewCriterion.isPending}
                                sx={{ minHeight: 38 }}
                              >
                                Request changes
                              </Button>
                            </Stack>
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                ) : (
                  <EmptyState label={selectedMilestone ? 'No acceptance checklist exists yet. Generate it from the selected milestone service plan.' : 'Select a milestone to review acceptance criteria.'} />
                )}
              </Surface>
            </>
          ) : (
            <Surface>
              <EmptyState label="Open or create a workspace to coordinate milestones, evidence, and delivery participants." />
            </Surface>
          )}
        </Stack>

        <Stack spacing={2}>
          {selectedWorkspace && (
            <PlatformAssistantCard
              title="AI Handoff Readiness"
              description="Identify support handoff gaps across runbooks, access, monitoring, unresolved risks, and evidence quality."
              prompt={`Do not call tools for this answer. Use only the facts in this prompt and the supplied safe summaries. Assess support handoff readiness for delivery "${selectedWorkspace.name}". Delivery status is ${selectedWorkspace.status}. Product is ${selectedWorkspace.packageInstance?.productProfile?.name || 'not recorded'}. Completed checkpoints: ${milestoneList.filter((milestone) => ['ACCEPTED', 'COMPLETED', 'DONE'].includes(milestone.status)).length}/${milestoneList.length}. Open support requests: ${supportList.length}. Open risks: ${disputeList.length}. Missing required evidence: ${missingEvidenceCount}. Integration records: ${integrationList.length}. Handoff documents: ${governance.data?.handoffs?.length || 0}. Explain missing runbooks, access, monitoring, known issue, and ownership evidence. Recommend safe owner/team questions and next actions. Do not claim handoff is complete unless the evidence supports human review.`}
              conversationId={`workspace-handoff-${selectedWorkspace.id}`}
              context={{
                pageType: 'active-workspace',
                productId: selectedWorkspaceProductId,
                packageId: selectedWorkspace.packageInstance?.id,
                workspaceId: selectedWorkspace.id,
                milestoneId: selectedMilestone?.id,
              }}
              accent={supportList.length || disputeList.length || missingEvidenceCount ? appleColors.amber : appleColors.green}
              cta="Check Handoff"
            />
          )}
          <Surface>
            <SectionTitle title="Participants" action={<PastelChip label={`${participantList.length}`} accent={appleColors.cyan} bg="#e4f9fd" />} />
            {selectedWorkspace && canCoordinate && (
              <Box component="form" onSubmit={participantForm.handleSubmit(() => addParticipant.mutate())} sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1, mb: 2 }}>
                <TextField size="small" label="Email" value={participantForm.values.email} onChange={(event) => participantForm.setValue('email', event.target.value)} />
                <TextField select size="small" label="Role" value={participantForm.values.role} onChange={(event) => participantForm.setValue('role', event.target.value as WorkspaceParticipant['role'])}>
                  {participantRoles.map((role) => <MenuItem key={role} value={role}>{formatLabel(role)}</MenuItem>)}
                </TextField>
                <Button type="submit" variant="outlined" disabled={!participantForm.values.email || addParticipant.isPending}>Add participant</Button>
              </Box>
            )}
            <Stack spacing={1}>
              {participantList.length ? (
                participantList.map((participant) => (
                  <Stack key={participant.id} direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{participant.user.email}</Typography>
                      <Typography variant="caption" color="text.secondary">{participant.active ? formatLabel(participant.role) : 'Inactive'}</Typography>
                    </Box>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: participant.active ? appleColors.green : appleColors.red, flex: '0 0 auto' }} />
                  </Stack>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">Add owners, team leads, specialists, and advisors before delivery starts.</Typography>
              )}
            </Stack>
          </Surface>

          <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f6fffb)' }}>
            <SectionTitle title="Handoff And Health" action={<PastelChip label={latestHealthReview ? `${latestHealthReview.healthScore}/100` : 'No review'} accent={latestHealthReview ? appleColors.green : appleColors.purple} bg={latestHealthReview ? '#e7f8ee' : '#f1efff'} />} />
            <Stack spacing={1.25}>
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25, bgcolor: '#fff' }}>
                <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>{latestHandoff?.title || 'Owner handoff'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {latestHandoff ? formatLabel(latestHandoff.status) : 'Prepare runbook, access, known issues, and support scope.'}
                    </Typography>
                  </Box>
                  {latestHandoff && <StatusChip label={latestHandoff.status} color={latestHandoff.status === 'ACCEPTED' ? 'success' : 'default'} />}
                </Stack>
                {latestHandoff?.runbook && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.5 }}>
                    {latestHandoff.runbook}
                  </Typography>
                )}
              </Box>
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25, bgcolor: '#fff' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ProgressRing value={latestHealthReview?.healthScore || Math.max(55, workspaceProgress || 70)} size={64} color={latestHealthReview ? appleColors.green : appleColors.amber} label="health" />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>{latestHealthReview?.summary || 'No health review published yet.'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {missingEvidenceCount ? `${missingEvidenceCount} required evidence items missing` : 'Evidence requirements are current'}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
              {selectedWorkspace && canCoordinate && (
                <Stack direction={{ xs: 'column', sm: 'row', lg: 'column' }} spacing={1}>
                  <Button variant="outlined" onClick={() => upsertHandoff.mutate()} disabled={upsertHandoff.isPending} sx={{ minHeight: 40 }}>
                    Prepare handoff
                  </Button>
                  <Button variant="outlined" onClick={() => createHealthReview.mutate()} disabled={createHealthReview.isPending} sx={{ minHeight: 40 }}>
                    Publish health review
                  </Button>
                </Stack>
              )}
            </Stack>
          </Surface>

          <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8fbff)' }}>
            <SectionTitle title="Integration Signals" action={<PastelChip label={`${integrationList.length} connected`} accent={appleColors.blue} bg="#eaf3ff" />} />
            <Stack spacing={1.25}>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                Register workspace-scoped integrations and record readiness signals. These records are AI-ready context but no AI execution happens here.
              </Typography>
              {selectedWorkspace && canCoordinate && (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 1 }}>
                  <TextField select size="small" label="Provider" value={integrationProvider} onChange={(event) => setIntegrationProvider(event.target.value as IntegrationConnection['providerType'])}>
                    {integrationProviderOptions.map((provider) => <MenuItem key={provider} value={provider}>{formatLabel(provider)}</MenuItem>)}
                  </TextField>
                  <Button
                    variant="outlined"
                    onClick={() => createIntegration.mutate({
                      providerType: integrationProvider,
                      name: `${formatLabel(integrationProvider)} workspace connection`,
                      externalRef: `${selectedWorkspace.name}-${integrationProvider.toLowerCase()}`,
                      scopedAccessNote: 'Workspace-scoped access only; no long-lived broad permissions recorded.',
                      status: 'CONFIGURED',
                    })}
                    disabled={createIntegration.isPending}
                  >
                    Add
                  </Button>
                </Box>
              )}
              <Stack spacing={1}>
                {integrationList.length ? integrationList.map((connection) => (
                  <Box key={connection.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25, bgcolor: '#fff' }}>
                    <Stack direction="row" spacing={1} justifyContent="space-between">
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 900 }}>{connection.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{formatLabel(connection.providerType)} · {formatLabel(connection.status)}</Typography>
                      </Box>
                      <StatusChip label={connection.status} color={connection.status === 'ACTIVE' ? 'success' : connection.status === 'NEEDS_ATTENTION' ? 'warning' : 'default'} />
                    </Stack>
                    {connection.signals.slice(0, 2).map((signal) => (
                      <Typography key={signal.id} variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                        {formatLabel(signal.status)} · {signal.summary || signal.signalType}
                      </Typography>
                    ))}
                  </Box>
                )) : <Typography variant="body2" color="text.secondary">No integration connections are registered yet.</Typography>}
              </Stack>
              {latestIntegration && canCoordinate && (
                <Button
                  variant="outlined"
                  onClick={() => createIntegrationSignal.mutate({
                    connectionId: latestIntegration.id,
                    payload: {
                      ...(selectedMilestone?.id ? { milestoneId: selectedMilestone.id } : {}),
                      ...(selectedMilestoneCriteria[0]?.id ? { criterionId: selectedMilestoneCriteria[0].id } : {}),
                      signalType: 'workspace-readiness-signal',
                      status: missingEvidenceCount ? 'WARNING' : 'PASSED',
                      summary: missingEvidenceCount ? 'Integration signal recorded with missing acceptance evidence.' : 'Integration signal supports current acceptance evidence.',
                      evidencePayload: JSON.stringify({ workspaceId: selectedWorkspace?.id, missingEvidenceCount }),
                    },
                  })}
                  disabled={createIntegrationSignal.isPending}
                  sx={{ minHeight: 40 }}
                >
                  Record signal
                </Button>
              )}
            </Stack>
          </Surface>

          <Surface>
            <SectionTitle title="Support" action={<PastelChip label={`${supportList.length} requests`} accent={supportList.length ? appleColors.amber : appleColors.green} />} />
            {selectedWorkspace && canCoordinate && (
              <Box component="form" onSubmit={supportForm.handleSubmit(() => createSupport.mutate())} sx={{ mb: 2 }}>
                <Stack spacing={1}>
                  <TextField select size="small" label="Team" value={supportForm.values.teamId || ''} onChange={(event) => supportForm.setValue('teamId', event.target.value || null)}>
                    {(teams.data || []).map((team) => <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>)}
                  </TextField>
                  <TextField size="small" label="Request title" value={supportForm.values.title} onChange={(event) => supportForm.setValue('title', event.target.value)} />
                  <TextField select size="small" label="Priority" value={supportForm.values.priority} onChange={(event) => supportForm.setValue('priority', event.target.value as SupportRequest['priority'])}>
                    {supportPriorities.map((priority) => <MenuItem key={priority} value={priority}>{formatLabel(priority)}</MenuItem>)}
                  </TextField>
                  <TextField size="small" label="Context" value={supportForm.values.description} onChange={(event) => supportForm.setValue('description', event.target.value)} multiline />
                  <Button type="submit" variant="outlined" disabled={!supportForm.values.teamId || !supportForm.values.title || !supportForm.values.description || createSupport.isPending}>
                    Open support request
                  </Button>
                </Stack>
              </Box>
            )}
            <Stack spacing={1.25}>
              {supportList.length ? supportList.map((request) => (
                <Box key={request.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                  <Stack direction="row" spacing={1} justifyContent="space-between">
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>{request.title}</Typography>
                    <StatusChip label={request.slaStatus} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">{request.team.name} · {formatLabel(request.priority)}</Typography>
                  {request.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.5 }}>{request.description}</Typography>}
                  {canCoordinate && (
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      <TextField select size="small" label="Status" value={supportStatusById[request.id] || request.status} onChange={(event) => setSupportStatusById((current) => ({ ...current, [request.id]: event.target.value as SupportRequest['status'] }))}>
                        {supportStatuses.map((status) => <MenuItem key={status} value={status}>{formatLabel(status)}</MenuItem>)}
                      </TextField>
                      <TextField size="small" label="Resolution note" value={supportResolutionById[request.id] ?? request.resolution ?? ''} onChange={(event) => setSupportResolutionById((current) => ({ ...current, [request.id]: event.target.value }))} />
                      <Button variant="outlined" onClick={() => updateSupport.mutate({ id: request.id, payload: { status: supportStatusById[request.id] || request.status, resolution: supportResolutionById[request.id] || request.resolution || '' } })} disabled={updateSupport.isPending}>
                        Update request
                      </Button>
                    </Stack>
                  )}
                </Box>
              )) : <Typography variant="body2" color="text.secondary">No support requests are open.</Typography>}
            </Stack>
          </Surface>

          <Surface sx={{ background: disputeList.length ? '#fff7f8' : '#f4fbf7' }}>
            <SectionTitle title="Risks" action={<PastelChip label={`${disputeList.length}`} accent={disputeList.length ? appleColors.red : appleColors.green} />} />
            {selectedWorkspace && canCoordinate && (
              <Box component="form" onSubmit={disputeForm.handleSubmit(() => createDispute.mutate())} sx={{ mb: 2 }}>
                <Stack spacing={1}>
                  <TextField select size="small" label="Team" value={disputeForm.values.teamId || ''} onChange={(event) => disputeForm.setValue('teamId', event.target.value || null)}>
                    <MenuItem value="">Unassigned</MenuItem>
                    {(teams.data || []).map((team) => <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>)}
                  </TextField>
                  <TextField size="small" label="Issue title" value={disputeForm.values.title} onChange={(event) => disputeForm.setValue('title', event.target.value)} />
                  <TextField select size="small" label="Severity" value={disputeForm.values.severity} onChange={(event) => disputeForm.setValue('severity', event.target.value as DisputeCase['severity'])}>
                    {disputeSeverities.map((severity) => <MenuItem key={severity} value={severity}>{formatLabel(severity)}</MenuItem>)}
                  </TextField>
                  <TextField size="small" label="Context" value={disputeForm.values.description} onChange={(event) => disputeForm.setValue('description', event.target.value)} multiline />
                  <Button type="submit" variant="outlined" disabled={!disputeForm.values.title || !disputeForm.values.description || createDispute.isPending}>Open risk</Button>
                </Stack>
              </Box>
            )}
            <Stack spacing={1.25}>
              {disputeList.length ? disputeList.map((dispute) => (
                <Box key={dispute.id} sx={{ border: 1, borderColor: '#fecdd3', borderRadius: 1, p: 1.25, background: '#fff' }}>
                  <Stack direction="row" spacing={1} justifyContent="space-between">
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>{dispute.title}</Typography>
                    <StatusChip label={dispute.status} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">{dispute.team?.name || 'Unassigned'} · {formatLabel(dispute.severity)}</Typography>
                  {dispute.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.5 }}>{dispute.description}</Typography>}
                  {canCoordinate && (
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      <TextField select size="small" label="Status" value={disputeStatusById[dispute.id] || dispute.status} onChange={(event) => setDisputeStatusById((current) => ({ ...current, [dispute.id]: event.target.value as DisputeCase['status'] }))}>
                        {disputeStatuses.map((status) => <MenuItem key={status} value={status}>{formatLabel(status)}</MenuItem>)}
                      </TextField>
                      <TextField size="small" label="Resolution note" value={disputeResolutionById[dispute.id] ?? dispute.resolution ?? ''} onChange={(event) => setDisputeResolutionById((current) => ({ ...current, [dispute.id]: event.target.value }))} />
                      <Button variant="outlined" onClick={() => updateDispute.mutate({ id: dispute.id, payload: { status: disputeStatusById[dispute.id] || dispute.status, resolution: disputeResolutionById[dispute.id] || dispute.resolution || '' } })} disabled={updateDispute.isPending}>
                        Update risk
                      </Button>
                    </Stack>
                  )}
                  {evidencePanel('DISPUTE', dispute.id)}
                </Box>
              )) : <Typography variant="body2" color="text.secondary">No risks are open for this workspace.</Typography>}
            </Stack>
          </Surface>
        </Stack>
      </Box>
    </>
  );
}
