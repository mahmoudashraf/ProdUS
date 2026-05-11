'use client';

import { Box, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getJson } from './api';
import { EmptyState, PageHeader, QueryState, StatusChip, Surface } from './PlatformComponents';
import {
  AIRecommendation,
  PackageInstance,
  ProductProfile,
  ProjectWorkspace,
  RequirementIntake,
  Team,
} from './types';

const metrics = [
  { label: 'Product profiles', endpoint: '/products' },
  { label: 'Requirements', endpoint: '/requirements' },
  { label: 'Packages', endpoint: '/packages' },
  { label: 'Teams', endpoint: '/teams' },
  { label: 'Workspaces', endpoint: '/workspaces' },
];

export default function DashboardPage() {
  const products = useQuery({ queryKey: ['products'], queryFn: () => getJson<ProductProfile[]>('/products') });
  const requirements = useQuery({ queryKey: ['requirements'], queryFn: () => getJson<RequirementIntake[]>('/requirements') });
  const packages = useQuery({ queryKey: ['packages'], queryFn: () => getJson<PackageInstance[]>('/packages') });
  const teams = useQuery({ queryKey: ['teams'], queryFn: () => getJson<Team[]>('/teams') });
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: () => getJson<ProjectWorkspace[]>('/workspaces') });
  const recommendations = useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: () => getJson<AIRecommendation[]>('/ai/recommendations'),
    retry: false,
  });

  const counts = [products.data, requirements.data, packages.data, teams.data, workspaces.data];
  const loading = [products, requirements, packages, teams, workspaces].some((query) => query.isLoading);
  const error = [products, requirements, packages, teams, workspaces].find((query) => query.error)?.error;

  return (
    <>
      <PageHeader
        title="ProdUS Dashboard"
        description="Track productization intake, package readiness, team supply, and workspace activity."
      />
      <QueryState isLoading={loading} error={error} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(5, minmax(0, 1fr))' },
          gap: 2,
          mb: 3,
        }}
      >
        {metrics.map((metric, index) => (
          <Surface key={metric.endpoint}>
            <Typography color="text.secondary" variant="body2">
              {metric.label}
            </Typography>
            <Typography variant="h2" sx={{ mt: 1 }}>
              {counts[index]?.length ?? 0}
            </Typography>
          </Surface>
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
        <Surface>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Package Pipeline
          </Typography>
          {packages.data?.length ? (
            <Stack spacing={1.5}>
              {packages.data.slice(0, 5).map((item) => (
                <Stack key={item.id} direction="row" justifyContent="space-between" spacing={2}>
                  <Typography>{item.name}</Typography>
                  <StatusChip label={item.status} />
                </Stack>
              ))}
            </Stack>
          ) : (
            <EmptyState label="No packages have been generated yet." />
          )}
        </Surface>
        <Surface>
          <Typography variant="h4" sx={{ mb: 2 }}>
            AI Recommendation Audit
          </Typography>
          {recommendations.data?.length ? (
            <Stack spacing={1.5}>
              {recommendations.data.slice(0, 5).map((item) => (
                <Box key={item.id}>
                  <Typography>{item.recommendationType}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.rationale || 'No rationale recorded.'}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <EmptyState label="No AI recommendation events have been recorded." />
          )}
        </Surface>
      </Box>
    </>
  );
}
