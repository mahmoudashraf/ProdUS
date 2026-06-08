'use client';

import type { OwnerLaunchStatus } from './ownerWorkspaceModel';
import type { PackageInstance, ScannerToolCoverage } from './types';

export interface OwnerDecisionRisk {
  id: string;
  title: string;
  severity?: string | undefined;
  businessRisk?: string | null | undefined;
  readinessArea?: string | null | undefined;
  sourceTool?: string | null | undefined;
  sourceRuleId?: string | null | undefined;
}

export interface OwnerActionGroup {
  label: string;
  accent: string;
  items: {
    title: string;
    detail: string;
    action: string;
    proof?: string;
    service?: string;
  }[];
}

export interface OwnerDecisionScannerCoverageGroup {
  key: string;
  label: string;
  tools: ScannerToolCoverage[];
  expectedLabels: string[];
  normalizedCount: number;
  mappedFindingCount: number;
  status: string;
  accent: string;
}

export interface OwnerOverviewDecisionPanelProps {
  launchStatus: OwnerLaunchStatus;
  latestCompletedTools: number;
  totalScanTools: number;
  topRecommendedServiceName: string;
  topOwnerRisks: OwnerDecisionRisk[];
  ownerActionGroups: OwnerActionGroup[];
  scannerCoverageGroups: OwnerDecisionScannerCoverageGroup[];
  selectedPackage: PackageInstance | undefined;
  scannerMappedServices: string[];
  onOpenServicesRecommend: () => void;
  onOpenServicesPlan: () => void;
  onOpenFindingsEvidence: () => void;
  onOpenFindingsRisks: () => void;
  onOpenTimeline: () => void;
}
