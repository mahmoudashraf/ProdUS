'use client';

import { useState } from 'react';
import { Alert } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson, postJson, putJson } from './api';
import WorkspaceCommandBoard from './WorkspaceCommandBoard';
import type { WorkspaceCommandView } from './WorkspaceCommandJourneyNav';
import WorkspaceCommandMetricsPanel from './WorkspaceCommandMetricsPanel';
import { useWorkspaceCommandMilestoneSelection, useWorkspaceCommandSelection } from './useWorkspaceCommandSelection';
import { useWorkspaceCommandSummary } from './useWorkspaceCommandSummary';
import { useWorkspaceEvidenceAttachmentControls } from './useWorkspaceEvidenceAttachmentControls';
import {
  PageHeader,
  QueryState,
  formatLabel,
} from './PlatformComponents';
import {
  type DeliverableFormValues as DeliverablePayload,
  type DisputeFormValues as DisputePayload,
  type DisputeStatusPayload,
  type MilestoneFormValues as MilestonePayload,
  type ParticipantFormValues as ParticipantPayload,
  type SupportRequestFormValues as SupportRequestPayload,
  type SupportStatusPayload,
  type WorkspaceFormValues as WorkspacePayload,
  type WorkspaceScannerUploadPayload as ScannerUploadPayload,
  initialActiveWorkspaceValues,
  initialDeliverableValues,
  initialDisputeValues,
  initialMilestoneValues,
  initialParticipantValues,
  initialSupportRequestValues,
  initialWorkspaceScannerUploadValues,
  workspaceAccent,
} from './workspaceCommandTeamTypes';
import {
  AcceptanceCriterion,
  AutomatedCheck,
  Deliverable,
  DisputeCase,
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

interface WorkspaceScannerReadinessPayload {
  createCriteria: boolean;
  createServiceRecommendations: boolean;
  includeAcceptedRisk: boolean;
  summary: string;
}

export default function WorkspaceCommandPage() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canCoordinate = hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER, UserRole.TEAM_MANAGER]);
  const canAttachEvidence = hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER, UserRole.TEAM_MANAGER, UserRole.SPECIALIST]);

  const packages = useQuery({ queryKey: ['packages'], queryFn: () => getJson<PackageInstance[]>('/packages') });
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: () => getJson<ProjectWorkspace[]>('/workspaces') });
  const teams = useQuery({ queryKey: ['teams'], queryFn: () => getJson<Team[]>('/teams') });

  const [supportStatusById, setSupportStatusById] = useState<Record<string, SupportRequest['status']>>({});
  const [supportResolutionById, setSupportResolutionById] = useState<Record<string, string>>({});
  const [disputeStatusById, setDisputeStatusById] = useState<Record<string, DisputeCase['status']>>({});
  const [disputeResolutionById, setDisputeResolutionById] = useState<Record<string, string>>({});
  const [governanceNotice, setGovernanceNotice] = useState('');
  const [integrationProvider, setIntegrationProvider] = useState<IntegrationConnection['providerType']>('GITHUB');
  const [workspaceView, setWorkspaceView] = useState<WorkspaceCommandView>('overview');
  const [scannerUploadForm, setScannerUploadForm] = useState(initialWorkspaceScannerUploadValues);

  const workspaceForm = useAdvancedForm<WorkspacePayload>({
    initialValues: initialActiveWorkspaceValues,
    validationRules: {
      packageInstanceId: [{ type: 'required', message: 'Service plan is required' }],
    },
  });
  const milestoneForm = useAdvancedForm<MilestonePayload>({
    initialValues: initialMilestoneValues,
    validationRules: {
      title: [{ type: 'required', message: 'Milestone title is required' }],
    },
  });
  const deliverableForm = useAdvancedForm<DeliverablePayload>({
    initialValues: initialDeliverableValues,
    validationRules: {
      title: [{ type: 'required', message: 'Deliverable title is required' }],
    },
  });
  const participantForm = useAdvancedForm<ParticipantPayload>({
    initialValues: initialParticipantValues,
    validationRules: {
      email: [
        { type: 'required', message: 'Participant email is required' },
        { type: 'email', message: 'Use a valid email address' },
      ],
    },
  });
  const supportForm = useAdvancedForm<SupportRequestPayload>({
    initialValues: initialSupportRequestValues,
    validationRules: {
      title: [{ type: 'required', message: 'Support title is required' }],
      description: [{ type: 'required', message: 'Support context is required' }],
    },
  });
  const disputeForm = useAdvancedForm<DisputePayload>({
    initialValues: initialDisputeValues,
    validationRules: {
      title: [{ type: 'required', message: 'Risk title is required' }],
      description: [{ type: 'required', message: 'Risk context is required' }],
    },
  });

  const {
    selectedWorkspace,
    selectedWorkspaceProductId,
    setSelectedWorkspaceId,
    workspaceList,
  } = useWorkspaceCommandSelection(workspaces.data || []);

  const milestones = useQuery({
    queryKey: ['workspaces', selectedWorkspace?.id, 'milestones'],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<Milestone[]>(`/workspaces/${selectedWorkspace?.id}/milestones`),
  });
  const milestoneList = milestones.data || [];
  const {
    clearSelectedMilestone,
    selectedMilestone,
    setSelectedMilestoneId,
  } = useWorkspaceCommandMilestoneSelection(milestoneList);

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
  const {
    attachmentOpenError,
    attachments,
    clearAttachmentOpenError,
    evidencePanel,
    scopedAttachments,
    uploadAttachment,
  } = useWorkspaceEvidenceAttachmentControls({
    canAttachEvidence,
    selectedWorkspaceId: selectedWorkspace?.id,
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
  const {
    activeWorkspaceCount,
    blockedItems,
    completedMilestones,
    governanceCriteria,
    integrationList,
    latestHandoff,
    latestHealthReview,
    latestIntegration,
    milestoneRiskById,
    missingEvidenceCount,
    passedCriteriaCount,
    readinessScore,
    readinessStatus,
    roughEdgeCount,
    selectedMilestoneCriteria,
    workspaceProgress,
  } = useWorkspaceCommandSummary({
    workspaceList,
    milestoneList,
    deliverableList,
    participantList,
    supportList,
    disputeList,
    scannerEvidenceList,
    readiness,
    governance: governance.data,
    selectedMilestone,
  });

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
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearAttachmentOpenError}>
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

      <WorkspaceCommandBoard
        workspaceView={workspaceView}
        sidebar={{
          packages: packages.data || [],
          workspaceList,
          selectedWorkspace,
          workspaceForm,
          isCreatingWorkspace: createWorkspace.isPending,
          onSelectWorkspace: (workspaceId) => {
            setSelectedWorkspaceId(workspaceId);
            clearSelectedMilestone();
          },
          onCreateWorkspace: () => createWorkspace.mutate(),
        }}
        selectedWorkspacePane={selectedWorkspace ? {
          view: workspaceView,
          onViewChange: setWorkspaceView,
          isFetchingWorkspaceDetail: milestones.isFetching || deliverables.isFetching || supportRequests.isFetching || disputes.isFetching || attachments.isFetching,
          hero: {
            workspace: selectedWorkspace,
            progress: workspaceProgress,
            accent: workspaceAccent(selectedWorkspace.status),
            milestoneCount: milestoneList.length,
            participantCount: participantList.length,
            deliverableCount: deliverableList.length,
            proofFileCount: scopedAttachments('WORKSPACE', selectedWorkspace.id).length,
            roughEdgeCount,
          },
          journey: {
            priorityFixes: readiness?.blockerCount || 0,
            proofGaps: readiness?.missingEvidenceCount || missingEvidenceCount,
            milestoneCount: milestoneList.length,
            participantCount: participantList.length,
            supportCount: supportList.length,
            riskCount: disputeList.length,
            integrationCount: integrationList.length,
            hasHandoff: !!latestHandoff,
          },
          overview: {
            blockerCount: readiness?.blockerCount || 0,
            deliverableList,
            milestoneCount: milestoneList.length,
            missingEvidenceCount,
            productId: selectedWorkspaceProductId,
            roughEdgeCount,
            scannerEvidenceCount: scannerEvidenceList.length,
            selectedMilestone,
            selectedMilestoneCriteria,
            workspace: selectedWorkspace,
            onPrepareHandoff: () => setWorkspaceView(roughEdgeCount ? 'team' : 'handoff'),
            onReviewProof: () => setWorkspaceView('proof'),
          },
          proof: {
            workspace: selectedWorkspace,
            productId: selectedWorkspaceProductId,
            selectedMilestone,
            milestoneList,
            deliverableList,
            milestoneRiskById,
            milestoneForm,
            deliverableForm,
            scannerEvidenceList,
            scannerUploadForm,
            selectedMilestoneCriteria,
            totalCriteriaCount: governanceCriteria.length,
            passedCriteriaCount,
            readiness,
            readinessScore,
            readinessStatus,
            launchReport: launchReadinessReport.data ?? null,
            shipConfidence: shipConfidence.data,
            proofFileCount: scopedAttachments('WORKSPACE', selectedWorkspace.id).length,
            isCreatingMilestone: createMilestone.isPending,
            isCreatingDeliverable: createDeliverable.isPending,
            isUploadingScannerEvidence: uploadScannerEvidence.isPending,
            isGeneratingLaunchReport: generateLaunchReadinessReport.isPending,
            isLaunchReportLoading: launchReadinessReport.isFetching,
            isRefreshingReadiness: enrichScannerReadiness.isPending,
            isScannerLoading: workspaceScannerReadiness.isFetching,
            isShipConfidenceLoading: shipConfidence.isFetching,
            isGovernanceFetching: governance.isFetching,
            isGeneratingCriteria: generateCriteria.isPending,
            isUpdatingEvidenceRequirement: updateEvidenceRequirement.isPending,
            isCreatingCheck: createCheck.isPending,
            isReviewingCriterion: reviewCriterion.isPending,
            canSubmitScannerEvidence: !!selectedWorkspaceProductId && !!scannerUploadForm.toolName.trim() && !!scannerUploadForm.artifactPayload.trim(),
            onCreateMilestone: () => createMilestone.mutate(),
            onCreateDeliverable: () => createDeliverable.mutate(),
            onSelectMilestone: setSelectedMilestoneId,
            onScannerUploadFormChange: setScannerUploadForm,
            onSubmitScannerEvidence: () => uploadScannerEvidence.mutate(),
            onGenerateLaunchReport: () => generateLaunchReadinessReport.mutate(),
            onRefreshReadiness: () => enrichScannerReadiness.mutate(),
            onGenerateCriteria: () => generateCriteria.mutate(),
            onUpdateEvidenceRequirement: (id, payload) => updateEvidenceRequirement.mutate({ id, payload }),
            onCreateCheck: (criterionId, payload) => createCheck.mutate({ criterionId, payload }),
            onReviewCriterion: (criterionId, payload) => reviewCriterion.mutate({ criterionId, payload }),
            evidencePanel,
          },
        } : undefined}
        teamPanels={workspaceView === 'team' ? {
          canCoordinate,
          teams: teams.data || [],
          participantList,
          supportList,
          disputeList,
          participantForm,
          supportForm,
          disputeForm,
          isAddingParticipant: addParticipant.isPending,
          isCreatingSupport: createSupport.isPending,
          isUpdatingSupport: updateSupport.isPending,
          isCreatingDispute: createDispute.isPending,
          isUpdatingDispute: updateDispute.isPending,
          supportStatusById,
          supportResolutionById,
          disputeStatusById,
          disputeResolutionById,
          onAddParticipant: () => addParticipant.mutate(),
          onCreateSupport: () => createSupport.mutate(),
          onUpdateSupport: (id, payload) => updateSupport.mutate({ id, payload }),
          onCreateDispute: () => createDispute.mutate(),
          onUpdateDispute: (id, payload) => updateDispute.mutate({ id, payload }),
          onSupportStatusChange: (id, status) => setSupportStatusById((current) => ({ ...current, [id]: status })),
          onSupportResolutionChange: (id, resolution) => setSupportResolutionById((current) => ({ ...current, [id]: resolution })),
          onDisputeStatusChange: (id, status) => setDisputeStatusById((current) => ({ ...current, [id]: status })),
          onDisputeResolutionChange: (id, resolution) => setDisputeResolutionById((current) => ({ ...current, [id]: resolution })),
          evidencePanel,
        } : undefined}
        handoffPanels={selectedWorkspace && workspaceView === 'handoff' ? {
          workspace: selectedWorkspace,
          productId: selectedWorkspaceProductId,
          selectedMilestone,
          completedCheckpointCount: milestoneList.filter((milestone) => ['ACCEPTED', 'COMPLETED', 'DONE'].includes(milestone.status)).length,
          milestoneCount: milestoneList.length,
          supportCount: supportList.length,
          riskCount: disputeList.length,
          missingEvidenceCount,
          workspaceProgress,
          canCoordinate,
          latestHandoff,
          latestHealthReview,
          integrationList,
          latestIntegration,
          integrationProvider,
          isPreparingHandoff: upsertHandoff.isPending,
          isPublishingHealthReview: createHealthReview.isPending,
          isCreatingIntegration: createIntegration.isPending,
          isRecordingSignal: createIntegrationSignal.isPending,
          onIntegrationProviderChange: setIntegrationProvider,
          onPrepareHandoff: () => upsertHandoff.mutate(),
          onPublishHealthReview: () => createHealthReview.mutate(),
          onCreateIntegration: (providerType) => createIntegration.mutate({
            providerType,
            name: `${formatLabel(providerType)} workspace connection`,
            externalRef: `${selectedWorkspace.name}-${providerType.toLowerCase()}`,
            scopedAccessNote: 'Workspace-scoped access only; no long-lived broad permissions recorded.',
            status: 'CONFIGURED',
          }),
          onRecordIntegrationSignal: (connectionId) => createIntegrationSignal.mutate({
            connectionId,
            payload: {
              ...(selectedMilestone?.id ? { milestoneId: selectedMilestone.id } : {}),
              ...(selectedMilestoneCriteria[0]?.id ? { criterionId: selectedMilestoneCriteria[0].id } : {}),
              signalType: 'workspace-readiness-signal',
              status: missingEvidenceCount ? 'WARNING' : 'PASSED',
              summary: missingEvidenceCount ? 'Integration signal recorded with missing acceptance evidence.' : 'Integration signal supports current acceptance evidence.',
              evidencePayload: JSON.stringify({ workspaceId: selectedWorkspace.id, missingEvidenceCount }),
            },
          }),
        } : undefined}
      />
    </>
  );
}
