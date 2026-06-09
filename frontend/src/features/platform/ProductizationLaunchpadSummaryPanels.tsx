'use client';

import NextLink from 'next/link';
import {
  ArrowForwardOutlined,
  FactCheckOutlined,
  Inventory2Outlined,
  PlaylistAddCheckOutlined,
  WorkspacesOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  MetricTile,
  PastelChip,
  ProgressRing,
  SectionTitle,
  Surface,
  appleColors,
  clampScore,
  formatLabel,
} from './PlatformComponents';
import { launchpadStatusAccent } from './productizationLaunchpadModel';
import { PROJECT_START_PLAN_HREF } from './projectStartPlanLinks';
import type { ProductProfile } from './types';

export function LaunchpadHeroPanel({
  nextProduct,
  currentDraftTitle,
  draftServices,
  draftTalent,
  cartStatus,
}: {
  nextProduct?: ProductProfile | undefined;
  currentDraftTitle: string;
  draftServices: number;
  draftTalent: number;
  cartStatus?: string | undefined;
}) {
  return (
    <Surface sx={{ p: 0, overflow: 'hidden', background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)' }}>
      <Box sx={{ p: { xs: 2.5, md: 3 }, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' }, gap: 3, alignItems: 'center', minWidth: 0 }}>
        <Stack spacing={2} sx={{ minWidth: 0 }}>
          <PastelChip label="Owner workflow" accent={appleColors.purple} />
          <Box>
            <Typography variant="h1" sx={{ fontSize: { xs: 30, sm: 36, md: 48 }, letterSpacing: 0, mb: 1, overflowWrap: 'anywhere' }}>
              Turn a product idea into a delivery workspace.
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 680, fontSize: 17, lineHeight: 1.7 }}>
              Keep the owner journey simple: product profile, service start plan, talent shortlist, then a workspace with milestones and evidence.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button component={NextLink} href={nextProduct ? `/products/${nextProduct.id}` : '/products/new'} variant="contained" endIcon={<ArrowForwardOutlined />} sx={{ minHeight: 46 }}>
              {nextProduct ? 'Continue product' : 'Create first product'}
            </Button>
            <Button component={NextLink} href="/catalog" variant="outlined" sx={{ minHeight: 46 }}>
              Explore services
            </Button>
          </Stack>
        </Stack>

        <Surface sx={{ boxShadow: '0 18px 60px rgba(98, 92, 255, 0.12)', minWidth: 0 }}>
          <Stack spacing={2}>
            <SectionTitle title="Current start plan" action={<PlaylistAddCheckOutlined sx={{ color: appleColors.purple }} />} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ minWidth: 0 }}>
              <ProgressRing value={clampScore((draftServices * 18) + (draftTalent * 14) + (nextProduct ? 28 : 0))} size={92} color={appleColors.purple} label="ready" />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h4">{currentDraftTitle}</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  {nextProduct ? `Prepared for ${nextProduct.name}` : 'Create or select a product to make this start plan actionable.'}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <PastelChip label={`${draftServices} services`} accent={appleColors.purple} />
              <PastelChip label={`${draftTalent} teams / experts`} accent={appleColors.cyan} bg="#e4f9fd" />
              <PastelChip label={formatLabel(cartStatus || 'DRAFT')} accent={launchpadStatusAccent(cartStatus)} />
            </Stack>
            <Button component={NextLink} href={PROJECT_START_PLAN_HREF} variant="outlined" endIcon={<ArrowForwardOutlined />} sx={{ minHeight: 42 }}>
              Review and start workspace
            </Button>
          </Stack>
        </Surface>
      </Box>
    </Surface>
  );
}

export function LaunchpadMetricsStrip({
  productCount,
  requirementCount,
  draftServices,
  draftTalent,
  averageHealth,
  activeWorkspaceCount,
  workspaceCount,
}: {
  productCount: number;
  requirementCount: number;
  draftServices: number;
  draftTalent: number;
  averageHealth: number;
  activeWorkspaceCount: number;
  workspaceCount: number;
}) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2 }}>
      <MetricTile label="Products" value={productCount} detail={`${requirementCount} product briefs`} accent={appleColors.purple} icon={<Inventory2Outlined />} sparkline />
      <MetricTile label="Start plan" value={draftServices + draftTalent} detail={`${draftServices} services, ${draftTalent} talent`} accent={appleColors.cyan} icon={<PlaylistAddCheckOutlined />} sparkline />
      <MetricTile label="Health" value={averageHealth ? `${averageHealth}/100` : 'New'} detail="Service plan confidence" accent={averageHealth >= 70 ? appleColors.green : appleColors.amber} icon={<FactCheckOutlined />} sparkline />
      <MetricTile label="Workspaces" value={activeWorkspaceCount} detail={`${workspaceCount} total`} accent={appleColors.green} icon={<WorkspacesOutlined />} sparkline />
    </Box>
  );
}
