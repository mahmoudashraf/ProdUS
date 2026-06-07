'use client';

import type { ReactNode } from 'react';
import {
  AssignmentTurnedInOutlined,
  EngineeringOutlined,
  GroupsOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { PastelChip, appleColors } from './PlatformComponents';

export type TeamDeliveryView = 'opportunities' | 'delivery' | 'support' | 'team';

const deliveryViews: Array<{
  value: TeamDeliveryView;
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
}> = [
  {
    value: 'opportunities',
    title: 'Opportunities',
    description: 'Review proposal queue and owner requests.',
    icon: <AssignmentTurnedInOutlined />,
    color: appleColors.purple,
  },
  {
    value: 'delivery',
    title: 'Delivery Proof',
    description: 'Track workspaces, milestones, and evidence.',
    icon: <EngineeringOutlined />,
    color: appleColors.cyan,
  },
  {
    value: 'support',
    title: 'Support',
    description: 'Resolve owner support and SLA risk.',
    icon: <WarningAmberOutlined />,
    color: appleColors.amber,
  },
  {
    value: 'team',
    title: 'Team',
    description: 'Maintain roster, proof, and reputation.',
    icon: <GroupsOutlined />,
    color: appleColors.green,
  },
];

export function TeamDeliveryFocusNav({
  activeView,
  counts,
  onChange,
}: {
  activeView: TeamDeliveryView;
  counts: Record<TeamDeliveryView, number>;
  onChange: (view: TeamDeliveryView) => void;
}) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.25 }}>
      {deliveryViews.map((view) => {
        const selected = activeView === view.value;
        return (
          <Button
            key={view.value}
            data-testid={`team-delivery-step-${view.value}`}
            aria-pressed={selected}
            disableRipple
            variant="outlined"
            onClick={(event) => {
              event.currentTarget.blur();
              onChange(view.value);
            }}
            sx={{
              justifyContent: 'flex-start',
              alignItems: 'stretch',
              p: 0,
              color: appleColors.ink,
              textTransform: 'none',
              whiteSpace: 'normal',
              transition: 'none',
              border: '1px solid',
              borderColor: selected ? view.color : appleColors.line,
              backgroundColor: selected ? `${view.color}14` : '#fff',
              boxShadow: selected ? `0 16px 36px ${view.color}1f` : 'none',
              '&:hover': {
                borderColor: view.color,
                backgroundColor: selected ? `${view.color}18` : `${view.color}0a`,
              },
            }}
          >
            <Stack spacing={0.75} sx={{ p: 1.5, width: '100%', minWidth: 0, textAlign: 'left' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                <Box sx={{ color: view.color, display: 'grid', placeItems: 'center' }}>{view.icon}</Box>
                <PastelChip label={`${counts[view.value]}`} accent={view.color} />
              </Stack>
              <Typography component="span" sx={{ display: 'block', fontWeight: 900 }}>{view.title}</Typography>
              <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', lineHeight: 1.45 }}>
                {view.description}
              </Typography>
            </Stack>
          </Button>
        );
      })}
    </Box>
  );
}
