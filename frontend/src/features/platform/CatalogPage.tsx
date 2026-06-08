'use client';

import NextLink from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson, postJson } from './api';
import { PageHeader, QueryState } from './PlatformComponents';
import {
  AiCatalogContractsPanel,
  ServiceCatalogFocusPanel,
  type ServiceCatalogView,
  isServiceCatalogView,
} from './ServiceCatalogPanels';
import PackageTemplatesPanel from './ServiceCatalogTemplatePanel';
import ServiceWorkstreamsPanel from './ServiceCatalogWorkstreamsPanel';
import { PROJECT_START_PLAN_HREF } from './projectStartPlanLinks';
import type { AICapabilityConfig, PackageTemplate, ProductizationCart, ServiceCategory, ServiceModule } from './types';

export default function CatalogPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams?.toString() || '';
  const viewParam = searchParams?.get('view') || null;
  const catalogView: ServiceCatalogView = isServiceCatalogView(viewParam) ? viewParam : 'templates';
  const queryClient = useQueryClient();
  const { isLoggedIn, user } = useAuth();
  const canUseStartPlan = user?.role === UserRole.PRODUCT_OWNER;
  const startPlanHref = canUseStartPlan ? PROJECT_START_PLAN_HREF : isLoggedIn ? '/dashboard' : '/login';
  const startPlanActionLabel = canUseStartPlan ? 'Project Start Plan' : isLoggedIn ? 'Open dashboard' : 'Sign in to start';

  const categories = useQuery({
    queryKey: ['catalog-categories'],
    queryFn: () => getJson<ServiceCategory[]>('/catalog/categories'),
  });
  const modules = useQuery({
    queryKey: ['catalog-modules'],
    queryFn: () => getJson<ServiceModule[]>('/catalog/modules'),
  });
  const packageTemplates = useQuery({
    queryKey: ['catalog-package-templates'],
    queryFn: () => getJson<PackageTemplate[]>('/catalog/package-templates'),
  });
  const aiCapabilities = useQuery({
    queryKey: ['catalog-ai-capabilities'],
    queryFn: () => getJson<AICapabilityConfig[]>('/catalog/ai-capabilities'),
  });
  const startPlan = useQuery({
    queryKey: ['productization-cart'],
    enabled: canUseStartPlan,
    queryFn: () => getJson<ProductizationCart>('/productization-cart/current'),
  });
  const chooseService = useMutation({
    mutationFn: (payload: { serviceModuleId: string; notes: string }) => postJson<ProductizationCart, { serviceModuleId: string; notes: string }>('/productization-cart/services', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const useTemplate = useMutation({
    mutationFn: (templateId: string) => postJson<ProductizationCart, Record<string, never>>(`/productization-cart/templates/${templateId}/apply`, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });

  const modulesByCategory = (modules.data || []).reduce<Record<string, ServiceModule[]>>((grouped, module) => {
    const categoryId = module.category?.id || 'unknown';
    grouped[categoryId] = [...(grouped[categoryId] || []), module];
    return grouped;
  }, {});
  const catalogCategories = (categories.data || []).filter(
    (category) => category.slug.trim().length > 2 && category.name.trim().length > 2
  );
  const cartServiceIds = new Set((startPlan.data?.serviceItems || []).map((item) => item.serviceModule.id));

  const openCatalogView = (view: ServiceCatalogView) => {
    const next = new URLSearchParams(searchParamString);
    next.set('view', view);
    router.push(`${pathname || '/services'}?${next.toString()}`, { scroll: false });
  };

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Service Catalog"
        description="Choose the productization work that belongs in the Start Plan: a launch template, an individual workstream, or the AI contract behind a recommendation."
        action={
          <Button
            component={NextLink}
            href={startPlanHref}
            variant="contained"
            sx={{ minHeight: 42, minWidth: 140 }}
          >
            {startPlanActionLabel}
          </Button>
        }
      />
      <QueryState
        isLoading={categories.isLoading || modules.isLoading || packageTemplates.isLoading}
        error={categories.error || modules.error || packageTemplates.error || aiCapabilities.error || chooseService.error || useTemplate.error}
      />
      {chooseService.isSuccess && (
        <Alert severity="success" sx={{ borderRadius: 1 }}>
          Service chosen for the start plan. Open the plan when you are ready to select a product, compare teams, or start a workspace.
        </Alert>
      )}
      {useTemplate.isSuccess && (
        <Alert severity="success" sx={{ borderRadius: 1 }}>
          Template added to the start plan. Open the plan to resolve dependencies, select product context, and start a workspace.
        </Alert>
      )}

      <ServiceCatalogFocusPanel
        value={catalogView}
        templateCount={packageTemplates.data?.length || 0}
        categoryCount={catalogCategories.length}
        aiCapabilityCount={aiCapabilities.data?.length || 0}
        onChange={openCatalogView}
      />

      {catalogView === 'templates' && (
        <PackageTemplatesPanel
          packageTemplates={packageTemplates.data || []}
          cartServiceIds={cartServiceIds}
          canUseProjectCart={canUseStartPlan}
          isLoggedIn={isLoggedIn}
          cartHref={startPlanHref}
          isApplyingTemplate={useTemplate.isPending}
          onApplyTemplate={(templateId) => useTemplate.mutate(templateId)}
        />
      )}

      {catalogView === 'services' && (
        <ServiceWorkstreamsPanel
          catalogCategories={catalogCategories}
          modulesByCategory={modulesByCategory}
          cartServiceIds={cartServiceIds}
          canUseProjectCart={canUseStartPlan}
          isLoggedIn={isLoggedIn}
          isChoosingService={chooseService.isPending}
          onChooseService={(serviceModuleId, notes) => chooseService.mutate({ serviceModuleId, notes })}
        />
      )}

      {catalogView === 'ai' && (
        <AiCatalogContractsPanel aiCapabilities={aiCapabilities.data || []} />
      )}
    </Stack>
  );
}
