'use client';

import { FormEvent, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getJson, postJson } from './api';
import { EmptyState, PageHeader, QueryState, SaveButton, Surface, TextInput } from './PlatformComponents';
import { ServiceCategory } from './types';

interface CategoryPayload {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  active: boolean;
}

export default function AdminCatalogPage() {
  const queryClient = useQueryClient();
  const categories = useQuery({
    queryKey: ['catalog-categories'],
    queryFn: () => getJson<ServiceCategory[]>('/catalog/categories'),
  });
  const [form, setForm] = useState<CategoryPayload>({
    name: '',
    slug: '',
    description: '',
    sortOrder: 0,
    active: true,
  });
  const createCategory = useMutation({
    mutationFn: () => postJson<ServiceCategory, CategoryPayload>('/admin/catalog/categories', form),
    onSuccess: async () => {
      setForm({ name: '', slug: '', description: '', sortOrder: 0, active: true });
      await queryClient.invalidateQueries({ queryKey: ['catalog-categories'] });
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createCategory.mutate();
  };

  return (
    <>
      <PageHeader title="Admin Catalog" description="Manage service taxonomy before service-plan rules consume it." />
      <QueryState isLoading={categories.isLoading} error={categories.error || createCategory.error} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '360px 1fr' }, gap: 2 }}>
        <Surface>
          <Box component="form" onSubmit={submit}>
            <Stack spacing={2}>
              <TextInput label="Category name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
              <TextInput label="Slug" value={form.slug} onChange={(slug) => setForm({ ...form, slug })} />
              <TextInput label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} multiline />
              <SaveButton disabled={!form.name || !form.slug || createCategory.isPending} label="Create category" />
            </Stack>
          </Box>
        </Surface>
        <Stack spacing={1.5}>
          {categories.data?.length ? (
            categories.data.map((category) => (
              <Surface key={category.id}>
                <Typography variant="h4">{category.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {category.description || category.slug}
                </Typography>
              </Surface>
            ))
          ) : (
            <EmptyState label="No catalog categories available." />
          )}
        </Stack>
      </Box>
    </>
  );
}
