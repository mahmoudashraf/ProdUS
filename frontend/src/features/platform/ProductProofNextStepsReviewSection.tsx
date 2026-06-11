'use client';

import { Alert, Box, Stack } from '@mui/material';
import { AiDocumentUsageList } from './ProductOnboardingDocumentUsageList';
import { ProductOnboardingReviewSection } from './ProductOnboardingReviewSection';
import { AiReviewList } from './ProductOnboardingReviewCards';
import { appleColors } from './PlatformComponents';
import type { AiAssistedProductAnalysisResponse } from './types';

export function ProductProofNextStepsReviewSection({
  analysis,
  documentUsageMissing,
}: {
  analysis: AiAssistedProductAnalysisResponse;
  documentUsageMissing: boolean;
}) {
  const documentUsage = analysis.analysis.documentUsage ?? [];

  return (
    <ProductOnboardingReviewSection
      title="Proof, assumptions, and next steps"
      subtitle="Check which files were used, what launch checks matter, what AI assumed, and what proof is still missing."
    >
      <Stack spacing={1}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', xl: 'repeat(3, 1fr)' },
            gap: 1,
          }}
        >
          <AiReviewList
            title="Launch checks to watch"
            items={analysis.analysis.scannerFocusAreas ?? []}
            empty="No launch checks returned."
            accent={appleColors.red}
          />
          <AiReviewList
            title="Source insights"
            items={analysis.analysis.sourceInsights ?? []}
            empty="No source insights returned."
            accent={appleColors.cyan}
          />
          <AiReviewList
            title="Suggested next steps"
            items={analysis.analysis.suggestedNextSteps ?? []}
            empty="No next steps returned."
            accent={appleColors.green}
          />
        </Box>
        {documentUsage.length > 0 && <AiDocumentUsageList usage={documentUsage} />}
        {documentUsageMissing && (
          <Alert severity="warning" sx={{ borderRadius: 1 }}>
            LoomAI analyzed the brief but did not return document-use proof. Re-run analysis or
            treat the uploaded file as not proven for this creation decision.
          </Alert>
        )}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 1,
          }}
        >
          <AiReviewList
            title="Assumptions"
            items={analysis.analysis.assumptions}
            empty="No assumptions returned."
            accent={appleColors.blue}
          />
          <AiReviewList
            title="Missing proof"
            items={analysis.analysis.missingEvidence}
            empty="No missing proof returned."
            accent={appleColors.amber}
          />
        </Box>
      </Stack>
    </ProductOnboardingReviewSection>
  );
}
