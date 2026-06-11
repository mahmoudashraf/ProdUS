import { appleColors } from './PlatformComponents';

export type WorkspaceTab = 'overview' | 'actions' | 'findings' | 'services' | 'ai' | 'share';

export const workspaceTabs: { value: WorkspaceTab; label: string }[] = [
  { value: 'overview', label: 'Workspace' },
  { value: 'actions', label: 'Action Plan' },
  { value: 'findings', label: 'Scanners' },
  { value: 'services', label: 'Services' },
  { value: 'ai', label: 'AI Opportunities' },
  { value: 'share', label: 'Share' },
];

export const workspaceDefaultViewByTab: Partial<Record<WorkspaceTab, string>> = {
  actions: 'plan',
  services: 'recommend',
  ai: 'opportunities',
  share: 'create',
};

export function productWorkspaceRoute(productId: string, tab: WorkspaceTab = 'overview') {
  const basePath = `/products/${productId}`;
  if (tab === 'overview') return basePath;
  const view = workspaceDefaultViewByTab[tab];
  const params = new URLSearchParams({ tab });
  if (view) params.set('view', view);
  return `${basePath}?${params.toString()}`;
}

export const scannerEvidenceCategories = [
  { key: 'secrets', label: 'Secrets', tools: ['gitleaks'], action: 'Rotate or confirm detected secret-like strings, then rerun the repository check.' },
  { key: 'dependencies', label: 'Dependencies', tools: ['osv-scanner', 'grype', 'trivy-image'], action: 'Patch dependency and container issues that affect launch confidence.' },
  { key: 'code', label: 'Code and static risk', tools: ['semgrep'], action: 'Assign code-level findings to engineering with proof of remediation.' },
  { key: 'infrastructure', label: 'Infrastructure and workflows', tools: ['checkov', 'trivy-fs'], action: 'Tighten workflow, IaC, and repository policy before customer rollout.' },
  { key: 'runtime', label: 'Runtime baseline', tools: ['zap-baseline', 'lighthouse'], action: 'Harden the public app baseline and rerun runtime checks.' },
  { key: 'inventory', label: 'Inventory', tools: ['syft'], action: 'Keep the software inventory attached for delivery and audit context.' },
] as const;

export interface OwnerLaunchStatusInput {
  hasProduct: boolean;
  hasEvidenceContext: boolean;
  productHealthScore: number;
  scannerReadinessScore: number;
  blockerCount: number;
  improvementCount: number;
  criticalCount: number;
  openFindingCount: number;
  mappedFindingCount: number;
  completedTools: number;
  totalTools: number;
}

export interface OwnerLaunchStatus {
  label: 'Evidence needed' | 'Not ready' | 'Needs attention' | 'Ready to review';
  headline: string;
  score: number;
  accent: string;
  confidence: string;
  reason: string;
  blockerCount: number;
  improvementCount: number;
}

export const severityWeight = (severity?: string) => {
  if (severity === 'CRITICAL') return 5;
  if (severity === 'HIGH') return 4;
  if (severity === 'MEDIUM') return 3;
  if (severity === 'LOW') return 2;
  return 1;
};

export const ownerCategoryFromSignal = (tool?: string, area?: string, title?: string) => {
  const text = `${tool || ''} ${area || ''} ${title || ''}`.toLowerCase();
  if (text.includes('zap') || text.includes('lighthouse') || text.includes('header') || text.includes('runtime') || text.includes('browser')) return 'Runtime baseline';
  if (text.includes('gitleaks') || text.includes('secret') || text.includes('credential') || text.includes('token') || text.includes('key')) return 'Secrets';
  if (text.includes('checkov') || text.includes('trivy-fs') || text.includes('workflow') || text.includes('terraform') || text.includes('github action')) return 'Infrastructure and workflows';
  if (text.includes('osv') || text.includes('grype') || text.includes('trivy-image') || text.includes('dependency') || text.includes('container') || text.includes('vulnerab')) return 'Dependencies';
  if (text.includes('semgrep') || text.includes('static') || text.includes('code')) return 'Code and static risk';
  if (text.includes('syft') || text.includes('sbom') || text.includes('inventory')) return 'Inventory';
  return 'Product readiness';
};

export const ownerImpactForCategory = (category: string) => {
  if (category === 'Runtime baseline') return 'Customer-facing protection may be weaker than expected.';
  if (category === 'Secrets') return 'Private credentials or tokens could be exposed before launch.';
  if (category === 'Infrastructure and workflows') return 'Delivery or deployment controls may allow avoidable production risk.';
  if (category === 'Dependencies') return 'Known vulnerable packages or images could reach users.';
  if (category === 'Code and static risk') return 'A code path may need review before it becomes product-critical.';
  if (category === 'Inventory') return 'The team may lack a clean inventory for handoff or audit.';
  return 'This item can reduce launch confidence until it is reviewed.';
};

export const ownerActionForCategory = (category: string) => {
  if (category === 'Runtime baseline') return 'Ask engineering to harden the runtime baseline and rerun the public app check.';
  if (category === 'Secrets') return 'Ask engineering to verify exposure, rotate if needed, and prove the secret is removed.';
  if (category === 'Infrastructure and workflows') return 'Ask engineering to tighten workflow or infrastructure policy and attach proof.';
  if (category === 'Dependencies') return 'Schedule dependency or container patching, then attach a clean rerun.';
  if (category === 'Code and static risk') return 'Assign a technical reviewer and capture the fix or accepted-risk note.';
  if (category === 'Inventory') return 'Keep inventory evidence attached for delivery handoff.';
  return 'Assign this to a technical reviewer and capture the owner decision.';
};

export const ownerProofSourceLabel = (tool?: string, category?: string) => {
  const text = `${tool || ''} ${category || ''}`.toLowerCase();
  if (text.includes('zap') || text.includes('lighthouse') || text.includes('runtime')) return 'Web security baseline';
  if (text.includes('gitleaks') || text.includes('secret')) return 'Secret exposure check';
  if (text.includes('checkov') || text.includes('workflow') || text.includes('infrastructure')) return 'Infrastructure and workflow policy check';
  if (text.includes('osv') || text.includes('grype') || text.includes('trivy') || text.includes('dependenc')) return 'Dependency and container check';
  if (text.includes('semgrep') || text.includes('code')) return 'Static code review';
  if (text.includes('syft') || text.includes('inventory')) return 'Software inventory';
  return 'Scanner readiness evidence';
};

export const ownerProofLine = ({
  sourceTool,
  sourceRuleId,
  category,
  findingCount,
}: {
  sourceTool?: string;
  sourceRuleId?: string | null | undefined;
  category?: string;
  findingCount?: number;
}) => {
  const parts = [ownerProofSourceLabel(sourceTool, category)];
  if (findingCount && findingCount > 1) parts.push(`${findingCount} related findings`);
  if (sourceRuleId) parts.push(sourceRuleId);
  return parts.join(' · ');
};

export const buildOwnerLaunchStatus = ({
  hasProduct,
  hasEvidenceContext,
  productHealthScore,
  scannerReadinessScore,
  blockerCount,
  improvementCount,
  criticalCount,
  openFindingCount,
  mappedFindingCount,
  completedTools,
  totalTools,
}: OwnerLaunchStatusInput): OwnerLaunchStatus => {
  const score = hasEvidenceContext ? scannerReadinessScore : productHealthScore;
  const normalizedBlockers = Math.max(0, blockerCount || criticalCount || 0);
  const normalizedImprovements = Math.max(0, improvementCount);
  const completeSuite = totalTools > 0 && completedTools === totalTools;
  const confidence = completeSuite ? 'High evidence confidence' : completedTools > 0 ? 'Partial evidence confidence' : 'Needs evidence';

  if (!hasProduct) {
    return {
      label: 'Evidence needed',
      headline: 'Select a product to assess launch readiness',
      score: 0,
      accent: appleColors.muted,
      confidence: 'No product selected',
      reason: 'Select a product to generate a launch decision.',
      blockerCount: 0,
      improvementCount: 0,
    };
  }

  if (!hasEvidenceContext) {
    return {
      label: 'Evidence needed',
      headline: 'Evidence needed before launch call',
      score,
      accent: appleColors.amber,
      confidence,
      reason: 'Add repository, runtime, or scanner evidence before making a launch call.',
      blockerCount: 0,
      improvementCount: 0,
    };
  }

  if (scannerReadinessScore < 55 || normalizedBlockers > 0 || criticalCount > 0) {
    const blockers = normalizedBlockers || criticalCount || openFindingCount || mappedFindingCount || 1;
    return {
      label: 'Not ready',
      headline: `Not ready - ${blockers} blocker${blockers === 1 ? '' : 's'} first`,
      score: scannerReadinessScore,
      accent: appleColors.red,
      confidence,
      reason: `${blockers} launch blocker${blockers === 1 ? '' : 's'} must be fixed before launch. ${normalizedImprovements} improvement${normalizedImprovements === 1 ? '' : 's'} can be scheduled after the blockers are assigned.`,
      blockerCount: blockers,
      improvementCount: normalizedImprovements,
    };
  }

  if (scannerReadinessScore < 82 || openFindingCount > 0 || mappedFindingCount > 0) {
    const improvements = normalizedImprovements || openFindingCount || mappedFindingCount;
    return {
      label: 'Needs attention',
      headline: `Needs attention - ${improvements} improvement${improvements === 1 ? '' : 's'} to plan`,
      score: scannerReadinessScore,
      accent: appleColors.amber,
      confidence,
      reason: `No launch blockers are confirmed, but ${improvements} improvement${improvements === 1 ? '' : 's'} should be scheduled before a public launch or paid beta.`,
      blockerCount: 0,
      improvementCount: improvements,
    };
  }

  return {
    label: 'Ready to review',
    headline: 'Ready for human launch review',
    score: scannerReadinessScore,
    accent: appleColors.green,
    confidence: completeSuite ? 'High evidence confidence' : 'Good evidence confidence',
    reason: 'No major open scanner blockers are visible. Keep a human launch review and final evidence export before go-live.',
    blockerCount: 0,
    improvementCount: 0,
  };
};
