'use client';

import { Alert } from '@mui/material';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import WorkspaceCommandBoard from './WorkspaceCommandBoard';
import WorkspaceCommandMetricsPanel from './WorkspaceCommandMetricsPanel';
import { useWorkspaceCommandActions } from './useWorkspaceCommandActions';
import { useWorkspaceCommandData } from './useWorkspaceCommandData';
import { useWorkspaceCommandSummary } from './useWorkspaceCommandSummary';
import { useWorkspaceCommandUiState } from './useWorkspaceCommandUiState';
import {
  PageHeader,
  QueryState,
  formatLabel,
} from './PlatformComponents';
import {
  workspaceAccent,
} from './workspaceCommandTeamTypes';

export default function WorkspaceCommandPage() {
  const { hasRole } = useAuth();
  const canCoordinate = hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER, UserRole.TEAM_MANAGER]);
  const canAttachEvidence = hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER, UserRole.TEAM_MANAGER, UserRole.SPECIALIST]);

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
    setWorkspaceView,
    supportForm,
    supportResolutionById,
    supportStatusById,
    workspaceForm,
    workspaceView,
  } = useWorkspaceCommandUiState();
  const {
    attachmentOpenError,
    attachments,
    clearAttachmentOpenError,
    clearSelectedMilestone,
    deliverables,
    deliverableList,
    disputeList,
    disputes,
    evidencePanel,
    governance,
    launchReadinessReport,
    milestoneList,
    milestones,
    packages,
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
  } = useWorkspaceCommandData({ canAttachEvidence });

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
      <PageHeader
        title="Productization Workspaces"
        description="One focused place to turn a prototype into a shippable product: fixes, proof, people, and next launch decisions."
      />
      <QueryState
        isLoading={queriesLoading}
        error={
          queryError
          || uploadAttachment.error
          || actionError
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
