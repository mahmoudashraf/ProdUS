'use client';

import { Box, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  SectionTitle,
  StatusChip,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { severityAccent } from './ownerFindingPresentation';
import type { ScannerToolCoverage } from './types';

interface ScannerCoverageGridProps {
  tools: ScannerToolCoverage[];
  latestCoveredTools: number;
  totalTools: number;
  latestMappedToolFindings: number;
  unavailableScannerTools: number;
}

const shortDateTime = (value?: string) => {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
};

const scannerCoverageAccent = (coverage?: ScannerToolCoverage) => {
  if (!coverage) return appleColors.muted;
  if (!coverage.enabled || !coverage.executableAvailable || coverage.latestStatus === 'FAILED') return appleColors.red;
  if (coverage.latestStatus === 'COMPLETED') return appleColors.green;
  if (coverage.latestStatus === 'RUNNING' || coverage.latestStatus === 'QUEUED') return appleColors.amber;
  if (!coverage.applicable) return appleColors.muted;
  return appleColors.blue;
};

const scannerCoverageStatusColor = (coverage?: ScannerToolCoverage): 'default' | 'success' | 'error' | 'warning' | 'primary' => {
  if (!coverage) return 'default';
  if (!coverage.enabled || !coverage.executableAvailable || coverage.latestStatus === 'FAILED') return 'error';
  if (coverage.latestStatus === 'COMPLETED') return 'success';
  if (coverage.latestStatus === 'RUNNING' || coverage.latestStatus === 'QUEUED') return 'warning';
  if (coverage.applicable) return 'primary';
  return 'default';
};

const scannerCoverageStatusLabel = (coverage?: ScannerToolCoverage) => {
  if (!coverage) return 'Not checked';
  if (!coverage.enabled) return 'Off';
  if (!coverage.executableAvailable) return 'Unavailable';
  if (coverage.latestStatus === 'COMPLETED') return 'Complete';
  if (coverage.latestStatus === 'FAILED') return 'Needs retry';
  if (coverage.latestStatus === 'RUNNING') return 'Running';
  if (coverage.latestStatus === 'QUEUED') return 'Queued';
  if (coverage.applicable) return 'Ready';
  return 'Needs target';
};

export default function ScannerCoverageGrid({
  tools,
  latestCoveredTools,
  totalTools,
  latestMappedToolFindings,
  unavailableScannerTools,
}: ScannerCoverageGridProps) {
  if (!tools.length) return null;

  return (
    <Box sx={{ mb: 2, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, p: 1.5, bgcolor: '#fff' }}>
      <SectionTitle
        title="Scanner suite status"
        action={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <PastelChip
              label={`${latestCoveredTools}/${totalTools} latest`}
              accent={latestCoveredTools === totalTools ? appleColors.green : appleColors.amber}
              bg={latestCoveredTools === totalTools ? '#e7f8ee' : '#fff4dc'}
            />
            <PastelChip label={`${latestMappedToolFindings} risks linked`} accent={latestMappedToolFindings ? appleColors.purple : appleColors.muted} />
            {unavailableScannerTools > 0 && <PastelChip label={`${unavailableScannerTools} unavailable`} accent={appleColors.red} bg="#fff1f2" />}
          </Stack>
        }
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(5, minmax(0, 1fr))' }, gap: 1 }}>
        {tools.map((tool) => {
          const accent = scannerCoverageAccent(tool);
          const statusLabel = scannerCoverageStatusLabel(tool);
          return (
            <Box
              key={tool.toolKey}
              sx={{
                p: 1.1,
                borderRadius: 1,
                border: '1px solid',
                borderColor: `${accent}35`,
                bgcolor: tool.latestStatus === 'COMPLETED' ? '#fbfffd' : '#fbfdff',
                minHeight: 132,
              }}
            >
              <Stack spacing={0.9} sx={{ height: '100%' }}>
                <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 950 }} noWrap>
                      {tool.displayName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {formatLabel(tool.depth)} / {formatLabel(tool.targetType)}
                    </Typography>
                  </Box>
                  <StatusChip label={statusLabel} color={scannerCoverageStatusColor(tool)} />
                </Stack>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  <PastelChip label={`${tool.normalizedCount || 0} risks`} accent={tool.normalizedCount ? severityAccent('HIGH') : appleColors.green} bg={tool.normalizedCount ? '#fff1f2' : '#e7f8ee'} />
                  <PastelChip label={`${tool.mappedFindingCount || 0} linked`} accent={tool.mappedFindingCount ? appleColors.purple : appleColors.muted} />
                </Stack>
                <Typography
                  variant="caption"
                  color={tool.latestErrorSummary ? 'error' : 'text.secondary'}
                  sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.35 }}
                >
                  {tool.latestErrorSummary || (tool.latestCompletedAt ? `Latest ${shortDateTime(tool.latestCompletedAt)}` : tool.applicabilityReason || 'Awaiting first run.')}
                </Typography>
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
