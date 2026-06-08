'use client';

import { KeyboardBackspaceOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
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
  onBackHome,
}: {
  areaLabel: string;
  detailLabel: string;
  detailText?: string | undefined;
  productName?: string | undefined;
  onBackHome: () => void;
}) {
  return (
    <Surface sx={{ background: '#fff' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ md: 'center' }}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 0.85 }}>
            <PastelChip label="Internal product page" accent={appleColors.purple} bg="#f1efff" />
            <PastelChip label={areaLabel} accent={appleColors.cyan} bg="#e4f9fd" />
          </Stack>
          <Typography variant="h2" sx={{ overflowWrap: 'anywhere' }}>
            {detailLabel}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.6, lineHeight: 1.6, maxWidth: 820 }}>
            {detailText || `Focused ${areaLabel.toLowerCase()} view for ${productName || 'this product'}.`}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<KeyboardBackspaceOutlined />}
          onClick={onBackHome}
          sx={{ minHeight: 42, alignSelf: { xs: 'flex-start', md: 'center' }, flexShrink: 0 }}
        >
          Product home
        </Button>
      </Stack>
    </Surface>
  );
}
