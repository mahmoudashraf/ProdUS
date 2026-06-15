'use client';

import { Alert } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';

import { deleteJson, getJson, patchJson, postJson } from './api';
import { PageHeader, QueryState, formatLabel } from './PlatformComponents';
import type { CheckFixesResponse, ScannerRiskSummary } from './types';
import { useWorkspaceCommandActions } from './useWorkspaceCommandActions';
import { useWorkspaceCommandData } from './useWorkspaceCommandData';
import { useWorkspaceCommandRouteState } from './useWorkspaceCommandRouteState';
import { useWorkspaceCommandSummary } from './useWorkspaceCommandSummary';
import { useWorkspaceCommandUiState } from './useWorkspaceCommandUiState';
import WorkspaceCommandBoard from './WorkspaceCommandBoard';
import type { WorkspaceCommandHandoffView } from './WorkspaceCommandHandoffPanels';
import type { WorkspaceCommandView } from './WorkspaceCommandJourneyNav';
import WorkspaceCommandMetricsPanel from './WorkspaceCommandMetricsPanel';
import type { WorkspaceCommandProofView } from './WorkspaceCommandProofStepPanel';
import type { WorkspaceCommandTeamView } from './WorkspaceCommandTeamPanels';
import { workspaceAccent } from './workspaceCommandTeamTypes';

interface IWorkspaceCommandPageProps {
  embedded?: boolean;
  productId?: string | undefined;
  selectedWorkspaceId?: string | null | undefined;
}

export default function WorkspaceCommandPage({
  embedded = false,
  productId,
  selectedWorkspaceId,
}: IWorkspaceCommandPageProps = {}) {
  const {
    pushWorkspaceRoute,
    workspaceHandoffView,
    workspaceParam,
    workspaceProofView,
    workspaceTeamView,
    workspaceView,
  } = useWorkspaceCommandRouteState(
    embedded
      ? {
          handoffViewParamName: 'workspaceHandoffView',
          proofViewParamName: 'workspaceProofView',
          teamViewParamName: 'workspaceTeamView',
          viewParamName: 'workspaceView',
        }
      : undefined
  );
  const effectiveWorkspaceId = selectedWorkspaceId ?? workspaceParam;
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canCoordinate = hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER, UserRole.TEAM_MANAGER]);
  const canAttachEvidence = hasRole([
    UserRole.ADMIN,
    UserRole.PRODUCT_OWNER,
    UserRole.TEAM_MANAGER,
    UserRole.SPECIALIST,
  ]);

  const {
    deliverableForm,
    disputeForm,
    disputeResolutionById,
    disputeStatusById,
    governanceNotice,
    integrationProvider,
    milestoneForm,
    participantForm,
    scannerUploadForm,
    setDisputeResolutionById,
    setDisputeStatusById,
    setGovernanceNotice,
    setIntegrationProvider,
    setScannerUploadForm,
    setSupportResolutionById,
    setSupportStatusById,
    supportForm,
    supportResolutionById,
    supportStatusById,
    workspaceForm,
  } = useWorkspaceCommandUiState();
  const {
    attachmentOpenError,
    attachments,
    clearAttachmentOpenError,
    clearSelectedMilestone,
    catalogModuleList,
    deliverables,
    deliverableList,
    disputeList,
    disputes,
    evidencePanel,
    governance,
    launchReadinessReport,
    milestoneList,
    milestones,
    packageModuleList,
    packageList,
    participantList,
    queriesLoading,
    queryError,
    readiness,
    scannerEvidenceList,
    scopedAttachments,
    selectedMilestone,
    selectedWorkspace,
    selectedWorkspaceProductId,
    setSelectedMilestoneId,
    setSelectedWorkspaceId,
    shipConfidence,
    supportList,
    supportRequests,
    teams,
    uploadAttachment,
    workspaceList,
    workspaceScannerReadiness,
  } = useWorkspaceCommandData({
    canAttachEvidence,
    productId,
    selectedWorkspaceId: effectiveWorkspaceId,
  });
  const workspaceRiskSummary = useQuery({
    queryKey: ['workspace-current-risks', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () =>
      getJson<ScannerRiskSummary>(`/workspaces/${selectedWorkspace?.id}/scanner/risks/current`),
  });
  const checkFixes = useMutation({
    mutationFn: ({
      mode = 'RELEVANT_TO_FIXES',
      riskThreadIds,
    }: {
      mode?: CheckFixesResponse['mode'];
      riskThreadIds: string[];
    }) =>
      postJson<
        CheckFixesResponse,
        {
          riskThreadIds: string[];
          mode: CheckFixesResponse['mode'];
          authorizationConfirmed: boolean;
        }
      >(`/workspaces/${selectedWorkspace?.id}/scanner/check-fixes`, {
        riskThreadIds,
        mode,
        authorizationConfirmed: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-current-risks', selectedWorkspace?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['scanner-current-risks', selectedWorkspaceProductId],
      });
      queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedWorkspaceProductId] });
      queryClient.invalidateQueries({
        queryKey: ['productization-engine', 'workspace-scanner-readiness', selectedWorkspace?.id],
      });
    },
  });
  const removeRiskFromWorkspace = useMutation({
    mutationFn: (riskThreadId: string) => deleteJson(`/scanner/risks/${riskThreadId}/workspace`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-current-risks', selectedWorkspace?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['scanner-current-risks', selectedWorkspaceProductId],
      });
      queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedWorkspaceProductId] });
      queryClient.invalidateQueries({
        queryKey: ['productization-engine', 'workspace-scanner-readiness', selectedWorkspace?.id],
      });
    },
  });
  const changeRiskService = useMutation({
    mutationFn: ({
      note,
      riskThreadId,
      serviceModuleId,
    }: {
      note?: string | undefined;
      riskThreadId: string;
      serviceModuleId: string;
    }) =>
      patchJson(`/scanner/risks/${riskThreadId}/service`, {
        serviceModuleId,
        note,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-current-risks', selectedWorkspace?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['scanner-current-risks', selectedWorkspaceProductId],
      });
      queryClient.invalidateQueries({
        queryKey: ['productization-engine', 'workspace-scanner-readiness', selectedWorkspace?.id],
      });
    },
  });
  const assignService = useMutation({
    mutationFn: (serviceModuleId: string) =>
      postJson('/workspaces/' + selectedWorkspace?.id + '/services', {
        serviceModuleId,
        required: true,
        rationale: 'Added from workspace services.',
        createMilestone: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspaces', selectedWorkspace?.id, 'services'],
      });
      queryClient.invalidateQueries({
        queryKey: ['workspaces', selectedWorkspace?.id, 'milestones'],
      });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({
        queryKey: ['productization-engine', 'workspace-scanner-readiness', selectedWorkspace?.id],
      });
    },
  });
  const removeService = useMutation({
    mutationFn: (packageModuleId: string) =>
      deleteJson('/workspaces/' + selectedWorkspace?.id + '/services/' + packageModuleId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspaces', selectedWorkspace?.id, 'services'],
      });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({
        queryKey: ['productization-engine', 'workspace-scanner-readiness', selectedWorkspace?.id],
      });
    },
  });
  const assignedFindingCount = workspaceRiskSummary.data?.total || 0;

  const openWorkspaceRoute = (
    view: WorkspaceCommandView,
    workspaceId = selectedWorkspace?.id,
    options?: {
      proofView?: WorkspaceCommandProofView;
      teamView?: WorkspaceCommandTeamView;
      handoffView?: WorkspaceCommandHandoffView;
    }
  ) => pushWorkspaceRoute(view, workspaceId, options);

  const openFocusedWorkspaceRoute = (
    view: WorkspaceCommandView,
    workspaceId = selectedWorkspace?.id
  ) => {
    if (view === 'team') {
      openWorkspaceRoute('team', workspaceId);
      return;
    }
    if (view === 'handoff') {
      openWorkspaceRoute('handoff', workspaceId, { handoffView: 'review' });
      return;
    }
    if (view === 'proof') {
      openWorkspaceRoute('proof', workspaceId, {
        proofView: assignedFindingCount ? 'findings' : 'readiness',
      });
      return;
    }
    openWorkspaceRoute(view, workspaceId);
  };
  const openWorkspaceTeamHub = () => openWorkspaceRoute('team');
  const openWorkspaceTeamView = (view: WorkspaceCommandTeamView) =>
    openWorkspaceRoute('team', selectedWorkspace?.id, { teamView: view });
  const openWorkspaceProofHub = () => openWorkspaceRoute('proof');
  const openWorkspaceProofView = (proofView: WorkspaceCommandProofView) =>
    openWorkspaceRoute('proof', selectedWorkspace?.id, { proofView });
  const openWorkspaceHandoffHub = () => openWorkspaceRoute('handoff');
  const openWorkspaceHandoffView = (view: WorkspaceCommandHandoffView) =>
    openWorkspaceRoute('handoff', selectedWorkspace?.id, { handoffView: view });

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
  const {
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
  } = useWorkspaceCommandActions({
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
  });

  return (
    <>
      {!embedded && (
        <PageHeader
          title="Product Workspaces"
          description="One focused place to turn a prototype into a shippable product: fixes, proof, people, and next launch decisions."
        />
      )}
      <QueryState
        isLoading={queriesLoading}
        error={
          queryError ||
          uploadAttachment.error ||
          assignService.error ||
          removeService.error ||
          actionError
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
      {!embedded && workspaceView === 'overview' && (
        <WorkspaceCommandMetricsPanel
          activeWorkspaceCount={activeWorkspaceCount}
          blockedItems={blockedItems}
          completedMilestones={completedMilestones}
          scheduledMilestoneCount={milestoneList.filter(milestone => milestone.dueDate).length}
          totalMilestoneCount={milestoneList.length}
          totalWorkspaceCount={workspaceList.length}
        />
      )}

      <WorkspaceCommandBoard
        workspaceView={workspaceView}
        sidebar={{
          packages: packageList,
          workspaceList,
          selectedWorkspace,
          workspaceForm,
          isCreatingWorkspace: createWorkspace.isPending,
          onSelectWorkspace: workspaceId => {
            setSelectedWorkspaceId(workspaceId);
            clearSelectedMilestone();
            openFocusedWorkspaceRoute(workspaceView, workspaceId);
          },
          onCreateWorkspace: () => createWorkspace.mutate(),
        }}
        selectedWorkspacePane={
          selectedWorkspace
            ? {
                view: workspaceView,
                onViewChange: view => openFocusedWorkspaceRoute(view),
                onOpenHub: () => openWorkspaceRoute('overview'),
                isFetchingWorkspaceDetail:
                  milestones.isFetching ||
                  deliverables.isFetching ||
                  supportRequests.isFetching ||
                  disputes.isFetching ||
                  attachments.isFetching,
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
                  serviceCount: packageModuleList.length,
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
                  packageModules: packageModuleList,
                  participantList,
                  productId: selectedWorkspaceProductId,
                  roughEdgeCount,
                  riskSummary: workspaceRiskSummary.data,
                  scannerEvidenceCount: scannerEvidenceList.length,
                  selectedMilestone,
                  selectedMilestoneCriteria,
                  supportList,
                  workspace: selectedWorkspace,
                  onManageTeam: openWorkspaceTeamHub,
                  onManageServices: () => openFocusedWorkspaceRoute('services'),
                  onPrepareHandoff: () =>
                    openFocusedWorkspaceRoute(roughEdgeCount ? 'team' : 'handoff'),
                  onReviewProof: () =>
                    openWorkspaceRoute('proof', selectedWorkspace.id, {
                      proofView: assignedFindingCount ? 'findings' : 'readiness',
                    }),
                },
                plan: {
                  milestoneList,
                  packageModules: packageModuleList,
                  participantList,
                  riskSummary: workspaceRiskSummary.data,
                  supportList,
                  workspace: selectedWorkspace,
                  onOpenFindings: () =>
                    openWorkspaceRoute('proof', selectedWorkspace.id, {
                      proofView: assignedFindingCount ? 'findings' : 'readiness',
                    }),
                  onOpenMilestones: () => openWorkspaceRoute('milestones', selectedWorkspace.id),
                  onOpenServices: () => openFocusedWorkspaceRoute('services'),
                  onOpenTeam: () => openFocusedWorkspaceRoute('team'),
                },
                proof: {
                  view: workspaceProofView,
                  workspace: selectedWorkspace,
                  productId: selectedWorkspaceProductId,
                  selectedMilestone,
                  milestoneList,
                  deliverableList,
                  catalogModules: catalogModuleList,
                  milestoneRiskById,
                  packageModules: packageModuleList,
                  workspaceRiskSummary: workspaceRiskSummary.data,
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
                  isWorkspaceRiskLoading: workspaceRiskSummary.isFetching,
                  isCheckingFixes: checkFixes.isPending,
                  isGeneratingCriteria: generateCriteria.isPending,
                  isUpdatingEvidenceRequirement: updateEvidenceRequirement.isPending,
                  isCreatingCheck: createCheck.isPending,
                  isReviewingCriterion: reviewCriterion.isPending,
                  canSubmitScannerEvidence:
                    !!selectedWorkspaceProductId &&
                    !!scannerUploadForm.toolName.trim() &&
                    !!scannerUploadForm.artifactPayload.trim(),
                  lastCheckFixes: checkFixes.data,
                  changingServiceRiskId: changeRiskService.isPending
                    ? String(changeRiskService.variables?.riskThreadId || '')
                    : null,
                  removingRiskId: removeRiskFromWorkspace.isPending
                    ? String(removeRiskFromWorkspace.variables || '')
                    : null,
                  onChangeRiskService: (riskId, serviceModuleId, note) =>
                    changeRiskService.mutate({ riskThreadId: riskId, serviceModuleId, note }),
                  onCheckFixes: (riskIds, mode) =>
                    checkFixes.mutate({
                      riskThreadIds: riskIds,
                      mode: mode ?? 'RELEVANT_TO_FIXES',
                    }),
                  onRemoveRisk: riskId => removeRiskFromWorkspace.mutate(riskId),
                  onCreateMilestone: () => createMilestone.mutate(),
                  onCreateDeliverable: () => createDeliverable.mutate(),
                  onSelectMilestone: setSelectedMilestoneId,
                  onScannerUploadFormChange: setScannerUploadForm,
                  onSubmitScannerEvidence: () => uploadScannerEvidence.mutate(),
                  onGenerateLaunchReport: () => generateLaunchReadinessReport.mutate(),
                  onRefreshReadiness: () => enrichScannerReadiness.mutate(),
                  onGenerateCriteria: () => generateCriteria.mutate(),
                  onUpdateEvidenceRequirement: (id, payload) =>
                    updateEvidenceRequirement.mutate({ id, payload }),
                  onCreateCheck: (criterionId, payload) =>
                    createCheck.mutate({ criterionId, payload }),
                  onReviewCriterion: (criterionId, payload) =>
                    reviewCriterion.mutate({ criterionId, payload }),
                  evidencePanel,
                  onOpenHub: openWorkspaceProofHub,
                  onViewChange: openWorkspaceProofView,
                },
              }
            : undefined
        }
        servicesPanel={
          selectedWorkspace && workspaceView === 'services'
            ? {
                canCoordinate,
                catalogModules: catalogModuleList,
                packageModules: packageModuleList,
                isAssigningService: assignService.isPending,
                removingServiceId: removeService.isPending
                  ? String(removeService.variables || '')
                  : null,
                onAssignService: serviceModuleId => assignService.mutate(serviceModuleId),
                onRemoveService: packageModuleId => removeService.mutate(packageModuleId),
              }
            : undefined
        }
        teamPanels={
          workspaceView === 'team'
            ? {
                view: workspaceTeamView,
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
                onSupportStatusChange: (id, status) =>
                  setSupportStatusById(current => ({ ...current, [id]: status })),
                onSupportResolutionChange: (id, resolution) =>
                  setSupportResolutionById(current => ({ ...current, [id]: resolution })),
                onDisputeStatusChange: (id, status) =>
                  setDisputeStatusById(current => ({ ...current, [id]: status })),
                onDisputeResolutionChange: (id, resolution) =>
                  setDisputeResolutionById(current => ({ ...current, [id]: resolution })),
                onOpenHub: openWorkspaceTeamHub,
                onViewChange: openWorkspaceTeamView,
                evidencePanel,
              }
            : undefined
        }
        handoffPanels={
          selectedWorkspace && workspaceView === 'handoff'
            ? {
                view: workspaceHandoffView,
                workspace: selectedWorkspace,
                productId: selectedWorkspaceProductId,
                selectedMilestone,
                completedCheckpointCount: milestoneList.filter(milestone =>
                  ['ACCEPTED', 'COMPLETED', 'DONE'].includes(milestone.status)
                ).length,
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
                onCreateIntegration: providerType =>
                  createIntegration.mutate({
                    providerType,
                    name: `${formatLabel(providerType)} workspace connection`,
                    externalRef: `${selectedWorkspace.name}-${providerType.toLowerCase()}`,
                    scopedAccessNote:
                      'Workspace-scoped access only; no long-lived broad permissions recorded.',
                    status: 'CONFIGURED',
                  }),
                onRecordIntegrationSignal: connectionId =>
                  createIntegrationSignal.mutate({
                    connectionId,
                    payload: {
                      ...(selectedMilestone?.id ? { milestoneId: selectedMilestone.id } : {}),
                      ...(selectedMilestoneCriteria[0]?.id
                        ? { criterionId: selectedMilestoneCriteria[0].id }
                        : {}),
                      signalType: 'workspace-readiness-signal',
                      status: missingEvidenceCount ? 'WARNING' : 'PASSED',
                      summary: missingEvidenceCount
                        ? 'Integration signal recorded with missing acceptance evidence.'
                        : 'Integration signal supports current acceptance evidence.',
                      evidencePayload: JSON.stringify({
                        workspaceId: selectedWorkspace.id,
                        missingEvidenceCount,
                      }),
                    },
                  }),
                onOpenHub: openWorkspaceHandoffHub,
                onViewChange: openWorkspaceHandoffView,
              }
            : undefined
        }
      />
    </>
  );
}
