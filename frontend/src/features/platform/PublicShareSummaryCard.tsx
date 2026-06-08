'use client';

import { Box, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
} from './PlatformComponents';
import type { PublicShareSummary } from './types';

export default function PublicShareSummaryCard({
  accent = appleColors.cyan,
  summary,
}: {
  accent?: string;
  summary: PublicShareSummary;
}) {
  return (
    <Surface>
      <SectionTitle
        title={summary.title}
        action={<PastelChip label={`${summary.count}`} accent={accent} bg={`${accent}14`} />}
      />
      <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
        {summary.summary}
      </Typography>
      <Stack spacing={1} sx={{ mt: 1.5 }}>
        {summary.items.slice(0, 4).map((item) => (
          <Box key={item} sx={{ p: 1.25, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fbfdff' }}>
            <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.45 }}>
              {item}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Surface>
  );
}
