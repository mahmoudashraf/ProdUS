'use client';

import { Box, Stack } from '@mui/material';
import OwnerWorkspaceTimelineDialog from './OwnerWorkspaceTimelineDialog';
import OwnerFindingReviewDrawerHost from './OwnerFindingReviewDrawerHost';
import OwnerWorkspaceActionsArea from './OwnerWorkspaceActionsArea';
import OwnerWorkspaceFindingsArea from './OwnerWorkspaceFindingsArea';
import OwnerWorkspaceOverviewArea from './OwnerWorkspaceOverviewArea';
import OwnerWorkspaceServicesArea from './OwnerWorkspaceServicesArea';
import OwnerWorkspaceShareArea from './OwnerWorkspaceShareArea';
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
  scanToolOptions,
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
    shareView,
    workspaceDetailOpen,
    openProductHome,
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
  const scannerOperations = useOwnerWorkspaceScannerOperations({
    connectorPermissions: connectorPermissions.data || [],
    evidenceFilter,
    scannerConnectors: scannerConnectors.data || [],
    scannerSummary: scannerSummary.data,
    selectedProduct,
    selectedWorkspace,
    setCartNotice,
  });
  const {
    createEvidenceExport,
    filteredScannerEvidence,
    hostedScanBlockedReason,
    hostedScanForm,
    openEvidenceArtifact,
    openSignedEvidence,
    scannerOperationError,
    startHostedScan,
    updateFindingStatus,
  } = scannerOperations;

  const productActions = useOwnerWorkspaceProductActions({
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
    acceptProposal,
    addServiceToCart,
    addTalentToCart,
    buildPackage,
    convertCart,
    createDiagnosis,
    createProduct,
    createRequirement,
    generateLaunchReadinessReport,
    productActionError,
    removeServiceFromCart,
    removeTalentFromCart,
    updateCart,
    upsertShortlist,
  } = productActions;
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
    shareJourneyItems,
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
    shareJourneyItems,
    shareView,
    workspaceTab,
  });
  const isProductHome = workspaceTab === 'overview' && !workspaceDetailOpen;

  return (
    <>
      <OwnerProductizationWorkspaceHeader
        completedChecks={latestCompletedTools}
        error={error}
        hasLaunchEvidenceContext={hasLaunchEvidenceContext}
        isLoading={loading}
        launchStatus={launchStatus}
        risks={verdictRisks}
        selectedProduct={selectedProduct}
        totalChecks={scanToolOptions.length}
        onSeePlan={() => launchStatus.blockerCount ? openActionView('plan') : openServicesView('recommend')}
        onViewProof={() => openFindingsView('technical')}
        showReadinessReveal={isProductHome}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 340px' }, gap: 2.5, minWidth: 0 }}>
        <Stack spacing={2.5} sx={{ minWidth: 0 }}>
          <OwnerProductizationWorkspaceLead
            currentAreaLabel={currentAreaLabel}
            currentDetailLabel={currentDetailLabel}
            currentJourneyItems={currentJourneyItems}
            currentJourneyValue={currentJourneyValue}
            evidenceSummaryItems={evidenceSummaryItems}
            isExporting={createEvidenceExport.isPending}
            isProductHome={isProductHome}
            launchStatus={launchStatus}
            product={selectedProduct}
            topOwnerRisks={topOwnerRisks}
            workspaceDetailOpen={workspaceDetailOpen}
            workspaceTab={workspaceTab}
            onAreaChange={openWorkspaceArea}
            onDetailChange={(value) => openWorkspaceDetail(workspaceTab, value)}
            onExportReport={() => createEvidenceExport.mutate()}
            onProductHome={openProductHome}
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

          <OwnerWorkspaceFindingsArea
            assistantActionProps={assistantActionProps}
            assistantContext={assistantContext}
            cartServiceIds={cartServiceIds}
            catalogModules={catalogModules.data || []}
            detailOpen={workspaceDetailOpen}
            evidenceFilter={evidenceFilter}
            evidenceSummaryItems={evidenceSummaryItems}
            findingReasonById={findingReasonById}
            findingReviewDueById={findingReviewDueById}
            groupedFindings={groupedFindings}
            hasCompletedScannerRun={hasCompletedScannerRun}
            latestCoveredTools={latestCoveredTools}
            latestMappedToolFindings={latestMappedToolFindings}
            latestScannerDiagnosis={latestScannerDiagnosis}
            milestones={milestones.data || []}
            onAddService={addLifecycleService}
            onEvidenceFilterChange={setEvidenceFilter}
            onFindingReasonChange={setFindingReason}
            onFindingReviewDueChange={setFindingReviewDue}
            onOpenFindingsView={openFindingsView}
            onRecordFindingDecision={recordFindingDecision}
            onReviewFinding={openFindingReview}
            onToggleFindingGroup={setFindingGroupOpen}
            openFindingGroups={openFindingGroups}
            productActions={productActions}
            repoSignalsData={repoSignals.data}
            repoSignalsFetching={repoSignals.isFetching}
            scannerCounts={scannerCounts}
            scannerMappedFindings={scannerMappedFindings}
            scannerMappedServices={scannerMappedServices}
            scannerOpenFindings={scannerOpenFindings}
            scannerOperations={scannerOperations}
            scannerReadiness={scannerReadiness}
            scannerReadinessPromptFacts={scannerReadinessPromptFacts}
            scannerSummaryData={scannerSummary.data}
            scannerSummaryFetching={scannerSummary.isFetching}
            scannerToolCoverage={scannerToolCoverage}
            selectedFinding={selectedFinding}
            selectedProduct={selectedProduct}
            selectedWorkspace={selectedWorkspace}
            unavailableScannerTools={unavailableScannerTools}
            view={findingsView}
            workspaceTab={workspaceTab}
          />

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

          <OwnerWorkspaceShareArea
            detailOpen={workspaceDetailOpen}
            selectedProduct={selectedProduct}
            view={shareView}
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
