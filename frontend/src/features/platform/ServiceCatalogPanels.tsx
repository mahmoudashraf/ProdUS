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
  SectionTitle,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { AICapabilityConfig } from './types';

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
    detail: 'Choose individual services by productization need.',
    accent: appleColors.blue,
    meta: <PastelChip label={`${categoryCount}`} accent={appleColors.blue} bg="#eaf3ff" />,
  },
  {
    value: 'ai',
    label: 'AI Contracts',
    detail: 'Review what the assistant can explain and recommend.',
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
            Choose the path before the details
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 760, lineHeight: 1.7 }}>
            Start from a template, one focused workstream, or the AI contract behind recommendations. Each choice opens a focused catalog view with a clear way back, so the owner sees the important path first and goes deeper only when ready.
          </Typography>
        </Box>
        <OwnerWorkspaceJourneyNav
          label="Service catalog entry paths"
          value={'templates'}
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
    ai: 'AI Contracts',
  };
  const detailByView: Record<ServiceCatalogView, string> = {
    templates: 'Choose a bundled path, then continue into product setup or the active product plan.',
    services: 'Choose one workstream at a time, with the selected product context preserved when present.',
    ai: 'Review the assistant contracts that make service recommendations explainable and human-confirmed.',
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
          Catalog choices
        </Button>
      </Stack>
    </Surface>
  );
}

export function ServiceCatalogProductContextPanel({
  productName,
  productHref,
}: {
  productName?: string | undefined;
  productHref?: string | undefined;
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
              Service choices will stay attached to {productName}'s Project Start Plan.
            </Typography>
          </Box>
        </Stack>
        {productHref && (
          <Button component={NextLink} href={productHref} variant="outlined" startIcon={<PlaylistAddCheckOutlined />} sx={{ minHeight: 40 }}>
            Back to product workspace
          </Button>
        )}
      </Stack>
    </Surface>
  );
}

export function ServiceCatalogFocusPanel({
  value,
  templateCount,
  categoryCount,
  aiCapabilityCount,
  onChange,
}: {
  value: ServiceCatalogView;
  templateCount: number;
  categoryCount: number;
  aiCapabilityCount: number;
  onChange: (view: ServiceCatalogView) => void;
}) {
  const items = catalogViewItems({ templateCount, categoryCount, aiCapabilityCount });

  return (
    <Surface>
      <SectionTitle title="Choose Catalog Focus" action={<PastelChip label="One choice at a time" accent={appleColors.purple} />} />
      <OwnerWorkspaceJourneyNav
        label="Service catalog focus"
        value={value}
        items={items}
        onChange={onChange}
      />
    </Surface>
  );
}

export function AiCatalogContractsPanel({
  aiCapabilities,
}: {
  aiCapabilities: AICapabilityConfig[];
}) {
  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f5fdff)' }}>
      <SectionTitle title="AI-Ready Catalog Contracts" />
      <Typography color="text.secondary" sx={{ lineHeight: 1.7, mb: 1.5 }}>
        The catalog exposes structured inputs, outputs, evidence requirements, testing gates, team capability signals, and human-review flags for the Studio assistant. AI can recommend and explain services, but product actions stay human-confirmed in ProdUS.
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {aiCapabilities.slice(0, 8).map((capability) => (
          <PastelChip
            key={capability.id}
            label={`${capability.name}: ${capability.enabled ? 'Enabled' : 'Prepared'}`}
            accent={capability.enabled ? appleColors.green : appleColors.cyan}
            bg={capability.enabled ? '#e7f8ee' : '#e4f9fd'}
          />
        ))}
        <PastelChip label={`Human review ${formatLabel('required')}`} accent={appleColors.purple} />
      </Stack>
    </Surface>
  );
}
