'use client';

import type { ComponentProps, FormEvent } from 'react';
import NextLink from 'next/link';
import { AutoAwesomeOutlined } from '@mui/icons-material';
import { Box, Button, LinearProgress, MenuItem, Stack, TextField, Typography } from '@mui/material';
import {
  EmptyState,
  PastelChip,
  ProgressRing,
  SaveButton,
  SectionTitle,
  StatusChip,
  Surface,
  TextInput,
  appleColors,
  categoryPalette,
  clampScore,
  formatLabel,
} from './PlatformComponents';
import StudioAssistantCard, { type StudioAssistantContext } from './StudioAssistantCard';
import type {
  PackageInstance,
  PackageModule,
  ProductProfile,
  RequirementIntake,
  ServiceModule,
} from './types';

type AssistantActionProps = Pick<ComponentProps<typeof StudioAssistantCard>, 'onConfirmAction' | 'actionDisabledReason'>;

interface OwnerProductFormValues {
  name: string;
  summary: string;
  businessStage: ProductProfile['businessStage'];
  techStack: string;
  riskProfile: string;
}

interface OwnerRequirementFormValues {
  requestedServiceModuleId: string | null;
  businessGoal: string;
}

const stageOptions: ProductProfile['businessStage'][] = ['IDEA', 'PROTOTYPE', 'VALIDATED', 'LIVE', 'SCALING'];

const statusAccent = (status?: string) => {
  if (!status) return appleColors.purple;
  if (status.includes('BLOCK') || status.includes('REJECT') || status.includes('URGENT')) return appleColors.red;
  if (status.includes('REVIEW') || status.includes('NEGOTIATION') || status.includes('AWAITING') || status.includes('SUBMITTED')) return appleColors.amber;
  if (status.includes('ACTIVE') || status.includes('ACCEPT') || status.includes('DELIVER') || status.includes('SIGNED') || status.includes('ON_TRACK')) return appleColors.green;
  return appleColors.purple;
};

const packageScore = (packageInstance?: PackageInstance, modules?: PackageModule[]) => {
  if (!packageInstance) return 54;
  const moduleScore = modules?.length
    ? modules.reduce((total, module) => {
        if (module.status === 'ACCEPTED') return total + 100;
        if (module.status === 'REVIEW') return total + 78;
        if (module.status === 'IN_PROGRESS') return total + 64;
        if (module.status === 'BLOCKED') return total + 28;
        return total + 48;
      }, 0) / modules.length
    : 68;
  const statusBonus = packageInstance.status === 'ACTIVE_DELIVERY' ? 8 : packageInstance.status === 'DELIVERED' ? 16 : 0;
  return clampScore(moduleScore + statusBonus);
};

const compactIntakeFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 1,
    background: '#fff',
    minHeight: 44,
  },
  '& .MuiInputBase-input': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

const intakeActionButtonSx = {
  minHeight: 44,
  borderRadius: 1,
  px: 2,
  textTransform: 'none',
  fontWeight: 900,
  whiteSpace: 'nowrap',
  boxShadow: '0 12px 26px rgba(99, 91, 255, 0.16)',
};

interface OwnerServicePlanPanelProps {
  showProductCreation: boolean;
  selectedProduct?: ProductProfile | undefined;
  productFormValues: OwnerProductFormValues;
  requirementFormValues: OwnerRequirementFormValues;
  selectedProductRequirements: RequirementIntake[];
  catalogModules: ServiceModule[];
  selectedPackage?: PackageInstance | undefined;
  packageModules: PackageModule[];
  isPackageFetching: boolean;
  isTeamRecommendationsFetching: boolean;
  isCreatingProduct: boolean;
  isCreatingRequirement: boolean;
  isBuildingPackage: boolean;
  cartStartPromptFacts: string;
  packageAssistantContext: StudioAssistantContext;
  assistantActions: AssistantActionProps;
  onProductValueChange: <K extends keyof OwnerProductFormValues>(key: K, value: OwnerProductFormValues[K]) => void;
  onRequirementValueChange: <K extends keyof OwnerRequirementFormValues>(key: K, value: OwnerRequirementFormValues[K]) => void;
  onSubmitProduct: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitRequirement: (event: FormEvent<HTMLFormElement>) => void;
  onBuildPackage: (requirementId: string) => void;
}

export default function OwnerServicePlanPanel({
  showProductCreation,
  selectedProduct,
  productFormValues,
  requirementFormValues,
  selectedProductRequirements,
  catalogModules,
  selectedPackage,
  packageModules,
  isPackageFetching,
  isTeamRecommendationsFetching,
  isCreatingProduct,
  isCreatingRequirement,
  isBuildingPackage,
  cartStartPromptFacts,
  packageAssistantContext,
  assistantActions,
  onProductValueChange,
  onRequirementValueChange,
  onSubmitProduct,
  onSubmitRequirement,
  onBuildPackage,
}: OwnerServicePlanPanelProps) {
  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: showProductCreation ? '420px 1fr' : '1fr' }, gap: 2.5 }}>
        {showProductCreation && (
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
            <Box component="form" onSubmit={onSubmitProduct}>
              <Stack spacing={1.5}>
                <TextInput label="Name" value={productFormValues.name} onChange={(value) => onProductValueChange('name', value)} />
                <TextInput label="Summary" value={productFormValues.summary} onChange={(value) => onProductValueChange('summary', value)} multiline />
                <TextField select fullWidth label="Stage" value={productFormValues.businessStage} onChange={(event) => onProductValueChange('businessStage', event.target.value as ProductProfile['businessStage'])}>
                  {stageOptions.map((stage) => (
                    <MenuItem key={stage} value={stage}>{formatLabel(stage)}</MenuItem>
                  ))}
                </TextField>
                <TextInput label="Tech stack" value={productFormValues.techStack} onChange={(value) => onProductValueChange('techStack', value)} />
                <TextInput label="Known risks" value={productFormValues.riskProfile} onChange={(value) => onProductValueChange('riskProfile', value)} multiline />
                <SaveButton disabled={!productFormValues.name || isCreatingProduct} label="Create product" />
              </Stack>
            </Box>
          </Surface>
        )}

        <Surface>
          <SectionTitle title="Product Brief to Service Plan" action={<PastelChip label={`${selectedProductRequirements.length} intakes`} accent={appleColors.blue} />} />
          <Box component="form" onSubmit={onSubmitRequirement} sx={{ mb: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(210px, 1fr) minmax(240px, 1fr) 132px' }, gap: 1.25, alignItems: 'start' }}>
              <TextField
                select
                size="small"
                label="Requested service"
                value={requirementFormValues.requestedServiceModuleId || ''}
                onChange={(event) => onRequirementValueChange('requestedServiceModuleId', event.target.value || null)}
                sx={compactIntakeFieldSx}
              >
                <MenuItem value="">General diagnosis</MenuItem>
                {catalogModules.map((module) => (
                  <MenuItem key={module.id} value={module.id}>{module.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                label="Business goal"
                value={requirementFormValues.businessGoal}
                onChange={(event) => onRequirementValueChange('businessGoal', event.target.value)}
                sx={compactIntakeFieldSx}
              />
              <Button
                type="submit"
                variant="outlined"
                disabled={!selectedProduct || !requirementFormValues.businessGoal || isCreatingRequirement}
                sx={{
                  ...intakeActionButtonSx,
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
            {selectedProductRequirements.length ? (
              selectedProductRequirements.slice(0, 4).map((requirement) => (
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
                    <Typography sx={{ fontWeight: 900, color: appleColors.ink, lineHeight: 1.25 }}>{requirement.requestedServiceModule?.name || 'Product diagnosis'}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.55 }}>
                      {requirement.businessGoal}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} sx={{ minWidth: { md: 282 } }}>
                    <StatusChip label={requirement.status} />
                    <Button size="small" variant="contained" onClick={() => onBuildPackage(requirement.id)} disabled={isBuildingPackage} sx={intakeActionButtonSx}>
                      Create Plan
                    </Button>
                  </Stack>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">Add lifecycle services to the draft cart, then submit a product brief or create the project workspace directly.</Typography>
            )}
          </Stack>
        </Surface>
      </Box>

      <Surface>
        <SectionTitle title="Service Plan" action={selectedPackage && <StatusChip label={selectedPackage.status} />} />
        {selectedPackage ? (
          <Stack spacing={2}>
            {(isPackageFetching || isTeamRecommendationsFetching) && <LinearProgress sx={{ borderRadius: 999 }} />}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
              <Box>
                <Typography variant="h3">{selectedPackage.name}</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.7 }}>{selectedPackage.summary}</Typography>
              </Box>
              <ProgressRing value={packageScore(selectedPackage, packageModules)} color={statusAccent(selectedPackage.status)} label="confidence" />
            </Stack>
            <StudioAssistantCard
              title="AI Package Recommendation"
              description="Validate this service plan against product goals, dependencies, delivery evidence, and team-readiness."
              prompt={`Evaluate the service plan "${selectedPackage.name}" for ${selectedProduct?.name || 'this product'}. Use these visible project start facts directly: ${cartStartPromptFacts} Explain whether the package sequence is appropriate, which dependencies or proof gates matter, what a team should prove, and what the owner should decide next. Keep the answer practical for an MVP or AI-built prototype owner.`}
              conversationId={`studio-package-${selectedPackage.id}`}
              context={packageAssistantContext}
              {...assistantActions}
              accent={appleColors.purple}
              cta="Review Package"
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${Math.max(1, packageModules.length || 1)}, 1fr)` }, gap: 1.25 }}>
              {packageModules.map((module, index) => {
                const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
                return (
                  <Box key={module.id} sx={{ p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'divider', background: palette.soft }}>
                    <PastelChip label={`Step ${index + 1}`} accent={palette.accent} bg={palette.bg} />
                    <Typography sx={{ mt: 1.25, fontWeight: 900 }}>{module.serviceModule.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.55 }}>{module.acceptanceCriteria || module.serviceModule.acceptanceCriteria}</Typography>
                    <Box sx={{ mt: 1.25 }}><StatusChip label={module.status} /></Box>
                  </Box>
                );
              })}
            </Box>
          </Stack>
        ) : (
          <EmptyState label="No service plan exists for this product yet. Create one from a product brief or convert the cart into a project workspace." />
        )}
      </Surface>
    </>
  );
}
