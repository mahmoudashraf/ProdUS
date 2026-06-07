'use client';

import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AddShoppingCartOutlined,
  GroupsOutlined,
  PersonSearchOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteJson, getJson, postJson, putJson } from './api';
import { isPlaceholderProduct, sortProductsForOwner } from './displayOrder';
import {
  PageHeader,
  PastelChip,
  QueryState,
  appleColors,
  clampScore,
  formatLabel,
} from './PlatformComponents';
import { PackageTemplate, ProductProfile, ProductizationCart, ProductizationCartConvertResponse, ProjectWorkspace } from './types';
import type { CatalogRuleItem } from './types';
import { DraftCartJourneyNavigation, isCartJourneyView, type CartJourneyItem, type CartJourneyView } from './DraftCartJourneyNavigation';
import ProjectStartLifecycleServicesPanel from './ProjectStartLifecycleServicesPanel';
import ProjectStartPackageTemplatesPanel from './ProjectStartPackageTemplatesPanel';
import ProjectStartPlanOverview from './ProjectStartPlanOverview';
import ProjectStartReadinessPanel from './ProjectStartReadinessPanel';
import ProjectStartApprovalPanel from './ProjectStartApprovalPanel';
import ProjectStartTalentPanel from './ProjectStartTalentPanel';

interface CartUpdatePayload {
  productProfileId?: string;
  title?: string;
  businessGoal?: string;
}

interface CartConvertPayload {
  projectName: string;
}

const readinessScore = (cart?: ProductizationCart) =>
  clampScore((cart?.productProfile ? 30 : 0) + (cart?.serviceItems.length || 0) * 18 + (cart?.talentItems.length || 0) * 12);

export default function DraftProjectCartPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [projectName, setProjectName] = useState('');
  const [notice, setNotice] = useState('');
  const [createdWorkspace, setCreatedWorkspace] = useState<ProjectWorkspace | null>(null);
  const [cartView, setCartView] = useState<CartJourneyView>('readiness');
  const [cartDetailOpen, setCartDetailOpen] = useState(false);

  const products = useQuery({ queryKey: ['products'], queryFn: () => getJson<ProductProfile[]>('/products') });
  const cart = useQuery({ queryKey: ['productization-cart'], queryFn: () => getJson<ProductizationCart>('/productization-cart/current') });
  const packageTemplates = useQuery({
    queryKey: ['catalog-package-templates'],
    queryFn: () => getJson<PackageTemplate[]>('/catalog/package-templates'),
  });

  const updateCart = useMutation({
    mutationFn: (payload: CartUpdatePayload) => putJson<ProductizationCart, CartUpdatePayload>('/productization-cart/current', payload),
    onSuccess: async () => {
      setCreatedWorkspace(null);
      setNotice('Start plan product updated.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const removeService = useMutation({
    mutationFn: (itemId: string) => deleteJson<ProductizationCart>(`/productization-cart/services/${itemId}`),
    onSuccess: async () => {
      setNotice('Service removed from the start plan.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const removeTalent = useMutation({
    mutationFn: (itemId: string) => deleteJson<ProductizationCart>(`/productization-cart/talent/${itemId}`),
    onSuccess: async () => {
      setNotice('Team or expert removed from the start plan.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const addRecommendedService = useMutation({
    mutationFn: (payload: { serviceModuleId: string; notes: string }) => postJson<ProductizationCart, { serviceModuleId: string; notes: string }>('/productization-cart/services', payload),
    onSuccess: async () => {
      setNotice('Recommended service added to the start plan.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const applyTemplate = useMutation({
    mutationFn: (templateId: string) => postJson<ProductizationCart, Record<string, never>>(`/productization-cart/templates/${templateId}/apply`, {}),
    onSuccess: async () => {
      setCreatedWorkspace(null);
      setNotice('Launch-hardening template applied. Review the suggested next steps before approving the workspace.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const convertCart = useMutation({
    mutationFn: () =>
      postJson<ProductizationCartConvertResponse, CartConvertPayload>('/productization-cart/convert', {
        projectName: projectName || `${cart.data?.productProfile?.name || 'Product'} productization workspace`,
    }),
    onSuccess: async (result) => {
      setNotice('Workspace created. Your approved plan became service milestones, participants, and a project workspace.');
      setCreatedWorkspace(result.workspace);
      setProjectName('');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
      await queryClient.invalidateQueries({ queryKey: ['packages'] });
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const currentCart = cart.data;
  const productList = sortProductsForOwner(products.data || []);
  const selectableProducts = productList.filter((item) => !isPlaceholderProduct(item));
  const product = currentCart?.productProfile;
  const hasPlaceholderProduct = isPlaceholderProduct(product);
  const serviceCount = currentCart?.serviceItems.length || 0;
  const talentCount = currentCart?.talentItems.length || 0;
  const startReadiness = currentCart?.startReadiness;
  const startGaps = startReadiness?.gaps || [];
  const blockers = startReadiness?.blockerCount ?? currentCart?.catalogEvaluation?.blockerCount ?? 0;
  const blockingRecommendations = (currentCart?.catalogEvaluation?.recommendations || []).filter(
    (item) => item.severity === 'BLOCKER' && !item.alreadySelected
  );
  const blockingStartGaps = startGaps.filter((gap) => gap.blocking);
  const canStartWorkspace = !!product && !hasPlaceholderProduct && (startReadiness?.ready ?? (serviceCount > 0 && blockers === 0));
  const score = readinessScore(currentCart);
  const cartServiceIds = new Set((currentCart?.serviceItems || []).map((item) => item.serviceModule.id));
  const searchParamString = searchParams?.toString() || '';

  useEffect(() => {
    const currentParams = new URLSearchParams(searchParamString);
    const stepParam = currentParams.get('step');
    if (isCartJourneyView(stepParam)) {
      setCartView(stepParam);
      setCartDetailOpen(true);
    } else {
      setCartDetailOpen(false);
    }
  }, [searchParamString]);

  const pushCartLocation = (step?: CartJourneyView) => {
    const next = new URLSearchParams(searchParamString);
    const routePath = pathname || '/owner/project-cart';
    if (step) {
      next.set('step', step);
    } else {
      next.delete('step');
    }
    const query = next.toString();
    router.push(query ? `${routePath}?${query}` : routePath, { scroll: false });
  };

  const openCartHub = () => {
    setCartDetailOpen(false);
    pushCartLocation();
  };

  const openCartDetail = (step: CartJourneyView) => {
    setCartView(step);
    setCartDetailOpen(true);
    pushCartLocation(step);
  };

  const cartJourneyItems: CartJourneyItem[] = [
    {
      value: 'readiness',
      label: 'Readiness',
      detail: 'Product, templates, service gaps, and start blockers.',
      accent: canStartWorkspace ? appleColors.green : blockers ? appleColors.red : appleColors.amber,
      meta: <PastelChip label={canStartWorkspace ? 'Ready' : blockers ? `${blockers} gaps` : 'Needs scope'} accent={canStartWorkspace ? appleColors.green : blockers ? appleColors.red : appleColors.amber} bg={canStartWorkspace ? '#e7f8ee' : blockers ? '#fff1f2' : '#fff4dc'} />,
    },
    {
      value: 'services',
      label: 'Services',
      detail: 'Review selected lifecycle services and add missing ones.',
      accent: appleColors.purple,
      meta: <PastelChip label={`${serviceCount} selected`} accent={serviceCount ? appleColors.purple : appleColors.amber} />,
    },
    {
      value: 'talent',
      label: 'Talent',
      detail: 'Review teams and experts before handoff.',
      accent: appleColors.cyan,
      meta: <PastelChip label={`${talentCount} saved`} accent={talentCount ? appleColors.cyan : appleColors.muted} bg="#e4f9fd" />,
    },
    {
      value: 'handoff',
      label: 'Approve',
      detail: 'Approve the launch-hardening plan when scope is ready.',
      accent: appleColors.green,
      meta: <PastelChip label={canStartWorkspace ? 'Can start' : 'Blocked'} accent={canStartWorkspace ? appleColors.green : appleColors.amber} bg={canStartWorkspace ? '#e7f8ee' : '#fff4dc'} />,
    },
  ];
  const currentCartDetailLabel = cartJourneyItems.find((item) => item.value === cartView)?.label || 'Start plan';

  const selectProduct = (productId: string) => {
    const selected = productList.find((item) => item.id === productId);
    if (!selected) return;
    updateCart.mutate({
      productProfileId: selected.id,
      title: `${selected.name} productization draft`,
      businessGoal: selected.summary || `Move ${selected.name} toward production-ready delivery.`,
    });
  };

  const addCatalogRecommendation = (item: CatalogRuleItem) => {
    addRecommendedService.mutate({
      serviceModuleId: item.recommendedModule.id,
      notes: `Added from the suggested fix path (${formatLabel(item.source)}). ${item.reason || ''}`.trim(),
    });
  };

  return (
    <>
      <PageHeader
        title="Project Start Plan"
        description="Approve the services, teams, and launch-hardening scope that turn this prototype into a real project workspace."
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button component={NextLink} href="/services" variant="outlined" startIcon={<AddShoppingCartOutlined />} sx={{ minHeight: 44 }}>
              Add services
            </Button>
            <Button component={NextLink} href="/teams" variant="outlined" startIcon={<GroupsOutlined />} sx={{ minHeight: 44 }}>
              Add teams
            </Button>
            <Button component={NextLink} href="/solo-experts" variant="outlined" startIcon={<PersonSearchOutlined />} sx={{ minHeight: 44 }}>
              Add experts
            </Button>
          </Stack>
        }
      />
      <QueryState
        isLoading={products.isLoading || cart.isLoading || packageTemplates.isLoading}
        error={products.error || cart.error || packageTemplates.error || updateCart.error || removeService.error || removeTalent.error || applyTemplate.error || convertCart.error}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: cartDetailOpen && cartView === 'handoff' ? '1fr 360px' : '1fr' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          <ProjectStartPlanOverview
            title={currentCart?.title}
            product={product}
            productOptions={selectableProducts.length ? selectableProducts : productList}
            hasPlaceholderProduct={hasPlaceholderProduct}
            score={score}
            canStartWorkspace={canStartWorkspace}
            blockers={blockers}
            serviceCount={serviceCount}
            talentCount={talentCount}
            notice={notice}
            isUpdatingProduct={updateCart.isPending}
            onNoticeClose={() => setNotice('')}
            onSelectProduct={selectProduct}
          />

          <DraftCartJourneyNavigation
            detailOpen={cartDetailOpen}
            value={cartView}
            items={cartJourneyItems}
            productName={product?.name || 'Draft'}
            currentDetailLabel={currentCartDetailLabel}
            onOpenHub={openCartHub}
            onOpenDetail={openCartDetail}
          />

          {cartDetailOpen && cartView === 'readiness' && (
            <ProjectStartPackageTemplatesPanel
              templates={packageTemplates.data || []}
              selectedServiceIds={cartServiceIds}
              isApplyingTemplate={applyTemplate.isPending}
              onApplyTemplate={(templateId) => applyTemplate.mutate(templateId)}
            />
          )}

          {cartDetailOpen && cartView === 'services' && (
            <ProjectStartLifecycleServicesPanel
              serviceItems={currentCart?.serviceItems || []}
              isRemovingService={removeService.isPending}
              onRemoveService={(itemId) => removeService.mutate(itemId)}
            />
          )}

          {cartDetailOpen && cartView === 'readiness' && (
            <ProjectStartReadinessPanel
              startReadiness={startReadiness}
              startGaps={startGaps}
              blockingStartGaps={blockingStartGaps}
              currentCart={currentCart}
              serviceCount={serviceCount}
              blockers={blockers}
              canStartWorkspace={canStartWorkspace}
              isAddingService={addRecommendedService.isPending}
              onAddGapService={(gap) =>
                gap.serviceModule &&
                addRecommendedService.mutate({
                  serviceModuleId: gap.serviceModule.id,
                  notes: `Added from the start readiness path. ${gap.description || ''}`.trim(),
                })
              }
            />
          )}

          {cartDetailOpen && cartView === 'talent' && (
            <ProjectStartTalentPanel
              talentItems={currentCart?.talentItems || []}
              isRemovingTalent={removeTalent.isPending}
              onRemoveTalent={(itemId) => removeTalent.mutate(itemId)}
            />
          )}
        </Stack>

        {cartDetailOpen && cartView === 'handoff' && (
          <ProjectStartApprovalPanel
            product={product}
            projectName={projectName}
            canStartWorkspace={canStartWorkspace}
            serviceCount={serviceCount}
            blockers={blockers}
            blockingRecommendations={blockingRecommendations}
            createdWorkspace={createdWorkspace}
            convertedWorkspace={currentCart?.convertedWorkspace}
            isStartingWorkspace={convertCart.isPending}
            isAddingService={addRecommendedService.isPending}
            onProjectNameChange={setProjectName}
            onStartWorkspace={() => convertCart.mutate()}
            onAddCatalogRecommendation={addCatalogRecommendation}
          />
        )}
      </Box>
    </>
  );
}
