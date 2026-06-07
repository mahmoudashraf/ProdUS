'use client';

import { Box, Stack, Typography } from '@mui/material';

import { StatusChip, formatLabel } from './PlatformComponents';
import { ScannerImportRun } from './types';

type ScannerProofImportSummaryPanelProps = {
  imports: ScannerImportRun[];
};

export default function ScannerProofImportSummaryPanel({
  imports,
}: ScannerProofImportSummaryPanelProps) {
  if (!imports.length) return null;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        gap: 1,
      }}
    >
      {imports.slice(0, 4).map(importRun => (
        <Box
          key={importRun.id}
          sx={{
            p: 1.25,
            borderRadius: 1,
            border: '1px solid',
            borderColor: '#e5edf7',
            bgcolor: '#fff',
          }}
        >
          <Stack direction="row" justifyContent="space-between" spacing={1}>
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              {formatLabel(importRun.provider)}
            </Typography>
            <StatusChip
              label={importRun.status}
              color={
                importRun.status === 'COMPLETED'
                  ? 'success'
                  : importRun.status === 'FAILED'
                    ? 'error'
                    : 'warning'
              }
            />
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            {importRun.importedCount} findings imported / {formatLabel(importRun.importMethod)}
          </Typography>
          {importRun.externalReference && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {importRun.externalReference}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}
