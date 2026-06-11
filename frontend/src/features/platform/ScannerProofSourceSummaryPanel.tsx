'use client';

import { Box, Button, Checkbox, FormControlLabel, Stack, Tooltip, Typography } from '@mui/material';

import { EmptyState, PastelChip, StatusChip, appleColors, formatLabel } from './PlatformComponents';
import { ScanSource } from './types';

type ScannerProofSourceSummaryPanelProps = {
  sources: ScanSource[];
  deleteArtifactsOnDisconnect: boolean;
  isDisconnecting: boolean;
  onDeleteArtifactsChange: (value: boolean) => void;
  onDisconnectSource: (sourceId: string) => void;
};

export default function ScannerProofSourceSummaryPanel({
  sources,
  deleteArtifactsOnDisconnect,
  isDisconnecting,
  onDeleteArtifactsChange,
  onDisconnectSource,
}: ScannerProofSourceSummaryPanelProps) {
  if (!sources.length) {
    return (
      <EmptyState label="No scan source exists yet. Connect a source, upload CI proof, or import a scanner result to start." />
    );
  }

  return (
    <Stack spacing={1}>
      <FormControlLabel
        control={
          <Checkbox
            checked={deleteArtifactsOnDisconnect}
            onChange={event => onDeleteArtifactsChange(event.target.checked)}
          />
        }
        label={
          <Typography variant="body2" color="text.secondary">
            Also delete saved proof files when disconnecting a source.
          </Typography>
        }
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 1,
        }}
      >
        {sources.slice(0, 5).map(source => (
          <Stack
            key={source.id}
            spacing={1}
            sx={{
              border: 1,
              borderColor:
                source.authorizationStatus === 'AUTHORIZED' ? '#c8f2da' : appleColors.line,
              borderRadius: 1,
              p: 1.25,
              bgcolor: source.authorizationStatus === 'AUTHORIZED' ? '#fbfffd' : '#fff',
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>
                  {source.displayName}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {source.externalReference || formatLabel(source.providerType)}
                </Typography>
              </Box>
              <StatusChip
                label={source.authorizationStatus}
                color={
                  source.authorizationStatus === 'AUTHORIZED'
                    ? 'success'
                    : source.authorizationStatus === 'FAILED'
                      ? 'error'
                      : 'warning'
                }
              />
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              <PastelChip
                label={formatLabel(source.providerType)}
                accent={appleColors.cyan}
                bg="#e4f9fd"
              />
              {source.scopeNote && <PastelChip label="Scoped" accent={appleColors.purple} />}
            </Stack>
            <Tooltip
              title={
                source.authorizationStatus === 'AUTHORIZED'
                  ? 'Disconnect this source from future scans'
                  : 'Only authorized sources can be disconnected'
              }
            >
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  color={deleteArtifactsOnDisconnect ? 'error' : 'inherit'}
                  disabled={source.authorizationStatus !== 'AUTHORIZED' || isDisconnecting}
                  onClick={() => onDisconnectSource(source.id)}
                  sx={{ minHeight: 34, alignSelf: 'flex-start' }}
                >
                  {deleteArtifactsOnDisconnect ? 'Disconnect and delete proof' : 'Disconnect'}
                </Button>
              </span>
            </Tooltip>
          </Stack>
        ))}
      </Box>
    </Stack>
  );
}
