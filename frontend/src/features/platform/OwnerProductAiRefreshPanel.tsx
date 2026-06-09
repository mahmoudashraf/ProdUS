'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AutoAwesomeOutlined,
  CheckCircleOutlineOutlined,
  SaveOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postFormData, putJson } from './api';
import {
  PastelChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type {
  AiAssistedProductAnalysisResponse,
  ProductCreationFields,
  ProductProfile,
} from './types';

type ProductProfileField = 'name' | 'summary' | 'businessStage' | 'techStack' | 'productUrl' | 'repositoryUrl' | 'riskProfile';

interface ProductProfileUpdatePayload {
  name: string;
  summary?: string;
  businessStage: ProductProfile['businessStage'];
  techStack?: string;
  productUrl?: string;
  repositoryUrl?: string;
  riskProfile?: string;
}

const fieldLabels: Record<ProductProfileField, string> = {
  name: 'Product name',
  summary: 'Summary',
  businessStage: 'Stage',
  techStack: 'Tech stack',
  productUrl: 'Product URL',
  repositoryUrl: 'Repository URL',
  riskProfile: 'Risk notes',
};

const fieldOrder: ProductProfileField[] = [
  'name',
  'summary',
  'businessStage',
  'techStack',
  'productUrl',
  'repositoryUrl',
  'riskProfile',
];

const businessStageValues: ProductProfile['businessStage'][] = ['IDEA', 'PROTOTYPE', 'VALIDATED', 'LIVE', 'SCALING'];

const textValue = (value?: string | null) => (value || '').trim();

const toBusinessStage = (value: string): ProductProfile['businessStage'] | null => {
  const normalized = value.trim().toUpperCase();
  return businessStageValues.includes(normalized as ProductProfile['businessStage'])
    ? normalized as ProductProfile['businessStage']
    : null;
};

const currentFieldValue = (product: ProductProfile, field: ProductProfileField) => {
  if (field === 'name') return product.name;
  if (field === 'summary') return product.summary || '';
  if (field === 'businessStage') return product.businessStage;
  if (field === 'techStack') return product.techStack || '';
  if (field === 'productUrl') return product.productUrl || '';
  if (field === 'repositoryUrl') return product.repositoryUrl || '';
  return product.riskProfile || '';
};

const suggestedFieldValue = (analysis: ProductCreationFields, field: ProductProfileField) => {
  if (field === 'name') return analysis.productName || '';
  if (field === 'summary') return analysis.summary || analysis.projectDescription || '';
  if (field === 'businessStage') return analysis.businessStage || '';
  if (field === 'techStack') return analysis.techStack || '';
  if (field === 'productUrl') return analysis.productUrl || '';
  if (field === 'repositoryUrl') return analysis.repositoryUrl || '';
  return analysis.riskProfile || '';
};

const changedFields = (product: ProductProfile, analysis: ProductCreationFields) =>
  fieldOrder.filter((field) => {
    const suggested = textValue(suggestedFieldValue(analysis, field));
    if (!suggested) return false;
    return suggested !== textValue(currentFieldValue(product, field));
  });

export default function OwnerProductAiRefreshPanel({ product }: { product: ProductProfile }) {
  const queryClient = useQueryClient();
  const [ownerNote, setOwnerNote] = useState('');
  const [analysis, setAnalysis] = useState<AiAssistedProductAnalysisResponse | null>(null);
  const [selectedFields, setSelectedFields] = useState<ProductProfileField[]>([]);

  const analyzeProduct = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.append('analysisMode', 'FULL_WITH_AI_OPPORTUNITIES');
      if (ownerNote.trim()) payload.append('ownerMessage', ownerNote.trim());
      return postFormData<AiAssistedProductAnalysisResponse>(
        `/products/${product.id}/ai-assisted/analyze`,
        payload,
        { timeoutMs: 360000 }
      );
    },
    onSuccess: (response) => {
      setAnalysis(response);
      setSelectedFields(changedFields(product, response.analysis));
    },
  });

  const suggestions = useMemo(() => {
    if (!analysis) return [];
    return fieldOrder.map((field) => ({
      field,
      current: currentFieldValue(product, field),
      suggested: suggestedFieldValue(analysis.analysis, field),
      changed: textValue(currentFieldValue(product, field)) !== textValue(suggestedFieldValue(analysis.analysis, field)),
    })).filter((item) => textValue(item.suggested));
  }, [analysis, product]);

  useEffect(() => {
    if (!analysis) return;
    setSelectedFields((current) => current.filter((field) => suggestions.some((item) => item.field === field)));
  }, [analysis, suggestions]);

  const updateProduct = useMutation({
    mutationFn: async () => {
      if (!analysis) {
        throw new Error('Run the product brief refresh first.');
      }
      const nextValues = fieldOrder.reduce<ProductProfileUpdatePayload>((payload, field) => {
        if (!selectedFields.includes(field)) return payload;
        const suggested = suggestedFieldValue(analysis.analysis, field);
        if (!textValue(suggested)) return payload;
        if (field === 'businessStage') {
          const businessStage = toBusinessStage(suggested);
          return businessStage ? { ...payload, businessStage } : payload;
        }
        return { ...payload, [field]: suggested };
      }, {
        name: product.name,
        summary: product.summary || '',
        businessStage: product.businessStage,
        techStack: product.techStack || '',
        productUrl: product.productUrl || '',
        repositoryUrl: product.repositoryUrl || '',
        riskProfile: product.riskProfile || '',
      });

      if (!nextValues.name.trim()) {
        nextValues.name = product.name;
      }
      return putJson<ProductProfile, ProductProfileUpdatePayload>(`/products/${product.id}`, nextValues);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['repo-signals', product.id] });
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', product.id, 'diagnoses'] });
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', product.id, 'ship-confidence'] });
    },
  });

  const aiBadge = analysis?.aiApplied
    ? { label: 'LoomAI analysis', accent: appleColors.green, bg: '#e7f8ee' }
    : { label: 'Fallback analysis', accent: appleColors.amber, bg: '#fff4dc' };

  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #fbfdff 100%)' }}>
      <Stack spacing={2.25}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) auto' }, gap: 2, alignItems: 'start' }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h3">Refresh product brief</Typography>
              {analysis && <PastelChip label={aiBadge.label} accent={aiBadge.accent} bg={aiBadge.bg} />}
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 760, lineHeight: 1.65 }}>
              Rerun analysis for {product.name}, then choose which suggested profile fields to save.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AutoAwesomeOutlined />}
            onClick={() => analyzeProduct.mutate()}
            disabled={analyzeProduct.isPending}
            sx={{ minHeight: 42, whiteSpace: 'normal' }}
          >
            {analyzeProduct.isPending ? 'Refreshing...' : 'Run AI refresh'}
          </Button>
        </Box>

        <TextField
          label="Owner note"
          value={ownerNote}
          onChange={(event) => setOwnerNote(event.target.value)}
          minRows={3}
          multiline
          placeholder="Example: make the name clearer for a startup founder, include the latest repo status, or focus on launch blockers."
          fullWidth
        />

        {analyzeProduct.error && (
          <Alert severity="error">
            {analyzeProduct.error instanceof Error ? analyzeProduct.error.message : 'AI refresh failed.'}
          </Alert>
        )}

        {analysis && (
          <>
            <Divider />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) 320px' }, gap: 2 }}>
              <Stack spacing={1.25}>
                {suggestions.length ? suggestions.map((item) => {
                  const selected = selectedFields.includes(item.field);
                  return (
                    <Box
                      key={item.field}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '220px minmax(0, 1fr)' },
                        gap: 1.25,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: selected ? appleColors.blue : appleColors.line,
                        bgcolor: selected ? '#f5fbff' : '#fff',
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selected}
                            disabled={!item.changed}
                            onChange={(event) => {
                              setSelectedFields((current) => event.target.checked
                                ? [...new Set([...current, item.field])]
                                : current.filter((field) => field !== item.field)
                              );
                            }}
                          />
                        }
                        label={
                          <Stack spacing={0.35}>
                            <Typography variant="body2" sx={{ fontWeight: 950 }}>
                              {fieldLabels[item.field]}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.changed ? 'Suggested update' : 'Already current'}
                            </Typography>
                          </Stack>
                        }
                        sx={{ alignItems: 'flex-start', m: 0 }}
                      />
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
                        <FieldValue title="Current" value={item.current} field={item.field} />
                        <FieldValue title="Suggested" value={item.suggested} field={item.field} highlight={item.changed} />
                      </Box>
                    </Box>
                  );
                }) : (
                  <Alert severity="info">The refresh did not return product profile fields to apply.</Alert>
                )}
              </Stack>

              <Stack spacing={1.25}>
                <Box sx={{ p: 1.5, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fff' }}>
                  <Typography variant="caption" color="text.secondary">
                    Analysis status
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.75, lineHeight: 1.6, fontWeight: 850 }}>
                    {analysis.aiApplied
                      ? 'Live AI contributed to this refresh.'
                      : 'ProdUS used deterministic fallback because live AI was unavailable or did not return usable structured fields.'}
                  </Typography>
                  {analysis.fallbackReason && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75, overflowWrap: 'anywhere' }}>
                      {analysis.fallbackReason}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ p: 1.5, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fff' }}>
                  <Typography variant="caption" color="text.secondary">
                    Evidence from analysis
                  </Typography>
                  <Stack spacing={0.75} sx={{ mt: 1 }}>
                    {(analysis.analysis.sourceInsights || []).slice(0, 4).map((insight) => (
                      <Typography key={insight} variant="body2" sx={{ lineHeight: 1.5 }}>
                        {insight}
                      </Typography>
                    ))}
                    {!analysis.analysis.sourceInsights?.length && (
                      <Typography variant="body2" color="text.secondary">
                        No source insight was returned for this refresh.
                      </Typography>
                    )}
                  </Stack>
                </Box>

                <Button
                  variant="contained"
                  startIcon={updateProduct.isSuccess ? <CheckCircleOutlineOutlined /> : <SaveOutlined />}
                  onClick={() => updateProduct.mutate()}
                  disabled={!selectedFields.length || updateProduct.isPending}
                  sx={{ minHeight: 44, whiteSpace: 'normal' }}
                >
                  {updateProduct.isPending
                    ? 'Saving...'
                    : updateProduct.isSuccess
                      ? 'Product updated'
                      : `Apply ${selectedFields.length || 0} selected update${selectedFields.length === 1 ? '' : 's'}`}
                </Button>
                {updateProduct.error && (
                  <Alert severity="error">
                    {updateProduct.error instanceof Error ? updateProduct.error.message : 'Product update failed.'}
                  </Alert>
                )}
              </Stack>
            </Box>
          </>
        )}
      </Stack>
    </Surface>
  );
}

function FieldValue({
  field,
  highlight = false,
  title,
  value,
}: {
  field: ProductProfileField;
  highlight?: boolean;
  title: string;
  value: string;
}) {
  const display = field === 'businessStage' && value ? formatLabel(value) : value || 'Not set';
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 1,
        bgcolor: highlight ? '#eef7ff' : '#f8fafc',
        minHeight: 74,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.45, fontWeight: highlight ? 900 : 750, overflowWrap: 'anywhere' }}>
        {display}
      </Typography>
    </Box>
  );
}
