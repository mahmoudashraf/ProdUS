'use client';

import { Box, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getJson } from './api';
import { EmptyState, PageHeader, QueryState, Surface } from './PlatformComponents';
import { ServiceCategory, ServiceModule } from './types';

export default function CatalogPage() {
  const categories = useQuery({
    queryKey: ['catalog-categories'],
    queryFn: () => getJson<ServiceCategory[]>('/catalog/categories'),
  });
  const modules = useQuery({
    queryKey: ['catalog-modules'],
    queryFn: () => getJson<ServiceModule[]>('/catalog/modules'),
  });

  return (
    <>
      <PageHeader
        title="Service Catalog"
        description="Structured productization outcomes with inputs, deliverables, dependencies, and acceptance criteria."
      />
      <QueryState isLoading={categories.isLoading || modules.isLoading} error={categories.error || modules.error} />
      {categories.data?.length ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '300px 1fr' }, gap: 2 }}>
          <Stack spacing={1.5}>
            {categories.data.map((category) => (
              <Surface key={category.id}>
                <Typography variant="h4">{category.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {category.description}
                </Typography>
              </Surface>
            ))}
          </Stack>
          <Stack spacing={1.5}>
            {modules.data?.map((module) => (
              <Surface key={module.id}>
                <Typography variant="h4">{module.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {module.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Deliverables
                </Typography>
                <Typography variant="body2">{module.expectedDeliverables || 'Not defined yet.'}</Typography>
              </Surface>
            ))}
          </Stack>
        </Box>
      ) : (
        <EmptyState label="No service categories are available." />
      )}
    </>
  );
}
