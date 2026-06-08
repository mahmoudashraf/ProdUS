'use client';

import { Box } from '@mui/material';
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
        title="Switch Product"
        description="Choose the product to manage. Once selected, the product workspace shows its action plan, findings, services, and share path."
        action={<ProductPortfolioHeaderActions />}
      />
      <QueryState isLoading={profiles.isLoading || packages.isLoading} error={profiles.error || packages.error} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 330px' },
          gridTemplateAreas: {
            xs: '"decision" "portfolio" "summary"',
            lg: '"portfolio decision" "portfolio summary"',
          },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        <Box
          sx={{
            gridArea: 'portfolio',
            minWidth: 0,
            display: 'grid',
            gap: 2.5,
            gridTemplateAreas: {
              xs: '"list" "metrics"',
              md: '"metrics" "list"',
            },
          }}
        >
          <Box sx={{ gridArea: 'metrics', minWidth: 0 }}>
            <ProductPortfolioMetricsPanel
              productCount={productList.length}
              healthyCount={stats.healthyCount}
              attentionCount={stats.attentionCount}
              inDeliveryCount={stats.inDeliveryCount}
              healthPercent={stats.healthPercent}
            />
          </Box>
          <Box sx={{ gridArea: 'list', minWidth: 0 }}>
            <ProductPortfolioListPanel productList={productList} packageList={packageList} />
          </Box>
        </Box>

        <Box sx={{ gridArea: 'decision', minWidth: 0 }}>
          <ProductPortfolioNextActionPanel productList={productList} packageList={packageList} />
        </Box>

        <Box sx={{ gridArea: 'summary', minWidth: 0 }}>
          <ProductPortfolioAiSummaryPanel
            productCount={productList.length}
            attentionCount={stats.attentionCount}
            healthPercent={stats.healthPercent}
          />
        </Box>
      </Box>
    </>
  );
}
