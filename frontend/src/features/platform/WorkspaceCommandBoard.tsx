'use client';

import { useEffect, useRef, type ComponentProps } from 'react';
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
  const isDetailView = workspaceView !== 'overview';
  const detailRailRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showDetailRail) return;
    window.requestAnimationFrame(() => {
      detailRailRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
    });
  }, [showDetailRail, workspaceView]);

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
      <Box sx={{ order: { xs: isDetailView ? 3 : 1, lg: 1 }, minWidth: 0 }}>
        <WorkspaceCommandSidebar {...sidebar} />
      </Box>

      <Stack spacing={2} sx={{ order: { xs: 1, lg: 2 }, minWidth: 0 }}>
        {selectedWorkspacePane ? (
          <WorkspaceCommandSelectedWorkspacePane {...selectedWorkspacePane} />
        ) : (
          <Surface>
            <EmptyState label="Open or create a workspace to coordinate milestones, evidence, and delivery participants." />
          </Surface>
        )}

        {showDetailRail && (
          <Stack ref={detailRailRef} spacing={2} sx={{ minWidth: 0 }}>
            {workspaceView === 'team' && teamPanels && (
              <WorkspaceCommandTeamPanels {...teamPanels} />
            )}
            {workspaceView === 'handoff' && handoffPanels && (
              <WorkspaceCommandHandoffPanels {...handoffPanels} />
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
