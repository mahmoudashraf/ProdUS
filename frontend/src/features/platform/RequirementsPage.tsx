'use client';

import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import { getJson, postJson } from './api';
import {
  EmptyState,
  MetricTile,
  PageHeader,
  PastelChip,
  ProgressRing,
  QueryState,
  SaveButton,
  SectionTitle,
  StatusChip,
  Surface,
  TextInput,
  appleColors,
} from './PlatformComponents';
import { ProductProfile, RequirementIntake, ServiceModule } from './types';

interface RequirementPayload {
  productProfileId: string;
  requestedServiceModuleId: string | null;
  businessGoal: string;
  currentProblems: string;
  constraints: string;
  riskSignals: string;
  requirementBrief: string;
  status: RequirementIntake['status'];
}

const initialRequirementValues: RequirementPayload = {
  productProfileId: '',
  requestedServiceModuleId: null,
  businessGoal: '',
  currentProblems: '',
  constraints: '',
  riskSignals: '',
  requirementBrief: '',
  status: 'SUBMITTED',
};

const intakeScore = (status: RequirementIntake['status']) => {
  if (status === 'PACKAGE_RECOMMENDED') return 88;
  if (status === 'SUBMITTED') return 66;
  if (status === 'CLOSED') return 100;
  return 38;
};

export default function RequirementsPage() {
  const queryClient = useQueryClient();
  const products = useQuery({ queryKey: ['products'], queryFn: () => getJson<ProductProfile[]>('/products') });
  const modules = useQuery({ queryKey: ['catalog-modules'], queryFn: () => getJson<ServiceModule[]>('/catalog/modules') });
  const requirements = useQuery({ queryKey: ['requirements'], queryFn: () => getJson<RequirementIntake[]>('/requirements') });
  const form = useAdvancedForm<RequirementPayload>({
    initialValues: initialRequirementValues,
    validationRules: {
      productProfileId: [{ type: 'required', message: 'Product is required' }],
      businessGoal: [{ type: 'required', message: 'Business goal is required' }],
    },
  });

  const createRequirement = useMutation({
    mutationFn: () => postJson<RequirementIntake, RequirementPayload>('/requirements', form.values),
    onSuccess: async () => {
      form.resetForm({
        ...initialRequirementValues,
        productProfileId: form.values.productProfileId,
        requestedServiceModuleId: form.values.requestedServiceModuleId,
      });
      await queryClient.invalidateQueries({ queryKey: ['requirements'] });
    },
  });

  const submit = form.handleSubmit(() => {
    createRequirement.mutate();
  });
  const requirementList = requirements.data || [];
  const submittedCount = requirementList.filter((requirement) => requirement.status === 'SUBMITTED').length;
  const packageReadyCount = requirementList.filter((requirement) => requirement.status === 'PACKAGE_RECOMMENDED').length;

  return (
    <>
      <PageHeader title="Product Briefs" description="Convert product pain into structured service needs, risk signals, and service-plan inputs." />
      <QueryState isLoading={products.isLoading || modules.isLoading || requirements.isLoading} error={products.error || modules.error || requirements.error || createRequirement.error} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 2.5 }}>
        <MetricTile label="Intakes" value={requirementList.length} detail={`${products.data?.length || 0} products available`} accent={appleColors.purple} />
        <MetricTile label="Submitted" value={submittedCount} detail="Ready for service-plan composition" accent={appleColors.blue} />
        <MetricTile label="Plan ready" value={packageReadyCount} detail="AI-backed service plan generated" accent={appleColors.green} />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '420px 1fr' }, gap: 2.5 }}>
        <Surface>
          <SectionTitle title="New Intake" />
          <Box component="form" onSubmit={submit}>
            <Stack spacing={2}>
              <TextField select fullWidth label="Product" value={form.values.productProfileId} onChange={(event) => form.setValue('productProfileId', event.target.value)}>
                {(products.data || []).map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField select fullWidth label="Requested service" value={form.values.requestedServiceModuleId ?? ''} onChange={(event) => form.setValue('requestedServiceModuleId', event.target.value || null)}>
                <MenuItem value="">No specific service yet</MenuItem>
                {(modules.data || []).map((module) => (
                  <MenuItem key={module.id} value={module.id}>
                    {module.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextInput label="Business goal" value={form.values.businessGoal} onChange={(businessGoal) => form.setValue('businessGoal', businessGoal)} multiline />
              <TextInput label="Current problems" value={form.values.currentProblems} onChange={(currentProblems) => form.setValue('currentProblems', currentProblems)} multiline />
              <TextInput label="Constraints" value={form.values.constraints} onChange={(constraints) => form.setValue('constraints', constraints)} multiline />
              <TextInput label="Risk signals" value={form.values.riskSignals} onChange={(riskSignals) => form.setValue('riskSignals', riskSignals)} multiline />
              <TextInput label="Requirement brief" value={form.values.requirementBrief} onChange={(requirementBrief) => form.setValue('requirementBrief', requirementBrief)} multiline />
              <SaveButton disabled={!form.values.productProfileId || !form.values.businessGoal || createRequirement.isPending} label="Submit intake" />
            </Stack>
          </Box>
        </Surface>
        <Surface>
          <SectionTitle title="Intake Queue" action={<PastelChip label={`${requirementList.length} records`} accent={appleColors.purple} />} />
          {requirementList.length ? (
            <Stack spacing={0}>
              {requirementList.map((requirement, index) => (
                <Box key={requirement.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '82px 1fr auto' }, gap: 1.5, alignItems: 'center', py: 1.75, borderTop: index === 0 ? 0 : '1px solid', borderColor: 'divider' }}>
                  <ProgressRing value={intakeScore(requirement.status)} size={66} color={requirement.status === 'PACKAGE_RECOMMENDED' ? appleColors.green : appleColors.amber} />
                  <Box>
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
      </Box>
    </>
  );
}
