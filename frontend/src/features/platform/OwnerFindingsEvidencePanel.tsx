'use client';

import { CloudUploadOutlined } from '@mui/icons-material';
import { Box, Button } from '@mui/material';
import {
  SectionTitle,
  Surface,
} from './PlatformComponents';
import OwnerProofLibrarySourcesList from './OwnerProofLibrarySourcesList';
import OwnerProofLibrarySummaryGrid, { type EvidenceSummaryItem } from './OwnerProofLibrarySummaryGrid';
import OwnerSavedProofList from './OwnerSavedProofList';
import type { OwnerEvidenceFilter } from './ownerEvidenceLibraryModel';
import { ScanSource, ScannerEvidenceItem } from './types';
export type { OwnerEvidenceFilter } from './ownerEvidenceLibraryModel';

interface OwnerFindingsEvidencePanelProps {
  summaryItems: EvidenceSummaryItem[];
  sources: ScanSource[];
  evidence: ScannerEvidenceItem[];
  evidenceFilter: OwnerEvidenceFilter;
  section?: 'all' | 'sources' | 'saved';
  showSummary?: boolean;
  isExporting: boolean;
  isOpeningEvidence: boolean;
  onEvidenceFilterChange: (filter: OwnerEvidenceFilter) => void;
  onExport: () => void;
  onOpenEvidence: (evidence: ScannerEvidenceItem) => void;
  formatDateTime: (value?: string) => string;
}

export default function OwnerFindingsEvidencePanel({
  summaryItems,
  sources,
  evidence,
  evidenceFilter,
  section = 'all',
  showSummary = true,
  isExporting,
  isOpeningEvidence,
  onEvidenceFilterChange,
  onExport,
  onOpenEvidence,
  formatDateTime,
}: OwnerFindingsEvidencePanelProps) {
  const showSources = section === 'all' || section === 'sources';
  const showSavedProof = section === 'all' || section === 'saved';
  const title = section === 'sources' ? 'Connected sources' : section === 'saved' ? 'Saved proof' : 'Proof library';

  return (
    <Surface>
      <SectionTitle
        title={title}
        action={
          <Button size="small" variant="outlined" startIcon={<CloudUploadOutlined />} disabled={isExporting} onClick={onExport} sx={{ minHeight: 36 }}>
            Export proof
          </Button>
        }
      />
      {showSummary && (
        <Box sx={{ mb: 2 }}>
          <OwnerProofLibrarySummaryGrid summaryItems={summaryItems} />
        </Box>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: showSources && showSavedProof ? '340px minmax(0, 1fr)' : 'minmax(0, 1fr)' }, gap: 2 }}>
        {showSources && <OwnerProofLibrarySourcesList sources={sources} />}
        {showSavedProof && (
          <OwnerSavedProofList
            evidence={evidence}
            evidenceFilter={evidenceFilter}
            isOpeningEvidence={isOpeningEvidence}
            onEvidenceFilterChange={onEvidenceFilterChange}
            onOpenEvidence={onOpenEvidence}
            formatDateTime={formatDateTime}
          />
        )}
      </Box>
    </Surface>
  );
}
