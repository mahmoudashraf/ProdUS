'use client';

import { AutoAwesomeOutlined, FactCheckOutlined, Inventory2Outlined } from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';
import { MetricTile, PastelChip, appleColors, formatLabel } from './PlatformComponents';
import type { ProductOnboardingProfileDraft } from './ProductOnboardingAnalysisTypes';
import type { AiAssistedProductAnalysisResponse, ServiceModuleRecommendation } from './types';

interface ProductOnboardingUnderstandingSummaryProps {
  analysis: AiAssistedProductAnalysisResponse;
  profile: ProductOnboardingProfileDraft;
  reviewedServiceRecommendations: ServiceModuleRecommendation[];
  selectedServiceCodes: string[];
}

export default function ProductOnboardingUnderstandingSummary({
  analysis,
  profile,
  reviewedServiceRecommendations,
  selectedServiceCodes,
}: ProductOnboardingUnderstandingSummaryProps) {
  const productName = analysis.analysis.productName || profile.name || 'New product';
  const stage = analysis.analysis.businessStage || profile.businessStage;
  const targetUsers =
    analysis.analysis.targetUsers || 'Target users still need a quick owner check.';
  const summary =
    analysis.analysis.summary || profile.summary || 'No product summary returned yet.';
  const proofGapCount = (analysis.analysis.missingEvidence ?? []).length;
  const selectedServiceCount = selectedServiceCodes.length;
  const productAnalysisLive = analysis.aiApplied && !analysis.fallbackReason;
  const sharedDocumentCount = analysis.aiSharedDocuments.length;
  const documentUsageCount =
    analysis.analysis.documentUsage?.filter(item => item.status === 'USED').length ?? 0;
  const documentStatus = sharedDocumentCount
    ? documentUsageCount
      ? `${documentUsageCount}/${sharedDocumentCount} docs used`
      : 'Document proof needs review'
    : 'No AI-shared docs';

  return (
    <Box
      sx={{
        p: { xs: 1.5, md: 2 },
        borderRadius: 1,
        border: '1px solid',
        borderColor: '#dbeafe',
        bgcolor: '#fbfdff',
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ md: 'flex-start' }}
        >
          <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1,
                bgcolor: '#f1efff',
                color: appleColors.purple,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Inventory2Outlined />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h3" sx={{ lineHeight: 1.15 }}>
                {productName}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.65, lineHeight: 1.65 }}>
                {summary}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                <PastelChip label={formatLabel(stage)} accent={appleColors.purple} />
                {analysis.analysis.techStack || profile.techStack ? (
                  <PastelChip
                    label={analysis.analysis.techStack || profile.techStack}
                    accent={appleColors.cyan}
                    bg="#e4f9fd"
                  />
                ) : null}
                <PastelChip
                  label={productAnalysisLive ? 'LoomAI analyzed' : 'AI failed - owner/rules used'}
                  accent={productAnalysisLive ? appleColors.green : appleColors.amber}
                  bg={productAnalysisLive ? '#e7f8ee' : '#fff4dc'}
                />
              </Stack>
            </Box>
          </Stack>
          <Box
            sx={{
              maxWidth: { md: 340 },
              p: 1.25,
              borderRadius: 1,
              border: '1px solid',
              borderColor: appleColors.line,
              bgcolor: '#fff',
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', fontWeight: 900 }}
            >
              Owner check
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.45, lineHeight: 1.55, fontWeight: 800 }}>
              Does this match who uses the product and what you are trying to make launch-ready?
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.7, lineHeight: 1.45 }}
            >
              {targetUsers}
            </Typography>
          </Box>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
            gap: 1,
          }}
        >
          <MetricTile
            label="Services selected"
            value={selectedServiceCount}
            detail={`${reviewedServiceRecommendations.length} ${productAnalysisLive ? 'AI suggestions' : 'owner/rules suggestions'}`}
            accent={selectedServiceCount ? appleColors.green : appleColors.amber}
            icon={<AutoAwesomeOutlined />}
          />
          <MetricTile
            label="Proof gaps"
            value={proofGapCount}
            detail={proofGapCount ? 'Needs owner follow-up' : 'No missing proof flagged'}
            accent={proofGapCount ? appleColors.amber : appleColors.green}
            icon={<FactCheckOutlined />}
          />
          <MetricTile
            label="Documents"
            value={documentStatus}
            detail="Temporary AI access only"
            accent={
              sharedDocumentCount && !documentUsageCount ? appleColors.amber : appleColors.blue
            }
            icon={<FactCheckOutlined />}
          />
        </Box>
      </Stack>
    </Box>
  );
}
