'use client';

import { Box, Stack } from '@mui/material';
import {
  appleColors,
} from './PlatformComponents';
import OwnerWorkspaceTimelineDialog from './OwnerWorkspaceTimelineDialog';
import OwnerFindingReviewDrawerHost from './OwnerFindingReviewDrawerHost';
import OwnerWorkspaceActionsArea from './OwnerWorkspaceActionsArea';
import OwnerWorkspaceFindingsPane from './OwnerWorkspaceFindingsPane';
import OwnerWorkspaceOverviewArea from './OwnerWorkspaceOverviewArea';
import OwnerWorkspaceServicesArea from './OwnerWorkspaceServicesArea';
import OwnerWorkspaceSideRailHost from './OwnerWorkspaceSideRailHost';
import {
  OwnerProductizationWorkspaceHeader,
  OwnerProductizationWorkspaceLead,
} from './OwnerProductizationWorkspaceHeader';
import { buildOwnerWorkspaceAssistantActions } from './ownerWorkspaceAssistantActions';
import {
  buildOwnerWorkspaceJourneyItems,
} from './ownerWorkspaceJourneyConfig';
import {
  type ProductProfilePayload,
  type RequirementPayload,
  defaultToolsForDepth,
  externalImportProviders,
  scanToolOptions,
  shortDateTime,
} from './ownerProductizationWorkspaceConfig';
import { useOwnerWorkspaceNavigationState } from './useOwnerWorkspaceNavigationState';
import { useOwnerProductizationWorkspaceData } from './useOwnerProductizationWorkspaceData';
import { useOwnerWorkspaceScannerOperations } from './useOwnerWorkspaceScannerOperations';
import { useOwnerWorkspaceProductActions } from './useOwnerWorkspaceProductActions';
import { useOwnerWorkspaceInteractionHandlers } from './useOwnerWorkspaceInteractionHandlers';
import { useOwnerWorkspaceFindingReviewState } from './useOwnerWorkspaceFindingReviewState';
import { useOwnerProductizationWorkspaceUiState } from './useOwnerProductizationWorkspaceUiState';
import { getOwnerWorkspaceCurrentJourney } from './ownerWorkspaceCurrentJourney';
import { buildOwnerWorkspaceViewModel } from './ownerWorkspaceViewModel';

export default function OwnerProductizationWorkspace({
  productId,
  showProductCreation = true,
}: {
  productId?: string;
  showProductCreation?: boolean;
} = {}) {
  const {
    cartNotice,
    diagnosisForm,
    evidenceFilter,
    pendingRequirementId,
    productForm,
    projectName,
    requirementForm,
    selectedFindingId,
    selectedPackageId,
    selectedProductId,
    setCartNotice,
    setEvidenceFilter,
    setPendingRequirementId,
    setProjectName,
    setSelectedFindingId,
    setSelectedPackageId,
    setSelectedProductId,
    setTimelineOpen,
    timelineOpen,
  } = useOwnerProductizationWorkspaceUiState(productId);
  const {
    workspaceTab,
    overviewView,
    actionView,
    findingsView,
    servicesView,
    workspaceDetailOpen,
    openWorkspaceArea,
    openWorkspaceDetail,
    openActionView,
    openFindingsView,
    openServicesView,
  } = useOwnerWorkspaceNavigationState();
  const {
    categories,
    catalogModules,
    proposals,
    supportRequests,
    recommendations,
    teams,
    experts,
    cart,
    diagnoses,
    shipConfidence,
    launchReadinessReport,
    scannerSummary,
    repoSignals,
    connectorPermissions,
    scannerConnectors,
    packageModules,
    teamRecommendations,
    milestones,
    shortlists,
    assistantSuggestions,
    productList,
    selectedProduct,
    selectedPackage,
    selectedProductRequirements,
    selectedWorkspace,
    queriesLoading,
    queryError,
  } = useOwnerProductizationWorkspaceData({
    selectedProductId,
    selectedPackageId,
    selectedFindingId,
  });
  const {
    activeProviderInstallations,
    activeScanRun,
    ciTemplate,
    ciTemplateType,
    createEvidenceExport,
    createProviderSource,
    createScanSource,
    createScannerSchedule,
    deleteArtifactsOnDisconnect,
    disconnectScanSource,
    externalImportForm,
    fetchCiTemplate,
    filteredScannerEvidence,
    fullHostedScanBlockedReason,
    hostedScanBlockedReason,
    hostedScanForm,
    importExternalEvidence,
    openEvidenceArtifact,
    openSignedEvidence,
    providerSourceForm,
    requestConnectorInstall,
    rescanRun,
    scheduleBlockedReason,
    scheduleForm,
    scannerOperationBusy,
    scannerOperationError,
    scannerUploadForm,
    scanSourceForm,
    selectedConnectorPermission,
    setCiTemplateType,
    setDeleteArtifactsOnDisconnect,
    setExternalImportForm,
    setHostedScanForm,
    setProviderSourceForm,
    setScheduleForm,
    setScannerUploadForm,
    setScanSourceForm,
    startFullHostedScan,
    startHostedScan,
    updateFindingStatus,
    updateScannerSchedule,
    uploadScannerEvidence,
    cancelScannerRun,
  } = useOwnerWorkspaceScannerOperations({
    connectorPermissions: connectorPermissions.data || [],
    evidenceFilter,
    scannerConnectors: scannerConnectors.data || [],
    scannerSummary: scannerSummary.data,
    selectedProduct,
    selectedWorkspace,
    setCartNotice,
  });

  const {
    acceptProposal,
    addServiceToCart,
    addTalentToCart,
    buildPackage,
    convertCart,
    createDiagnosis,
    createProduct,
    createRequirement,
    createScannerReadinessDiagnosis,
    generateLaunchReadinessReport,
    productActionError,
    refreshRepoSignals,
    removeServiceFromCart,
    removeTalentFromCart,
    updateCart,
    upsertShortlist,
  } = useOwnerWorkspaceProductActions({
    cartBusinessGoal: cart.data?.businessGoal,
    diagnosisForm,
    productForm,
    projectName,
    requirementForm,
    selectedPackage,
    selectedProduct,
    selectedWorkspace,
    setCartNotice,
    setPendingRequirementId,
    setProjectName,
    setSelectedPackageId,
    setSelectedProductId,
  });
  const {
    canStartProjectWorkspace,
    cartBlockers,
    cartBlockingGaps,
    cartBlockingRecommendations,
    cartServiceIds,
    cartServiceItems,
    cartStartContext,
    cartStartPromptFacts,
    cartTalentItems,
    recommendedServices,
    activeShortlists,
    blockedMilestones,
    buildTargetRequirementId,
    diagnosisPromptFacts,
    evidenceSummaryItems,
    groupedFindings,
    hasCompletedScannerRun,
    hasLaunchEvidenceContext,
    latestCompletedTools,
    latestCoveredTools,
    latestDiagnosis,
    latestMappedToolFindings,
    latestScannerDiagnosis,
    launchStatus,
    ownerActionGroups,
    productProposals,
    productSupport,
    scannerCounts,
    scannerCoverageGroups,
    scannerMappedFindings,
    scannerMappedServices,
    scannerOpenFindings,
    scannerReadiness,
    scannerReadinessPromptFacts,
    scannerToolCoverage,
    selectedMilestone,
    serviceRiskItems,
    suggestedExperts,
    suggestedTeams,
    topOwnerRisks,
    topRecommendedServiceName,
    unavailableScannerTools,
    verdictRisks,
    workspaceTimeline,
  } = buildOwnerWorkspaceViewModel({
    cart: cart.data,
    diagnoses: diagnoses.data || [],
    experts: experts.data || [],
    filteredScannerEvidence,
    hostedRuntimeTarget: hostedScanForm.runtimeTargetUrl,
    launchReadinessReport: launchReadinessReport.data,
    milestones: milestones.data || [],
    packageModules: packageModules.data,
    pendingRequirementId,
    proposals: proposals.data || [],
    repoSignals: repoSignals.data,
    scannerSummary: scannerSummary.data,
    selectedProduct,
    selectedPackage,
    selectedProductRequirements,
    selectedWorkspace,
    shipConfidenceLatest: shipConfidence.data?.latest,
    shipConfidenceTrendSummary: shipConfidence.data?.trendSummary,
    shortlists: shortlists.data || [],
    supportRequests: supportRequests.data || [],
    teams: teams.data || [],
  });
  const {
    closeFindingReview,
    findingDrawerOpen,
    findingReasonById,
    findingReviewDueById,
    openFindingGroups,
    openFindingReview,
    selectedFinding,
    selectedFindingCanAcceptRisk,
    selectedFindingCanResolve,
    selectedFindingEvidence,
    selectedFindingOwnerCategory,
    selectedFindingReason,
    selectedFindingRecommendedInCart,
    selectedFindingReviewDue,
    setFindingGroupOpen,
    setFindingReason,
    setFindingReviewDue,
    setSelectedFindingReason,
    setSelectedFindingReviewDue,
  } = useOwnerWorkspaceFindingReviewState({
    cartServiceIds,
    scannerEvidence: scannerSummary.data?.evidence || [],
    scannerFindings: scannerSummary.data?.findings || [],
    scannerOpenFindings,
    selectedFindingId,
    setSelectedFindingId,
  });
  const { assistantActionProps, assistantContext } = buildOwnerWorkspaceAssistantActions({
    buildTargetRequirementId,
    cartBlockers,
    cartBlockingGapTitles: cartBlockingGaps.map((gap) => gap.title),
    cartBlockingRecommendationNames: cartBlockingRecommendations.map((item) => item.recommendedModule.name),
    cartServiceItemCount: cartServiceItems.length,
    hostedScanBlockedReason,
    onAcceptFindingRisk: async (reason) => {
      if (!selectedFinding?.id) throw new Error('Select a scanner finding first.');
      await updateFindingStatus.mutateAsync({
        findingId: selectedFinding.id,
        payload: {
          status: 'ACCEPTED_RISK',
          reason,
        },
      });
    },
    onBuildPackage: async (requirementId) => {
      await buildPackage.mutateAsync(requirementId);
    },
    onConvertCart: async () => {
      await convertCart.mutateAsync();
    },
    onStartHostedScan: async () => {
      await startHostedScan.mutateAsync();
    },
    selectedFindingId: selectedFinding?.id,
    selectedPackage,
    selectedProduct,
    selectedWorkspace,
    startReadiness: cartStartContext,
  });

  const {
    addExpertToCart,
    addLifecycleService,
    addRecommendationTeamToCart,
    addTeamToCart,
    recordFindingDecision,
    recordShortlist,
    selectProduct,
    submitProduct,
    submitRequirement,
  } = useOwnerWorkspaceInteractionHandlers({
    addServiceToCart,
    addTalentToCart,
    cart: cart.data,
    createProduct,
    createRequirement,
    findingReasonById,
    findingReviewDueById,
    productForm,
    productId,
    productList,
    requirementForm,
    selectedPackage,
    selectedPackageId,
    selectedProduct,
    selectedProductId,
    setSelectedPackageId,
    setSelectedProductId,
    updateCart,
    updateFindingStatus,
    upsertShortlist,
  });

  const loading = queriesLoading;
  const error = queryError
    || productActionError
    || scannerOperationError;

  const {
    overviewJourneyItems,
    actionJourneyItems,
    findingsJourneyItems,
    servicesJourneyItems,
  } = buildOwnerWorkspaceJourneyItems({
    launchStatus,
    hasLaunchReadinessReport: !!launchReadinessReport.data,
    latestDiagnosisFindingCount: latestDiagnosis?.findings.length,
    topOwnerRiskCount: topOwnerRisks.length,
    storedProofCount: filteredScannerEvidence.length,
    scannerFindingCount: scannerCounts?.total || 0,
    scannerOpenFindingCount: scannerOpenFindings.length,
    serviceFamilyCount: categories.data?.length || 0,
    hasSelectedPackage: !!selectedPackage,
    teamMatchCount: teamRecommendations.data?.length || 0,
  });
  const {
    currentAreaLabel,
    currentDetailLabel,
    currentJourneyItems,
    currentJourneyValue,
  } = getOwnerWorkspaceCurrentJourney({
    actionJourneyItems,
    actionView,
    findingsJourneyItems,
    findingsView,
    overviewJourneyItems,
    overviewView,
    servicesJourneyItems,
    servicesView,
    workspaceTab,
  });

  return (
    <>
      <OwnerProductizationWorkspaceHeader
        completedChecks={latestCompletedTools}
        error={error}
        hasLaunchEvidenceContext={hasLaunchEvidenceContext}
        isLoading={loading}
        launchStatus={launchStatus}
        productList={productList}
        risks={verdictRisks}
        selectedProduct={selectedProduct}
        totalChecks={scanToolOptions.length}
        onSelectProduct={selectProduct}
        onSeePlan={() => launchStatus.blockerCount ? openActionView('plan') : openServicesView('recommend')}
        onViewProof={() => openFindingsView('technical')}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 340px' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          <OwnerProductizationWorkspaceLead
            currentAreaLabel={currentAreaLabel}
            currentDetailLabel={currentDetailLabel}
            currentJourneyItems={currentJourneyItems}
            currentJourneyValue={currentJourneyValue}
            evidenceSummaryItems={evidenceSummaryItems}
            isExporting={createEvidenceExport.isPending}
            launchStatus={launchStatus}
            product={selectedProduct}
            topOwnerRisks={topOwnerRisks}
            workspaceDetailOpen={workspaceDetailOpen}
            workspaceTab={workspaceTab}
            onAreaChange={openWorkspaceArea}
            onDetailChange={(value) => openWorkspaceDetail(workspaceTab, value)}
            onExportReport={() => createEvidenceExport.mutate()}
            onPrimaryAction={() => topOwnerRisks.length ? openActionView('plan') : openServicesView('recommend')}
            onViewProof={() => openFindingsView('technical')}
          />

          <OwnerWorkspaceOverviewArea
            detailOpen={workspaceDetailOpen}
            launchReadinessReport={launchReadinessReport.data ?? null}
            launchReadinessReportGenerating={generateLaunchReadinessReport.isPending}
            launchReadinessReportLoading={launchReadinessReport.isFetching}
            launchStatus={launchStatus}
            latestCompletedTools={latestCompletedTools}
            onGenerateLaunchReadinessReport={() => generateLaunchReadinessReport.mutate()}
            onOpenFindingsEvidence={() => openFindingsView('evidence')}
            onOpenFindingsRisks={() => openFindingsView('risks')}
            onOpenServicesPlan={() => openServicesView('plan')}
            onOpenServicesRecommend={() => openServicesView('recommend')}
            onOpenTimeline={() => setTimelineOpen(true)}
            ownerActionGroups={ownerActionGroups}
            scannerCoverageGroups={scannerCoverageGroups}
            scannerMappedServices={scannerMappedServices}
            selectedPackage={selectedPackage}
            selectedProduct={selectedProduct}
            shipConfidenceHistory={shipConfidence.data}
            shipConfidenceLoading={shipConfidence.isFetching}
            topOwnerRisks={topOwnerRisks}
            topRecommendedServiceName={topRecommendedServiceName}
            totalScanTools={scanToolOptions.length}
            view={overviewView}
            workspaceTab={workspaceTab}
          />

          <OwnerWorkspaceActionsArea
            assistantActions={assistantActionProps}
            assistantContext={assistantContext('product-diagnosis')}
            cartServiceIds={cartServiceIds}
            catalogModules={catalogModules.data || []}
            detailOpen={workspaceDetailOpen}
            diagnosisForm={diagnosisForm}
            diagnosisPromptFacts={diagnosisPromptFacts}
            isAddingService={addServiceToCart.isPending}
            isCreatingDiagnosis={createDiagnosis.isPending}
            latestDiagnosis={latestDiagnosis}
            onAddService={addLifecycleService}
            onCreateDiagnosis={() => createDiagnosis.mutate()}
            onOpenServicesRecommend={() => openServicesView('recommend')}
            ownerActionGroups={ownerActionGroups}
            selectedProduct={selectedProduct}
            view={actionView}
            workspaceTab={workspaceTab}
          />

          {selectedProduct && workspaceTab === 'findings' && (
            <OwnerWorkspaceFindingsPane
              view={findingsView}
              detailOpen={workspaceDetailOpen}
              risks={{
                groups: groupedFindings,
                totalFindingCount: scannerSummary.data?.findings.length || 0,
                openGroups: openFindingGroups,
                onGroupToggle: setFindingGroupOpen,
                onReviewFinding: openFindingReview,
                onOpenTechnicalProof: () => openFindingsView('technical'),
              }}
              evidence={{
                summaryItems: evidenceSummaryItems,
                sources: scannerSummary.data?.sources || [],
                evidence: filteredScannerEvidence,
                evidenceFilter,
                isExporting: createEvidenceExport.isPending,
                isOpeningEvidence: openSignedEvidence.isPending,
                onEvidenceFilterChange: setEvidenceFilter,
                onExport: () => createEvidenceExport.mutate(),
                onOpenEvidence: openEvidenceArtifact,
                formatDateTime: shortDateTime,
              }}
              repoReadout={{
                summary: repoSignals.data,
                scannerSummary: scannerSummary.data,
                isFetching: repoSignals.isFetching,
                isRefreshing: refreshRepoSignals.isPending,
                onRefresh: () => refreshRepoSignals.mutate(),
              }}
              technical={{
                runway: {
                  scannerReadiness,
                  criticalCount: scannerCounts?.critical || 0,
                  highCount: scannerCounts?.high || 0,
                  openFindingCount: scannerCounts?.open || 0,
                  sourceCount: scannerSummary.data?.sources.length || 0,
                  evidenceCount: filteredScannerEvidence.length,
                  latestCoveredTools,
                  totalTools: scanToolOptions.length,
                  normalizedFindingCount: scannerCounts?.total || 0,
                  activeScanRun: Boolean(activeScanRun),
                  fullSuiteBlockedReason: fullHostedScanBlockedReason,
                  isStartingFullSuite: startFullHostedScan.isPending,
                  isExporting: createEvidenceExport.isPending,
                  onRunFullSuite: () => startFullHostedScan.mutate(),
                  onReviewBlockers: () => openFindingsView('risks'),
                  onExportProof: () => createEvidenceExport.mutate(),
                },
                coverage: {
                  tools: scannerToolCoverage,
                  latestCoveredTools,
                  totalTools: scanToolOptions.length,
                  latestMappedToolFindings,
                  unavailableScannerTools,
                },
                fixPath: {
                  diagnosis: latestScannerDiagnosis,
                  mappedFindings: scannerMappedFindings,
                  mappedServiceNames: scannerMappedServices,
                  serviceModules: catalogModules.data || [],
                  cartServiceIds,
                  hasCompletedScannerRun,
                  isRefreshing: createScannerReadinessDiagnosis.isPending,
                  isAddingService: addServiceToCart.isPending,
                  onRefreshMap: () =>
                    createScannerReadinessDiagnosis.mutate({
                      ...(selectedWorkspace?.id ? { workspaceId: selectedWorkspace.id } : {}),
                      createServiceRecommendations: true,
                      includeAcceptedRisk: false,
                      summary: `Scanner-backed readiness map for ${selectedProduct.name}.`,
                    }),
                  onAddService: addLifecycleService,
                },
                assistant: {
                  title: 'AI Fix Path Summary',
                  description: 'Summarize scanner findings, explain the highest-risk fixes, and turn proof into practical productization actions.',
                  prompt: `Do not call write actions for this answer. Summarize scanner ship-readiness for ${selectedProduct.name}. Current scanner score is ${scannerReadiness}/100 with ${scannerCounts?.critical || 0} critical, ${scannerCounts?.high || 0} high, and ${scannerCounts?.open || 0} open findings. Top visible findings: ${scannerOpenFindings.slice(0, 4).map((finding) => `${finding.title} (${finding.severity}, ${finding.status})`).join('; ') || 'none'}. ${scannerReadinessPromptFacts} Prioritize critical and high findings, explain the business risk in plain language, identify missing proof, and recommend lifecycle services or milestone actions. Use the provided context and visible facts directly. Avoid raw artifact details.`,
                  conversationId: `studio-scanner-${selectedProduct.id}-${selectedFinding?.id || 'summary'}`,
                  context: assistantContext('scanner-readiness', { findingId: selectedFinding?.id }),
                  ...assistantActionProps,
                  accent: scannerOpenFindings.length ? appleColors.amber : appleColors.green,
                  cta: 'Summarize Fixes',
                },
                operations: {
                  selectedProduct,
                  selectedWorkspace,
                  milestones: milestones.data || [],
                  scannerSources: scannerSummary.data?.sources || [],
                  scanToolOptions,
                  externalImportProviders,
                  selectedConnectorPermission,
                  activeProviderInstallations,
                  activeScanRun,
                  hostedScanBlockedReason,
                  fullHostedScanBlockedReason,
                  scheduleBlockedReason,
                  scanSourceForm,
                  setScanSourceForm,
                  providerSourceForm,
                  setProviderSourceForm,
                  hostedScanForm,
                  setHostedScanForm,
                  scheduleForm,
                  setScheduleForm,
                  scannerUploadForm,
                  setScannerUploadForm,
                  externalImportForm,
                  setExternalImportForm,
                  ciTemplateType,
                  setCiTemplateType,
                  ciTemplate,
                  isCreatingSource: createScanSource.isPending,
                  isRequestingConnectorInstall: requestConnectorInstall.isPending,
                  isCreatingProviderSource: createProviderSource.isPending,
                  isStartingHostedScan: startHostedScan.isPending,
                  isStartingFullHostedScan: startFullHostedScan.isPending,
                  isCancelingScan: cancelScannerRun.isPending,
                  isCreatingSchedule: createScannerSchedule.isPending,
                  isUploadingEvidence: uploadScannerEvidence.isPending,
                  isImportingExternalEvidence: importExternalEvidence.isPending,
                  isFetchingCiTemplate: fetchCiTemplate.isPending,
                  onCreateScanSource: () => createScanSource.mutate(),
                  onRequestConnectorInstall: (provider) => requestConnectorInstall.mutate(provider),
                  onCreateProviderSource: () => createProviderSource.mutate(),
                  onStartHostedScan: () => startHostedScan.mutate(),
                  onStartFullHostedScan: () => startFullHostedScan.mutate(),
                  onCancelScan: (runId) => cancelScannerRun.mutate(runId),
                  onCreateSchedule: () => createScannerSchedule.mutate(),
                  onUploadScannerEvidence: () => uploadScannerEvidence.mutate(),
                  onImportExternalEvidence: () => importExternalEvidence.mutate(),
                  onFetchCiTemplate: () => fetchCiTemplate.mutate(),
                  defaultToolsForDepth,
                },
                companion: {
                  scannerSummary: scannerSummary.data,
                  filteredScannerEvidence,
                  evidenceFilter,
                  selectedFinding,
                  cartServiceIds,
                  findingReasonById,
                  findingReviewDueById,
                  deleteArtifactsOnDisconnect,
                  activeScanRun,
                  hasProduct: !!selectedProduct,
                  isBusy: scannerSummary.isFetching || createScannerReadinessDiagnosis.isPending || scannerOperationBusy,
                  isDisconnectingSource: disconnectScanSource.isPending,
                  isUpdatingSchedule: updateScannerSchedule.isPending,
                  isOpeningEvidence: openSignedEvidence.isPending,
                  isExportingEvidence: createEvidenceExport.isPending,
                  isUpdatingFindingStatus: updateFindingStatus.isPending,
                  isAddingService: addServiceToCart.isPending,
                  isCancelingScan: cancelScannerRun.isPending,
                  isRescanning: rescanRun.isPending,
                  onDeleteArtifactsChange: setDeleteArtifactsOnDisconnect,
                  onDisconnectSource: (sourceId) => disconnectScanSource.mutate(sourceId),
                  onToggleSchedule: (scheduleId, active) => updateScannerSchedule.mutate({ scheduleId, active }),
                  onEvidenceFilterChange: setEvidenceFilter,
                  onExportEvidence: () => createEvidenceExport.mutate(),
                  onOpenEvidence: openEvidenceArtifact,
                  onSelectFinding: openFindingReview,
                  onFindingReasonChange: setFindingReason,
                  onFindingReviewDueChange: setFindingReviewDue,
                  onAddService: addLifecycleService,
                  onRecordFindingDecision: recordFindingDecision,
                  onCancelRun: (runId) => cancelScannerRun.mutate(runId),
                  onRescanRun: (runId) => rescanRun.mutate(runId),
                  formatDateTime: shortDateTime,
                },
              }}
            />
          )}

          <OwnerWorkspaceServicesArea
            activeShortlists={activeShortlists}
            assistantActions={assistantActionProps}
            blockerCount={launchStatus.blockerCount}
            cartServiceIds={cartServiceIds}
            cartServiceItems={cartServiceItems}
            cartStartPromptFacts={cartStartPromptFacts}
            cartTalentItems={cartTalentItems}
            catalogModules={catalogModules.data || []}
            categories={categories.data || []}
            detailOpen={workspaceDetailOpen}
            hasServicePlan={!!selectedPackage}
            improvementCount={launchStatus.improvementCount}
            isAcceptingProposal={acceptProposal.isPending}
            isAddingService={addServiceToCart.isPending}
            isAddingTalent={addTalentToCart.isPending}
            isBuildingPackage={buildPackage.isPending}
            isCreatingProduct={createProduct.isPending}
            isCreatingRequirement={createRequirement.isPending}
            isPackageFetching={packageModules.isFetching}
            isRemovingService={removeServiceFromCart.isPending}
            isRemovingTalent={removeTalentFromCart.isPending}
            isShortlisting={upsertShortlist.isPending}
            isTeamRecommendationsFetching={teamRecommendations.isFetching}
            mappedServiceNames={scannerMappedServices}
            onAcceptProposal={(proposalId) => acceptProposal.mutate(proposalId)}
            onAddExpert={addExpertToCart}
            onAddRecommendationTeam={addRecommendationTeamToCart}
            onAddService={addLifecycleService}
            onAddTeam={addTeamToCart}
            onBuildPackage={(requirementId) => buildPackage.mutate(requirementId)}
            onProductValueChange={(key, value) => productForm.setValue(key as keyof ProductProfilePayload, value as any)}
            onRecordShortlist={recordShortlist}
            onRemoveService={(itemId) => removeServiceFromCart.mutate(itemId)}
            onRemoveTalent={(itemId) => removeTalentFromCart.mutate(itemId)}
            onRequirementValueChange={(key, value) => requirementForm.setValue(key as keyof RequirementPayload, value as any)}
            onSubmitProduct={submitProduct}
            onSubmitRequirement={submitRequirement}
            ownerRisks={serviceRiskItems}
            packageAssistantContext={assistantContext('package-recommendation')}
            packageModules={packageModules.data || []}
            productFormValues={productForm.values}
            productProposals={productProposals}
            recommendationAssistantContext={assistantContext('service-selection')}
            recommendations={teamRecommendations.data || []}
            recommendedServices={recommendedServices}
            requirementFormValues={requirementForm.values}
            selectedPackage={selectedPackage}
            selectedProduct={selectedProduct}
            selectedProductRequirements={selectedProductRequirements}
            showProductCreation={showProductCreation}
            suggestedExperts={suggestedExperts}
            suggestedTeams={suggestedTeams}
            view={servicesView}
            workspaceTab={workspaceTab}
          />
        </Stack>

        <OwnerWorkspaceSideRailHost
          activeSuggestions={assistantSuggestions.data?.suggestions || []}
          assistantActions={assistantActionProps}
          assistantContext={assistantContext}
          blockedMilestoneCount={blockedMilestones}
          blockingGaps={cartBlockingGaps}
          blockingRecommendationNames={cartBlockingRecommendations.map((item) => item.recommendedModule.name)}
          blockers={cartBlockers}
          buildTargetRequirementId={buildTargetRequirementId}
          canStartWorkspace={canStartProjectWorkspace}
          cart={cart.data}
          deliveryMilestones={milestones.data || []}
          fallbackReason={assistantSuggestions.data?.fallbackReason}
          hasServicePlan={!!selectedPackage}
          hasStartWorkspace={!!(selectedWorkspace || cart.data?.convertedWorkspace)}
          hasWorkspace={!!selectedWorkspace}
          isAddingService={addServiceToCart.isPending}
          isBuildingPlan={buildPackage.isPending}
          isConverting={convertCart.isPending}
          isFetchingSuggestions={assistantSuggestions.isFetching}
          isRemovingService={removeServiceFromCart.isPending}
          isRemovingTalent={removeTalentFromCart.isPending}
          launchStatus={launchStatus}
          latestCompletedTools={latestCompletedTools}
          mode={assistantSuggestions.data?.mode}
          notice={cartNotice}
          product={selectedProduct}
          productSupport={productSupport}
          projectName={projectName}
          proposals={productProposals}
          recommendationRationale={recommendations.data?.[0]?.rationale}
          scannerSummary={scannerSummary.data}
          selectedMilestone={selectedMilestone}
          servicesView={servicesView}
          topRecommendedServiceName={topRecommendedServiceName}
          workspace={selectedWorkspace}
          workspaceDetailOpen={workspaceDetailOpen}
          workspaceTab={workspaceTab}
          onAddGapService={(serviceModule, notes) => addServiceToCart.mutate({ serviceModuleId: serviceModule.id, notes })}
          onBuildPlan={(requirementId) => buildPackage.mutate(requirementId)}
          onCloseNotice={() => setCartNotice('')}
          onConvert={() => convertCart.mutate()}
          onOpenActionPlan={() => openActionView('plan')}
          onOpenFindingsEvidence={() => openFindingsView('evidence')}
          onOpenServicesRecommend={() => openServicesView('recommend')}
          onOpenTimeline={() => setTimelineOpen(true)}
          onProjectNameChange={setProjectName}
          onRefreshSuggestions={() => assistantSuggestions.refetch()}
          onRemoveService={(itemId) => removeServiceFromCart.mutate(itemId)}
          onRemoveTalent={(itemId) => removeTalentFromCart.mutate(itemId)}
        />
      </Box>
      <OwnerFindingReviewDrawerHost
        open={findingDrawerOpen}
        product={selectedProduct}
        finding={selectedFinding}
        ownerCategory={selectedFindingOwnerCategory}
        evidence={selectedFindingEvidence}
        decisionReason={selectedFindingReason}
        reviewDueOn={selectedFindingReviewDue}
        canResolve={selectedFindingCanResolve}
        canAcceptRisk={selectedFindingCanAcceptRisk}
        recommendedInCart={selectedFindingRecommendedInCart}
        isAddingService={addServiceToCart.isPending}
        isUpdatingStatus={updateFindingStatus.isPending}
        isOpeningEvidence={openSignedEvidence.isPending}
        onClose={closeFindingReview}
        onDecisionReasonChange={setSelectedFindingReason}
        onReviewDueChange={setSelectedFindingReviewDue}
        onRecordDecision={(status) => selectedFinding && recordFindingDecision(selectedFinding, status)}
        onAddService={addLifecycleService}
        onOpenEvidence={openEvidenceArtifact}
        assistantActions={assistantActionProps}
        assistantContext={assistantContext}
      />
      <OwnerWorkspaceTimelineDialog
        open={timelineOpen}
        items={workspaceTimeline}
        onClose={() => setTimelineOpen(false)}
      />
    </>
  );
}
