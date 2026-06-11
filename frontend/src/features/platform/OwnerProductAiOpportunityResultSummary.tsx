'use client';

import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { PastelChip, Surface, appleColors } from './PlatformComponents';
import {
  aiOpportunityResultStatusLabel,
  collectAiServiceRecommendations,
  hasLiveAiOpportunityResult,
} from './ownerProductAiOpportunityModel';
import type { AiOpportunitySelectionState } from './ownerProductAiOpportunityModel';
import type { AiAssistedProductAnalysisResponse } from './types';

interface OwnerProductAiOpportunityResultSummaryProps {
  analysis: AiAssistedProductAnalysisResponse;
  focus: 'opportunities' | 'refresh' | 'loomai';
  selection: AiOpportunitySelectionState;
  onSelectAll: () => void;
  onSelectionChange: (selection: AiOpportunitySelectionState) => void;
}

export default function OwnerProductAiOpportunityResultSummary({
  analysis,
  focus,
  selection,
  onSelectAll,
  onSelectionChange,
}: OwnerProductAiOpportunityResultSummaryProps) {
  const report = analysis.aiOpportunityReport;
  const overview = analysis.loomaiIntegrationOverview;
  const hasLiveResult = hasLiveAiOpportunityResult(analysis);
  const useCases = report?.live ? (report.useCases ?? []) : [];
  const serviceRecommendations = collectAiServiceRecommendations(analysis);
  const resultStatusLabel = aiOpportunityResultStatusLabel(analysis);
  const selectedCount =
    selection.useCaseKeys.length +
    selection.serviceModuleKeys.length +
    selection.scannerFocus.length +
    selection.nextSteps.length;
  const failureReason =
    analysis.fallbackReason ||
    report?.missingEvidence?.[0] ||
    overview?.risks?.[0] ||
    report?.status ||
    'LoomAI did not return a usable structured result for this run.';

  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #fbfaff 100%)' }}>
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ md: 'flex-start' }}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h3">
                {!hasLiveResult
                  ? 'AI refresh did not return usable opportunities'
                  : focus === 'loomai'
                    ? 'LoomAI starting path'
                    : 'AI opportunities found'}
              </Typography>
              <PastelChip
                label={resultStatusLabel}
                accent={hasLiveResult ? appleColors.green : appleColors.red}
                bg={hasLiveResult ? '#e7f8ee' : '#ffecef'}
              />
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 780, lineHeight: 1.6 }}>
              {focus === 'loomai'
                ? overview?.summary ||
                  report?.summary ||
                  'Review the recommended LoomAI starting point and the product changes it supports.'
                : report?.summary ||
                  overview?.summary ||
                  'Review the opportunities and choose what should update this product.'}
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant="outlined"
              onClick={onSelectAll}
              disabled={!hasLiveResult}
              sx={{ minHeight: 40, whiteSpace: 'normal' }}
            >
              Select all
            </Button>
            <Button
              variant="text"
              onClick={() =>
                onSelectionChange({
                  useCaseKeys: [],
                  serviceModuleKeys: [],
                  scannerFocus: [],
                  nextSteps: [],
                })
              }
              sx={{ minHeight: 40, whiteSpace: 'normal' }}
            >
              Clear
            </Button>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
            gap: 1,
          }}
        >
          <SummaryTile
            label="Selected"
            value={selectedCount}
            detail="items to save"
            accent={appleColors.purple}
          />
          <SummaryTile
            label="Use cases"
            value={selection.useCaseKeys.length}
            detail={`${useCases.length} found`}
            accent={appleColors.cyan}
          />
          <SummaryTile
            label="Services"
            value={selection.serviceModuleKeys.length}
            detail={`${serviceRecommendations.length} suggested`}
            accent={appleColors.green}
          />
          <SummaryTile
            label="Files shared"
            value={analysis.aiSharedDocuments.length}
            detail="AI context files"
            accent={appleColors.amber}
          />
        </Box>

        {!hasLiveResult && (
          <Alert severity="warning" sx={{ borderRadius: 1 }}>
            {failureReason}. No product updates can be accepted from this failed AI result.
          </Alert>
        )}
      </Stack>
    </Surface>
  );
}

function SummaryTile({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: number;
  detail: string;
  accent: string;
}) {
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 1,
        bgcolor: '#fff',
        border: '1px solid',
        borderColor: `${accent}28`,
        minHeight: 88,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h3" sx={{ color: accent, mt: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {detail}
      </Typography>
    </Box>
  );
}
