'use client';

import NextLink from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AddOutlined,
  PlaylistAddCheckOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getJson } from './api';
import { isPlaceholderProduct, sortPackagesForOwner, sortProductsForOwner, sortWorkspacesForOwner } from './displayOrder';
import {
  PageHeader,
  QueryState,
} from './PlatformComponents';
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
import type { PackageInstance, ProductProfile, ProductizationCart, ProjectWorkspace, RequirementIntake } from './types';

const isLaunchpadDetailView = (value: string | null): value is LaunchpadDetailView =>
  value === 'products' || value === 'workspaces';

export default function ProductizationLaunchpad() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams?.toString() || '';
  const focusParam = searchParams?.get('focus') || null;
  const detailView = isLaunchpadDetailView(focusParam) ? focusParam : null;

  const products = useQuery({ queryKey: ['products'], queryFn: () => getJson<ProductProfile[]>('/products') });
  const requirements = useQuery({ queryKey: ['requirements'], queryFn: () => getJson<RequirementIntake[]>('/requirements') });
  const packages = useQuery({ queryKey: ['packages'], queryFn: () => getJson<PackageInstance[]>('/packages') });
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: () => getJson<ProjectWorkspace[]>('/workspaces') });
  const cart = useQuery({ queryKey: ['productization-cart'], queryFn: () => getJson<ProductizationCart>('/productization-cart/current') });

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
  const nextProduct = cartProduct && !isPlaceholderProduct(cartProduct) ? cartProduct : productList[0];
  const currentDraftTitle = cartProduct && !isPlaceholderProduct(cartProduct)
    ? cart.data?.title || `${cartProduct.name} productization start plan`
    : nextProduct
      ? `${nextProduct.name} productization start plan`
      : 'Productization start plan';

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
        title="Productization Command Center"
        description="Start with one product, collect lifecycle services and verified talent in a start plan, then approve that plan into a governed workspace."
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button component={NextLink} href="/products/new" variant="contained" startIcon={<AddOutlined />} sx={{ minHeight: 44, minWidth: 150 }}>
              New product
            </Button>
            <Button component={NextLink} href="/owner/project-cart" variant="outlined" startIcon={<PlaylistAddCheckOutlined />} sx={{ minHeight: 44, minWidth: 168 }}>
              Review start plan
            </Button>
          </Stack>
        }
      />
      <QueryState
        isLoading={[products, requirements, packages, workspaces, cart].some((query) => query.isLoading)}
        error={[products, requirements, packages, workspaces, cart].find((query) => query.error)?.error}
      />

      <Stack spacing={2.5}>
        <LaunchpadHeroPanel
          nextProduct={nextProduct}
          currentDraftTitle={currentDraftTitle}
          draftServices={draftServices}
          draftTalent={draftTalent}
          cartStatus={cart.data?.status}
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
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) 340px' }, gap: 2.5 }}>
            <LaunchpadFocusPanel
              value="plan"
              draftServices={draftServices}
              draftTalent={draftTalent}
              productCount={productList.length}
              activeWorkspaceCount={activeWorkspaces.length}
              onSelect={(value) => {
                if (value === 'plan') {
                  router.push('/owner/project-cart');
                  return;
                }
                openDetail(value);
              }}
            />
            <LaunchpadAiNextActionPanel
              draftServices={draftServices}
              hasProducts={productList.length > 0}
            />
          </Box>
        )}
      </Stack>
    </>
  );
}
