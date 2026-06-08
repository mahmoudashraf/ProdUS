'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson, postJson } from './api';
import AdminDashboardContent from './AdminDashboardContent';
import ProductizationLaunchpad from './ProductizationLaunchpad';
import TeamDeliveryWorkspace from './TeamDeliveryWorkspace';
import {
  PageHeader,
  QueryState,
} from './PlatformComponents';
import { packageHealth } from './dashboardPresentation';
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
      <AdminDashboardContent
        activePackages={activePackages}
        averageHealth={averageHealth}
        blockedCount={blockedCount}
        canManageOperations={canManageOperations}
        deliveryConfig={deliveryConfig.data}
        deliveryCount={deliveries.data?.length || 0}
        isDispatchingDeliveries={dispatchDeliveries.isPending}
        isRunningSlaScan={runSlaScan.isPending}
        notifications={notifications.data?.latest || []}
        packageList={packageList}
        productList={productList}
        recommendations={recommendations.data || []}
        requirementCount={requirements.data?.length || 0}
        supportList={supportList}
        teams={teams.data || []}
        workspaceList={workspaceList}
        onDispatchDeliveries={() => dispatchDeliveries.mutate()}
        onRunSlaScan={() => runSlaScan.mutate()}
      />
    </>
  );
}
