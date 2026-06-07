'use client';

import { ReactNode } from 'react';
import { ExpandMoreOutlined } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography,
} from '@mui/material';

interface ScannerProofOperationAccordionProps {
  title: string;
  eyebrow: string;
  detail: string;
  accent: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}

export default function ScannerProofOperationAccordion({
  title,
  eyebrow,
  detail,
  accent,
  defaultExpanded,
  children,
}: ScannerProofOperationAccordionProps) {
  return (
    <Accordion
      defaultExpanded={Boolean(defaultExpanded)}
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: `${accent}38`,
        borderRadius: 1,
        bgcolor: '#fff',
        '&:before': { display: 'none' },
        '& + &': { mt: 1 },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreOutlined />} sx={{ px: 1.5, minHeight: 72 }}>
        <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ width: '100%' }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              bgcolor: `${accent}14`,
              color: accent,
              display: 'grid',
              placeItems: 'center',
              fontWeight: 950,
              flexShrink: 0,
              mt: 0.25,
            }}
          >
            {eyebrow}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 950 }}>{title}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.35, lineHeight: 1.45 }}>
              {detail}
            </Typography>
          </Box>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 1.5, pt: 0, pb: 1.5 }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}
