'use client';

import { Box, Stack, Typography } from '@mui/material';
import { ProductOnboardingReviewSection } from './ProductOnboardingReviewSection';
import { AiServicePlanReview } from './ProductOnboardingServiceReviewPanels';
import { appleColors } from './PlatformComponents';
import type {
  AiAssistedProductAnalysisResponse,
  ServiceModuleRecommendation,
} from './types';

export function ProductServicePathReviewSection({
  missingCatalogCoverage,
  reviewedServiceRecommendations,
  selectedServiceCodes,
  onMoveServiceRecommendation,
  onToggleServiceRecommendation,
}: {
  missingCatalogCoverage: NonNullable<AiAssistedProductAnalysisResponse['analysis']['missingCatalogCoverage']>;
  reviewedServiceRecommendations: ServiceModuleRecommendation[];
  selectedServiceCodes: string[];
  onMoveServiceRecommendation: (moduleCode: string, direction: -1 | 1) => void;
  onToggleServiceRecommendation: (moduleCode: string) => void;
}) {
  return (
    <ProductOnboardingReviewSection
      title="Service path"
      subtitle="Choose the services that should seed the product plan before creating the product."
    >
      <Stack spacing={1}>
        <AiServicePlanReview
          recommendations={reviewedServiceRecommendations}
          selectedCodes={selectedServiceCodes}
          onToggle={onToggleServiceRecommendation}
          onMove={onMoveServiceRecommendation}
        />
        {missingCatalogCoverage.length > 0 && (
          <Box
            sx={{
              p: 1.2,
              borderRadius: 1,
              border: `1px solid ${appleColors.amber}28`,
              bgcolor: `${appleColors.amber}08`,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 950 }}>
              Service gaps
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 0.75 }}>
              {missingCatalogCoverage.slice(0, 4).map(item => (
                <Typography
                  key={`${item.need}-${item.reason}`}
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', lineHeight: 1.5 }}
                >
                  <Box component="strong" sx={{ color: appleColors.ink }}>
                    {item.need}
                  </Box>
                  {item.reason ? ` - ${item.reason}` : ''}
                  {item.suggestedCatalogAction ? ` (${item.suggestedCatalogAction})` : ''}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </ProductOnboardingReviewSection>
  );
}
