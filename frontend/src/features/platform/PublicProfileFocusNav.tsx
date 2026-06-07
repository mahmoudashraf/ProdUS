'use client';

import type { ReactNode } from 'react';
import { BadgeOutlined, InsightsOutlined, VerifiedOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { PastelChip, appleColors } from './PlatformComponents';

export type PublicProfileView = 'overview' | 'proof' | 'signals';

const profileViews: Array<{
  value: PublicProfileView;
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
}> = [
  {
    value: 'overview',
    title: 'Overview',
    description: 'What this profile is best for.',
    icon: <BadgeOutlined />,
    color: appleColors.purple,
  },
  {
    value: 'proof',
    title: 'Proof',
    description: 'Capabilities, skills, or services.',
    icon: <VerifiedOutlined />,
    color: appleColors.green,
  },
  {
    value: 'signals',
    title: 'Signals',
    description: 'Availability, score, and links.',
    icon: <InsightsOutlined />,
    color: appleColors.cyan,
  },
];

export function PublicProfileFocusNav({
  activeView,
  counts,
  onChange,
}: {
  activeView: PublicProfileView;
  counts: Record<PublicProfileView, number>;
  onChange: (view: PublicProfileView) => void;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
        gap: 1.25,
      }}
    >
      {profileViews.map((view) => {
        const selected = activeView === view.value;
        return (
          <Button
            key={view.value}
            data-testid={`public-profile-step-${view.value}`}
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
