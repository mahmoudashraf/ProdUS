'use client';

import NextLink from 'next/link';
import {
  AutoAwesomeOutlined,
  BuildCircleOutlined,
  DeleteOutlineOutlined,
  Inventory2Outlined,
  KeyboardBackspaceOutlined,
  PlaylistAddCheckOutlined,
} from '@mui/icons-material';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { WorkspaceBreadcrumbs } from './OwnerWorkspaceJourneyNav';
import {
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { PROJECT_START_PLAN_HREF } from './projectStartPlanLinks';
import type { ProductizationCart } from './types';

export type ProductCreationStep = 'setup' | 'manual' | 'review' | 'ai-review';

export const isProductCreationStep = (value: string | null): value is ProductCreationStep =>
  value === 'setup' || value === 'manual' || value === 'review' || value === 'ai-review';

const stepLabel: Record<ProductCreationStep, string> = {
  setup: 'Product setup',
  manual: 'Manual profile',
  review: 'Creation review',
  'ai-review': 'AI understanding review',
};

export function ProductCreationInternalHeader({
  step,
  onBackToSetup,
}: {
  step: ProductCreationStep;
  onBackToSetup: () => void;
}) {
  if (step === 'setup') {
    return null;
  }

  return (
    <WorkspaceBreadcrumbs
      items={[
        { label: 'New Product', onClick: onBackToSetup },
        { label: stepLabel[step] },
      ]}
      backLabel="Product setup"
      onBack={onBackToSetup}
    />
  );
}

export function ProductCreationStartingPointPanel({
  cart,
  fromAiCatalog,
  fromCatalog,
  onManualProfile,
}: {
  cart?: ProductizationCart | undefined;
  fromAiCatalog: boolean;
  fromCatalog: boolean;
  onManualProfile: () => void;
}) {
  const selectedServices = cart?.serviceItems || [];
  const selectedProduct = cart?.productProfile;

  if (!fromCatalog && !fromAiCatalog && !selectedServices.length) {
    return null;
  }
  const title = fromAiCatalog
    ? 'AI integration path selected'
    : selectedServices.length
      ? 'Service path already selected'
      : 'Started from the service catalog';
  const detail = fromAiCatalog
    ? 'Use AI-assisted setup to explain the product, identify useful AI support, and choose only the services the owner approves.'
    : 'ProdUS will attach the product you create to this Product Plan. Review or change the product context before creation.';

  return (
    <Surface sx={{ background: '#fbfdff' }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.75} alignItems={{ lg: 'center' }} justifyContent="space-between">
        <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1,
              bgcolor: '#f1efff',
              color: appleColors.purple,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            {fromAiCatalog ? <AutoAwesomeOutlined /> : <BuildCircleOutlined />}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 950 }}>
              {title}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.55 }}>
              {detail}
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              {selectedProduct && <PastelChip label={selectedProduct.name} accent={appleColors.green} bg="#e7f8ee" />}
              {fromAiCatalog && <PastelChip label="AI integration option" accent={appleColors.cyan} bg="#e4f9fd" />}
              <PastelChip label={`${selectedServices.length} service${selectedServices.length === 1 ? '' : 's'} selected`} accent={appleColors.purple} bg="#f1efff" />
              {cart?.businessGoal && <PastelChip label="Business goal saved" accent={appleColors.cyan} bg="#e4f9fd" />}
            </Stack>
          </Box>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="outlined" startIcon={<Inventory2Outlined />} onClick={onManualProfile} sx={{ minHeight: 40 }}>
            Review product fields
          </Button>
          <Button component={NextLink} href={PROJECT_START_PLAN_HREF} variant="outlined" startIcon={<PlaylistAddCheckOutlined />} sx={{ minHeight: 40 }}>
            View Product Plan
          </Button>
        </Stack>
      </Stack>
    </Surface>
  );
}

export function ProductCreationManualIntro({
  selectedServiceCount,
}: {
  selectedServiceCount: number;
}) {
  return (
    <Surface sx={{ boxShadow: 'none', background: '#fff' }}>
      <SectionTitle title="Create The Product Context" action={<Inventory2Outlined sx={{ color: appleColors.purple }} />} />
      <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
        Fill the owner-visible product profile. After creation, ProdUS opens the product workspace and preserves any services already chosen for the Product Plan.
      </Typography>
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
        <PastelChip label={selectedServiceCount ? `${selectedServiceCount} selected services` : 'No selected services yet'} accent={selectedServiceCount ? appleColors.green : appleColors.amber} bg={selectedServiceCount ? '#e7f8ee' : '#fff4dc'} />
        <PastelChip label="Workspace opens next" accent={appleColors.cyan} bg="#e4f9fd" />
      </Stack>
    </Surface>
  );
}

export function ProductCreationAiReviewEmpty({
  onBackToSetup,
}: {
  onBackToSetup: () => void;
}) {
  return (
    <Surface sx={{ borderStyle: 'dashed', background: 'rgba(248, 250, 252, 0.72)' }}>
      <Stack spacing={1.5} alignItems="flex-start">
        <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
          Run AI analysis from Product Setup first. The AI understanding review opens as its own internal view after ProdUS has an analysis to confirm.
        </Typography>
        <Button variant="outlined" startIcon={<KeyboardBackspaceOutlined />} onClick={onBackToSetup} sx={{ minHeight: 40 }}>
          Product setup
        </Button>
      </Stack>
    </Surface>
  );
}

export function ProductCreationAnalyzeNotice() {
  return (
    <Alert severity="info" icon={<AutoAwesomeOutlined />} sx={{ borderRadius: 1 }}>
      ProdUS is analyzing the product. The AI understanding review will open as the next internal view when the result is ready.
    </Alert>
  );
}

export function ProductCreationStepActions({
  step,
  onBackToSetup,
}: {
  step: ProductCreationStep;
  onBackToSetup: () => void;
}) {
  if (step === 'setup') return null;

  return (
    <Button
      variant="outlined"
      startIcon={<KeyboardBackspaceOutlined />}
      onClick={onBackToSetup}
      sx={{ minHeight: 40, alignSelf: 'flex-start' }}
    >
      Back to product setup
    </Button>
  );
}

export function ProductCreationCartSnapshot({
  cart,
  isRemovingService,
  onChangeServices,
  onRemoveService,
}: {
  cart?: ProductizationCart | undefined;
  isRemovingService?: boolean;
  onChangeServices?: () => void;
  onRemoveService?: (itemId: string) => void;
}) {
  const services = cart?.serviceItems || [];

  if (!services.length) return null;

  return (
    <Surface sx={{ background: '#fff' }}>
      <SectionTitle
        title="Selected Service Context"
        action={<PastelChip label={`${services.length}`} accent={appleColors.purple} />}
      />
      <Stack spacing={1}>
        {services.slice(0, 4).map((item) => (
          <Box key={item.id} sx={{ p: 1.25, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fbfdff' }}>
            <Stack spacing={1}>
              <Box>
                <Typography sx={{ fontWeight: 900 }}>{item.serviceModule.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.5 }}>
                  {item.notes || item.serviceModule.ownerOutcome || item.serviceModule.description || 'Selected for the Product Plan.'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {formatLabel(item.serviceModule.category?.name || 'service')}
                </Typography>
              </Box>
              {onRemoveService && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteOutlineOutlined />}
                  disabled={!!isRemovingService}
                  onClick={() => onRemoveService(item.id)}
                  sx={{ minHeight: 34, alignSelf: 'flex-start' }}
                >
                  Remove
                </Button>
              )}
            </Stack>
          </Box>
        ))}
        {onChangeServices && (
          <Button variant="outlined" startIcon={<PlaylistAddCheckOutlined />} onClick={onChangeServices} sx={{ minHeight: 38 }}>
            Choose different services
          </Button>
        )}
      </Stack>
    </Surface>
  );
}
