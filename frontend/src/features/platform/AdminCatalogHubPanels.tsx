'use client';

import { Box, Stack } from '@mui/material';
import { OwnerWorkspaceJourneyNav, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import {
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
} from './PlatformComponents';
import type { AdminCatalogView } from './adminCatalogModel';

export function AdminCatalogCoveragePanel({
  categoryCount,
  serviceCount,
  templateCount,
  ruleCount,
  aiContractCount,
}: {
  categoryCount: number;
  serviceCount: number;
  templateCount: number;
  ruleCount: number;
  aiContractCount: number;
}) {
  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8f7ff)' }}>
      <SectionTitle title="Catalog Coverage" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(5, minmax(0, 1fr))' }, gap: 1 }}>
        <PastelChip label={`${categoryCount} layers`} accent={appleColors.purple} />
        <PastelChip label={`${serviceCount} services`} accent={appleColors.cyan} bg="#e4f9fd" />
        <PastelChip label={`${templateCount} templates`} accent={appleColors.green} bg="#e7f8ee" />
        <PastelChip label={`${ruleCount} rules`} accent={appleColors.amber} bg="#fff4dc" />
        <PastelChip label={`${aiContractCount} AI settings`} accent={appleColors.blue} bg="#eaf3ff" />
      </Box>
    </Surface>
  );
}

export function AdminCatalogHubPanel({
  categoryCount,
  serviceCount,
  templateCount,
  ruleCount,
  aiContractCount,
  auditCount,
  onOpenView,
}: {
  categoryCount: number;
  serviceCount: number;
  templateCount: number;
  ruleCount: number;
  aiContractCount: number;
  auditCount: number;
  onOpenView: (view: AdminCatalogView) => void;
}) {
  const items: JourneyStepItem<AdminCatalogView>[] = [
    {
      value: 'categories',
      label: 'Categories',
      detail: 'Service taxonomy and service-code coverage.',
      accent: appleColors.purple,
      meta: <PastelChip label={`${categoryCount} layers`} accent={appleColors.purple} />,
    },
    {
      value: 'templates',
      label: 'Templates',
      detail: 'Bundled launch-hardening service recipes.',
      accent: appleColors.green,
      meta: <PastelChip label={`${templateCount}`} accent={appleColors.green} bg="#e7f8ee" />,
    },
    {
      value: 'rules',
      label: 'Rules',
      detail: 'Blocking and recommended service governance.',
      accent: appleColors.amber,
      meta: <PastelChip label={`${ruleCount}`} accent={appleColors.amber} bg="#fff4dc" />,
    },
    {
      value: 'ai',
      label: 'AI Setup',
      detail: 'AI capability settings and template definitions.',
      accent: appleColors.blue,
      meta: <PastelChip label={`${aiContractCount}`} accent={appleColors.blue} bg="#eaf3ff" />,
    },
    {
      value: 'audit',
      label: 'Audit Trail',
      detail: 'Governance changes and risk-level evidence.',
      accent: appleColors.cyan,
      meta: <PastelChip label={`${auditCount}`} accent={appleColors.cyan} bg="#e4f9fd" />,
    },
  ];

  return (
    <Stack spacing={2}>
      <AdminCatalogCoveragePanel
        categoryCount={categoryCount}
        serviceCount={serviceCount}
        templateCount={templateCount}
        ruleCount={ruleCount}
        aiContractCount={aiContractCount}
      />
      <Surface>
        <SectionTitle title="Choose Catalog Area" action={<PastelChip label="One admin task at a time" accent={appleColors.purple} />} />
        <OwnerWorkspaceJourneyNav
          label="Admin catalog sections"
          value={null}
          items={items}
          maxColumns={3}
          onChange={onOpenView}
        />
      </Surface>
    </Stack>
  );
}
