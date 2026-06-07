'use client';

import { CloudUploadOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import {
  EmptyState,
  PastelChip,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { ScanSource, ScannerEvidenceItem } from './types';
import { scannerEvidenceText } from './scannerEvidencePresentation';

export type OwnerEvidenceFilter = 'ALL' | 'FINDINGS' | 'MILESTONES' | 'REDACTED';

interface EvidenceSummaryItem {
  label: string;
  value: string;
  accent: string;
}

interface OwnerFindingsEvidencePanelProps {
  summaryItems: EvidenceSummaryItem[];
  sources: ScanSource[];
  evidence: ScannerEvidenceItem[];
  evidenceFilter: OwnerEvidenceFilter;
  isExporting: boolean;
  isOpeningEvidence: boolean;
  onEvidenceFilterChange: (filter: OwnerEvidenceFilter) => void;
  onExport: () => void;
  onOpenEvidence: (evidence: ScannerEvidenceItem) => void;
  formatDateTime: (value?: string) => string;
}

const confidenceDots = (level?: string) => {
  if (level === 'HIGH') return '●●●';
  if (level === 'MEDIUM') return '●●○';
  return '●○○';
};

export default function OwnerFindingsEvidencePanel({
  summaryItems,
  sources,
  evidence,
  evidenceFilter,
  isExporting,
  isOpeningEvidence,
  onEvidenceFilterChange,
  onExport,
  onOpenEvidence,
  formatDateTime,
}: OwnerFindingsEvidencePanelProps) {
  return (
    <Surface>
      <SectionTitle
        title="Evidence and Stored Proof"
        action={
          <Button size="small" variant="outlined" startIcon={<CloudUploadOutlined />} disabled={isExporting} onClick={onExport} sx={{ minHeight: 36 }}>
            Export
          </Button>
        }
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.25, mb: 2 }}>
        {summaryItems.map((item) => (
          <Box key={item.label} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: `${item.accent}32`, bgcolor: '#fff', minHeight: 88 }}>
            <Typography variant="caption" color="text.secondary">{item.label}</Typography>
            <Typography variant="body2" sx={{ mt: 0.55, fontWeight: 900, lineHeight: 1.35, overflowWrap: 'anywhere' }}>{item.value}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '340px minmax(0, 1fr)' }, gap: 2 }}>
        <Stack spacing={1.25}>
          <Typography sx={{ fontWeight: 950 }}>Sources</Typography>
          {sources.length ? sources.map((source) => (
            <Box key={source.id} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: source.authorizationStatus === 'AUTHORIZED' ? '#c8f2da' : appleColors.line, bgcolor: '#fff' }}>
              <Stack direction="row" spacing={1} justifyContent="space-between">
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>{source.displayName}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>{source.externalReference || formatLabel(source.providerType)}</Typography>
                </Box>
                <StatusChip label={source.authorizationStatus} color={source.authorizationStatus === 'AUTHORIZED' ? 'success' : 'warning'} />
              </Stack>
            </Box>
          )) : (
            <EmptyState label="No scanner source is attached yet." />
          )}
        </Stack>
        <Stack spacing={1.25}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
            <Typography sx={{ fontWeight: 950 }}>Stored Proof</Typography>
            <TextField
              select
              size="small"
              label="Filter"
              value={evidenceFilter}
              onChange={(event) => onEvidenceFilterChange(event.target.value as OwnerEvidenceFilter)}
              sx={{ minWidth: { xs: '100%', sm: 180 } }}
            >
              <MenuItem value="ALL">All evidence</MenuItem>
              <MenuItem value="FINDINGS">Finding-linked</MenuItem>
              <MenuItem value="MILESTONES">Milestone-linked</MenuItem>
              <MenuItem value="REDACTED">Redacted</MenuItem>
            </TextField>
          </Stack>
          {evidence.length ? evidence.slice(0, 10).map((item) => (
            <Box key={item.id} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: '#e5edf7', bgcolor: item.redactionStatus === 'NONE' ? '#fbfdff' : '#fff7f8' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>{item.title}</Typography>
                    <PastelChip label={confidenceDots(item.confidenceLevel)} accent={item.confidenceLevel === 'HIGH' ? appleColors.green : item.confidenceLevel === 'MEDIUM' ? appleColors.amber : appleColors.muted} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.45, lineHeight: 1.45 }}>
                    {scannerEvidenceText(item.summary || item.source)} · {formatDateTime(item.createdAt)}
                  </Typography>
                </Box>
                <Button size="small" variant="outlined" startIcon={<VisibilityOutlined />} disabled={(!item.storageKey && !item.artifactRef) || isOpeningEvidence} onClick={() => onOpenEvidence(item)} sx={{ minHeight: 34 }}>
                  Open
                </Button>
              </Stack>
            </Box>
          )) : (
            <EmptyState label="No stored scanner proof matches this filter." />
          )}
        </Stack>
      </Box>
    </Surface>
  );
}
