'use client';

import {
  ArrowForwardOutlined,
  Inventory2Outlined,
  LinkOutlined,
  SecurityOutlined,
} from '@mui/icons-material';
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import {
  DotLabel,
  SaveButton,
  SectionTitle,
  Surface,
  TextInput,
  appleColors,
  categoryPalette,
  formatLabel,
} from './PlatformComponents';
import { ProductProfile } from './types';

interface ProductProfileFormValues {
  name: string;
  summary: string;
  businessStage: ProductProfile['businessStage'];
  techStack: string;
  productUrl: string;
  repositoryUrl: string;
  riskProfile: string;
}

interface ProductOnboardingManualProfilePanelProps {
  values: ProductProfileFormValues;
  isCreating: boolean;
  onValueChange: <TKey extends keyof ProductProfileFormValues>(
    key: TKey,
    value: ProductProfileFormValues[TKey]
  ) => void;
  onSubmit: (event?: React.FormEvent) => void;
}

const stages: ProductProfile['businessStage'][] = [
  'IDEA',
  'PROTOTYPE',
  'VALIDATED',
  'LIVE',
  'SCALING',
];

const setupSteps = [
  {
    title: 'Product context',
    detail: 'Name the product and explain what outcome production readiness should unlock.',
    icon: Inventory2Outlined,
    accent: appleColors.purple,
  },
  {
    title: 'Helpful links',
    detail: 'Attach the app, repo, and notes so ProdUS can understand what is real.',
    icon: LinkOutlined,
    accent: appleColors.cyan,
  },
  {
    title: 'Known rough edges',
    detail: 'Capture what feels unfinished so the project starts with practical next steps.',
    icon: SecurityOutlined,
    accent: appleColors.amber,
  },
];

export default function ProductOnboardingManualProfilePanel({
  values,
  isCreating,
  onValueChange,
  onSubmit,
}: ProductOnboardingManualProfilePanelProps) {
  return (
    <>
      <Surface id="manual-product-profile" sx={{ background: 'linear-gradient(135deg, #ffffff, #f7fbff)' }}>
        <Stack spacing={2}>
          <SectionTitle
            title="Guided Setup"
            action={<DotLabel label="Owner first" color={appleColors.purple} />}
          />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 1.5,
            }}
          >
            {setupSteps.map((step, index) => {
              const Icon = step.icon;
              const palette =
                categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
              return (
                <Box
                  key={step.title}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: `${step.accent}33`,
                    borderTop: `3px solid ${step.accent}`,
                    background: `linear-gradient(145deg, #fff, ${palette.soft})`,
                  }}
                >
                  <Stack spacing={1.3}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 1,
                        display: 'grid',
                        placeItems: 'center',
                        color: step.accent,
                        bgcolor: `${step.accent}14`,
                      }}
                    >
                      <Icon />
                    </Box>
                    <Box>
                      <Typography variant="h4">{step.title}</Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.75, lineHeight: 1.55 }}
                      >
                        {step.detail}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              );
            })}
          </Box>
        </Stack>
      </Surface>

      <Surface>
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
              label={isCreating ? 'Creating product...' : 'Create product'}
              endIcon={<ArrowForwardOutlined />}
            />
          </Stack>
        </Box>
      </Surface>
    </>
  );
}
