'use client';

import type { ReactNode } from 'react';
import {
  AssignmentTurnedInOutlined,
  EngineeringOutlined,
  GroupsOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { PastelChip, ProgressRing, Surface, appleColors, formatLabel } from './PlatformComponents';
import { WorkspaceBreadcrumbs } from './OwnerWorkspaceJourneyNav';
import type { Team } from './types';

export type TeamDeliveryView = 'opportunities' | 'delivery' | 'support' | 'team';

export const deliveryViews: Array<{
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
  activeView?: TeamDeliveryView | null;
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

export function TeamDeliveryInternalHeader({
  activeView,
  onOpenHub,
}: {
  activeView: TeamDeliveryView;
  onOpenHub: () => void;
}) {
  const view = deliveryViews.find((item) => item.value === activeView) || deliveryViews[0]!;

  return (
    <Stack spacing={1.25}>
      <WorkspaceBreadcrumbs
        items={[
          { label: 'Delivery Control', onClick: onOpenHub },
          { label: view.title },
        ]}
        backLabel="Delivery hub"
        onBack={onOpenHub}
      />
      <Surface sx={{ p: { xs: 2, md: 2.5 }, background: '#fbfcff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1,
              bgcolor: `${view.color}14`,
              color: view.color,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            {view.icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
              Team delivery workspace
            </Typography>
            <Typography variant="h3" sx={{ mt: 0.35 }}>
              {view.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.65, lineHeight: 1.55, maxWidth: 760 }}>
              {view.description}
            </Typography>
          </Box>
        </Stack>
      </Surface>
    </Stack>
  );
}

export function TeamDeliveryContextPanel({
  activeView,
  activeWorkspaceCount,
  averageRating,
  overdueSupportCount,
  proposalCount,
  score,
  selectedTeam,
  onOpenDelivery,
  onOpenOpportunities,
}: {
  activeView: TeamDeliveryView;
  activeWorkspaceCount: number;
  averageRating: string;
  overdueSupportCount: number;
  proposalCount: number;
  score: number;
  selectedTeam?: Team | undefined;
  onOpenDelivery: () => void;
  onOpenOpportunities: () => void;
}) {
  return (
    <Surface sx={{ p: { xs: 1.5, md: 2 } }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '86px minmax(0, 1.3fr) minmax(0, 1.2fr) auto' },
          gap: 1.5,
          alignItems: 'center',
        }}
      >
        <ProgressRing value={score || 72} size={72} color={appleColors.cyan} label="profile" />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
            Selected team
          </Typography>
          <Typography sx={{ fontWeight: 950, overflowWrap: 'anywhere' }}>
            {selectedTeam?.name || 'Team workspace'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedTeam ? formatLabel(selectedTeam.verificationStatus) : 'Team context loads from assigned work.'}
          </Typography>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
            Current workload
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.45 }}>
            <PastelChip label={`${proposalCount} proposals`} accent={appleColors.purple} />
            <PastelChip label={`${activeWorkspaceCount} deliveries`} accent={appleColors.green} />
            <PastelChip label={`${overdueSupportCount} support risks`} accent={overdueSupportCount ? appleColors.red : appleColors.amber} />
            <PastelChip label={`${averageRating} rating`} accent={appleColors.cyan} />
          </Stack>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={1} sx={{ minWidth: { md: 150 } }}>
          <Button variant={activeView === 'opportunities' ? 'contained' : 'outlined'} size="small" onClick={onOpenOpportunities}>
            Opportunities
          </Button>
          <Button variant={activeView === 'delivery' ? 'contained' : 'outlined'} size="small" onClick={onOpenDelivery}>
            Delivery proof
          </Button>
        </Stack>
      </Box>
    </Surface>
  );
}
