'use client';

import { Stack } from '@mui/material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AdminAiPortfolioPanel,
  AdminAlertsPanel,
  AdminControlBreadcrumb,
  AdminControlHubPanel,
  AdminOperationsPanel,
  AdminServicePlanPipelinePanel,
  AdminTeamSupplyPanel,
  type AdminControlView,
  isAdminControlView,
} from './AdminControlPanels';
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

export default function AdminDashboardContent({
  activePackages,
  averageHealth,
  blockedCount,
  canManageOperations,
  deliveryConfig,
  deliveryCount,
  isDispatchingDeliveries,
  isRunningSlaScan,
  notifications,
  packageList,
  productList,
  recommendations,
  requirementCount,
  supportList,
  teams,
  workspaceList,
  onDispatchDeliveries,
  onRunSlaScan,
}: {
  activePackages: number;
  averageHealth: number;
  blockedCount: number;
  canManageOperations: boolean;
  deliveryConfig?: NotificationDeliveryConfig | undefined;
  deliveryCount: number;
  isDispatchingDeliveries: boolean;
  isRunningSlaScan: boolean;
  notifications: PlatformNotification[];
  packageList: PackageInstance[];
  productList: ProductProfile[];
  recommendations: AIRecommendation[];
  requirementCount: number;
  supportList: SupportRequest[];
  teams: Team[];
  workspaceList: ProjectWorkspace[];
  onDispatchDeliveries: () => void;
  onRunSlaScan: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams?.toString() || '';
  const viewParam = searchParams?.get('view') || null;
  const activeView = isAdminControlView(viewParam) ? viewParam : null;

  const openView = (view: AdminControlView) => {
    const next = new URLSearchParams(searchParamString);
    next.set('view', view);
    router.push(`${pathname || '/dashboard'}?${next.toString()}`, { scroll: false });
  };

  const openHub = () => {
    const next = new URLSearchParams(searchParamString);
    next.delete('view');
    const query = next.toString();
    router.push(query ? `${pathname || '/dashboard'}?${query}` : (pathname || '/dashboard'), { scroll: false });
  };

  return (
    <>
      {!activeView && (
        <AdminControlHubPanel
          activePackages={activePackages}
          averageHealth={averageHealth}
          blockedCount={blockedCount}
          canManageOperations={canManageOperations}
          deliveryCount={deliveryCount}
          notifications={notifications}
          packageList={packageList}
          productList={productList}
          recommendations={recommendations}
          requirementCount={requirementCount}
          supportList={supportList}
          teams={teams}
          workspaceList={workspaceList}
          onOpenView={openView}
        />
      )}

      {activeView && (
        <Stack spacing={2}>
          <AdminControlBreadcrumb view={activeView} onOpenHub={openHub} />

          {activeView === 'pipeline' && (
            <AdminServicePlanPipelinePanel packageList={packageList} />
          )}

          {activeView === 'ai' && (
            <AdminAiPortfolioPanel averageHealth={averageHealth} recommendations={recommendations} />
          )}

          {activeView === 'teams' && (
            <AdminTeamSupplyPanel teams={teams} />
          )}

          {activeView === 'alerts' && (
            <AdminAlertsPanel blockedCount={blockedCount} notifications={notifications} supportList={supportList} />
          )}

          {activeView === 'operations' && canManageOperations && (
            <AdminOperationsPanel
              deliveryConfig={deliveryConfig}
              deliveryCount={deliveryCount}
              isDispatchingDeliveries={isDispatchingDeliveries}
              isRunningSlaScan={isRunningSlaScan}
              onDispatchDeliveries={onDispatchDeliveries}
              onRunSlaScan={onRunSlaScan}
            />
          )}
        </Stack>
      )}
    </>
  );
}
