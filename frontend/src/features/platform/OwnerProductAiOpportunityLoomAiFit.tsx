'use client';

import { PsychologyOutlined } from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';
import { DotLabel, Surface, appleColors } from './PlatformComponents';
import type { AiAssistedProductAnalysisResponse } from './types';

export default function OwnerProductAiOpportunityLoomAiFit({
  analysis,
  focus,
}: {
  analysis: AiAssistedProductAnalysisResponse;
  focus: 'opportunities' | 'refresh' | 'loomai';
}) {
  const overview = analysis.loomaiIntegrationOverview;
  const report = analysis.aiOpportunityReport;
  if (!overview?.live) return null;

  return (
    <Surface>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <PsychologyOutlined sx={{ color: appleColors.cyan }} />
          <Typography variant="h4">
            {focus === 'loomai' ? 'Recommended LoomAI start' : 'LoomAI integration fit'}
          </Typography>
          <DotLabel label="Live LoomAI result" color={appleColors.green} />
        </Stack>
        {focus !== 'loomai' && overview.summary && (
          <Typography color="text.secondary" sx={{ lineHeight: 1.6, maxWidth: 860 }}>
            {overview.summary}
          </Typography>
        )}
        {overview.recommendedStartingPoint && (
          <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: '#f5fcff', border: '1px solid #d9f3f8' }}>
            <Typography variant="body2" sx={{ fontWeight: 950, lineHeight: 1.45 }}>
              {overview.recommendedStartingPoint}
            </Typography>
          </Box>
        )}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' },
            gap: 1,
          }}
        >
          <SimpleList title="Capabilities" items={overview.capabilities ?? []} />
          <SimpleList title="Starting steps" items={overview.implementationSteps ?? []} />
          <SimpleList title="Owner decisions" items={overview.ownerDecisions ?? report?.suggestedNextSteps ?? []} />
        </Box>
      </Stack>
    </Surface>
  );
}

function SimpleList({ title, items }: { title: string; items: string[] }) {
  return (
    <Box
      sx={{
        p: 1.25,
        border: '1px solid',
        borderColor: appleColors.line,
        borderRadius: 1,
        bgcolor: '#fff',
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 950 }}>
        {title}
      </Typography>
      <Stack spacing={0.75} sx={{ mt: 1 }}>
        {items.slice(0, 5).map(item => (
          <Typography key={item} variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            {item}
          </Typography>
        ))}
        {!items.length && (
          <Typography variant="caption" color="text.secondary">
            Not returned.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
