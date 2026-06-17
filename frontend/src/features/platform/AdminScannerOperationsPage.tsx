'use client';

import { RefreshOutlined } from '@mui/icons-material';
import { Box, Button, LinearProgress, Stack } from '@mui/material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
import { OwnerWorkspaceJourneyNav, WorkspaceBreadcrumbs, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import { EmptyState, PageHeader, PastelChip, QueryState, SectionTitle, Surface, appleColors } from './PlatformComponents';
import type { ScanRun, ScannerAdminHealth, ScannerConnectorInstallation, ScannerRetentionRun } from './types';

type ScannerOperationsView = 'tools' | 'storage' | 'runs';

const isScannerOperationsView = (value: string | null): value is ScannerOperationsView =>
  value === 'tools' || value === 'storage' || value === 'runs';

const scannerOperationsViewLabel: Record<ScannerOperationsView, string> = {
  tools: 'Tool Pack',
  storage: 'Storage',
  runs: 'Runs And Imports',
};

export default function AdminScannerOperationsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams?.toString() || '';
  const viewParam = searchParams?.get('view') || null;
  const activeView = isScannerOperationsView(viewParam) ? viewParam : null;
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
  const unavailableTools = health?.toolAvailabilityAuthoritative ? health.tools.filter((tool) => tool.enabled && !tool.executableAvailable) : [];
  const connectorList = connectorInstallations.data || [];
  const isBusy = scannerHealth.isFetching || connectorInstallations.isFetching || rescanRun.isPending || cancelRun.isPending || retentionRun.isPending;

  const openView = (view: ScannerOperationsView) => {
    const next = new URLSearchParams(searchParamString);
    next.set('view', view);
    router.push(`${pathname || '/admin/scanners'}?${next.toString()}`, { scroll: false });
  };

  const openHub = () => {
    const next = new URLSearchParams(searchParamString);
    next.delete('view');
    const query = next.toString();
    router.push(query ? `${pathname || '/admin/scanners'}?${query}` : (pathname || '/admin/scanners'), { scroll: false });
  };

  const navigationItems = health ? buildScannerOperationsItems(health, connectorList.length) : [];

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
      <QueryState isLoading={scannerHealth.isLoading || connectorInstallations.isLoading} error={scannerHealth.error || connectorInstallations.error || retentionRun.error || rescanRun.error || cancelRun.error} />

      {health ? (
        <Stack spacing={2}>
          {isBusy && <LinearProgress sx={{ borderRadius: 999 }} />}

          {!activeView && (
            <>
              <ScannerOperationsAvailabilityAlert health={health} unavailableTools={unavailableTools} />
              <ScannerOperationsMetricGrid health={health} />
              <Surface>
                <SectionTitle title="Choose Operations Area" action={<PastelChip label="One operational task at a time" accent={appleColors.purple} />} />
                <OwnerWorkspaceJourneyNav
                  label="Scanner operations sections"
                  value={null}
                  items={navigationItems}
                  maxColumns={3}
                  onChange={openView}
                />
              </Surface>
            </>
          )}

          {activeView && (
            <WorkspaceBreadcrumbs
              items={[
                { label: 'Scanner Operations', onClick: openHub },
                { label: scannerOperationsViewLabel[activeView] },
              ]}
              backLabel="Operations hub"
              onBack={openHub}
            />
          )}

          {activeView === 'tools' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.25fr) minmax(360px, 0.75fr)' }, gap: 2, alignItems: 'start' }}>
              <ScannerToolPackPanel health={health} />
              <ScannerProviderConnectorsPanel installations={connectorList} />
            </Box>
          )}

          {activeView === 'storage' && (
            <ScannerStorageGovernancePanel
              isPending={retentionRun.isPending}
              retentionRun={retentionRun.data}
              onRunRetention={(dryRun) => retentionRun.mutate(dryRun)}
            />
          )}

          {activeView === 'runs' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) minmax(0, 1fr)' }, gap: 2, alignItems: 'start' }}>
              <RecentScannerJobsPanel
                isCanceling={cancelRun.isPending}
                isRetrying={rescanRun.isPending}
                jobs={health.recentJobs}
                onCancel={(runId) => cancelRun.mutate(runId)}
                onRetry={(runId) => rescanRun.mutate(runId)}
              />
              <ExternalScannerImportsPanel imports={health.recentImports} />
            </Box>
          )}
        </Stack>
      ) : (
        <EmptyState label="Scanner operations health is not available." />
      )}
    </>
  );
}

function buildScannerOperationsItems(
  health: ScannerAdminHealth,
  connectorCount: number
): JourneyStepItem<ScannerOperationsView>[] {
  return [
    {
      value: 'tools',
      label: 'Tool Pack',
      detail: 'Executable readiness and provider connections.',
      accent: appleColors.purple,
      meta: (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <PastelChip label={`${health.tools.length} tools`} accent={appleColors.purple} />
          <PastelChip label={`${connectorCount} connectors`} accent={appleColors.cyan} bg="#e4f9fd" />
        </Stack>
      ),
    },
    {
      value: 'storage',
      label: 'Storage',
      detail: 'Raw artifact retention and cleanup preview.',
      accent: appleColors.amber,
      meta: <PastelChip label="Retention" accent={appleColors.amber} bg="#fff4dc" />,
    },
    {
      value: 'runs',
      label: 'Runs And Imports',
      detail: 'Recent scanner jobs, retries, cancels, and external imports.',
      accent: appleColors.cyan,
      meta: (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <PastelChip label={`${health.recentJobs.length} jobs`} accent={appleColors.cyan} bg="#e4f9fd" />
          <PastelChip label={`${health.recentImports.length} imports`} accent={appleColors.purple} />
        </Stack>
      ),
    },
  ];
}
