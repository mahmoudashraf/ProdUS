'use client';

import { useEffect, useMemo, useState } from 'react';
import NextLink from 'next/link';
import {
  AutoAwesomeOutlined,
  CheckCircleOutlineOutlined,
  SaveOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { putJson } from './api';
import {
  PastelChip,
  Surface,
  appleColors,
} from './PlatformComponents';
import type { ProductProfile } from './types';

type ProductProfileUpdatePayload = {
  name: string;
  summary?: string;
  businessStage: ProductProfile['businessStage'];
  techStack?: string;
  productUrl?: string;
  repositoryUrl?: string;
  riskProfile?: string;
};

const businessStageValues: ProductProfile['businessStage'][] = ['IDEA', 'PROTOTYPE', 'VALIDATED', 'LIVE', 'SCALING'];

const formFromProduct = (product: ProductProfile): ProductProfileUpdatePayload => ({
  name: product.name || '',
  summary: product.summary || '',
  businessStage: product.businessStage || 'PROTOTYPE',
  techStack: product.techStack || '',
  productUrl: product.productUrl || '',
  repositoryUrl: product.repositoryUrl || '',
  riskProfile: product.riskProfile || '',
});

const normalize = (value?: string | null) => (value || '').trim();

const sameProfileValues = (a: ProductProfileUpdatePayload, b: ProductProfileUpdatePayload) =>
  normalize(a.name) === normalize(b.name)
  && normalize(a.summary) === normalize(b.summary)
  && a.businessStage === b.businessStage
  && normalize(a.techStack) === normalize(b.techStack)
  && normalize(a.productUrl) === normalize(b.productUrl)
  && normalize(a.repositoryUrl) === normalize(b.repositoryUrl)
  && normalize(a.riskProfile) === normalize(b.riskProfile);

export default function OwnerProductProfileEditPanel({ product }: { product: ProductProfile }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProductProfileUpdatePayload>(() => formFromProduct(product));
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    setForm(formFromProduct(product));
    setShowSaved(false);
  }, [product.id]);

  const original = useMemo(() => formFromProduct(product), [product]);
  const isDirty = !sameProfileValues(form, original);
  const nameMissing = !form.name.trim();

  const updateProduct = useMutation({
    mutationFn: async () => putJson<ProductProfile, ProductProfileUpdatePayload>(`/products/${product.id}`, {
      ...form,
      name: form.name.trim(),
      summary: (form.summary || '').trim(),
      techStack: (form.techStack || '').trim(),
      productUrl: (form.productUrl || '').trim(),
      repositoryUrl: (form.repositoryUrl || '').trim(),
      riskProfile: (form.riskProfile || '').trim(),
    }),
    onSuccess: async () => {
      setShowSaved(true);
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['repo-signals', product.id] });
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', product.id] });
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', product.id, 'diagnoses'] });
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', product.id, 'ship-confidence'] });
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', product.id, 'launch-readiness-report'] });
    },
  });

  const setField = <K extends keyof ProductProfileUpdatePayload>(field: K, value: ProductProfileUpdatePayload[K]) => {
    setShowSaved(false);
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #fbfdff 100%)' }}>
      <Stack spacing={2.25}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) auto' }, gap: 2, alignItems: 'start' }}>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h3">Edit product profile</Typography>
              <PastelChip label="Manual owner edit" accent={appleColors.purple} bg="#f1efff" />
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 760, lineHeight: 1.65 }}>
              Update the product facts that drive owner decisions, service recommendations, and launch-readiness context.
            </Typography>
          </Box>
          <Button
            component={NextLink}
            href={`/products/${product.id}?tab=overview&view=refresh`}
            variant="outlined"
            startIcon={<AutoAwesomeOutlined />}
            sx={{ minHeight: 42, whiteSpace: 'normal' }}
          >
            Refresh with AI
          </Button>
        </Box>

        {showSaved && (
          <Alert severity="success" icon={<CheckCircleOutlineOutlined />}>
            Product profile saved. Product Home will use these details for the next decisions.
          </Alert>
        )}
        {updateProduct.error && (
          <Alert severity="error">
            {updateProduct.error instanceof Error ? updateProduct.error.message : 'Product update failed.'}
          </Alert>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.1fr) minmax(260px, 0.9fr)' }, gap: 1.5 }}>
          <TextField
            label="Product name"
            value={form.name}
            onChange={(event) => setField('name', event.target.value)}
            error={nameMissing}
            helperText={nameMissing ? 'Product name is required.' : 'Shown as the fixed selected product inside Product Home.'}
            fullWidth
          />
          <TextField
            label="Stage"
            value={form.businessStage}
            onChange={(event) => setField('businessStage', event.target.value as ProductProfile['businessStage'])}
            select
            fullWidth
          >
            {businessStageValues.map((stage) => (
              <MenuItem key={stage} value={stage}>{stage}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Product URL"
            value={form.productUrl}
            onChange={(event) => setField('productUrl', event.target.value)}
            placeholder="https://example.com"
            fullWidth
          />
          <TextField
            label="Repository URL"
            value={form.repositoryUrl}
            onChange={(event) => setField('repositoryUrl', event.target.value)}
            placeholder="https://github.com/org/repo"
            fullWidth
          />
        </Box>

        <TextField
          label="Summary"
          value={form.summary}
          onChange={(event) => setField('summary', event.target.value)}
          minRows={4}
          multiline
          fullWidth
        />
        <TextField
          label="Tech stack"
          value={form.techStack}
          onChange={(event) => setField('techStack', event.target.value)}
          minRows={3}
          multiline
          fullWidth
        />
        <TextField
          label="Risk notes"
          value={form.riskProfile}
          onChange={(event) => setField('riskProfile', event.target.value)}
          minRows={3}
          multiline
          fullWidth
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between">
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
            These edits are saved directly by the owner. AI refresh remains optional and never applies profile changes by itself.
          </Typography>
          <Button
            variant="contained"
            startIcon={updateProduct.isSuccess ? <CheckCircleOutlineOutlined /> : <SaveOutlined />}
            onClick={() => updateProduct.mutate()}
            disabled={nameMissing || !isDirty || updateProduct.isPending}
            sx={{ minHeight: 44, minWidth: 170, whiteSpace: 'normal' }}
          >
            {updateProduct.isPending ? 'Saving...' : updateProduct.isSuccess ? 'Saved' : 'Save profile'}
          </Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
