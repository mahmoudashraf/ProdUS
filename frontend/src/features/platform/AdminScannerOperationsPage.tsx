'use client';

import { CancelOutlined, RefreshOutlined, ReplayOutlined, SecurityOutlined } from '@mui/icons-material';
import { Alert, Box, Button, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getJson, postJson } from './api';
import { EmptyState, MetricTile, PageHeader, PastelChip, QueryState, StatusChip, Surface, appleColors, formatLabel } from './PlatformComponents';
import { ScanRun, ScannerAdminHealth } from './types';

export default function AdminScannerOperationsPage() {
  const queryClient = useQueryClient();
  const scannerHealth = useQuery({
    queryKey: ['scanner-admin-health'],
    queryFn: () => getJson<ScannerAdminHealth>('/scanner/admin/health'),
    refetchInterval: 10000,
  });
  const rescanRun = useMutation({
    mutationFn: (runId: string) => postJson<ScanRun, { reason: string }>(`/scanner/runs/${runId}/rescan`, { reason: 'Admin requested scanner retry from operations health.' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scanner-admin-health'] });
    },
  });
  const cancelRun = useMutation({
    mutationFn: (runId: string) => postJson<ScanRun, { reason: string }>(`/scanner/runs/${runId}/cancel`, { reason: 'Admin canceled scanner run from operations health.' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scanner-admin-health'] });
    },
  });

  const health = scannerHealth.data;
  const unavailableTools = health?.tools.filter((tool) => tool.enabled && !tool.executableAvailable) || [];

  return (
    <>
      <PageHeader
        title="Scanner Operations"
        description="Monitor scanner worker readiness, queued jobs, executable availability, and production evidence-source health."
        action={
          <Button
            variant="outlined"
            startIcon={<RefreshOutlined />}
            onClick={() => scannerHealth.refetch()}
            disabled={scannerHealth.isFetching}
            sx={{ minHeight: 42 }}
          >
            Refresh
          </Button>
        }
      />
      <QueryState isLoading={scannerHealth.isLoading} error={scannerHealth.error} />

      {health ? (
        <Stack spacing={2}>
          {(scannerHealth.isFetching || rescanRun.isPending || cancelRun.isPending) && <LinearProgress sx={{ borderRadius: 999 }} />}
          {unavailableTools.length ? (
            <Alert severity="warning" sx={{ borderRadius: 1 }}>
              {unavailableTools.length} enabled scanner executables are not available on this host. Runs using those tools will fail honestly until the scanner image or PATH is corrected.
            </Alert>
          ) : (
            <Alert severity="success" sx={{ borderRadius: 1 }}>
              Enabled scanner executables are available on this host.
            </Alert>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5 }}>
            <MetricTile label="Worker" value={health.workerEnabled ? 'On' : 'Off'} detail="Execution process" accent={health.workerEnabled ? appleColors.green : appleColors.red} icon={<SecurityOutlined />} />
            <MetricTile label="Scheduler" value={health.schedulerEnabled ? 'On' : 'Off'} detail="DB job polling" accent={health.schedulerEnabled ? appleColors.green : appleColors.amber} icon={<SecurityOutlined />} />
            <MetricTile label="Queued jobs" value={health.queuedJobs} detail="Waiting for worker" accent={health.queuedJobs ? appleColors.amber : appleColors.green} icon={<SecurityOutlined />} />
            <MetricTile label="Running jobs" value={health.runningJobs} detail="Currently executing" accent={health.runningJobs ? appleColors.purple : appleColors.cyan} icon={<SecurityOutlined />} />
          </Box>

          <Surface>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Typography variant="h4">Scanner Tool Pack</Typography>
              <PastelChip label={`${health.tools.length} configured tools`} accent={appleColors.purple} />
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
              {health.tools.map((tool) => (
                <Box key={tool.key} sx={{ p: 1.5, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fff' }}>
                  <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900 }}>{tool.displayName || tool.key}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tool.executable || 'No executable configured'} · {formatLabel(tool.targetType)} · {tool.timeoutSeconds}s
                      </Typography>
                    </Box>
                    <StatusChip
                      label={tool.enabled ? (tool.executableAvailable ? 'Ready' : 'Missing') : 'Disabled'}
                      color={tool.enabled && tool.executableAvailable ? 'success' : tool.enabled ? 'error' : 'default'}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                    <PastelChip label={tool.requiresIac ? 'IaC gated' : 'Always eligible'} accent={tool.requiresIac ? appleColors.amber : appleColors.green} bg={tool.requiresIac ? '#fff4dc' : '#e7f8ee'} />
                    <PastelChip label={tool.key} accent={appleColors.cyan} bg="#e8f8ff" />
                  </Stack>
                </Box>
              ))}
            </Box>
          </Surface>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 2 }}>
            <Surface>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography variant="h4">Recent Scanner Jobs</Typography>
                <PastelChip label={`${health.recentJobs.length} recent`} accent={appleColors.cyan} bg="#e4f9fd" />
              </Stack>
              {health.recentJobs.length ? (
                <Stack spacing={1}>
                  {health.recentJobs.map((job) => {
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
                                  disabled={!canRetry || rescanRun.isPending}
                                  onClick={() => run && rescanRun.mutate(run.id)}
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
                                  disabled={!canCancel || cancelRun.isPending}
                                  onClick={() => run && cancelRun.mutate(run.id)}
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

            <Surface>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography variant="h4">External Imports</Typography>
                <PastelChip label={`${health.recentImports.length} recent`} accent={appleColors.purple} />
              </Stack>
              {health.recentImports.length ? (
                <Stack spacing={1}>
                  {health.recentImports.map((importRun) => (
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
          </Box>
        </Stack>
      ) : (
        <EmptyState label="Scanner operations health is not available." />
      )}
    </>
  );
}
