'use client';

import type { ReactNode } from 'react';
import { ExpandMoreOutlined } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Stack, Typography } from '@mui/material';
import { AiOpportunityDiscoveryPanel } from './OwnerOnboardingJourneyCards';
import {
  AiAttributeCard,
  AiDocumentUsageList,
  AiReviewList,
} from './ProductOnboardingAiPanels';
import {
  AiServicePlanReview,
  LoomAIOverviewPanel,
} from './ProductOnboardingServiceReviewPanels';
import { appleColors } from './PlatformComponents';
import type { AiAssistedProductAnalysisResponse, ServiceModuleRecommendation } from './types';

export interface ProductOnboardingAttributeItem {
  label: string;
  value?: string | null | undefined;
  source: string;
  accent: string;
  wide?: boolean;
}

function ReviewSection({
  title,
  subtitle,
  defaultExpanded,
  children,
}: {
  title: string;
  subtitle: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}) {
  return (
    <Accordion
      defaultExpanded={Boolean(defaultExpanded)}
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: appleColors.line,
        borderRadius: 1,
        bgcolor: '#fff',
        '&:before': { display: 'none' },
        '& + &': { mt: 1 },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreOutlined />} sx={{ px: 1.25, minHeight: 66 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 950 }}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, lineHeight: 1.45 }}>
            {subtitle}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 1.25, pt: 0, pb: 1.25 }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}

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
  const documentUsage = analysis.analysis.documentUsage ?? [];

  return (
    <>
      <ReviewSection
        title="Product understanding"
        subtitle="Open this when the product name, users, outcome, or technical context need a closer owner check."
        defaultExpanded
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
      </ReviewSection>

      <ReviewSection
        title="Service path"
        subtitle="Choose the services that should seed the start plan before creating the product."
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
      </ReviewSection>

      <ReviewSection
        title="AI opportunities"
        subtitle="Review optional AI integration ideas and LoomAI implementation context."
      >
        <Stack spacing={1}>
          <AiOpportunityDiscoveryPanel report={analysis.aiOpportunityReport} />
          <LoomAIOverviewPanel overview={analysis.loomaiIntegrationOverview} />
        </Stack>
      </ReviewSection>

      <ReviewSection
        title="Proof, assumptions, and next steps"
        subtitle="Check document usage, scanner focus, source insights, assumptions, and missing evidence."
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
      </ReviewSection>
    </>
  );
}
