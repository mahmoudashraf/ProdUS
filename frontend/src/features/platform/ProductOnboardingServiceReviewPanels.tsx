'use client';

import { ArrowDownwardOutlined, ArrowUpwardOutlined } from '@mui/icons-material';
import { Box, Button, Checkbox, Stack, Typography } from '@mui/material';
import { AiReviewList } from './ProductOnboardingReviewCards';
import { DotLabel, appleColors, formatLabel } from './PlatformComponents';
import type { LoomAIIntegrationOverview, ServiceModuleRecommendation } from './types';

const servicePriorityColor = (priority?: string) => {
  const normalized = (priority ?? '').toUpperCase();
  if (normalized === 'MUST') return appleColors.red;
  if (normalized === 'SHOULD') return appleColors.blue;
  if (normalized === 'COULD') return appleColors.green;
  return appleColors.muted;
};

export function AiServicePlanReview({
  recommendations,
  sourceLabel,
  selectedCodes,
  onToggle,
  onMove,
}: {
  recommendations: ServiceModuleRecommendation[];
  sourceLabel: string;
  selectedCodes: string[];
  onToggle: (moduleCode: string) => void;
  onMove: (moduleCode: string, direction: -1 | 1) => void;
}) {
  if (!recommendations.length) {
    return (
      <AiReviewList
        title={sourceLabel}
        items={[]}
        empty="No matching services returned."
        accent={appleColors.amber}
      />
    );
  }

  return (
    <Box
      sx={{
        p: 1.2,
        borderRadius: 1,
        border: '1px solid #dfe7f5',
        background: 'linear-gradient(145deg, #ffffff, #fbfbff)',
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 950 }}>
              {sourceLabel}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Included services are saved when you create the product.
            </Typography>
          </Box>
          <DotLabel
            label={`${selectedCodes.length}/${recommendations.length} included`}
            color={selectedCodes.length ? appleColors.green : appleColors.amber}
          />
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 1,
          }}
        >
          {recommendations.map((recommendation, index) => {
            const moduleCode = recommendation.moduleCode;
            const selected = selectedCodes.includes(moduleCode);
            const accent = servicePriorityColor(recommendation.priority);
            return (
              <Box
                key={`${moduleCode}-${index}`}
                sx={{
                  p: 1.1,
                  borderRadius: 1,
                  border: `1px solid ${selected ? `${accent}36` : '#e4e9f3'}`,
                  bgcolor: selected ? `${accent}07` : '#f8fafc',
                  minWidth: 0,
                }}
              >
                <Stack spacing={0.85}>
                  <Stack direction="row" spacing={0.8} alignItems="flex-start">
                    <Checkbox
                      checked={selected}
                      onChange={() => onToggle(moduleCode)}
                      sx={{ p: 0.2, mt: -0.2 }}
                    />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 950 }} noWrap>
                        {recommendation.moduleName || moduleCode}
                      </Typography>
                      <Stack direction="row" spacing={0.6} sx={{ flexWrap: 'wrap', mt: 0.5 }}>
                        <DotLabel label={moduleCode} color={accent} />
                        {recommendation.categorySlug && (
                          <DotLabel
                            label={formatLabel(recommendation.categorySlug)}
                            color={appleColors.cyan}
                          />
                        )}
                        <DotLabel label={recommendation.priority || 'SHOULD'} color={accent} />
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={0.3}>
                      <Button
                        variant="text"
                        disabled={index === 0}
                        onClick={() => onMove(moduleCode, -1)}
                        sx={{ minWidth: 34, width: 34, height: 34, p: 0 }}
                        aria-label={`Move ${recommendation.moduleName || moduleCode} earlier`}
                      >
                        <ArrowUpwardOutlined sx={{ fontSize: 17 }} />
                      </Button>
                      <Button
                        variant="text"
                        disabled={index === recommendations.length - 1}
                        onClick={() => onMove(moduleCode, 1)}
                        sx={{ minWidth: 34, width: 34, height: 34, p: 0 }}
                        aria-label={`Move ${recommendation.moduleName || moduleCode} later`}
                      >
                        <ArrowDownwardOutlined sx={{ fontSize: 17 }} />
                      </Button>
                    </Stack>
                  </Stack>
                  {recommendation.reason && (
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                      {recommendation.reason}
                    </Typography>
                  )}
                  {recommendation.expectedOutcome && (
                    <Typography
                      variant="caption"
                      sx={{ color: appleColors.green, fontWeight: 800 }}
                    >
                      {recommendation.expectedOutcome}
                    </Typography>
                  )}
                  {recommendation.evidenceBasis?.length ? (
                    <Stack spacing={0.35}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                        Why this service was suggested
                      </Typography>
                      {recommendation.evidenceBasis.slice(0, 2).map(item => (
                        <DotLabel key={item} label={item} color={appleColors.purple} />
                      ))}
                    </Stack>
                  ) : null}
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Stack>
    </Box>
  );
}

export function LoomAIOverviewPanel({
  overview,
}: {
  overview: LoomAIIntegrationOverview | undefined;
}) {
  if (!overview) return null;
  return (
    <Box
      sx={{
        p: 1.4,
        borderRadius: 1,
        border: `1px solid ${appleColors.cyan}24`,
        background: 'linear-gradient(145deg, #ffffff 0%, #f0fdff 100%)',
      }}
    >
      <Stack spacing={1.1}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 950 }}>
              LoomAI starting path
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
              {overview.summary ||
                'LoomAI can support diagnosis, service planning, scan summaries, and owner decisions.'}
            </Typography>
          </Box>
          <DotLabel
            label={overview.live ? 'LoomAI live' : 'AI result failed'}
            color={overview.live ? appleColors.green : appleColors.red}
          />
        </Stack>
        {overview.recommendedStartingPoint && (
          <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#fff', border: '1px solid #d9f3f8' }}>
            <Typography variant="caption" sx={{ fontWeight: 950 }}>
              Recommended start
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.4, fontWeight: 800, lineHeight: 1.45 }}>
              {overview.recommendedStartingPoint}
            </Typography>
          </Box>
        )}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: 1,
          }}
        >
          <AiReviewList
            title="Capabilities"
            items={overview.capabilities ?? []}
            empty="No capabilities returned."
            accent={appleColors.purple}
          />
          <AiReviewList
            title="Starting steps"
            items={overview.implementationSteps ?? []}
            empty="No starting steps returned."
            accent={appleColors.green}
          />
          <AiReviewList
            title="Owner decisions"
            items={overview.ownerDecisions ?? []}
            empty="No owner decisions returned."
            accent={appleColors.amber}
          />
        </Box>
      </Stack>
    </Box>
  );
}
