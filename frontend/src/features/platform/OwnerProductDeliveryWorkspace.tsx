'use client';

import { Alert, Button, Stack, Typography } from '@mui/material';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import {
  EmptyState,
  QueryState,
  Surface,
  formatLabel,
} from './PlatformComponents';
import { DeliveryHero, DeliveryJourneyCards, DeliveryOverview } from './OwnerProductDeliveryWorkspacePanels';
import type { WorkspaceCommandHandoffView } from './WorkspaceCommandHandoffPanels';
import WorkspaceCommandHandoffPanels from './WorkspaceCommandHandoffPanels';
import type { WorkspaceCommandProofView } from './WorkspaceCommandProofStepPanel';
import WorkspaceCommandProofStepPanel from './WorkspaceCommandProofStepPanel';
import type { WorkspaceCommandTeamView } from './WorkspaceCommandTeamPanels';
import WorkspaceCommandTeamPanels from './WorkspaceCommandTeamPanels';
import type { WorkspaceCommandView } from './WorkspaceCommandJourneyNav';
import { useWorkspaceCommandActions } from './useWorkspaceCommandActions';
import { useWorkspaceCommandData } from './useWorkspaceCommandData';
import { useWorkspaceCommandRouteState } from './useWorkspaceCommandRouteState';
import { useWorkspaceCommandSummary } from './useWorkspaceCommandSummary';
import { useWorkspaceCommandUiState } from './useWorkspaceCommandUiState';
import type { ProductProfile, ProjectWorkspace } from './types';

interface OwnerProductDeliveryWorkspaceProps {
  listHref: string;
  product: ProductProfile;
  workspace: ProjectWorkspace;
}

const deliveryViewLabels: Record<WorkspaceCommandView, string> = {
  overview: 'Overview',
  proof: 'Fixes & proof',
  team: 'Team & support',
  handoff: 'Handoff',
};

export default function OwnerProductDeliveryWorkspace({
  listHref,
  product,
  workspace,
}: OwnerProductDeliveryWorkspaceProps) {
  const {
    pushWorkspaceRoute,
    workspaceHandoffView,
    workspaceProofView,
    workspaceTeamView,
    workspaceView,
  } = useWorkspaceCommandRouteState({
    handoffViewParamName: 'workspaceHandoffView',
    proofViewParamName: 'workspaceProofView',
    teamViewParamName: 'workspaceTeamView',
    viewParamName: 'workspaceView',
  });
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
    supportForm,
    supportResolutionById,
    supportStatusById,
    workspaceForm,
  } = useWorkspaceCommandUiState();
  const {
    attachmentOpenError,
    clearAttachmentOpenError,
    clearSelectedMilestone,
    deliverableList,
    disputeList,
    evidencePanel,
    governance,
    launchReadinessReport,
    milestoneList,
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
    teams,
    workspaceList,
    workspaceScannerReadiness,
  } = useWorkspaceCommandData({
    canAttachEvidence,
    productId: product.id,
    selectedWorkspaceId: workspace.id,
  });
  const activeWorkspace = selectedWorkspace || workspace;
  const effectiveProductId = selectedWorkspaceProductId || product.id;
  const {
    completedMilestones,
    deliverableCount,
    governanceCriteria,
    integrationList,
    latestHandoff,
    latestHealthReview,
    latestIntegration,
    milestoneRiskById,
    missingEvidenceCount,
    participantCount,
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
    selectedWorkspace: activeWorkspace,
    selectedWorkspaceProductId: effectiveProductId,
    setGovernanceNotice,
    setScannerUploadForm,
    setSelectedMilestoneId,
    setSelectedWorkspaceId,
    supportForm,
    supportList,
    workspaceForm,
    workspaceProgress,
  });

  const openDeliveryView = (
    view: WorkspaceCommandView,
    options?: {
      proofView?: WorkspaceCommandProofView;
      teamView?: WorkspaceCommandTeamView;
      handoffView?: WorkspaceCommandHandoffView;
    },
  ) => {
    if (view !== workspaceView) clearSelectedMilestone();
    pushWorkspaceRoute(view, activeWorkspace.id, options);
  };
  const nextActionView: WorkspaceCommandView = readiness?.blockerCount || missingEvidenceCount ? 'proof' : roughEdgeCount ? 'team' : 'handoff';

  if (!activeWorkspace) {
    return (
      <Surface>
        <EmptyState label="This workspace is still loading. If it does not appear, go back and choose another assigned workspace." />
      </Surface>
    );
  }

  return (
    <Stack spacing={2.5}>
      <QueryState
        isLoading={queriesLoading}
        error={queryError || actionError}
      />
      {governanceNotice && (
        <Alert severity="success" onClose={() => setGovernanceNotice('')}>
          {governanceNotice}
        </Alert>
      )}
      {attachmentOpenError && (
        <Alert severity="error" onClose={clearAttachmentOpenError}>
          {attachmentOpenError}
        </Alert>
      )}

      <DeliveryHero
        activeWorkspace={activeWorkspace}
        completedMilestones={completedMilestones}
        deliverableCount={deliverableCount}
        listHref={listHref}
        milestoneCount={milestoneList.length}
        missingEvidenceCount={missingEvidenceCount}
        participantCount={participantCount}
        product={product}
        proofFileCount={scopedAttachments('WORKSPACE', activeWorkspace.id).length}
        readinessBlockers={readiness?.blockerCount || 0}
        roughEdgeCount={roughEdgeCount}
        workspaceProgress={workspaceProgress}
        workspaceCount={workspaceList.length}
        onNextAction={() => openDeliveryView(nextActionView)}
      />

      <DeliveryJourneyCards
        currentView={workspaceView}
        handoffReady={!!latestHandoff}
        integrationCount={integrationList.length}
        milestoneCount={milestoneList.length}
        missingEvidenceCount={missingEvidenceCount}
        participantCount={participantCount}
        readinessBlockers={readiness?.blockerCount || 0}
        roughEdgeCount={roughEdgeCount}
        supportCount={supportList.length}
        onChange={openDeliveryView}
      />

      {workspaceView !== 'overview' && (
        <Surface sx={{ py: 1.25 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between">
            <Stack spacing={0.25}>
              <Typography variant="body2" color="text.secondary">
                Delivery internal page
              </Typography>
              <Typography variant="h4">{deliveryViewLabels[workspaceView]}</Typography>
            </Stack>
            <Button variant="outlined" onClick={() => openDeliveryView('overview')} sx={{ minHeight: 40, alignSelf: { xs: 'stretch', sm: 'center' } }}>
              Back to delivery overview
            </Button>
          </Stack>
        </Surface>
      )}

      {workspaceView === 'overview' && (
        <DeliveryOverview
          activeWorkspace={activeWorkspace}
          completedMilestones={completedMilestones}
          deliverableList={deliverableList}
          milestoneCount={milestoneList.length}
          missingEvidenceCount={missingEvidenceCount}
          readinessBlockers={readiness?.blockerCount || 0}
          scannerEvidenceCount={scannerEvidenceList.length}
          selectedMilestone={selectedMilestone}
          selectedMilestoneCriteria={selectedMilestoneCriteria}
          workspaceProgress={workspaceProgress}
          onPrepareHandoff={() => openDeliveryView(roughEdgeCount ? 'team' : 'handoff')}
          onReviewProof={() => openDeliveryView('proof')}
        />
      )}

      {workspaceView === 'proof' && (
        <WorkspaceCommandProofStepPanel
          view={workspaceProofView}
          workspace={activeWorkspace}
          productId={effectiveProductId}
          selectedMilestone={selectedMilestone}
          milestoneList={milestoneList}
          deliverableList={deliverableList}
          milestoneRiskById={milestoneRiskById}
          milestoneForm={milestoneForm}
          deliverableForm={deliverableForm}
          scannerEvidenceList={scannerEvidenceList}
          scannerUploadForm={scannerUploadForm}
          selectedMilestoneCriteria={selectedMilestoneCriteria}
          totalCriteriaCount={governanceCriteria.length}
          passedCriteriaCount={passedCriteriaCount}
          readiness={readiness}
          readinessScore={readinessScore}
          readinessStatus={readinessStatus}
          launchReport={launchReadinessReport.data ?? null}
          shipConfidence={shipConfidence.data}
          proofFileCount={scopedAttachments('WORKSPACE', activeWorkspace.id).length}
          isCreatingMilestone={createMilestone.isPending}
          isCreatingDeliverable={createDeliverable.isPending}
          isUploadingScannerEvidence={uploadScannerEvidence.isPending}
          isGeneratingLaunchReport={generateLaunchReadinessReport.isPending}
          isLaunchReportLoading={launchReadinessReport.isFetching}
          isRefreshingReadiness={enrichScannerReadiness.isPending}
          isScannerLoading={workspaceScannerReadiness.isFetching}
          isShipConfidenceLoading={shipConfidence.isFetching}
          isGovernanceFetching={governance.isFetching}
          isGeneratingCriteria={generateCriteria.isPending}
          isUpdatingEvidenceRequirement={updateEvidenceRequirement.isPending}
          isCreatingCheck={createCheck.isPending}
          isReviewingCriterion={reviewCriterion.isPending}
          canSubmitScannerEvidence={!!effectiveProductId && !!scannerUploadForm.toolName.trim() && !!scannerUploadForm.artifactPayload.trim()}
          onCreateMilestone={() => createMilestone.mutate()}
          onCreateDeliverable={() => createDeliverable.mutate()}
          onSelectMilestone={setSelectedMilestoneId}
          onScannerUploadFormChange={setScannerUploadForm}
          onSubmitScannerEvidence={() => uploadScannerEvidence.mutate()}
          onGenerateLaunchReport={() => generateLaunchReadinessReport.mutate()}
          onRefreshReadiness={() => enrichScannerReadiness.mutate()}
          onGenerateCriteria={() => generateCriteria.mutate()}
          onUpdateEvidenceRequirement={(id, payload) => updateEvidenceRequirement.mutate({ id, payload })}
          onCreateCheck={(criterionId, payload) => createCheck.mutate({ criterionId, payload })}
          onReviewCriterion={(criterionId, payload) => reviewCriterion.mutate({ criterionId, payload })}
          evidencePanel={evidencePanel}
          onOpenHub={() => openDeliveryView('proof')}
          onViewChange={(proofView) => openDeliveryView('proof', { proofView })}
        />
      )}

      {workspaceView === 'team' && (
        <WorkspaceCommandTeamPanels
          view={workspaceTeamView}
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
          onOpenHub={() => openDeliveryView('team')}
          onViewChange={(teamView) => openDeliveryView('team', { teamView })}
          evidencePanel={evidencePanel}
        />
      )}

      {workspaceView === 'handoff' && (
        <WorkspaceCommandHandoffPanels
          view={workspaceHandoffView}
          workspace={activeWorkspace}
          productId={effectiveProductId}
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
            externalRef: `${activeWorkspace.name}-${providerType.toLowerCase()}`,
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
              evidencePayload: JSON.stringify({ workspaceId: activeWorkspace.id, missingEvidenceCount }),
            },
          })}
          onOpenHub={() => openDeliveryView('handoff')}
          onViewChange={(handoffView) => openDeliveryView('handoff', { handoffView })}
        />
      )}
    </Stack>
  );
}
