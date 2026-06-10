'use client';

import {
  AutoAwesomeOutlined,
  CheckCircleOutlineOutlined,
} from '@mui/icons-material';
import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import {
  SectionTitle,
  Surface,
  appleColors,
} from './PlatformComponents';

export function ProductAnalysisProgress({ modeLabel }: { modeLabel: string }) {
  const steps = [
    'Reading product context',
    'Checking private document access',
    'Preparing repository and runtime signals',
    'Mapping services and scanner focus',
    modeLabel.includes('AI') ? 'Looking for AI opportunities' : 'Preparing owner review',
  ];

  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8f7ff)' }}>
      <Stack spacing={1.5}>
        <SectionTitle title="Checking your product" action={<AutoAwesomeOutlined sx={{ color: appleColors.purple }} />} />
        <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
          ProdUS is turning the brief, links, and selected files into an owner-readable Product Plan.
        </Typography>
        <LinearProgress sx={{ borderRadius: 999, height: 7 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5, minmax(0, 1fr))' }, gap: 1 }}>
          {steps.map((step, index) => (
            <Box key={step} sx={{ p: 1, borderRadius: 1, border: '1px solid #e7eaf3', bgcolor: '#fff', minHeight: 70 }}>
              <Stack direction="row" spacing={0.8} alignItems="center">
                <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: index < 2 ? '#e7f8ee' : '#f1efff', color: index < 2 ? appleColors.green : appleColors.purple, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 900 }}>
                  {index < 2 ? <CheckCircleOutlineOutlined sx={{ fontSize: 15 }} /> : index + 1}
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 900, lineHeight: 1.3 }}>
                  {step}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Box>
      </Stack>
    </Surface>
  );
}
