'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postJson, putJson } from './api';
import {
  buildWorkspaceHandoffPayload,
  buildWorkspaceHealthPayload,
  buildWorkspaceLaunchReportPayload,
  buildWorkspaceScannerReadinessPayload,
  buildWorkspaceScannerUploadPayload,
} from './workspaceCommandActionPayloads';
import type {
  CheckPayload,
  EvidenceStatusPayload,
  HandoffPayload,
  HealthPayload,
  IntegrationPayload,
  ReviewPayload,
  SignalPayload,
  WorkspaceScannerReadinessPayload,
} from './workspaceCommandActionTypes';
import type {
  DeliverableFormValues,
  DisputeStatusPayload,
  DisputeFormValues,
  MilestoneFormValues,
  ParticipantFormValues,
  SupportRequestFormValues,
  SupportStatusPayload,
  WorkspaceFormValues,
  WorkspaceScannerUploadFormValues,
  WorkspaceScannerUploadPayload,
} from './workspaceCommandTeamTypes';
import type {
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
  ProductHealthReview,
  ProjectWorkspace,
  ReviewDecision,
  ScanRun,
  SupportRequest,
  WorkspaceParticipant,
  WorkspaceScannerReadiness,
} from './types';

interface WorkspaceCommandMutationForm<TValues> {
  values: TValues;
  resetForm: () => void;
}

interface WorkspaceCommandActionsInput {
  deliverableForm: WorkspaceCommandMutationForm<DeliverableFormValues>;
  disputeForm: WorkspaceCommandMutationForm<DisputeFormValues>;
  disputeList: DisputeCase[];
  milestoneForm: WorkspaceCommandMutationForm<MilestoneFormValues>;
  participantForm: WorkspaceCommandMutationForm<ParticipantFormValues>;
  selectedMilestone: Milestone | undefined;
  selectedWorkspace: ProjectWorkspace | undefined;
  selectedWorkspaceProductId: string;
  setGovernanceNotice: (notice: string) => void;
  setScannerUploadForm: Dispatch<SetStateAction<WorkspaceScannerUploadFormValues>>;
  setSelectedMilestoneId: (milestoneId: string) => void;
  setSelectedWorkspaceId: (workspaceId: string) => void;
  scannerUploadForm: WorkspaceScannerUploadFormValues;
  supportForm: WorkspaceCommandMutationForm<SupportRequestFormValues>;
  supportList: SupportRequest[];
  workspaceForm: WorkspaceCommandMutationForm<WorkspaceFormValues>;
  workspaceProgress: number;
}

export function useWorkspaceCommandActions({
  deliverableForm,
  disputeForm,
  disputeList,
  milestoneForm,
  participantForm,
  scannerUploadForm,
  selectedMilestone,
  selectedWorkspace,
  selectedWorkspaceProductId,
  setGovernanceNotice,
  setScannerUploadForm,
  setSelectedMilestoneId,
  setSelectedWorkspaceId,
  supportForm,
  supportList,
  workspaceForm,
  workspaceProgress,
}: WorkspaceCommandActionsInput) {
  const queryClient = useQueryClient();
  const refreshGovernance = async () => {
    await queryClient.invalidateQueries({ queryKey: ['productization-engine', 'workspace-governance', selectedWorkspace?.id] });
    await queryClient.invalidateQueries({ queryKey: ['productization-engine', 'workspace-scanner-readiness', selectedWorkspace?.id] });
    await queryClient.invalidateQueries({ queryKey: ['productization-engine', 'workspace-ship-confidence', selectedWorkspace?.id] });
    await queryClient.invalidateQueries({ queryKey: ['productization-engine', 'workspace-launch-readiness-report', selectedWorkspace?.id] });
    await queryClient.invalidateQueries({ queryKey: ['workspaces', selectedWorkspace?.id, 'milestones'] });
  };

  const createWorkspace = useMutation({
    mutationFn: () => postJson<ProjectWorkspace, WorkspaceFormValues>('/workspaces', workspaceForm.values),
    onSuccess: async (workspace) => {
      workspaceForm.resetForm();
      setSelectedWorkspaceId(workspace.id);
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
  const createMilestone = useMutation({
    mutationFn: () => postJson<Milestone, MilestoneFormValues>(`/workspaces/${selectedWorkspace?.id}/milestones`, milestoneForm.values),
    onSuccess: async (milestone) => {
      milestoneForm.resetForm();
      setSelectedMilestoneId(milestone.id);
      await queryClient.invalidateQueries({ queryKey: ['workspaces', selectedWorkspace?.id, 'milestones'] });
    },
  });
  const createDeliverable = useMutation({
    mutationFn: () => postJson<Deliverable, DeliverableFormValues>(`/workspaces/milestones/${selectedMilestone?.id}/deliverables`, deliverableForm.values),
    onSuccess: async () => {
      deliverableForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['workspaces', 'milestones', selectedMilestone?.id, 'deliverables'] });
    },
  });
  const addParticipant = useMutation({
    mutationFn: () => postJson<WorkspaceParticipant, ParticipantFormValues>(`/workspaces/${selectedWorkspace?.id}/participants`, participantForm.values),
    onSuccess: async () => {
      participantForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['workspaces', selectedWorkspace?.id, 'participants'] });
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
  const createSupport = useMutation({
    mutationFn: () => postJson<SupportRequest, SupportRequestFormValues>(`/commerce/workspaces/${selectedWorkspace?.id}/support-requests`, supportForm.values),
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
    mutationFn: () => postJson<DisputeCase, DisputeFormValues>(`/commerce/workspaces/${selectedWorkspace?.id}/disputes`, disputeForm.values),
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
      postJson<HandoffDocument, HandoffPayload>(
        `/productization-engine/workspaces/${selectedWorkspace?.id}/handoff`,
        buildWorkspaceHandoffPayload(selectedWorkspace?.name)
      ),
    onSuccess: async () => {
      setGovernanceNotice('Handoff document prepared for owner review.');
      await refreshGovernance();
    },
  });
  const createHealthReview = useMutation({
    mutationFn: () =>
      postJson<ProductHealthReview, HealthPayload>(
        `/productization-engine/workspaces/${selectedWorkspace?.id}/health-reviews`,
        buildWorkspaceHealthPayload({
          disputeCount: disputeList.length,
          supportCount: supportList.length,
          workspaceProgress,
        })
      ),
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
      postJson<WorkspaceScannerReadiness, WorkspaceScannerReadinessPayload>(
        `/productization-engine/workspaces/${selectedWorkspace?.id}/scanner-readiness/enrich`,
        buildWorkspaceScannerReadinessPayload()
      ),
    onSuccess: async () => {
      setGovernanceNotice('Workspace scanner readiness refreshed and linked to milestone evidence.');
      await refreshGovernance();
      await queryClient.invalidateQueries({ queryKey: ['scanner-evidence', selectedWorkspace?.id] });
    },
  });
  const generateLaunchReadinessReport = useMutation({
    mutationFn: () =>
      postJson<LaunchReadinessReport, { focus: string }>(
        `/productization-engine/workspaces/${selectedWorkspace?.id}/launch-readiness-report`,
        buildWorkspaceLaunchReportPayload()
      ),
    onSuccess: async () => {
      setGovernanceNotice('Launch readiness report generated from this workspace evidence.');
      await refreshGovernance();
    },
  });
  const uploadScannerEvidence = useMutation({
    mutationFn: () =>
      postJson<ScanRun, WorkspaceScannerUploadPayload>('/scanner/runs/ci-upload', buildWorkspaceScannerUploadPayload({
        scannerUploadForm,
        selectedMilestoneId: selectedMilestone?.id,
        selectedWorkspaceId: selectedWorkspace?.id || '',
        selectedWorkspaceProductId,
      })),
    onSuccess: async () => {
      setScannerUploadForm((current) => ({ ...current, artifactPayload: '' }));
      setGovernanceNotice('Scanner evidence normalized and attached to this workspace.');
      await queryClient.invalidateQueries({ queryKey: ['scanner-evidence', selectedWorkspace?.id] });
      await refreshGovernance();
    },
  });
  const actionError = createWorkspace.error
    || createMilestone.error
    || createDeliverable.error
    || addParticipant.error
    || createSupport.error
    || updateSupport.error
    || createDispute.error
    || updateDispute.error
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
    || uploadScannerEvidence.error;

  return {
    actionError,
    addParticipant,
    createCheck,
    createDeliverable,
    createDispute,
    createHealthReview,
    createIntegration,
    createIntegrationSignal,
    createMilestone,
    createSupport,
    createWorkspace,
    enrichScannerReadiness,
    generateCriteria,
    generateLaunchReadinessReport,
    reviewCriterion,
    updateDispute,
    updateEvidenceRequirement,
    updateSupport,
    uploadScannerEvidence,
    upsertHandoff,
  };
}
