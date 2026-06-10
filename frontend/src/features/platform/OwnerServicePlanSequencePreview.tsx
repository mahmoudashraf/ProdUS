'use client';

import NextLink from 'next/link';
import { OpenInNewOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  StatusChip,
  appleColors,
  categoryPalette,
} from './PlatformComponents';
import { PROJECT_START_PLAN_HREF } from './projectStartPlanLinks';
import type { PackageModule } from './types';

const moduleProofText = (module: PackageModule) =>
  module.acceptanceCriteria
  || module.serviceModule.acceptanceCriteria
  || module.deliverables
  || module.serviceModule.expectedDeliverables
  || 'Define the proof this service must produce before the owner accepts the work.';

interface OwnerServicePlanSequencePreviewProps {
  packageModules: PackageModule[];
}

export default function OwnerServicePlanSequencePreview({
  packageModules,
}: OwnerServicePlanSequencePreviewProps) {
  const acceptedCount = packageModules.filter(module => module.status === 'ACCEPTED').length;
  const visibleModules = packageModules.slice(0, 4);
  const remainingCount = Math.max(0, packageModules.length - visibleModules.length);

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 1 }}>
        <Box>
          <Typography sx={{ fontWeight: 950 }}>Delivery preview</Typography>
          <Typography variant="body2" color="text.secondary">
            The first services the owner should approve before workspace start.
          </Typography>
        </Box>
        <PastelChip label={`${acceptedCount}/${packageModules.length || 0} accepted`} accent={appleColors.green} bg="#e7f8ee" />
      </Stack>

      <Stack spacing={1}>
        {visibleModules.map((module, index) => {
          const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;

          return (
            <Box
              key={module.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '46px minmax(0, 1fr) auto' },
                gap: { xs: 1, md: 1.25 },
                alignItems: 'start',
                p: 1.35,
                borderRadius: 1,
                border: '1px solid',
                borderColor: module.status === 'BLOCKED' ? '#fecdd3' : `${palette.accent}30`,
                background: module.required ? palette.soft : '#fff',
              }}
            >
              <Box sx={{ width: 38, height: 38, borderRadius: 1, bgcolor: palette.bg, color: palette.accent, display: 'grid', placeItems: 'center', fontWeight: 950 }}>
                {index + 1}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
                  <Typography sx={{ fontWeight: 950, color: appleColors.ink }}>
                    {module.serviceModule.name}
                  </Typography>
                  {module.required && <PastelChip label="Required" accent={appleColors.amber} bg="#fff4dc" />}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.55 }}>
                  {module.serviceModule.ownerOutcome || module.rationale || module.serviceModule.description || 'Owner-visible service outcome.'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.65, lineHeight: 1.45 }}>
                  Proof: {moduleProofText(module)}
                </Typography>
              </Box>
              <StatusChip label={module.status} />
            </Box>
          );
        })}

        {remainingCount > 0 && (
          <Box sx={{ p: 1.25, border: '1px dashed', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#f8fafc' }}>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
              {remainingCount} more services are included in the full delivery sequence.
            </Typography>
            <Button component={NextLink} href={PROJECT_START_PLAN_HREF} size="small" variant="text" endIcon={<OpenInNewOutlined />} sx={{ mt: 0.5, minHeight: 32, px: 0 }}>
              Open full Product Plan
            </Button>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
