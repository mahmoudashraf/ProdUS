'use client';

import { Box, Typography } from '@mui/material';

export interface EvidenceSummaryItem {
  label: string;
  value: string;
  accent: string;
}

export default function OwnerProofLibrarySummaryGrid({
  summaryItems,
}: {
  summaryItems: EvidenceSummaryItem[];
}) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.25 }}>
      {summaryItems.map((item) => (
        <Box key={item.label} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: `${item.accent}32`, bgcolor: '#fff', minHeight: 88 }}>
          <Typography variant="caption" color="text.secondary">{item.label}</Typography>
          <Typography variant="body2" sx={{ mt: 0.55, fontWeight: 900, lineHeight: 1.35, overflowWrap: 'anywhere' }}>{item.value}</Typography>
        </Box>
      ))}
    </Box>
  );
}

