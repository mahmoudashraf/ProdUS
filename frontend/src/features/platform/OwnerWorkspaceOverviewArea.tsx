'use client';

import type { ComponentProps } from 'react';
import OwnerWorkspaceOverviewPane from './OwnerWorkspaceOverviewPane';
import type { OverviewJourneyView } from './ownerWorkspaceJourneyConfig';
import type { WorkspaceTab } from './ownerWorkspaceModel';
import type { ProductProfile } from './types';

type OverviewPaneProps = ComponentProps<typeof OwnerWorkspaceOverviewPane>;
type DecisionProps = OverviewPaneProps['decision'];
type ShipConfidenceProps = OverviewPaneProps['shipConfidence'];
type LaunchReadinessReportProps = OverviewPaneProps['launchReadinessReport'];
type LaunchReadinessReportValue = Exclude<LaunchReadinessReportProps['report'], undefined>;

interface OwnerWorkspaceOverviewAreaProps {
  detailOpen: boolean;
  launchReadinessReport: LaunchReadinessReportValue;
  launchReadinessReportGenerating: boolean;
  launchReadinessReportLoading: boolean;
  launchStatus: DecisionProps['launchStatus'];
  latestCompletedTools: number;
  onGenerateLaunchReadinessReport: () => void;
  onOpenFindingsEvidence: () => void;
  onOpenFindingsRisks: () => void;
  onOpenServicesPlan: () => void;
  onOpenServicesRecommend: () => void;
  onOpenTimeline: () => void;
  ownerActionGroups: DecisionProps['ownerActionGroups'];
  scannerCoverageGroups: DecisionProps['scannerCoverageGroups'];
  scannerMappedServices: DecisionProps['scannerMappedServices'];
  selectedPackage: DecisionProps['selectedPackage'];
  selectedProduct: ProductProfile | undefined;
  shipConfidenceHistory: ShipConfidenceProps['history'];
  shipConfidenceLoading: boolean;
  topOwnerRisks: DecisionProps['topOwnerRisks'];
  topRecommendedServiceName: string;
  totalScanTools: number;
  view: OverviewJourneyView;
  workspaceTab: WorkspaceTab;
}

export default function OwnerWorkspaceOverviewArea({
  detailOpen,
  launchReadinessReport,
  launchReadinessReportGenerating,
  launchReadinessReportLoading,
  launchStatus,
  latestCompletedTools,
  onGenerateLaunchReadinessReport,
  onOpenFindingsEvidence,
  onOpenFindingsRisks,
  onOpenServicesPlan,
  onOpenServicesRecommend,
  onOpenTimeline,
  ownerActionGroups,
  scannerCoverageGroups,
  scannerMappedServices,
  selectedPackage,
  selectedProduct,
  shipConfidenceHistory,
  shipConfidenceLoading,
  topOwnerRisks,
  topRecommendedServiceName,
  totalScanTools,
  view,
  workspaceTab,
}: OwnerWorkspaceOverviewAreaProps) {
  if (!selectedProduct || workspaceTab !== 'overview') return null;

  return (
    <OwnerWorkspaceOverviewPane
      view={view}
      detailOpen={detailOpen}
      launchCelebration={{
        readinessScore: launchStatus.score,
        blockerCount: launchStatus.blockerCount,
        improvementCount: launchStatus.improvementCount,
        completedChecks: latestCompletedTools,
        totalChecks: totalScanTools,
        isGenerating: launchReadinessReportGenerating,
        onGenerateReport: onGenerateLaunchReadinessReport,
      }}
      decision={{
        launchStatus,
        latestCompletedTools,
        totalScanTools,
        topRecommendedServiceName,
        topOwnerRisks,
        ownerActionGroups,
        scannerCoverageGroups,
        selectedPackage,
        scannerMappedServices,
        onOpenServicesRecommend,
        onOpenServicesPlan,
        onOpenFindingsEvidence,
        onOpenFindingsRisks,
        onOpenTimeline,
      }}
      shipConfidence={{
        history: shipConfidenceHistory,
        isLoading: shipConfidenceLoading,
        title: 'Ship Confidence History',
        subtitle: 'Every diagnosis and scanner map becomes a checkpoint, so this prototype has a visible path from rough edges to ready-to-ship.',
        showScoreRing: false,
      }}
      launchReadinessReport={{
        report: launchReadinessReport,
        isLoading: launchReadinessReportLoading,
        isGenerating: launchReadinessReportGenerating,
        onGenerate: onGenerateLaunchReadinessReport,
        title: 'Launch Readiness Report',
        subtitle: 'Create a shareable snapshot for the next pilot, paid beta, customer demo, or launch decision. This is deterministic and only updates when you generate it.',
      }}
      productAiRefresh={{
        product: selectedProduct,
      }}
      productProfileEdit={{
        product: selectedProduct,
      }}
    />
  );
}
