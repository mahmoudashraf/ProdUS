'use client';

import { FormEvent, useState } from 'react';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getJson, postJson } from './api';
import { EmptyState, PageHeader, PastelChip, QueryState, SaveButton, SectionTitle, StatusChip, Surface, TextInput, appleColors } from './PlatformComponents';
import { AICapabilityConfig, CatalogRule, CatalogTemplateDefinition, PackageTemplate, ServiceCategory, ServiceModule } from './types';

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
  const modules = useQuery({
    queryKey: ['catalog-modules-admin'],
    queryFn: () => getJson<ServiceModule[]>('/catalog/modules?visibleOnly=false'),
  });
  const packageTemplates = useQuery({
    queryKey: ['catalog-package-templates'],
    queryFn: () => getJson<PackageTemplate[]>('/catalog/package-templates'),
  });
  const rules = useQuery({
    queryKey: ['catalog-rules'],
    queryFn: () => getJson<CatalogRule[]>('/catalog/rules'),
  });
  const definitions = useQuery({
    queryKey: ['catalog-template-definitions'],
    queryFn: () => getJson<CatalogTemplateDefinition[]>('/catalog/template-definitions'),
  });
  const aiCapabilities = useQuery({
    queryKey: ['catalog-ai-capabilities'],
    queryFn: () => getJson<AICapabilityConfig[]>('/catalog/ai-capabilities'),
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
      <PageHeader title="Admin Catalog" description="Govern service taxonomy, package templates, dependency rules, evidence templates, and AI-ready contracts." />
      <QueryState
        isLoading={categories.isLoading || modules.isLoading || packageTemplates.isLoading || rules.isLoading || definitions.isLoading || aiCapabilities.isLoading}
        error={categories.error || modules.error || packageTemplates.error || rules.error || definitions.error || aiCapabilities.error || createCategory.error}
      />
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
          <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8f7ff)' }}>
            <SectionTitle title="Catalog Coverage" />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 1 }}>
              <PastelChip label={`${categories.data?.length || 0} layers`} accent={appleColors.purple} />
              <PastelChip label={`${modules.data?.length || 0} services`} accent={appleColors.cyan} bg="#e4f9fd" />
              <PastelChip label={`${packageTemplates.data?.length || 0} templates`} accent={appleColors.green} bg="#e7f8ee" />
              <PastelChip label={`${rules.data?.length || 0} rules`} accent={appleColors.amber} bg="#fff4dc" />
              <PastelChip label={`${aiCapabilities.data?.length || 0} AI contracts`} accent={appleColors.blue} bg="#eaf3ff" />
            </Box>
          </Surface>
          {categories.data?.length ? (
            categories.data.map((category) => (
              <Surface key={category.id}>
                <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h4">{category.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.description || category.slug}
                    </Typography>
                  </Box>
                  <PastelChip label={`${(modules.data || []).filter((module) => module.category?.id === category.id).length} services`} accent={appleColors.purple} />
                </Stack>
                <Divider sx={{ my: 1.5 }} />
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {(modules.data || [])
                    .filter((module) => module.category?.id === category.id)
                    .slice(0, 10)
                    .map((module) => (
                      <PastelChip key={module.id} label={module.stableCode || module.slug} accent={appleColors.cyan} bg="#e4f9fd" />
                    ))}
                </Stack>
              </Surface>
            ))
          ) : (
            <EmptyState label="No catalog categories available." />
          )}

          <Surface>
            <SectionTitle title="Package Templates" />
            <Stack spacing={1.25}>
              {(packageTemplates.data || []).map((template) => (
                <Box key={template.id} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography sx={{ fontWeight: 900 }}>{template.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{template.description}</Typography>
                    </Box>
                    <StatusChip label={template.targetProductStage || 'Managed'} />
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                    <PastelChip label={template.timelineRange || 'Scoped'} accent={appleColors.cyan} bg="#e4f9fd" />
                    <PastelChip label={template.budgetRange || 'Priced'} accent={appleColors.green} bg="#e7f8ee" />
                    <PastelChip label={`${template.modules.length} services`} accent={appleColors.amber} bg="#fff4dc" />
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Surface>

          <Surface>
            <SectionTitle title="Governance Rules" />
            <Stack spacing={1}>
              {(rules.data || []).map((rule) => (
                <Box key={rule.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, gap: 1, alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>{rule.recommendedModule.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{rule.message}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <StatusChip label={rule.ruleType} />
                    <StatusChip label={rule.severity} color={rule.severity === 'BLOCKER' ? 'error' : 'warning'} />
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Surface>

          <Surface>
            <SectionTitle title="AI-Ready Contracts" />
            <Stack spacing={1}>
              {(aiCapabilities.data || []).map((capability) => (
                <Box key={capability.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, gap: 1, alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>{capability.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{capability.description}</Typography>
                  </Box>
                  <StatusChip label={capability.enabled ? 'Enabled' : 'Prepared only'} color={capability.enabled ? 'success' : 'default'} />
                </Box>
              ))}
            </Stack>
          </Surface>

          <Surface>
            <SectionTitle title="Template Definitions" />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {(definitions.data || []).map((definition) => (
                <PastelChip key={definition.id} label={`${definition.templateType}: ${definition.name}`} accent={appleColors.blue} bg="#eaf3ff" />
              ))}
            </Stack>
          </Surface>
        </Stack>
      </Box>
    </>
  );
}
