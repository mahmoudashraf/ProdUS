'use client';

import NextLink from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson, postJson, putJson } from './api';
import { PageHeader, QueryState } from './PlatformComponents';
import {
  AiServiceOptionsPanel,
  ServiceCatalogInternalHeader,
  ServiceCatalogLandingPanel,
  ServiceCatalogProductContextPanel,
  type ServiceCatalogView,
  isServiceCatalogView,
} from './ServiceCatalogPanels';
import PackageTemplatesPanel from './ServiceCatalogTemplatePanel';
import ServiceWorkstreamsPanel from './ServiceCatalogWorkstreamsPanel';
import { PROJECT_START_PLAN_HREF } from './projectStartPlanLinks';
import type { AICapabilityConfig, PackageTemplate, ProductProfile, ProductizationCart, ServiceCategory, ServiceModule } from './types';

type CatalogSelectionResult = {
  cart: ProductizationCart;
  nextHref: string;
};

export default function CatalogPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams?.toString() || '';
  const viewParam = searchParams?.get('view') || null;
  const hasCatalogView = isServiceCatalogView(viewParam);
  const catalogView: ServiceCatalogView = hasCatalogView ? viewParam : 'templates';
  const selectedProductId = searchParams?.get('productId') || '';
  const queryClient = useQueryClient();
  const { isLoggedIn, user } = useAuth();
  const canUseStartPlan = user?.role === UserRole.PRODUCT_OWNER;
  const startPlanHref = canUseStartPlan ? PROJECT_START_PLAN_HREF : isLoggedIn ? '/dashboard' : '/login';
  const startPlanServicesHref = canUseStartPlan ? `${PROJECT_START_PLAN_HREF}?step=services` : startPlanHref;
  const startPlanReadinessHref = canUseStartPlan ? `${PROJECT_START_PLAN_HREF}?step=readiness` : startPlanHref;
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
  const selectedProduct = useQuery({
    queryKey: ['products', selectedProductId],
    enabled: canUseStartPlan && !!selectedProductId,
    queryFn: () => getJson<ProductProfile>(`/products/${selectedProductId}`),
  });
  const startPlan = useQuery({
    queryKey: ['productization-cart'],
    enabled: canUseStartPlan,
    queryFn: () => getJson<ProductizationCart>('/productization-cart/current'),
  });
  const chooseService = useMutation({
    mutationFn: async (payload: { serviceModuleId: string; notes: string; moduleName: string }) => {
      const cart = await postJson<ProductizationCart, { serviceModuleId: string; notes: string }>('/productization-cart/services', {
        serviceModuleId: payload.serviceModuleId,
        notes: payload.notes,
      });
      if (selectedProductId) {
        const productName = selectedProduct.data?.name || cart.productProfile?.name || 'Product';
        const updatedCart = await putJson<ProductizationCart, { productProfileId: string; title: string; businessGoal: string }>(
          '/productization-cart/current',
          {
            productProfileId: selectedProductId,
            title: `${productName} Project Start Plan`,
            businessGoal: selectedProduct.data?.summary || `Plan ${payload.moduleName} for ${productName}.`,
          }
        );
        return {
          cart: updatedCart,
          nextHref: startPlanServicesHref,
        };
      }
      return {
        cart,
        nextHref: `/products/new?step=setup&from=service-catalog&serviceId=${payload.serviceModuleId}`,
      };
    },
    onSuccess: async ({ nextHref }: CatalogSelectionResult) => {
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
      router.push(nextHref);
    },
  });
  const useTemplate = useMutation({
    mutationFn: async (payload: { templateId: string; templateName: string }) => {
      const cart = await postJson<ProductizationCart, Record<string, never>>(`/productization-cart/templates/${payload.templateId}/apply`, {});
      if (selectedProductId) {
        const productName = selectedProduct.data?.name || cart.productProfile?.name || 'Product';
        const updatedCart = await putJson<ProductizationCart, { productProfileId: string; title: string; businessGoal: string }>(
          '/productization-cart/current',
          {
            productProfileId: selectedProductId,
            title: `${productName} ${payload.templateName} plan`,
            businessGoal: selectedProduct.data?.summary || `Use ${payload.templateName} to move ${productName} toward launch readiness.`,
          }
        );
        return {
          cart: updatedCart,
          nextHref: startPlanReadinessHref,
        };
      }
      return {
        cart,
        nextHref: `/products/new?step=setup&from=service-catalog&templateId=${payload.templateId}`,
      };
    },
    onSuccess: async ({ nextHref }: CatalogSelectionResult) => {
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
      router.push(nextHref);
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
  const openCatalogLanding = () => {
    const next = new URLSearchParams(searchParamString);
    next.delete('view');
    const query = next.toString();
    router.push(query ? `${pathname || '/services'}?${query}` : (pathname || '/services'), { scroll: false });
  };

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Choose Services"
        description="Start from a launch template, a focused workstream, or an AI integration option. Each choice opens a focused internal view for the selected product path."
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
        isLoading={categories.isLoading || modules.isLoading || packageTemplates.isLoading || selectedProduct.isLoading}
        error={categories.error || modules.error || packageTemplates.error || aiCapabilities.error || selectedProduct.error || chooseService.error || useTemplate.error}
      />
      {chooseService.isSuccess && (
        <Alert severity="success" sx={{ borderRadius: 1 }}>
          Service chosen. Opening the next internal view for product setup or the active product plan.
        </Alert>
      )}
      {useTemplate.isSuccess && (
        <Alert severity="success" sx={{ borderRadius: 1 }}>
          Template chosen. Opening the next internal view for product setup or the active product plan.
        </Alert>
      )}

      <ServiceCatalogProductContextPanel
        productName={selectedProduct.data?.name}
        startPlanHref={startPlanServicesHref}
      />

      {!hasCatalogView && (
        <ServiceCatalogLandingPanel
          templateCount={packageTemplates.data?.length || 0}
          categoryCount={catalogCategories.length}
          aiCapabilityCount={aiCapabilities.data?.length || 0}
          productName={selectedProduct.data?.name}
          onOpenView={openCatalogView}
        />
      )}

      {hasCatalogView && (
        <ServiceCatalogInternalHeader
          view={catalogView}
          productName={selectedProduct.data?.name}
          onBack={openCatalogLanding}
        />
      )}

      {hasCatalogView && catalogView === 'templates' && (
        <PackageTemplatesPanel
          packageTemplates={packageTemplates.data || []}
          cartServiceIds={cartServiceIds}
          canUseProjectCart={canUseStartPlan}
          isLoggedIn={isLoggedIn}
          cartHref={startPlanHref}
          isApplyingTemplate={useTemplate.isPending}
          selectionMode={selectedProductId ? 'product' : 'discovery'}
          productName={selectedProduct.data?.name}
          onApplyTemplate={(templateId, templateName) => useTemplate.mutate({ templateId, templateName })}
        />
      )}

      {hasCatalogView && catalogView === 'services' && (
        <ServiceWorkstreamsPanel
          catalogCategories={catalogCategories}
          modulesByCategory={modulesByCategory}
          cartServiceIds={cartServiceIds}
          canUseProjectCart={canUseStartPlan}
          isLoggedIn={isLoggedIn}
          isChoosingService={chooseService.isPending}
          selectionMode={selectedProductId ? 'product' : 'discovery'}
          productName={selectedProduct.data?.name}
          onChooseService={(serviceModuleId, moduleName, notes) => chooseService.mutate({ serviceModuleId, moduleName, notes })}
        />
      )}

      {hasCatalogView && catalogView === 'ai' && (
        <AiServiceOptionsPanel aiCapabilities={aiCapabilities.data || []} />
      )}
    </Stack>
  );
}
