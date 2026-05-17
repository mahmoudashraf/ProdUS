'use client';

import NextLink from 'next/link';
import {
  AddShoppingCartOutlined,
  CloudQueueOutlined,
  CodeOutlined,
  FactCheckOutlined,
  HeadsetMicOutlined,
  RocketLaunchOutlined,
  SecurityOutlined,
  StorageOutlined,
  TaskAltOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import { Alert, Box, Button, Divider, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson, postJson } from './api';
import {
  DotLabel,
  EmptyState,
  PageHeader,
  PastelChip,
  QueryState,
  SectionTitle,
  Surface,
  appleColors,
  categoryPalette,
  formatLabel,
} from './PlatformComponents';
import { AICapabilityConfig, PackageTemplate, ProductizationCart, ServiceCategory, ServiceModule } from './types';

const iconBySlug = {
  validation: TaskAltOutlined,
  'code-rewrite-refactor': CodeOutlined,
  scaling: TrendingUpOutlined,
  'cloud-devops': CloudQueueOutlined,
  database: StorageOutlined,
  security: SecurityOutlined,
  'launch-gtm-readiness': RocketLaunchOutlined,
  'operations-support': HeadsetMicOutlined,
};

const demandBySlug: Record<string, { label: string; color: string }> = {
  validation: { label: 'High demand', color: appleColors.purple },
  'code-rewrite-refactor': { label: 'High demand', color: appleColors.blue },
  scaling: { label: 'High demand', color: appleColors.amber },
  'cloud-devops': { label: 'High demand', color: appleColors.cyan },
  database: { label: 'Medium demand', color: appleColors.cyan },
  security: { label: 'High demand', color: appleColors.red },
  'launch-gtm-readiness': { label: 'New demand', color: appleColors.green },
  'operations-support': { label: 'Medium demand', color: '#7c3aed' },
};

const shortModuleName = (name: string) =>
  name
    .replace(' rewrite/refactor', '')
    .replace(' readiness', '')
    .replace(' review', '')
    .replace(' setup', '')
    .replace(' and ', ' & ');

export default function CatalogPage() {
  const queryClient = useQueryClient();
  const { isLoggedIn, user } = useAuth();
  const canUseProjectCart = user?.role === UserRole.PRODUCT_OWNER;
  const cartHref = canUseProjectCart ? '/owner/project-cart' : isLoggedIn ? '/dashboard' : '/login';
  const cartActionLabel = canUseProjectCart ? 'Review draft cart' : isLoggedIn ? 'Open dashboard' : 'Sign in to start';
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
  const cart = useQuery({
    queryKey: ['productization-cart'],
    enabled: canUseProjectCart,
    queryFn: () => getJson<ProductizationCart>('/productization-cart/current'),
  });
  const addServiceToCart = useMutation({
    mutationFn: (payload: { serviceModuleId: string; notes: string }) => postJson<ProductizationCart, { serviceModuleId: string; notes: string }>('/productization-cart/services', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const applyTemplateToCart = useMutation({
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
  const cartServiceIds = new Set((cart.data?.serviceItems || []).map((item) => item.serviceModule.id));

  return (
    <>
      <PageHeader
        title="Service Categories"
        description="Specialist workstreams for production-ready products, powered by the live catalog API and dependency-aware service-plan builder."
        action={
          <Button
            component={NextLink}
            href={cartHref}
            variant="contained"
            sx={{ minHeight: 42, minWidth: 140 }}
          >
            {cartActionLabel}
          </Button>
        }
      />
      <QueryState isLoading={categories.isLoading || modules.isLoading || packageTemplates.isLoading} error={categories.error || modules.error || packageTemplates.error || addServiceToCart.error || applyTemplateToCart.error} />
      {addServiceToCart.isSuccess && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 1 }}>
          Service added to the draft cart. Open the draft when you are ready to select a product, compare teams, or start a workspace.
        </Alert>
      )}
      {applyTemplateToCart.isSuccess && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 1 }}>
          Package template applied to the draft cart. Open the draft to resolve dependencies, select product context, and start a workspace.
        </Alert>
      )}
      {catalogCategories.length ? (
        <>
          {packageTemplates.data?.length ? (
            <Surface sx={{ mb: 3, background: 'linear-gradient(135deg, #ffffff 0%, #f8f7ff 100%)' }}>
              <SectionTitle title="Package Templates" action={<FactCheckOutlined sx={{ color: appleColors.purple }} />} />
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
                  gap: 1.5,
                }}
              >
                {packageTemplates.data.slice(0, 6).map((template) => {
                  const templateServiceIds = template.modules.map((module) => module.serviceModule.id);
                  const templateApplied = templateServiceIds.length > 0 && templateServiceIds.every((id) => cartServiceIds.has(id));
                  return (
                  <Surface key={template.id} sx={{ boxShadow: 'none', background: '#fff', minHeight: 176 }}>
                    <Stack spacing={1.25}>
                      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="h4">{template.name}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
                            {template.description}
                          </Typography>
                        </Box>
                        <PastelChip label={template.targetProductStage || 'Managed'} accent={appleColors.purple} />
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <PastelChip label={template.timelineRange || 'Scoped'} accent={appleColors.cyan} bg="#e4f9fd" />
                        <PastelChip label={template.budgetRange || 'Priced after scope'} accent={appleColors.green} bg="#e7f8ee" />
                        <PastelChip label={`${template.modules.length} services`} accent={appleColors.amber} bg="#fff4dc" />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                        {template.outcomeSummary}
                      </Typography>
                      <Button
                        {...(!canUseProjectCart ? { component: NextLink, href: cartHref } : {})}
                        variant={templateApplied ? 'outlined' : 'contained'}
                        startIcon={<AddShoppingCartOutlined />}
                        disabled={canUseProjectCart && (templateApplied || applyTemplateToCart.isPending)}
                        onClick={(event) => {
                          if (!canUseProjectCart) return;
                          event.preventDefault();
                          applyTemplateToCart.mutate(template.id);
                        }}
                        sx={{ minHeight: 40, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
                      >
                        {!isLoggedIn
                          ? 'Sign in to use template'
                          : canUseProjectCart
                            ? templateApplied
                              ? 'Template applied'
                              : 'Apply template'
                            : 'Open dashboard'}
                      </Button>
                    </Stack>
                  </Surface>
                  );
                })}
              </Box>
            </Surface>
          ) : null}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                xl: 'repeat(4, minmax(0, 1fr))',
              },
              gap: 2.5,
            }}
          >
            {catalogCategories.map((category, index) => {
              const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
              const Icon = iconBySlug[category.slug as keyof typeof iconBySlug] || TaskAltOutlined;
              const categoryModules = modulesByCategory[category.id] || [];
              const demand = demandBySlug[category.slug] || { label: 'Available', color: palette.accent };

              return (
                <Surface
                  key={category.id}
                  sx={{
                    minHeight: 270,
                    borderTop: `3px solid ${palette.accent}`,
                    background: `linear-gradient(145deg, #fff 0%, ${palette.soft} 100%)`,
                  }}
                >
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        width: 58,
                        height: 58,
                        borderRadius: 1,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: palette.bg,
                        color: palette.accent,
                      }}
                    >
                      <Icon />
                    </Box>
                    <Box>
                      <Typography variant="h3" sx={{ mb: 0.75 }}>
                        {category.name}
                      </Typography>
                      <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
                        {category.description || 'Production readiness workstream.'}
                      </Typography>
                    </Box>
                    <Stack spacing={0.75}>
                      {categoryModules.slice(0, 6).map((module) => {
                        const inCart = cartServiceIds.has(module.id);
                        return (
                          <Button
                            key={module.id}
                            {...(!canUseProjectCart ? { component: NextLink, href: !isLoggedIn ? '/login' : '/dashboard' } : {})}
                            type="button"
                            variant={inCart ? 'contained' : 'outlined'}
                            size="small"
                            startIcon={<AddShoppingCartOutlined />}
                            disabled={canUseProjectCart && (inCart || addServiceToCart.isPending)}
                            onClick={(event) => {
                              if (!canUseProjectCart) return;
                              event.preventDefault();
                              addServiceToCart.mutate({
                                serviceModuleId: module.id,
                                notes: `Saved from ${category.name} service catalog.`,
                              });
                            }}
                            sx={{
                              justifyContent: 'flex-start',
                              minHeight: 36,
                              textTransform: 'none',
                              color: inCart ? '#fff' : palette.accent,
                              borderColor: `${palette.accent}55`,
                              bgcolor: inCart ? palette.accent : '#fff',
                              '&:hover': {
                                borderColor: palette.accent,
                                bgcolor: inCart ? palette.accent : palette.bg,
                              },
                            }}
                          >
                            {!isLoggedIn
                              ? `Sign in to plan ${shortModuleName(module.name)}`
                              : canUseProjectCart
                                ? inCart
                                  ? `${shortModuleName(module.name)} added`
                                  : `Add ${shortModuleName(module.name)}`
                                : `Open dashboard for ${shortModuleName(module.name)}`}
                          </Button>
                        );
                      })}
                    </Stack>
                    <Divider />
                    <Stack spacing={0.75}>
                      {categoryModules.slice(0, 2).map((module) => (
                        <Box key={`${module.id}-meta`}>
                          <Typography variant="body2" sx={{ fontWeight: 900 }}>{module.name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.45 }}>
                            {module.ownerOutcome || module.description}
                          </Typography>
                          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                            {module.timelineRange && <PastelChip label={module.timelineRange} accent={palette.accent} bg={palette.bg} />}
                            {module.humanReviewRequired && <PastelChip label="Human reviewed" accent={appleColors.green} bg="#e7f8ee" />}
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                    <DotLabel label={demand.label} color={demand.color} />
                  </Stack>
                </Surface>
              );
            })}
          </Box>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="center"
            sx={{ mt: 4, color: 'text.secondary' }}
          >
            <Typography>Responsive by design</Typography>
            <Typography>4 columns desktop</Typography>
            <Typography>2 columns tablet</Typography>
            <Typography>1 column mobile</Typography>
          </Stack>
          <Surface sx={{ mt: 3, background: 'linear-gradient(135deg, #ffffff, #f5fdff)' }}>
            <SectionTitle title="AI-Ready Catalog Contracts" />
            <Typography color="text.secondary" sx={{ lineHeight: 1.7, mb: 1.5 }}>
              The catalog exposes structured inputs, outputs, evidence requirements, and human-review flags for a future AI integration layer. AI execution is disabled in the product path.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {(aiCapabilities.data || []).slice(0, 8).map((capability) => (
                <PastelChip
                  key={capability.id}
                  label={`${capability.name}: ${capability.enabled ? 'Enabled' : 'Prepared'}`}
                  accent={capability.enabled ? appleColors.green : appleColors.cyan}
                  bg={capability.enabled ? '#e7f8ee' : '#e4f9fd'}
                />
              ))}
              <PastelChip label={`Human review ${formatLabel('required')}`} accent={appleColors.purple} />
            </Stack>
          </Surface>
        </>
      ) : (
        <EmptyState label="No service categories are available. In local dev, call /api/mock/feed/platform-demo or restart the dev backend to seed the catalog." />
      )}
    </>
  );
}
