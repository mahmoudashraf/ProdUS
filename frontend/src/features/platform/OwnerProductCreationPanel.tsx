'use client';

import type { FormEvent } from 'react';
import NextLink from 'next/link';
import { AutoAwesomeOutlined } from '@mui/icons-material';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import {
  SaveButton,
  SectionTitle,
  Surface,
  TextInput,
  formatLabel,
} from './PlatformComponents';
import { ownerServicePlanStageOptions } from './ownerServicePlanPresentation';
import type { OwnerProductFormValues } from './ownerServicePlanTypes';
import type { ProductProfile } from './types';

type OwnerProductCreationPanelProps = {
  values: OwnerProductFormValues;
  isCreating: boolean;
  onValueChange: <K extends keyof OwnerProductFormValues>(key: K, value: OwnerProductFormValues[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function OwnerProductCreationPanel({
  values,
  isCreating,
  onValueChange,
  onSubmit,
}: OwnerProductCreationPanelProps) {
  return (
    <Surface>
      <SectionTitle
        title="Add Product"
        action={
          <Button
            component={NextLink}
            href="/products/new"
            size="small"
            variant="contained"
            startIcon={<AutoAwesomeOutlined />}
            sx={{
              borderRadius: 999,
              boxShadow: '0 12px 26px rgba(99, 91, 255, 0.2)',
              textTransform: 'none',
            }}
          >
            AI create
          </Button>
        }
      />
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={1.5}>
          <TextInput label="Name" value={values.name} onChange={value => onValueChange('name', value)} />
          <TextInput
            label="Summary"
            value={values.summary}
            onChange={value => onValueChange('summary', value)}
            multiline
          />
          <TextField
            select
            fullWidth
            label="Stage"
            value={values.businessStage}
            onChange={event => onValueChange('businessStage', event.target.value as ProductProfile['businessStage'])}
          >
            {ownerServicePlanStageOptions.map(stage => (
              <MenuItem key={stage} value={stage}>
                {formatLabel(stage)}
              </MenuItem>
            ))}
          </TextField>
          <TextInput label="Tech stack" value={values.techStack} onChange={value => onValueChange('techStack', value)} />
          <TextInput
            label="Known risks"
            value={values.riskProfile}
            onChange={value => onValueChange('riskProfile', value)}
            multiline
          />
          <SaveButton disabled={!values.name || isCreating} label="Create product" />
        </Stack>
      </Box>
    </Surface>
  );
}
