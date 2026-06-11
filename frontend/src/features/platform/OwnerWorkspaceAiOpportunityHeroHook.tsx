'use client';

import { AutoAwesomeOutlined, PsychologyOutlined, ArrowForwardRounded } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { PastelChip, appleColors } from './PlatformComponents';

export default function OwnerWorkspaceAiOpportunityHeroHook({
  onOpen,
}: {
  onOpen: () => void;
}) {
  return (
    <Box
      sx={{
        mt: 2.25,
        p: { xs: 1.35, md: 1.5 },
        borderRadius: 1,
        border: '1px solid',
        borderColor: '#ded7ff',
        bgcolor: '#fbfaff',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'auto minmax(0, 1fr) auto' },
        gap: 1.25,
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: 1,
          bgcolor: '#f1efff',
          color: appleColors.purple,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <PsychologyOutlined />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 0.65 }}>
          <PastelChip label="AI opportunities" accent={appleColors.purple} bg="#f1efff" />
          <PastelChip label="LoomAI fit" accent={appleColors.blue} bg="#eef6ff" />
        </Stack>
        <Typography variant="h4" sx={{ color: appleColors.ink }}>
          Find where AI can help this product
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.55, maxWidth: 780 }}>
          Review saved AI ideas, see what LoomAI should power, and refresh the analysis with files before accepting product updates.
        </Typography>
      </Box>
      <Button
        variant="contained"
        startIcon={<AutoAwesomeOutlined />}
        endIcon={<ArrowForwardRounded />}
        onClick={onOpen}
        sx={{ minHeight: 42, justifySelf: { xs: 'stretch', md: 'end' }, whiteSpace: 'normal' }}
      >
        Open AI opportunities
      </Button>
    </Box>
  );
}
