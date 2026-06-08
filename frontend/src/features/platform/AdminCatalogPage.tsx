'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Box, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getJson, postJson } from './api';
import {
  AdminCatalogAiPanel,
  AdminCatalogAuditPanel,
  AdminCatalogBreadcrumb,
  AdminCatalogCategoriesPanel,
  AdminCatalogCreateCategoryPanel,
  AdminCatalogHubPanel,
  AdminCatalogRulesPanel,
  AdminCatalogTemplatesPanel,
  type AdminCatalogView,
  type CategoryPayload,
  isAdminCatalogView,
} from './AdminCatalogPanels';
import { PageHeader, QueryState } from './PlatformComponents';
import type {
  AICapabilityConfig,
  AuditEvent,
  CatalogRule,
  CatalogTemplateDefinition,
  PackageTemplate,
  ServiceCategory,
  ServiceModule,
} from './types';

const initialCategoryValues: CategoryPayload = {
  name: '',
  slug: '',
  description: '',
  sortOrder: 0,
  active: true,
};

export default function AdminCatalogPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams?.toString() || '';
  const viewParam = searchParams?.get('view') || null;
  const activeView = isAdminCatalogView(viewParam) ? viewParam : null;
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
  const auditEvents = useQuery({
    queryKey: ['admin-audit-events'],
    queryFn: () => getJson<AuditEvent[]>('/admin/audit-events'),
  });
  const [form, setForm] = useState<CategoryPayload>(initialCategoryValues);
  const createCategory = useMutation({
    mutationFn: () => postJson<ServiceCategory, CategoryPayload>('/admin/catalog/categories', form),
    onSuccess: async () => {
      setForm(initialCategoryValues);
      await queryClient.invalidateQueries({ queryKey: ['catalog-categories'] });
    },
  });

  const openView = (view: AdminCatalogView) => {
    const next = new URLSearchParams(searchParamString);
    next.set('view', view);
    router.push(`${pathname || '/admin/catalog'}?${next.toString()}`, { scroll: false });
  };

  const openHub = () => {
    const next = new URLSearchParams(searchParamString);
    next.delete('view');
    const query = next.toString();
    router.push(query ? `${pathname || '/admin/catalog'}?${query}` : (pathname || '/admin/catalog'), { scroll: false });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createCategory.mutate();
  };

  const categoryList = categories.data || [];
  const moduleList = modules.data || [];
  const templateList = packageTemplates.data || [];
  const ruleList = rules.data || [];
  const definitionList = definitions.data || [];
  const aiCapabilityList = aiCapabilities.data || [];
  const auditEventList = auditEvents.data || [];

  return (
    <>
      <PageHeader
        title="Admin Catalog"
        description="Govern service taxonomy, package templates, dependency rules, evidence templates, and AI setup one area at a time."
      />
      <QueryState
        isLoading={categories.isLoading || modules.isLoading || packageTemplates.isLoading || rules.isLoading || definitions.isLoading || aiCapabilities.isLoading || auditEvents.isLoading}
        error={categories.error || modules.error || packageTemplates.error || rules.error || definitions.error || aiCapabilities.error || auditEvents.error || createCategory.error}
      />

      {!activeView && (
        <AdminCatalogHubPanel
          categoryCount={categoryList.length}
          serviceCount={moduleList.length}
          templateCount={templateList.length}
          ruleCount={ruleList.length}
          aiContractCount={aiCapabilityList.length}
          auditCount={auditEventList.length}
          onOpenView={openView}
        />
      )}

      {activeView && (
        <Stack spacing={2}>
          <AdminCatalogBreadcrumb view={activeView} onOpenHub={openHub} />

          {activeView === 'categories' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 360px' }, gap: 2, alignItems: 'start' }}>
              <AdminCatalogCategoriesPanel categories={categoryList} modules={moduleList} />
              <AdminCatalogCreateCategoryPanel
                form={form}
                isCreating={createCategory.isPending}
                onChange={setForm}
                onSubmit={submit}
              />
            </Box>
          )}

          {activeView === 'templates' && (
            <AdminCatalogTemplatesPanel packageTemplates={templateList} />
          )}

          {activeView === 'rules' && (
            <AdminCatalogRulesPanel rules={ruleList} />
          )}

          {activeView === 'ai' && (
            <AdminCatalogAiPanel aiCapabilities={aiCapabilityList} definitions={definitionList} />
          )}

          {activeView === 'audit' && (
            <AdminCatalogAuditPanel auditEvents={auditEventList} />
          )}
        </Stack>
      )}
    </>
  );
}
