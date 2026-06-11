'use client';

import NextLink from 'next/link';
import {
  AddTaskOutlined,
  CloudQueueOutlined,
  CodeOutlined,
  HeadsetMicOutlined,
  RocketLaunchOutlined,
  ScienceOutlined,
  SecurityOutlined,
  StorageOutlined,
  TaskAltOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import {
  DotLabel,
  EmptyState,
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
  categoryPalette,
} from './PlatformComponents';
import type { ServiceCategory, ServiceModule } from './types';

const iconBySlug = {
  validation: TaskAltOutlined,
  'code-rewrite-refactor': CodeOutlined,
  scaling: TrendingUpOutlined,
  'cloud-devops': CloudQueueOutlined,
  database: StorageOutlined,
  security: SecurityOutlined,
  'quality-testing': ScienceOutlined,
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
  'quality-testing': { label: 'High demand', color: appleColors.green },
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

export default function ServiceWorkstreamsPanel({
  catalogCategories,
  modulesByCategory,
  cartServiceIds,
  canUseProjectCart,
  isLoggedIn,
  isChoosingService,
  selectionMode,
  productName,
  onChooseService,
}: {
  catalogCategories: ServiceCategory[];
  modulesByCategory: Record<string, ServiceModule[]>;
  cartServiceIds: Set<string>;
  canUseProjectCart: boolean;
  isLoggedIn: boolean;
  isChoosingService: boolean;
  selectionMode: 'discovery' | 'product';
  productName?: string | undefined;
  onChooseService: (serviceModuleId: string, moduleName: string, notes: string) => void;
}) {
  const moduleActionLabel = (moduleName: string, inPlan: boolean) => {
    const shortName = shortModuleName(moduleName);
    if (!isLoggedIn) return `Sign in to choose ${shortName}`;
    if (!canUseProjectCart) return `Open dashboard for ${shortName}`;
    if (inPlan) return `${shortName} in Planning`;
    if (selectionMode === 'product') return productName ? `Choose for ${productName}` : `Choose for product`;
    return `Start with ${shortName}`;
  };

  return catalogCategories.length ? (
    <Stack spacing={2}>
      <Surface sx={{ boxShadow: 'none', background: '#fff' }}>
        <SectionTitle title="Workstream Choices" />
        <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
          {selectionMode === 'product'
            ? 'Choose the workstream that belongs in Planning. ProdUS will open the focused product services view after the choice is saved.'
            : 'Choose one workstream to start product setup with service context already selected. The owner can edit the scope before creating the product.'}
        </Typography>
      </Surface>
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
                  const inPlan = cartServiceIds.has(module.id);
                  return (
                    <Button
                      key={module.id}
                      {...(!canUseProjectCart ? { component: NextLink, href: !isLoggedIn ? '/login' : '/dashboard' } : {})}
                      type="button"
                      variant={inPlan ? 'contained' : 'outlined'}
                      size="small"
                      startIcon={<AddTaskOutlined />}
                      disabled={canUseProjectCart && (inPlan || isChoosingService)}
                      onClick={(event) => {
                        if (!canUseProjectCart) return;
                        event.preventDefault();
                        onChooseService(module.id, module.name, `Selected from ${category.name} services as the owner starting path.`);
                      }}
                      sx={{
                        justifyContent: 'flex-start',
                        minHeight: 36,
                        textTransform: 'none',
                        color: inPlan ? '#fff' : palette.accent,
                        borderColor: `${palette.accent}55`,
                        bgcolor: inPlan ? palette.accent : '#fff',
                        '&:hover': {
                          borderColor: palette.accent,
                          bgcolor: inPlan ? palette.accent : palette.bg,
                        },
                      }}
                    >
                      {moduleActionLabel(module.name, inPlan)}
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
    </Stack>
  ) : (
    <EmptyState label="No service categories are available. In local dev, call /api/mock/feed/platform-demo or restart the dev backend to seed the catalog." />
  );
}
