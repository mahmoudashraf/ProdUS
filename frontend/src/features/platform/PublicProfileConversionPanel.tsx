'use client';

import NextLink from 'next/link';
import { AutoAwesomeOutlined, VerifiedOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Surface, appleColors } from './PlatformComponents';
import { PROJECT_START_PLAN_HREF } from './projectStartPlanLinks';

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
            <Typography color="text.secondary">Compare profiles, save delivery partners to Planning, and approve the scope into a governed workspace after sign in.</Typography>
          </Box>
        </Stack>
        <Button
          component={NextLink}
          href={canUseProjectCart ? PROJECT_START_PLAN_HREF : isLoggedIn ? '/dashboard' : '/login'}
          variant="contained"
          startIcon={<VerifiedOutlined />}
          sx={{ minHeight: 44, minWidth: 160 }}
        >
          {canUseProjectCart ? 'Planning' : isLoggedIn ? 'Dashboard' : 'Sign in'}
        </Button>
      </Stack>
    </Surface>
  );
}
