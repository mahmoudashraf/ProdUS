'use client';

import { appleColors } from './PlatformComponents';
import OwnerTechnicalProofJourneyPanel, {
  type OwnerTechnicalProofProps,
} from './OwnerTechnicalProofJourneyPanel';
import type { StudioAssistantContext } from './StudioAssistantCard';
import {
  defaultToolsForDepth,
  externalImportProviders,
  scanToolOptions,
  shortDateTime,
} from './ownerProductizationWorkspaceConfig';
import type { useOwnerWorkspaceProductActions } from './useOwnerWorkspaceProductActions';
import type { useOwnerWorkspaceScannerOperations } from './useOwnerWorkspaceScannerOperations';
import type { NormalizedFinding } from './types';

type ScannerOperations = ReturnType<typeof useOwnerWorkspaceScannerOperations>;
type ProductActions = ReturnType<typeof useOwnerWorkspaceProductActions>;

interface ScannerCounts {
  critical?: number;
  high?: number;
  open?: number;
  total?: number;
}

interface OwnerWorkspaceTechnicalProofAreaProps {
  selectedProduct: OwnerTechnicalProofProps['operations']['selectedProduct'];
  selectedWorkspace: OwnerTechnicalProofProps['operations']['selectedWorkspace'];
  scannerSummaryData: OwnerTechnicalProofProps['companion']['scannerSummary'];
  scannerSummaryFetching: boolean;
  catalogModules: OwnerTechnicalProofProps['fixPath']['serviceModules'];
  milestones: OwnerTechnicalProofProps['operations']['milestones'];
  scannerReadiness: OwnerTechnicalProofProps['runway']['scannerReadiness'];
  scannerCounts: ScannerCounts | undefined;
  latestCoveredTools: OwnerTechnicalProofProps['runway']['latestCoveredTools'];
  latestMappedToolFindings: OwnerTechnicalProofProps['coverage']['latestMappedToolFindings'];
  unavailableScannerTools: OwnerTechnicalProofProps['coverage']['unavailableScannerTools'];
  scannerToolCoverage: OwnerTechnicalProofProps['coverage']['tools'];
  latestScannerDiagnosis: OwnerTechnicalProofProps['fixPath']['diagnosis'];
  scannerMappedFindings: OwnerTechnicalProofProps['fixPath']['mappedFindings'];
  scannerMappedServices: OwnerTechnicalProofProps['fixPath']['mappedServiceNames'];
  hasCompletedScannerRun: OwnerTechnicalProofProps['fixPath']['hasCompletedScannerRun'];
  scannerOpenFindings: NormalizedFinding[];
  scannerReadinessPromptFacts: string;
  evidenceFilter: OwnerTechnicalProofProps['companion']['evidenceFilter'];
  selectedFinding: OwnerTechnicalProofProps['companion']['selectedFinding'];
  cartServiceIds: OwnerTechnicalProofProps['companion']['cartServiceIds'];
  findingReasonById: OwnerTechnicalProofProps['companion']['findingReasonById'];
  findingReviewDueById: OwnerTechnicalProofProps['companion']['findingReviewDueById'];
  scannerOperations: ScannerOperations;
  productActions: Pick<ProductActions, 'addServiceToCart' | 'createScannerReadinessDiagnosis'>;
  assistantActionProps: Pick<OwnerTechnicalProofProps['assistant'], 'onConfirmAction' | 'actionDisabledReason'>;
  assistantContext: (pageType: string, overrides?: Partial<StudioAssistantContext>) => StudioAssistantContext;
  onReviewBlockers: OwnerTechnicalProofProps['runway']['onReviewBlockers'];
  onEvidenceFilterChange: OwnerTechnicalProofProps['companion']['onEvidenceFilterChange'];
  onSelectFinding: OwnerTechnicalProofProps['companion']['onSelectFinding'];
  onFindingReasonChange: OwnerTechnicalProofProps['companion']['onFindingReasonChange'];
  onFindingReviewDueChange: OwnerTechnicalProofProps['companion']['onFindingReviewDueChange'];
  onAddService: OwnerTechnicalProofProps['fixPath']['onAddService'];
  onRecordFindingDecision: OwnerTechnicalProofProps['companion']['onRecordFindingDecision'];
}

export default function OwnerWorkspaceTechnicalProofArea({
  selectedProduct,
  selectedWorkspace,
  scannerSummaryData,
  scannerSummaryFetching,
  catalogModules,
  milestones,
  scannerReadiness,
  scannerCounts,
  latestCoveredTools,
  latestMappedToolFindings,
  unavailableScannerTools,
  scannerToolCoverage,
  latestScannerDiagnosis,
  scannerMappedFindings,
  scannerMappedServices,
  hasCompletedScannerRun,
  scannerOpenFindings,
  scannerReadinessPromptFacts,
  evidenceFilter,
  selectedFinding,
  cartServiceIds,
  findingReasonById,
  findingReviewDueById,
  scannerOperations,
  productActions,
  assistantActionProps,
  assistantContext,
  onReviewBlockers,
  onEvidenceFilterChange,
  onSelectFinding,
  onFindingReasonChange,
  onFindingReviewDueChange,
  onAddService,
  onRecordFindingDecision,
}: OwnerWorkspaceTechnicalProofAreaProps) {
  const {
    activeProviderInstallations,
    activeScanRun,
    cancelScannerRun,
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
  } = scannerOperations;
  const {
    addServiceToCart,
    createScannerReadinessDiagnosis,
  } = productActions;

  if (!selectedProduct) return null;

  return (
    <OwnerTechnicalProofJourneyPanel
      technical={{
        runway: {
          scannerReadiness,
          criticalCount: scannerCounts?.critical || 0,
          highCount: scannerCounts?.high || 0,
          openFindingCount: scannerCounts?.open || 0,
          sourceCount: scannerSummaryData?.sources.length || 0,
          evidenceCount: filteredScannerEvidence.length,
          latestCoveredTools,
          totalTools: scanToolOptions.length,
          normalizedFindingCount: scannerCounts?.total || 0,
          activeScanRun: Boolean(activeScanRun),
          fullSuiteBlockedReason: fullHostedScanBlockedReason,
          isStartingFullSuite: startFullHostedScan.isPending,
          isExporting: createEvidenceExport.isPending,
          onRunFullSuite: () => startFullHostedScan.mutate(),
          onReviewBlockers,
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
          serviceModules: catalogModules,
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
          onAddService,
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
          milestones,
          scannerSources: scannerSummaryData?.sources || [],
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
          scannerSummary: scannerSummaryData,
          filteredScannerEvidence,
          evidenceFilter,
          selectedFinding,
          cartServiceIds,
          findingReasonById,
          findingReviewDueById,
          deleteArtifactsOnDisconnect,
          activeScanRun,
          hasProduct: !!selectedProduct,
          isBusy: scannerSummaryFetching || createScannerReadinessDiagnosis.isPending || scannerOperationBusy,
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
          onEvidenceFilterChange,
          onExportEvidence: () => createEvidenceExport.mutate(),
          onOpenEvidence: openEvidenceArtifact,
          onSelectFinding,
          onFindingReasonChange,
          onFindingReviewDueChange,
          onAddService,
          onRecordFindingDecision,
          onCancelRun: (runId) => cancelScannerRun.mutate(runId),
          onRescanRun: (runId) => rescanRun.mutate(runId),
          formatDateTime: shortDateTime,
        },
      }}
    />
  );
}
