'use client';

import NextLink from 'next/link';
import { useState } from 'react';
import {
  ArrowForwardOutlined,
  DeleteOutlineOutlined,
  FactCheckOutlined,
  Inventory2Outlined,
  PlaylistAddCheckOutlined,
  WorkspacesOutlined,
} from '@mui/icons-material';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
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
import { productWorkspaceRoute } from './ownerWorkspaceModel';
import { launchpadStatusAccent } from './productizationLaunchpadModel';
import { PROJECT_START_PLAN_HREF } from './projectStartPlanLinks';
import type { ProductProfile } from './types';

export function LaunchpadHeroPanel({
  nextProduct,
  selectedProduct,
  productCount,
  currentDraftTitle,
  draftServices,
  draftTalent,
  draftBusinessGoal,
  hasMeaningfulDraft,
  requirementCount,
  activeWorkspaceCount,
  workspaceCount,
  isDeletingDraft = false,
  onDeleteDraft,
  cartStatus,
}: {
  nextProduct?: ProductProfile | undefined;
  selectedProduct?: ProductProfile | undefined;
  productCount: number;
  currentDraftTitle: string;
  draftServices: number;
  draftTalent: number;
  draftBusinessGoal?: string | undefined;
  hasMeaningfulDraft: boolean;
  requirementCount: number;
  activeWorkspaceCount: number;
  workspaceCount: number;
  isDeletingDraft?: boolean | undefined;
  onDeleteDraft?: (() => Promise<void> | void) | undefined;
  cartStatus?: string | undefined;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const hasProducts = productCount > 0;
  const productToOpen = selectedProduct || (productCount === 1 ? nextProduct : undefined);
  const showSingleProductSnapshot = productCount === 1 && Boolean(productToOpen) && !hasMeaningfulDraft;
  const showPortfolioPicker = hasProducts && !productToOpen && !hasMeaningfulDraft;
  const draftItemCount = draftServices + draftTalent;
  const draftPlanHref = productToOpen ? `/products/${productToOpen.id}?tab=services&view=plan` : PROJECT_START_PLAN_HREF;
  const buildPlanHref = productToOpen ? productWorkspaceRoute(productToOpen.id, 'services') : PROJECT_START_PLAN_HREF;
  const primaryHref = !hasProducts
    ? '/products/new'
    : productToOpen
      ? productWorkspaceRoute(productToOpen.id)
      : '/dashboard?focus=products';
  const primaryLabel = !hasProducts
    ? 'Create first product'
    : productToOpen
      ? 'Open workspace'
      : 'Choose product';
  const headline = !hasProducts
    ? 'Start with your product'
    : productToOpen
      ? 'Continue your product'
      : 'Pick the product that needs attention';
  const subtitle = !hasProducts
    ? 'Add a product idea, app link, repo, README, or files. ProdUS will help you understand launch blockers, AI opportunities, and the next work to start.'
    : productToOpen
      ? 'Open the workspace to see launch readiness, AI opportunities, scanners, services, and the next work to start.'
      : `You have ${productCount} products. Choose one to open its workspace with launch verdict, scanners, AI opportunities, services, and sharing.`;

  const confirmDeleteDraft = async () => {
    if (!onDeleteDraft) return;
    await onDeleteDraft();
    setDeleteDialogOpen(false);
  };

  return (
    <Surface sx={{ p: 0, overflow: 'hidden', background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)' }}>
      <Box sx={{ p: { xs: 2.5, md: 3 }, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' }, gap: 3, alignItems: 'center', minWidth: 0 }}>
        <Stack spacing={2} sx={{ minWidth: 0 }}>
          <PastelChip label={!hasProducts ? 'First step' : productToOpen ? 'Selected product' : 'Portfolio'} accent={appleColors.purple} />
          <Box>
            <Typography variant="h1" sx={{ fontSize: { xs: 30, sm: 36, md: 48 }, letterSpacing: 0, mb: 1, overflowWrap: 'anywhere' }}>
              {headline}
            </Typography>
            {productToOpen && (
              <Typography
                component="p"
                sx={{
                  display: 'inline-flex',
                  maxWidth: '100%',
                  alignItems: 'center',
                  borderRadius: 1.5,
                  bgcolor: '#eaf3ff',
                  color: '#0f172a',
                  px: 1.4,
                  py: 0.85,
                  mb: 1.25,
                  fontSize: { xs: 20, md: 24 },
                  fontWeight: 950,
                  lineHeight: 1.25,
                  overflowWrap: 'anywhere',
                  boxShadow: 'inset 0 0 0 1px rgba(25, 118, 210, 0.16)',
                }}
              >
                {productToOpen.name}
              </Typography>
            )}
            <Typography color="text.secondary" sx={{ maxWidth: 680, fontSize: 17, lineHeight: 1.7 }}>
              {subtitle}
            </Typography>
          </Box>
          {showSingleProductSnapshot && productToOpen && (
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              sx={{ display: { xs: 'flex', lg: 'none' } }}
            >
              <PastelChip label={formatLabel(productToOpen.businessStage)} accent={appleColors.blue} bg="#eaf3ff" />
              <PastelChip label={productToOpen.repositoryUrl ? 'Repo added' : 'Repo not added'} accent={productToOpen.repositoryUrl ? appleColors.green : appleColors.amber} bg={productToOpen.repositoryUrl ? '#e8f7ef' : '#fff7e6'} />
              <PastelChip label={productToOpen.productUrl ? 'Live link added' : 'Live link not added'} accent={productToOpen.productUrl ? appleColors.green : appleColors.amber} bg={productToOpen.productUrl ? '#e8f7ef' : '#fff7e6'} />
            </Stack>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button component={NextLink} href={primaryHref} variant="contained" endIcon={<ArrowForwardOutlined />} sx={{ minHeight: 46 }}>
              {primaryLabel}
            </Button>
            {!hasProducts ? (
              <Button component={NextLink} href="/catalog" variant="outlined" sx={{ minHeight: 46 }}>
                Explore services
              </Button>
            ) : hasMeaningfulDraft ? (
              <Button component={NextLink} href={draftPlanHref} variant="outlined" sx={{ minHeight: 46 }}>
                Review draft plan
              </Button>
            ) : productToOpen ? (
              <Button component={NextLink} href={buildPlanHref} variant="outlined" sx={{ minHeight: 46 }}>
                Build launch plan
              </Button>
            ) : (
              <Button component={NextLink} href="/products/new" variant="outlined" sx={{ minHeight: 46 }}>
                Create product
              </Button>
            )}
          </Stack>
        </Stack>

        <Surface sx={{ boxShadow: '0 18px 60px rgba(98, 92, 255, 0.12)', minWidth: 0 }}>
          {!hasProducts ? (
            <Stack spacing={2}>
              <SectionTitle title="What happens next" action={<Inventory2Outlined sx={{ color: appleColors.purple }} />} />
              <HeroStep index={1} title="Create a product" detail="Add the product name, stage, notes, links, repo, README, or files." />
              <HeroStep index={2} title="Get a launch picture" detail="See readiness, blockers, scanners, and AI opportunities." />
              <HeroStep index={3} title="Plan the work" detail="Choose services only when there is real product context." />
            </Stack>
          ) : showPortfolioPicker ? (
            <Stack spacing={2}>
              <SectionTitle
                title="Portfolio snapshot"
                action={<PastelChip label="No product selected" accent={appleColors.amber} bg="#fff7e6" />}
              />
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                  gap: 1,
                }}
              >
                <PortfolioStat
                  label="Products"
                  value={productCount}
                  detail="Choose where to continue"
                  accent={appleColors.purple}
                  href="/dashboard?focus=products"
                  actionLabel="Open products"
                />
                <PortfolioStat label="Product briefs" value={requirementCount} detail="Saved context" accent={appleColors.cyan} />
                <PortfolioStat
                  label="Workspaces"
                  value={activeWorkspaceCount}
                  detail={`${workspaceCount} total`}
                  accent={appleColors.green}
                  href="/dashboard?focus=workspaces"
                  actionLabel="Open workspaces"
                />
              </Box>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <SectionTitle title={productToOpen ? 'Current product' : 'Your products'} action={<PlaylistAddCheckOutlined sx={{ color: appleColors.purple }} />} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ minWidth: 0 }}>
                <ProgressRing value={clampScore((draftServices * 18) + (draftTalent * 14) + (productToOpen ? 28 : 0))} size={92} color={hasMeaningfulDraft ? appleColors.purple : appleColors.blue} label={hasMeaningfulDraft ? 'plan' : 'next'} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h4" sx={{ overflowWrap: 'anywhere' }}>
                    {hasMeaningfulDraft ? currentDraftTitle : productToOpen ? productToOpen.name : `${productCount} products`}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                    {hasMeaningfulDraft
                      ? `Draft plan saved${draftItemCount ? ` with ${draftItemCount} selected item${draftItemCount === 1 ? '' : 's'}` : ''}.`
                      : productToOpen
                        ? 'No draft plan yet. Start with services when you are ready to shape the work.'
                        : 'Choose a product before reviewing launch readiness, scanners, services, or sharing.'}
                  </Typography>
                </Box>
              </Stack>

              {productToOpen && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {!showSingleProductSnapshot && <PastelChip label={formatLabel(productToOpen.businessStage)} accent={appleColors.blue} bg="#eaf3ff" />}
                  {hasMeaningfulDraft && <PastelChip label={`${draftServices} services`} accent={appleColors.purple} />}
                  {hasMeaningfulDraft && <PastelChip label={`${draftTalent} teams / experts`} accent={appleColors.cyan} bg="#e4f9fd" />}
                  {hasMeaningfulDraft && <PastelChip label={formatLabel(cartStatus || 'DRAFT')} accent={launchpadStatusAccent(cartStatus)} />}
                </Stack>
              )}

              {showSingleProductSnapshot && productToOpen && (
                <Stack spacing={1.5}>
                  {productToOpen.summary && (
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {productToOpen.summary}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <PastelChip label={formatLabel(productToOpen.businessStage)} accent={appleColors.blue} bg="#eaf3ff" />
                    <PastelChip label={productToOpen.repositoryUrl ? 'Repo added' : 'Repo not added'} accent={productToOpen.repositoryUrl ? appleColors.green : appleColors.amber} bg={productToOpen.repositoryUrl ? '#e8f7ef' : '#fff7e6'} />
                    <PastelChip label={productToOpen.productUrl ? 'Live link added' : 'Live link not added'} accent={productToOpen.productUrl ? appleColors.green : appleColors.amber} bg={productToOpen.productUrl ? '#e8f7ef' : '#fff7e6'} />
                  </Stack>
                </Stack>
              )}

              {hasMeaningfulDraft && draftBusinessGoal && (
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {draftBusinessGoal}
                </Typography>
              )}

              {hasMeaningfulDraft && onDeleteDraft && (
                <Box>
                  <Button
                    variant="text"
                    color="error"
                    startIcon={<DeleteOutlineOutlined />}
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={isDeletingDraft}
                    sx={{ minHeight: 42 }}
                  >
                    Delete draft
                  </Button>
                </Box>
              )}
            </Stack>
          )}
        </Surface>
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        BackdropProps={{ sx: { backgroundColor: 'rgba(15, 23, 42, 0.42)', backdropFilter: 'blur(2px)' } }}
        PaperProps={{
          sx: {
            bgcolor: '#ffffff',
            backgroundImage: 'none',
            borderRadius: 3,
            boxShadow: '0 28px 90px rgba(15, 23, 42, 0.28)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 950 }}>Delete draft plan?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
            This removes the selected services, teams, and product link from the current draft plan. Your product profile, scans, findings, and existing workspaces stay unchanged.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeletingDraft}>
            Keep draft
          </Button>
          <Button variant="contained" color="error" onClick={confirmDeleteDraft} disabled={isDeletingDraft}>
            {isDeletingDraft ? 'Deleting...' : 'Delete draft'}
          </Button>
        </DialogActions>
      </Dialog>
    </Surface>
  );
}

function HeroStep({
  index,
  title,
  detail,
}: {
  index: number;
  title: string;
  detail: string;
}) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ minWidth: 0 }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1,
          bgcolor: '#f1efff',
          color: appleColors.purple,
          display: 'grid',
          placeItems: 'center',
          fontSize: 12,
          fontWeight: 950,
          flexShrink: 0,
        }}
      >
        {index}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 950 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.55 }}>
          {detail}
        </Typography>
      </Box>
    </Stack>
  );
}

function PortfolioStat({
  label,
  value,
  detail,
  accent,
  href,
  actionLabel,
}: {
  label: string;
  value: number;
  detail: string;
  accent: string;
  href?: string | undefined;
  actionLabel?: string | undefined;
}) {
  const content = (
    <>
      <Typography sx={{ fontSize: 24, fontWeight: 950, color: appleColors.ink, lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.75, fontWeight: 900 }}>
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.35 }}>
        {detail}
      </Typography>
      {actionLabel && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.9, color: accent, fontWeight: 950 }}>
          {actionLabel}
        </Typography>
      )}
    </>
  );
  const cardSx = {
    p: 1.25,
    borderRadius: 1,
    border: '1px solid',
    borderColor: `${accent}26`,
    bgcolor: `${accent}08`,
    minWidth: 0,
    color: 'inherit',
    textDecoration: 'none',
    transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
    ...(href
      ? {
          cursor: 'pointer',
          '&:hover': {
            borderColor: `${accent}70`,
            boxShadow: `0 12px 26px ${accent}14`,
            transform: 'translateY(-1px)',
          },
          '&:focus-visible': {
            outline: `3px solid ${accent}35`,
            outlineOffset: 2,
          },
        }
      : {}),
  };

  return href ? (
    <Box
      component={NextLink}
      href={href}
      aria-label={actionLabel || label}
      sx={cardSx}
    >
      {content}
    </Box>
  ) : (
    <Box sx={cardSx}>{content}</Box>
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
      <MetricTile label="Planning" value={draftServices + draftTalent} detail={`${draftServices} services, ${draftTalent} talent`} accent={appleColors.cyan} icon={<PlaylistAddCheckOutlined />} sparkline />
      <MetricTile label="Health" value={averageHealth ? `${averageHealth}/100` : 'New'} detail="Service plan confidence" accent={averageHealth >= 70 ? appleColors.green : appleColors.amber} icon={<FactCheckOutlined />} sparkline />
      <MetricTile label="Workspaces" value={activeWorkspaceCount} detail={`${workspaceCount} total`} accent={appleColors.green} icon={<WorkspacesOutlined />} sparkline />
    </Box>
  );
}
