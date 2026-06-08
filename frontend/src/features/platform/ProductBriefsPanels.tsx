'use client';

import type { FormEvent } from 'react';
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { OwnerWorkspaceJourneyNav, WorkspaceBreadcrumbs, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import {
  EmptyState,
  MetricTile,
  PastelChip,
  ProgressRing,
  SaveButton,
  SectionTitle,
  StatusChip,
  Surface,
  TextInput,
  appleColors,
} from './PlatformComponents';
import type { ProductProfile, RequirementIntake, ServiceModule } from './types';

export type ProductBriefsView = 'create' | 'queue';

export interface ProductBriefPayload {
  productProfileId: string;
  requestedServiceModuleId: string | null;
  businessGoal: string;
  currentProblems: string;
  constraints: string;
  riskSignals: string;
  requirementBrief: string;
  status: RequirementIntake['status'];
}

export const isProductBriefsView = (value: string | null): value is ProductBriefsView =>
  value === 'create' || value === 'queue';

const productBriefsViewLabel: Record<ProductBriefsView, string> = {
  create: 'Create Brief',
  queue: 'Intake Queue',
};

export const intakeScore = (status: RequirementIntake['status']) => {
  if (status === 'PACKAGE_RECOMMENDED') return 88;
  if (status === 'SUBMITTED') return 66;
  if (status === 'CLOSED') return 100;
  return 38;
};

export function ProductBriefsBreadcrumb({
  view,
  onOpenHub,
}: {
  view: ProductBriefsView;
  onOpenHub: () => void;
}) {
  return (
    <WorkspaceBreadcrumbs
      items={[
        { label: 'Product Briefs', onClick: onOpenHub },
        { label: productBriefsViewLabel[view] },
      ]}
      backLabel="Briefs home"
      onBack={onOpenHub}
    />
  );
}

export function ProductBriefsMetricsPanel({
  productCount,
  requirementCount,
  submittedCount,
  packageReadyCount,
}: {
  productCount: number;
  requirementCount: number;
  submittedCount: number;
  packageReadyCount: number;
}) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
      <MetricTile label="Intakes" value={requirementCount} detail={`${productCount} products available`} accent={appleColors.purple} />
      <MetricTile label="Submitted" value={submittedCount} detail="Ready for service-plan composition" accent={appleColors.blue} />
      <MetricTile label="Plan ready" value={packageReadyCount} detail="AI-backed service plan generated" accent={appleColors.green} />
    </Box>
  );
}

export function ProductBriefsHubPanel({
  productCount,
  requirementCount,
  submittedCount,
  packageReadyCount,
  onOpenView,
}: {
  productCount: number;
  requirementCount: number;
  submittedCount: number;
  packageReadyCount: number;
  onOpenView: (view: ProductBriefsView) => void;
}) {
  const items: JourneyStepItem<ProductBriefsView>[] = [
    {
      value: 'create',
      label: 'Create Brief',
      detail: 'Capture the product goal, problem, constraints, and launch risk.',
      accent: appleColors.purple,
      meta: <PastelChip label={`${productCount} products`} accent={appleColors.purple} />,
    },
    {
      value: 'queue',
      label: 'Intake Queue',
      detail: 'Review submitted briefs and service-plan readiness.',
      accent: appleColors.blue,
      meta: (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <PastelChip label={`${submittedCount} submitted`} accent={appleColors.blue} bg="#eaf3ff" />
          <PastelChip label={`${packageReadyCount} plan ready`} accent={appleColors.green} bg="#e7f8ee" />
        </Stack>
      ),
    },
  ];

  return (
    <Stack spacing={2.5}>
      <ProductBriefsMetricsPanel
        productCount={productCount}
        requirementCount={requirementCount}
        submittedCount={submittedCount}
        packageReadyCount={packageReadyCount}
      />
      <Surface>
        <SectionTitle title="Choose Brief Area" action={<PastelChip label="One owner task at a time" accent={appleColors.purple} />} />
        <OwnerWorkspaceJourneyNav
          label="Product brief sections"
          value={null}
          items={items}
          maxColumns={2}
          onChange={onOpenView}
        />
      </Surface>
    </Stack>
  );
}

export function ProductBriefFormPanel({
  formValues,
  products,
  modules,
  isSaving,
  onChange,
  onSubmit,
}: {
  formValues: ProductBriefPayload;
  products: ProductProfile[];
  modules: ServiceModule[];
  isSaving: boolean;
  onChange: <Key extends keyof ProductBriefPayload>(key: Key, value: ProductBriefPayload[Key]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Surface>
      <SectionTitle title="Create Product Brief" />
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          <TextField select fullWidth label="Product" value={formValues.productProfileId} onChange={(event) => onChange('productProfileId', event.target.value)}>
            {products.map((product) => (
              <MenuItem key={product.id} value={product.id}>
                {product.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField select fullWidth label="Requested service" value={formValues.requestedServiceModuleId ?? ''} onChange={(event) => onChange('requestedServiceModuleId', event.target.value || null)}>
            <MenuItem value="">No specific service yet</MenuItem>
            {modules.map((module) => (
              <MenuItem key={module.id} value={module.id}>
                {module.name}
              </MenuItem>
            ))}
          </TextField>
          <TextInput label="Business goal" value={formValues.businessGoal} onChange={(businessGoal) => onChange('businessGoal', businessGoal)} multiline />
          <TextInput label="Current problems" value={formValues.currentProblems} onChange={(currentProblems) => onChange('currentProblems', currentProblems)} multiline />
          <TextInput label="Constraints" value={formValues.constraints} onChange={(constraints) => onChange('constraints', constraints)} multiline />
          <TextInput label="Risk signals" value={formValues.riskSignals} onChange={(riskSignals) => onChange('riskSignals', riskSignals)} multiline />
          <TextInput label="Requirement brief" value={formValues.requirementBrief} onChange={(requirementBrief) => onChange('requirementBrief', requirementBrief)} multiline />
          <SaveButton disabled={!formValues.productProfileId || !formValues.businessGoal || isSaving} label="Submit intake" />
        </Stack>
      </Box>
    </Surface>
  );
}

export function ProductBriefQueuePanel({
  requirements,
}: {
  requirements: RequirementIntake[];
}) {
  return (
    <Surface>
      <SectionTitle title="Intake Queue" action={<PastelChip label={`${requirements.length} records`} accent={appleColors.purple} />} />
      {requirements.length ? (
        <Stack spacing={0}>
          {requirements.map((requirement, index) => (
            <Box
              key={requirement.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '82px minmax(0, 1fr) auto' },
                gap: 1.5,
                alignItems: { xs: 'flex-start', md: 'center' },
                py: 1.75,
                borderTop: index === 0 ? 0 : '1px solid',
                borderColor: 'divider',
              }}
            >
              <ProgressRing value={intakeScore(requirement.status)} size={66} color={requirement.status === 'PACKAGE_RECOMMENDED' ? appleColors.green : appleColors.amber} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h4">{requirement.productProfile?.name || 'Product requirement'}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {requirement.businessGoal}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                  {requirement.requestedServiceModule && <PastelChip label={requirement.requestedServiceModule.name} accent={appleColors.blue} />}
                  {requirement.riskSignals && <PastelChip label="Risk signals captured" accent={appleColors.amber} />}
                </Stack>
              </Box>
              <StatusChip label={requirement.status} />
            </Box>
          ))}
        </Stack>
      ) : (
        <EmptyState label="No requirement intakes have been submitted." />
      )}
    </Surface>
  );
}
