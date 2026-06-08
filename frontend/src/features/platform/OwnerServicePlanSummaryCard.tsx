'use client';

import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  ProgressRing,
  appleColors,
} from './PlatformComponents';
import {
  ownerServicePackageScore,
  ownerServicePlanStatusAccent,
} from './ownerServicePlanPresentation';
import type {
  PackageInstance,
  PackageModule,
} from './types';

interface OwnerServicePlanSummaryCardProps {
  selectedPackage: PackageInstance;
  packageModules: PackageModule[];
  isLoading: boolean;
}

export default function OwnerServicePlanSummaryCard({
  selectedPackage,
  packageModules,
  isLoading,
}: OwnerServicePlanSummaryCardProps) {
  const requiredCount = packageModules.filter(module => module.required).length;
  const proofGateCount = packageModules.filter(module => module.acceptanceCriteria || module.serviceModule.acceptanceCriteria).length;

  return (
    <Stack spacing={2}>
      {isLoading && <LinearProgress sx={{ borderRadius: 999 }} />}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h3">{selectedPackage.name}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.7 }}>
            {selectedPackage.summary || 'A scoped service path for moving this product from diagnosis into delivery.'}
          </Typography>
        </Box>
        <ProgressRing
          value={ownerServicePackageScore(selectedPackage, packageModules)}
          color={ownerServicePlanStatusAccent(selectedPackage.status)}
          label="confidence"
        />
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
        {[
          { label: 'Services in plan', value: String(packageModules.length), accent: appleColors.purple },
          { label: 'Required first', value: String(requiredCount), accent: appleColors.amber },
          { label: 'Proof gates', value: String(proofGateCount || packageModules.length), accent: appleColors.green },
        ].map(item => (
          <Box key={item.label} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: `${item.accent}32`, bgcolor: '#fff' }}>
            <Typography variant="caption" color="text.secondary">{item.label}</Typography>
            <Typography sx={{ mt: 0.35, fontWeight: 950, color: item.accent }}>{item.value}</Typography>
          </Box>
        ))}
      </Box>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <PastelChip label={`${requiredCount || packageModules.length} must-review services`} accent={appleColors.amber} bg="#fff4dc" />
        <PastelChip label={`${proofGateCount || packageModules.length} acceptance checks`} accent={appleColors.green} bg="#e7f8ee" />
      </Stack>
    </Stack>
  );
}
