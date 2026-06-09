'use client';

import NextLink from 'next/link';
import { useState } from 'react';
import {
  FactCheckOutlined,
  GroupsOutlined,
  PersonSearchOutlined,
} from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import { isPlaceholderProduct } from './displayOrder';
import {
  PageHeader,
  QueryState,
} from './PlatformComponents';
import type { ProjectWorkspace } from './types';
import ProjectStartPlanBoard from './ProjectStartPlanBoard';
import {
  buildProjectStartPlanJourneyItems,
  projectStartPlanDetailLabel,
  projectStartReadinessScore,
} from './projectStartPlanModel';
import { useProjectStartPlanActions } from './useProjectStartPlanActions';
import { useProjectStartPlanData } from './useProjectStartPlanData';
import { useProjectStartJourneyState } from './useProjectStartJourneyState';

export default function ProjectStartPlanPage() {
  const [projectName, setProjectName] = useState('');
  const [notice, setNotice] = useState('');
  const [createdWorkspace, setCreatedWorkspace] = useState<ProjectWorkspace | null>(null);
  const {
    startPlanView,
    startPlanDetailOpen,
    openStartPlanHub,
    openStartPlanDetail,
  } = useProjectStartJourneyState();
  const {
    products,
    cart,
    packageTemplates,
    currentCart,
  } = useProjectStartPlanData();
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
  const score = projectStartReadinessScore(currentCart);
  const cartServiceIds = new Set((currentCart?.serviceItems || []).map((item) => item.serviceModule.id));
  const startPlanJourneyItems = buildProjectStartPlanJourneyItems({
    canStartWorkspace,
    blockers,
    serviceCount,
    talentCount,
  });
  const currentStartPlanDetailLabel = projectStartPlanDetailLabel(startPlanJourneyItems, startPlanView);
  const {
    addCatalogRecommendation,
    addRecommendedService,
    applyTemplate,
    convertCart,
    removeService,
    removeTalent,
    updateCart,
  } = useProjectStartPlanActions({
    currentCart,
    projectName,
    setCreatedWorkspace,
    setNotice,
    setProjectName,
  });

  return (
    <>
      <PageHeader
        title="Project Start Plan"
        description="Approve the services, teams, and launch-hardening scope that turn this prototype into a real project workspace."
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button component={NextLink} href="/services" variant="outlined" startIcon={<FactCheckOutlined />} sx={{ minHeight: 44 }}>
              Choose services
            </Button>
            <Button component={NextLink} href="/teams" variant="outlined" startIcon={<GroupsOutlined />} sx={{ minHeight: 44 }}>
              Choose teams
            </Button>
            <Button component={NextLink} href="/solo-experts" variant="outlined" startIcon={<PersonSearchOutlined />} sx={{ minHeight: 44 }}>
              Find experts
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
          hasPlaceholderProduct,
          score,
          canStartWorkspace,
          blockers,
          serviceCount,
          talentCount,
          notice,
          onNoticeClose: () => setNotice(''),
        }}
        navigation={{
          detailOpen: startPlanDetailOpen,
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
              notes: `Chosen from the start readiness path. ${gap.description || ''}`.trim(),
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
