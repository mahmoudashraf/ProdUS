'use client';

import type { ReactNode } from 'react';
import { BadgeOutlined, InsightsOutlined, VerifiedOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { PastelChip, Surface, appleColors } from './PlatformComponents';
import { WorkspaceBreadcrumbs } from './OwnerWorkspaceJourneyNav';

export type PublicProfileView = 'overview' | 'proof' | 'signals';

export const profileViews: Array<{
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
  activeView?: PublicProfileView | null;
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

export function PublicProfileInternalHeader({
  activeView,
  profileLabel,
  onOpenHub,
}: {
  activeView: PublicProfileView;
  profileLabel: string;
  onOpenHub: () => void;
}) {
  const view = profileViews.find((item) => item.value === activeView) || profileViews[0]!;

  return (
    <Stack spacing={1.25}>
      <WorkspaceBreadcrumbs
        items={[
          { label: profileLabel, onClick: onOpenHub },
          { label: view.title },
        ]}
        backLabel="Profile home"
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
              Public profile detail
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

export function PublicProfileContextPanel({
  activeView,
  actions,
  badge,
  counts,
  name,
  onOpenOverview,
  onOpenProof,
  onOpenSignals,
  summary,
}: {
  activeView: PublicProfileView;
  actions: ReactNode;
  badge: ReactNode;
  counts: Record<PublicProfileView, number>;
  name: string;
  onOpenOverview: () => void;
  onOpenProof: () => void;
  onOpenSignals: () => void;
  summary?: string | undefined;
}) {
  const activeCount = counts[activeView] || 0;
  const currentView = profileViews.find((view) => view.value === activeView) || profileViews[0]!;

  return (
    <Surface sx={{ p: { xs: 1.5, md: 2 } }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '86px minmax(0, 1.35fr) minmax(0, 1fr) auto' },
          gap: 1.5,
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            width: 72,
            minHeight: 72,
            borderRadius: 1,
            bgcolor: '#f8f7ff',
            border: `1px solid ${appleColors.line}`,
            color: appleColors.purple,
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            fontWeight: 950,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 24, lineHeight: 1, fontWeight: 950 }}>{activeCount}</Typography>
            <Typography variant="caption" sx={{ color: appleColors.muted, fontWeight: 900 }}>
              {activeCount === 1 ? 'item' : 'items'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography sx={{ fontWeight: 950, overflowWrap: 'anywhere' }}>{name}</Typography>
            {badge}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.55 }}>
            {summary || 'Review profile fit before adding this option to a governed product plan.'}
          </Typography>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
            Profile sections
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.45 }}>
            <PastelChip label={`${counts.overview} overview`} accent={appleColors.purple} />
            <PastelChip label={`${counts.proof} proof`} accent={appleColors.green} />
            <PastelChip label={`${counts.signals} signals`} accent={appleColors.cyan} />
          </Stack>
        </Box>
        <Stack spacing={1} sx={{ minWidth: { md: 170 } }}>
          <PastelChip label={`Current: ${currentView.title}`} accent={currentView.color} bg={`${currentView.color}14`} />
          {activeView !== 'overview' && (
            <Button variant="outlined" size="small" onClick={onOpenOverview}>
              Open overview
            </Button>
          )}
          {activeView !== 'proof' && (
            <Button variant="outlined" size="small" onClick={onOpenProof}>
              Open proof
            </Button>
          )}
          {activeView !== 'signals' && (
            <Button variant="outlined" size="small" onClick={onOpenSignals}>
              Open signals
            </Button>
          )}
          {actions}
        </Stack>
      </Box>
    </Surface>
  );
}
