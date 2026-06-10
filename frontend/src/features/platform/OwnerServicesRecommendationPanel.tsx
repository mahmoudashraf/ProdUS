'use client';

import type { ComponentProps } from 'react';
import { Box } from '@mui/material';
import { Surface, appleColors } from './PlatformComponents';
import StudioAssistantCard, { type StudioAssistantContext } from './StudioAssistantCard';
import OwnerServiceCatalogFamiliesPanel from './OwnerServiceCatalogFamiliesPanel';
import OwnerServiceDecisionBridgePanel, { type OwnerServiceDecisionRisk } from './OwnerServiceDecisionBridgePanel';
import OwnerServicePriorityList from './OwnerServicePriorityList';
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
  const priorityServices = Array.from(
    new Map(
      [
        primaryService,
        ...catalogModules.filter((module) => mappedServiceNames.includes(module.name)),
        ...recommendedServices,
        ...cartServiceItems.map((item) => item.serviceModule),
      ]
        .filter((service): service is ServiceModule => Boolean(service))
        .map((service) => [service.id, service])
    ).values()
  ).slice(0, 6);

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
          description="Narrow the work that belongs in the product plan, using the verdict, scanner proof, current cart, and dependencies."
          prompt={`Recommend the most relevant lifecycle services for ${product?.name || 'the selected product'}. Consider current diagnosis, scanner findings, product stage, cart services, dependencies, and launch readiness. Use these visible project start facts directly: ${cartStartPromptFacts} Explain why each service should or should not be selected, identify which missing services are required before workspace start, and avoid proposing services that are already in the cart unless the owner should revisit scope.`}
          conversationId={`studio-services-${product?.id || 'none'}`}
          context={assistantContext}
          disabled={!product}
          {...assistantActions}
          accent={appleColors.cyan}
          cta="Recommend Services"
        />
      </Box>

      <OwnerServicePriorityList
        product={product}
        services={priorityServices}
        recommendedServiceIds={recommendedServiceIds}
        mappedServiceNames={mappedServiceNames}
        cartServiceItems={cartServiceItems}
        isAddingService={isAddingService}
        isRemovingService={isRemovingService}
        onAddService={onAddService}
        onRemoveService={onRemoveService}
      />

      <OwnerServiceCatalogFamiliesPanel
        product={product}
        categories={categories}
        catalogModules={catalogModules}
        recommendedServiceIds={recommendedServiceIds}
        cartServiceItems={cartServiceItems}
        cartServiceIds={cartServiceIds}
        mappedServiceNames={mappedServiceNames}
        isAddingService={isAddingService}
        isRemovingService={isRemovingService}
        onAddService={onAddService}
        onRemoveService={onRemoveService}
      />
    </Surface>
  );
}
