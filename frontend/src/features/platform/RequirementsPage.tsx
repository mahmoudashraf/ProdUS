'use client';

import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import { getJson, postJson } from './api';
import {
  EmptyState,
  PageHeader,
  QueryState,
  SaveButton,
  StatusChip,
  Surface,
  TextInput,
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

  return (
    <>
      <PageHeader title="Requirement Intake" description="Convert product pain into structured service and package inputs." />
      <QueryState isLoading={products.isLoading || modules.isLoading || requirements.isLoading} error={products.error || modules.error || requirements.error || createRequirement.error} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '420px 1fr' }, gap: 2 }}>
        <Surface>
          <Box component="form" onSubmit={submit}>
            <Stack spacing={2}>
              <TextField
                select
                fullWidth
                label="Product"
                value={form.values.productProfileId}
                onChange={(event) => form.setValue('productProfileId', event.target.value)}
              >
                {(products.data || []).map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                fullWidth
                label="Requested service"
                value={form.values.requestedServiceModuleId ?? ''}
                onChange={(event) => form.setValue('requestedServiceModuleId', event.target.value || null)}
              >
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
        <Stack spacing={1.5}>
          {requirements.data?.length ? (
            requirements.data.map((requirement) => (
              <Surface key={requirement.id}>
                <Stack direction="row" spacing={2} justifyContent="space-between">
                  <Typography variant="h4">{requirement.productProfile?.name || 'Product requirement'}</Typography>
                  <StatusChip label={requirement.status} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {requirement.businessGoal}
                </Typography>
              </Surface>
            ))
          ) : (
            <EmptyState label="No requirement intakes have been submitted." />
          )}
        </Stack>
      </Box>
    </>
  );
}
