'use client';

import { Stack, Typography } from '@mui/material';
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
  const items: JourneyStepItem<ServiceCatalogView>[] = [
    {
      value: 'templates',
      label: 'Launch Templates',
      detail: 'Use a bundled path when the owner wants a quick start.',
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
