'use client';

import type { ReactNode } from 'react';
import { ExpandMoreOutlined } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';
import { appleColors } from './PlatformComponents';

export function ProductOnboardingReviewSection({
  title,
  subtitle,
  defaultExpanded,
  children,
}: {
  title: string;
  subtitle: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}) {
  return (
    <Accordion
      defaultExpanded={Boolean(defaultExpanded)}
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: appleColors.line,
        borderRadius: 1,
        bgcolor: '#fff',
        '&:before': { display: 'none' },
        '& + &': { mt: 1 },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreOutlined />} sx={{ px: 1.25, minHeight: 66 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 950 }}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, lineHeight: 1.45 }}>
            {subtitle}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 1.25, pt: 0, pb: 1.25 }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}
