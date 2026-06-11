'use client';

import type { ComponentProps } from 'react';
import OwnerFindingsEvidencePanel from './OwnerFindingsEvidencePanel';
import OwnerFindingsRiskPanel from './OwnerFindingsRiskPanel';
import OwnerWorkspaceEvidenceArea from './OwnerWorkspaceEvidenceArea';
import OwnerWorkspaceRiskArea from './OwnerWorkspaceRiskArea';
import OwnerWorkspaceScannersOverview from './OwnerWorkspaceScannersOverview';
import OwnerWorkspaceTechnicalProofArea from './OwnerWorkspaceTechnicalProofArea';
import type { OwnerTechnicalProofProps } from './OwnerTechnicalProofJourneyPanel';
import type { StudioAssistantContext } from './StudioAssistantCard';
import type { FindingsJourneyView } from './ownerWorkspaceJourneyConfig';
import type { TechnicalProofView } from './ownerTechnicalProofJourneyModel';
import type { WorkspaceTab } from './ownerWorkspaceModel';
import type { useOwnerWorkspaceProductActions } from './useOwnerWorkspaceProductActions';
import type { useOwnerWorkspaceScannerOperations } from './useOwnerWorkspaceScannerOperations';
import type { NormalizedFinding } from './types';

type RiskProps = ComponentProps<typeof OwnerFindingsRiskPanel>;
type EvidenceProps = ComponentProps<typeof OwnerFindingsEvidencePanel>;
type ScannerOperations = ReturnType<typeof useOwnerWorkspaceScannerOperations>;
type ProductActions = ReturnType<typeof useOwnerWorkspaceProductActions>;

interface ScannerCounts {
  critical?: number;
  high?: number;
  open?: number;
  total?: number;
}

interface OwnerWorkspaceFindingsAreaProps {
  workspaceTab: WorkspaceTab;
  view: FindingsJourneyView;
  detailOpen: boolean;
  selectedProduct: OwnerTechnicalProofProps['operations']['selectedProduct'];
  selectedWorkspace: OwnerTechnicalProofProps['operations']['selectedWorkspace'];
  groupedFindings: RiskProps['groups'];
  openFindingGroups: RiskProps['openGroups'];
  evidenceSummaryItems: EvidenceProps['summaryItems'];
  evidenceFilter: EvidenceProps['evidenceFilter'];
  repoSignalsData: ComponentProps<typeof OwnerWorkspaceEvidenceArea>['repoSummary'];
  repoSignalsFetching: ComponentProps<typeof OwnerWorkspaceEvidenceArea>['repoSignalsFetching'];
  scannerSummaryData: OwnerTechnicalProofProps['companion']['scannerSummary'];
  scannerSummaryFetching: boolean;
  catalogModules: OwnerTechnicalProofProps['fixPath']['serviceModules'];
  milestones: OwnerTechnicalProofProps['operations']['milestones'];
  scannerReadiness: OwnerTechnicalProofProps['runway']['scannerReadiness'];
  scannerCounts: ScannerCounts | undefined;
  latestCoveredTools: OwnerTechnicalProofProps['runway']['latestCoveredTools'];
  totalScanTools: number;
  latestMappedToolFindings: OwnerTechnicalProofProps['coverage']['latestMappedToolFindings'];
  unavailableScannerTools: OwnerTechnicalProofProps['coverage']['unavailableScannerTools'];
  scannerToolCoverage: OwnerTechnicalProofProps['coverage']['tools'];
  latestScannerDiagnosis: OwnerTechnicalProofProps['fixPath']['diagnosis'];
  scannerMappedFindings: OwnerTechnicalProofProps['fixPath']['mappedFindings'];
  scannerMappedServices: OwnerTechnicalProofProps['fixPath']['mappedServiceNames'];
  hasCompletedScannerRun: OwnerTechnicalProofProps['fixPath']['hasCompletedScannerRun'];
  scannerOpenFindings: NormalizedFinding[];
  scannerReadinessPromptFacts: string;
  selectedFinding: OwnerTechnicalProofProps['companion']['selectedFinding'];
  cartServiceIds: OwnerTechnicalProofProps['companion']['cartServiceIds'];
  findingReasonById: OwnerTechnicalProofProps['companion']['findingReasonById'];
  findingReviewDueById: OwnerTechnicalProofProps['companion']['findingReviewDueById'];
  scannerOperations: ScannerOperations;
  productActions: Pick<ProductActions, 'addServiceToCart' | 'createScannerReadinessDiagnosis' | 'refreshRepoSignals'>;
  assistantActionProps: Pick<OwnerTechnicalProofProps['assistant'], 'onConfirmAction' | 'actionDisabledReason'>;
  assistantContext: (pageType: string, overrides?: Partial<StudioAssistantContext>) => StudioAssistantContext;
  technicalProofView: TechnicalProofView;
  technicalProofDetailOpen: boolean;
  onToggleFindingGroup: RiskProps['onGroupToggle'];
  onReviewFinding: RiskProps['onReviewFinding'];
  onOpenFindingsView: (view: FindingsJourneyView) => void;
  onOpenTechnicalProofHub: () => void;
  onOpenTechnicalProofView: (view: TechnicalProofView) => void;
  onEvidenceFilterChange: EvidenceProps['onEvidenceFilterChange'];
  onFindingReasonChange: OwnerTechnicalProofProps['companion']['onFindingReasonChange'];
  onFindingReviewDueChange: OwnerTechnicalProofProps['companion']['onFindingReviewDueChange'];
  onAddService: OwnerTechnicalProofProps['fixPath']['onAddService'];
  onRecordFindingDecision: OwnerTechnicalProofProps['companion']['onRecordFindingDecision'];
}

export default function OwnerWorkspaceFindingsArea({
  workspaceTab,
  view,
  detailOpen,
  selectedProduct,
  selectedWorkspace,
  groupedFindings,
  openFindingGroups,
  evidenceSummaryItems,
  evidenceFilter,
  repoSignalsData,
  repoSignalsFetching,
  scannerSummaryData,
  scannerSummaryFetching,
  catalogModules,
  milestones,
  scannerReadiness,
  scannerCounts,
  latestCoveredTools,
  totalScanTools,
  latestMappedToolFindings,
  unavailableScannerTools,
  scannerToolCoverage,
  latestScannerDiagnosis,
  scannerMappedFindings,
  scannerMappedServices,
  hasCompletedScannerRun,
  scannerOpenFindings,
  scannerReadinessPromptFacts,
  selectedFinding,
  cartServiceIds,
  findingReasonById,
  findingReviewDueById,
  scannerOperations,
  productActions,
  assistantActionProps,
  assistantContext,
  technicalProofView,
  technicalProofDetailOpen,
  onToggleFindingGroup,
  onReviewFinding,
  onOpenFindingsView,
  onOpenTechnicalProofHub,
  onOpenTechnicalProofView,
  onEvidenceFilterChange,
  onFindingReasonChange,
  onFindingReviewDueChange,
  onAddService,
  onRecordFindingDecision,
}: OwnerWorkspaceFindingsAreaProps) {
  if (!selectedProduct || workspaceTab !== 'findings') return null;

  if (!detailOpen) {
    return (
      <OwnerWorkspaceScannersOverview
        scannerCounts={scannerCounts}
        scannerReadiness={scannerReadiness}
        latestCoveredTools={latestCoveredTools}
        totalTools={totalScanTools}
        latestMappedToolFindings={latestMappedToolFindings}
        scannerToolCoverage={scannerToolCoverage}
        scannerSummary={scannerSummaryData || undefined}
        storedProofCount={scannerOperations.filteredScannerEvidence.length}
        isFetching={scannerSummaryFetching}
        onOpenRisks={() => onOpenFindingsView('risks')}
        onOpenProofLibrary={() => onOpenFindingsView('evidence')}
        onOpenScannerTools={() => onOpenFindingsView('technical')}
      />
    );
  }

  if (view === 'evidence') {
    return (
      <OwnerWorkspaceEvidenceArea
        summaryItems={evidenceSummaryItems}
        sources={scannerSummaryData?.sources || []}
        evidence={scannerOperations.filteredScannerEvidence}
        evidenceFilter={evidenceFilter}
        repoSummary={repoSignalsData}
        scannerSummary={scannerSummaryData}
        repoSignalsFetching={repoSignalsFetching}
        isRefreshingRepoSignals={productActions.refreshRepoSignals.isPending}
        isExporting={scannerOperations.createEvidenceExport.isPending}
        isOpeningEvidence={scannerOperations.openSignedEvidence.isPending}
        onEvidenceFilterChange={onEvidenceFilterChange}
        onExport={() => scannerOperations.createEvidenceExport.mutate()}
        onOpenEvidence={scannerOperations.openEvidenceArtifact}
        onRefreshRepoSignals={() => productActions.refreshRepoSignals.mutate()}
      />
    );
  }

  if (view === 'technical') {
    return (
      <OwnerWorkspaceTechnicalProofArea
        assistantActionProps={assistantActionProps}
        assistantContext={assistantContext}
        cartServiceIds={cartServiceIds}
        catalogModules={catalogModules}
        evidenceFilter={evidenceFilter}
        findingReasonById={findingReasonById}
        findingReviewDueById={findingReviewDueById}
        hasCompletedScannerRun={hasCompletedScannerRun}
        latestCoveredTools={latestCoveredTools}
        latestMappedToolFindings={latestMappedToolFindings}
        latestScannerDiagnosis={latestScannerDiagnosis}
        milestones={milestones}
        onAddService={onAddService}
        onEvidenceFilterChange={onEvidenceFilterChange}
        onFindingReasonChange={onFindingReasonChange}
        onFindingReviewDueChange={onFindingReviewDueChange}
        onRecordFindingDecision={onRecordFindingDecision}
        onReviewBlockers={() => onOpenFindingsView('risks')}
        onSelectFinding={onReviewFinding}
        productActions={productActions}
        scannerCounts={scannerCounts}
        scannerMappedFindings={scannerMappedFindings}
        scannerMappedServices={scannerMappedServices}
        scannerOpenFindings={scannerOpenFindings}
        scannerOperations={scannerOperations}
        scannerReadiness={scannerReadiness}
        scannerReadinessPromptFacts={scannerReadinessPromptFacts}
        scannerSummaryData={scannerSummaryData}
        scannerSummaryFetching={scannerSummaryFetching}
        scannerToolCoverage={scannerToolCoverage}
        selectedFinding={selectedFinding}
        selectedProduct={selectedProduct}
        selectedWorkspace={selectedWorkspace}
        technicalProofDetailOpen={technicalProofDetailOpen}
        technicalProofView={technicalProofView}
        unavailableScannerTools={unavailableScannerTools}
        onOpenTechnicalProofHub={onOpenTechnicalProofHub}
        onOpenTechnicalProofView={onOpenTechnicalProofView}
      />
    );
  }

  return (
    <OwnerWorkspaceRiskArea
      groups={groupedFindings}
      totalFindingCount={scannerSummaryData?.findings.length || 0}
      openGroups={openFindingGroups}
      onGroupToggle={onToggleFindingGroup}
      onReviewFinding={onReviewFinding}
      onOpenTechnicalProof={() => onOpenFindingsView('technical')}
    />
  );
}
