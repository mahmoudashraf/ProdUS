'use client';

import { Box, Stack } from '@mui/material';
import {
  AiAttributeCard,
  AiReviewList,
} from './ProductOnboardingReviewCards';
import { ProductOnboardingReviewSection } from './ProductOnboardingReviewSection';
import { appleColors } from './PlatformComponents';
import type { ProductOnboardingAttributeItem } from './ProductOnboardingAnalysisTypes';
import type { AiAssistedProductAnalysisResponse } from './types';

export function ProductUnderstandingReviewSection({
  analysis,
  projectAttributes,
}: {
  analysis: AiAssistedProductAnalysisResponse;
  projectAttributes: ProductOnboardingAttributeItem[];
}) {
  return (
    <ProductOnboardingReviewSection
      title="Product understanding"
      subtitle="Open this when the product name, users, outcome, or technical context need a closer owner check."
    >
      <Stack spacing={1}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 1,
          }}
        >
          {projectAttributes.map(item => (
            <AiAttributeCard
              key={item.label}
              label={item.label}
              value={item.value}
              source={item.source}
              accent={item.accent}
              wide={item.wide}
            />
          ))}
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', xl: 'repeat(3, 1fr)' },
            gap: 1,
          }}
        >
          <AiReviewList
            title="Core capabilities"
            items={analysis.analysis.coreCapabilities ?? []}
            empty="No capabilities extracted yet."
            accent={appleColors.purple}
          />
          <AiReviewList
            title="Business outcomes"
            items={analysis.analysis.businessOutcomes ?? []}
            empty="No outcomes extracted yet."
            accent={appleColors.green}
          />
          <AiReviewList
            title="Launch goals"
            items={analysis.analysis.readinessGoals ?? []}
            empty="No launch goals extracted yet."
            accent={appleColors.blue}
          />
        </Box>
      </Stack>
    </ProductOnboardingReviewSection>
  );
}
