'use client';

import NextLink from 'next/link';
import { ArrowForwardOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  DotLabel,
  PastelChip,
  ProgressRing,
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
        gridTemplateColumns: { xs: '1fr', xl: '1.65fr 120px 130px 1.3fr 1fr minmax(138px, auto)' },
        gap: 2,
        alignItems: 'center',
        py: 2,
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
        </Box>
      </Stack>
      <PastelChip label={formatLabel(profile.businessStage)} accent={palette.accent} bg={palette.bg} />
      <ProgressRing value={score} color={tone.color} size={68} />
      <Box>
        <DotLabel label={tone.label} color={tone.color} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {profile.riskProfile || 'No launch risk profile recorded yet.'}
        </Typography>
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 800 }}>{packageInstance?.name || 'No approved plan yet'}</Typography>
        <Typography variant="body2" color="text.secondary">
          {packageInstance ? formatLabel(packageInstance.status) : 'Open Product Home to choose the next path'}
        </Typography>
      </Box>
      <Stack spacing={0.75} alignItems={{ xs: 'stretch', xl: 'flex-end' }}>
        <Button component={NextLink} href={`/products/${profile.id}`} variant="contained" endIcon={<ArrowForwardOutlined />} sx={{ minHeight: 40 }}>
          Open Product Home
        </Button>
      </Stack>
    </Box>
  );
}
