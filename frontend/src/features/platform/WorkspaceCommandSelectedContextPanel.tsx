'use client';

import { Box, Stack, Typography } from '@mui/material';
import {
  DotLabel,
  PastelChip,
  ProgressRing,
  StatusChip,
  Surface,
  appleColors,
} from './PlatformComponents';
import type { ProjectWorkspace } from './types';

interface WorkspaceCommandSelectedContextPanelProps {
  workspace: ProjectWorkspace;
  progress: number;
  accent: string;
  milestoneCount: number;
  participantCount: number;
  deliverableCount: number;
  proofFileCount: number;
  roughEdgeCount: number;
}

export default function WorkspaceCommandSelectedContextPanel({
  workspace,
  progress,
  accent,
  milestoneCount,
  participantCount,
  deliverableCount,
  proofFileCount,
  roughEdgeCount,
}: WorkspaceCommandSelectedContextPanelProps) {
  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <ProgressRing value={progress} size={72} color={accent} label="done" />
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
              <PastelChip label="Selected workspace" accent={appleColors.purple} />
              <StatusChip label={workspace.status} />
            </Stack>
            <Typography variant="h3" sx={{ mt: 0.75, fontSize: { xs: 22, md: 25 }, overflowWrap: 'anywhere' }}>
              {workspace.name}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
              {workspace.packageInstance?.name || 'Service plan'} for {workspace.packageInstance?.productProfile?.name || 'selected product'}.
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap sx={{ minWidth: 0 }}>
          <DotLabel label={`${milestoneCount} checkpoints`} color={appleColors.purple} />
          <DotLabel label={`${participantCount} people`} color={appleColors.cyan} />
          <DotLabel label={`${deliverableCount} fixes`} color={appleColors.green} />
          <DotLabel label={`${proofFileCount} proof files`} color={appleColors.blue} />
          <DotLabel label={`${roughEdgeCount} rough edges`} color={roughEdgeCount ? appleColors.amber : appleColors.green} />
        </Stack>
      </Stack>
    </Surface>
  );
}
