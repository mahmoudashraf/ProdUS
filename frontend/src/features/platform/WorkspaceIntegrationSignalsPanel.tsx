'use client';

import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import {
  PastelChip,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { IntegrationConnection } from './types';

const integrationProviderOptions: IntegrationConnection['providerType'][] = [
  'GITHUB',
  'CI_CD',
  'DEPENDENCY_SCAN',
  'SECRETS_SCAN',
  'DEPLOYMENT',
  'MONITORING',
  'DATABASE',
  'ISSUE_TRACKER',
  'SUPPORT_TOOL',
  'OTHER',
];

interface WorkspaceIntegrationSignalsPanelProps {
  canCoordinate: boolean;
  integrationList: IntegrationConnection[];
  latestIntegration: IntegrationConnection | undefined;
  integrationProvider: IntegrationConnection['providerType'];
  isCreatingIntegration: boolean;
  isRecordingSignal: boolean;
  onIntegrationProviderChange: (provider: IntegrationConnection['providerType']) => void;
  onCreateIntegration: (providerType: IntegrationConnection['providerType']) => void;
  onRecordIntegrationSignal: (connectionId: string) => void;
}

export default function WorkspaceIntegrationSignalsPanel({
  canCoordinate,
  integrationList,
  latestIntegration,
  integrationProvider,
  isCreatingIntegration,
  isRecordingSignal,
  onIntegrationProviderChange,
  onCreateIntegration,
  onRecordIntegrationSignal,
}: WorkspaceIntegrationSignalsPanelProps) {
  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8fbff)' }}>
      <SectionTitle title="Integration Signals" action={<PastelChip label={`${integrationList.length} connected`} accent={appleColors.blue} bg="#eaf3ff" />} />
      <Stack spacing={1.25}>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
          Register workspace-scoped integrations and record readiness signals. These records are AI-ready context but no AI execution happens here.
        </Typography>
        {canCoordinate && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 1 }}>
            <TextField select size="small" label="Provider" value={integrationProvider} onChange={(event) => onIntegrationProviderChange(event.target.value as IntegrationConnection['providerType'])}>
              {integrationProviderOptions.map((provider) => <MenuItem key={provider} value={provider}>{formatLabel(provider)}</MenuItem>)}
            </TextField>
            <Button variant="outlined" onClick={() => onCreateIntegration(integrationProvider)} disabled={isCreatingIntegration}>
              Add
            </Button>
          </Box>
        )}
        <Stack spacing={1}>
          {integrationList.length ? integrationList.map((connection) => (
            <Box key={connection.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25, bgcolor: '#fff' }}>
              <Stack direction="row" spacing={1} justifyContent="space-between">
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 900 }}>{connection.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{formatLabel(connection.providerType)} · {formatLabel(connection.status)}</Typography>
                </Box>
                <StatusChip label={connection.status} color={connection.status === 'ACTIVE' ? 'success' : connection.status === 'NEEDS_ATTENTION' ? 'warning' : 'default'} />
              </Stack>
              {connection.signals.slice(0, 2).map((signal) => (
                <Typography key={signal.id} variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                  {formatLabel(signal.status)} · {signal.summary || signal.signalType}
                </Typography>
              ))}
            </Box>
          )) : <Typography variant="body2" color="text.secondary">No integration connections are registered yet.</Typography>}
        </Stack>
        {latestIntegration && canCoordinate && (
          <Button variant="outlined" onClick={() => onRecordIntegrationSignal(latestIntegration.id)} disabled={isRecordingSignal} sx={{ minHeight: 40 }}>
            Record signal
          </Button>
        )}
      </Stack>
    </Surface>
  );
}
