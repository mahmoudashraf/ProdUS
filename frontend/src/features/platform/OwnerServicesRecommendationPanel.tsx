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
  const availableServiceNames = priorityServices
    .map((service) => `${service.name}${service.stableCode ? ` (${service.stableCode})` : ''}`)
    .join(', ') || 'none visible';
  const selectedServiceNames = cartServiceItems
    .map((item) => `${item.serviceModule.name}${item.serviceModule.stableCode ? ` (${item.serviceModule.stableCode})` : ''}`)
    .join(', ') || 'none';
  const mappedServiceSummary = mappedServiceNames.join(', ') || 'none';
  const serviceSelectorPrompt = `
Draft a short owner decision note for ${product?.name || 'the selected product'} from the facts below.
This is not a knowledge-base search. Do not retrieve, search, or ask for a domain. Use only these supplied page facts.
Visible service choices: ${availableServiceNames}.
Services already in the product plan: ${selectedServiceNames}.
Services mapped from scanner/readiness evidence: ${mappedServiceSummary}.
Current launch blockers: ${blockerCount}; improvements: ${improvementCount}.
Product plan facts: ${cartStartPromptFacts}
Give the owner three clear sections:
1. Add now: the required service gaps or blocker work to add before delivery can start.
2. Keep or revisit: selected services that still make sense, and why.
3. Defer: work that can wait until the blockers are resolved.
Explain each decision in practical startup/MVP language, naming the blocker, scanner proof, or product-plan gap it addresses.
If a required service is missing from the visible choices, say it is a product-plan gap instead of inventing a new service.
`.trim();

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
          prompt={serviceSelectorPrompt}
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
