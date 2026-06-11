'use client';

import { CancelOutlined, RefreshOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';

import { StatusChip, formatLabel } from './PlatformComponents';
import { ScanRun } from './types';

type ScannerProofRecentRunsPanelProps = {
  recentRuns: ScanRun[];
  activeScanRun: ScanRun | undefined;
  isCanceling: boolean;
  isRescanning: boolean;
  onCancelRun: (runId: string) => void;
  onRescanRun: (runId: string) => void;
};

export default function ScannerProofRecentRunsPanel({
  recentRuns,
  activeScanRun,
  isCanceling,
  isRescanning,
  onCancelRun,
  onRescanRun,
}: ScannerProofRecentRunsPanelProps) {
  if (!recentRuns.length) return null;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        gap: 1,
      }}
    >
      {recentRuns.slice(0, 4).map(run => (
        <Box
          key={run.id}
          sx={{
            p: 1.25,
            borderRadius: 1,
            border: '1px solid',
            borderColor: '#e5edf7',
            bgcolor: '#fbfdff',
          }}
        >
          <Stack direction="row" spacing={1} justifyContent="space-between">
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              {formatLabel(run.depth)}
            </Typography>
            <StatusChip
              label={run.status}
              color={
                run.status === 'COMPLETED'
                  ? 'success'
                  : run.status === 'FAILED'
                    ? 'error'
                    : 'default'
              }
            />
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            {(run.toolRuns || [])
              .map(
                tool => `${tool.toolName}: ${formatLabel(tool.status)} / ${tool.normalizedCount}`
              )
              .join(' / ') || 'No check results'}
          </Typography>
          {run.failureSummary && (
            <Typography
              variant="caption"
              color="error"
              sx={{ display: 'block', mt: 0.75, lineHeight: 1.4 }}
            >
              {run.failureSummary}
            </Typography>
          )}
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {run.status === 'QUEUED' || run.status === 'RUNNING' ? (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<CancelOutlined />}
                disabled={isCanceling}
                onClick={() => onCancelRun(run.id)}
              >
                Cancel
              </Button>
            ) : (
              <Button
                size="small"
                variant="outlined"
                startIcon={<RefreshOutlined />}
                disabled={!!activeScanRun || isRescanning}
                onClick={() => onRescanRun(run.id)}
              >
                Run again
              </Button>
            )}
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
