'use client';

import type { FormEvent } from 'react';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import {
  PastelChip,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
} from './PlatformComponents';
import {
  ownerServiceCompactIntakeFieldSx,
  ownerServiceIntakeActionButtonSx,
} from './ownerServicePlanPresentation';
import type { OwnerRequirementFormValues } from './ownerServicePlanTypes';
import type {
  ProductProfile,
  RequirementIntake,
  ServiceModule,
} from './types';

type OwnerServiceBriefIntakePanelProps = {
  selectedProduct?: ProductProfile | undefined;
  values: OwnerRequirementFormValues;
  requirements: RequirementIntake[];
  catalogModules: ServiceModule[];
  isCreatingRequirement: boolean;
  isBuildingPackage: boolean;
  onValueChange: <K extends keyof OwnerRequirementFormValues>(key: K, value: OwnerRequirementFormValues[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBuildPackage: (requirementId: string) => void;
};

export default function OwnerServiceBriefIntakePanel({
  selectedProduct,
  values,
  requirements,
  catalogModules,
  isCreatingRequirement,
  isBuildingPackage,
  onValueChange,
  onSubmit,
  onBuildPackage,
}: OwnerServiceBriefIntakePanelProps) {
  return (
    <Surface>
      <SectionTitle
        title="Product Brief to Service Plan"
        action={<PastelChip label={`${requirements.length} intakes`} accent={appleColors.blue} />}
      />
      <Box component="form" onSubmit={onSubmit} sx={{ mb: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(210px, 1fr) minmax(240px, 1fr) 132px' }, gap: 1.25, alignItems: 'start' }}>
          <TextField
            select
            size="small"
            label="Requested service"
            value={values.requestedServiceModuleId || ''}
            onChange={event => onValueChange('requestedServiceModuleId', event.target.value || null)}
            sx={ownerServiceCompactIntakeFieldSx}
          >
            <MenuItem value="">General diagnosis</MenuItem>
            {catalogModules.map(module => (
              <MenuItem key={module.id} value={module.id}>{module.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="Business goal"
            value={values.businessGoal}
            onChange={event => onValueChange('businessGoal', event.target.value)}
            sx={ownerServiceCompactIntakeFieldSx}
          />
          <Button
            type="submit"
            variant="outlined"
            disabled={!selectedProduct || !values.businessGoal || isCreatingRequirement}
            sx={{
              ...ownerServiceIntakeActionButtonSx,
              borderColor: '#dbe4f0',
              color: appleColors.purple,
              bgcolor: '#fff',
              boxShadow: 'none',
              '&:hover': {
                borderColor: appleColors.purple,
                bgcolor: '#f8f7ff',
                boxShadow: '0 10px 22px rgba(98, 92, 255, 0.12)',
              },
            }}
          >
            Submit intake
          </Button>
        </Box>
      </Box>

      <Stack spacing={1.25}>
        {requirements.length ? (
          requirements.slice(0, 4).map(requirement => (
            <Box
              key={requirement.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
                gap: { xs: 1.25, md: 2 },
                alignItems: 'center',
                p: 1.5,
                border: '1px solid',
                borderColor: '#e5edf7',
                borderRadius: 1,
                background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
                boxShadow: '0 10px 28px rgba(15, 23, 42, 0.045)',
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 900, color: appleColors.ink, lineHeight: 1.25 }}>
                  {requirement.requestedServiceModule?.name || 'Product diagnosis'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.55 }}>
                  {requirement.businessGoal}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} sx={{ minWidth: { md: 282 } }}>
                <StatusChip label={requirement.status} />
                <Button size="small" variant="contained" onClick={() => onBuildPackage(requirement.id)} disabled={isBuildingPackage} sx={ownerServiceIntakeActionButtonSx}>
                  Create Plan
                </Button>
              </Stack>
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            Choose services in Planning, then submit a product brief or create the product workspace directly.
          </Typography>
        )}
      </Stack>
    </Surface>
  );
}
