'use client';

import NextLink from 'next/link';
import {
  AddOutlined,
  ArrowForwardOutlined,
  BuildCircleOutlined,
  FavoriteBorderOutlined,
  Inventory2Outlined,
  LocalShippingOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  DotLabel,
  EmptyState,
  MetricTile,
  PastelChip,
  ProgressRing,
  SectionTitle,
  Surface,
  appleColors,
  categoryPalette,
  clampScore,
  formatLabel,
} from './PlatformComponents';
import { productReadinessTone, productScore } from './productProfilesModel';
import type { PackageInstance, ProductProfile } from './types';

export function ProductPortfolioHeaderActions() {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
      <Button component={NextLink} href="/products/new" variant="contained" startIcon={<AddOutlined />} sx={{ minHeight: 42, minWidth: 140 }}>
        New product
      </Button>
    </Stack>
  );
}

export function ProductPortfolioMetricsPanel({
  productCount,
  healthyCount,
  attentionCount,
  inDeliveryCount,
  healthPercent,
}: {
  productCount: number;
  healthyCount: number;
  attentionCount: number;
  inDeliveryCount: number;
  healthPercent: number;
}) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
      <MetricTile label="Products" value={productCount} detail="Tracked for launch readiness" accent={appleColors.purple} icon={<Inventory2Outlined />} sparkline />
      <MetricTile label="On track" value={healthyCount} detail={`${healthPercent}% of portfolio`} accent={appleColors.green} icon={<FavoriteBorderOutlined />} sparkline />
      <MetricTile label="Owner action" value={attentionCount} detail="Need a decision or service path" accent={appleColors.amber} icon={<WarningAmberOutlined />} sparkline />
      <MetricTile label="In delivery" value={inDeliveryCount} detail="Active workspaces" accent={appleColors.blue} icon={<LocalShippingOutlined />} sparkline />
    </Box>
  );
}

export function ProductPortfolioListPanel({
  productList,
  packageList,
}: {
  productList: ProductProfile[];
  packageList: PackageInstance[];
}) {
  return (
    <Surface>
      <SectionTitle title="Products" action={<PastelChip label={`${productList.length} tracked`} accent={appleColors.purple} />} />
      {productList.length ? (
        <Stack spacing={0}>
          {productList.map((profile, index) => (
            <ProductPortfolioProductRow
              key={profile.id}
              profile={profile}
              packageList={packageList}
              index={index}
            />
          ))}
        </Stack>
      ) : (
        <EmptyState label="Create a product profile to start the productization journey." />
      )}
    </Surface>
  );
}

function ProductPortfolioProductRow({
  profile,
  packageList,
  index,
}: {
  profile: ProductProfile;
  packageList: PackageInstance[];
  index: number;
}) {
  const score = clampScore(productScore(profile, packageList));
  const tone = productReadinessTone(score);
  const packageInstance = packageList.find((item) => item.productProfile?.id === profile.id);
  const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', xl: '1.55fr 120px 130px 1.25fr 1fr minmax(150px, auto)' },
        gap: 2,
        alignItems: 'center',
        py: 2,
        borderTop: index === 0 ? 0 : '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 1,
            bgcolor: palette.bg,
            color: palette.accent,
            display: 'grid',
            placeItems: 'center',
            fontWeight: 900,
            flex: '0 0 auto',
          }}
        >
          {profile.name.charAt(0)}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>{profile.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
            {profile.summary || 'No summary yet.'}
          </Typography>
        </Box>
      </Stack>
      <PastelChip label={formatLabel(profile.businessStage)} accent={palette.accent} bg={palette.bg} />
      <ProgressRing value={score} color={tone.color} size={68} />
      <Box>
        <DotLabel label={tone.label} color={tone.color} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {profile.riskProfile || 'No launch risk profile recorded yet.'}
        </Typography>
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 800 }}>{packageInstance?.name || 'No start plan yet'}</Typography>
        <Typography variant="body2" color="text.secondary">
          {packageInstance ? formatLabel(packageInstance.status) : 'Choose services when ready'}
        </Typography>
      </Box>
      <Stack spacing={0.75} alignItems={{ xs: 'stretch', xl: 'flex-end' }}>
        <Button component={NextLink} href={`/products/${profile.id}`} variant="contained" endIcon={<ArrowForwardOutlined />} sx={{ minHeight: 38 }}>
          Select product
        </Button>
        <Button component={NextLink} href={`/services?productId=${profile.id}`} variant="outlined" startIcon={<BuildCircleOutlined />} sx={{ minHeight: 36 }}>
          Plan services
        </Button>
      </Stack>
    </Box>
  );
}

export function ProductPortfolioNextActionPanel({
  productList,
  packageList,
}: {
  productList: ProductProfile[];
  packageList: PackageInstance[];
}) {
  const selectedProduct = productList.find((profile) => productScore(profile, packageList) < 65) || productList[0];
  if (!selectedProduct) {
    return (
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8f7ff)' }}>
        <SectionTitle title="First Product" action={<AddOutlined sx={{ color: appleColors.purple }} />} />
        <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
          Create the product profile first. Services, teams, findings, and share links become product-specific after that choice.
        </Typography>
        <Button component={NextLink} href="/products/new" variant="contained" startIcon={<AddOutlined />} sx={{ mt: 2, minHeight: 44 }}>
          Create product
        </Button>
      </Surface>
    );
  }

  const score = clampScore(productScore(selectedProduct, packageList));
  const tone = productReadinessTone(score);
  const packageInstance = packageList.find((item) => item.productProfile?.id === selectedProduct.id);

  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8f7ff)' }}>
      <SectionTitle title="Product To Open" action={<PastelChip label={tone.label} accent={tone.color} bg={`${tone.color}14`} />} />
      <Typography variant="h4" sx={{ overflowWrap: 'anywhere' }}>
        {selectedProduct.name}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
        {score < 65
          ? 'This product needs the next owner decision first. Open it to see the action plan, findings, services, and share route in one selected workspace.'
          : 'Open this product to continue from its selected workspace instead of choosing services from a generic catalog view.'}
      </Typography>
      <Stack spacing={1.25} sx={{ mt: 2 }}>
        <Button component={NextLink} href={`/products/${selectedProduct.id}`} variant="contained" endIcon={<ArrowForwardOutlined />} sx={{ minHeight: 44 }}>
          Select product
        </Button>
        <Button component={NextLink} href={`/services?productId=${selectedProduct.id}`} variant="outlined" startIcon={<BuildCircleOutlined />} sx={{ minHeight: 42 }}>
          {packageInstance ? 'Review services' : 'Plan services'}
        </Button>
      </Stack>
    </Surface>
  );
}

export function ProductPortfolioAiSummaryPanel({
  productCount,
  attentionCount,
  healthPercent,
}: {
  productCount: number;
  attentionCount: number;
  healthPercent: number;
}) {
  const hasProducts = productCount > 0;
  const needsReview = attentionCount > 0;
  const headline = !hasProducts
    ? 'Ready for first product'
    : needsReview
      ? 'Owner action queue is visible'
      : 'Portfolio health is visible';
  const status = !hasProducts
    ? 'Create context first'
    : needsReview
      ? `${attentionCount} need review`
      : `${healthPercent}% on track`;

  return (
    <Surface>
      <SectionTitle title="Portfolio Summary" />
      <Stack direction="row" spacing={2} alignItems="center">
        <ProgressRing
          value={productCount ? healthPercent : 68}
          color={appleColors.purple}
          size={92}
        />
        <Box>
          <Typography variant="h4">{headline}</Typography>
          <Typography color={needsReview ? 'warning.main' : productCount ? 'success.main' : 'text.secondary'} sx={{ fontWeight: 800 }}>
            {status}
          </Typography>
        </Box>
      </Stack>
      <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.7 }}>
        Keep launch blockers, service choices, and workspace proof attached to each product so the owner always sees the next decision.
      </Typography>
    </Surface>
  );
}
