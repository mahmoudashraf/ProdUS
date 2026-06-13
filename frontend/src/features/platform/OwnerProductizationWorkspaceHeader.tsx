'use client';

import type { ComponentProps } from 'react';
import { Box } from '@mui/material';
import {
  EmptyState,
  PageHeader,
  QueryState,
} from './PlatformComponents';
import OwnerWorkspaceProductHero from './OwnerWorkspaceProductHero';
import OwnerWorkspaceNavigationPanel, { ProductAreaNavigation } from './OwnerWorkspaceNavigationPanel';
import OwnerWorkspaceInternalPageHeader from './OwnerWorkspaceInternalPageHeader';
import OwnerWorkspaceSelectedProductBar from './OwnerWorkspaceSelectedProductBar';
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
  onSeePlan,
  onViewProof,
  risks,
  selectedProduct,
  showReadinessReveal,
  totalChecks,
}: {
  completedChecks: number;
  error: unknown;
  hasLaunchEvidenceContext: boolean;
  isLoading: boolean;
  launchStatus: ReadinessRevealProps['launchStatus'];
  onSeePlan: () => void;
  onViewProof: () => void;
  risks: ReadinessRevealProps['risks'];
  selectedProduct?: ProductProfile | undefined;
  showReadinessReveal: boolean;
  totalChecks: number;
}) {
  return (
    <>
      <PageHeader
        title="Product Workspace"
        description="Selected-product actions only: launch decision, action plan, scanners, services, and controlled sharing."
      />
      <QueryState isLoading={isLoading} error={error} />

      {selectedProduct && <OwnerWorkspaceSelectedProductBar product={selectedProduct} />}

      {selectedProduct && showReadinessReveal && hasLaunchEvidenceContext && (
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
  isProductHome,
  launchStatus,
  onAreaChange,
  onAreaHub,
  onDetailChange,
  onEditProfile,
  onExportReport,
  onOpenAiOpportunities,
  onPrimaryAction,
  onRefreshBrief,
  onViewProof,
  product,
  scannerProofSummary,
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
  isProductHome: boolean;
  launchStatus: ProductHeroProps['launchStatus'];
  onAreaChange: (tab: WorkspaceTab) => void;
  onAreaHub: (tab: WorkspaceTab) => void;
  onDetailChange: (value: string) => void;
  onEditProfile: () => void;
  onExportReport: () => void;
  onOpenAiOpportunities: () => void;
  onPrimaryAction: () => void;
  onRefreshBrief: () => void;
  onViewProof: () => void;
  product?: ProductProfile | undefined;
  scannerProofSummary: ProductHeroProps['scannerProofSummary'];
  topOwnerRisks: ProductHeroProps['topOwnerRisks'];
  workspaceDetailOpen: boolean;
  workspaceTab: WorkspaceTab;
}) {
  const currentDetailText = currentJourneyItems.find((item) => item.value === currentJourneyValue)?.detail;
  const internalTitle = workspaceDetailOpen ? currentDetailLabel : currentAreaLabel;
  const internalDescription = workspaceDetailOpen
    ? currentDetailText
    : `Choose the next ${currentAreaLabel.toLowerCase()} view for ${product?.name || 'this product'}.`;
  const showGenericInternalHeader = workspaceTab !== 'workspaces';
  const areaNavigation = (
    <ProductAreaNavigation
      label={isProductHome ? 'More product areas' : 'Product navigation'}
      variant={isProductHome ? 'inline' : 'surface'}
      workspaceTab={workspaceTab}
      onAreaChange={onAreaChange}
    />
  );

  return (
    <>
      {!isProductHome && areaNavigation}

      {product && isProductHome ? (
        <OwnerWorkspaceProductHero
          product={product}
          launchStatus={launchStatus}
          topOwnerRisks={topOwnerRisks}
          evidenceSummaryItems={evidenceSummaryItems}
          scannerProofSummary={scannerProofSummary}
          onPrimaryAction={onPrimaryAction}
          onEditProfile={onEditProfile}
          onRefreshBrief={onRefreshBrief}
          onViewProof={onViewProof}
          onExportReport={onExportReport}
          onOpenAiOpportunities={onOpenAiOpportunities}
          navigationSlot={areaNavigation}
          isExporting={Boolean(isExporting)}
        />
      ) : product && showGenericInternalHeader ? (
        <OwnerWorkspaceInternalPageHeader
          areaLabel={currentAreaLabel}
          detailLabel={internalTitle}
          detailText={internalDescription}
          productName={product.name}
        />
      ) : !product ? (
        <EmptyState label="Create a product profile to start the owner product workflow." />
      ) : (
        null
      )}

      <OwnerWorkspaceNavigationPanel
        currentAreaLabel={currentAreaLabel}
        currentDetailLabel={currentDetailLabel}
        currentJourneyItems={currentJourneyItems}
        productName={product?.name}
        showProductAreaNavigation={false}
        workspaceDetailOpen={!isProductHome && workspaceDetailOpen}
        workspaceTab={workspaceTab}
        onAreaChange={onAreaChange}
        onAreaHub={onAreaHub}
        onDetailChange={onDetailChange}
      />
    </>
  );
}
