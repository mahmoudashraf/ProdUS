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
    <Surface sx={{ mb: 2.5, background: '#fbfdff' }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1.35} alignItems="flex-start" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
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
            <Typography variant="h3" sx={{ mt: 0.75, overflowWrap: 'anywhere' }}>
              {product.name}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.4, lineHeight: 1.55 }}>
              {product.summary || 'No product summary has been added yet.'}
            </Typography>
          </Box>
        </Stack>
        <Button
          component={NextLink}
          href="/dashboard?focus=products"
          variant="outlined"
          startIcon={<ArrowBackOutlined />}
          sx={{ minHeight: 42, alignSelf: { xs: 'flex-start', md: 'center' }, flexShrink: 0 }}
        >
          Switch product on Home
        </Button>
      </Stack>
    </Surface>
  );
}
