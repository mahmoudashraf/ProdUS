'use client';

import { ArticleOutlined, CloudUploadOutlined, ContentCopyOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Box, Button, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material';
import {
  EmptyState,
  PastelChip,
  StatusChip,
  appleColors,
} from './PlatformComponents';
import { ScannerEvidenceItem } from './types';
import { OwnerEvidenceFilter } from './OwnerFindingsEvidencePanel';
import { scannerEvidenceText } from './scannerEvidencePresentation';

interface OwnerScannerEvidenceCenterPanelProps {
  hasProduct: boolean;
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

export default function OwnerScannerEvidenceCenterPanel({
  hasProduct,
  evidence,
  evidenceFilter,
  isExporting,
  isOpeningEvidence,
  onEvidenceFilterChange,
  onExport,
  onOpenEvidence,
  formatDateTime,
}: OwnerScannerEvidenceCenterPanelProps) {
  return (
    <Box sx={{ border: '1px solid', borderColor: appleColors.line, borderRadius: 1, p: 1.5, bgcolor: '#fff' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 1.25 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ArticleOutlined sx={{ color: appleColors.purple }} />
          <Typography sx={{ fontWeight: 900 }}>Evidence Center</Typography>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CloudUploadOutlined />}
            disabled={!hasProduct || isExporting}
            onClick={onExport}
            sx={{ minHeight: 40, minWidth: 132 }}
          >
            Export
          </Button>
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
      </Stack>
      {evidence.length ? (
        <Stack spacing={1}>
          {evidence.slice(0, 5).map((item) => (
            <Box key={item.id} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: '#e5edf7', bgcolor: item.redactionStatus === 'NONE' ? '#fbfdff' : '#fff7f8' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                    <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>{item.title}</Typography>
                    <PastelChip label={confidenceDots(item.confidenceLevel)} accent={item.confidenceLevel === 'HIGH' ? appleColors.green : item.confidenceLevel === 'MEDIUM' ? appleColors.amber : appleColors.muted} />
                    <StatusChip label={item.redactionStatus} color={item.redactionStatus === 'NONE' ? 'success' : 'warning'} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.45 }}>
                    {scannerEvidenceText(item.summary || item.source)} · {formatDateTime(item.createdAt)}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Tooltip title={item.storageKey ? 'Open with a short-lived signed artifact URL' : item.artifactRef ? 'Open the stored evidence artifact' : 'No artifact link exists for this evidence item'}>
                    <span>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityOutlined />}
                        disabled={(!item.storageKey && !item.artifactRef) || isOpeningEvidence}
                        onClick={() => onOpenEvidence(item)}
                        sx={{ minHeight: 34 }}
                      >
                        Open
                      </Button>
                    </span>
                  </Tooltip>
                  <Tooltip title={item.storageKey ? 'Copy storage key for audit support' : 'No storage key recorded'}>
                    <span>
                      <IconButton
                        size="small"
                        disabled={!item.storageKey}
                        onClick={() => item.storageKey && navigator.clipboard?.writeText(item.storageKey)}
                        sx={{ width: 34, height: 34, borderRadius: 1, border: '1px solid', borderColor: appleColors.line }}
                      >
                        <ContentCopyOutlined fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : (
        <EmptyState label="No scanner evidence matches this filter yet." />
      )}
    </Box>
  );
}
