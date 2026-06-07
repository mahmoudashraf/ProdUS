'use client';

import type { FormEvent } from 'react';
import { Box } from '@mui/material';
import OwnerProductCreationPanel from './OwnerProductCreationPanel';
import OwnerServiceBriefIntakePanel from './OwnerServiceBriefIntakePanel';
import OwnerServicePlanDetailPanel from './OwnerServicePlanDetailPanel';
import type {
  AssistantActionProps,
  OwnerProductFormValues,
  OwnerRequirementFormValues,
  OwnerServicePlanAssistantContext,
} from './ownerServicePlanTypes';
import type {
  PackageInstance,
  PackageModule,
  ProductProfile,
  RequirementIntake,
  ServiceModule,
} from './types';

type OwnerServicePlanPanelProps = {
  showProductCreation: boolean;
  selectedProduct?: ProductProfile | undefined;
  productFormValues: OwnerProductFormValues;
  requirementFormValues: OwnerRequirementFormValues;
  selectedProductRequirements: RequirementIntake[];
  catalogModules: ServiceModule[];
  selectedPackage?: PackageInstance | undefined;
  packageModules: PackageModule[];
  isPackageFetching: boolean;
  isTeamRecommendationsFetching: boolean;
  isCreatingProduct: boolean;
  isCreatingRequirement: boolean;
  isBuildingPackage: boolean;
  cartStartPromptFacts: string;
  packageAssistantContext: OwnerServicePlanAssistantContext;
  assistantActions: AssistantActionProps;
  onProductValueChange: <K extends keyof OwnerProductFormValues>(key: K, value: OwnerProductFormValues[K]) => void;
  onRequirementValueChange: <K extends keyof OwnerRequirementFormValues>(key: K, value: OwnerRequirementFormValues[K]) => void;
  onSubmitProduct: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitRequirement: (event: FormEvent<HTMLFormElement>) => void;
  onBuildPackage: (requirementId: string) => void;
};

export default function OwnerServicePlanPanel({
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
}: OwnerServicePlanPanelProps) {
  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: showProductCreation ? '420px 1fr' : '1fr' }, gap: 2.5 }}>
        {showProductCreation && (
          <OwnerProductCreationPanel
            values={productFormValues}
            isCreating={isCreatingProduct}
            onValueChange={onProductValueChange}
            onSubmit={onSubmitProduct}
          />
        )}

        <OwnerServiceBriefIntakePanel
          selectedProduct={selectedProduct}
          values={requirementFormValues}
          requirements={selectedProductRequirements}
          catalogModules={catalogModules}
          isCreatingRequirement={isCreatingRequirement}
          isBuildingPackage={isBuildingPackage}
          onValueChange={onRequirementValueChange}
          onSubmit={onSubmitRequirement}
          onBuildPackage={onBuildPackage}
        />
      </Box>

      <OwnerServicePlanDetailPanel
        selectedProduct={selectedProduct}
        selectedPackage={selectedPackage}
        packageModules={packageModules}
        isPackageFetching={isPackageFetching}
        isTeamRecommendationsFetching={isTeamRecommendationsFetching}
        cartStartPromptFacts={cartStartPromptFacts}
        packageAssistantContext={packageAssistantContext}
        assistantActions={assistantActions}
      />
    </>
  );
}
