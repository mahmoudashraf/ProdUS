'use client';

import { Alert, Button, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';

import { deleteJson, getJson, postJson } from './api';
import {
  DeliveryHero,
  DeliveryJourneyCards,
  DeliveryOverview,
} from './OwnerProductDeliveryWorkspacePanels';
import { EmptyState, QueryState, Surface, formatLabel } from './PlatformComponents';
import type {
  CheckFixesResponse,
  ProductProfile,
  ProjectWorkspace,
  ScannerRiskSummary,
} from './types';
import { useWorkspaceCommandActions } from './useWorkspaceCommandActions';
import { useWorkspaceCommandData } from './useWorkspaceCommandData';
import { useWorkspaceCommandRouteState } from './useWorkspaceCommandRouteState';
import { useWorkspaceCommandSummary } from './useWorkspaceCommandSummary';
import { useWorkspaceCommandUiState } from './useWorkspaceCommandUiState';
import type { WorkspaceCommandHandoffView } from './WorkspaceCommandHandoffPanels';
import WorkspaceCommandHandoffPanels from './WorkspaceCommandHandoffPanels';
import type { WorkspaceCommandView } from './WorkspaceCommandJourneyNav';
import type { WorkspaceCommandProofView } from './WorkspaceCommandProofStepPanel';
import WorkspaceCommandProofStepPanel from './WorkspaceCommandProofStepPanel';
import WorkspaceCommandServicesPanel from './WorkspaceCommandServicesPanel';
import type { WorkspaceCommandTeamView } from './WorkspaceCommandTeamPanels';
import WorkspaceCommandTeamPanels from './WorkspaceCommandTeamPanels';

interface IOwnerProductDeliveryWorkspaceProps {
  listHref: string;
  product: ProductProfile;
  workspace: ProjectWorkspace;
}

const deliveryViewLabels: Record<WorkspaceCommandView, string> = {
  overview: 'Overview',
  services: 'Services',
  proof: 'Findings & proof',
  team: 'Team & support',
  handoff: 'Handoff',
};

export default function OwnerProductDeliveryWorkspace({
  listHref,
  product,
  workspace,
}: IOwnerProductDeliveryWorkspaceProps) {
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
    catalogModuleList,
    clearAttachmentOpenError,
    clearSelectedMilestone,
    deliverableList,
    disputeList,
    evidencePanel,
    governance,
    launchReadinessReport,
    milestoneList,
    packageModuleList,
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
  const workspaceRiskSummary = useQuery({
    queryKey: ['workspace-current-risks', activeWorkspace.id],
    enabled: !!activeWorkspace.id,
    queryFn: () =>
      getJson<ScannerRiskSummary>(`/workspaces/${activeWorkspace.id}/scanner/risks/current`),
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
      >(`/workspaces/${activeWorkspace.id}/scanner/check-fixes`, {
        riskThreadIds,
        mode,
        authorizationConfirmed: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-current-risks', activeWorkspace.id] });
      queryClient.invalidateQueries({ queryKey: ['scanner-current-risks', effectiveProductId] });
      queryClient.invalidateQueries({ queryKey: ['scanner-summary', effectiveProductId] });
      queryClient.invalidateQueries({
        queryKey: ['productization-engine', 'workspace-scanner-readiness', activeWorkspace.id],
      });
    },
  });
  const removeRiskFromWorkspace = useMutation({
    mutationFn: (riskThreadId: string) => deleteJson(`/scanner/risks/${riskThreadId}/workspace`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-current-risks', activeWorkspace.id] });
      queryClient.invalidateQueries({ queryKey: ['scanner-current-risks', effectiveProductId] });
      queryClient.invalidateQueries({ queryKey: ['scanner-summary', effectiveProductId] });
      queryClient.invalidateQueries({
        queryKey: ['productization-engine', 'workspace-scanner-readiness', activeWorkspace.id],
      });
    },
  });
  const assignService = useMutation({
    mutationFn: (serviceModuleId: string) =>
      postJson('/workspaces/' + activeWorkspace.id + '/services', {
        serviceModuleId,
        required: true,
        rationale: 'Added from workspace services.',
        createMilestone: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', activeWorkspace.id, 'services'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces', activeWorkspace.id, 'milestones'] });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({
        queryKey: ['productization-engine', 'workspace-scanner-readiness', activeWorkspace.id],
      });
    },
  });
  const removeService = useMutation({
    mutationFn: (packageModuleId: string) =>
      deleteJson('/workspaces/' + activeWorkspace.id + '/services/' + packageModuleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', activeWorkspace.id, 'services'] });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({
        queryKey: ['productization-engine', 'workspace-scanner-readiness', activeWorkspace.id],
      });
    },
  });
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
    }
  ) => {
    if (view !== workspaceView) clearSelectedMilestone();
    pushWorkspaceRoute(view, activeWorkspace.id, options);
  };
  const nextActionView: WorkspaceCommandView =
    readiness?.blockerCount || missingEvidenceCount ? 'proof' : roughEdgeCount ? 'team' : 'handoff';
  const assignedFindingCount = workspaceRiskSummary.data?.total || 0;
  const openNextAction = () => {
    if (nextActionView === 'proof') {
      openDeliveryView('proof', { proofView: assignedFindingCount ? 'findings' : 'readiness' });
      return;
    }
    openDeliveryView(nextActionView);
  };

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
        error={queryError || assignService.error || removeService.error || actionError}
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

      {workspaceView === 'overview' && (
        <>
          <DeliveryOverview
            activeWorkspace={activeWorkspace}
            missingEvidenceCount={missingEvidenceCount}
            packageModules={packageModuleList}
            participantList={participantList}
            riskSummary={workspaceRiskSummary.data}
            supportList={supportList}
            onManageServices={() => openDeliveryView('services')}
            onManageTeam={() => openDeliveryView('team')}
            onPrepareHandoff={() => openDeliveryView(roughEdgeCount ? 'team' : 'handoff')}
            onReviewProof={() =>
              openDeliveryView('proof', {
                proofView: assignedFindingCount ? 'findings' : 'readiness',
              })
            }
          />

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
            onNextAction={openNextAction}
          />

          <DeliveryJourneyCards
            assignedFindingCount={assignedFindingCount}
            currentView={workspaceView}
            handoffReady={!!latestHandoff}
            integrationCount={integrationList.length}
            milestoneCount={milestoneList.length}
            missingEvidenceCount={missingEvidenceCount}
            participantCount={participantCount}
            readinessBlockers={readiness?.blockerCount || 0}
            roughEdgeCount={roughEdgeCount}
            serviceCount={packageModuleList.length}
            supportCount={supportList.length}
            onChange={openDeliveryView}
          />
        </>
      )}

      {workspaceView !== 'overview' && (
        <Surface sx={{ py: 1.25 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
          >
            <Stack spacing={0.25}>
              <Typography variant="body2" color="text.secondary">
                Delivery internal page
              </Typography>
              <Typography variant="h4">{deliveryViewLabels[workspaceView]}</Typography>
            </Stack>
            <Button
              variant="outlined"
              onClick={() => openDeliveryView('overview')}
              sx={{ minHeight: 40, alignSelf: { xs: 'stretch', sm: 'center' } }}
            >
              Back to delivery overview
            </Button>
          </Stack>
        </Surface>
      )}

      {workspaceView === 'services' && (
        <WorkspaceCommandServicesPanel
          canCoordinate={canCoordinate}
          catalogModules={catalogModuleList}
          packageModules={packageModuleList}
          isAssigningService={assignService.isPending}
          removingServiceId={removeService.isPending ? String(removeService.variables || '') : null}
          onAssignService={serviceModuleId => assignService.mutate(serviceModuleId)}
          onRemoveService={packageModuleId => removeService.mutate(packageModuleId)}
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
          workspaceRiskSummary={workspaceRiskSummary.data}
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
          isWorkspaceRiskLoading={workspaceRiskSummary.isFetching}
          isCheckingFixes={checkFixes.isPending}
          isGeneratingCriteria={generateCriteria.isPending}
          isUpdatingEvidenceRequirement={updateEvidenceRequirement.isPending}
          isCreatingCheck={createCheck.isPending}
          isReviewingCriterion={reviewCriterion.isPending}
          canSubmitScannerEvidence={
            !!effectiveProductId &&
            !!scannerUploadForm.toolName.trim() &&
            !!scannerUploadForm.artifactPayload.trim()
          }
          lastCheckFixes={checkFixes.data}
          removingRiskId={
            removeRiskFromWorkspace.isPending
              ? String(removeRiskFromWorkspace.variables || '')
              : null
          }
          onCheckFixes={(riskIds, mode) =>
            checkFixes.mutate({ riskThreadIds: riskIds, mode: mode ?? 'RELEVANT_TO_FIXES' })
          }
          onRemoveRisk={riskId => removeRiskFromWorkspace.mutate(riskId)}
          onCreateMilestone={() => createMilestone.mutate()}
          onCreateDeliverable={() => createDeliverable.mutate()}
          onSelectMilestone={setSelectedMilestoneId}
          onScannerUploadFormChange={setScannerUploadForm}
          onSubmitScannerEvidence={() => uploadScannerEvidence.mutate()}
          onGenerateLaunchReport={() => generateLaunchReadinessReport.mutate()}
          onRefreshReadiness={() => enrichScannerReadiness.mutate()}
          onGenerateCriteria={() => generateCriteria.mutate()}
          onUpdateEvidenceRequirement={(id, payload) =>
            updateEvidenceRequirement.mutate({ id, payload })
          }
          onCreateCheck={(criterionId, payload) => createCheck.mutate({ criterionId, payload })}
          onReviewCriterion={(criterionId, payload) =>
            reviewCriterion.mutate({ criterionId, payload })
          }
          evidencePanel={evidencePanel}
          onOpenHub={() => openDeliveryView('proof')}
          onViewChange={proofView => openDeliveryView('proof', { proofView })}
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
          onSupportStatusChange={(id, status) =>
            setSupportStatusById(current => ({ ...current, [id]: status }))
          }
          onSupportResolutionChange={(id, resolution) =>
            setSupportResolutionById(current => ({ ...current, [id]: resolution }))
          }
          onDisputeStatusChange={(id, status) =>
            setDisputeStatusById(current => ({ ...current, [id]: status }))
          }
          onDisputeResolutionChange={(id, resolution) =>
            setDisputeResolutionById(current => ({ ...current, [id]: resolution }))
          }
          onOpenHub={() => openDeliveryView('team')}
          onViewChange={teamView => openDeliveryView('team', { teamView })}
          evidencePanel={evidencePanel}
        />
      )}

      {workspaceView === 'handoff' && (
        <WorkspaceCommandHandoffPanels
          view={workspaceHandoffView}
          workspace={activeWorkspace}
          productId={effectiveProductId}
          selectedMilestone={selectedMilestone}
          completedCheckpointCount={
            milestoneList.filter(milestone =>
              ['ACCEPTED', 'COMPLETED', 'DONE'].includes(milestone.status)
            ).length
          }
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
          onCreateIntegration={providerType =>
            createIntegration.mutate({
              providerType,
              name: `${formatLabel(providerType)} workspace connection`,
              externalRef: `${activeWorkspace.name}-${providerType.toLowerCase()}`,
              scopedAccessNote:
                'Workspace-scoped access only; no long-lived broad permissions recorded.',
              status: 'CONFIGURED',
            })
          }
          onRecordIntegrationSignal={connectionId =>
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
                  workspaceId: activeWorkspace.id,
                  missingEvidenceCount,
                }),
              },
            })
          }
          onOpenHub={() => openDeliveryView('handoff')}
          onViewChange={handoffView => openDeliveryView('handoff', { handoffView })}
        />
      )}
    </Stack>
  );
}
