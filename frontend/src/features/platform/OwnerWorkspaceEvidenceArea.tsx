'use client';

import type { ComponentProps } from 'react';
import OwnerFindingsEvidencePanel from './OwnerFindingsEvidencePanel';
import RepoReadoutPanel from './RepoReadoutPanel';
import { shortDateTime } from './ownerProductizationWorkspaceConfig';

type EvidencePanelProps = ComponentProps<typeof OwnerFindingsEvidencePanel>;
type RepoReadoutProps = ComponentProps<typeof RepoReadoutPanel>;

interface OwnerWorkspaceEvidenceAreaProps {
  summaryItems: EvidencePanelProps['summaryItems'];
  sources: EvidencePanelProps['sources'];
  evidence: EvidencePanelProps['evidence'];
  evidenceFilter: EvidencePanelProps['evidenceFilter'];
  repoSummary: RepoReadoutProps['summary'];
  scannerSummary: RepoReadoutProps['scannerSummary'];
  repoSignalsFetching: RepoReadoutProps['isFetching'];
  isRefreshingRepoSignals: RepoReadoutProps['isRefreshing'];
  isExporting: EvidencePanelProps['isExporting'];
  isOpeningEvidence: EvidencePanelProps['isOpeningEvidence'];
  onEvidenceFilterChange: EvidencePanelProps['onEvidenceFilterChange'];
  onExport: EvidencePanelProps['onExport'];
  onOpenEvidence: EvidencePanelProps['onOpenEvidence'];
  onRefreshRepoSignals: RepoReadoutProps['onRefresh'];
}

export default function OwnerWorkspaceEvidenceArea({
  summaryItems,
  sources,
  evidence,
  evidenceFilter,
  repoSummary,
  scannerSummary,
  repoSignalsFetching,
  isRefreshingRepoSignals,
  isExporting,
  isOpeningEvidence,
  onEvidenceFilterChange,
  onExport,
  onOpenEvidence,
  onRefreshRepoSignals,
}: OwnerWorkspaceEvidenceAreaProps) {
  return (
    <>
      <OwnerFindingsEvidencePanel
        summaryItems={summaryItems}
        sources={sources}
        evidence={evidence}
        evidenceFilter={evidenceFilter}
        isExporting={isExporting}
        isOpeningEvidence={isOpeningEvidence}
        onEvidenceFilterChange={onEvidenceFilterChange}
        onExport={onExport}
        onOpenEvidence={onOpenEvidence}
        formatDateTime={shortDateTime}
      />
      <RepoReadoutPanel
        summary={repoSummary}
        scannerSummary={scannerSummary}
        isFetching={repoSignalsFetching}
        isRefreshing={isRefreshingRepoSignals}
        onRefresh={onRefreshRepoSignals}
      />
    </>
  );
}
