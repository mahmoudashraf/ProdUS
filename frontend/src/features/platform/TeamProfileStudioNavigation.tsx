'use client';

import type { ReactNode } from 'react';
import { BadgeOutlined, GroupsOutlined, HowToRegOutlined, RocketLaunchOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { WorkspaceBreadcrumbs } from './OwnerWorkspaceJourneyNav';
import { PastelChip, appleColors } from './PlatformComponents';

export type TeamProfileStudioView = 'profile' | 'team' | 'expert' | 'requests';

const studioViews: Array<{
  value: TeamProfileStudioView;
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
}> = [
  {
    value: 'profile',
    title: 'Profile',
    description: 'Keep the public team identity accurate.',
    icon: <BadgeOutlined />,
    color: appleColors.purple,
  },
  {
    value: 'team',
    title: 'People',
    description: 'Manage members, invitations, and join requests.',
    icon: <GroupsOutlined />,
    color: appleColors.green,
  },
  {
    value: 'expert',
    title: 'Expert',
    description: 'Maintain the solo expert profile and availability.',
    icon: <RocketLaunchOutlined />,
    color: appleColors.cyan,
  },
  {
    value: 'requests',
    title: 'Access',
    description: 'Respond to invitations or request to join teams.',
    icon: <HowToRegOutlined />,
    color: appleColors.amber,
  },
];

const studioTitleByView: Record<TeamProfileStudioView, string> = {
  profile: 'Team Identity',
  team: 'People',
  expert: 'Expert Profile',
  requests: 'Access Requests',
};

export function TeamProfileStudioFocusNav({
  activeView,
  counts,
  onChange,
}: {
  activeView: TeamProfileStudioView | null;
  counts: Record<TeamProfileStudioView, number>;
  onChange: (view: TeamProfileStudioView) => void;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
        gap: 1.25,
        mb: 2.5,
      }}
    >
      {studioViews.map((view) => {
        const selected = activeView === view.value;
        return (
          <Button
            key={view.value}
            data-testid={`team-profile-studio-step-${view.value}`}
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
              '&.Mui-focusVisible': {
                outline: `3px solid ${view.color}26`,
                outlineOffset: 2,
                backgroundColor: selected ? `${view.color}14` : '#fff',
              },
            }}
          >
            <Stack spacing={0.75} sx={{ p: 1.5, width: '100%', minWidth: 0, textAlign: 'left' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                <Box sx={{ color: view.color, display: 'grid', placeItems: 'center' }}>{view.icon}</Box>
                <PastelChip label={`${counts[view.value]}`} accent={view.color} />
              </Stack>
              <Typography component="span" sx={{ display: 'block', fontWeight: 900 }}>{view.title}</Typography>
              <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', lineHeight: 1.45, overflowWrap: 'anywhere' }}>
                {view.description}
              </Typography>
            </Stack>
          </Button>
        );
      })}
    </Box>
  );
}

export function TeamProfileStudioInternalHeader({
  activeView,
  onOpenHub,
}: {
  activeView: TeamProfileStudioView;
  onOpenHub: () => void;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <WorkspaceBreadcrumbs
        items={[
          { label: 'Profile studio', onClick: onOpenHub },
          { label: studioTitleByView[activeView] },
        ]}
        backLabel="Studio home"
        onBack={onOpenHub}
      />
    </Box>
  );
}
