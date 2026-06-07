'use client';

import type { ComponentProps } from 'react';
import {
  AddShoppingCartOutlined,
  AutoAwesomeOutlined,
  DeleteOutlineOutlined,
} from '@mui/icons-material';
import { Box, Stack, Tooltip, IconButton, Typography } from '@mui/material';
import {
  DotLabel,
  Surface,
  appleColors,
  categoryPalette,
} from './PlatformComponents';
import StudioAssistantCard, { type StudioAssistantContext } from './StudioAssistantCard';
import OwnerServiceDecisionBridgePanel, { type OwnerServiceDecisionRisk } from './OwnerServiceDecisionBridgePanel';
import type {
  ProductProfile,
  ProductizationCartServiceItem,
  ServiceCategory,
  ServiceModule,
} from './types';

type AssistantActionProps = Pick<ComponentProps<typeof StudioAssistantCard>, 'onConfirmAction' | 'actionDisabledReason'>;

export type OwnerServiceRiskSummary = OwnerServiceDecisionRisk;

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
  const primaryService =
    catalogModules.find((module) => mappedServiceNames.includes(module.name))
    || recommendedServices.find((service) => !cartServiceIds.has(service.id))
    || cartServiceItems[0]?.serviceModule
    || recommendedServices[0];
  const primaryServiceName = primaryService?.name || mappedServiceNames[0] || 'Launch Hardening Sprint';
  const primaryServiceInPlan = !!primaryService && cartServiceIds.has(primaryService.id);

  return (
    <Surface>
      <OwnerServiceDecisionBridgePanel
        categoriesCount={categories.length}
        blockerCount={blockerCount}
        improvementCount={improvementCount}
        cartServiceCount={cartServiceItems.length}
        mappedServiceCount={mappedServiceNames.length}
        primaryServiceName={primaryServiceName}
        primaryService={primaryService}
        primaryServiceInPlan={primaryServiceInPlan}
        ownerRisks={ownerRisks}
        isAddingService={isAddingService}
        onAddPrimaryService={onAddService}
      />

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
