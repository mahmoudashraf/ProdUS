'use client';

import NextLink from 'next/link';
import {
  AutoAwesomeOutlined,
  BuildCircleOutlined,
  Inventory2Outlined,
  KeyboardBackspaceOutlined,
  LayersOutlined,
  PlaylistAddCheckOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { OwnerWorkspaceJourneyNav, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import {
  PastelChip,
  Surface,
  appleColors,
} from './PlatformComponents';

export type ServiceCatalogView = 'templates' | 'services' | 'ai';

export const isServiceCatalogView = (value: string | null): value is ServiceCatalogView =>
  value === 'templates' || value === 'services' || value === 'ai';

const catalogViewItems = ({
  templateCount,
  categoryCount,
  aiCapabilityCount,
}: {
  templateCount: number;
  categoryCount: number;
  aiCapabilityCount: number;
}): JourneyStepItem<ServiceCatalogView>[] => [
  {
    value: 'templates',
    label: 'Launch Templates',
    detail: 'Start with a bundled launch-hardening path.',
    accent: appleColors.purple,
    meta: <PastelChip label={`${templateCount}`} accent={appleColors.purple} bg="#f1efff" />,
  },
  {
    value: 'services',
    label: 'Service Workstreams',
    detail: 'Choose individual services by product need.',
    accent: appleColors.blue,
    meta: <PastelChip label={`${categoryCount}`} accent={appleColors.blue} bg="#eaf3ff" />,
  },
  {
    value: 'ai',
    label: 'AI Integration Options',
    detail: 'Review where AI can help the product journey.',
    accent: appleColors.cyan,
    meta: <PastelChip label={`${aiCapabilityCount}`} accent={appleColors.cyan} bg="#e4f9fd" />,
  },
];

export function ServiceCatalogLandingPanel({
  templateCount,
  categoryCount,
  aiCapabilityCount,
  productName,
  onOpenView,
}: {
  templateCount: number;
  categoryCount: number;
  aiCapabilityCount: number;
  productName?: string | undefined;
  onOpenView: (view: ServiceCatalogView) => void;
}) {
  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)' }}>
      <Stack spacing={2.25}>
        <Box>
          <PastelChip
            label={productName ? `Choosing for ${productName}` : 'Service-first product setup'}
            accent={productName ? appleColors.green : appleColors.purple}
            bg={productName ? '#e7f8ee' : '#f1efff'}
          />
          <Typography variant="h2" sx={{ mt: 1.25, mb: 0.75 }}>
            Choose the service path before the details
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 760, lineHeight: 1.7 }}>
            Start from a template, one focused workstream, or an AI integration option behind recommendations. Each choice opens a focused catalog view with a clear way back, so the owner sees the important path first and goes deeper only when ready.
          </Typography>
        </Box>
        <OwnerWorkspaceJourneyNav
          label="Service catalog entry paths"
          value={null}
          items={catalogViewItems({ templateCount, categoryCount, aiCapabilityCount })}
          onChange={onOpenView}
        />
      </Stack>
    </Surface>
  );
}

export function ServiceCatalogInternalHeader({
  view,
  productName,
  onBack,
}: {
  view: ServiceCatalogView;
  productName?: string | undefined;
  onBack: () => void;
}) {
  const titleByView: Record<ServiceCatalogView, string> = {
    templates: 'Launch Templates',
    services: 'Service Workstreams',
    ai: 'AI Integration Options',
  };
  const detailByView: Record<ServiceCatalogView, string> = {
    templates: 'Choose a bundled path, then continue into product setup or the active Planning.',
    services: 'Choose one workstream at a time, with the selected product context preserved when present.',
    ai: 'Review the AI support points that make service recommendations explainable and human-confirmed.',
  };

  return (
    <Surface sx={{ boxShadow: 'none', background: '#fff' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} justifyContent="space-between">
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1,
              bgcolor: '#f1efff',
              color: appleColors.purple,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            {view === 'templates' ? <LayersOutlined /> : view === 'services' ? <BuildCircleOutlined /> : <AutoAwesomeOutlined />}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
              <Typography variant="h3">{titleByView[view]}</Typography>
              {productName && <PastelChip label={productName} accent={appleColors.green} bg="#e7f8ee" />}
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
              {detailByView[view]}
            </Typography>
          </Box>
        </Stack>
        <Button variant="outlined" startIcon={<KeyboardBackspaceOutlined />} onClick={onBack} sx={{ minHeight: 40, alignSelf: { xs: 'flex-start', md: 'center' } }}>
          Service paths
        </Button>
      </Stack>
    </Surface>
  );
}

export function ServiceCatalogProductContextPanel({
  productName,
  startPlanHref,
}: {
  productName?: string | undefined;
  startPlanHref?: string | undefined;
}) {
  if (!productName) return null;

  return (
    <Surface sx={{ background: '#fbfdff' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} justifyContent="space-between">
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Inventory2Outlined sx={{ color: appleColors.green }} />
          <Box>
            <Typography sx={{ fontWeight: 950 }}>Product context is active</Typography>
            <Typography variant="body2" color="text.secondary">
              Service choices will stay attached to {productName}'s Planning.
            </Typography>
          </Box>
        </Stack>
        {startPlanHref && (
          <Button component={NextLink} href={startPlanHref} variant="outlined" startIcon={<PlaylistAddCheckOutlined />} sx={{ minHeight: 40 }}>
            Open Planning
          </Button>
        )}
      </Stack>
    </Surface>
  );
}
