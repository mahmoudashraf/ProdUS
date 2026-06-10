'use client';

import { Box, Stack, Typography } from '@mui/material';
import { DotLabel, appleColors, formatLabel } from './PlatformComponents';
import ProductOnboardingUnderstandingSummary from './ProductOnboardingUnderstandingSummary';
import ProductOnboardingDetailedReviewSections from './ProductOnboardingDetailedReviewSections';
import type {
  ProductOnboardingAttributeItem,
  ProductOnboardingProfileDraft,
} from './ProductOnboardingAnalysisTypes';
import type { AiAssistedProductAnalysisResponse, ServiceModuleRecommendation } from './types';

export default function ProductOnboardingAiReviewContent({
  analysis,
  profile,
  reviewedServiceRecommendations,
  selectedServiceCodes,
  onMoveServiceRecommendation,
  onToggleServiceRecommendation,
}: {
  analysis: AiAssistedProductAnalysisResponse;
  profile: ProductOnboardingProfileDraft;
  reviewedServiceRecommendations: ServiceModuleRecommendation[];
  selectedServiceCodes: string[];
  onMoveServiceRecommendation: (moduleCode: string, direction: -1 | 1) => void;
  onToggleServiceRecommendation: (moduleCode: string) => void;
}) {
  const documentUsage = analysis.analysis.documentUsage ?? [];
  const documentUsageMissing =
    Boolean(analysis.aiSharedDocuments.length) && documentUsage.length === 0;
  const missingCatalogCoverage = analysis.analysis.missingCatalogCoverage ?? [];
  const productAnalysisLive = analysis.aiApplied && !analysis.fallbackReason;
  const liveSource = productAnalysisLive ? 'AI' : 'Owner/rules';
  const fieldSource = (hasValue: boolean, fallbackSource = 'Needs input') =>
    hasValue ? liveSource : fallbackSource;
  const projectAttributes: ProductOnboardingAttributeItem[] = [
    {
      label: 'Product name',
      value: analysis.analysis.productName,
      source: fieldSource(Boolean(analysis.analysis.productName), 'Owner'),
      accent: appleColors.purple,
    },
    {
      label: 'Business stage',
      value: formatLabel(analysis.analysis.businessStage || profile.businessStage),
      source: fieldSource(Boolean(analysis.analysis.businessStage), 'Owner'),
      accent: appleColors.amber,
    },
    {
      label: 'Outcome summary',
      value: analysis.analysis.summary,
      source: fieldSource(Boolean(analysis.analysis.summary), 'Owner/rules'),
      accent: appleColors.blue,
      wide: true,
    },
    {
      label: 'Project understanding',
      value: analysis.analysis.projectDescription,
      source: fieldSource(Boolean(analysis.analysis.projectDescription)),
      accent: appleColors.purple,
      wide: true,
    },
    {
      label: 'Business problem',
      value: analysis.analysis.businessProblem,
      source: fieldSource(Boolean(analysis.analysis.businessProblem)),
      accent: appleColors.amber,
    },
    {
      label: 'Target users',
      value: analysis.analysis.targetUsers,
      source: fieldSource(Boolean(analysis.analysis.targetUsers)),
      accent: appleColors.cyan,
    },
    {
      label: 'Tech stack',
      value: analysis.analysis.techStack || profile.techStack,
      source: fieldSource(Boolean(analysis.analysis.techStack), 'Owner'),
      accent: appleColors.cyan,
    },
    {
      label: 'Repository',
      value: analysis.analysis.repositoryUrl || profile.repositoryUrl,
      source: fieldSource(Boolean(analysis.analysis.repositoryUrl), 'Owner'),
      accent: appleColors.green,
    },
    {
      label: 'Product URL',
      value: analysis.analysis.productUrl || profile.productUrl,
      source: fieldSource(Boolean(analysis.analysis.productUrl), 'Owner'),
      accent: appleColors.blue,
    },
    {
      label: 'Known rough edges',
      value: analysis.analysis.riskProfile || profile.riskProfile,
      source: fieldSource(Boolean(analysis.analysis.riskProfile), 'Owner'),
      accent: appleColors.red,
    },
    {
      label: 'AI creation summary',
      value: analysis.analysis.aiCreationSummary,
      source: productAnalysisLive ? 'AI' : 'Owner/rules',
      accent: appleColors.purple,
      wide: true,
    },
  ];

  return (
    <Box
      sx={{
        border: '1px solid #dfe7f5',
        borderRadius: 1,
        bgcolor: '#fff',
        p: 1.5,
      }}
    >
      <Stack spacing={1.1}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ sm: 'center' }}
        >
          <Typography variant="body2" sx={{ fontWeight: 900 }}>
            AI understanding review
          </Typography>
          <DotLabel
            label={productAnalysisLive ? 'LoomAI analyzed' : 'AI failed - owner/rules used'}
            color={productAnalysisLive ? appleColors.green : appleColors.amber}
          />
        </Stack>
        <ProductOnboardingUnderstandingSummary
          analysis={analysis}
          profile={profile}
          reviewedServiceRecommendations={reviewedServiceRecommendations}
          selectedServiceCodes={selectedServiceCodes}
        />
        <ProductOnboardingDetailedReviewSections
          analysis={analysis}
          documentUsageMissing={documentUsageMissing}
          missingCatalogCoverage={missingCatalogCoverage}
          productAnalysisLive={productAnalysisLive}
          projectAttributes={projectAttributes}
          reviewedServiceRecommendations={reviewedServiceRecommendations}
          selectedServiceCodes={selectedServiceCodes}
          onMoveServiceRecommendation={onMoveServiceRecommendation}
          onToggleServiceRecommendation={onToggleServiceRecommendation}
        />
      </Stack>
    </Box>
  );
}
