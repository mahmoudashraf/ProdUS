'use client';

import { CloudUploadOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import type { ComponentProps } from 'react';
import { OwnerWorkspaceJourneyNav, WorkspaceBreadcrumbs, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import OwnerFindingsEvidencePanel from './OwnerFindingsEvidencePanel';
import OwnerProofLibrarySummaryGrid from './OwnerProofLibrarySummaryGrid';
import RepoReadoutPanel from './RepoReadoutPanel';
import {
  PastelChip,
  Surface,
  appleColors,
} from './PlatformComponents';
import type { EvidenceLibraryView } from './ownerEvidenceLibraryModel';
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
  view: EvidenceLibraryView | null;
  repoSignalsFetching: RepoReadoutProps['isFetching'];
  isRefreshingRepoSignals: RepoReadoutProps['isRefreshing'];
  isExporting: EvidencePanelProps['isExporting'];
  isOpeningEvidence: EvidencePanelProps['isOpeningEvidence'];
  onEvidenceFilterChange: EvidencePanelProps['onEvidenceFilterChange'];
  onExport: EvidencePanelProps['onExport'];
  onOpenEvidence: EvidencePanelProps['onOpenEvidence'];
  onOpenHub: () => void;
  onViewChange: (view: EvidenceLibraryView) => void;
  onRefreshRepoSignals: RepoReadoutProps['onRefresh'];
}

export default function OwnerWorkspaceEvidenceArea({
  summaryItems,
  sources,
  evidence,
  evidenceFilter,
  repoSummary,
  scannerSummary,
  view,
  repoSignalsFetching,
  isRefreshingRepoSignals,
  isExporting,
  isOpeningEvidence,
  onEvidenceFilterChange,
  onExport,
  onOpenEvidence,
  onOpenHub,
  onViewChange,
  onRefreshRepoSignals,
}: OwnerWorkspaceEvidenceAreaProps) {
  const authorizedSourceCount = sources.filter((source) => source.authorizationStatus === 'AUTHORIZED').length;
  const unknownCount = repoSummary?.unknowns.length || 0;
  const readoutStatus = repoSummary?.sourceStatus === 'AUTHORIZED_SOURCE'
    ? 'Repo connected'
    : repoSummary?.sourceStatus === 'OWNER_PROVIDED_SOURCE'
      ? 'Owner source'
      : unknownCount
        ? `${unknownCount} unknown`
        : 'Not refreshed';
  const items: JourneyStepItem<EvidenceLibraryView>[] = [
    {
      value: 'saved',
      label: 'Saved proof',
      detail: 'Open evidence files, filter linked proof, and export the proof package.',
      accent: evidence.length ? appleColors.cyan : appleColors.muted,
      meta: <PastelChip label={`${evidence.length} proof`} accent={evidence.length ? appleColors.cyan : appleColors.muted} bg={evidence.length ? '#e4f9fd' : '#f8fafc'} />,
    },
    {
      value: 'sources',
      label: 'Connected sources',
      detail: 'Review the repositories, live URLs, CI imports, and scanner sources trusted for this product.',
      accent: authorizedSourceCount ? appleColors.green : appleColors.amber,
      meta: (
        <PastelChip
          label={`${authorizedSourceCount}/${sources.length} trusted`}
          accent={authorizedSourceCount ? appleColors.green : appleColors.amber}
          bg={authorizedSourceCount ? '#e7f8ee' : '#fff4dc'}
        />
      ),
    },
    {
      value: 'readout',
      label: 'Source readout',
      detail: 'See the product facts, scan-backed facts, unknowns, and next scan steps.',
      accent: unknownCount ? appleColors.amber : appleColors.blue,
      meta: <PastelChip label={readoutStatus} accent={unknownCount ? appleColors.amber : appleColors.blue} bg={unknownCount ? '#fff4dc' : '#eaf3ff'} />,
    },
  ];
  const selectedItem = items.find((item) => item.value === view) || null;

  if (!view) {
    return (
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 55%, #f6fffb 100%)' }}>
        <Stack spacing={2}>
          <Box>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <PastelChip label="Proof library" accent={appleColors.cyan} bg="#e4f9fd" />
              <PastelChip label={`${sources.length} sources`} accent={sources.length ? appleColors.green : appleColors.amber} bg={sources.length ? '#e7f8ee' : '#fff4dc'} />
            </Stack>
            <Typography variant="h3" sx={{ mt: 1 }}>
              Choose the proof you need
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 820, lineHeight: 1.65 }}>
              Saved proof, trusted sources, and product facts are related, but they answer different questions. Open one focused proof view, then come back here when you need the next one.
            </Typography>
          </Box>
          <OwnerProofLibrarySummaryGrid summaryItems={summaryItems} />
          <OwnerWorkspaceJourneyNav
            label="Proof library choices"
            value={null}
            items={items}
            maxColumns={3}
            onChange={onViewChange}
          />
          <Button
            size="small"
            variant="outlined"
            startIcon={<CloudUploadOutlined />}
            disabled={isExporting}
            onClick={onExport}
            sx={{ minHeight: 38, alignSelf: 'flex-start' }}
          >
            Export proof
          </Button>
        </Stack>
      </Surface>
    );
  }

  return (
    <Stack spacing={2}>
      <WorkspaceBreadcrumbs
        items={[
          { label: 'Proof library', onClick: onOpenHub },
          { label: selectedItem?.label || 'Proof view' },
        ]}
        backLabel="Proof library"
        onBack={onOpenHub}
      />
      {view === 'readout' ? (
        <RepoReadoutPanel
          summary={repoSummary}
          scannerSummary={scannerSummary}
          isFetching={repoSignalsFetching}
          isRefreshing={isRefreshingRepoSignals}
          onRefresh={onRefreshRepoSignals}
        />
      ) : (
        <OwnerFindingsEvidencePanel
          summaryItems={summaryItems}
          sources={sources}
          evidence={evidence}
          evidenceFilter={evidenceFilter}
          section={view === 'sources' ? 'sources' : 'saved'}
          showSummary={false}
          isExporting={isExporting}
          isOpeningEvidence={isOpeningEvidence}
          onEvidenceFilterChange={onEvidenceFilterChange}
          onExport={onExport}
          onOpenEvidence={onOpenEvidence}
          formatDateTime={shortDateTime}
        />
      )}
    </Stack>
  );
}
