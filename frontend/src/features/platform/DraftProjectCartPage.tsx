'use client';

import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AddShoppingCartOutlined,
  ArrowForwardOutlined,
  DeleteOutlineOutlined,
  FactCheckOutlined,
  GroupsOutlined,
  PersonSearchOutlined,
} from '@mui/icons-material';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteJson, getJson, postJson, putJson } from './api';
import { isPlaceholderProduct, sortProductsForOwner } from './displayOrder';
import {
  DotLabel,
  EmptyState,
  PageHeader,
  PastelChip,
  QueryState,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  categoryPalette,
  clampScore,
  formatLabel,
} from './PlatformComponents';
import { PackageTemplate, ProductProfile, ProductizationCart, ProductizationCartConvertResponse, ProjectWorkspace } from './types';
import type { CatalogRuleItem } from './types';
import { DraftCartJourneyNavigation, isCartJourneyView, type CartJourneyItem, type CartJourneyView } from './DraftCartJourneyNavigation';
import ProjectStartPlanOverview from './ProjectStartPlanOverview';
import ProjectStartReadinessPanel from './ProjectStartReadinessPanel';
import ProjectStartApprovalPanel from './ProjectStartApprovalPanel';

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

          {cartDetailOpen && cartView === 'readiness' && packageTemplates.data?.length ? (
            <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8f7ff 100%)' }}>
              <SectionTitle title="Package Templates" action={<FactCheckOutlined sx={{ color: appleColors.purple }} />} />
              <Typography color="text.secondary" sx={{ lineHeight: 1.65, mb: 2 }}>
                Apply a mature service plan recipe when the product matches a common productization path. The backend adds the template services to this draft cart and keeps dependency checks active.
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
                {packageTemplates.data.slice(0, 4).map((template) => {
                  const templateServiceIds = template.modules.map((module) => module.serviceModule.id);
                  const templateApplied = templateServiceIds.length > 0 && templateServiceIds.every((id) => cartServiceIds.has(id));
                  return (
                    <Surface key={template.id} sx={{ boxShadow: 'none', background: '#fff', p: 2 }}>
                      <Stack spacing={1.25}>
                        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="h4">{template.name}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
                              {template.outcomeSummary || template.description}
                            </Typography>
                          </Box>
                          <PastelChip label={template.targetProductStage || 'Managed'} accent={appleColors.purple} />
                        </Stack>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <PastelChip label={`${template.modules.length} services`} accent={appleColors.cyan} bg="#e4f9fd" />
                          <PastelChip label={template.timelineRange || 'Scoped'} accent={appleColors.green} bg="#e7f8ee" />
                          <PastelChip label={template.budgetRange || 'Priced after scope'} accent={appleColors.amber} bg="#fff4dc" />
                        </Stack>
                        <Button
                          variant={templateApplied ? 'outlined' : 'contained'}
                          startIcon={<AddShoppingCartOutlined />}
                          disabled={templateApplied || applyTemplate.isPending}
                          onClick={() => applyTemplate.mutate(template.id)}
                          sx={{ minHeight: 42, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
                        >
                          {templateApplied ? 'Template applied' : 'Apply template'}
                        </Button>
                      </Stack>
                    </Surface>
                  );
                })}
              </Box>
            </Surface>
          ) : null}

          {cartDetailOpen && cartView === 'services' && (
          <Surface>
            <SectionTitle title="Lifecycle Services" action={<Button component={NextLink} href="/services" variant="text" endIcon={<ArrowForwardOutlined />}>Add service</Button>} />
            {currentCart?.serviceItems.length ? (
              <Stack spacing={0}>
                {currentCart.serviceItems.map((item, index) => {
                  const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
                  return (
                    <Box
                      key={item.id}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr auto', md: '54px 1.3fr 1fr auto' },
                        gap: 1.5,
                        alignItems: 'center',
                        py: 1.75,
                        borderTop: index === 0 ? 0 : '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box sx={{ width: 42, height: 42, borderRadius: 1, display: { xs: 'none', md: 'grid' }, placeItems: 'center', bgcolor: palette.bg, color: palette.accent, fontWeight: 900 }}>
                        {item.sequenceOrder}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900 }}>{item.serviceModule.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.55 }}>
                          {item.serviceModule.description || item.notes || 'Lifecycle service selected for this product.'}
                        </Typography>
                      </Box>
                      <Stack spacing={0.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
                        <DotLabel label={item.serviceModule.category?.name || 'Lifecycle service'} color={palette.accent} />
                        <Typography variant="body2" color="text.secondary">{item.serviceModule.timelineRange || item.serviceModule.priceRange || 'Scoped during planning'}</Typography>
                      </Stack>
                      <IconButton
                        size="small"
                        onClick={() => removeService.mutate(item.id)}
                        disabled={removeService.isPending}
                        sx={{ width: 36, height: 36, borderRadius: 1, color: appleColors.red, bgcolor: '#fff7f8' }}
                      >
                        <DeleteOutlineOutlined fontSize="small" />
                      </IconButton>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <EmptyState label="No services yet. Add productization services such as validation, security, cloud, database, launch, or support." />
            )}
          </Surface>
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
          <Surface>
            <SectionTitle title="Teams And Experts" action={<Button component={NextLink} href="/teams" variant="text" endIcon={<ArrowForwardOutlined />}>Add talent</Button>} />
            {currentCart?.talentItems.length ? (
              <Stack spacing={0}>
                {currentCart.talentItems.map((item, index) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr auto', md: '1.2fr 1fr auto' },
                      gap: 1.5,
                      alignItems: 'center',
                      py: 1.75,
                      borderTop: index === 0 ? 0 : '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 900 }}>{item.team?.name || item.expertProfile?.displayName}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.55 }}>
                        {item.team?.headline || item.expertProfile?.headline || item.notes || 'Selected delivery partner.'}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ display: { xs: 'none', md: 'flex' } }}>
                      <PastelChip label={formatLabel(item.itemType)} accent={item.itemType === 'TEAM' ? appleColors.cyan : appleColors.green} bg={item.itemType === 'TEAM' ? '#e4f9fd' : '#e7f8ee'} />
                      {item.team?.verificationStatus && <StatusChip label={item.team.verificationStatus} />}
                      {item.expertProfile?.availability && <StatusChip label={item.expertProfile.availability} />}
                    </Stack>
                    <IconButton
                      size="small"
                      onClick={() => removeTalent.mutate(item.id)}
                      disabled={removeTalent.isPending}
                      sx={{ width: 36, height: 36, borderRadius: 1, color: appleColors.red, bgcolor: '#fff7f8' }}
                    >
                      <DeleteOutlineOutlined fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            ) : (
              <EmptyState label="No delivery talent yet. Add verified teams or solo experts now, or start with services and match talent later." />
            )}
          </Surface>
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
