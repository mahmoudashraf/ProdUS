'use client';

import NextLink from 'next/link';
import { ArrowBackOutlined, Inventory2Outlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { ProductProfile } from './types';

export default function OwnerWorkspaceSelectedProductBar({
  product,
}: {
  product: ProductProfile;
}) {
  return (
    <Surface sx={{ mb: 1.5, py: 1.15, background: '#fbfdff', boxShadow: 'none' }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.15}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 1,
              display: 'grid',
              placeItems: 'center',
              color: appleColors.purple,
              bgcolor: '#f1efff',
              flexShrink: 0,
            }}
          >
            <Inventory2Outlined />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
              <PastelChip label="Selected product" accent={appleColors.purple} bg="#f1efff" />
              <PastelChip label={formatLabel(product.businessStage)} accent={appleColors.cyan} bg="#e4f9fd" />
            </Stack>
            <Typography variant="body1" sx={{ mt: 0.45, fontWeight: 950, overflowWrap: 'anywhere' }}>
              {product.name}
            </Typography>
          </Box>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ flexShrink: 0 }}>
          <Button
            component={NextLink}
            href="/dashboard?focus=products"
            variant="outlined"
            startIcon={<ArrowBackOutlined />}
            sx={{ minHeight: 36, whiteSpace: 'normal' }}
          >
            Switch product on Home
          </Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
