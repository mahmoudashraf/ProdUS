'use client';

import { Box, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getJson } from './api';
import { EmptyState, PageHeader, QueryState, Surface } from './PlatformComponents';
import { AIRecommendation } from './types';

export default function AdminRecommendationsPage() {
  const recommendations = useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: () => getJson<AIRecommendation[]>('/ai/recommendations'),
    retry: false,
  });

  return (
    <>
      <PageHeader title="AI Recommendation Audit" description="Review recommendation traces, confidence, rationale, and feedback." />
      <QueryState isLoading={recommendations.isLoading} error={recommendations.error} />
      {recommendations.data?.length ? (
        <Stack spacing={1.5}>
          {recommendations.data.map((recommendation) => (
            <Surface key={recommendation.id}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
                <Box>
                  <Typography variant="h4">{recommendation.recommendationType}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {recommendation.sourceEntityType || 'source'} / {recommendation.sourceEntityId || 'unlinked'}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  {typeof recommendation.confidence === 'number'
                    ? `${Math.round(recommendation.confidence * 100)}% confidence`
                    : 'No confidence'}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {recommendation.rationale || 'No rationale recorded.'}
              </Typography>
            </Surface>
          ))}
        </Stack>
      ) : (
        <EmptyState label="No AI recommendation events recorded yet." />
      )}
    </>
  );
}
