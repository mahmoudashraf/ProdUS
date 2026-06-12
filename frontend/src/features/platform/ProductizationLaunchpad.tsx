'use client';

import NextLink from 'next/link';
import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AddOutlined,
} from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteJson, getJson, putJson } from './api';
import { isPlaceholderProduct, sortPackagesForOwner, sortProductsForOwner, sortWorkspacesForOwner } from './displayOrder';
import {
  PageHeader,
  QueryState,
} from './PlatformComponents';
import { PROJECT_START_PLAN_HREF } from './projectStartPlanLinks';
import {
  LaunchpadActiveWorkspacesPanel,
  LaunchpadAiNextActionPanel,
  LaunchpadDetailNavigation,
  LaunchpadDetailView,
  LaunchpadFocusPanel,
  LaunchpadHeroPanel,
  LaunchpadMetricsStrip,
  LaunchpadProductsPanel,
  packageHealth,
} from './ProductizationLaunchpadPanels';
import { projectStartPlanTitle } from './projectStartPlanModel';
import type { PackageInstance, ProductProfile, ProductizationCart, ProjectWorkspace, RequirementIntake } from './types';

const isLaunchpadDetailView = (value: string | null): value is LaunchpadDetailView =>
  value === 'products' || value === 'workspaces';

export default function ProductizationLaunchpad() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams?.toString() || '';
  const focusParam = searchParams?.get('focus') || null;
  const clearSelectedProduct = searchParams?.get('clearSelectedProduct') === '1';
  const detailView = isLaunchpadDetailView(focusParam) ? focusParam : null;
  const clearRequestedRef = useRef(false);

  const products = useQuery({ queryKey: ['products'], queryFn: () => getJson<ProductProfile[]>('/products') });
  const requirements = useQuery({ queryKey: ['requirements'], queryFn: () => getJson<RequirementIntake[]>('/requirements') });
  const packages = useQuery({ queryKey: ['packages'], queryFn: () => getJson<PackageInstance[]>('/packages') });
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: () => getJson<ProjectWorkspace[]>('/workspaces') });
  const cart = useQuery({ queryKey: ['productization-cart'], queryFn: () => getJson<ProductizationCart>('/productization-cart/current') });
  const deleteDraftMutation = useMutation({
    mutationFn: () => deleteJson<ProductizationCart>('/productization-cart/current'),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const clearSelectedProductMutation = useMutation({
    mutationFn: () =>
      putJson<ProductizationCart, { clearProductProfile: true; title: string; businessGoal: string }>(
        '/productization-cart/current',
        {
          clearProductProfile: true,
          title: 'Planning',
          businessGoal: '',
        }
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });

  useEffect(() => {
    if (!clearSelectedProduct || clearRequestedRef.current) return;
    clearRequestedRef.current = true;
    clearSelectedProductMutation.mutate(undefined, {
      onSettled: () => {
        const next = new URLSearchParams(searchParamString);
        next.delete('clearSelectedProduct');
        const query = next.toString();
        router.replace(query ? `${pathname || '/dashboard'}?${query}` : pathname || '/dashboard', { scroll: false });
      },
    });
  }, [clearSelectedProduct, clearSelectedProductMutation, pathname, router, searchParamString]);

  const packageList = sortPackagesForOwner(packages.data || []);
  const productList = sortProductsForOwner(products.data || [], packageList);
  const workspaceList = sortWorkspacesForOwner(workspaces.data || []);
  const activeWorkspaces = workspaceList.filter((workspace) => workspace.status !== 'CLOSED' && workspace.status !== 'DELIVERED');
  const draftServices = cart.data?.serviceItems.length || 0;
  const draftTalent = cart.data?.talentItems.length || 0;
  const averageHealth = packageList.length
    ? Math.round(packageList.reduce((total, item) => total + packageHealth(item), 0) / packageList.length)
    : productList.length
      ? 58
      : 0;
  const cartProduct = cart.data?.productProfile;
  const selectedProduct = cartProduct && !isPlaceholderProduct(cartProduct) ? cartProduct : undefined;
  const nextProduct = selectedProduct || productList[0];
  const hasMeaningfulDraft = Boolean(
    cart.data?.status === 'DRAFT' && (
      selectedProduct ||
      draftServices > 0 ||
      draftTalent > 0 ||
      cart.data?.businessGoal?.trim()
    )
  );
  const currentDraftTitle = cartProduct && !isPlaceholderProduct(cartProduct)
    ? projectStartPlanTitle(cart.data?.title, cartProduct.name)
    : nextProduct
      ? `${nextProduct.name} Planning`
      : 'Planning';

  const openDetail = (view: LaunchpadDetailView) => {
    const next = new URLSearchParams(searchParamString);
    next.set('focus', view);
    router.push(`${pathname || '/dashboard'}?${next.toString()}`, { scroll: false });
  };

  const openHub = () => {
    const next = new URLSearchParams(searchParamString);
    next.delete('focus');
    const suffix = next.toString();
    router.push(suffix ? `${pathname || '/dashboard'}?${suffix}` : pathname || '/dashboard', { scroll: false });
  };

  return (
    <>
      <PageHeader
        title="Home"
        description="Your owner Home: portfolio metrics, selected products, Planning, and active workspaces in one place."
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button component={NextLink} href="/products/new" variant="contained" startIcon={<AddOutlined />} sx={{ minHeight: 44, minWidth: 150 }}>
              Create product
            </Button>
          </Stack>
        }
      />
      <QueryState
        isLoading={[products, requirements, packages, workspaces, cart].some((query) => query.isLoading)}
        error={[products, requirements, packages, workspaces, cart, clearSelectedProductMutation, deleteDraftMutation].find((query) => query.error)?.error}
      />

      <Stack spacing={2.5}>
        {detailView ? (
          <>
            <LaunchpadDetailNavigation
              currentLabel={detailView === 'products' ? 'Products' : 'Workspaces'}
              onOpenHub={openHub}
            />
            {detailView === 'products' ? (
              <LaunchpadProductsPanel productList={productList} packageList={packageList} />
            ) : (
              <LaunchpadActiveWorkspacesPanel activeWorkspaces={activeWorkspaces} />
            )}
          </>
        ) : (
          <>
            <LaunchpadHeroPanel
              nextProduct={nextProduct}
              selectedProduct={selectedProduct}
              productCount={productList.length}
              currentDraftTitle={currentDraftTitle}
              draftServices={draftServices}
              draftTalent={draftTalent}
              draftBusinessGoal={cart.data?.businessGoal}
              hasMeaningfulDraft={hasMeaningfulDraft}
              requirementCount={requirements.data?.length || 0}
              activeWorkspaceCount={activeWorkspaces.length}
              workspaceCount={workspaceList.length}
              isDeletingDraft={deleteDraftMutation.isPending}
              onDeleteDraft={async () => {
                await deleteDraftMutation.mutateAsync();
              }}
              cartStatus={cart.data?.status}
            />

            <LaunchpadFocusPanel
              value={null}
              draftServices={draftServices}
              draftTalent={draftTalent}
              onSelect={(value) => {
                if (value === 'plan') {
                  router.push(PROJECT_START_PLAN_HREF);
                  return;
                }
                openDetail(value);
              }}
            />

            <LaunchpadMetricsStrip
              productCount={productList.length}
              requirementCount={requirements.data?.length || 0}
              draftServices={draftServices}
              draftTalent={draftTalent}
              averageHealth={averageHealth}
              activeWorkspaceCount={activeWorkspaces.length}
              workspaceCount={workspaceList.length}
            />

            <LaunchpadAiNextActionPanel
              draftServices={draftServices}
              hasProducts={productList.length > 0}
            />
          </>
        )}
      </Stack>
    </>
  );
}
