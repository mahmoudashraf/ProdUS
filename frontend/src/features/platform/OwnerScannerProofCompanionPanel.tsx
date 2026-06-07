'use client';

import { LinearProgress, Stack } from '@mui/material';

import { OwnerEvidenceFilter } from './OwnerFindingsEvidencePanel';
import OwnerScannerEvidenceCenterPanel from './OwnerScannerEvidenceCenterPanel';
import ScannerProofFindingDecisionList from './ScannerProofFindingDecisionList';
import ScannerProofImportSummaryPanel from './ScannerProofImportSummaryPanel';
import ScannerProofRecentRunsPanel from './ScannerProofRecentRunsPanel';
import ScannerProofScheduleSummaryPanel from './ScannerProofScheduleSummaryPanel';
import ScannerProofSourceSummaryPanel from './ScannerProofSourceSummaryPanel';
import {
  NormalizedFinding,
  ProductScannerSummary,
  ScanRun,
  ScannerEvidenceItem,
  ServiceModule,
} from './types';

type OwnerScannerProofCompanionPanelProps = {
  view?: 'result' | 'stored' | 'decisions' | undefined;
  scannerSummary: ProductScannerSummary | undefined;
  filteredScannerEvidence: ScannerEvidenceItem[];
  evidenceFilter: OwnerEvidenceFilter;
  selectedFinding: NormalizedFinding | undefined;
  cartServiceIds: Set<string>;
  findingReasonById: Record<string, string>;
  findingReviewDueById: Record<string, string>;
  deleteArtifactsOnDisconnect: boolean;
  activeScanRun: ScanRun | undefined;
  hasProduct: boolean;
  isBusy: boolean;
  isDisconnectingSource: boolean;
  isUpdatingSchedule: boolean;
  isOpeningEvidence: boolean;
  isExportingEvidence: boolean;
  isUpdatingFindingStatus: boolean;
  isAddingService: boolean;
  isCancelingScan: boolean;
  isRescanning: boolean;
  onDeleteArtifactsChange: (value: boolean) => void;
  onDisconnectSource: (sourceId: string) => void;
  onToggleSchedule: (scheduleId: string, active: boolean) => void;
  onEvidenceFilterChange: (filter: OwnerEvidenceFilter) => void;
  onExportEvidence: () => void;
  onOpenEvidence: (evidence: ScannerEvidenceItem) => void;
  onSelectFinding: (findingId: string) => void;
  onFindingReasonChange: (findingId: string, value: string) => void;
  onFindingReviewDueChange: (findingId: string, value: string) => void;
  onAddService: (serviceModule: ServiceModule, source?: string) => void;
  onRecordFindingDecision: (
    finding: NormalizedFinding,
    status: NormalizedFinding['status']
  ) => void;
  onCancelRun: (runId: string) => void;
  onRescanRun: (runId: string) => void;
  formatDateTime: (value?: string) => string;
};

export default function OwnerScannerProofCompanionPanel({
  view,
  scannerSummary,
  filteredScannerEvidence,
  evidenceFilter,
  selectedFinding,
  cartServiceIds,
  findingReasonById,
  findingReviewDueById,
  deleteArtifactsOnDisconnect,
  activeScanRun,
  hasProduct,
  isBusy,
  isDisconnectingSource,
  isUpdatingSchedule,
  isOpeningEvidence,
  isExportingEvidence,
  isUpdatingFindingStatus,
  isAddingService,
  isCancelingScan,
  isRescanning,
  onDeleteArtifactsChange,
  onDisconnectSource,
  onToggleSchedule,
  onEvidenceFilterChange,
  onExportEvidence,
  onOpenEvidence,
  onSelectFinding,
  onFindingReasonChange,
  onFindingReviewDueChange,
  onAddService,
  onRecordFindingDecision,
  onCancelRun,
  onRescanRun,
  formatDateTime,
}: OwnerScannerProofCompanionPanelProps) {
  const sources = scannerSummary?.sources || [];
  const schedules = scannerSummary?.schedules || [];
  const imports = scannerSummary?.imports || [];
  const findings = scannerSummary?.findings || [];
  const recentRuns = scannerSummary?.recentRuns || [];
  const showResult = !view || view === 'result';
  const showStored = !view || view === 'stored';
  const showDecisions = !view || view === 'decisions';

  return (
    <Stack spacing={1.5}>
      {isBusy && <LinearProgress sx={{ borderRadius: 999 }} />}
      {showResult && (
        <>
          <ScannerProofSourceSummaryPanel
            sources={sources}
            deleteArtifactsOnDisconnect={deleteArtifactsOnDisconnect}
            isDisconnecting={isDisconnectingSource}
            onDeleteArtifactsChange={onDeleteArtifactsChange}
            onDisconnectSource={onDisconnectSource}
          />
          <ScannerProofScheduleSummaryPanel
            schedules={schedules}
            isUpdating={isUpdatingSchedule}
            onToggleSchedule={onToggleSchedule}
            formatDateTime={formatDateTime}
          />
          <ScannerProofImportSummaryPanel imports={imports} />
          <ScannerProofRecentRunsPanel
            recentRuns={recentRuns}
            activeScanRun={activeScanRun}
            isCanceling={isCancelingScan}
            isRescanning={isRescanning}
            onCancelRun={onCancelRun}
            onRescanRun={onRescanRun}
          />
        </>
      )}
      {showStored && (
        <OwnerScannerEvidenceCenterPanel
          hasProduct={hasProduct}
          evidence={filteredScannerEvidence}
          evidenceFilter={evidenceFilter}
          isExporting={isExportingEvidence}
          isOpeningEvidence={isOpeningEvidence}
          onEvidenceFilterChange={onEvidenceFilterChange}
          onExport={onExportEvidence}
          onOpenEvidence={onOpenEvidence}
          formatDateTime={formatDateTime}
        />
      )}
      {showDecisions && (
        <ScannerProofFindingDecisionList
          findings={findings}
          selectedFinding={selectedFinding}
          cartServiceIds={cartServiceIds}
          findingReasonById={findingReasonById}
          findingReviewDueById={findingReviewDueById}
          isUpdatingStatus={isUpdatingFindingStatus}
          isAddingService={isAddingService}
          onSelectFinding={onSelectFinding}
          onFindingReasonChange={onFindingReasonChange}
          onFindingReviewDueChange={onFindingReviewDueChange}
          onAddService={onAddService}
          onRecordDecision={onRecordFindingDecision}
        />
      )}
    </Stack>
  );
}
