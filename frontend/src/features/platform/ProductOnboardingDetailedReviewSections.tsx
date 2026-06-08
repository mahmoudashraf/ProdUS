'use client';

import { ProductAiOpportunitiesReviewSection } from './ProductAiOpportunitiesReviewSection';
import { ProductProofNextStepsReviewSection } from './ProductProofNextStepsReviewSection';
import { ProductServicePathReviewSection } from './ProductServicePathReviewSection';
import { ProductUnderstandingReviewSection } from './ProductUnderstandingReviewSection';
import type { ProductOnboardingAttributeItem } from './ProductOnboardingAnalysisTypes';
import type { AiAssistedProductAnalysisResponse, ServiceModuleRecommendation } from './types';

export type { ProductOnboardingAttributeItem } from './ProductOnboardingAnalysisTypes';

export default function ProductOnboardingDetailedReviewSections({
  analysis,
  documentUsageMissing,
  missingCatalogCoverage,
  projectAttributes,
  reviewedServiceRecommendations,
  selectedServiceCodes,
  onMoveServiceRecommendation,
  onToggleServiceRecommendation,
}: {
  analysis: AiAssistedProductAnalysisResponse;
  documentUsageMissing: boolean;
  missingCatalogCoverage: NonNullable<AiAssistedProductAnalysisResponse['analysis']['missingCatalogCoverage']>;
  projectAttributes: ProductOnboardingAttributeItem[];
  reviewedServiceRecommendations: ServiceModuleRecommendation[];
  selectedServiceCodes: string[];
  onMoveServiceRecommendation: (moduleCode: string, direction: -1 | 1) => void;
  onToggleServiceRecommendation: (moduleCode: string) => void;
}) {
  return (
    <>
      <ProductUnderstandingReviewSection
        analysis={analysis}
        projectAttributes={projectAttributes}
      />
      <ProductServicePathReviewSection
        missingCatalogCoverage={missingCatalogCoverage}
        reviewedServiceRecommendations={reviewedServiceRecommendations}
        selectedServiceCodes={selectedServiceCodes}
        onMoveServiceRecommendation={onMoveServiceRecommendation}
        onToggleServiceRecommendation={onToggleServiceRecommendation}
      />
      <ProductAiOpportunitiesReviewSection analysis={analysis} />
      <ProductProofNextStepsReviewSection
        analysis={analysis}
        documentUsageMissing={documentUsageMissing}
      />
    </>
  );
}
