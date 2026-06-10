import { appleColors } from './PlatformComponents';
import type { OwnerFindingGroup } from './OwnerFindingsRiskPanel';
import type { VerdictRisk } from './OwnerJourneyCards';
import type { OwnerServiceRiskSummary } from './OwnerServicesRecommendationPanel';
import {
  ownerActionForCategory,
  ownerCategoryFromSignal,
  ownerImpactForCategory,
  ownerProofLine,
  scannerEvidenceCategories,
  severityWeight,
  type OwnerLaunchStatus,
} from './ownerWorkspaceModel';
import type { ScanToolOption } from './scannerProofOperationsTypes';
import type {
  NormalizedFinding,
  PackageInstance,
  ProductDiagnosis,
  ProductProfile,
  ProductScannerSummary,
  ProjectWorkspace,
  RepoSignal,
  RepoSignalSummary,
  ScanSource,
  ScannerEvidenceItem,
  ScannerSummaryCounts,
  ScannerToolCoverage,
} from './types';

export interface OwnerWorkspaceRisk {
  id: string;
  title: string;
  severity?: string | undefined;
  status?: string | undefined;
  description?: string | undefined;
  businessRisk?: string | undefined;
  readinessArea?: string | undefined;
  evidenceRequired?: string | undefined;
  recommendedModuleName?: string | undefined;
  sourceTool?: string | undefined;
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

type EvidenceReadme = RepoSignal | ScannerEvidenceItem | undefined;

const proofLineForRisk = (risk: OwnerWorkspaceRisk, category: string) => ownerProofLine({
  category,
  ...(risk.sourceTool ? { sourceTool: risk.sourceTool } : {}),
  ...(risk.sourceRuleId ? { sourceRuleId: risk.sourceRuleId } : {}),
});

const documentationEvidenceLabel = (evidence: EvidenceReadme) => {
  if (!evidence) return 'No README evidence shown';
  if ('signalValue' in evidence) {
    return evidence.signalValue === 'Documentation evidence'
      ? 'README or documentation evidence found'
      : evidence.signalValue;
  }
  return evidence.title || 'README or documentation evidence found';
};

export const buildTopOwnerRisks = ({
  scannerMappedFindings,
  scannerOpenFindings,
}: {
  scannerMappedFindings: ProductDiagnosis['findings'];
  scannerOpenFindings: NormalizedFinding[];
}) => {
  const ownerRiskPool: OwnerWorkspaceRisk[] = [
    ...scannerMappedFindings.map((finding) => ({
      id: finding.id,
      title: finding.title,
      severity: finding.severity,
      status: finding.status,
      description: finding.description,
      businessRisk: finding.businessRisk,
      readinessArea: finding.readinessArea,
      evidenceRequired: finding.evidenceRequired,
      recommendedModuleName: finding.recommendedModuleName,
      sourceTool: finding.sourceSignal || finding.mappingSource || 'Scanner readiness map',
      sourceRuleId: finding.normalizedFindingId,
    })),
    ...scannerOpenFindings.map((finding) => ({
      id: finding.id,
      title: finding.title,
      severity: finding.severity,
      status: finding.status,
      description: finding.description,
      businessRisk: finding.businessRisk,
      readinessArea: finding.readinessArea,
      evidenceRequired: finding.evidenceRequired,
      recommendedModuleName: finding.recommendedModule?.name,
      sourceTool: finding.sourceTool,
      sourceRuleId: finding.sourceRuleId,
    })),
  ];
  const ownerRiskMap = new Map<string, OwnerWorkspaceRisk>();
  ownerRiskPool.forEach((risk) => {
    const key = `${risk.title}-${risk.sourceTool || ''}`.toLowerCase();
    if (!ownerRiskMap.has(key) || severityWeight(risk.severity) > severityWeight(ownerRiskMap.get(key)?.severity)) {
      ownerRiskMap.set(key, risk);
    }
  });
  return Array.from(ownerRiskMap.values())
    .sort((left, right) => {
      const severityDelta = severityWeight(right.severity) - severityWeight(left.severity);
      if (severityDelta !== 0) return severityDelta;
      const leftRuntime = ownerCategoryFromSignal(left.sourceTool, left.readinessArea, left.title) === 'Runtime baseline' ? 1 : 0;
      const rightRuntime = ownerCategoryFromSignal(right.sourceTool, right.readinessArea, right.title) === 'Runtime baseline' ? 1 : 0;
      return rightRuntime - leftRuntime;
    })
    .slice(0, 5);
};

export const buildVerdictRisks = (topOwnerRisks: OwnerWorkspaceRisk[]): VerdictRisk[] =>
  topOwnerRisks.slice(0, 2).map((risk) => {
    const category = ownerCategoryFromSignal(risk.sourceTool, risk.readinessArea, risk.title);
    return {
      id: risk.id,
      title: risk.title,
      impact: risk.businessRisk || ownerImpactForCategory(category),
      evidence: proofLineForRisk(risk, category),
    };
  });

export const buildScannerCoverageGroups = ({
  scannerToolCoverage,
  scanToolOptions,
}: {
  scannerToolCoverage: ScannerToolCoverage[];
  scanToolOptions: readonly ScanToolOption[];
}) =>
  scannerEvidenceCategories.map((category) => {
    const tools = category.tools.map((toolKey) => scannerToolCoverage.find((tool) => tool.toolKey === toolKey)).filter(Boolean) as ScannerToolCoverage[];
    const completed = tools.filter((tool) => tool.latestStatus === 'COMPLETED').length;
    const latest = tools.filter((tool) => !!tool.latestStatus).length;
    const normalizedCount = tools.reduce((total, tool) => total + (tool.normalizedCount || 0), 0);
    const mappedFindingCount = tools.reduce((total, tool) => total + (tool.mappedFindingCount || 0), 0);
    const hasFailure = tools.some((tool) => tool.latestStatus === 'FAILED' || !tool.executableAvailable);
    return {
      ...category,
      tools,
      expectedLabels: category.tools.map((toolKey) => scanToolOptions.find((tool) => tool.key === toolKey)?.label || toolKey),
      completed,
      latest,
      normalizedCount,
      mappedFindingCount,
      status: hasFailure ? 'Needs attention' : completed === category.tools.length ? 'Completed' : latest ? 'Partial' : 'Waiting',
      accent: hasFailure ? appleColors.red : completed === category.tools.length ? appleColors.green : latest ? appleColors.amber : appleColors.muted,
    };
  });

export const buildEvidenceSummary = ({
  repoSignals,
  scannerSummary,
  selectedProduct,
  hostedRuntimeTarget,
  latestCompletedTools,
  totalTools,
}: {
  repoSignals?: RepoSignalSummary | undefined;
  scannerSummary?: ProductScannerSummary | undefined;
  selectedProduct?: ProductProfile | undefined;
  hostedRuntimeTarget?: string | undefined;
  latestCompletedTools: number;
  totalTools: number;
}) => {
  const evidenceReadme: EvidenceReadme = (repoSignals?.signals || []).find((signal) => signal.signalType === 'DOCUMENTATION')
    || (scannerSummary?.evidence || []).find((item) => /readme|documentation/i.test(`${item.title} ${item.summary || ''}`));
  const primarySource = scannerSummary?.sources[0];
  const runtimeTarget = hostedRuntimeTarget || selectedProduct?.productUrl || scannerSummary?.sources.find((source) => source.providerType === 'RUNTIME_URL')?.externalReference || '';
  const evidenceSummaryItems = [
    { label: 'Repository', value: selectedProduct?.repositoryUrl || primarySource?.externalReference || 'Not connected', accent: selectedProduct?.repositoryUrl || primarySource ? appleColors.green : appleColors.amber },
    { label: 'Document', value: documentationEvidenceLabel(evidenceReadme), accent: evidenceReadme ? appleColors.green : appleColors.amber },
    { label: 'Runtime', value: runtimeTarget || 'Runtime URL missing', accent: runtimeTarget ? appleColors.green : appleColors.amber },
    { label: 'Scanner suite', value: `${latestCompletedTools}/${totalTools} checks completed`, accent: latestCompletedTools === totalTools ? appleColors.green : latestCompletedTools ? appleColors.amber : appleColors.muted },
  ];
  return { evidenceReadme, primarySource, runtimeTarget, evidenceSummaryItems };
};

export const buildServiceRiskItems = ({
  topOwnerRisks,
  topRecommendedServiceName,
}: {
  topOwnerRisks: OwnerWorkspaceRisk[];
  topRecommendedServiceName: string;
}): OwnerServiceRiskSummary[] =>
  topOwnerRisks.slice(0, 3).map((risk, index) => {
    const category = ownerCategoryFromSignal(risk.sourceTool, risk.readinessArea, risk.title);
    return {
      id: risk.id,
      title: risk.title,
      impact: risk.businessRisk || ownerImpactForCategory(category),
      proof: proofLineForRisk(risk, category),
      service: risk.recommendedModuleName || (index === 0 ? topRecommendedServiceName : undefined),
    };
  });

export const buildOwnerActionGroups = ({
  topOwnerRisks,
  weekItems,
  topRecommendedServiceName,
  latestCompletedTools,
  totalTools,
  evidenceCount,
}: {
  topOwnerRisks: OwnerWorkspaceRisk[];
  weekItems: string[];
  topRecommendedServiceName: string;
  latestCompletedTools: number;
  totalTools: number;
  evidenceCount: number;
}): OwnerActionGroup[] => [
  {
    label: 'Do now',
    accent: appleColors.red,
    items: topOwnerRisks.slice(0, 3).map((risk, index) => {
      const category = ownerCategoryFromSignal(risk.sourceTool, risk.readinessArea, risk.title);
      return {
        title: risk.title,
        detail: ownerImpactForCategory(category),
        action: index === 0 && topRecommendedServiceName
          ? `${ownerActionForCategory(category)} Use ${topRecommendedServiceName} as the owner-visible fix path.`
          : ownerActionForCategory(category),
        proof: proofLineForRisk(risk, category),
        service: index === 0 ? topRecommendedServiceName : '',
      };
    }),
  },
  {
    label: 'Schedule this week',
    accent: appleColors.purple,
    items: weekItems.slice(0, 3).map((item) => ({
      title: String(item),
      detail: 'Turn this into planned product work with a clear owner.',
      action: 'Add or confirm the service in the product plan.',
    })),
  },
  {
    label: 'Monitor',
    accent: appleColors.cyan,
    items: [
      {
        title: 'Rerun the full evidence check after fixes',
        detail: `${latestCompletedTools}/${totalTools} checks currently have completed results.`,
        action: 'Use Findings technical proof to rerun the full suite after remediation.',
      },
      {
        title: 'Export owner proof before sharing externally',
        detail: `${evidenceCount} evidence item${evidenceCount === 1 ? '' : 's'} available for the report.`,
        action: 'Use Findings proof to export stored evidence.',
      },
    ],
  },
];

export const buildGroupedFindings = ({
  scannerFindings,
  topOwnerRisks,
  launchStatus,
}: {
  scannerFindings: NormalizedFinding[];
  topOwnerRisks: OwnerWorkspaceRisk[];
  launchStatus: OwnerLaunchStatus;
}): OwnerFindingGroup[] => {
  const rawLaunchBlockerFindings = scannerFindings.filter((finding) =>
    ['CRITICAL', 'HIGH'].includes(finding.severity) && ['NEW', 'OPEN', 'REGRESSED'].includes(finding.status)
  );
  const ownerLaunchBlockerFindings = launchStatus.blockerCount > 0
    ? topOwnerRisks.slice(0, Math.max(1, launchStatus.blockerCount))
    : rawLaunchBlockerFindings;
  const ownerLaunchBlockerIds = new Set(ownerLaunchBlockerFindings.map((finding) => finding.id));
  return [
    {
      label: 'Launch blockers',
      findings: ownerLaunchBlockerFindings,
      accent: appleColors.red,
    },
    {
      label: 'High-priority technical risks',
      findings: scannerFindings.filter((finding) => !ownerLaunchBlockerIds.has(finding.id) && finding.severity === 'MEDIUM' && ['NEW', 'OPEN', 'REGRESSED', 'INSUFFICIENT_EVIDENCE'].includes(finding.status)),
      accent: appleColors.amber,
    },
    {
      label: 'Medium-priority improvements',
      findings: scannerFindings.filter((finding) => ['LOW', 'INFO'].includes(finding.severity) && ['NEW', 'OPEN', 'REGRESSED', 'INSUFFICIENT_EVIDENCE'].includes(finding.status)),
      accent: appleColors.blue,
    },
    {
      label: 'Resolved or accepted',
      findings: scannerFindings.filter((finding) => ['RESOLVED', 'ACCEPTED_RISK', 'FALSE_POSITIVE'].includes(finding.status)),
      accent: appleColors.green,
    },
  ];
};

export const buildWorkspaceTimeline = ({
  selectedProduct,
  primarySource,
  evidenceReadme,
  latestCompletedTools,
  totalTools,
  scannerCounts,
  latestMappedToolFindings,
  selectedPackage,
  selectedWorkspace,
  formatDateTime,
}: {
  selectedProduct?: ProductProfile | undefined;
  primarySource?: ScanSource | undefined;
  evidenceReadme?: EvidenceReadme;
  latestCompletedTools: number;
  totalTools: number;
  scannerCounts?: ScannerSummaryCounts | undefined;
  latestMappedToolFindings: number;
  selectedPackage?: PackageInstance | undefined;
  selectedWorkspace?: ProjectWorkspace | undefined;
  formatDateTime: (value?: string) => string;
}) => [
  { label: 'Product created', status: selectedProduct ? 'Done' : 'Waiting', detail: selectedProduct?.createdAt ? formatDateTime(selectedProduct.createdAt) : selectedProduct?.name || 'Select a product', accent: selectedProduct ? appleColors.green : appleColors.muted },
  { label: 'Repository authorized', status: selectedProduct?.repositoryUrl || primarySource ? 'Done' : 'Needed', detail: selectedProduct?.repositoryUrl || primarySource?.displayName || 'Add repository evidence', accent: selectedProduct?.repositoryUrl || primarySource ? appleColors.green : appleColors.amber },
  { label: 'README attached', status: evidenceReadme ? 'Found' : 'Needed', detail: evidenceReadme ? ('title' in evidenceReadme ? evidenceReadme.title : evidenceReadme.signalValue) : 'Attach documentation evidence', accent: evidenceReadme ? appleColors.green : appleColors.amber },
  { label: 'Scanner suite completed', status: latestCompletedTools === totalTools ? 'Done' : 'Partial', detail: `${latestCompletedTools}/${totalTools} checks completed`, accent: latestCompletedTools === totalTools ? appleColors.green : appleColors.amber },
  { label: 'Findings normalized', status: scannerCounts?.total ? 'Done' : 'Waiting', detail: `${scannerCounts?.total || 0} findings`, accent: scannerCounts?.total ? appleColors.green : appleColors.muted },
  { label: 'Findings mapped', status: latestMappedToolFindings ? 'Done' : 'Needed', detail: `${latestMappedToolFindings} mapped to readiness`, accent: latestMappedToolFindings ? appleColors.green : appleColors.amber },
  { label: 'Service plan', status: selectedPackage ? 'Created' : 'Needed', detail: selectedPackage?.name || 'Create or confirm plan', accent: selectedPackage ? appleColors.green : appleColors.amber },
  { label: 'Workspace', status: selectedWorkspace ? 'Created' : 'Pending', detail: selectedWorkspace?.name || 'Start once plan is ready', accent: selectedWorkspace ? appleColors.green : appleColors.muted },
];
