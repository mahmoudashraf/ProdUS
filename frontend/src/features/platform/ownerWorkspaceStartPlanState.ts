import type { StudioAssistantContext } from './StudioAssistantCard';
import type {
  PackageModule,
  ProductProfile,
  ProductizationCart,
  RequirementIntake,
  ServiceModule,
} from './types';

interface OwnerWorkspaceStartPlanStateInput {
  cart?: ProductizationCart | undefined;
  packageModules?: PackageModule[] | undefined;
  selectedProduct?: ProductProfile | undefined;
  selectedProductRequirements: RequirementIntake[];
}

export function buildOwnerWorkspaceStartPlanState({
  cart,
  packageModules,
  selectedProduct,
  selectedProductRequirements,
}: OwnerWorkspaceStartPlanStateInput) {
  const recommendedServices = packageModules?.length
    ? packageModules.map((module) => module.serviceModule)
    : selectedProductRequirements.map((requirement) => requirement.requestedServiceModule).filter(Boolean) as ServiceModule[];
  const cartServiceItems = cart?.serviceItems || [];
  const cartTalentItems = cart?.talentItems || [];
  const cartServiceIds = new Set(cartServiceItems.map((item) => item.serviceModule.id));
  const cartStartReadiness = cart?.startReadiness;
  const cartStartGaps = cartStartReadiness?.gaps || [];
  const cartBlockers = cartStartReadiness?.blockerCount ?? cart?.catalogEvaluation?.blockerCount ?? 0;
  const cartBlockingRecommendations = (cart?.catalogEvaluation?.recommendations || []).filter(
    (item) => item.severity === 'BLOCKER' && !item.alreadySelected
  );
  const cartBlockingGaps = cartStartGaps.filter((gap) => gap.blocking);
  const canStartProjectWorkspace = !!selectedProduct && (cartStartReadiness?.ready ?? (cartServiceItems.length > 0 && cartBlockers === 0));
  const cartStartContext: StudioAssistantContext['startReadiness'] = cartStartReadiness
    ? {
        status: cartStartReadiness.status,
        ready: cartStartReadiness.ready,
        summary: cartStartReadiness.summary,
        gaps: cartStartGaps.slice(0, 8).map((gap) => ({
          type: gap.type,
          severity: gap.severity,
          title: gap.title,
          description: gap.description,
          serviceModuleId: gap.serviceModule?.id,
          serviceModuleCode: gap.serviceModule?.stableCode || gap.serviceModule?.slug,
        })),
      }
    : undefined;
  const cartStartPromptFacts = `Project start plan: status ${cartStartReadiness?.status || 'not evaluated'}, ready ${cartStartReadiness?.ready ? 'yes' : 'no'}, summary "${cartStartReadiness?.summary || 'not available'}". Selected services: ${cartServiceItems.map((item) => `${item.serviceModule.name}${item.serviceModule.stableCode ? ` (${item.serviceModule.stableCode})` : ''}`).join(', ') || 'none'}. Start gaps: ${cartStartGaps.slice(0, 8).map((gap) => `${gap.title} (${gap.severity}${gap.serviceModule?.stableCode ? `, ${gap.serviceModule.stableCode}` : ''}): ${gap.description || 'no description'}`).join('; ') || 'none'}. Next actions: ${(cartStartReadiness?.nextBestActions || []).join('; ') || 'none'}.`;

  return {
    canStartProjectWorkspace,
    cartBlockers,
    cartBlockingGaps,
    cartBlockingRecommendations,
    cartServiceIds,
    cartServiceItems,
    cartStartContext,
    cartStartGaps,
    cartStartPromptFacts,
    cartTalentItems,
    recommendedServices,
  };
}
