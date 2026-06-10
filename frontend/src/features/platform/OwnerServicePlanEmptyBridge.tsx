'use client';

import NextLink from 'next/link';
import { PlaylistAddCheckOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { appleColors } from './PlatformComponents';
import { PROJECT_START_PLAN_HREF } from './projectStartPlanLinks';

export default function OwnerServicePlanEmptyBridge() {
  return (
    <Box
      sx={{
        p: 1.5,
        border: '1px dashed',
        borderColor: appleColors.line,
        borderRadius: 1,
        bgcolor: '#fbfdff',
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: 'center' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4">Approve the Product Plan first</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
            The selected services are already staged for this product. Use Planning to confirm scope, then generate or attach a detailed service package when delivery needs a team handoff.
          </Typography>
        </Box>
        <Button
          component={NextLink}
          href={PROJECT_START_PLAN_HREF}
          variant="contained"
          startIcon={<PlaylistAddCheckOutlined />}
          sx={{ minHeight: 40, flexShrink: 0 }}
        >
          Open Planning
        </Button>
      </Stack>
    </Box>
  );
}
