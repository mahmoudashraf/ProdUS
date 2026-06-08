'use client';

import {
  ArrowForwardOutlined,
  Inventory2Outlined,
} from '@mui/icons-material';
import { Box, MenuItem, Stack, TextField } from '@mui/material';
import {
  SaveButton,
  SectionTitle,
  Surface,
  TextInput,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { ProductProfile } from './types';
import type { ProductOnboardingProfileValues } from './productOnboardingAiPayloads';

interface ProductOnboardingManualProfilePanelProps {
  values: ProductOnboardingProfileValues;
  isCreating: boolean;
  onValueChange: <TKey extends keyof ProductOnboardingProfileValues>(
    key: TKey,
    value: ProductOnboardingProfileValues[TKey]
  ) => void;
  onSubmit: (event?: React.FormEvent) => void | Promise<void>;
}

const stages: ProductProfile['businessStage'][] = [
  'IDEA',
  'PROTOTYPE',
  'VALIDATED',
  'LIVE',
  'SCALING',
];

export default function ProductOnboardingManualProfilePanel({
  values,
  isCreating,
  onValueChange,
  onSubmit,
}: ProductOnboardingManualProfilePanelProps) {
  return (
    <Surface id="manual-product-profile">
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2.25}>
          <SectionTitle
            title="Product Profile"
            action={<Inventory2Outlined sx={{ color: appleColors.purple }} />}
          />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr' },
              gap: 2,
            }}
          >
            <TextInput
              label="Product name"
              value={values.name}
              onChange={name => onValueChange('name', name)}
            />
            <TextField
              select
              fullWidth
              label="Business stage"
              value={values.businessStage}
              onChange={event =>
                onValueChange(
                  'businessStage',
                  event.target.value as ProductProfile['businessStage']
                )
              }
            >
              {stages.map(stage => (
                <MenuItem key={stage} value={stage}>
                  {formatLabel(stage)}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <TextInput
            label="Product outcome"
            value={values.summary}
            onChange={summary => onValueChange('summary', summary)}
            multiline
          />
          <TextInput
            label="Tech stack"
            value={values.techStack}
            onChange={techStack => onValueChange('techStack', techStack)}
          />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2,
            }}
          >
            <TextInput
              label="Product URL"
              value={values.productUrl}
              onChange={productUrl => onValueChange('productUrl', productUrl)}
            />
            <TextInput
              label="Repository URL"
              value={values.repositoryUrl}
              onChange={repositoryUrl => onValueChange('repositoryUrl', repositoryUrl)}
            />
          </Box>
          <TextInput
            label="Known risks or constraints"
            value={values.riskProfile}
            onChange={riskProfile => onValueChange('riskProfile', riskProfile)}
            multiline
          />
          <SaveButton
            disabled={!values.name || !values.summary || isCreating}
            label={isCreating ? 'Preparing review...' : 'Review before creation'}
            endIcon={<ArrowForwardOutlined />}
          />
        </Stack>
      </Box>
    </Surface>
  );
}
