'use client';

import type { ComponentProps } from 'react';
import { Box } from '@mui/material';
import {
  EmptyState,
  PageHeader,
  QueryState,
} from './PlatformComponents';
import OwnerWorkspaceProductHero from './OwnerWorkspaceProductHero';
import OwnerWorkspaceNavigationPanel from './OwnerWorkspaceNavigationPanel';
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
        description="Selected-product actions only: launch decision, action plan, findings, services, and controlled sharing."
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
  onExportReport,
  onOpenAiOpportunities,
  onProductHome,
  onPrimaryAction,
  onRefreshBrief,
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
  isProductHome: boolean;
  launchStatus: ProductHeroProps['launchStatus'];
  onAreaChange: (tab: WorkspaceTab) => void;
  onAreaHub: (tab: WorkspaceTab) => void;
  onDetailChange: (value: string) => void;
  onExportReport: () => void;
  onOpenAiOpportunities: () => void;
  onProductHome: () => void;
  onPrimaryAction: () => void;
  onRefreshBrief: () => void;
  onViewProof: () => void;
  product?: ProductProfile | undefined;
  topOwnerRisks: ProductHeroProps['topOwnerRisks'];
  workspaceDetailOpen: boolean;
  workspaceTab: WorkspaceTab;
}) {
  const currentDetailText = currentJourneyItems.find((item) => item.value === currentJourneyValue)?.detail;
  const internalTitle = workspaceDetailOpen ? currentDetailLabel : currentAreaLabel;
  const internalDescription = workspaceDetailOpen
    ? currentDetailText
    : `Choose the next ${currentAreaLabel.toLowerCase()} view for ${product?.name || 'this product'}.`;

  return (
    <>
      {product && isProductHome ? (
        <OwnerWorkspaceProductHero
          product={product}
          launchStatus={launchStatus}
          topOwnerRisks={topOwnerRisks}
          evidenceSummaryItems={evidenceSummaryItems}
          onPrimaryAction={onPrimaryAction}
          onRefreshBrief={onRefreshBrief}
          onViewProof={onViewProof}
          onExportReport={onExportReport}
          onOpenAiOpportunities={onOpenAiOpportunities}
          isExporting={Boolean(isExporting)}
        />
      ) : product ? (
        <OwnerWorkspaceInternalPageHeader
          areaLabel={currentAreaLabel}
          detailLabel={internalTitle}
          detailText={internalDescription}
          productName={product.name}
          onBackHome={onProductHome}
        />
      ) : (
        <EmptyState label="Create a product profile to start the owner product workflow." />
      )}

      <OwnerWorkspaceNavigationPanel
        currentAreaLabel={currentAreaLabel}
        currentDetailLabel={currentDetailLabel}
        currentJourneyItems={currentJourneyItems}
        productName={product?.name}
        workspaceDetailOpen={!isProductHome && workspaceDetailOpen}
        workspaceTab={workspaceTab}
        onAreaChange={onAreaChange}
        onAreaHub={onAreaHub}
        onDetailChange={onDetailChange}
      />
    </>
  );
}
