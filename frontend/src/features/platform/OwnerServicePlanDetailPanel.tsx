'use client';

import { Stack } from '@mui/material';
import {
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
} from './PlatformComponents';
import OwnerServicePlanEmptyBridge from './OwnerServicePlanEmptyBridge';
import StudioAssistantCard from './StudioAssistantCard';
import OwnerServicePlanSequencePreview from './OwnerServicePlanSequencePreview';
import OwnerServicePlanSummaryCard from './OwnerServicePlanSummaryCard';
import type {
  AssistantActionProps,
  OwnerServicePlanAssistantContext,
} from './ownerServicePlanTypes';
import type {
  PackageInstance,
  PackageModule,
  ProductProfile,
} from './types';

type OwnerServicePlanDetailPanelProps = {
  selectedProduct?: ProductProfile | undefined;
  selectedPackage?: PackageInstance | undefined;
  packageModules: PackageModule[];
  isPackageFetching: boolean;
  isTeamRecommendationsFetching: boolean;
  cartStartPromptFacts: string;
  packageAssistantContext: OwnerServicePlanAssistantContext;
  assistantActions: AssistantActionProps;
};

export default function OwnerServicePlanDetailPanel({
  selectedProduct,
  selectedPackage,
  packageModules,
  isPackageFetching,
  isTeamRecommendationsFetching,
  cartStartPromptFacts,
  packageAssistantContext,
  assistantActions,
}: OwnerServicePlanDetailPanelProps) {
  return (
    <Surface>
      <SectionTitle title="Service Plan" action={selectedPackage && <StatusChip label={selectedPackage.status} />} />
      {selectedPackage ? (
        <Stack spacing={2}>
          <OwnerServicePlanSummaryCard
            selectedPackage={selectedPackage}
            packageModules={packageModules}
            isLoading={isPackageFetching || isTeamRecommendationsFetching}
          />

          <StudioAssistantCard
            title="AI Package Recommendation"
            description="Validate this service plan against product goals, dependencies, delivery evidence, and team-readiness."
            prompt={`Evaluate the service plan "${selectedPackage.name}" for ${selectedProduct?.name || 'this product'}. Use these visible product plan facts directly: ${cartStartPromptFacts} Explain whether the package sequence is appropriate, which dependencies or proof gates matter, what a team should prove, and what the owner should decide next. Keep the answer practical for an MVP or AI-built prototype owner.`}
            conversationId={`studio-package-${selectedPackage.id}`}
            context={packageAssistantContext}
            {...assistantActions}
            accent={appleColors.purple}
            cta="Review Package"
          />

          <OwnerServicePlanSequencePreview packageModules={packageModules} />
        </Stack>
      ) : (
        <OwnerServicePlanEmptyBridge />
      )}
    </Surface>
  );
}
