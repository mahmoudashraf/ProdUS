'use client';

import { Stack } from '@mui/material';
import { AiOpportunityDiscoveryPanel } from './AiOpportunityDiscoveryPanel';
import { ProductOnboardingReviewSection } from './ProductOnboardingReviewSection';
import { LoomAIOverviewPanel } from './ProductOnboardingServiceReviewPanels';
import type { AiAssistedProductAnalysisResponse } from './types';

export function ProductAiOpportunitiesReviewSection({
  analysis,
}: {
  analysis: AiAssistedProductAnalysisResponse;
}) {
  return (
    <ProductOnboardingReviewSection
      title="AI opportunities"
      subtitle="Review optional AI product ideas and the LoomAI starting context."
    >
      <Stack spacing={1}>
        <AiOpportunityDiscoveryPanel report={analysis.aiOpportunityReport} />
        <LoomAIOverviewPanel overview={analysis.loomaiIntegrationOverview} />
      </Stack>
    </ProductOnboardingReviewSection>
  );
}
