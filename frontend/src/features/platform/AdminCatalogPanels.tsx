'use client';

import type { FormEvent } from 'react';
import {
  AutoAwesomeOutlined,
  CategoryOutlined,
  HistoryOutlined,
  LayersOutlined,
  RuleOutlined,
} from '@mui/icons-material';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { OwnerWorkspaceJourneyNav, WorkspaceBreadcrumbs, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import {
  EmptyState,
  PastelChip,
  SaveButton,
  SectionTitle,
  StatusChip,
  Surface,
  TextInput,
  appleColors,
} from './PlatformComponents';
import type {
  AICapabilityConfig,
  AuditEvent,
  CatalogRule,
  CatalogTemplateDefinition,
  PackageTemplate,
  ServiceCategory,
  ServiceModule,
} from './types';

export type AdminCatalogView = 'categories' | 'templates' | 'rules' | 'ai' | 'audit';

export interface CategoryPayload {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  active: boolean;
}

export const isAdminCatalogView = (value: string | null): value is AdminCatalogView =>
  value === 'categories' || value === 'templates' || value === 'rules' || value === 'ai' || value === 'audit';

const adminCatalogViewLabel: Record<AdminCatalogView, string> = {
  categories: 'Categories And Services',
  templates: 'Package Templates',
  rules: 'Governance Rules',
  ai: 'AI Setup',
  audit: 'Audit Trail',
};

export function AdminCatalogBreadcrumb({
  view,
  onOpenHub,
}: {
  view: AdminCatalogView;
  onOpenHub: () => void;
}) {
  return (
    <WorkspaceBreadcrumbs
      items={[
        { label: 'Admin Catalog', onClick: onOpenHub },
        { label: adminCatalogViewLabel[view] },
      ]}
      backLabel="Catalog hub"
      onBack={onOpenHub}
    />
  );
}

export function AdminCatalogCoveragePanel({
  categoryCount,
  serviceCount,
  templateCount,
  ruleCount,
  aiContractCount,
}: {
  categoryCount: number;
  serviceCount: number;
  templateCount: number;
  ruleCount: number;
  aiContractCount: number;
}) {
  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8f7ff)' }}>
      <SectionTitle title="Catalog Coverage" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(5, minmax(0, 1fr))' }, gap: 1 }}>
        <PastelChip label={`${categoryCount} layers`} accent={appleColors.purple} />
        <PastelChip label={`${serviceCount} services`} accent={appleColors.cyan} bg="#e4f9fd" />
        <PastelChip label={`${templateCount} templates`} accent={appleColors.green} bg="#e7f8ee" />
        <PastelChip label={`${ruleCount} rules`} accent={appleColors.amber} bg="#fff4dc" />
        <PastelChip label={`${aiContractCount} AI settings`} accent={appleColors.blue} bg="#eaf3ff" />
      </Box>
    </Surface>
  );
}

export function AdminCatalogHubPanel({
  categoryCount,
  serviceCount,
  templateCount,
  ruleCount,
  aiContractCount,
  auditCount,
  onOpenView,
}: {
  categoryCount: number;
  serviceCount: number;
  templateCount: number;
  ruleCount: number;
  aiContractCount: number;
  auditCount: number;
  onOpenView: (view: AdminCatalogView) => void;
}) {
  const items: JourneyStepItem<AdminCatalogView>[] = [
    {
      value: 'categories',
      label: 'Categories',
      detail: 'Service taxonomy and service-code coverage.',
      accent: appleColors.purple,
      meta: <PastelChip label={`${categoryCount} layers`} accent={appleColors.purple} />,
    },
    {
      value: 'templates',
      label: 'Templates',
      detail: 'Bundled launch-hardening service recipes.',
      accent: appleColors.green,
      meta: <PastelChip label={`${templateCount}`} accent={appleColors.green} bg="#e7f8ee" />,
    },
    {
      value: 'rules',
      label: 'Rules',
      detail: 'Blocking and recommended service governance.',
      accent: appleColors.amber,
      meta: <PastelChip label={`${ruleCount}`} accent={appleColors.amber} bg="#fff4dc" />,
    },
    {
      value: 'ai',
      label: 'AI Setup',
      detail: 'AI capability settings and template definitions.',
      accent: appleColors.blue,
      meta: <PastelChip label={`${aiContractCount}`} accent={appleColors.blue} bg="#eaf3ff" />,
    },
    {
      value: 'audit',
      label: 'Audit Trail',
      detail: 'Governance changes and risk-level evidence.',
      accent: appleColors.cyan,
      meta: <PastelChip label={`${auditCount}`} accent={appleColors.cyan} bg="#e4f9fd" />,
    },
  ];

  return (
    <Stack spacing={2}>
      <AdminCatalogCoveragePanel
        categoryCount={categoryCount}
        serviceCount={serviceCount}
        templateCount={templateCount}
        ruleCount={ruleCount}
        aiContractCount={aiContractCount}
      />
      <Surface>
        <SectionTitle title="Choose Catalog Area" action={<PastelChip label="One admin task at a time" accent={appleColors.purple} />} />
        <OwnerWorkspaceJourneyNav
          label="Admin catalog sections"
          value="categories"
          items={items}
          maxColumns={3}
          onChange={onOpenView}
        />
      </Surface>
    </Stack>
  );
}

export function AdminCatalogCreateCategoryPanel({
  form,
  isCreating,
  onChange,
  onSubmit,
}: {
  form: CategoryPayload;
  isCreating: boolean;
  onChange: (form: CategoryPayload) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Surface>
      <SectionTitle title="Create Category" action={<CategoryOutlined sx={{ color: appleColors.purple }} />} />
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          <TextInput label="Category name" value={form.name} onChange={(name) => onChange({ ...form, name })} />
          <TextInput label="Slug" value={form.slug} onChange={(slug) => onChange({ ...form, slug })} />
          <TextInput label="Description" value={form.description} onChange={(description) => onChange({ ...form, description })} multiline />
          <SaveButton disabled={!form.name || !form.slug || isCreating} label="Create category" />
        </Stack>
      </Box>
    </Surface>
  );
}

export function AdminCatalogCategoriesPanel({
  categories,
  modules,
}: {
  categories: ServiceCategory[];
  modules: ServiceModule[];
}) {
  return (
    <Surface>
      <SectionTitle title="Categories And Services" action={<PastelChip label={`${categories.length} layers`} accent={appleColors.purple} />} />
      {categories.length ? (
        <Stack spacing={0}>
          {categories.map((category, index) => {
            const categoryModules = modules.filter((module) => module.category?.id === category.id);
            return (
              <Box key={category.id} sx={{ py: 1.75, borderTop: index === 0 ? 0 : '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h4">{category.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.55 }}>
                      {category.description || category.slug}
                    </Typography>
                  </Box>
                  <PastelChip label={`${categoryModules.length} services`} accent={appleColors.purple} />
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
                  {categoryModules.slice(0, 14).map((module) => (
                    <PastelChip key={module.id} label={module.stableCode || module.slug} accent={appleColors.cyan} bg="#e4f9fd" />
                  ))}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      ) : (
        <EmptyState label="No catalog categories available." />
      )}
    </Surface>
  );
}

export function AdminCatalogTemplatesPanel({
  packageTemplates,
}: {
  packageTemplates: PackageTemplate[];
}) {
  return (
    <Surface>
      <SectionTitle title="Package Templates" action={<LayersOutlined sx={{ color: appleColors.green }} />} />
      {packageTemplates.length ? (
        <Stack spacing={1.25}>
          {packageTemplates.map((template) => (
            <Box key={template.id} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900 }}>{template.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.5 }}>
                    {template.description}
                  </Typography>
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
      ) : (
        <EmptyState label="No package templates have been configured yet." />
      )}
    </Surface>
  );
}

export function AdminCatalogRulesPanel({
  rules,
}: {
  rules: CatalogRule[];
}) {
  return (
    <Surface>
      <SectionTitle title="Governance Rules" action={<RuleOutlined sx={{ color: appleColors.amber }} />} />
      {rules.length ? (
        <Stack spacing={1.25}>
          {rules.map((rule) => (
            <Box key={rule.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' }, gap: 1, alignItems: 'center', borderTop: '1px solid', borderColor: 'divider', pt: 1.25 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 900 }}>{rule.recommendedModule.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.5 }}>
                  {rule.message}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <StatusChip label={rule.ruleType} />
                <StatusChip label={rule.severity} color={rule.severity === 'BLOCKER' ? 'error' : 'warning'} />
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : (
        <EmptyState label="No catalog governance rules are active." />
      )}
    </Surface>
  );
}

export function AdminCatalogAiPanel({
  aiCapabilities,
  definitions,
}: {
  aiCapabilities: AICapabilityConfig[];
  definitions: CatalogTemplateDefinition[];
}) {
  return (
    <Stack spacing={2}>
      <Surface>
        <SectionTitle title="AI Capability Setup" action={<AutoAwesomeOutlined sx={{ color: appleColors.blue }} />} />
        {aiCapabilities.length ? (
          <Stack spacing={1.25}>
            {aiCapabilities.map((capability) => (
              <Box key={capability.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' }, gap: 1, alignItems: 'center', borderTop: '1px solid', borderColor: 'divider', pt: 1.25 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900 }}>{capability.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.5 }}>
                    {capability.description}
                  </Typography>
                </Box>
                <StatusChip label={capability.enabled ? 'Enabled' : 'Prepared only'} color={capability.enabled ? 'success' : 'default'} />
              </Box>
            ))}
          </Stack>
        ) : (
          <EmptyState label="No AI capability settings have been configured yet." />
        )}
      </Surface>

      <Surface>
        <SectionTitle title="Template Definitions" />
        {definitions.length ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {definitions.map((definition) => (
              <PastelChip key={definition.id} label={`${definition.templateType}: ${definition.name}`} accent={appleColors.blue} bg="#eaf3ff" />
            ))}
          </Stack>
        ) : (
          <EmptyState label="No template definitions have been recorded." />
        )}
      </Surface>
    </Stack>
  );
}

export function AdminCatalogAuditPanel({
  auditEvents,
}: {
  auditEvents: AuditEvent[];
}) {
  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8fbff)' }}>
      <SectionTitle
        title="Governance Audit"
        action={(
          <Stack direction="row" spacing={1} alignItems="center">
            <PastelChip label={`${auditEvents.length} events`} accent={appleColors.blue} bg="#eaf3ff" />
            <HistoryOutlined sx={{ color: appleColors.blue }} />
          </Stack>
        )}
      />
      {auditEvents.length ? (
        <Stack spacing={1}>
          {auditEvents.slice(0, 24).map((event, index) => (
            <Box key={event.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' }, gap: 1, alignItems: 'center', borderTop: index === 0 ? 0 : '1px solid', borderColor: 'divider', pt: index === 0 ? 0 : 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 900 }}>{event.action}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                  {event.actorEmail || 'System'} / {event.entityType}{event.details ? ` / ${event.details}` : ''}
                </Typography>
              </Box>
              <StatusChip label={event.riskLevel} color={event.riskLevel === 'HIGH' || event.riskLevel === 'CRITICAL' ? 'error' : event.riskLevel === 'MEDIUM' ? 'warning' : 'default'} />
            </Box>
          ))}
        </Stack>
      ) : (
        <EmptyState label="No governance audit events have been recorded yet." />
      )}
      <Divider sx={{ mt: 2 }} />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        Showing the latest 24 audit events for this admin view.
      </Typography>
    </Surface>
  );
}
