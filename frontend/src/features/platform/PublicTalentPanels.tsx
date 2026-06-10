'use client';

import NextLink from 'next/link';
import type { ReactNode } from 'react';
import { AutoAwesomeOutlined, GroupsOutlined, PersonSearchOutlined, RocketLaunchOutlined, VerifiedOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
  categoryPalette,
} from './PlatformComponents';
import { WorkspaceBreadcrumbs } from './OwnerWorkspaceJourneyNav';
import { ServiceCategory, ServiceModule } from './types';

export type PublicTalentView = 'teams' | 'experts' | 'services';

export const publicTalentViews: Array<{
  value: PublicTalentView;
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
}> = [
  {
    value: 'teams',
    title: 'Verified teams',
    description: 'Compare delivery teams that can carry a launch-hardening plan.',
    icon: <GroupsOutlined />,
    color: appleColors.purple,
  },
  {
    value: 'experts',
    title: 'Solo experts',
    description: 'Find independent specialists for targeted proof, fixes, or review.',
    icon: <PersonSearchOutlined />,
    color: appleColors.cyan,
  },
  {
    value: 'services',
    title: 'Service workstreams',
    description: 'See the product work these teams can deliver.',
    icon: <RocketLaunchOutlined />,
    color: appleColors.green,
  },
];

export function PublicTalentFocusNav({
  activeView,
  counts,
  onChange,
}: {
  activeView?: PublicTalentView | null;
  counts: Record<PublicTalentView, number>;
  onChange: (view: PublicTalentView) => void;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
        gap: 1.25,
      }}
    >
      {publicTalentViews.map((item) => {
        const selected = activeView === item.value;
        return (
          <Button
            key={item.value}
            data-testid={`public-talent-step-${item.value}`}
            variant="outlined"
            onClick={() => onChange(item.value)}
            sx={{
              justifyContent: 'flex-start',
              alignItems: 'stretch',
              p: 0,
              color: appleColors.ink,
              textTransform: 'none',
              whiteSpace: 'normal',
              borderColor: selected ? item.color : appleColors.line,
              bgcolor: selected ? `${item.color}0f` : '#fff',
              boxShadow: selected ? `0 16px 40px ${item.color}1a` : 'none',
            }}
          >
            <Stack spacing={0.75} sx={{ p: 1.75, width: '100%', minWidth: 0, textAlign: 'left' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                <Box sx={{ color: item.color, display: 'grid', placeItems: 'center' }}>{item.icon}</Box>
                <PastelChip label={`${counts[item.value]}`} accent={item.color} />
              </Stack>
              <Typography sx={{ fontWeight: 900 }}>{item.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, overflowWrap: 'anywhere' }}>
                {item.description}
              </Typography>
            </Stack>
          </Button>
        );
      })}
    </Box>
  );
}

export function PublicTalentInternalHeader({
  activeView,
  onOpenHub,
}: {
  activeView: PublicTalentView;
  onOpenHub: () => void;
}) {
  const view = publicTalentViews.find((item) => item.value === activeView) || publicTalentViews[0]!;

  return (
    <Stack spacing={1.25}>
      <WorkspaceBreadcrumbs
        items={[
          { label: 'Talent Network', onClick: onOpenHub },
          { label: view.title },
        ]}
        backLabel="Talent home"
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
              Product talent
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

export function PublicTalentContextPanel({
  activeView,
  cartActionLabel,
  cartHref,
  counts,
  onOpenExperts,
  onOpenServices,
  onOpenTeams,
}: {
  activeView: PublicTalentView;
  cartActionLabel: string;
  cartHref: string;
  counts: Record<PublicTalentView, number>;
  onOpenExperts: () => void;
  onOpenServices: () => void;
  onOpenTeams: () => void;
}) {
  const activeCount = counts[activeView] || 0;
  const currentView = publicTalentViews.find((item) => item.value === activeView) || publicTalentViews[0]!;

  return (
    <Surface sx={{ p: { xs: 1.5, md: 2 } }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '86px minmax(0, 1.35fr) minmax(0, 1.15fr) auto' },
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
              visible
            </Typography>
          </Box>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
            Current discovery path
          </Typography>
          <Typography sx={{ fontWeight: 950 }}>
            {activeCount} {publicTalentViews.find((item) => item.value === activeView)?.title.toLowerCase() || 'options'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Compare fit, then move useful talent into a governed product plan.
          </Typography>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
            Network coverage
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.45 }}>
            <PastelChip label={`${counts.teams} teams`} accent={appleColors.purple} />
            <PastelChip label={`${counts.experts} experts`} accent={appleColors.cyan} />
            <PastelChip label={`${counts.services} services`} accent={appleColors.green} />
          </Stack>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={1} sx={{ minWidth: { md: 160 } }}>
          <PastelChip label={`Current: ${currentView.title}`} accent={currentView.color} bg={`${currentView.color}14`} />
          {activeView !== 'teams' && (
            <Button variant="outlined" size="small" onClick={onOpenTeams}>
              Open teams
            </Button>
          )}
          {activeView !== 'experts' && (
            <Button variant="outlined" size="small" onClick={onOpenExperts}>
              Open experts
            </Button>
          )}
          {activeView !== 'services' && (
            <Button variant="outlined" size="small" onClick={onOpenServices}>
              Open services
            </Button>
          )}
          <Button component={NextLink} href={cartHref} variant="outlined" size="small">
            {cartActionLabel}
          </Button>
        </Stack>
      </Box>
    </Surface>
  );
}

export function PublicTalentServicesPanel({
  categories,
  modules,
}: {
  categories: ServiceCategory[];
  modules: ServiceModule[];
}) {
  const modulesByCategory = modules.reduce<Record<string, ServiceModule[]>>((grouped, module) => {
    const categoryId = module.category?.id || 'unknown';
    grouped[categoryId] = [...(grouped[categoryId] || []), module];
    return grouped;
  }, {});

  return (
    <Surface>
      <SectionTitle
        title="Service Workstreams"
        action={
          <Button component={NextLink} href="/catalog" variant="outlined" sx={{ minHeight: 40 }}>
            Open catalog
          </Button>
        }
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
          gap: 1.5,
        }}
      >
        {categories.slice(0, 8).map((category, index) => {
          const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
          const categoryModules = modulesByCategory[category.id] || [];

          return (
            <Box
              key={category.id}
              sx={{
                p: 2,
                border: `1px solid ${appleColors.line}`,
                borderTop: `3px solid ${palette.accent}`,
                borderRadius: 1,
                bgcolor: palette.soft,
              }}
            >
              <Typography sx={{ fontWeight: 900, mb: 0.75 }}>{category.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                {category.description || 'Production readiness workstream.'}
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                {categoryModules.slice(0, 3).map((module) => (
                  <PastelChip key={module.id} label={module.name} accent={palette.accent} bg={palette.bg} />
                ))}
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Surface>
  );
}

export function PublicTalentCta({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #eef2ff)' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
        <Stack direction="row" spacing={1.5} alignItems="center">
          <AutoAwesomeOutlined sx={{ color: appleColors.purple }} />
          <Box>
            <Typography variant="h4">Ready to turn discovery into a governed workspace?</Typography>
            <Typography color="text.secondary">
              Sign in to create a product brief, save teams and experts to a product plan, and approve it into a product workspace.
            </Typography>
          </Box>
        </Stack>
        <Button
          component={NextLink}
          href={isLoggedIn ? '/dashboard' : '/login'}
          variant="contained"
          startIcon={<VerifiedOutlined />}
          sx={{ minHeight: 44, minWidth: 170 }}
        >
          {isLoggedIn ? 'Open Dashboard' : 'Sign In'}
        </Button>
      </Stack>
    </Surface>
  );
}
