'use client';

import { RefreshOutlined } from '@mui/icons-material';
import { Box, Button, LinearProgress, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getJson, postJson } from './api';
import {
  ExternalScannerImportsPanel,
  RecentScannerJobsPanel,
  ScannerOperationsAvailabilityAlert,
  ScannerOperationsMetricGrid,
  ScannerProviderConnectorsPanel,
  ScannerStorageGovernancePanel,
  ScannerToolPackPanel,
} from './AdminScannerOperationsPanels';
import { EmptyState, PageHeader, QueryState } from './PlatformComponents';
import type { ScanRun, ScannerAdminHealth, ScannerConnectorInstallation, ScannerRetentionRun } from './types';

export default function AdminScannerOperationsPage() {
  const queryClient = useQueryClient();
  const scannerHealth = useQuery({
    queryKey: ['scanner-admin-health'],
    queryFn: () => getJson<ScannerAdminHealth>('/scanner/admin/health'),
    refetchInterval: 10000,
  });
  const connectorInstallations = useQuery({
    queryKey: ['scanner-connectors-admin'],
    queryFn: () => getJson<ScannerConnectorInstallation[]>('/scanner/connectors'),
  });
  const retentionRun = useMutation({
    mutationFn: (dryRun: boolean) => postJson<ScannerRetentionRun, { dryRun: boolean }>('/scanner/admin/storage/retention', { dryRun }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scanner-admin-health'] });
    },
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
      <QueryState isLoading={scannerHealth.isLoading || connectorInstallations.isLoading} error={scannerHealth.error || connectorInstallations.error || retentionRun.error} />

      {health ? (
        <Stack spacing={2}>
          {(scannerHealth.isFetching || connectorInstallations.isFetching || rescanRun.isPending || cancelRun.isPending || retentionRun.isPending) && <LinearProgress sx={{ borderRadius: 999 }} />}
          <ScannerOperationsAvailabilityAlert unavailableTools={unavailableTools} />
          <ScannerOperationsMetricGrid health={health} />
          <ScannerToolPackPanel health={health} />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 2 }}>
            <ScannerProviderConnectorsPanel installations={connectorInstallations.data || []} />
            <ScannerStorageGovernancePanel
              isPending={retentionRun.isPending}
              retentionRun={retentionRun.data}
              onRunRetention={(dryRun) => retentionRun.mutate(dryRun)}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 2 }}>
            <RecentScannerJobsPanel
              isCanceling={cancelRun.isPending}
              isRetrying={rescanRun.isPending}
              jobs={health.recentJobs}
              onCancel={(runId) => cancelRun.mutate(runId)}
              onRetry={(runId) => rescanRun.mutate(runId)}
            />
            <ExternalScannerImportsPanel imports={health.recentImports} />
          </Box>
        </Stack>
      ) : (
        <EmptyState label="Scanner operations health is not available." />
      )}
    </>
  );
}
