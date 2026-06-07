'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AddOutlined,
  CalendarMonthOutlined,
  CloudUploadOutlined,
  ErrorOutlineOutlined,
  FactCheckOutlined,
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
import ShipConfidencePanel from './ShipConfidencePanel';
import LaunchReadinessReportPanel from './LaunchReadinessReportPanel';
import WorkspaceCommandHandoffPanels from './WorkspaceCommandHandoffPanels';
import WorkspaceCommandHero from './WorkspaceCommandHero';
import WorkspaceCommandJourneyNav, { type WorkspaceCommandView } from './WorkspaceCommandJourneyNav';
import WorkspaceCommandTeamPanels from './WorkspaceCommandTeamPanels';
import WorkspaceScannerFixPathPanel from './WorkspaceScannerFixPathPanel';
import { sortWorkspacesForOwner } from './displayOrder';
import {
  EmptyState,
  MetricTile,
  PageHeader,
  PastelChip,
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
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2, mb: 2.5 }}>
        <MetricTile label="Active workspaces" value={activeWorkspaceCount} detail={`${workspaceList.length} total productization paths`} accent={appleColors.cyan} icon={<FactCheckOutlined />} />
        <MetricTile label="Launch checkpoints" value={completedMilestones} detail={`${milestoneList.length} in selected workspace`} accent={appleColors.green} icon={<TaskAltOutlined />} />
        <MetricTile label="Rough edges" value={blockedItems} detail="Needs owner or specialist attention" accent={appleColors.red} icon={<ErrorOutlineOutlined />} />
        <MetricTile label="Timed checks" value={milestoneList.filter((milestone) => milestone.dueDate).length} detail="Scheduled launch checkpoints" accent={appleColors.purple} icon={<CalendarMonthOutlined />} />
      </Box>

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
                <>
                  <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f6fffb 100%)' }}>
                    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} justifyContent="space-between" alignItems={{ lg: 'center' }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h3" sx={{ fontSize: { xs: 22, md: 26 } }}>
                          Delivery Answer
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65, maxWidth: 780 }}>
                          {readiness?.blockerCount
                            ? `Not ready for owner handoff yet. ${readiness.blockerCount} priority fix${readiness.blockerCount === 1 ? '' : 'es'} must be handled before this workspace can be treated as launch-safe.`
                            : missingEvidenceCount
                              ? `Close the proof gap first. ${missingEvidenceCount} required evidence item${missingEvidenceCount === 1 ? '' : 's'} still need attachment or verification.`
                              : 'On track for the next launch decision. Keep scanner proof, acceptance evidence, and handoff records current before calling it ready.'}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                          <PastelChip label={`${readiness?.blockerCount || 0} priority fixes`} accent={readiness?.blockerCount ? appleColors.red : appleColors.green} bg={readiness?.blockerCount ? '#fff1f1' : '#e7f8ee'} />
                          <PastelChip label={`${missingEvidenceCount} proof gaps`} accent={missingEvidenceCount ? appleColors.amber : appleColors.green} bg={missingEvidenceCount ? '#fff4dc' : '#e7f8ee'} />
                          <PastelChip label={`${milestoneList.length} checkpoints`} accent={appleColors.purple} />
                          <PastelChip label={`${roughEdgeCount} open rough edges`} accent={roughEdgeCount ? appleColors.amber : appleColors.green} bg={roughEdgeCount ? '#fff4dc' : '#e7f8ee'} />
                        </Stack>
                      </Box>
                      <Stack direction={{ xs: 'column', sm: 'row', lg: 'column' }} spacing={1} sx={{ minWidth: { lg: 220 } }}>
                        <Button variant="contained" onClick={() => setWorkspaceView('proof')} sx={{ minHeight: 42 }}>
                          Review Fixes And Proof
                        </Button>
                        <Button variant="outlined" onClick={() => setWorkspaceView(roughEdgeCount ? 'team' : 'handoff')} sx={{ minHeight: 42 }}>
                          {roughEdgeCount ? 'Resolve Team Risks' : 'Prepare Handoff'}
                        </Button>
                      </Stack>
                    </Stack>
                  </Surface>

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

                </>
              )}

              {workspaceView === 'proof' && (
                <>
                  <WorkspaceScannerFixPathPanel
                    readinessScore={readinessScore}
                    readinessStatus={readinessStatus}
                    hasDiagnosis={!!readiness?.diagnosis}
                    blockerCount={readiness?.blockerCount || 0}
                    mappedFindingCount={readiness?.mappedFindingCount || 0}
                    missingEvidenceCount={readiness?.missingEvidenceCount || 0}
                    unmappedFindingCount={readiness?.unmappedFindingCount || 0}
                    scannerEvidenceCount={scannerEvidenceList.length}
                    milestoneRisks={readiness?.milestoneRisks || []}
                    isRefreshing={enrichScannerReadiness.isPending}
                    isLoading={workspaceScannerReadiness.isFetching}
                    canRefresh={!!selectedWorkspaceProductId}
                    onRefresh={() => enrichScannerReadiness.mutate()}
                  />

              <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f9fcff 100%)' }}>
                <ShipConfidencePanel
                  history={shipConfidence.data}
                  isLoading={shipConfidence.isFetching}
                  title="Workspace Ship Confidence"
                  subtitle="Workspace scanner maps become checkpoints, so the owner can see whether this prototype is moving closer to launch."
                />
              </Surface>

              <LaunchReadinessReportPanel
                report={launchReadinessReport.data ?? null}
                isLoading={launchReadinessReport.isFetching}
                isGenerating={generateLaunchReadinessReport.isPending}
                onGenerate={() => generateLaunchReadinessReport.mutate()}
                title="Workspace Launch Report"
                subtitle="Generate a shareable launch decision snapshot from workspace scanner proof, service milestones, checks, and remaining rough edges."
              />

              <PlatformAssistantCard
                title="AI Fix Path Explainer"
                description="Explain mapped findings and owner decisions from the stored scanner fix path."
                prompt={`Use thinker mode and read-only context only. Explain the scanner fix path for workspace "${selectedWorkspace.name}". Product: ${selectedWorkspace.packageInstance?.productProfile?.name || 'not recorded'}. Readiness score: ${readinessScore}. Status: ${readinessStatus}. Mapped findings: ${readiness?.mappedFindingCount || 0}. Priority fixes: ${readiness?.blockerCount || 0}. Missing proof: ${readiness?.missingEvidenceCount || 0}. Unmapped findings: ${readiness?.unmappedFindingCount || 0}. Ship-confidence history: ${shipConfidence.data?.trendSummary || 'not available yet'}. Latest checkpoint: ${shipConfidence.data?.latest ? `${shipConfidence.data.latest.shipConfidenceScore}/100, ${shipConfidence.data.latest.statusLabel}, next step ${shipConfidence.data.latest.suggestedNextStep}` : 'none'}. Mapped services: ${(readiness?.milestoneRisks || []).flatMap((risk) => risk.mappedServices).slice(0, 8).join(', ') || 'none'}. Milestone risks: ${(readiness?.milestoneRisks || []).slice(0, 6).map((risk) => `${risk.milestoneTitle}: ${risk.scannerFindingCount} findings, ${risk.missingEvidenceCount} proof gaps, highest ${risk.highestSeverity || 'none'}`).join('; ') || 'none'}. Tell the owner what could stop shipping, which service work addresses it, what proof is missing, and what decision is safe next. Do not mutate workspace state.`}
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
