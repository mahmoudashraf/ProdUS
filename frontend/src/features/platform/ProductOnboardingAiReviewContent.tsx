'use client';

import { Alert, Box, Stack, Typography } from '@mui/material';
import { AiOpportunityDiscoveryPanel } from './OwnerJourneyCards';
import {
  AiAttributeCard,
  AiDocumentUsageList,
  AiReviewList,
  AiServicePlanReview,
  LoomAIOverviewPanel,
} from './ProductOnboardingAiPanels';
import { DotLabel, appleColors, formatLabel } from './PlatformComponents';
import type { ProductOnboardingProfileDraft } from './ProductOnboardingAnalysisTypes';
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
  const projectAttributes = [
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
      <Stack spacing={1}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ sm: 'center' }}
        >
          <Typography variant="body2" sx={{ fontWeight: 900 }}>
            AI project attributes
          </Typography>
          <DotLabel
            label={analysis.intent.analysisProviderRequestId ? 'LoomAI analyzed' : 'Fallback analysis'}
            color={analysis.intent.analysisProviderRequestId ? appleColors.green : appleColors.amber}
          />
        </Stack>
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
          <AiReviewList
            title="Scanner focus"
            items={analysis.analysis.scannerFocusAreas ?? []}
            empty="No scanner focus returned."
            accent={appleColors.red}
          />
          <AiReviewList
            title="Source insights"
            items={analysis.analysis.sourceInsights ?? []}
            empty="No source insights returned."
            accent={appleColors.cyan}
          />
        </Box>
        <AiServicePlanReview
          recommendations={reviewedServiceRecommendations}
          selectedCodes={selectedServiceCodes}
          onToggle={onToggleServiceRecommendation}
          onMove={onMoveServiceRecommendation}
        />
        <AiOpportunityDiscoveryPanel report={analysis.aiOpportunityReport} />
        <LoomAIOverviewPanel overview={analysis.loomaiIntegrationOverview} />
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
        <AiReviewList
          title="Suggested next steps"
          items={analysis.analysis.suggestedNextSteps ?? []}
          empty="No next steps returned."
          accent={appleColors.green}
        />
        {documentUsage.length > 0 && <AiDocumentUsageList usage={documentUsage} />}
        {documentUsageMissing && (
          <Alert severity="warning" sx={{ borderRadius: 1 }}>
            LoomAI analyzed the brief but did not return document usage evidence. Re-run analysis or
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
    </Box>
  );
}
