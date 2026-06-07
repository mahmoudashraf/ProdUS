'use client';

import type { ComponentProps } from 'react';
import {
  AddShoppingCartOutlined,
  AutoAwesomeOutlined,
  DeleteOutlineOutlined,
  ShieldOutlined,
} from '@mui/icons-material';
import { Box, Stack, Tooltip, IconButton, Typography } from '@mui/material';
import {
  DotLabel,
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
  categoryPalette,
} from './PlatformComponents';
import StudioAssistantCard, { type StudioAssistantContext } from './StudioAssistantCard';
import type {
  ProductProfile,
  ProductizationCartServiceItem,
  ServiceCategory,
  ServiceModule,
} from './types';

type AssistantActionProps = Pick<ComponentProps<typeof StudioAssistantCard>, 'onConfirmAction' | 'actionDisabledReason'>;

export interface OwnerServiceRiskSummary {
  id: string;
  title: string;
  impact: string;
  proof: string;
  service?: string | undefined;
}

interface OwnerServicesRecommendationPanelProps {
  product?: ProductProfile | undefined;
  categories: ServiceCategory[];
  catalogModules: ServiceModule[];
  recommendedServices: ServiceModule[];
  cartServiceItems: ProductizationCartServiceItem[];
  cartServiceIds: ReadonlySet<string>;
  blockerCount: number;
  improvementCount: number;
  mappedServiceNames: string[];
  ownerRisks: OwnerServiceRiskSummary[];
  cartStartPromptFacts: string;
  assistantContext: StudioAssistantContext;
  assistantActions: AssistantActionProps;
  isAddingService: boolean;
  isRemovingService: boolean;
  onAddService: (serviceModule: ServiceModule, categoryName?: string) => void;
  onRemoveService: (cartItemId: string) => void;
}

export default function OwnerServicesRecommendationPanel({
  product,
  categories,
  catalogModules,
  recommendedServices,
  cartServiceItems,
  cartServiceIds,
  blockerCount,
  improvementCount,
  mappedServiceNames,
  ownerRisks,
  cartStartPromptFacts,
  assistantContext,
  assistantActions,
  isAddingService,
  isRemovingService,
  onAddService,
  onRemoveService,
}: OwnerServicesRecommendationPanelProps) {
  const recommendedServiceIds = new Set(recommendedServices.map((service) => service.id));
  const primaryServiceName = mappedServiceNames[0] || recommendedServices[0]?.name || cartServiceItems[0]?.serviceModule.name || 'Launch Hardening Sprint';
  const topRisk = ownerRisks[0];
  const decisionLabel = blockerCount
    ? `Not ready - ${blockerCount} blocker${blockerCount === 1 ? '' : 's'} need a fix path`
    : improvementCount
      ? `Launchable with ${improvementCount} improvement${improvementCount === 1 ? '' : 's'} to schedule`
      : 'Clear enough to keep moving';

  return (
    <Surface>
      <SectionTitle
        title="Recommended Work Path"
        action={<PastelChip label={`${categories.length} service families`} accent={appleColors.purple} />}
      />

      <Box
        sx={{
          mb: 1.5,
          p: { xs: 1.5, md: 2 },
          borderRadius: 1,
          border: '1px solid',
          borderColor: blockerCount ? '#fecdd3' : '#bbf7d0',
          bgcolor: blockerCount ? '#fff7f8' : '#f6fff9',
        }}
      >
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ lg: 'center' }}>
          <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: 1,
                bgcolor: blockerCount ? '#ffe9ec' : '#e7f8ee',
                color: blockerCount ? appleColors.red : appleColors.green,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldOutlined />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4">{decisionLabel}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                Start with {primaryServiceName}. {topRisk ? `It connects the top risk, "${topRisk.title}", to owner-visible delivery proof.` : 'It keeps the service plan tied to the launch verdict instead of browsing a catalog.'}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <PastelChip label={`${cartServiceItems.length} in plan`} accent={appleColors.purple} />
            <PastelChip label={`${mappedServiceNames.length} from scanner proof`} accent={appleColors.cyan} bg="#e4f9fd" />
            <PastelChip
              label={blockerCount ? `${blockerCount} blockers` : 'No blockers'}
              accent={blockerCount ? appleColors.red : appleColors.green}
              bg={blockerCount ? '#fff1f2' : '#e7f8ee'}
            />
          </Stack>
        </Stack>

        {ownerRisks.length > 0 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(3, minmax(0, 1fr))' }, gap: 1, mt: 1.5 }}>
            {ownerRisks.slice(0, 3).map((risk, index) => (
              <Box key={risk.id} sx={{ p: 1.25, borderRadius: 1, bgcolor: '#fff', border: '1px solid', borderColor: appleColors.line }}>
                <PastelChip label={index === 0 ? 'Fix first' : 'Schedule'} accent={index === 0 ? appleColors.red : appleColors.amber} bg={index === 0 ? '#fff1f2' : '#fff4dc'} />
                <Typography sx={{ mt: 0.85, fontWeight: 900, lineHeight: 1.35 }}>{risk.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>{risk.impact}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.8 }}>
                  {risk.proof}
                </Typography>
                {risk.service && (
                  <Box sx={{ mt: 0.9 }}>
                    <PastelChip label={risk.service} accent={appleColors.purple} />
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{ mb: 1.5 }}>
        <StudioAssistantCard
          title="AI Service Selector"
          description="Narrow the work that belongs in the project start plan, using the verdict, scanner proof, current cart, and dependencies."
          prompt={`Recommend the most relevant lifecycle services for ${product?.name || 'the selected product'}. Consider current diagnosis, scanner findings, product stage, cart services, dependencies, and launch readiness. Use these visible project start facts directly: ${cartStartPromptFacts} Explain why each service should or should not be selected, identify which missing services are required before workspace start, and avoid proposing services that are already in the cart unless the owner should revisit scope.`}
          conversationId={`studio-services-${product?.id || 'none'}`}
          context={assistantContext}
          disabled={!product}
          {...assistantActions}
          accent={appleColors.cyan}
          cta="Recommend Services"
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' }, gap: 1.25 }}>
        {categories.map((category, index) => {
          const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
          const categoryModules = catalogModules.filter((module) => module.category?.id === category.id);
          const selected = categoryModules.some((module) => recommendedServiceIds.has(module.id) || cartServiceIds.has(module.id));

          return (
            <Box
              key={category.id}
              sx={{
                p: 1.5,
                borderRadius: 1,
                border: '1px solid',
                borderColor: selected ? `${palette.accent}55` : appleColors.line,
                bgcolor: selected ? palette.soft : '#fff',
                minHeight: 220,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.1,
              }}
            >
              <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h4" sx={{ lineHeight: 1.25 }}>{category.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                    {category.description || 'Specialist service category.'}
                  </Typography>
                </Box>
                <Box sx={{ width: 34, height: 34, borderRadius: 1, bgcolor: palette.bg, color: palette.accent, display: 'grid', placeItems: 'center', fontWeight: 900, flexShrink: 0 }}>
                  {index + 1}
                </Box>
              </Stack>

              <Stack spacing={0.75} sx={{ flex: 1 }}>
                {categoryModules.slice(0, 4).map((module) => {
                  const cartItem = cartServiceItems.find((item) => item.serviceModule.id === module.id);
                  const inCart = !!cartItem;
                  const recommended = recommendedServiceIds.has(module.id) || mappedServiceNames.includes(module.name);

                  return (
                    <Box
                      key={module.id}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) 38px',
                        alignItems: 'center',
                        gap: 0.75,
                        minHeight: 46,
                        px: 1,
                        py: 0.8,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: inCart || recommended ? `${palette.accent}4d` : '#e5edf7',
                        bgcolor: inCart ? palette.bg : '#fff',
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={0.6} alignItems="center" sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 900, color: appleColors.ink }} noWrap>
                            {module.name}
                          </Typography>
                          {recommended && <AutoAwesomeOutlined sx={{ color: palette.accent, fontSize: 15, flexShrink: 0 }} />}
                        </Stack>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {module.timelineRange || module.priceRange || module.ownerOutcome || 'Lifecycle module'}
                        </Typography>
                      </Box>
                      <Tooltip title={inCart ? 'Remove from project start plan' : 'Add to project start plan'}>
                        <span>
                          <IconButton
                            size="small"
                            disabled={!product || isAddingService || isRemovingService}
                            onClick={() => {
                              if (cartItem) {
                                onRemoveService(cartItem.id);
                              } else {
                                onAddService(module, category.name);
                              }
                            }}
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: 1,
                              color: inCart ? appleColors.red : palette.accent,
                              bgcolor: inCart ? '#fff7f8' : palette.bg,
                              border: '1px solid',
                              borderColor: inCart ? '#fecdd3' : `${palette.accent}24`,
                            }}
                          >
                            {inCart ? <DeleteOutlineOutlined fontSize="small" /> : <AddShoppingCartOutlined fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  );
                })}
              </Stack>

              <DotLabel label={selected ? 'Part of the fix path' : 'Available'} color={selected ? palette.accent : appleColors.muted} />
            </Box>
          );
        })}
      </Box>

      {!categories.length && (
        <Box sx={{ mt: 1.5, p: 1.5, border: '1px dashed', borderColor: appleColors.line, borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">Service catalog data is not available yet.</Typography>
        </Box>
      )}
    </Surface>
  );
}
