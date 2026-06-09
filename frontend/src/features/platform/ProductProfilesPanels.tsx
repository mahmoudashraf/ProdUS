'use client';

import { useState } from 'react';
import NextLink from 'next/link';
import {
  AddOutlined,
  ArrowForwardOutlined,
  FavoriteBorderOutlined,
  Inventory2Outlined,
  LocalShippingOutlined,
  SearchOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { Box, Button, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import {
  EmptyState,
  MetricTile,
  PastelChip,
  ProgressRing,
  SectionTitle,
  Surface,
  appleColors,
  clampScore,
} from './PlatformComponents';
import ProductPortfolioProductRow from './ProductPortfolioProductRow';
import { productReadinessTone, productScore } from './productProfilesModel';
import type { PackageInstance, ProductProfile } from './types';

export function ProductPortfolioHeaderActions() {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
      <Button component={NextLink} href="/products/new" variant="contained" startIcon={<AddOutlined />} sx={{ minHeight: 42, minWidth: 140 }}>
        Create product
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
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const matchingProducts = normalizedQuery
    ? productList.filter((product) =>
        [
          product.name,
          product.summary,
          product.businessStage,
          product.riskProfile,
        ].some((value) => (value || '').toLowerCase().includes(normalizedQuery))
      )
    : productList;
  const visibleLimit = normalizedQuery ? 8 : 4;
  const visibleProducts = matchingProducts.slice(0, visibleLimit);
  const hiddenCount = Math.max(0, matchingProducts.length - visibleProducts.length);

  return (
    <Surface>
      <SectionTitle title="Products" action={<PastelChip label={`${productList.length} tracked`} accent={appleColors.purple} />} />
      {productList.length ? (
        <Stack spacing={1.5}>
          <TextField
            size="small"
            fullWidth
            label="Search products"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Stack spacing={0}>
            {visibleProducts.map((profile, index) => (
              <ProductPortfolioProductRow
                key={profile.id}
                profile={profile}
                packageList={packageList}
                index={index}
              />
            ))}
          </Stack>
          {visibleProducts.length ? (
            <Box sx={{ p: 1.25, border: '1px dashed', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fbfdff' }}>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                {hiddenCount
                  ? `Showing ${visibleProducts.length} ${normalizedQuery ? 'matching' : 'highest-priority'} products. ${hiddenCount} more ${normalizedQuery ? 'matches are hidden; refine the search to narrow them' : 'products are available through search'}.`
                  : normalizedQuery
                    ? `Showing all ${visibleProducts.length} matching products.`
                    : 'Showing the highest-priority products first.'}
              </Typography>
            </Box>
          ) : (
            <EmptyState label="No products match that search." />
          )}
        </Stack>
      ) : (
        <EmptyState label="Create a product profile to start the productization journey." />
      )}
    </Surface>
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
  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8f7ff)' }}>
      <SectionTitle title="Suggested Product" action={<PastelChip label={tone.label} accent={tone.color} bg={`${tone.color}14`} />} />
      <Typography variant="h4" sx={{ overflowWrap: 'anywhere' }}>
        {selectedProduct.name}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
        {score < 65
          ? 'This product needs the next owner decision first. Open Product Home to see the launch verdict, action plan, findings, services, and share route.'
          : 'Open Product Home to continue from the selected workspace. Use this page only when you want to switch products.'}
      </Typography>
      <Stack spacing={1.25} sx={{ mt: 2 }}>
        <Button component={NextLink} href={`/products/${selectedProduct.id}`} variant="contained" endIcon={<ArrowForwardOutlined />} sx={{ minHeight: 44 }}>
          Open Product Home
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
