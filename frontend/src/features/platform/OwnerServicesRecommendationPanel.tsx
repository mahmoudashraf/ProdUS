'use client';

import type { ComponentProps } from 'react';
import NextLink from 'next/link';
import { ArrowForwardOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
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
  mode?: 'decision' | 'browse';
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
  mode = 'decision',
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
  const startGaps = assistantContext.startReadiness?.gaps || [];
  const blockerGapSummary = startGaps
    .filter((gap) => gap.severity === 'BLOCKER')
    .map((gap) => `${gap.title}${gap.serviceModuleCode ? ` (${gap.serviceModuleCode})` : ''}: ${gap.description || 'needs owner review'}`)
    .join('; ') || 'none';
  const recommendedGapSummary = startGaps
    .filter((gap) => gap.severity !== 'BLOCKER')
    .map((gap) => `${gap.title}${gap.serviceModuleCode ? ` (${gap.serviceModuleCode})` : ''}: ${gap.description || 'can follow blockers'}`)
    .join('; ') || 'none';
  const serviceSelectorPrompt = `
Write a short review-only owner decision note for ${product?.name || 'the selected product'}.
Do not create a product, prepare an action, or ask for action parameters.
Use the page facts below as the owner-specific source of truth.
Also search indexed ProdUS safe knowledge in service-module, service-dependency, and package-template for the listed service names, stable codes, blocker gaps, and launch-hardening package fit. Do not answer only from page facts when matching indexed service records are available.
Service choices on screen: ${availableServiceNames}.
Already selected work: ${selectedServiceNames}.
Scanner/readiness mapped work: ${mappedServiceSummary}.
Launch blockers: ${blockerCount}; improvements: ${improvementCount}.
Required gaps before delivery starts: ${blockerGapSummary}.
Later recommended gaps: ${recommendedGapSummary}.
Return exactly three plain sections:
Add now: the blocker work or missing required services to handle first.
Keep or revisit: selected services that still help and why.
Defer: work that can wait until blockers are resolved.
Use practical startup/MVP language and mention the blocker, scanner proof, or plan gap behind each decision.
When indexed safe knowledge is used, cite the matching source titles or stable codes in the response and return source basis metadata.
`.trim();
  const productHref = product ? `/products/${product.id}` : '#';

  if (mode === 'browse') {
    return (
      <Surface>
        <Box
          sx={{
            mb: 1.5,
            p: 1.5,
            borderRadius: 1,
            border: '1px solid',
            borderColor: '#bae6fd',
            bgcolor: '#f5fdff',
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ md: 'center' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h3">Browse only when scope needs adjustment</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.55, lineHeight: 1.6, maxWidth: 760 }}>
                The recommended-service page gives the default fix path. Use this page to ask AI for service fit, add or remove proof-linked services, or inspect catalog families.
              </Typography>
            </Box>
            <Button
              component={NextLink}
              href={`${productHref}?tab=services&view=plan`}
              variant="outlined"
              endIcon={<ArrowForwardOutlined />}
              disabled={!product}
              sx={{ minHeight: 42, alignSelf: { xs: 'flex-start', md: 'center' } }}
            >
              Open service plan
            </Button>
          </Stack>
        </Box>

        <Box sx={{ mb: 1.5 }}>
          <StudioAssistantCard
            title="AI Service Selector"
            description="Narrow the work that belongs in Planning, using the verdict, scanner proof, current scope, and dependencies."
            prompt={serviceSelectorPrompt}
            conversationId={`studio-services-${product?.id || 'none'}`}
            context={{
              ...assistantContext,
              vectorSpace: 'service-module',
              vectorSpaces: ['service-module', 'service-dependency', 'package-template'],
            }}
            disabled={!product}
            {...assistantActions}
            accent={appleColors.cyan}
            cta="Ask AI"
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

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1.25 }}>
        <ServiceRouteCard
          title="Adjust the service scope"
          detail="Use AI help, priority services, and catalog families only if the recommended path needs changes."
          cta="Browse services"
          href={`${productHref}?tab=services&view=browse`}
          disabled={!product}
          accent={appleColors.cyan}
        />
        <ServiceRouteCard
          title="Review Planning"
          detail="See selected services, missing required work, and the approval path before a delivery workspace starts."
          cta="Open service plan"
          href={`${productHref}?tab=services&view=plan`}
          disabled={!product}
          accent={appleColors.purple}
        />
      </Box>
    </Surface>
  );
}

function ServiceRouteCard({
  accent,
  cta,
  detail,
  disabled,
  href,
  title,
}: {
  accent: string;
  cta: string;
  detail: string;
  disabled?: boolean;
  href: string;
  title: string;
}) {
  return (
    <Box
      sx={{
        p: 1.35,
        borderRadius: 1,
        border: '1px solid',
        borderColor: `${accent}35`,
        bgcolor: '#fff',
        minWidth: 0,
      }}
    >
      <Typography sx={{ fontWeight: 950 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.55, lineHeight: 1.55 }}>
        {detail}
      </Typography>
      <Button
        component={NextLink}
        href={href}
        variant="outlined"
        size="small"
        disabled={Boolean(disabled)}
        endIcon={<ArrowForwardOutlined />}
        sx={{ mt: 1, minHeight: 34, color: accent, borderColor: `${accent}42`, '&:hover': { borderColor: accent, bgcolor: `${accent}08` } }}
      >
        {cta}
      </Button>
    </Box>
  );
}
