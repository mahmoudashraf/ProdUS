'use client';

import type { ComponentProps } from 'react';
import OwnerWorkspaceServicesPane from './OwnerWorkspaceServicesPane';
import type { ServicesJourneyView } from './ownerWorkspaceJourneyConfig';
import type { WorkspaceTab } from './ownerWorkspaceModel';

type ServicesPaneProps = ComponentProps<typeof OwnerWorkspaceServicesPane>;
type RecommendProps = ServicesPaneProps['recommend'];
type PlanProps = ServicesPaneProps['plan'];
type TeamProps = ServicesPaneProps['team'];

interface OwnerWorkspaceServicesAreaProps {
  activeShortlists: TeamProps['activeShortlists'];
  assistantActions: RecommendProps['assistantActions'];
  blockerCount: number;
  cartServiceIds: RecommendProps['cartServiceIds'];
  cartServiceItems: RecommendProps['cartServiceItems'];
  cartStartPromptFacts: RecommendProps['cartStartPromptFacts'];
  cartTalentItems: TeamProps['cartTalentItems'];
  catalogModules: RecommendProps['catalogModules'];
  categories: RecommendProps['categories'];
  detailOpen: boolean;
  hasServicePlan: TeamProps['hasServicePlan'];
  improvementCount: number;
  isAcceptingProposal: boolean;
  isAddingService: boolean;
  isAddingTalent: boolean;
  isBuildingPackage: boolean;
  isCreatingProduct: boolean;
  isCreatingRequirement: boolean;
  isPackageFetching: boolean;
  isRemovingService: boolean;
  isRemovingTalent: boolean;
  isShortlisting: boolean;
  isTeamRecommendationsFetching: boolean;
  mappedServiceNames: RecommendProps['mappedServiceNames'];
  onAcceptProposal: TeamProps['onAcceptProposal'];
  onAddExpert: TeamProps['onAddExpert'];
  onAddRecommendationTeam: TeamProps['onAddRecommendationTeam'];
  onAddService: RecommendProps['onAddService'];
  onAddTeam: TeamProps['onAddTeam'];
  onBuildPackage: PlanProps['onBuildPackage'];
  onProductValueChange: PlanProps['onProductValueChange'];
  onRecordShortlist: TeamProps['onRecordShortlist'];
  onRemoveService: RecommendProps['onRemoveService'];
  onRemoveTalent: TeamProps['onRemoveTalent'];
  onRequirementValueChange: PlanProps['onRequirementValueChange'];
  onSubmitProduct: PlanProps['onSubmitProduct'];
  onSubmitRequirement: PlanProps['onSubmitRequirement'];
  ownerRisks: RecommendProps['ownerRisks'];
  packageAssistantContext: PlanProps['packageAssistantContext'];
  packageModules: PlanProps['packageModules'];
  productFormValues: PlanProps['productFormValues'];
  productProposals: TeamProps['productProposals'];
  recommendationAssistantContext: RecommendProps['assistantContext'];
  recommendations: TeamProps['recommendations'];
  recommendedServices: RecommendProps['recommendedServices'];
  requirementFormValues: PlanProps['requirementFormValues'];
  selectedPackage: PlanProps['selectedPackage'];
  selectedProduct: RecommendProps['product'];
  selectedProductRequirements: PlanProps['selectedProductRequirements'];
  showProductCreation: boolean;
  suggestedExperts: TeamProps['suggestedExperts'];
  suggestedTeams: TeamProps['suggestedTeams'];
  view: ServicesJourneyView;
  workspaceTab: WorkspaceTab;
}

export default function OwnerWorkspaceServicesArea({
  activeShortlists,
  assistantActions,
  blockerCount,
  cartServiceIds,
  cartServiceItems,
  cartStartPromptFacts,
  cartTalentItems,
  catalogModules,
  categories,
  detailOpen,
  hasServicePlan,
  improvementCount,
  isAcceptingProposal,
  isAddingService,
  isAddingTalent,
  isBuildingPackage,
  isCreatingProduct,
  isCreatingRequirement,
  isPackageFetching,
  isRemovingService,
  isRemovingTalent,
  isShortlisting,
  isTeamRecommendationsFetching,
  mappedServiceNames,
  onAcceptProposal,
  onAddExpert,
  onAddRecommendationTeam,
  onAddService,
  onAddTeam,
  onBuildPackage,
  onProductValueChange,
  onRecordShortlist,
  onRemoveService,
  onRemoveTalent,
  onRequirementValueChange,
  onSubmitProduct,
  onSubmitRequirement,
  ownerRisks,
  packageAssistantContext,
  packageModules,
  productFormValues,
  productProposals,
  recommendationAssistantContext,
  recommendations,
  recommendedServices,
  requirementFormValues,
  selectedPackage,
  selectedProduct,
  selectedProductRequirements,
  showProductCreation,
  suggestedExperts,
  suggestedTeams,
  view,
  workspaceTab,
}: OwnerWorkspaceServicesAreaProps) {
  if (workspaceTab !== 'services') return null;

  return (
    <OwnerWorkspaceServicesPane
      view={view}
      detailOpen={detailOpen}
      recommend={{
        product: selectedProduct,
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
        assistantContext: recommendationAssistantContext,
        assistantActions,
        isAddingService,
        isRemovingService,
        onAddService,
        onRemoveService,
      }}
      plan={{
        showProductCreation,
        selectedProduct,
        productFormValues,
        requirementFormValues,
        selectedProductRequirements,
        catalogModules,
        selectedPackage,
        packageModules,
        isPackageFetching,
        isTeamRecommendationsFetching,
        isCreatingProduct,
        isCreatingRequirement,
        isBuildingPackage,
        cartStartPromptFacts,
        packageAssistantContext,
        assistantActions,
        onProductValueChange,
        onRequirementValueChange,
        onSubmitProduct,
        onSubmitRequirement,
        onBuildPackage,
      }}
      team={{
        recommendations,
        productProposals,
        cartTalentItems,
        activeShortlists,
        suggestedTeams,
        suggestedExperts,
        hasServicePlan,
        isAddingTalent,
        isRemovingTalent,
        isShortlisting,
        isAcceptingProposal,
        onAddRecommendationTeam,
        onAddTeam,
        onAddExpert,
        onRemoveTalent,
        onRecordShortlist,
        onAcceptProposal,
      }}
    />
  );
}
