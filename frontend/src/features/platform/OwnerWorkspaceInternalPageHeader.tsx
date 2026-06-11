'use client';

import { Box, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  Surface,
  appleColors,
} from './PlatformComponents';

export default function OwnerWorkspaceInternalPageHeader({
  areaLabel,
  detailLabel,
  detailText,
  productName,
}: {
  areaLabel: string;
  detailLabel: string;
  detailText?: string | undefined;
  productName?: string | undefined;
}) {
  return (
    <Surface sx={{ background: '#fff' }}>
      <Stack spacing={1.5}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 0.85 }}>
            <PastelChip label="Product section" accent={appleColors.purple} bg="#f1efff" />
            <PastelChip label={areaLabel} accent={appleColors.cyan} bg="#e4f9fd" />
          </Stack>
          <Typography variant="h2" sx={{ overflowWrap: 'anywhere' }}>
            {detailLabel}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.6, lineHeight: 1.6, maxWidth: 820 }}>
            {detailText || `Focused ${areaLabel.toLowerCase()} view for ${productName || 'this product'}.`}
          </Typography>
        </Box>
      </Stack>
    </Surface>
  );
}
