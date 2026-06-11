'use client';

import { Box, Stack, Typography } from '@mui/material';
import { PastelChip, appleColors } from './PlatformComponents';

export interface OwnerScannerProofSummary {
  lastScanLabel: string;
  completedChecks: number;
  totalChecks: number;
  openFindings: number;
  highRiskFindings: number;
  mappedFindings: number;
  hasCompletedRun: boolean;
}

export default function OwnerWorkspaceScannerProofAction({
  summary,
}: {
  summary: OwnerScannerProofSummary;
}) {
  const checkLabel = `${summary.completedChecks}/${summary.totalChecks} checks completed`;
  const findingLabel = summary.openFindings
    ? `${summary.openFindings} open findings`
    : summary.hasCompletedRun
      ? 'No open findings'
      : 'No completed scan yet';
  const mappedLabel = summary.mappedFindings
    ? `${summary.mappedFindings} mapped to product risks`
    : 'Mapping pending';

  return (
    <Box
      sx={{
        mt: 1.5,
        p: 1.35,
        borderRadius: 1,
        border: '1px solid',
        borderColor: `${appleColors.blue}2f`,
        bgcolor: '#fff',
      }}
    >
      <Typography variant="caption" color="text.secondary">
        Latest scan proof
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.35, fontWeight: 900, color: appleColors.ink }}>
        {summary.hasCompletedRun ? `Last scan ${summary.lastScanLabel}` : 'Run scanners before making a launch call'}
      </Typography>
      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 0.8 }}>
        <PastelChip
          label={checkLabel}
          accent={summary.completedChecks === summary.totalChecks ? appleColors.green : appleColors.amber}
          bg={summary.completedChecks === summary.totalChecks ? '#e7f8ee' : '#fff4dc'}
        />
        <PastelChip
          label={findingLabel}
          accent={summary.highRiskFindings ? appleColors.red : summary.openFindings ? appleColors.amber : appleColors.green}
          bg={summary.highRiskFindings ? '#fff1f2' : summary.openFindings ? '#fff4dc' : '#e7f8ee'}
        />
        <PastelChip
          label={mappedLabel}
          accent={summary.mappedFindings ? appleColors.purple : appleColors.muted}
          bg={summary.mappedFindings ? '#f1efff' : '#f3f4f6'}
        />
      </Stack>
    </Box>
  );
}
