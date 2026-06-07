'use client';

import type { ComponentProps } from 'react';
import { Box, Stack } from '@mui/material';
import WorkspaceCommandHandoffPanels from './WorkspaceCommandHandoffPanels';
import type { WorkspaceCommandView } from './WorkspaceCommandJourneyNav';
import WorkspaceCommandSelectedWorkspacePane from './WorkspaceCommandSelectedWorkspacePane';
import WorkspaceCommandSidebar from './WorkspaceCommandSidebar';
import WorkspaceCommandTeamPanels from './WorkspaceCommandTeamPanels';
import { EmptyState, Surface } from './PlatformComponents';

type SidebarProps = ComponentProps<typeof WorkspaceCommandSidebar>;
type SelectedWorkspacePaneProps = ComponentProps<typeof WorkspaceCommandSelectedWorkspacePane>;
type TeamPanelsProps = ComponentProps<typeof WorkspaceCommandTeamPanels>;
type HandoffPanelsProps = ComponentProps<typeof WorkspaceCommandHandoffPanels>;

interface WorkspaceCommandBoardProps {
  workspaceView: WorkspaceCommandView;
  sidebar: SidebarProps;
  selectedWorkspacePane?: SelectedWorkspacePaneProps | undefined;
  teamPanels?: TeamPanelsProps | undefined;
  handoffPanels?: HandoffPanelsProps | undefined;
}

export default function WorkspaceCommandBoard({
  workspaceView,
  sidebar,
  selectedWorkspacePane,
  teamPanels,
  handoffPanels,
}: WorkspaceCommandBoardProps) {
  const showDetailRail = Boolean(selectedWorkspacePane && (workspaceView === 'team' || workspaceView === 'handoff'));

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          lg: '300px minmax(0, 1fr)',
          xl: '320px minmax(0, 1fr)',
        },
        gap: 2.5,
        alignItems: 'start',
      }}
    >
      <WorkspaceCommandSidebar {...sidebar} />

      <Stack spacing={2}>
        {selectedWorkspacePane ? (
          <WorkspaceCommandSelectedWorkspacePane {...selectedWorkspacePane} />
        ) : (
          <Surface>
            <EmptyState label="Open or create a workspace to coordinate milestones, evidence, and delivery participants." />
          </Surface>
        )}
      </Stack>

      <Stack
        spacing={2}
        sx={{
          display: showDetailRail ? 'flex' : 'none',
          gridColumn: { lg: '2 / -1' },
        }}
      >
        {workspaceView === 'team' && teamPanels && (
          <WorkspaceCommandTeamPanels {...teamPanels} />
        )}
        {workspaceView === 'handoff' && handoffPanels && (
          <WorkspaceCommandHandoffPanels {...handoffPanels} />
        )}
      </Stack>
    </Box>
  );
}
