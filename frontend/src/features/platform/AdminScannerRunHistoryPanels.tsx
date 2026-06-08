'use client';

import { CancelOutlined, ReplayOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Tooltip, Typography } from '@mui/material';
import {
  EmptyState,
  PastelChip,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type {
  ScannerAdminHealth,
  ScannerJobHealth,
} from './types';

export function RecentScannerJobsPanel({
  isCanceling,
  isRetrying,
  jobs,
  onCancel,
  onRetry,
}: {
  isCanceling: boolean;
  isRetrying: boolean;
  jobs: ScannerJobHealth[];
  onCancel: (runId: string) => void;
  onRetry: (runId: string) => void;
}) {
  return (
    <Surface>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="h4">Recent Scanner Jobs</Typography>
        <PastelChip label={`${jobs.length} recent`} accent={appleColors.cyan} bg="#e4f9fd" />
      </Stack>
      {jobs.length ? (
        <Stack spacing={1}>
          {jobs.map((job) => {
            const run = job.scanRun;
            const canCancel = !!run && (run.status === 'QUEUED' || run.status === 'RUNNING');
            const canRetry = !!run && (run.status === 'FAILED' || run.status === 'CANCELED');
            return (
              <Box key={job.id} sx={{ p: 1.25, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fff' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                      <Typography sx={{ fontWeight: 900 }}>{run ? formatLabel(run.depth) : 'Scanner job'}</Typography>
                      <StatusChip label={job.status} color={job.status === 'FAILED' ? 'error' : job.status === 'COMPLETED' ? 'success' : 'warning'} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Attempts {job.attemptCount}/{job.maxAttempts} · Run {job.scanRunId?.slice(0, 8) || 'not linked'}
                    </Typography>
                    {(job.failureSummary || run?.failureSummary) && (
                      <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5, lineHeight: 1.45 }}>
                        {job.failureSummary || run?.failureSummary}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Tooltip title={canRetry ? 'Create a new scanner run from the failed run configuration' : 'Retry is available after a failed or canceled hosted run'}>
                      <span>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ReplayOutlined />}
                          disabled={!canRetry || isRetrying}
                          onClick={() => run && onRetry(run.id)}
                          sx={{ minHeight: 34 }}
                        >
                          Retry
                        </Button>
                      </span>
                    </Tooltip>
                    <Tooltip title={canCancel ? 'Cancel this active scanner run' : 'Only queued or running jobs can be canceled'}>
                      <span>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CancelOutlined />}
                          disabled={!canCancel || isCanceling}
                          onClick={() => run && onCancel(run.id)}
                          sx={{ minHeight: 34 }}
                        >
                          Cancel
                        </Button>
                      </span>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      ) : (
        <EmptyState label="No scanner jobs have been recorded yet." />
      )}
    </Surface>
  );
}

export function ExternalScannerImportsPanel({
  imports,
}: {
  imports: ScannerAdminHealth['recentImports'];
}) {
  return (
    <Surface>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="h4">External Imports</Typography>
        <PastelChip label={`${imports.length} recent`} accent={appleColors.purple} />
      </Stack>
      {imports.length ? (
        <Stack spacing={1}>
          {imports.map((importRun) => (
            <Box key={importRun.id} sx={{ p: 1.25, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: importRun.status === 'FAILED' ? '#fff7f8' : '#fff' }}>
              <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900 }}>{formatLabel(importRun.provider)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {importRun.importedCount} imported · {formatLabel(importRun.importMethod)} · {importRun.requestedByEmail}
                  </Typography>
                  {importRun.errorSummary && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5, lineHeight: 1.45 }}>
                      {importRun.errorSummary}
                    </Typography>
                  )}
                </Box>
                <StatusChip label={importRun.status} color={importRun.status === 'FAILED' ? 'error' : importRun.status === 'COMPLETED' ? 'success' : 'warning'} />
              </Stack>
              {importRun.status === 'FAILED' && (
                <Tooltip title="External import retry needs the customer-owned provider or CI system to replay the source payload. ProdUS keeps the failed import auditable but does not fabricate a retry payload.">
                  <span>
                    <Button size="small" variant="outlined" disabled sx={{ mt: 1, minHeight: 34 }}>
                      Awaiting replay
                    </Button>
                  </span>
                </Tooltip>
              )}
            </Box>
          ))}
        </Stack>
      ) : (
        <EmptyState label="No external scanner imports have been recorded yet." />
      )}
    </Surface>
  );
}
