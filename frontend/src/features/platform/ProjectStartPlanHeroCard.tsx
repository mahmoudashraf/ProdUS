'use client';

import NextLink from 'next/link';
import { ArrowForwardOutlined, Inventory2Outlined } from '@mui/icons-material';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import {
  EmptyState,
  PastelChip,
  ProgressRing,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { compactProjectTechStack, projectStartPlanTitle } from './projectStartPlanModel';
import type { ProductProfile } from './types';

interface ProjectStartPlanHeroCardProps {
  title: string | undefined;
  product: ProductProfile | undefined;
  hasPlaceholderProduct: boolean;
  score: number;
  canStartWorkspace: boolean;
  blockers: number;
  notice: string | undefined;
  onNoticeClose: () => void;
}

export default function ProjectStartPlanHeroCard({
  title,
  product,
  hasPlaceholderProduct,
  score,
  canStartWorkspace,
  blockers,
  notice,
  onNoticeClose,
}: ProjectStartPlanHeroCardProps) {
  const statusLabel = canStartWorkspace ? 'Ready to start' : hasPlaceholderProduct ? 'Choose product' : blockers ? 'Blocked' : 'Needs scope';
  const statusAccent = canStartWorkspace
    ? appleColors.green
    : blockers
      ? appleColors.red
      : hasPlaceholderProduct
        ? appleColors.amber
        : appleColors.purple;
  const displayTitle = hasPlaceholderProduct
    ? 'Choose a real product'
    : product?.name
      ? product.name
      : projectStartPlanTitle(title);
  const techStackLabel = compactProjectTechStack(product?.techStack);

  return (
    <Surface sx={{ p: 0, overflow: 'hidden', background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)' }}>
      <Box sx={{ p: { xs: 1.75, md: 3 }, minWidth: 0, display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: '0.75fr 1.25fr' }, gap: { xs: 2, md: 3 }, alignItems: 'center' }}>
        <Stack spacing={{ xs: 1.5, md: 2 }} sx={{ minWidth: 0 }}>
          <PastelChip label={statusLabel} accent={statusAccent} bg={`${statusAccent}12`} />
          <Stack direction="row" spacing={{ xs: 1.25, sm: 2 }} alignItems="center" sx={{ minWidth: 0 }}>
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              <ProgressRing value={score} size={76} color={canStartWorkspace ? appleColors.green : blockers ? appleColors.red : appleColors.purple} label="ready" />
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <ProgressRing value={score} size={108} color={canStartWorkspace ? appleColors.green : blockers ? appleColors.red : appleColors.purple} label="ready" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: 26, sm: 34, md: 38 },
                  lineHeight: { xs: 1.12, sm: 1.15 },
                  overflowWrap: 'anywhere',
                }}
              >
                {displayTitle}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6, fontSize: { xs: 14, sm: 16 } }}>
                Choose the services and delivery support, then approve the workspace when Planning is ready.
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Stack spacing={2} sx={{ minWidth: 0 }}>
          {notice && (
            <Alert severity="success" onClose={onNoticeClose} sx={{ borderRadius: 1 }}>
              {notice}
            </Alert>
          )}
          {hasPlaceholderProduct && (
            <Alert severity="warning" sx={{ borderRadius: 1 }}>
              Planning is attached to a temporary test product. Choose the real product from Home before starting a workspace.
            </Alert>
          )}
          {product && !hasPlaceholderProduct ? (
            <Surface sx={{ boxShadow: 'none', background: '#fff' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
                <Box sx={{ width: 46, height: 46, borderRadius: 1, display: 'grid', placeItems: 'center', bgcolor: '#f1efff', color: appleColors.purple }}>
                  <Inventory2Outlined />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h4" sx={{ overflowWrap: 'anywhere' }}>{product.name}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: { xs: 3, md: 'unset' }, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {product.summary || 'No product summary yet.'}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                    <PastelChip label={formatLabel(product.businessStage)} accent={appleColors.purple} />
                    {techStackLabel && <PastelChip label={techStackLabel} accent={appleColors.cyan} bg="#e4f9fd" />}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Product is selected globally. Use Home to switch products.
                  </Typography>
                </Box>
              </Stack>
            </Surface>
          ) : (
            <EmptyState label="Choose a real product from Home before Planning can become a workspace." />
          )}
          <Button
            component={NextLink}
            href="/dashboard?focus=products"
            variant="outlined"
            endIcon={<ArrowForwardOutlined />}
            sx={{ minHeight: 40, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
          >
            Home
          </Button>
        </Stack>
      </Box>
    </Surface>
  );
}
