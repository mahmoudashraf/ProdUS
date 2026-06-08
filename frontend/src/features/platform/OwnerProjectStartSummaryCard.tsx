'use client';

import { Box, Stack, Typography } from '@mui/material';
import { PastelChip, appleColors, formatLabel } from './PlatformComponents';
import type { ProductProfile, ProductizationCart } from './types';

interface OwnerProjectStartSummaryCardProps {
  product?: ProductProfile | undefined;
  readiness?: ProductizationCart['startReadiness'] | undefined;
  canStartWorkspace: boolean;
  blockers: number;
  serviceCount: number;
  talentCount: number;
}

export default function OwnerProjectStartSummaryCard({
  product,
  readiness,
  canStartWorkspace,
  blockers,
  serviceCount,
  talentCount,
}: OwnerProjectStartSummaryCardProps) {
  const statusAccent = canStartWorkspace ? appleColors.green : blockers ? appleColors.red : appleColors.amber;

  return (
    <Box sx={{ p: 1.5, borderRadius: 1, border: '1px solid', borderColor: `${statusAccent}30`, bgcolor: `${statusAccent}0d` }}>
      <Typography variant="body2" color="text.secondary">
        {product ? `Draft for ${product.name}` : 'Select a product before starting a workspace'}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
        <PastelChip label={`${serviceCount} services`} accent={appleColors.purple} />
        <PastelChip label={`${talentCount} teams / experts`} accent={appleColors.cyan} bg="#e4f9fd" />
        {readiness?.status && <PastelChip label={formatLabel(readiness.status)} accent={statusAccent} bg={`${statusAccent}12`} />}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.55 }}>
        {readiness?.summary || (canStartWorkspace ? 'This plan has enough scope to become a project workspace.' : 'Choose the services and delivery support that make the first workspace actionable.')}
      </Typography>
    </Box>
  );
}
