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
import { ProjectWorkspace } from './types';

interface WorkspaceCommandHeroProps {
  workspace: ProjectWorkspace;
  progress: number;
  accent: string;
  milestoneCount: number;
  participantCount: number;
  deliverableCount: number;
  proofFileCount: number;
  roughEdgeCount: number;
}

export default function WorkspaceCommandHero({
  workspace,
  progress,
  accent,
  milestoneCount,
  participantCount,
  deliverableCount,
  proofFileCount,
  roughEdgeCount,
}: WorkspaceCommandHeroProps) {
  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)' }}>
      <Stack direction={{ xs: 'column', xl: 'row' }} spacing={2.5} alignItems={{ xl: 'center' }} justifyContent="space-between">
        <Stack direction="row" spacing={2} alignItems="center">
          <ProgressRing value={progress} size={104} color={accent} label="done" />
          <Box>
            <Typography variant="h2" sx={{ fontSize: { xs: 26, md: 30 }, lineHeight: 1.12 }}>
              {workspace.name}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
              {workspace.packageInstance?.name || 'Service plan'} for {workspace.packageInstance?.productProfile?.name || 'selected product'}.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
              <StatusChip label={workspace.status} />
              <PastelChip label={`${milestoneCount} milestones`} accent={appleColors.purple} />
              <PastelChip label={`${participantCount} participants`} accent={appleColors.cyan} bg="#e4f9fd" />
            </Stack>
          </Box>
        </Stack>
        <Stack direction={{ xs: 'row', xl: 'column' }} spacing={0.75} flexWrap="wrap" useFlexGap>
          <DotLabel label={`${deliverableCount} fixes in focus`} color={appleColors.green} />
          <DotLabel label={`${proofFileCount} proof files`} color={appleColors.purple} />
          <DotLabel label={`${roughEdgeCount} open rough edges`} color={roughEdgeCount ? appleColors.amber : appleColors.green} />
        </Stack>
      </Stack>
    </Surface>
  );
}
