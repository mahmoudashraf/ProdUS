'use client';

import NextLink from 'next/link';
import { ArrowForwardOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  DotLabel,
  PastelChip,
  ProgressRing,
  appleColors,
  categoryPalette,
  clampScore,
  formatLabel,
} from './PlatformComponents';
import { productReadinessTone, productScore } from './productProfilesModel';
import type { PackageInstance, ProductProfile } from './types';

export default function ProductPortfolioProductRow({
  profile,
  packageList,
  index,
}: {
  profile: ProductProfile;
  packageList: PackageInstance[];
  index: number;
}) {
  const score = clampScore(productScore(profile, packageList));
  const tone = productReadinessTone(score);
  const packageInstance = packageList.find((item) => item.productProfile?.id === profile.id);
  const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 90px minmax(150px, auto)' },
        gap: { xs: 1.25, md: 1.5 },
        alignItems: 'center',
        py: 1.35,
        borderTop: index === 0 ? 0 : '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 1,
            bgcolor: palette.bg,
            color: palette.accent,
            display: 'grid',
            placeItems: 'center',
            fontWeight: 900,
            flex: '0 0 auto',
          }}
        >
          {profile.name.charAt(0)}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>{profile.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
            {profile.summary || 'No summary yet.'}
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.85 }}>
            <PastelChip label={formatLabel(profile.businessStage)} accent={palette.accent} bg={palette.bg} />
            <PastelChip
              label={packageInstance ? formatLabel(packageInstance.status) : 'No approved plan'}
              accent={packageInstance ? appleColors.cyan : appleColors.muted}
              bg={packageInstance ? '#e4f9fd' : '#f8fafc'}
            />
          </Stack>
        </Box>
      </Stack>
      <Stack direction={{ xs: 'row', md: 'column' }} spacing={1} alignItems={{ xs: 'center', md: 'flex-start' }}>
        <ProgressRing value={score} color={tone.color} size={58} />
        <DotLabel label={tone.label} color={tone.color} />
      </Stack>
      <Stack spacing={0.75} alignItems={{ xs: 'stretch', md: 'flex-end' }}>
        <Button component={NextLink} href={`/products/${profile.id}`} variant="contained" endIcon={<ArrowForwardOutlined />} sx={{ minHeight: 40 }}>
          Open Workspace
        </Button>
      </Stack>
    </Box>
  );
}
