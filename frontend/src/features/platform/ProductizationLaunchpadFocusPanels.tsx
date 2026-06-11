'use client';

import NextLink from 'next/link';
import { AutoAwesomeOutlined } from '@mui/icons-material';
import { Button, Typography } from '@mui/material';
import { OwnerWorkspaceJourneyNav, WorkspaceBreadcrumbs, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import {
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
} from './PlatformComponents';
import type { LaunchpadJourneyValue } from './productizationLaunchpadModel';
import { PROJECT_START_PLAN_HREF } from './projectStartPlanLinks';

export function LaunchpadFocusPanel({
  draftServices,
  draftTalent,
  productCount,
  activeWorkspaceCount,
  value,
  onSelect,
}: {
  draftServices: number;
  draftTalent: number;
  productCount: number;
  activeWorkspaceCount: number;
  value: LaunchpadJourneyValue | null;
  onSelect: (value: LaunchpadJourneyValue) => void;
}) {
  const items: JourneyStepItem<LaunchpadJourneyValue>[] = [
    {
      value: 'plan',
      label: 'Review Planning',
      detail: 'Approve services and talent before opening a delivery workspace.',
      accent: appleColors.purple,
      meta: <PastelChip label={`${draftServices + draftTalent} selected`} accent={appleColors.purple} bg="#f1efff" />,
    },
    {
      value: 'products',
      label: 'Products',
      detail: 'Open product profiles and continue the readiness path.',
      accent: appleColors.cyan,
      meta: <PastelChip label={`${productCount}`} accent={appleColors.cyan} bg="#e4f9fd" />,
    },
    {
      value: 'workspaces',
      label: 'Workspaces',
      detail: 'Review active delivery spaces only when you need operations.',
      accent: appleColors.green,
      meta: <PastelChip label={`${activeWorkspaceCount} active`} accent={appleColors.green} bg="#e7f8ee" />,
    },
  ];

  return (
    <Surface>
      <SectionTitle title="Choose Focus" action={<PastelChip label="One path at a time" accent={appleColors.purple} />} />
      <OwnerWorkspaceJourneyNav
        label="Home focus"
        value={value}
        items={items}
        onChange={onSelect}
      />
    </Surface>
  );
}

export function LaunchpadDetailNavigation({
  currentLabel,
  onOpenHub,
}: {
  currentLabel: string;
  onOpenHub: () => void;
}) {
  return (
    <WorkspaceBreadcrumbs
      items={[
        { label: 'Home', onClick: onOpenHub },
        { label: currentLabel },
      ]}
      backLabel="Home"
      onBack={onOpenHub}
    />
  );
}

export function LaunchpadAiNextActionPanel({
  draftServices,
  hasProducts,
}: {
  draftServices: number;
  hasProducts: boolean;
}) {
  const href = draftServices ? PROJECT_START_PLAN_HREF : hasProducts ? '/dashboard?focus=products' : '/products/new';
  return (
    <Surface>
      <SectionTitle title="AI Next Best Action" action={<AutoAwesomeOutlined sx={{ color: appleColors.purple }} />} />
      <Typography variant="h4">
        {draftServices ? 'Review Planning' : hasProducts ? 'Choose the product to continue' : 'Create a product profile'}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
        {draftServices
          ? 'Planning already has services. Add matching delivery talent or start the workspace when the scope is clear.'
          : hasProducts
            ? 'Open the right Workspace first, then continue to its action plan, scanners, services, or share route.'
            : 'A product profile gives the platform enough context to recommend services, teams, and workspace steps.'}
      </Typography>
      <Button component={NextLink} href={href} variant="contained" sx={{ mt: 2, minHeight: 44 }}>
        Continue
      </Button>
    </Surface>
  );
}
