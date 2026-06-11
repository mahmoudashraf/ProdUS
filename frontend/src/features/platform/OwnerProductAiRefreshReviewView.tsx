'use client';

import { AutoAwesomeOutlined, CheckCircleOutlineOutlined, SaveOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';
import { PastelChip, Surface, appleColors } from './PlatformComponents';
import {
  fieldDisplayValue,
  fieldLabels,
  type ProductFieldSuggestion,
  type ProductProfileField,
} from './ownerProductAiRefreshModel';
import type { AiAssistedProductAnalysisResponse, ProductProfile } from './types';

interface OwnerProductAiRefreshReviewViewProps {
  analysis: AiAssistedProductAnalysisResponse | null;
  isSaving: boolean;
  product: ProductProfile;
  saveError: unknown;
  saveSuccess: boolean;
  selectedFields: ProductProfileField[];
  suggestions: ProductFieldSuggestion[];
  onOpenRefresh: () => void;
  onSave: () => void;
  onSelectedFieldsChange: (fields: ProductProfileField[]) => void;
}

export default function OwnerProductAiRefreshReviewView({
  analysis,
  isSaving,
  product,
  saveError,
  saveSuccess,
  selectedFields,
  suggestions,
  onOpenRefresh,
  onSave,
  onSelectedFieldsChange,
}: OwnerProductAiRefreshReviewViewProps) {
  const saveErrorMessage = saveError
    ? saveError instanceof Error
      ? saveError.message
      : 'Product update failed.'
    : null;

  if (!analysis) {
    return (
      <Stack spacing={2}>
        <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #fbfdff 100%)' }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ md: 'center' }}
          >
            <Box>
              <Typography variant="h3">Review AI result</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
                No refresh result is waiting for {product.name}. Run a product brief refresh first.
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<AutoAwesomeOutlined />} onClick={onOpenRefresh} sx={{ minHeight: 44 }}>
              Refresh brief
            </Button>
          </Stack>
        </Surface>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)' }}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ lg: 'flex-start' }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h3">Review AI result</Typography>
              <PastelChip
                label={analysis.aiApplied ? 'LoomAI analysis' : 'AI failed - fallback shown'}
                accent={analysis.aiApplied ? appleColors.green : appleColors.amber}
                bg={analysis.aiApplied ? '#e7f8ee' : '#fff4dc'}
              />
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 820, lineHeight: 1.65 }}>
              Choose only the suggested product fields that should update {product.name}. No field
              changes until the owner applies the selected updates.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<AutoAwesomeOutlined />}
            onClick={onOpenRefresh}
            sx={{ minHeight: 44, whiteSpace: 'normal', minWidth: { lg: 190 } }}
          >
            Refresh again
          </Button>
        </Stack>
      </Surface>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) 320px' },
          gap: 2,
        }}
      >
        <Stack spacing={1.25}>
          {suggestions.length ? (
            suggestions.map(item => (
              <ProductFieldSuggestionCard
                key={item.field}
                item={item}
                selected={selectedFields.includes(item.field)}
                onSelectedChange={(checked) =>
                  onSelectedFieldsChange(
                    checked
                      ? [...new Set([...selectedFields, item.field])]
                      : selectedFields.filter(field => field !== item.field)
                  )
                }
              />
            ))
          ) : (
            <Alert severity="info">
              The refresh did not return product profile fields to apply.
            </Alert>
          )}
        </Stack>

        <Stack spacing={1.25}>
          <Surface sx={{ boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary">
              Analysis status
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.75, lineHeight: 1.6, fontWeight: 850 }}>
              {analysis.aiApplied
                ? 'Live AI contributed to this refresh.'
                : 'LoomAI failed or did not return usable structured fields. ProdUS is showing owner input and deterministic rules instead of fake AI output.'}
            </Typography>
            {analysis.fallbackReason && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.75, overflowWrap: 'anywhere' }}
              >
                {analysis.fallbackReason}
              </Typography>
            )}
          </Surface>

          <Surface sx={{ boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary">
              Evidence from analysis
            </Typography>
            <Stack spacing={0.75} sx={{ mt: 1 }}>
              {(analysis.analysis.sourceInsights || []).slice(0, 4).map(insight => (
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
          </Surface>

          <Button
            variant="contained"
            startIcon={saveSuccess ? <CheckCircleOutlineOutlined /> : <SaveOutlined />}
            onClick={onSave}
            disabled={!selectedFields.length || isSaving}
            sx={{ minHeight: 44, whiteSpace: 'normal' }}
          >
            {isSaving
              ? 'Saving...'
              : saveSuccess
                ? 'Product updated'
                : `Apply ${selectedFields.length || 0} selected update${selectedFields.length === 1 ? '' : 's'}`}
          </Button>
          {saveErrorMessage && <Alert severity="error">{saveErrorMessage}</Alert>}
        </Stack>
      </Box>
    </Stack>
  );
}

function ProductFieldSuggestionCard({
  item,
  selected,
  onSelectedChange,
}: {
  item: ProductFieldSuggestion;
  selected: boolean;
  onSelectedChange: (checked: boolean) => void;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '220px minmax(0, 1fr)' },
        gap: 1.25,
        p: 1.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: selected ? appleColors.blue : appleColors.line,
        bgcolor: selected ? '#f5fbff' : '#fff',
        minWidth: 0,
      }}
    >
      <FormControlLabel
        control={
          <Checkbox
            checked={selected}
            disabled={!item.changed}
            onChange={event => onSelectedChange(event.target.checked)}
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
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 1,
          minWidth: 0,
        }}
      >
        <FieldValue title="Current" value={item.current} field={item.field} />
        <FieldValue title="Suggested" value={item.suggested} field={item.field} highlight={item.changed} />
      </Box>
    </Box>
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
  const display = fieldDisplayValue(field, value);
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 1,
        bgcolor: highlight ? '#eef7ff' : '#f8fafc',
        minHeight: 74,
        minWidth: 0,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          mt: 0.5,
          lineHeight: 1.45,
          fontWeight: highlight ? 900 : 750,
          overflowWrap: 'anywhere',
        }}
      >
        {display}
      </Typography>
    </Box>
  );
}
