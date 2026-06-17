'use client';

import { SecurityOutlined } from '@mui/icons-material';
import { Alert, Box, Stack, Typography } from '@mui/material';
import {
  MetricTile,
  PastelChip,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { ScannerAdminHealth } from './types';

export function ScannerOperationsAvailabilityAlert({
  unavailableTools,
  health,
}: {
  unavailableTools: ScannerAdminHealth['tools'];
  health: ScannerAdminHealth;
}) {
  if (!health.toolAvailabilityAuthoritative) {
    return (
      <Alert severity="info" sx={{ borderRadius: 1 }}>
        Scanner execution runs in the separate scanner-worker service. Tool availability is checked in that worker image, not in the API container.
      </Alert>
    );
  }
  return unavailableTools.length ? (
    <Alert severity="warning" sx={{ borderRadius: 1 }}>
      {unavailableTools.length} enabled scanner executables are not available on this host. Runs using those tools will fail honestly until the scanner image or PATH is corrected.
    </Alert>
  ) : (
    <Alert severity="success" sx={{ borderRadius: 1 }}>
      Enabled scanner executables are available on this host.
    </Alert>
  );
}

export function ScannerOperationsMetricGrid({ health }: { health: ScannerAdminHealth }) {
  const workerValue = health.workerEnabled ? 'On' : health.separateWorkerEnabled ? 'Separate' : 'Off';
  const workerDetail = health.workerEnabled ? 'This runtime executes jobs' : health.separateWorkerEnabled ? 'Scanner-worker service' : 'No execution worker';
  const workerAccent = health.workerEnabled || health.separateWorkerEnabled ? appleColors.green : appleColors.red;
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5 }}>
      <MetricTile label="Worker" value={workerValue} detail={workerDetail} accent={workerAccent} icon={<SecurityOutlined />} />
      <MetricTile label="Scheduler" value={health.schedulerEnabled ? 'On' : 'Off'} detail="DB job polling" accent={health.schedulerEnabled ? appleColors.green : appleColors.amber} icon={<SecurityOutlined />} />
      <MetricTile label="Queued jobs" value={health.queuedJobs} detail="Waiting for worker" accent={health.queuedJobs ? appleColors.amber : appleColors.green} icon={<SecurityOutlined />} />
      <MetricTile label="Running jobs" value={health.runningJobs} detail="Currently executing" accent={health.runningJobs ? appleColors.purple : appleColors.cyan} icon={<SecurityOutlined />} />
    </Box>
  );
}

export function ScannerToolPackPanel({ health }: { health: ScannerAdminHealth }) {
  return (
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
  );
}
