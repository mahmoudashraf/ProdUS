'use client';

import NextLink from 'next/link';
import { AutoAwesomeOutlined, VerifiedOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Surface, appleColors } from './PlatformComponents';

export default function PublicProfileConversionPanel({
  canUseProjectCart,
  isLoggedIn,
}: {
  canUseProjectCart: boolean;
  isLoggedIn: boolean;
}) {
  return (
    <Surface sx={{ mt: 3, background: 'linear-gradient(135deg, #ffffff, #eef2ff)' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
        <Stack direction="row" spacing={1.5} alignItems="center">
          <AutoAwesomeOutlined sx={{ color: appleColors.purple }} />
          <Box>
            <Typography variant="h4">Need a governed production path?</Typography>
            <Typography color="text.secondary">Compare profiles, save delivery partners to a start plan, and approve it into a governed workspace after sign in.</Typography>
          </Box>
        </Stack>
        <Button
          component={NextLink}
          href={canUseProjectCart ? '/owner/project-cart' : isLoggedIn ? '/dashboard' : '/login'}
          variant="contained"
          startIcon={<VerifiedOutlined />}
          sx={{ minHeight: 44, minWidth: 160 }}
        >
          {canUseProjectCart ? 'Review start plan' : isLoggedIn ? 'Dashboard' : 'Sign in'}
        </Button>
      </Stack>
    </Surface>
  );
}
