'use client';

import {
  FactCheckOutlined,
  GroupsOutlined,
  Inventory2Outlined,
  PlaylistAddCheckOutlined,
  RocketLaunchOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import {
  PastelChip,
  ProgressRing,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { ProjectStartJourneyView } from './ProjectStartJourneyNavigation';
import type { ProductProfile } from './types';

interface ProjectStartPlanContextPanelProps {
  title: string | undefined;
  product: ProductProfile | undefined;
  hasPlaceholderProduct: boolean;
  score: number;
  canStartWorkspace: boolean;
  blockers: number;
  serviceCount: number;
  talentCount: number;
  currentView: ProjectStartJourneyView;
  currentDetailLabel: string;
  onOpenDetail: (step: ProjectStartJourneyView) => void;
}

const routeActions: Array<{
  value: ProjectStartJourneyView;
  label: string;
  icon: ReactNode;
}> = [
  { value: 'readiness', label: 'Readiness', icon: <FactCheckOutlined /> },
  { value: 'services', label: 'Services', icon: <PlaylistAddCheckOutlined /> },
  { value: 'talent', label: 'Talent', icon: <GroupsOutlined /> },
  { value: 'handoff', label: 'Approve', icon: <RocketLaunchOutlined /> },
];

function SmallContextMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent: string;
}) {
  return (
    <Box
      sx={{
        minWidth: 0,
        border: '1px solid',
        borderColor: `${accent}24`,
        bgcolor: `${accent}0d`,
        borderRadius: 1,
        px: 1.1,
        py: 0.9,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 850 }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 0.35, fontWeight: 950, color: appleColors.ink, lineHeight: 1.1, overflowWrap: 'anywhere' }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function ProjectStartPlanContextPanel({
  title,
  product,
  hasPlaceholderProduct,
  score,
  canStartWorkspace,
  blockers,
  serviceCount,
  talentCount,
  currentView,
  currentDetailLabel,
  onOpenDetail,
}: ProjectStartPlanContextPanelProps) {
  const statusLabel = canStartWorkspace
    ? 'Ready to start'
    : hasPlaceholderProduct
      ? 'Choose product'
      : blockers
        ? `${blockers} blocker${blockers === 1 ? '' : 's'}`
        : 'Needs scope';
  const statusAccent = canStartWorkspace
    ? appleColors.green
    : blockers || hasPlaceholderProduct
      ? appleColors.amber
      : appleColors.purple;
  const displayName = hasPlaceholderProduct
    ? 'Choose a real product'
    : product?.name || title || 'Productization start plan';
  const currentAction = routeActions.find((action) => action.value === currentView);
  const availableRouteActions = routeActions.filter((action) => action.value !== currentView);

  return (
    <Surface sx={{ p: { xs: 1.5, md: 2 }, background: '#fff' }}>
      <Box
        sx={{
          minWidth: 0,
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)' },
          gap: { xs: 1.5, md: 2 },
          alignItems: 'center',
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1,
              display: 'grid',
              placeItems: 'center',
              bgcolor: '#f1efff',
              color: appleColors.purple,
              flexShrink: 0,
            }}
          >
            <Inventory2Outlined />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
              <PastelChip label="Selected start plan" accent={appleColors.purple} />
              <PastelChip label={`Current: ${currentDetailLabel}`} accent={appleColors.blue} bg="#eaf3ff" />
              <PastelChip label={statusLabel} accent={statusAccent} bg={`${statusAccent}12`} />
            </Stack>
            <Typography variant="h3" sx={{ mt: 0.9, overflowWrap: 'anywhere', lineHeight: 1.14 }}>
              {displayName}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.6, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {product?.summary || 'This plan collects the services, people, and handoff decisions needed before a workspace starts.'}
            </Typography>
            {product && !hasPlaceholderProduct && (
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                <PastelChip label={formatLabel(product.businessStage)} accent={appleColors.purple} />
                {product.techStack && <PastelChip label={product.techStack} accent={appleColors.cyan} bg="#e4f9fd" />}
              </Stack>
            )}
          </Box>
        </Stack>

        <Stack spacing={1.4} sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
            <ProgressRing value={score} size={70} color={canStartWorkspace ? appleColors.green : appleColors.purple} label="ready" />
            <Box sx={{ minWidth: 0, flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
              <SmallContextMetric label="Services" value={serviceCount} accent={appleColors.purple} />
              <SmallContextMetric label="Team" value={talentCount} accent={appleColors.cyan} />
              <SmallContextMetric label="Status" value={canStartWorkspace ? 'Ready' : 'Scope'} accent={canStartWorkspace ? appleColors.green : appleColors.amber} />
            </Box>
          </Stack>

          <Box
            aria-label="Start plan internal pages"
            component="nav"
            sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'auto minmax(0, 1fr)' }, gap: 0.75, alignItems: 'center' }}
          >
            <PastelChip
              label={`Viewing ${currentAction?.label || currentDetailLabel}`}
              accent={appleColors.blue}
              bg="#eaf3ff"
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' }, gap: 0.75 }}>
              {availableRouteActions.map((action) => (
                <Button
                  key={action.value}
                  variant="outlined"
                  startIcon={action.icon}
                  onClick={() => onOpenDetail(action.value)}
                  aria-label={`Open ${action.label}`}
                  sx={{
                    minWidth: 0,
                    minHeight: 38,
                    justifyContent: 'center',
                    px: 1,
                    '& .MuiButton-startIcon': { mr: { xs: 0, sm: 0.75 } },
                    '& .MuiButton-startIcon svg': { fontSize: 18 },
                  }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    {action.label}
                  </Box>
                </Button>
              ))}
            </Box>
          </Box>
        </Stack>
      </Box>
    </Surface>
  );
}
