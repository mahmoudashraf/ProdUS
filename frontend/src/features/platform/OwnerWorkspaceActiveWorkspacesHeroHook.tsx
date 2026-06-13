'use client';

import { ArrowForwardRounded, WorkspacesOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { PastelChip, appleColors } from './PlatformComponents';

export default function OwnerWorkspaceActiveWorkspacesHeroHook({
  activeWorkspaceCount,
  totalWorkspaceCount,
  onOpen,
}: {
  activeWorkspaceCount: number;
  totalWorkspaceCount: number;
  onOpen: () => void;
}) {
  const hasWorkspaces = totalWorkspaceCount > 0;
  const countLabel = hasWorkspaces
    ? `${activeWorkspaceCount || totalWorkspaceCount} active`
    : 'Not started yet';

  return (
    <Box
      sx={{
        p: { xs: 1.35, md: 1.5 },
        borderRadius: 1,
        border: '1px solid',
        borderColor: '#bfe9d5',
        bgcolor: '#f6fffb',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'auto minmax(0, 1fr)' },
        gap: 1.25,
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: 1,
          bgcolor: '#e7f8ee',
          color: appleColors.green,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <WorkspacesOutlined />
      </Box>
      <Stack spacing={1.1} sx={{ minWidth: 0 }}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 0.65 }}>
            <PastelChip label="Active workspaces" accent={appleColors.green} bg="#e7f8ee" />
            <PastelChip label={countLabel} accent={hasWorkspaces ? appleColors.blue : appleColors.amber} bg={hasWorkspaces ? '#eaf3ff' : '#fff4dc'} />
          </Stack>
          <Typography variant="h4" sx={{ color: appleColors.ink }}>
            Continue delivery work
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.55 }}>
            Open the product workspaces created from approved Planning. Milestones, proof, people, and handoff stay inside this product.
          </Typography>
        </Box>
        <Button
          variant="contained"
          endIcon={<ArrowForwardRounded />}
          onClick={onOpen}
          sx={{ minHeight: 42, justifySelf: 'start', alignSelf: { xs: 'stretch', md: 'flex-start' }, whiteSpace: 'normal' }}
        >
          {hasWorkspaces ? 'Open active workspaces' : 'View workspaces'}
        </Button>
      </Stack>
    </Box>
  );
}
