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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson, postJson } from './api';
import ProductizationLaunchpad from './ProductizationLaunchpad';
import TeamDeliveryWorkspace from './TeamDeliveryWorkspace';
import {
  DotLabel,
  EmptyState,
  MetricTile,
  PageHeader,
  PastelChip,
  ProgressRing,
  QueryState,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  categoryPalette,
  clampScore,
  formatLabel,
} from './PlatformComponents';
import {
  AIRecommendation,
  NotificationDelivery,
  NotificationDeliveryConfig,
  NotificationDeliveryRun,
  NotificationSummary,
  PackageInstance,
  ProductProfile,
  ProjectWorkspace,
  RequirementIntake,
  SupportRequest,
  SupportSlaRun,
  Team,
} from './types';

const statusAccent = (status?: string) => {
  if (!status) return appleColors.purple;
  if (status.includes('BLOCK') || status.includes('CRITICAL') || status.includes('OVERDUE')) return appleColors.red;
  if (status.includes('RISK') || status.includes('WAIT') || status.includes('REVIEW') || status.includes('DUE')) return appleColors.amber;
  if (status.includes('ACTIVE') || status.includes('ACCEPT') || status.includes('DELIVER') || status.includes('RESOLVED')) return appleColors.green;
  return appleColors.purple;
};

const packageHealth = (item: PackageInstance, index: number) => {
  const base = item.status === 'DELIVERED' ? 96 : item.status === 'ACTIVE_DELIVERY' ? 78 : item.status === 'MILESTONE_REVIEW' ? 72 : 64;
  return clampScore(base - index * 3);
};

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === UserRole.PRODUCT_OWNER) {
    return <ProductizationLaunchpad />;
  }

  if (user?.role === UserRole.TEAM_MANAGER || user?.role === UserRole.SPECIALIST || user?.role === UserRole.ADVISOR) {
    return <TeamDeliveryWorkspace />;
  }

  return <AdminOperationsDashboard />;
}

function AdminOperationsDashboard() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canManageOperations = hasRole(UserRole.ADMIN);
  const products = useQuery({ queryKey: ['products'], queryFn: () => getJson<ProductProfile[]>('/products') });
  const requirements = useQuery({ queryKey: ['requirements'], queryFn: () => getJson<RequirementIntake[]>('/requirements') });
  const packages = useQuery({ queryKey: ['packages'], queryFn: () => getJson<PackageInstance[]>('/packages') });
  const teams = useQuery({ queryKey: ['teams'], queryFn: () => getJson<Team[]>('/teams') });
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: () => getJson<ProjectWorkspace[]>('/workspaces') });
  const supportRequests = useQuery({
    queryKey: ['commerce-support-requests'],
    queryFn: () => getJson<SupportRequest[]>('/commerce/support-requests'),
    retry: false,
  });
  const recommendations = useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: () => getJson<AIRecommendation[]>('/ai/recommendations'),
    retry: false,
  });
  const notifications = useQuery({
    queryKey: ['notification-summary'],
    queryFn: () => getJson<NotificationSummary>('/notifications/summary'),
    retry: false,
  });
  const deliveries = useQuery({
    queryKey: ['notification-deliveries'],
    queryFn: () => getJson<NotificationDelivery[]>('/notifications/deliveries'),
    enabled: canManageOperations,
    retry: false,
  });
  const deliveryConfig = useQuery({
    queryKey: ['notification-delivery-config'],
    queryFn: () => getJson<NotificationDeliveryConfig>('/notifications/deliveries/config'),
    enabled: canManageOperations,
    retry: false,
  });
  const runSlaScan = useMutation({
    mutationFn: () => postJson<SupportSlaRun, Record<string, never>>('/commerce/support-requests/sla/run', {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notification-summary'] });
      await queryClient.invalidateQueries({ queryKey: ['notification-deliveries'] });
      await queryClient.invalidateQueries({ queryKey: ['commerce-support-requests'] });
    },
  });
  const dispatchDeliveries = useMutation({
    mutationFn: () => postJson<NotificationDeliveryRun, Record<string, never>>('/notifications/deliveries/dispatch', {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notification-deliveries'] });
    },
  });

  const packageList = packages.data || [];
  const productList = products.data || [];
  const workspaceList = workspaces.data || [];
  const supportList = supportRequests.data || [];
  const blockedCount = supportList.filter((request) => request.priority === 'URGENT' || request.slaStatus === 'OVERDUE').length;
  const averageHealth = packageList.length
    ? Math.round(packageList.reduce((total, item, index) => total + packageHealth(item, index), 0) / packageList.length)
    : 0;
  const activePackages = packageList.filter((item) => item.status === 'ACTIVE_DELIVERY' || item.status === 'MILESTONE_REVIEW').length;
  const loading = [products, requirements, packages, teams, workspaces].some((query) => query.isLoading);
  const error = [products, requirements, packages, teams, workspaces, supportRequests, deliveries, deliveryConfig].find((query) => query.error)?.error;

  return (
    <>
      <PageHeader
        title="Admin Control"
        description="Operate the platform catalog, portfolio visibility, verified team supply, AI audit trail, notification delivery, and SLA health."
      />
      <QueryState isLoading={loading} error={error} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 330px' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
            <MetricTile
              label="Total products"
              value={productList.length}
              detail={`${requirements.data?.length || 0} requirement intakes`}
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

          <Surface>
            <SectionTitle
              title="Service Plan Pipeline"
              action={<PastelChip label={`${packageList.length} service plans`} accent={appleColors.purple} />}
            />
            {packageList.length ? (
              <Stack spacing={0}>
                {packageList.slice(0, 6).map((item, index) => {
                  const health = packageHealth(item, index);
                  const accent = statusAccent(item.status);

                  return (
                    <Box
                      key={item.id}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '76px 1fr', md: '88px 1.2fr 1.6fr 1fr auto' },
                        gap: 2,
                        alignItems: 'center',
                        py: 2,
                        borderTop: index === 0 ? 0 : '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <ProgressRing value={health} color={accent} label="health" />
                      <Box>
                        <Typography variant="h4">{item.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.summary || 'Service plan summary pending.'}
                        </Typography>
                      </Box>
                      <Box>
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
              <EmptyState label="No service plans yet. Create a product brief or convert the draft cart to activate delivery tracking." />
            )}
          </Surface>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
            <Surface>
              <SectionTitle title="AI Recommendation Audit" action={<AutoAwesomeOutlined sx={{ color: appleColors.purple }} />} />
              {recommendations.data?.length ? (
                <Stack spacing={1.5}>
                  {recommendations.data.slice(0, 4).map((item) => (
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
            <Surface>
              <SectionTitle title="Verified Team Supply" action={<PastelChip label={`${teams.data?.length || 0} teams`} accent={appleColors.cyan} />} />
              {teams.data?.length ? (
                <Stack spacing={1.5}>
                  {teams.data.slice(0, 4).map((team, index) => {
                    const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
                    return (
                      <Stack key={team.id} direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={1.25} alignItems="center">
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
                            }}
                          >
                            {team.name.charAt(0)}
                          </Box>
                          <Box>
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
          </Box>
        </Stack>

        <Stack spacing={2.5}>
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
            <SectionTitle title="Action Center" action={<NotificationsNoneOutlined sx={{ color: appleColors.blue }} />} />
            {notifications.data?.latest?.length ? (
              <Stack spacing={1.5}>
                {notifications.data.latest.slice(0, 5).map((item) => (
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
                {supportList.slice(0, 4).map((request) => (
                  <Stack key={request.id} direction="row" spacing={1.25} alignItems="flex-start" justifyContent="space-between">
                    <Box>
                      <Typography sx={{ fontWeight: 800 }}>{request.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {request.workspace?.name || 'Workspace'} · {formatLabel(request.slaStatus)}
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

          {canManageOperations && (
            <Surface>
              <SectionTitle title="Operations" />
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Button variant="outlined" size="small" onClick={() => runSlaScan.mutate()} disabled={runSlaScan.isPending}>
                  Run SLA
                </Button>
                <Button variant="outlined" size="small" onClick={() => dispatchDeliveries.mutate()} disabled={dispatchDeliveries.isPending}>
                  Dispatch
                </Button>
              </Stack>
              {deliveryConfig.data && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                  <PastelChip
                    label={`Email ${deliveryConfig.data.emailProviderConfigured ? deliveryConfig.data.emailProvider : 'disabled'}`}
                    accent={deliveryConfig.data.emailProviderConfigured ? appleColors.green : appleColors.amber}
                  />
                  <PastelChip
                    label={`Push ${deliveryConfig.data.pushProviderConfigured ? deliveryConfig.data.pushProvider : 'disabled'}`}
                    accent={deliveryConfig.data.pushProviderConfigured ? appleColors.green : appleColors.amber}
                  />
                </Stack>
              )}
              <Typography variant="body2" color="text.secondary">
                {deliveries.data?.length ? `${deliveries.data.length} notification deliveries queued or processed.` : 'No notification deliveries queued.'}
              </Typography>
            </Surface>
          )}
        </Stack>
      </Box>
    </>
  );
}
