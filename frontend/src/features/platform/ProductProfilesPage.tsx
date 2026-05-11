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
  Surface,
  TextInput,
} from './PlatformComponents';
import { ProductProfile } from './types';

const stages: ProductProfile['businessStage'][] = ['IDEA', 'PROTOTYPE', 'VALIDATED', 'LIVE', 'SCALING'];

interface ProductProfilePayload {
  name: string;
  summary: string;
  businessStage: ProductProfile['businessStage'];
  techStack: string;
  productUrl: string;
  repositoryUrl: string;
  riskProfile: string;
}

const initialProfileValues: ProductProfilePayload = {
  name: '',
  summary: '',
  businessStage: 'PROTOTYPE',
  techStack: '',
  productUrl: '',
  repositoryUrl: '',
  riskProfile: '',
};

export default function ProductProfilesPage() {
  const queryClient = useQueryClient();
  const profiles = useQuery({ queryKey: ['products'], queryFn: () => getJson<ProductProfile[]>('/products') });
  const form = useAdvancedForm<ProductProfilePayload>({
    initialValues: initialProfileValues,
    validationRules: {
      name: [{ type: 'required', message: 'Product name is required' }],
    },
  });

  const createProfile = useMutation({
    mutationFn: () => postJson<ProductProfile, ProductProfilePayload>('/products', form.values),
    onSuccess: async () => {
      form.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const submit = form.handleSubmit(() => {
    createProfile.mutate();
  });

  return (
    <>
      <PageHeader
        title="Product Profiles"
        description="Capture the owner product context before intake and package recommendations."
      />
      <QueryState isLoading={profiles.isLoading} error={profiles.error || createProfile.error} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '380px 1fr' }, gap: 2 }}>
        <Surface>
          <Box component="form" onSubmit={submit}>
            <Stack spacing={2}>
              <TextInput label="Product name" value={form.values.name} onChange={(name) => form.setValue('name', name)} />
              <TextInput label="Summary" value={form.values.summary} onChange={(summary) => form.setValue('summary', summary)} multiline />
              <TextField
                select
                fullWidth
                label="Business stage"
                value={form.values.businessStage}
                onChange={(event) => form.setValue('businessStage', event.target.value as ProductProfile['businessStage'])}
              >
                {stages.map((stage) => (
                  <MenuItem key={stage} value={stage}>
                    {stage.replaceAll('_', ' ').toLowerCase()}
                  </MenuItem>
                ))}
              </TextField>
              <TextInput label="Tech stack" value={form.values.techStack} onChange={(techStack) => form.setValue('techStack', techStack)} />
              <TextInput label="Product URL" value={form.values.productUrl} onChange={(productUrl) => form.setValue('productUrl', productUrl)} />
              <TextInput label="Repository URL" value={form.values.repositoryUrl} onChange={(repositoryUrl) => form.setValue('repositoryUrl', repositoryUrl)} />
              <TextInput label="Known risks" value={form.values.riskProfile} onChange={(riskProfile) => form.setValue('riskProfile', riskProfile)} multiline />
              <SaveButton disabled={!form.values.name || createProfile.isPending} label="Create profile" />
            </Stack>
          </Box>
        </Surface>
        <Stack spacing={1.5}>
          {profiles.data?.length ? (
            profiles.data.map((profile) => (
              <Surface key={profile.id}>
                <Typography variant="h4">{profile.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {profile.summary || 'No summary yet.'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {profile.businessStage.replaceAll('_', ' ').toLowerCase()}
                </Typography>
              </Surface>
            ))
          ) : (
            <EmptyState label="Create a product profile to start requirement intake." />
          )}
        </Stack>
      </Box>
    </>
  );
}
