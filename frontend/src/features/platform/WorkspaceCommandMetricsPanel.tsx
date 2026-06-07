'use client';

import {
  CalendarMonthOutlined,
  ErrorOutlineOutlined,
  FactCheckOutlined,
  TaskAltOutlined,
} from '@mui/icons-material';
import { Box } from '@mui/material';
import { MetricTile, appleColors } from './PlatformComponents';

export default function WorkspaceCommandMetricsPanel({
  activeWorkspaceCount,
  blockedItems,
  completedMilestones,
  scheduledMilestoneCount,
  totalMilestoneCount,
  totalWorkspaceCount,
}: {
  activeWorkspaceCount: number;
  blockedItems: number;
  completedMilestones: number;
  scheduledMilestoneCount: number;
  totalMilestoneCount: number;
  totalWorkspaceCount: number;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
        gap: 2,
        mb: 2.5,
      }}
    >
      <MetricTile
        label="Active workspaces"
        value={activeWorkspaceCount}
        detail={`${totalWorkspaceCount} total productization paths`}
        accent={appleColors.cyan}
        icon={<FactCheckOutlined />}
      />
      <MetricTile
        label="Launch checkpoints"
        value={completedMilestones}
        detail={`${totalMilestoneCount} in selected workspace`}
        accent={appleColors.green}
        icon={<TaskAltOutlined />}
      />
      <MetricTile
        label="Rough edges"
        value={blockedItems}
        detail="Needs owner or specialist attention"
        accent={appleColors.red}
        icon={<ErrorOutlineOutlined />}
      />
      <MetricTile
        label="Timed checks"
        value={scheduledMilestoneCount}
        detail="Scheduled launch checkpoints"
        accent={appleColors.purple}
        icon={<CalendarMonthOutlined />}
      />
    </Box>
  );
}
