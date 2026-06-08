'use client';

import type { ComponentProps } from 'react';
import { Box, MenuItem, TextField } from '@mui/material';
import {
  EmptyState,
  PageHeader,
  QueryState,
} from './PlatformComponents';
import OwnerWorkspaceProductHero from './OwnerWorkspaceProductHero';
import OwnerWorkspaceNavigationPanel from './OwnerWorkspaceNavigationPanel';
import { OwnerReadinessVerdictReveal } from './OwnerJourneyCards';
import type { JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import type { WorkspaceTab } from './ownerWorkspaceModel';
import type { ProductProfile } from './types';

type ReadinessRevealProps = ComponentProps<typeof OwnerReadinessVerdictReveal>;
type ProductHeroProps = ComponentProps<typeof OwnerWorkspaceProductHero>;

export function OwnerProductizationWorkspaceHeader({
  completedChecks,
  error,
  hasLaunchEvidenceContext,
  isLoading,
  launchStatus,
  onSelectProduct,
  onSeePlan,
  onViewProof,
  productList,
  risks,
  selectedProduct,
  totalChecks,
}: {
  completedChecks: number;
  error: unknown;
  hasLaunchEvidenceContext: boolean;
  isLoading: boolean;
  launchStatus: ReadinessRevealProps['launchStatus'];
  onSelectProduct: (productId: string) => void;
  onSeePlan: () => void;
  onViewProof: () => void;
  productList: ProductProfile[];
  risks: ReadinessRevealProps['risks'];
  selectedProduct?: ProductProfile | undefined;
  totalChecks: number;
}) {
  return (
    <>
      <PageHeader
        title="Productization Workspace"
        description="One product-centered command surface for lifecycle service selection, start plan decisions, team comparison, and delivery evidence."
        action={
          productList.length ? (
            <TextField
              select
              size="small"
              label="Product"
              value={selectedProduct?.id || ''}
              onChange={(event) => onSelectProduct(event.target.value)}
              sx={{ minWidth: { xs: '100%', md: 300 } }}
            >
              {productList.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name}
                </MenuItem>
              ))}
            </TextField>
          ) : null
        }
      />
      <QueryState isLoading={isLoading} error={error} />

      {selectedProduct && hasLaunchEvidenceContext && (
        <Box sx={{ mb: 2.5 }}>
          <OwnerReadinessVerdictReveal
            productName={selectedProduct.name}
            launchStatus={launchStatus}
            risks={risks}
            completedChecks={completedChecks}
            totalChecks={totalChecks}
            onSeePlan={onSeePlan}
            onViewProof={onViewProof}
          />
        </Box>
      )}
    </>
  );
}

export function OwnerProductizationWorkspaceLead({
  currentAreaLabel,
  currentDetailLabel,
  currentJourneyItems,
  currentJourneyValue,
  evidenceSummaryItems,
  isExporting,
  launchStatus,
  onAreaChange,
  onDetailChange,
  onExportReport,
  onPrimaryAction,
  onViewProof,
  product,
  topOwnerRisks,
  workspaceDetailOpen,
  workspaceTab,
}: {
  currentAreaLabel: string;
  currentDetailLabel: string;
  currentJourneyItems: JourneyStepItem<string>[];
  currentJourneyValue: string;
  evidenceSummaryItems: ProductHeroProps['evidenceSummaryItems'];
  isExporting?: boolean | undefined;
  launchStatus: ProductHeroProps['launchStatus'];
  onAreaChange: (tab: WorkspaceTab) => void;
  onDetailChange: (value: string) => void;
  onExportReport: () => void;
  onPrimaryAction: () => void;
  onViewProof: () => void;
  product?: ProductProfile | undefined;
  topOwnerRisks: ProductHeroProps['topOwnerRisks'];
  workspaceDetailOpen: boolean;
  workspaceTab: WorkspaceTab;
}) {
  return (
    <>
      {product ? (
        <OwnerWorkspaceProductHero
          product={product}
          launchStatus={launchStatus}
          topOwnerRisks={topOwnerRisks}
          evidenceSummaryItems={evidenceSummaryItems}
          onPrimaryAction={onPrimaryAction}
          onViewProof={onViewProof}
          onExportReport={onExportReport}
          isExporting={Boolean(isExporting)}
        />
      ) : (
        <EmptyState label="Create a product profile to start the owner productization workflow." />
      )}

      <OwnerWorkspaceNavigationPanel
        currentAreaLabel={currentAreaLabel}
        currentDetailLabel={currentDetailLabel}
        currentJourneyItems={currentJourneyItems}
        currentJourneyValue={currentJourneyValue}
        productName={product?.name}
        workspaceDetailOpen={workspaceDetailOpen}
        workspaceTab={workspaceTab}
        onAreaChange={onAreaChange}
        onDetailChange={onDetailChange}
      />
    </>
  );
}
