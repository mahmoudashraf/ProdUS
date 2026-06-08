'use client';

import { useState } from 'react';
import { EventRepeatOutlined } from '@mui/icons-material';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useAdvancedForm } from '@/hooks/enterprise';
import {
  EmptyState,
  PageHeader,
  QueryState,
  appleColors,
} from './PlatformComponents';
import OwnerWorkspaceTimelineDialog from './OwnerWorkspaceTimelineDialog';
import { type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import OwnerFindingReviewDrawerHost from './OwnerFindingReviewDrawerHost';
import OwnerWorkspaceActionsPane from './OwnerWorkspaceActionsPane';
import OwnerWorkspaceFindingsPane from './OwnerWorkspaceFindingsPane';
import OwnerWorkspaceProductHero from './OwnerWorkspaceProductHero';
import OwnerWorkspaceOverviewPane from './OwnerWorkspaceOverviewPane';
import OwnerWorkspaceServicesPane from './OwnerWorkspaceServicesPane';
import OwnerWorkspaceNavigationPanel from './OwnerWorkspaceNavigationPanel';
import OwnerWorkspaceSideRailPane from './OwnerWorkspaceSideRailPane';
import { OwnerReadinessVerdictReveal } from './OwnerJourneyCards';
import { buildOwnerWorkspaceAssistantActions } from './ownerWorkspaceAssistantActions';
import {
  buildOwnerWorkspaceJourneyItems,
} from './ownerWorkspaceJourneyConfig';
import {
  workspaceTabs,
} from './ownerWorkspaceModel';
import {
  DiagnosisPayload,
  ProductProfilePayload,
  RequirementPayload,
  defaultToolsForDepth,
  externalImportProviders,
  productInitialValues,
  requirementInitialValues,
  scanToolOptions,
  shortDateTime,
} from './ownerProductizationWorkspaceConfig';
import { useOwnerWorkspaceNavigationState } from './useOwnerWorkspaceNavigationState';
import { useOwnerProductizationWorkspaceData } from './useOwnerProductizationWorkspaceData';
import { useOwnerWorkspaceScannerOperations } from './useOwnerWorkspaceScannerOperations';
import { useOwnerWorkspaceProductActions } from './useOwnerWorkspaceProductActions';
import { useOwnerWorkspaceInteractionHandlers } from './useOwnerWorkspaceInteractionHandlers';
import { useOwnerWorkspaceFindingReviewState } from './useOwnerWorkspaceFindingReviewState';
import { buildOwnerWorkspaceViewModel } from './ownerWorkspaceViewModel';
import type { ScannerEvidenceFilter } from './scannerProofOperationsTypes';

export default function OwnerProductizationWorkspace({
  productId,
  showProductCreation = true,
}: {
  productId?: string;
  showProductCreation?: boolean;
} = {}) {
  const [selectedProductId, setSelectedProductId] = useState(productId || '');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [pendingRequirementId, setPendingRequirementId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [cartNotice, setCartNotice] = useState('');
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
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [selectedFindingId, setSelectedFindingId] = useState('');
  const [evidenceFilter, setEvidenceFilter] = useState<ScannerEvidenceFilter>('ALL');
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

  const productForm = useAdvancedForm<ProductProfilePayload>({
    initialValues: productInitialValues,
    validationRules: {
      name: [{ type: 'required', message: 'Product name is required' }],
    },
  });
  const requirementForm = useAdvancedForm<RequirementPayload>({
    initialValues: requirementInitialValues,
    validationRules: {
      businessGoal: [{ type: 'required', message: 'Business goal is required' }],
    },
  });
  const diagnosisForm = useAdvancedForm<DiagnosisPayload>({
    initialValues: {
      businessGoal: '',
      currentProblems: '',
      accessSignals: '',
      summary: '',
    },
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
  const currentJourneyItems: JourneyStepItem<string>[] =
    workspaceTab === 'overview'
      ? overviewJourneyItems
      : workspaceTab === 'actions'
        ? actionJourneyItems
        : workspaceTab === 'findings'
          ? findingsJourneyItems
          : servicesJourneyItems;
  const currentJourneyValue: string =
    workspaceTab === 'overview'
      ? overviewView
      : workspaceTab === 'actions'
        ? actionView
        : workspaceTab === 'findings'
          ? findingsView
          : servicesView;
  const currentAreaLabel = workspaceTabs.find((tab) => tab.value === workspaceTab)?.label || 'Workspace';
  const currentDetailLabel = currentJourneyItems.find((item) => item.value === currentJourneyValue)?.label || currentAreaLabel;

  return (
    <>
      <PageHeader
        title="Productization Workspace"
        description="One product-centered command surface for lifecycle service selection, start plan decisions, team comparison, and delivery evidence."
        action={
          productList.length ? (
            <TextField
              select
              size="small"
              label="Product"
              value={selectedProduct?.id || ''}
              onChange={(event) => selectProduct(event.target.value)}
              sx={{ minWidth: { xs: '100%', md: 300 } }}
            >
              {productList.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name}
                </MenuItem>
              ))}
            </TextField>
          ) : null
        }
      />
      <QueryState isLoading={loading} error={error} />

      {selectedProduct && hasLaunchEvidenceContext && (
        <Box sx={{ mb: 2.5 }}>
          <OwnerReadinessVerdictReveal
            productName={selectedProduct.name}
            launchStatus={launchStatus}
            risks={verdictRisks}
            completedChecks={latestCompletedTools}
            totalChecks={scanToolOptions.length}
            onSeePlan={() => launchStatus.blockerCount ? openActionView('plan') : openServicesView('recommend')}
            onViewProof={() => openFindingsView('technical')}
          />
        </Box>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 340px' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          {selectedProduct ? (
            <OwnerWorkspaceProductHero
              product={selectedProduct}
              launchStatus={launchStatus}
              topOwnerRisks={topOwnerRisks}
              evidenceSummaryItems={evidenceSummaryItems}
              onPrimaryAction={() => topOwnerRisks.length ? openActionView('plan') : openServicesView('recommend')}
              onViewProof={() => openFindingsView('technical')}
              onExportReport={() => createEvidenceExport.mutate()}
              isExporting={createEvidenceExport.isPending}
            />
          ) : (
            <EmptyState label="Create a product profile to start the owner productization workflow." />
          )}

          <OwnerWorkspaceNavigationPanel
            currentAreaLabel={currentAreaLabel}
            currentDetailLabel={currentDetailLabel}
            currentJourneyItems={currentJourneyItems}
            currentJourneyValue={currentJourneyValue}
            productName={selectedProduct?.name}
            workspaceDetailOpen={workspaceDetailOpen}
            workspaceTab={workspaceTab}
            onAreaChange={openWorkspaceArea}
            onDetailChange={(value) => openWorkspaceDetail(workspaceTab, value)}
          />

          {selectedProduct && workspaceTab === 'overview' && (
            <OwnerWorkspaceOverviewPane
              view={overviewView}
              detailOpen={workspaceDetailOpen}
              launchCelebration={{
                readinessScore: launchStatus.score,
                blockerCount: launchStatus.blockerCount,
                improvementCount: launchStatus.improvementCount,
                completedChecks: latestCompletedTools,
                totalChecks: scanToolOptions.length,
                isGenerating: generateLaunchReadinessReport.isPending,
                onGenerateReport: () => generateLaunchReadinessReport.mutate(),
              }}
              decision={{
                launchStatus,
                latestCompletedTools,
                totalScanTools: scanToolOptions.length,
                topRecommendedServiceName,
                topOwnerRisks,
                ownerActionGroups,
                scannerCoverageGroups,
                selectedPackage,
                scannerMappedServices,
                onOpenServicesRecommend: () => openServicesView('recommend'),
                onOpenServicesPlan: () => openServicesView('plan'),
                onOpenFindingsEvidence: () => openFindingsView('evidence'),
                onOpenFindingsRisks: () => openFindingsView('risks'),
                onOpenTimeline: () => setTimelineOpen(true),
              }}
              shipConfidence={{
                history: shipConfidence.data,
                isLoading: shipConfidence.isFetching,
                title: 'Ship Confidence History',
                subtitle: 'Every diagnosis and scanner map becomes a checkpoint, so this prototype has a visible path from rough edges to ready-to-ship.',
                showScoreRing: false,
              }}
              launchReadinessReport={{
                report: launchReadinessReport.data ?? null,
                isLoading: launchReadinessReport.isFetching,
                isGenerating: generateLaunchReadinessReport.isPending,
                onGenerate: () => generateLaunchReadinessReport.mutate(),
                title: 'Launch Readiness Report',
                subtitle: 'Create a shareable snapshot for the next pilot, paid beta, customer demo, or launch decision. This is deterministic and only updates when you generate it.',
              }}
            />
          )}

          {selectedProduct && workspaceTab === 'actions' && (
            <OwnerWorkspaceActionsPane
              view={actionView}
              detailOpen={workspaceDetailOpen}
              actionPlan={{
                ownerActionGroups,
                onOpenServicesRecommend: () => openServicesView('recommend'),
              }}
              diagnosis={{
                product: selectedProduct,
                diagnosisForm,
                latestDiagnosis,
                catalogModules: catalogModules.data || [],
                cartServiceIds,
                diagnosisPromptFacts,
                assistantContext: assistantContext('product-diagnosis'),
                assistantActions: assistantActionProps,
                isCreatingDiagnosis: createDiagnosis.isPending,
                isAddingService: addServiceToCart.isPending,
                onCreateDiagnosis: () => createDiagnosis.mutate(),
                onAddService: addLifecycleService,
              }}
            />
          )}

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

          {workspaceTab === 'services' && (
            <OwnerWorkspaceServicesPane
              view={servicesView}
              detailOpen={workspaceDetailOpen}
              recommend={{
                product: selectedProduct,
                categories: categories.data || [],
                catalogModules: catalogModules.data || [],
                recommendedServices,
                cartServiceItems,
                cartServiceIds,
                blockerCount: launchStatus.blockerCount,
                improvementCount: launchStatus.improvementCount,
                mappedServiceNames: scannerMappedServices,
                ownerRisks: serviceRiskItems,
                cartStartPromptFacts,
                assistantContext: assistantContext('service-selection'),
                assistantActions: assistantActionProps,
                isAddingService: addServiceToCart.isPending,
                isRemovingService: removeServiceFromCart.isPending,
                onAddService: addLifecycleService,
                onRemoveService: (itemId) => removeServiceFromCart.mutate(itemId),
              }}
              plan={{
                showProductCreation,
                selectedProduct,
                productFormValues: productForm.values,
                requirementFormValues: requirementForm.values,
                selectedProductRequirements,
                catalogModules: catalogModules.data || [],
                selectedPackage,
                packageModules: packageModules.data || [],
                isPackageFetching: packageModules.isFetching,
                isTeamRecommendationsFetching: teamRecommendations.isFetching,
                isCreatingProduct: createProduct.isPending,
                isCreatingRequirement: createRequirement.isPending,
                isBuildingPackage: buildPackage.isPending,
                cartStartPromptFacts,
                packageAssistantContext: assistantContext('package-recommendation'),
                assistantActions: assistantActionProps,
                onProductValueChange: (key, value) => productForm.setValue(key as keyof ProductProfilePayload, value as any),
                onRequirementValueChange: (key, value) => requirementForm.setValue(key as keyof RequirementPayload, value as any),
                onSubmitProduct: submitProduct,
                onSubmitRequirement: submitRequirement,
                onBuildPackage: (requirementId) => buildPackage.mutate(requirementId),
              }}
              team={{
                recommendations: teamRecommendations.data || [],
                productProposals,
                cartTalentItems,
                activeShortlists,
                suggestedTeams,
                suggestedExperts,
                hasServicePlan: !!selectedPackage,
                isAddingTalent: addTalentToCart.isPending,
                isRemovingTalent: removeTalentFromCart.isPending,
                isShortlisting: upsertShortlist.isPending,
                isAcceptingProposal: acceptProposal.isPending,
                onAddRecommendationTeam: addRecommendationTeamToCart,
                onAddTeam: addTeamToCart,
                onAddExpert: addExpertToCart,
                onRemoveTalent: (itemId) => removeTalentFromCart.mutate(itemId),
                onRecordShortlist: recordShortlist,
                onAcceptProposal: (proposalId) => acceptProposal.mutate(proposalId),
              }}
            />
          )}
        </Stack>

        <OwnerWorkspaceSideRailPane
          control={selectedProduct ? {
            status: launchStatus,
            primaryAction: launchStatus.blockerCount ? 'Open action plan' : topRecommendedServiceName ? 'Review service path' : 'Open proof',
            lastScanLabel: scannerSummary.data?.recentRuns[0]?.completedAt ? shortDateTime(scannerSummary.data.recentRuns[0].completedAt) : latestCompletedTools ? `${latestCompletedTools} checks completed` : 'No completed check yet',
            evidenceLabel: `${latestCompletedTools}/${scanToolOptions.length} checks`,
            onPrimaryAction: () => launchStatus.blockerCount ? openActionView('plan') : topRecommendedServiceName ? openServicesView('recommend') : openFindingsView('evidence'),
            secondary: (
              <Button variant="outlined" startIcon={<EventRepeatOutlined />} onClick={() => setTimelineOpen(true)} sx={{ minHeight: 38 }}>
                View timeline
              </Button>
            ),
          } : undefined}
          projectStart={workspaceTab === 'services' && workspaceDetailOpen && (servicesView === 'plan' || servicesView === 'team') ? {
            product: selectedProduct,
            cart: cart.data,
            notice: cartNotice,
            canStartWorkspace: canStartProjectWorkspace,
            blockers: cartBlockers,
            blockingGaps: cartBlockingGaps,
            blockingRecommendationNames: cartBlockingRecommendations.map((item) => item.recommendedModule.name),
            projectName,
            hasWorkspace: !!(selectedWorkspace || cart.data?.convertedWorkspace),
            isAddingService: addServiceToCart.isPending,
            isRemovingService: removeServiceFromCart.isPending,
            isRemovingTalent: removeTalentFromCart.isPending,
            isConverting: convertCart.isPending,
            onNoticeClose: () => setCartNotice(''),
            onProjectNameChange: setProjectName,
            onAddGapService: (serviceModule, notes) => addServiceToCart.mutate({ serviceModuleId: serviceModule.id, notes }),
            onRemoveService: (itemId) => removeServiceFromCart.mutate(itemId),
            onRemoveTalent: (itemId) => removeTalentFromCart.mutate(itemId),
            onConvert: () => convertCart.mutate(),
          } : undefined}
          aiBrief={workspaceDetailOpen && (workspaceTab === 'overview' || workspaceTab === 'actions') ? {
            fallbackReason: assistantSuggestions.data?.fallbackReason,
            isDisabled: !selectedProduct?.id,
            isFetching: assistantSuggestions.isFetching,
            mode: assistantSuggestions.data?.mode,
            recommendationRationale: recommendations.data?.[0]?.rationale,
            suggestions: assistantSuggestions.data?.suggestions || [],
            onSuggest: () => assistantSuggestions.refetch(),
          } : undefined}
          deliveryWorkspace={workspaceTab === 'services' && workspaceDetailOpen && servicesView === 'team' ? {
            assistantActions: assistantActionProps,
            assistantContext: assistantContext('milestone-evidence-readiness', { milestoneId: selectedMilestone?.id }),
            blockedMilestoneCount: blockedMilestones,
            milestones: milestones.data || [],
            selectedMilestone,
            workspace: selectedWorkspace,
          } : undefined}
          supportRisk={workspaceTab === 'services' && workspaceDetailOpen && servicesView === 'team' ? {
            supportRequests: productSupport,
          } : undefined}
          nextDecision={{
            blockedMilestoneCount: blockedMilestones,
            buildTargetRequirementId: buildTargetRequirementId || undefined,
            hasServicePlan: !!selectedPackage,
            hasWorkspace: !!selectedWorkspace,
            isBuilding: buildPackage.isPending,
            proposals: productProposals,
            onBuildPlan: (requirementId) => buildPackage.mutate(requirementId),
          }}
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
