'use client';

import NextLink from 'next/link';
import { useState } from 'react';
import {
  AddShoppingCartOutlined,
  GroupsOutlined,
  PersonSearchOutlined,
} from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
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
import type { ProjectStartJourneyItem } from './ProjectStartJourneyNavigation';
import ProjectStartPlanBoard from './ProjectStartPlanBoard';
import { useProjectStartJourneyState } from './useProjectStartJourneyState';

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

export default function ProjectStartPlanPage() {
  const queryClient = useQueryClient();
  const [projectName, setProjectName] = useState('');
  const [notice, setNotice] = useState('');
  const [createdWorkspace, setCreatedWorkspace] = useState<ProjectWorkspace | null>(null);
  const {
    startPlanView,
    startPlanDetailOpen,
    openStartPlanHub,
    openStartPlanDetail,
  } = useProjectStartJourneyState();

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

  const startPlanJourneyItems: ProjectStartJourneyItem[] = [
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
  const currentStartPlanDetailLabel = startPlanJourneyItems.find((item) => item.value === startPlanView)?.label || 'Start plan';

  const selectProduct = (productId: string) => {
    const selected = productList.find((item) => item.id === productId);
    if (!selected) return;
    updateCart.mutate({
      productProfileId: selected.id,
      title: `${selected.name} productization start plan`,
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

      <ProjectStartPlanBoard
        detailOpen={startPlanDetailOpen}
        view={startPlanView}
        overview={{
          title: currentCart?.title,
          product,
          productOptions: selectableProducts.length ? selectableProducts : productList,
          hasPlaceholderProduct,
          score,
          canStartWorkspace,
          blockers,
          serviceCount,
          talentCount,
          notice,
          isUpdatingProduct: updateCart.isPending,
          onNoticeClose: () => setNotice(''),
          onSelectProduct: selectProduct,
        }}
        navigation={{
          detailOpen: startPlanDetailOpen,
          value: startPlanView,
          items: startPlanJourneyItems,
          productName: product?.name || 'Draft',
          currentDetailLabel: currentStartPlanDetailLabel,
          onOpenHub: openStartPlanHub,
          onOpenDetail: openStartPlanDetail,
        }}
        templates={{
          templates: packageTemplates.data || [],
          selectedServiceIds: cartServiceIds,
          isApplyingTemplate: applyTemplate.isPending,
          onApplyTemplate: (templateId) => applyTemplate.mutate(templateId),
        }}
        services={{
          serviceItems: currentCart?.serviceItems || [],
          isRemovingService: removeService.isPending,
          onRemoveService: (itemId) => removeService.mutate(itemId),
        }}
        readiness={{
          startReadiness,
          startGaps,
          blockingStartGaps,
          currentCart,
          serviceCount,
          blockers,
          canStartWorkspace,
          isAddingService: addRecommendedService.isPending,
          onAddGapService: (gap) =>
            gap.serviceModule &&
            addRecommendedService.mutate({
              serviceModuleId: gap.serviceModule.id,
              notes: `Added from the start readiness path. ${gap.description || ''}`.trim(),
            }),
        }}
        talent={{
          talentItems: currentCart?.talentItems || [],
          isRemovingTalent: removeTalent.isPending,
          onRemoveTalent: (itemId) => removeTalent.mutate(itemId),
        }}
        approval={{
          product,
          projectName,
          canStartWorkspace,
          serviceCount,
          blockers,
          blockingRecommendations,
          createdWorkspace,
          convertedWorkspace: currentCart?.convertedWorkspace,
          isStartingWorkspace: convertCart.isPending,
          isAddingService: addRecommendedService.isPending,
          onProjectNameChange: setProjectName,
          onStartWorkspace: () => convertCart.mutate(),
          onAddCatalogRecommendation: addCatalogRecommendation,
        }}
      />
    </>
  );
}
