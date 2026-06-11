'use client';

import { VisibilityOutlined } from '@mui/icons-material';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import {
  EmptyState,
  PastelChip,
  appleColors,
} from './PlatformComponents';
import type { OwnerEvidenceFilter } from './ownerEvidenceLibraryModel';
import { scannerEvidenceText } from './scannerEvidencePresentation';
import type { ScannerEvidenceItem } from './types';

const confidenceLabel = (level?: string) => {
  if (level === 'HIGH') return 'High confidence';
  if (level === 'MEDIUM') return 'Medium confidence';
  return 'Needs review';
};

export default function OwnerSavedProofList({
  evidence,
  evidenceFilter,
  isOpeningEvidence,
  onEvidenceFilterChange,
  onOpenEvidence,
  formatDateTime,
}: {
  evidence: ScannerEvidenceItem[];
  evidenceFilter: OwnerEvidenceFilter;
  isOpeningEvidence: boolean;
  onEvidenceFilterChange: (filter: OwnerEvidenceFilter) => void;
  onOpenEvidence: (evidence: ScannerEvidenceItem) => void;
  formatDateTime: (value?: string) => string;
}) {
  return (
    <Stack spacing={1.25}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
        <Typography sx={{ fontWeight: 950 }}>Saved proof</Typography>
        <TextField
          select
          size="small"
          label="Show"
          value={evidenceFilter}
          onChange={(event) => onEvidenceFilterChange(event.target.value as OwnerEvidenceFilter)}
          sx={{ minWidth: { xs: '100%', sm: 180 } }}
        >
          <MenuItem value="ALL">All proof</MenuItem>
          <MenuItem value="FINDINGS">Linked to risks</MenuItem>
          <MenuItem value="MILESTONES">Linked to milestones</MenuItem>
          <MenuItem value="REDACTED">Sensitive hidden</MenuItem>
        </TextField>
      </Stack>
      {evidence.length ? evidence.slice(0, 10).map((item) => (
        <Box key={item.id} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: '#e5edf7', bgcolor: item.redactionStatus === 'NONE' ? '#fbfdff' : '#fff7f8' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>{item.title}</Typography>
                <PastelChip label={confidenceLabel(item.confidenceLevel)} accent={item.confidenceLevel === 'HIGH' ? appleColors.green : item.confidenceLevel === 'MEDIUM' ? appleColors.amber : appleColors.muted} />
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
        <EmptyState label="No saved proof matches this filter." />
      )}
    </Stack>
  );
}
