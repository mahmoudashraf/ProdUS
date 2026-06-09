'use client';

import {
  CheckCircleOutlineOutlined,
  Inventory2Outlined,
  LocalShippingOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { Box, Stack } from '@mui/material';
import { OwnerWorkspaceJourneyNav, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import {
  MetricTile,
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
} from './PlatformComponents';
import type {
  AIRecommendation,
  PackageInstance,
  PlatformNotification,
  ProductProfile,
  ProjectWorkspace,
  SupportRequest,
  Team,
} from './types';
import type { AdminControlView } from './adminControlModel';

export function AdminControlMetricsPanel({
  activePackages,
  averageHealth,
  blockedCount,
  packageList,
  productList,
  requirementCount,
  supportList,
  workspaceList,
}: {
  activePackages: number;
  averageHealth: number;
  blockedCount: number;
  packageList: PackageInstance[];
  productList: ProductProfile[];
  requirementCount: number;
  supportList: SupportRequest[];
  workspaceList: ProjectWorkspace[];
}) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
      <MetricTile
        label="Total products"
        value={productList.length}
        detail={`${requirementCount} requirement intakes`}
        accent={appleColors.purple}
        icon={<Inventory2Outlined />}
        sparkline
      />
      <MetricTile
        label="Portfolio health"
        value={`${averageHealth || 68}/100`}
        detail={packageList.length ? 'Derived from service-plan states' : 'Seed demo data for local review'}
        accent={appleColors.green}
        icon={<CheckCircleOutlineOutlined />}
        sparkline
      />
      <MetricTile
        label="In delivery"
        value={activePackages}
        detail={`${workspaceList.length} active workspaces`}
        accent={appleColors.blue}
        icon={<LocalShippingOutlined />}
        sparkline
      />
      <MetricTile
        label="Needs attention"
        value={blockedCount}
        detail={`${supportList.length} support requests tracked`}
        accent={blockedCount ? appleColors.red : appleColors.amber}
        icon={<WarningAmberOutlined />}
        sparkline
      />
    </Box>
  );
}

export function AdminControlHubPanel({
  activePackages,
  averageHealth,
  blockedCount,
  canManageOperations,
  deliveryCount,
  notifications,
  packageList,
  productList,
  recommendations,
  requirementCount,
  supportList,
  teams,
  workspaceList,
  onOpenView,
}: {
  activePackages: number;
  averageHealth: number;
  blockedCount: number;
  canManageOperations: boolean;
  deliveryCount: number;
  notifications: PlatformNotification[];
  packageList: PackageInstance[];
  productList: ProductProfile[];
  recommendations: AIRecommendation[];
  requirementCount: number;
  supportList: SupportRequest[];
  teams: Team[];
  workspaceList: ProjectWorkspace[];
  onOpenView: (view: AdminControlView) => void;
}) {
  const items: JourneyStepItem<AdminControlView>[] = [
    {
      value: 'pipeline',
      label: 'Service Pipeline',
      detail: 'Service plans, delivery state, and workspace health.',
      accent: appleColors.purple,
      meta: <PastelChip label={`${packageList.length} plans`} accent={appleColors.purple} />,
    },
    {
      value: 'ai',
      label: 'AI And Portfolio',
      detail: 'Portfolio health summary and recent recommendation signals.',
      accent: appleColors.blue,
      meta: <PastelChip label={`${recommendations.length} AI events`} accent={appleColors.blue} bg="#eaf3ff" />,
    },
    {
      value: 'teams',
      label: 'Team Supply',
      detail: 'Verified delivery teams available to the platform.',
      accent: appleColors.cyan,
      meta: <PastelChip label={`${teams.length} teams`} accent={appleColors.cyan} bg="#e4f9fd" />,
    },
    {
      value: 'alerts',
      label: 'Alerts',
      detail: 'Notifications, support requests, and attention queue.',
      accent: blockedCount ? appleColors.red : appleColors.amber,
      meta: <PastelChip label={`${notifications.length + supportList.length} items`} accent={blockedCount ? appleColors.red : appleColors.amber} bg={blockedCount ? '#fff1f2' : '#fff4dc'} />,
    },
  ];

  if (canManageOperations) {
    items.push({
      value: 'operations',
      label: 'Operations',
      detail: 'SLA scan, delivery dispatch, and notification providers.',
      accent: appleColors.green,
      meta: <PastelChip label={`${deliveryCount} deliveries`} accent={appleColors.green} bg="#e7f8ee" />,
    });
  }

  return (
    <Stack spacing={2.5}>
      <AdminControlMetricsPanel
        activePackages={activePackages}
        averageHealth={averageHealth}
        blockedCount={blockedCount}
        packageList={packageList}
        productList={productList}
        requirementCount={requirementCount}
        supportList={supportList}
        workspaceList={workspaceList}
      />

      <Surface>
        <SectionTitle title="Choose Control Area" action={<PastelChip label="One admin decision at a time" accent={appleColors.purple} />} />
        <OwnerWorkspaceJourneyNav
          label="Admin control sections"
          value={null}
          items={items}
          maxColumns={3}
          onChange={onOpenView}
        />
      </Surface>
    </Stack>
  );
}
