'use client';

import { Box, Stack, Typography } from '@mui/material';
import { DotLabel, appleColors, formatLabel } from './PlatformComponents';
import ProductOnboardingUnderstandingSummary from './ProductOnboardingUnderstandingSummary';
import ProductOnboardingDetailedReviewSections from './ProductOnboardingDetailedReviewSections';
import type { ProductOnboardingAttributeItem, ProductOnboardingProfileDraft } from './ProductOnboardingAnalysisTypes';
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
  const projectAttributes: ProductOnboardingAttributeItem[] = [
    {
      label: 'Product name',
      value: analysis.analysis.productName,
      source: 'AI',
      accent: appleColors.purple,
    },
    {
      label: 'Business stage',
      value: formatLabel(analysis.analysis.businessStage || profile.businessStage),
      source: analysis.analysis.businessStage ? 'AI' : 'Owner',
      accent: appleColors.amber,
    },
    {
      label: 'Outcome summary',
      value: analysis.analysis.summary,
      source: 'AI',
      accent: appleColors.blue,
      wide: true,
    },
    {
      label: 'Project understanding',
      value: analysis.analysis.projectDescription,
      source: analysis.analysis.projectDescription ? 'AI' : 'Needs input',
      accent: appleColors.purple,
      wide: true,
    },
    {
      label: 'Business problem',
      value: analysis.analysis.businessProblem,
      source: analysis.analysis.businessProblem ? 'AI' : 'Needs input',
      accent: appleColors.amber,
    },
    {
      label: 'Target users',
      value: analysis.analysis.targetUsers,
      source: analysis.analysis.targetUsers ? 'AI' : 'Needs input',
      accent: appleColors.cyan,
    },
    {
      label: 'Tech stack',
      value: analysis.analysis.techStack || profile.techStack,
      source: analysis.analysis.techStack ? 'AI' : 'Owner',
      accent: appleColors.cyan,
    },
    {
      label: 'Repository',
      value: analysis.analysis.repositoryUrl || profile.repositoryUrl,
      source: analysis.analysis.repositoryUrl ? 'AI' : 'Owner',
      accent: appleColors.green,
    },
    {
      label: 'Product URL',
      value: analysis.analysis.productUrl || profile.productUrl,
      source: analysis.analysis.productUrl ? 'AI' : 'Owner',
      accent: appleColors.blue,
    },
    {
      label: 'Known rough edges',
      value: analysis.analysis.riskProfile || profile.riskProfile,
      source: analysis.analysis.riskProfile ? 'AI' : 'Owner',
      accent: appleColors.red,
    },
    {
      label: 'AI creation summary',
      value: analysis.analysis.aiCreationSummary,
      source: 'AI',
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
            label={analysis.intent.analysisProviderRequestId ? 'LoomAI analyzed' : 'Fallback analysis'}
            color={analysis.intent.analysisProviderRequestId ? appleColors.green : appleColors.amber}
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
