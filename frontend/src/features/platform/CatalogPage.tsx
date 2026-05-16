'use client';

import NextLink from 'next/link';
import {
  AddShoppingCartOutlined,
  CloudQueueOutlined,
  CodeOutlined,
  HeadsetMicOutlined,
  RocketLaunchOutlined,
  SecurityOutlined,
  StorageOutlined,
  TaskAltOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson, postJson } from './api';
import {
  DotLabel,
  EmptyState,
  PageHeader,
  QueryState,
  Surface,
  appleColors,
  categoryPalette,
} from './PlatformComponents';
import { ProductizationCart, ServiceCategory, ServiceModule } from './types';

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
  const cartHref = canUseProjectCart ? '/owner/project-cart#project-cart' : isLoggedIn ? '/dashboard' : '/login';
  const cartActionLabel = canUseProjectCart ? 'Review draft cart' : isLoggedIn ? 'Open dashboard' : 'Sign in to start';
  const categories = useQuery({
    queryKey: ['catalog-categories'],
    queryFn: () => getJson<ServiceCategory[]>('/catalog/categories'),
  });
  const modules = useQuery({
    queryKey: ['catalog-modules'],
    queryFn: () => getJson<ServiceModule[]>('/catalog/modules'),
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
        description="Specialist workstreams for production-ready products, powered by the live catalog API and dependency-aware package builder."
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
      <QueryState isLoading={categories.isLoading || modules.isLoading} error={categories.error || modules.error} />
      {catalogCategories.length ? (
        <>
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
                      {categoryModules.slice(0, 4).map((module) => {
                        const inCart = cartServiceIds.has(module.id);
                        return (
                          <Button
                            key={module.id}
                            component={NextLink}
                            href={!isLoggedIn ? '/login' : canUseProjectCart ? '#' : '/dashboard'}
                            type="button"
                            variant={inCart ? 'contained' : 'outlined'}
                            size="small"
                            startIcon={<AddShoppingCartOutlined />}
                            disabled={canUseProjectCart && addServiceToCart.isPending}
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
                            {!isLoggedIn ? 'Sign in to add' : canUseProjectCart ? (inCart ? 'In draft cart' : 'Add to draft cart') : 'Owner cart only'} · {shortModuleName(module.name)}
                          </Button>
                        );
                      })}
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
        </>
      ) : (
        <EmptyState label="No service categories are available. In local dev, call /api/mock/feed/platform-demo or restart the dev backend to seed the catalog." />
      )}
    </>
  );
}
