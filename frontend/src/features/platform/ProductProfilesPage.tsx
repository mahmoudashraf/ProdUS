'use client';

import { Box, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getJson } from './api';
import { sortProductsForOwner } from './displayOrder';
import {
  PageHeader,
  QueryState,
} from './PlatformComponents';
import {
  ProductPortfolioAiSummaryPanel,
  ProductPortfolioHeaderActions,
  ProductPortfolioListPanel,
  ProductPortfolioMetricsPanel,
  ProductPortfolioNextActionPanel,
} from './ProductProfilesPanels';
import { productPortfolioStats } from './productProfilesModel';
import type { PackageInstance, ProductProfile } from './types';

export default function ProductProfilesPage() {
  const profiles = useQuery({ queryKey: ['products'], queryFn: () => getJson<ProductProfile[]>('/products') });
  const packages = useQuery({ queryKey: ['packages'], queryFn: () => getJson<PackageInstance[]>('/packages') });
  const packageList = packages.data || [];
  const productList = sortProductsForOwner(profiles.data || [], packageList);
  const stats = productPortfolioStats(productList, packageList);

  return (
    <>
      <PageHeader
        title="My Products"
        description="Track each product's launch state, owner action, and delivery path without turning the portfolio into an operations console."
        action={<ProductPortfolioHeaderActions />}
      />
      <QueryState isLoading={profiles.isLoading || packages.isLoading} error={profiles.error || packages.error} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 330px' },
          gridTemplateAreas: {
            xs: '"actions" "portfolio"',
            lg: '"portfolio actions"',
          },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        <Stack spacing={2.5} sx={{ gridArea: 'portfolio', minWidth: 0 }}>
          <ProductPortfolioMetricsPanel
            productCount={productList.length}
            healthyCount={stats.healthyCount}
            attentionCount={stats.attentionCount}
            inDeliveryCount={stats.inDeliveryCount}
            healthPercent={stats.healthPercent}
          />
          <ProductPortfolioListPanel productList={productList} packageList={packageList} />
        </Stack>

        <Stack spacing={2.5} sx={{ gridArea: 'actions', minWidth: 0 }}>
          <ProductPortfolioNextActionPanel />
          <ProductPortfolioAiSummaryPanel
            productCount={productList.length}
            attentionCount={stats.attentionCount}
            healthPercent={stats.healthPercent}
          />
        </Stack>
      </Box>
    </>
  );
}
