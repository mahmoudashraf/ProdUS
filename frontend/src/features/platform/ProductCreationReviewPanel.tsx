'use client';

import {
  ArrowForwardOutlined,
  EditOutlined,
  Inventory2Outlined,
  LinkOutlined,
  PlaylistAddCheckOutlined,
  SecurityOutlined,
} from '@mui/icons-material';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { ProductOnboardingProfileValues } from './productOnboardingAiPayloads';
import type { ProductizationCart } from './types';

export default function ProductCreationReviewPanel({
  cart,
  isCreating,
  isRemovingService,
  values,
  onBackToProfile,
  onChangeServices,
  onCreate,
  onRemoveService,
}: {
  cart?: ProductizationCart | undefined;
  isCreating: boolean;
  isRemovingService?: boolean;
  values: ProductOnboardingProfileValues;
  onBackToProfile: () => void;
  onChangeServices: () => void;
  onCreate: () => void | Promise<void>;
  onRemoveService: (itemId: string) => void;
}) {
  const services = cart?.serviceItems || [];
  const canCreate = Boolean(values.name.trim() && values.summary.trim());

  return (
    <Stack spacing={2.5}>
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)' }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ lg: 'center' }}>
          <Stack spacing={1} sx={{ minWidth: 0, maxWidth: 820 }}>
            <PastelChip label="Final owner check" accent={appleColors.purple} />
            <Typography variant="h2">Review before ProdUS creates the product</Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
              Confirm the product context and selected services. After this, ProdUS creates the product profile, opens its product page, and keeps those choices in Planning.
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <PastelChip label={formatLabel(values.businessStage)} accent={appleColors.purple} bg="#f1efff" />
              <PastelChip label={`${services.length} selected services`} accent={services.length ? appleColors.green : appleColors.amber} bg={services.length ? '#e7f8ee' : '#fff4dc'} />
              <PastelChip label={values.repositoryUrl ? 'Repo link present' : 'Repo link missing'} accent={values.repositoryUrl ? appleColors.green : appleColors.amber} bg={values.repositoryUrl ? '#e7f8ee' : '#fff4dc'} />
            </Stack>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row', lg: 'column' }} spacing={1} sx={{ minWidth: { lg: 220 } }}>
            <Button variant="outlined" startIcon={<EditOutlined />} onClick={onBackToProfile} sx={{ minHeight: 42 }}>
              Edit profile
            </Button>
            <Button
              variant="contained"
              endIcon={<ArrowForwardOutlined />}
              disabled={!canCreate || isCreating}
              onClick={onCreate}
              sx={{ minHeight: 44 }}
            >
              {isCreating ? 'Creating...' : 'Create product'}
            </Button>
          </Stack>
        </Stack>
      </Surface>

      {!canCreate && (
        <Alert severity="warning" sx={{ borderRadius: 1 }}>
          Add a product name and outcome before creating the product.
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.05fr 0.95fr' }, gap: 2.5 }}>
        <Surface>
          <SectionTitle title="Product profile" action={<Inventory2Outlined sx={{ color: appleColors.purple }} />} />
          <Stack spacing={1.5}>
            <ReviewField label="Name" value={values.name || 'Not set'} />
            <ReviewField label="Outcome" value={values.summary || 'Not set'} />
            <ReviewField label="Stage" value={formatLabel(values.businessStage)} />
            <ReviewField label="Tech stack" value={values.techStack || 'Not provided yet'} />
          </Stack>
        </Surface>

        <Stack spacing={2.5}>
          <Surface>
            <SectionTitle title="Helpful links" action={<LinkOutlined sx={{ color: appleColors.cyan }} />} />
            <Stack spacing={1.5}>
              <ReviewField label="Product URL" value={values.productUrl || 'Not provided yet'} />
              <ReviewField label="Repository URL" value={values.repositoryUrl || 'Not provided yet'} />
            </Stack>
          </Surface>

          <Surface>
            <SectionTitle title="Known rough edges" action={<SecurityOutlined sx={{ color: appleColors.amber }} />} />
            <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {values.riskProfile || 'No known rough edges were added yet.'}
            </Typography>
          </Surface>
        </Stack>
      </Box>

      <Surface>
        <SectionTitle
          title="Selected services"
          action={<PastelChip label={`${services.length}`} accent={services.length ? appleColors.green : appleColors.amber} bg={services.length ? '#e7f8ee' : '#fff4dc'} />}
        />
        {services.length ? (
          <Stack spacing={1.25}>
            {services.map((item) => (
              <Box key={item.id} sx={{ p: 1.4, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fbfdff' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} justifyContent="space-between">
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 950 }}>{item.serviceModule.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
                      {item.notes || item.serviceModule.ownerOutcome || item.serviceModule.description || 'Selected in Planning.'}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    disabled={!!isRemovingService}
                    onClick={() => onRemoveService(item.id)}
                    sx={{ minHeight: 34, alignSelf: { xs: 'flex-start', md: 'center' }, flexShrink: 0 }}
                  >
                    Remove
                  </Button>
                </Stack>
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
            No services are selected yet. You can still create the product and choose services later.
          </Typography>
        )}
        <Button variant="outlined" startIcon={<PlaylistAddCheckOutlined />} onClick={onChangeServices} sx={{ minHeight: 40, mt: 1.5 }}>
          Choose services
        </Button>
      </Surface>
    </Stack>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ borderTop: '1px solid', borderColor: appleColors.line, pt: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 900, mt: 0.25, overflowWrap: 'anywhere' }}>{value}</Typography>
    </Box>
  );
}
