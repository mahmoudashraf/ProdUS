import { formatLabel } from './PlatformComponents';
import {
  productHealth,
  scanToolOptions,
  shortDateTime,
} from './ownerProductizationWorkspaceConfig';
import { buildOwnerWorkspaceStartPlanState } from './ownerWorkspaceStartPlanState';
import { buildOwnerLaunchStatus } from './ownerWorkspaceModel';
import {
  buildEvidenceSummary,
  buildGroupedFindings,
  buildOwnerActionGroups,
  buildScannerCoverageGroups,
  buildServiceRiskItems,
  buildTopOwnerRisks,
  buildVerdictRisks,
  buildWorkspaceTimeline,
} from './ownerWorkspaceDerivedState';
import type {
  ExpertProfile,
  LaunchReadinessReport,
  Milestone,
  PackageInstance,
  PackageModule,
  ProductDiagnosis,
  ProductProfile,
  ProductScannerSummary,
  ProductizationCart,
  ProjectWorkspace,
  QuoteProposal,
  RepoSignalSummary,
  RequirementIntake,
  ScannerEvidenceItem,
  SupportRequest,
  Team,
  TeamShortlist,
} from './types';

interface OwnerWorkspaceViewModelInput {
  cart: ProductizationCart | undefined;
  diagnoses: ProductDiagnosis[];
  experts: ExpertProfile[];
  filteredScannerEvidence: ScannerEvidenceItem[];
  hostedRuntimeTarget: string;
  launchReadinessReport: LaunchReadinessReport | null | undefined;
  milestones: Milestone[];
  packageModules: PackageModule[] | undefined;
  pendingRequirementId: string;
  proposals: QuoteProposal[];
  repoSignals: RepoSignalSummary | undefined;
  scannerSummary: ProductScannerSummary | undefined;
  selectedPackage: PackageInstance | undefined;
  selectedProduct: ProductProfile | undefined;
  selectedProductRequirements: RequirementIntake[];
  selectedWorkspace: ProjectWorkspace | undefined;
  shipConfidenceTrendSummary: string | undefined;
  shipConfidenceLatest:
    | {
        shipConfidenceScore: number;
        statusLabel: string;
        suggestedNextStep: string;
      }
    | undefined;
  shortlists: TeamShortlist[];
  supportRequests: SupportRequest[];
  teams: Team[];
}

export function buildOwnerWorkspaceViewModel({
  cart,
  diagnoses,
  experts,
  filteredScannerEvidence,
  hostedRuntimeTarget,
  launchReadinessReport,
  milestones,
  packageModules,
  pendingRequirementId,
  proposals,
  repoSignals,
  scannerSummary,
  selectedPackage,
  selectedProduct,
  selectedProductRequirements,
  selectedWorkspace,
  shipConfidenceTrendSummary,
  shipConfidenceLatest,
  shortlists,
  supportRequests,
  teams,
}: OwnerWorkspaceViewModelInput) {
  const productProposals = proposals.filter(
    proposal => proposal.packageInstance?.productProfile?.id === selectedProduct?.id
  );
  const activeShortlists = shortlists.filter(shortlist => shortlist.status !== 'ARCHIVED');
  const productSupport = supportRequests.filter(
    request => request.workspace?.packageInstance?.productProfile?.id === selectedProduct?.id
  );
  const startPlan = buildOwnerWorkspaceStartPlanState({
    cart,
    packageModules,
    selectedProduct,
    selectedProductRequirements,
  });
  const suggestedTeams = teams.slice(0, 3);
  const suggestedExperts = experts.filter(expert => expert.active).slice(0, 3);
  const health = productHealth(selectedProduct, selectedPackage, packageModules);
  const latestDiagnosis = diagnoses[0];
  const latestScannerDiagnosis = diagnoses.find(
    diagnosis => diagnosis.diagnosisSource === 'SCANNER_READINESS'
  );
  const scannerCounts = scannerSummary?.counts;
  const scannerReadiness = scannerSummary?.readinessScore ?? (scannerCounts?.total ? 72 : 100);
  const scannerOpenFindings = (scannerSummary?.findings || []).filter(finding =>
    ['NEW', 'OPEN', 'REGRESSED'].includes(finding.status)
  );
  const hasCompletedScannerRun = !!scannerSummary?.recentRuns.some(
    run => run.status === 'COMPLETED'
  );
  const scannerMappedFindings = latestScannerDiagnosis?.findings || [];
  const scannerMappedServices = Array.from(
    new Set(
      scannerMappedFindings
        .map(finding => finding.recommendedModuleName)
        .filter((name): name is string => Boolean(name))
    )
  );
  const scannerReadinessPromptFacts = latestScannerDiagnosis
    ? `Scanner ship-readiness map: score ${latestScannerDiagnosis.readinessScore}/100, priority fixes ${latestScannerDiagnosis.topBlockerCount || 0}, proof items ${latestScannerDiagnosis.evidenceCount || 0}, unmapped findings ${latestScannerDiagnosis.unmappedFindingCount || 0}. Mapped services: ${scannerMappedServices.join(', ') || 'none'}. Top mapped findings: ${
        scannerMappedFindings
          .slice(0, 6)
          .map(
            finding =>
              `${finding.title} (${finding.severity}, ${finding.readinessArea || 'unclassified'}, service ${finding.recommendedModuleName || 'unmapped'}): risk ${finding.businessRisk || finding.description}; proof ${finding.evidenceRequired || 'not recorded'}`
          )
          .join('; ') || 'none'
      }.`
    : 'No scanner readiness diagnosis has been generated yet.';
  const diagnosisPromptFacts = latestDiagnosis
    ? `Visible diagnosis facts: readiness score ${latestDiagnosis.readinessScore}/100, status ${formatLabel(latestDiagnosis.status)}, source ${formatLabel(latestDiagnosis.diagnosisSource || 'MANUAL_DETERMINISTIC')}, AI state ${latestDiagnosis.aiExecuted ? 'AI explanation executed' : 'no AI run'}, finding count ${latestDiagnosis.findings.length}. Diagnosis summary: "${latestDiagnosis.summary || 'not recorded'}". Access signals: "${latestDiagnosis.accessSignals || 'not recorded'}". Top findings: ${
        latestDiagnosis.findings
          .slice(0, 6)
          .map(
            finding =>
              `${finding.title} (${finding.severity}, ${finding.status}, area ${finding.readinessArea || 'not classified'}, recommended service ${finding.recommendedModuleName || 'not mapped'}): ${finding.businessRisk || finding.description}`
          )
          .join('; ') || 'none recorded'
      }. Scanner facts: scanner score ${scannerReadiness}/100 with ${scannerCounts?.critical || 0} critical, ${scannerCounts?.high || 0} high, and ${scannerCounts?.open || 0} open findings; scanner top findings ${
        scannerOpenFindings
          .slice(0, 4)
          .map(finding => `${finding.title} (${finding.severity}, ${finding.status})`)
          .join('; ') || 'none open'
      }. Ship-confidence history: ${shipConfidenceTrendSummary || 'not available yet'} Latest checkpoint: ${shipConfidenceLatest ? `${shipConfidenceLatest.shipConfidenceScore}/100, ${shipConfidenceLatest.statusLabel}, next step ${shipConfidenceLatest.suggestedNextStep}` : 'none'}. ${scannerReadinessPromptFacts}`
    : `No deterministic product diagnosis exists yet for ${selectedProduct?.name || 'this product'}. Ask the owner to run diagnosis before making readiness claims. Scanner facts: scanner score ${scannerReadiness}/100 with ${scannerCounts?.critical || 0} critical, ${scannerCounts?.high || 0} high, and ${scannerCounts?.open || 0} open findings.`;
  const scannerToolCoverage = scannerSummary?.toolCoverage || [];
  const latestCoveredTools = scannerToolCoverage.filter(tool => !!tool.latestStatus).length;
  const latestCompletedTools = scannerToolCoverage.filter(
    tool => tool.latestStatus === 'COMPLETED'
  ).length;
  const latestMappedToolFindings = scannerToolCoverage.reduce(
    (total, tool) => total + (tool.mappedFindingCount || 0),
    0
  );
  const unavailableScannerTools = scannerToolCoverage.filter(
    tool => tool.enabled && !tool.executableAvailable
  ).length;
  const blockedMilestones = milestones.filter(milestone => milestone.status === 'BLOCKED').length;
  const submittedRequirement = selectedProductRequirements.find(
    requirement =>
      requirement.status === 'SUBMITTED' || requirement.status === 'PACKAGE_RECOMMENDED'
  );
  const buildTargetRequirementId = pendingRequirementId || submittedRequirement?.id || '';
  const topOwnerRisks = buildTopOwnerRisks({ scannerMappedFindings, scannerOpenFindings });
  const launchBlockerCount =
    latestScannerDiagnosis?.topBlockerCount ??
    scannerOpenFindings.filter(
      finding => finding.severity === 'CRITICAL' || finding.severity === 'HIGH'
    ).length;
  const launchImprovementCount = Math.max(
    0,
    (scannerOpenFindings.length || latestMappedToolFindings || scannerCounts?.open || 0) -
      launchBlockerCount
  );
  const hasLaunchEvidenceContext =
    !!scannerSummary ||
    !!latestDiagnosis ||
    !!launchReadinessReport ||
    hasCompletedScannerRun ||
    latestMappedToolFindings > 0;
  const launchStatus = buildOwnerLaunchStatus({
    hasProduct: !!selectedProduct,
    hasEvidenceContext: hasLaunchEvidenceContext,
    productHealthScore: health,
    scannerReadinessScore: scannerReadiness,
    blockerCount: launchBlockerCount,
    improvementCount: launchImprovementCount,
    criticalCount: scannerCounts?.critical || 0,
    openFindingCount: scannerOpenFindings.length,
    mappedFindingCount: latestMappedToolFindings,
    completedTools: latestCompletedTools,
    totalTools: scanToolOptions.length,
  });
  const verdictRisks = buildVerdictRisks(topOwnerRisks);
  const scannerCoverageGroups = buildScannerCoverageGroups({
    scannerToolCoverage,
    scanToolOptions,
  });
  const { evidenceReadme, primarySource, evidenceSummaryItems } = buildEvidenceSummary({
    repoSignals,
    scannerSummary,
    selectedProduct,
    hostedRuntimeTarget,
    latestCompletedTools,
    totalTools: scanToolOptions.length,
  });
  const topRecommendedServiceName =
    scannerMappedServices[0] ||
    selectedPackage?.name ||
    startPlan.cartServiceItems[0]?.serviceModule.name ||
    '';
  const serviceRiskItems = buildServiceRiskItems({ topOwnerRisks, topRecommendedServiceName });
  const ownerActionGroups = buildOwnerActionGroups({
    topOwnerRisks,
    weekItems: scannerMappedServices.length
      ? scannerMappedServices
      : startPlan.cartStartGaps.map(gap => gap.title),
    topRecommendedServiceName,
    latestCompletedTools,
    totalTools: scanToolOptions.length,
    evidenceCount: filteredScannerEvidence.length,
  });
  const groupedFindings = buildGroupedFindings({
    scannerFindings: scannerSummary?.findings || [],
    topOwnerRisks,
    launchStatus,
  });
  const workspaceTimeline = buildWorkspaceTimeline({
    selectedProduct,
    primarySource,
    evidenceReadme,
    latestCompletedTools,
    totalTools: scanToolOptions.length,
    scannerCounts,
    latestMappedToolFindings,
    selectedPackage,
    selectedWorkspace,
    formatDateTime: shortDateTime,
  });
  const selectedMilestone =
    milestones.find(milestone => milestone.status === 'BLOCKED') ||
    milestones.find(
      milestone => milestone.status === 'SUBMITTED' || milestone.status === 'IN_PROGRESS'
    ) ||
    milestones[0];

  return {
    ...startPlan,
    activeShortlists,
    blockedMilestones,
    buildTargetRequirementId,
    diagnosisPromptFacts,
    evidenceSummaryItems,
    groupedFindings,
    hasCompletedScannerRun,
    hasLaunchEvidenceContext,
    health,
    latestCompletedTools,
    latestCoveredTools,
    latestDiagnosis,
    latestMappedToolFindings,
    latestScannerDiagnosis,
    launchStatus,
    ownerActionGroups,
    productProposals,
    productSupport,
    scannerCounts,
    scannerCoverageGroups,
    scannerMappedFindings,
    scannerMappedServices,
    scannerOpenFindings,
    scannerReadiness,
    scannerReadinessPromptFacts,
    scannerToolCoverage,
    selectedMilestone,
    serviceRiskItems,
    suggestedExperts,
    suggestedTeams,
    topOwnerRisks,
    topRecommendedServiceName,
    unavailableScannerTools,
    verdictRisks,
    workspaceTimeline,
  };
}
