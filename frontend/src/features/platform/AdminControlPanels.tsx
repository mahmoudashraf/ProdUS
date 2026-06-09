'use client';

import {
  AutoAwesomeOutlined,
  CheckCircleOutlineOutlined,
  Inventory2Outlined,
  LocalShippingOutlined,
  NotificationsNoneOutlined,
  ShieldOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
import { OwnerWorkspaceJourneyNav, WorkspaceBreadcrumbs, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import {
  DotLabel,
  EmptyState,
  MetricTile,
  PastelChip,
  ProgressRing,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  categoryPalette,
  formatLabel,
} from './PlatformComponents';
import { packageHealth, statusAccent } from './dashboardPresentation';
import type {
  AIRecommendation,
  NotificationDeliveryConfig,
  PackageInstance,
  PlatformNotification,
  ProductProfile,
  ProjectWorkspace,
  SupportRequest,
  Team,
} from './types';

export type AdminControlView = 'pipeline' | 'ai' | 'teams' | 'alerts' | 'operations';

export const isAdminControlView = (value: string | null): value is AdminControlView =>
  value === 'pipeline' || value === 'ai' || value === 'teams' || value === 'alerts' || value === 'operations';

const adminControlViewLabel: Record<AdminControlView, string> = {
  pipeline: 'Service Pipeline',
  ai: 'AI And Portfolio',
  teams: 'Team Supply',
  alerts: 'Alerts',
  operations: 'Operations',
};

export function AdminControlBreadcrumb({
  view,
  onOpenHub,
}: {
  view: AdminControlView;
  onOpenHub: () => void;
}) {
  return (
    <WorkspaceBreadcrumbs
      items={[
        { label: 'Admin Control', onClick: onOpenHub },
        { label: adminControlViewLabel[view] },
      ]}
      backLabel="Admin home"
      onBack={onOpenHub}
    />
  );
}

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

export function AdminServicePlanPipelinePanel({
  packageList,
}: {
  packageList: PackageInstance[];
}) {
  return (
    <Surface>
      <SectionTitle
        title="Service Plan Pipeline"
        action={<PastelChip label={`${packageList.length} service plans`} accent={appleColors.purple} />}
      />
      {packageList.length ? (
        <Stack spacing={0}>
          {packageList.slice(0, 8).map((item, index) => {
            const health = packageHealth(item, index);
            const accent = statusAccent(item.status);

            return (
              <Box
                key={item.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '88px minmax(0, 1.2fr) minmax(0, 1.6fr) 1fr auto' },
                  gap: 2,
                  alignItems: { xs: 'flex-start', md: 'center' },
                  py: 2,
                  borderTop: index === 0 ? 0 : '1px solid',
                  borderColor: 'divider',
                }}
              >
                <ProgressRing value={health} color={accent} label="health" />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h4">{item.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.summary || 'Service plan summary pending.'}
                  </Typography>
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800 }}>{item.productProfile?.name || 'Product'}</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={health}
                    sx={{
                      mt: 1,
                      height: 7,
                      borderRadius: 999,
                      bgcolor: '#edf1f7',
                      '& .MuiLinearProgress-bar': { bgcolor: accent, borderRadius: 999 },
                    }}
                  />
                </Box>
                <DotLabel label={formatLabel(item.status)} color={accent} />
                <StatusChip label={item.status} />
              </Box>
            );
          })}
        </Stack>
      ) : (
        <EmptyState label="No service plans yet. Create a product brief or approve the start plan to activate delivery tracking." />
      )}
    </Surface>
  );
}

export function AdminAiPortfolioPanel({
  averageHealth,
  recommendations,
}: {
  averageHealth: number;
  recommendations: AIRecommendation[];
}) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '360px minmax(0, 1fr)' }, gap: 2, alignItems: 'start' }}>
      <Surface>
        <SectionTitle title="AI Portfolio Summary" action={<ShieldOutlined sx={{ color: appleColors.purple }} />} />
        <Stack direction="row" spacing={2} alignItems="center">
          <ProgressRing value={averageHealth || 68} size={92} color={appleColors.purple} label="/100" />
          <Box>
            <Typography variant="h4">Good portfolio health</Typography>
            <Typography color="success.main" sx={{ fontWeight: 800, mt: 0.5 }}>
              +6 pts vs last 7 days
            </Typography>
          </Box>
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.7 }}>
          Focus on blocked support requests, release evidence, and service-plan modules that are still in review.
        </Typography>
      </Surface>

      <Surface>
        <SectionTitle title="AI Recommendation Audit" action={<AutoAwesomeOutlined sx={{ color: appleColors.purple }} />} />
        {recommendations.length ? (
          <Stack spacing={1.5}>
            {recommendations.slice(0, 6).map((item) => (
              <Box key={item.id} sx={{ pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 800 }}>{formatLabel(item.recommendationType)}</Typography>
                  <PastelChip label={`${Math.round((item.confidence || 0) * 100)}%`} accent={appleColors.green} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
                  {item.rationale || 'Recommendation captured without rationale.'}
                </Typography>
              </Box>
            ))}
          </Stack>
        ) : (
          <EmptyState label="No AI recommendation events have been recorded." />
        )}
      </Surface>
    </Box>
  );
}

export function AdminTeamSupplyPanel({
  teams,
}: {
  teams: Team[];
}) {
  return (
    <Surface>
      <SectionTitle title="Verified Team Supply" action={<PastelChip label={`${teams.length} teams`} accent={appleColors.cyan} />} />
      {teams.length ? (
        <Stack spacing={1.5}>
          {teams.map((team, index) => {
            const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
            return (
              <Stack key={team.id} direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 1,
                      bgcolor: `${palette.accent}14`,
                      color: palette.accent,
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 900,
                      flex: '0 0 auto',
                    }}
                  >
                    {team.name.charAt(0)}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }}>{team.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {team.typicalProjectSize || team.timezone || 'Verified team'}
                    </Typography>
                  </Box>
                </Stack>
                <StatusChip label={team.verificationStatus} color="success" />
              </Stack>
            );
          })}
        </Stack>
      ) : (
        <EmptyState label="No teams are available." />
      )}
    </Surface>
  );
}

export function AdminAlertsPanel({
  blockedCount,
  notifications,
  supportList,
}: {
  blockedCount: number;
  notifications: PlatformNotification[];
  supportList: SupportRequest[];
}) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) 360px' }, gap: 2, alignItems: 'start' }}>
      <Surface>
        <SectionTitle title="Action Center" action={<NotificationsNoneOutlined sx={{ color: appleColors.blue }} />} />
        {notifications.length ? (
          <Stack spacing={1.5}>
            {notifications.slice(0, 8).map((item) => (
              <Box key={item.id} sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Typography sx={{ fontWeight: 800 }}>{item.title}</Typography>
                  <StatusChip label={item.priority} color={item.priority === 'CRITICAL' ? 'error' : 'default'} />
                </Stack>
                {item.body && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {item.body}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        ) : (
          <EmptyState label="No platform notifications require attention." />
        )}
      </Surface>

      <Surface sx={{ background: blockedCount ? '#fff7f8' : '#f6fffb' }}>
        <SectionTitle title="Recent Alerts" />
        {supportList.length ? (
          <Stack spacing={1.5}>
            {supportList.slice(0, 6).map((request) => (
              <Stack key={request.id} direction="row" spacing={1.25} alignItems="flex-start" justifyContent="space-between">
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800 }}>{request.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {request.workspace?.name || 'Workspace'} / {formatLabel(request.slaStatus)}
                  </Typography>
                </Box>
                <PastelChip label={formatLabel(request.priority)} accent={statusAccent(request.priority)} />
              </Stack>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No open support alerts.
          </Typography>
        )}
      </Surface>
    </Box>
  );
}

export function AdminOperationsPanel({
  deliveryConfig,
  deliveryCount,
  isDispatchingDeliveries,
  isRunningSlaScan,
  onDispatchDeliveries,
  onRunSlaScan,
}: {
  deliveryConfig?: NotificationDeliveryConfig | undefined;
  deliveryCount: number;
  isDispatchingDeliveries: boolean;
  isRunningSlaScan: boolean;
  onDispatchDeliveries: () => void;
  onRunSlaScan: () => void;
}) {
  return (
    <Surface>
      <SectionTitle title="Operations" />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={onRunSlaScan} disabled={isRunningSlaScan} sx={{ minHeight: 42 }}>
          Run SLA
        </Button>
        <Button variant="outlined" onClick={onDispatchDeliveries} disabled={isDispatchingDeliveries} sx={{ minHeight: 42 }}>
          Dispatch
        </Button>
      </Stack>
      {deliveryConfig && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
          <PastelChip
            label={`Email ${deliveryConfig.emailProviderConfigured ? deliveryConfig.emailProvider : 'disabled'}`}
            accent={deliveryConfig.emailProviderConfigured ? appleColors.green : appleColors.amber}
          />
          <PastelChip
            label={`Push ${deliveryConfig.pushProviderConfigured ? deliveryConfig.pushProvider : 'disabled'}`}
            accent={deliveryConfig.pushProviderConfigured ? appleColors.green : appleColors.amber}
          />
        </Stack>
      )}
      <Typography variant="body2" color="text.secondary">
        {deliveryCount ? `${deliveryCount} notification deliveries queued or processed.` : 'No notification deliveries queued.'}
      </Typography>
    </Surface>
  );
}
