'use client';

import { Alert, Button, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';

import { deleteJson, getJson, patchJson, postJson, putJson } from './api';
import {
  DeliveryHero,
  DeliveryJourneyCards,
  DeliveryOverview,
} from './OwnerProductDeliveryWorkspacePanels';
import { EmptyState, QueryState, Surface, formatLabel } from './PlatformComponents';
import type {
  CheckFixesResponse,
  PackageModule,
  ProductProfile,
  ProjectWorkspace,
  ScannerRiskSummary,
  ScannerRiskThread,
  WorkspaceChat,
  WorkspaceServiceAddResponse,
  WorkspaceServiceFindingsUpdateResponse,
} from './types';
import { useWorkspaceCommandActions } from './useWorkspaceCommandActions';
import { useWorkspaceCommandData } from './useWorkspaceCommandData';
import { useWorkspaceCommandRouteState } from './useWorkspaceCommandRouteState';
import { useWorkspaceCommandSummary } from './useWorkspaceCommandSummary';
import { useWorkspaceCommandUiState } from './useWorkspaceCommandUiState';
import WorkspaceCommandChatPanel from './WorkspaceCommandChatPanel';
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
  plan: 'Work scope',
  services: 'Work scope',
  proof: 'Fix and verify',
  team: 'People',
  chat: 'Discussion / decisions',
  milestones: 'Work checklist',
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
    serviceFindingImpactList,
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
  const workspaceChat = useQuery({
    queryKey: ['workspaces', activeWorkspace.id, 'chat'],
    enabled: !!activeWorkspace.id,
    queryFn: () => getJson<WorkspaceChat>(`/workspaces/${activeWorkspace.id}/chat`),
  });
  const sendWorkspaceChatMessage = useMutation({
    mutationFn: ({ body, mentionedRiskIds }: { body: string; mentionedRiskIds: string[] }) =>
      postJson<WorkspaceChat, { body: string; mentionedRiskIds: string[] }>(
        `/workspaces/${activeWorkspace.id}/chat/messages`,
        { body, mentionedRiskIds }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', activeWorkspace.id, 'chat'] });
    },
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
      queryClient.invalidateQueries({ queryKey: ['workspace-current-risks', activeWorkspace.id] });
      queryClient.invalidateQueries({ queryKey: ['scanner-current-risks', effectiveProductId] });
      queryClient.invalidateQueries({
        queryKey: ['productization-engine', 'workspace-scanner-readiness', activeWorkspace.id],
      });
    },
  });
  const assignServiceOwner = useMutation({
    mutationFn: ({ moduleId, ownerUserId }: { moduleId: string; ownerUserId: string }) =>
      putJson<PackageModule, { ownerUserId: string; note: string }>(
        `/workspaces/${activeWorkspace.id}/services/${moduleId}/owner`,
        {
          ownerUserId,
          note: 'Assigned from Work scope.',
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', activeWorkspace.id, 'services'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-current-risks', activeWorkspace.id] });
    },
  });
  const assignFindingOwner = useMutation({
    mutationFn: ({ riskThreadId, ownerUserId }: { riskThreadId: string; ownerUserId: string }) =>
      putJson<ScannerRiskThread, { ownerUserId: string; note: string }>(
        `/workspaces/${activeWorkspace.id}/scanner/risks/${riskThreadId}/owner`,
        {
          ownerUserId,
          note: 'Assigned from Fix and verify.',
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-current-risks', activeWorkspace.id] });
      queryClient.invalidateQueries({ queryKey: ['scanner-current-risks', effectiveProductId] });
    },
  });
  const assignService = useMutation({
    mutationFn: (serviceModuleId: string) =>
      postJson<
        WorkspaceServiceAddResponse,
        {
          serviceModuleId: string;
          required: boolean;
          rationale: string;
          createMilestone: boolean;
          addMatchingFindings: boolean;
        }
      >('/workspaces/' + activeWorkspace.id + '/services', {
        serviceModuleId,
        required: true,
        rationale: 'Added from workspace services.',
        createMilestone: true,
        addMatchingFindings: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', activeWorkspace.id, 'services'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces', activeWorkspace.id, 'milestones'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-current-risks', activeWorkspace.id] });
      queryClient.invalidateQueries({
        queryKey: ['workspaces', activeWorkspace.id, 'services', 'finding-impact'],
      });
      queryClient.invalidateQueries({ queryKey: ['workspaces', activeWorkspace.id, 'chat'] });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({
        queryKey: ['productization-engine', 'workspace-scanner-readiness', activeWorkspace.id],
      });
    },
  });
  const includeServiceFindings = useMutation({
    mutationFn: ({
      includeExcluded = false,
      riskThreadIds,
      serviceModuleId,
    }: {
      includeExcluded?: boolean;
      riskThreadIds: string[];
      serviceModuleId: string;
    }) =>
      postJson<
        WorkspaceServiceFindingsUpdateResponse,
        { riskThreadIds: string[]; includeExcluded: boolean; note: string }
      >(`/workspaces/${activeWorkspace.id}/services/${serviceModuleId}/findings`, {
        riskThreadIds,
        includeExcluded,
        note: includeExcluded
          ? 'Owner re-added previously removed findings to this workspace service.'
          : 'Owner included selected findings in this workspace service.',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', activeWorkspace.id, 'services'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-current-risks', activeWorkspace.id] });
      queryClient.invalidateQueries({
        queryKey: ['workspaces', activeWorkspace.id, 'services', 'finding-impact'],
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
  const assignedFindingCount = workspaceRiskSummary.data?.total || 0;
  const nextActionView: WorkspaceCommandView = !packageModuleList.length
    ? 'services'
    : assignedFindingCount || readiness?.blockerCount || missingEvidenceCount
      ? 'proof'
      : !participantCount || roughEdgeCount
        ? 'team'
        : 'handoff';
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
    <Stack spacing={2.5} sx={{ pb: { xs: 13, sm: 14, md: 15 } }}>
      <QueryState
        isLoading={queriesLoading}
        error={
          queryError ||
          workspaceChat.error ||
          sendWorkspaceChatMessage.error ||
          assignService.error ||
          assignServiceOwner.error ||
          assignFindingOwner.error ||
          removeService.error ||
          actionError
        }
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
            assignedFindingCount={assignedFindingCount}
            completedMilestones={completedMilestones}
            listHref={listHref}
            milestoneCount={milestoneList.length}
            missingEvidenceCount={missingEvidenceCount}
            participantCount={participantCount}
            product={product}
            readinessBlockers={readiness?.blockerCount || 0}
            roughEdgeCount={roughEdgeCount}
            serviceCount={packageModuleList.length}
            workspaceProgress={workspaceProgress}
            workspaceCount={workspaceList.length}
            onNextAction={openNextAction}
            onWorkScope={() => openDeliveryView('services')}
          />

          <DeliveryJourneyCards
            assignedFindingCount={assignedFindingCount}
            currentView={workspaceView}
            handoffReady={!!latestHandoff}
            integrationCount={integrationList.length}
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
                Workspace area
              </Typography>
              <Typography variant="h4">{deliveryViewLabels[workspaceView]}</Typography>
            </Stack>
            <Button
              variant="outlined"
              onClick={() => openDeliveryView('overview')}
              sx={{ minHeight: 40, alignSelf: { xs: 'stretch', sm: 'center' } }}
            >
              Back to workspace overview
            </Button>
          </Stack>
        </Surface>
      )}

      {workspaceView === 'services' && (
        <WorkspaceCommandServicesPanel
          canCoordinate={canCoordinate}
          catalogModules={catalogModuleList}
          packageModules={packageModuleList}
          participantList={participantList}
          participantCount={participantCount}
          assigningOwnerModuleId={
            assignServiceOwner.isPending
              ? String(assignServiceOwner.variables?.moduleId || '')
              : null
          }
          isAssigningService={assignService.isPending}
          lastServiceAdd={assignService.data}
          lastServiceFindingUpdate={includeServiceFindings.data}
          removingServiceId={removeService.isPending ? String(removeService.variables || '') : null}
          serviceFindingImpacts={serviceFindingImpactList}
          isUpdatingServiceFindings={includeServiceFindings.isPending}
          onAssignService={serviceModuleId => assignService.mutate(serviceModuleId)}
          onAssignServiceOwner={(moduleId, ownerUserId) =>
            assignServiceOwner.mutate({ moduleId, ownerUserId })
          }
          onIncludeServiceFindings={(serviceModuleId, riskThreadIds, includeExcluded) =>
            includeServiceFindings.mutate({
              serviceModuleId,
              riskThreadIds,
              includeExcluded: includeExcluded ?? false,
            })
          }
          onOpenFixAndVerify={() =>
            openDeliveryView('proof', {
              proofView: assignedFindingCount ? 'findings' : 'readiness',
            })
          }
          onOpenChecklist={() => openDeliveryView('proof', { proofView: 'steps' })}
          onOpenPeople={() => openDeliveryView('team')}
          evidencePanel={evidencePanel}
          onRemoveService={packageModuleId => removeService.mutate(packageModuleId)}
        />
      )}

      {workspaceView === 'chat' && (
        <WorkspaceCommandChatPanel
          chat={workspaceChat.data}
          isLoading={workspaceChat.isFetching}
          isSending={sendWorkspaceChatMessage.isPending}
          onSendMessage={(body, mentionedRiskIds) =>
            sendWorkspaceChatMessage.mutate({ body, mentionedRiskIds })
          }
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
          catalogModules={catalogModuleList}
          milestoneRiskById={milestoneRiskById}
          packageModules={packageModuleList}
          participantList={participantList}
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
          changingServiceRiskId={
            changeRiskService.isPending
              ? String(changeRiskService.variables?.riskThreadId || '')
              : null
          }
          assigningFindingOwnerId={
            assignFindingOwner.isPending
              ? String(assignFindingOwner.variables?.riskThreadId || '')
              : null
          }
          removingRiskId={
            removeRiskFromWorkspace.isPending
              ? String(removeRiskFromWorkspace.variables || '')
              : null
          }
          onChangeRiskService={(riskId, serviceModuleId, note) =>
            changeRiskService.mutate({ riskThreadId: riskId, serviceModuleId, note })
          }
          onAssignFindingOwner={(riskThreadId, ownerUserId) =>
            assignFindingOwner.mutate({ riskThreadId, ownerUserId })
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
          packageModules={packageModuleList}
          riskSummary={workspaceRiskSummary.data}
          missingEvidenceCount={missingEvidenceCount}
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
          onOpenFindings={() =>
            openDeliveryView('proof', {
              proofView: assignedFindingCount ? 'findings' : 'readiness',
            })
          }
          onOpenServices={() => openDeliveryView('services')}
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
          participantCount={participantCount}
          packageModules={packageModuleList}
          riskSummary={workspaceRiskSummary.data}
          serviceCount={packageModuleList.length}
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
          onOpenFixAndVerify={() =>
            openDeliveryView('proof', {
              proofView: assignedFindingCount ? 'findings' : 'readiness',
            })
          }
          onOpenHub={() => openDeliveryView('handoff')}
          onOpenPeople={() => openDeliveryView('team')}
          onViewChange={handoffView => openDeliveryView('handoff', { handoffView })}
        />
      )}
    </Stack>
  );
}
