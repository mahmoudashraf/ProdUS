'use client';

import {
  GroupsOutlined,
  PlaylistAddCheckOutlined,
  WorkspacesOutlined,
} from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import {
  MetricTile,
  appleColors,
} from './PlatformComponents';

interface ProjectStartPlanMetricStripProps {
  canStartWorkspace: boolean;
  serviceCount: number;
  talentCount: number;
}

export default function ProjectStartPlanMetricStrip({
  canStartWorkspace,
  serviceCount,
  talentCount,
}: ProjectStartPlanMetricStripProps) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ display: { xs: 'grid', sm: 'none' }, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
        {[
          { label: 'Services', value: serviceCount, accent: appleColors.purple },
          { label: 'Team', value: talentCount, accent: appleColors.cyan },
          { label: 'Status', value: canStartWorkspace ? 'Ready' : 'Scope', accent: canStartWorkspace ? appleColors.green : appleColors.amber },
        ].map((item) => (
          <Box
            key={item.label}
            sx={{
              border: '1px solid',
              borderColor: `${item.accent}2e`,
              borderRadius: 1,
              bgcolor: `${item.accent}0d`,
              p: 1,
              minWidth: 0,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 800 }}>
              {item.label}
            </Typography>
            <Typography sx={{ mt: 0.25, fontWeight: 900, color: appleColors.ink, fontSize: 18, lineHeight: 1 }}>
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ minWidth: 0, display: { xs: 'none', sm: 'grid' }, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 2 }}>
        <MetricTile label="Selected services" value={serviceCount} detail="Become service plan modules" accent={appleColors.purple} icon={<PlaylistAddCheckOutlined />} sparkline />
        <MetricTile label="Teams / experts" value={talentCount} detail="Become shortlist and participants" accent={appleColors.cyan} icon={<GroupsOutlined />} sparkline />
        <MetricTile
          label="Workspace status"
          value={canStartWorkspace ? 'Ready' : 'Needs scope'}
          detail={canStartWorkspace ? 'Product and services selected' : 'Product plus one service required'}
          accent={canStartWorkspace ? appleColors.green : appleColors.amber}
          icon={<WorkspacesOutlined />}
          sparkline
        />
      </Box>
    </Box>
  );
}
