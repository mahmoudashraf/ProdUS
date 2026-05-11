'use client';

import { Box, Button, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson, postJson } from './api';
import { EmptyState, PageHeader, QueryState, StatusChip, Surface } from './PlatformComponents';
import {
  AIRecommendation,
  NotificationDelivery,
  NotificationDeliveryRun,
  NotificationSummary,
  PackageInstance,
  ProductProfile,
  ProjectWorkspace,
  RequirementIntake,
  SupportSlaRun,
  Team,
} from './types';

const metrics = [
  { label: 'Product profiles', endpoint: '/products' },
  { label: 'Requirements', endpoint: '/requirements' },
  { label: 'Packages', endpoint: '/packages' },
  { label: 'Teams', endpoint: '/teams' },
  { label: 'Workspaces', endpoint: '/workspaces' },
];

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canManageOperations = hasRole(UserRole.ADMIN);
  const products = useQuery({ queryKey: ['products'], queryFn: () => getJson<ProductProfile[]>('/products') });
  const requirements = useQuery({ queryKey: ['requirements'], queryFn: () => getJson<RequirementIntake[]>('/requirements') });
  const packages = useQuery({ queryKey: ['packages'], queryFn: () => getJson<PackageInstance[]>('/packages') });
  const teams = useQuery({ queryKey: ['teams'], queryFn: () => getJson<Team[]>('/teams') });
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: () => getJson<ProjectWorkspace[]>('/workspaces') });
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
  const runSlaScan = useMutation({
    mutationFn: () => postJson<SupportSlaRun, Record<string, never>>('/commerce/support-requests/sla/run', {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notification-summary'] });
      await queryClient.invalidateQueries({ queryKey: ['notification-deliveries'] });
    },
  });
  const dispatchDeliveries = useMutation({
    mutationFn: () => postJson<NotificationDeliveryRun, Record<string, never>>('/notifications/deliveries/dispatch', {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notification-deliveries'] });
    },
  });

  const counts = [products.data, requirements.data, packages.data, teams.data, workspaces.data];
  const loading = [products, requirements, packages, teams, workspaces].some((query) => query.isLoading);
  const error = [products, requirements, packages, teams, workspaces, deliveries].find((query) => query.error)?.error;

  return (
    <>
      <PageHeader
        title="ProdUS Dashboard"
        description="Track productization intake, package readiness, team supply, and workspace activity."
      />
      <QueryState isLoading={loading} error={error} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(5, minmax(0, 1fr))' },
          gap: 2,
          mb: 3,
        }}
      >
        {metrics.map((metric, index) => (
          <Surface key={metric.endpoint}>
            <Typography color="text.secondary" variant="body2">
              {metric.label}
            </Typography>
            <Typography variant="h2" sx={{ mt: 1 }}>
              {counts[index]?.length ?? 0}
            </Typography>
          </Surface>
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
        <Surface>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Action Center
          </Typography>
          {notifications.data?.latest?.length ? (
            <Stack spacing={1.5}>
              {notifications.data.latest.slice(0, 5).map((item) => (
                <Box key={item.id}>
                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Typography>{item.title}</Typography>
                    <StatusChip label={item.status} />
                  </Stack>
                  {item.body && (
                    <Typography variant="body2" color="text.secondary">
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
        <Surface>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Package Pipeline
          </Typography>
          {packages.data?.length ? (
            <Stack spacing={1.5}>
              {packages.data.slice(0, 5).map((item) => (
                <Stack key={item.id} direction="row" justifyContent="space-between" spacing={2}>
                  <Typography>{item.name}</Typography>
                  <StatusChip label={item.status} />
                </Stack>
              ))}
            </Stack>
          ) : (
            <EmptyState label="No packages have been generated yet." />
          )}
        </Surface>
        <Surface>
          <Typography variant="h4" sx={{ mb: 2 }}>
            AI Recommendation Audit
          </Typography>
          {recommendations.data?.length ? (
            <Stack spacing={1.5}>
              {recommendations.data.slice(0, 5).map((item) => (
                <Box key={item.id}>
                  <Typography>{item.recommendationType}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.rationale || 'No rationale recorded.'}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <EmptyState label="No AI recommendation events have been recorded." />
          )}
        </Surface>
        {canManageOperations && (
          <Surface>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h4">Operations</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="outlined" size="small" onClick={() => runSlaScan.mutate()} disabled={runSlaScan.isPending}>
                  Run SLA
                </Button>
                <Button variant="outlined" size="small" onClick={() => dispatchDeliveries.mutate()} disabled={dispatchDeliveries.isPending}>
                  Dispatch
                </Button>
              </Stack>
            </Stack>
            <Stack spacing={1.5}>
              {runSlaScan.data && (
                <Typography variant="body2" color="text.secondary">
                  SLA: {runSlaScan.data.scannedCount} scanned · {runSlaScan.data.escalatedCount} escalated
                </Typography>
              )}
              {dispatchDeliveries.data && (
                <Typography variant="body2" color="text.secondary">
                  Delivery: {dispatchDeliveries.data.sentCount} sent · {dispatchDeliveries.data.failedCount} failed
                </Typography>
              )}
              {deliveries.data?.length ? (
                deliveries.data.slice(0, 5).map((delivery) => (
                  <Box key={delivery.id}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                      <Typography>{delivery.notificationTitle}</Typography>
                      <StatusChip label={delivery.status} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {delivery.channel.toLowerCase()} · {delivery.recipient?.email || delivery.destination}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No notification deliveries have been queued.
                </Typography>
              )}
            </Stack>
          </Surface>
        )}
      </Box>
    </>
  );
}
