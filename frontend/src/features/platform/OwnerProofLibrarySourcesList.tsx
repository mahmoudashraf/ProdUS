'use client';

import { Box, Stack, Typography } from '@mui/material';
import {
  EmptyState,
  StatusChip,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { ScanSource } from './types';

export default function OwnerProofLibrarySourcesList({
  sources,
}: {
  sources: ScanSource[];
}) {
  return (
    <Stack spacing={1.25}>
      <Typography sx={{ fontWeight: 950 }}>Connected sources</Typography>
      {sources.length ? sources.map((source) => (
        <Box key={source.id} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: source.authorizationStatus === 'AUTHORIZED' ? '#c8f2da' : appleColors.line, bgcolor: '#fff' }}>
          <Stack direction="row" spacing={1} justifyContent="space-between">
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>{source.displayName}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>{source.externalReference || formatLabel(source.providerType)}</Typography>
            </Box>
            <StatusChip label={formatLabel(source.authorizationStatus)} color={source.authorizationStatus === 'AUTHORIZED' ? 'success' : 'warning'} />
          </Stack>
        </Box>
      )) : (
        <EmptyState label="No source is connected yet." />
      )}
    </Stack>
  );
}

