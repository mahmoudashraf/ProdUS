'use client';

import { CloudDoneOutlined, DeleteSweepOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  EmptyState,
  PastelChip,
  StatusChip,
  Surface,
  appleColors,
} from './PlatformComponents';
import type {
  ScannerConnectorInstallation,
  ScannerRetentionRun,
} from './types';

export function ScannerProviderConnectorsPanel({
  installations,
}: {
  installations: ScannerConnectorInstallation[];
}) {
  return (
    <Surface>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="h4">Provider Connectors</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            GitHub App and GitLab installations attached to scanner evidence sources.
          </Typography>
        </Box>
        <PastelChip label={`${installations.length} installed`} accent={appleColors.cyan} bg="#e4f9fd" />
      </Stack>
      {installations.length ? (
        <Stack spacing={1}>
          {installations.slice(0, 6).map((installation) => (
            <Box key={installation.id} sx={{ p: 1.25, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fff' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <CloudDoneOutlined sx={{ color: appleColors.purple }} fontSize="small" />
                    <Typography sx={{ fontWeight: 900 }}>{installation.accountLogin || installation.externalInstallationId}</Typography>
                    <PastelChip label={installation.providerType} accent={appleColors.purple} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Installation {installation.externalInstallationId}
                    {installation.lastWebhookAt ? ` · Last webhook ${installation.lastWebhookEvent || 'event'}` : ' · Awaiting first webhook'}
                  </Typography>
                </Box>
                <StatusChip label={installation.status} color={installation.status === 'ACTIVE' ? 'success' : installation.status === 'FAILED' ? 'error' : 'warning'} />
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : (
        <EmptyState label="No GitHub or GitLab scanner connector installations have been recorded yet." />
      )}
    </Surface>
  );
}

export function ScannerStorageGovernancePanel({
  isPending,
  retentionRun,
  onRunRetention,
}: {
  isPending: boolean;
  retentionRun: ScannerRetentionRun | undefined;
  onRunRetention: (dryRun: boolean) => void;
}) {
  return (
    <Surface>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="h4">Storage Governance</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Dry-run retention before deleting raw scanner artifacts from private object storage.
          </Typography>
        </Box>
        <DeleteSweepOutlined sx={{ color: appleColors.amber }} />
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1.5 }}>
        <Button
          variant="outlined"
          startIcon={<DeleteSweepOutlined />}
          onClick={() => onRunRetention(true)}
          disabled={isPending}
          sx={{ minHeight: 42 }}
        >
          Dry Run Retention
        </Button>
        <Button
          variant="contained"
          color="warning"
          startIcon={<DeleteSweepOutlined />}
          onClick={() => onRunRetention(false)}
          disabled={isPending}
          sx={{ minHeight: 42 }}
        >
          Execute Cleanup
        </Button>
      </Stack>
      {retentionRun ? (
        <Box sx={{ p: 1.25, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fff' }}>
          <Stack direction="row" justifyContent="space-between" spacing={1}>
            <Typography sx={{ fontWeight: 900 }}>{retentionRun.dryRun ? 'Dry run complete' : 'Cleanup complete'}</Typography>
            <PastelChip label={`${retentionRun.candidateCount} candidates`} accent={retentionRun.candidateCount ? appleColors.amber : appleColors.green} bg={retentionRun.candidateCount ? '#fff4dc' : '#e7f8ee'} />
          </Stack>
          {retentionRun.candidates.slice(0, 5).map((candidate) => (
            <Typography key={`${candidate.sourceType}-${candidate.sourceId}-${candidate.storageKey}`} variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
              {candidate.sourceType} · {candidate.storageKey}
            </Typography>
          ))}
        </Box>
      ) : (
        <EmptyState label="Run retention in dry-run mode to preview old raw artifacts, imports, and evidence blobs." />
      )}
    </Surface>
  );
}
