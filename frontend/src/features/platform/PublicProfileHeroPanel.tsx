'use client';

import type { ReactNode } from 'react';
import { Avatar, Box, Stack, Typography } from '@mui/material';
import { Surface, appleColors } from './PlatformComponents';

export default function PublicProfileHeroPanel({
  name,
  title,
  body,
  photoUrl,
  coverUrl,
  badge,
  children,
}: {
  name: string;
  title?: string | undefined;
  body?: string | undefined;
  photoUrl?: string | undefined;
  coverUrl?: string | undefined;
  badge: ReactNode;
  children: ReactNode;
}) {
  return (
    <Surface sx={{ p: 0, overflow: 'hidden' }}>
      <Box
        sx={{
          minHeight: coverUrl ? { xs: 150, md: 210 } : { xs: 96, md: 132 },
          background: coverUrl
            ? `linear-gradient(90deg, rgba(15,23,42,0.52), rgba(98,92,255,0.20)), url(${coverUrl}) center/cover`
            : 'linear-gradient(135deg, #eef2ff, #ecfeff)',
        }}
      />
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2.5}
        alignItems={{ xs: 'flex-start', md: 'flex-end' }}
        justifyContent="space-between"
        sx={{ p: { xs: 2.5, md: 3 }, pt: 0 }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'flex-end' }} sx={{ minWidth: 0 }}>
          <Avatar
            variant="rounded"
            {...(photoUrl ? { src: photoUrl } : {})}
            sx={{
              width: 96,
              height: 96,
              mt: -6,
              border: '5px solid #fff',
              bgcolor: '#eef2ff',
              color: appleColors.purple,
              fontSize: 34,
              fontWeight: 900,
            }}
          >
            {name.slice(0, 1)}
          </Avatar>
          <Box sx={{ pb: { sm: 0.5 }, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h2" sx={{ overflowWrap: 'anywhere' }}>{name}</Typography>
              {badge}
            </Stack>
            <Typography sx={{ mt: 0.75, fontSize: 18, color: appleColors.muted, lineHeight: 1.55 }}>
              {title || body || 'Public ProdOps profile.'}
            </Typography>
          </Box>
        </Stack>
        {children}
      </Stack>
    </Surface>
  );
}
