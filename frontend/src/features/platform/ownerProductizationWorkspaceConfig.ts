import { clampScore } from './PlatformComponents';
import type {
  ExternalImportProvider,
  NormalizedFinding,
  PackageInstance,
  PackageModule,
  ProductProfile,
  RequirementIntake,
  ScanRun,
  ScanSource,
  TeamShortlist,
} from './types';
import type {
  ExternalImportProviderOption,
  HostedScanForm,
  ScanToolOption,
} from './scannerProofOperationsTypes';

export interface ProductProfilePayload {
  name: string;
  summary: string;
  businessStage: ProductProfile['businessStage'];
  techStack: string;
  productUrl: string;
  repositoryUrl: string;
  riskProfile: string;
}

export interface RequirementPayload {
  productProfileId: string;
  requestedServiceModuleId: string | null;
  businessGoal: string;
  currentProblems: string;
  constraints: string;
  riskSignals: string;
  requirementBrief: string;
  status: RequirementIntake['status'];
}

export interface ShortlistPayload {
  packageInstanceId: string;
  teamId: string;
  status: TeamShortlist['status'];
  notes: string;
}

export interface CartServicePayload {
  serviceModuleId: string;
  notes?: string;
}

export interface CartUpdatePayload {
  productProfileId?: string | null;
  title?: string;
  businessGoal?: string;
  clearProductProfile?: boolean;
}

export interface CartTalentPayload {
  itemType: 'TEAM' | 'EXPERT';
  teamId?: string;
  expertProfileId?: string;
  notes?: string;
}

export interface CartConvertPayload {
  projectName: string;
}

export interface DiagnosisPayload {
  businessGoal: string;
  currentProblems: string;
  accessSignals: string;
  summary: string;
}

export interface ScannerReadinessDiagnosisPayload {
  workspaceId?: string;
  createServiceRecommendations: boolean;
  includeAcceptedRisk: boolean;
  summary?: string;
}

export interface ScanSourcePayload {
  productId: string;
  workspaceId?: string;
  providerType: ScanSource['providerType'];
  displayName: string;
  externalReference: string;
  externalInstallationId?: string;
  externalRepositoryFullName?: string;
  defaultBranch?: string;
  authorizationStatus: ScanSource['authorizationStatus'];
  scopeNote: string;
}

export interface ProviderSourcePayload {
  installationId: string;
  productId: string;
  workspaceId?: string;
  repositoryFullName: string;
  cloneUrl?: string;
  defaultBranch?: string;
  displayName?: string;
}

export interface DisconnectSourcePayload {
  reason: string;
  deleteArtifacts?: boolean;
}

export interface HostedScanPayload {
  productId: string;
  workspaceId?: string;
  sourceId?: string;
  depth: ScanRun['depth'];
  toolKeys?: string[];
  branchRef?: string;
  runtimeTargetUrl?: string;
  containerImageRef?: string;
  authorizationConfirmed: boolean;
  runtimeAuthorizationConfirmed: boolean;
  reason: string;
  comparisonBaseRunId?: string;
}

export interface FullHostedScanPayload {
  productId: string;
  workspaceId?: string;
  sourceId?: string;
  branchRef?: string;
  runtimeTargetUrl?: string;
  containerImageRef?: string;
  authorizationConfirmed: boolean;
  runtimeAuthorizationConfirmed: boolean;
  reason: string;
}

export interface ScannerSchedulePayload {
  productId: string;
  workspaceId?: string;
  sourceId: string;
  depth: ScanRun['depth'];
  toolKeys?: string[];
  branchRef?: string;
  runtimeTargetUrl?: string;
  containerImageRef?: string;
  intervalDays: number;
  nextRunAt?: string;
  active?: boolean;
  reason: string;
}

export interface ScannerUploadPayload {
  productId: string;
  workspaceId?: string;
  sourceId?: string;
  toolName: string;
  toolVersion: string;
  format: 'SARIF' | 'JSON' | 'JUNIT' | 'LOG';
  artifactFileName: string;
  artifactPayload: string;
  milestoneId?: string;
}

export interface ExternalImportPayload {
  productId: string;
  workspaceId?: string;
  sourceId?: string;
  provider: ExternalImportProvider;
  importMethod: 'MANUAL_API_IMPORT' | 'CI_TEMPLATE' | 'WEBHOOK' | 'CONNECTOR_SYNC';
  toolName: string;
  toolVersion?: string;
  format: ScannerUploadPayload['format'];
  artifactFileName?: string;
  artifactPayload: string;
  externalReference?: string;
  milestoneId?: string;
  scopeNote?: string;
}

export interface FindingStatusPayload {
  status: NormalizedFinding['status'];
  reason?: string;
  reviewDueOn?: string;
}

export const productInitialValues: ProductProfilePayload = {
  name: '',
  summary: '',
  businessStage: 'PROTOTYPE',
  techStack: '',
  productUrl: '',
  repositoryUrl: '',
  riskProfile: '',
};

export const requirementInitialValues: RequirementPayload = {
  productProfileId: '',
  requestedServiceModuleId: null,
  businessGoal: '',
  currentProblems: '',
  constraints: '',
  riskSignals: '',
  requirementBrief: '',
  status: 'SUBMITTED',
};

export const scanToolOptions: readonly ScanToolOption[] = [
  { key: 'gitleaks', label: 'Gitleaks', depths: ['SAFE_STATIC', 'DEEP_REVIEW'] },
  { key: 'osv-scanner', label: 'OSV-Scanner', depths: ['SAFE_STATIC', 'DEEP_REVIEW'] },
  { key: 'semgrep', label: 'Semgrep', depths: ['SAFE_STATIC', 'DEEP_REVIEW'] },
  { key: 'trivy-fs', label: 'Trivy FS', depths: ['SAFE_STATIC', 'DEEP_REVIEW'] },
  { key: 'checkov', label: 'Checkov', depths: ['SAFE_STATIC', 'DEEP_REVIEW'] },
  { key: 'syft', label: 'Syft SBOM', depths: ['DEPENDENCY_CONTAINER', 'DEEP_REVIEW'] },
  { key: 'grype', label: 'Grype', depths: ['DEPENDENCY_CONTAINER', 'DEEP_REVIEW'] },
  { key: 'trivy-image', label: 'Trivy Image', depths: ['DEPENDENCY_CONTAINER'] },
  { key: 'lighthouse', label: 'Lighthouse', depths: ['RUNTIME_BASELINE'] },
  { key: 'zap-baseline', label: 'ZAP Baseline', depths: ['RUNTIME_BASELINE'] },
];

export const defaultToolsForDepth = (depth: ScanRun['depth']) =>
  scanToolOptions.filter((tool) => tool.depths.includes(depth)).map((tool) => tool.key);

export const externalImportProviders: ExternalImportProviderOption[] = [
  { value: 'GITHUB_CODE_SCANNING', label: 'GitHub Code Scanning', toolName: 'GitHub Code Scanning', format: 'JSON' },
  { value: 'GITHUB_DEPENDABOT', label: 'GitHub Dependabot', toolName: 'GitHub Dependabot', format: 'JSON' },
  { value: 'GITHUB_SECRET_SCANNING', label: 'GitHub Secret Scanning', toolName: 'GitHub Secret Scanning', format: 'JSON' },
  { value: 'GITLAB_SECURITY', label: 'GitLab Security', toolName: 'GitLab Security', format: 'JSON' },
  { value: 'SNYK', label: 'Snyk', toolName: 'Snyk', format: 'JSON' },
  { value: 'SONARQUBE', label: 'SonarQube', toolName: 'SonarQube', format: 'JSON' },
  { value: 'SONARCLOUD', label: 'SonarCloud', toolName: 'SonarCloud', format: 'JSON' },
  { value: 'SEMGREP_PLATFORM', label: 'Semgrep Platform', toolName: 'Semgrep Platform', format: 'JSON' },
  { value: 'SARIF', label: 'SARIF', toolName: 'SARIF Import', format: 'SARIF' },
  { value: 'GENERIC_JSON', label: 'Generic scanner JSON', toolName: 'External Scanner JSON', format: 'JSON' },
];

export const packageScore = (packageInstance?: PackageInstance, modules?: PackageModule[]) => {
  if (!packageInstance) return 54;
  const moduleScore = modules?.length
    ? modules.reduce((total, module) => {
        if (module.status === 'ACCEPTED') return total + 100;
        if (module.status === 'REVIEW') return total + 78;
        if (module.status === 'IN_PROGRESS') return total + 64;
        if (module.status === 'BLOCKED') return total + 28;
        return total + 48;
      }, 0) / modules.length
    : 68;
  const statusBonus = packageInstance.status === 'ACTIVE_DELIVERY' ? 8 : packageInstance.status === 'DELIVERED' ? 16 : 0;
  return clampScore(moduleScore + statusBonus);
};

export const hostedScanBlockReason = (
  product: ProductProfile | undefined,
  source: ScanSource | undefined,
  form: HostedScanForm
) => {
  if (!product) return 'Select a product first.';
  if (!form.authorizationConfirmed) return 'Confirm that you are authorized to run this scan.';
  if (!form.reason.trim()) return 'Add an audit reason for scanner execution.';
  if (!form.toolKeys.length) return 'Select at least one scanner tool.';
  if (form.depth === 'RUNTIME_BASELINE') {
    const target = form.runtimeTargetUrl || source?.externalReference || product.productUrl || '';
    if (!target.trim()) return 'Add an authorized runtime URL.';
    if (!form.runtimeAuthorizationConfirmed) return 'Confirm runtime URL authorization.';
    return '';
  }
  if (form.depth === 'DEPENDENCY_CONTAINER') {
    if (!form.containerImageRef.trim()) return 'Add a container image reference for dependency/container scanning.';
    return '';
  }
  if (!source && !product.repositoryUrl) return 'Connect an authorized repository source or add a repository URL to the product.';
  if (source && source.authorizationStatus !== 'AUTHORIZED') return 'Authorize the selected source before running hosted scanners.';
  return '';
};

export const fullHostedScanBlockReason = (
  product: ProductProfile | undefined,
  source: ScanSource | undefined,
  form: HostedScanForm
) => {
  if (!product) return 'Select a product first.';
  if (!form.authorizationConfirmed) return 'Confirm that you are authorized to run the full scanner suite.';
  if (!form.reason.trim()) return 'Add an audit reason for scanner execution.';
  if (source && source.authorizationStatus !== 'AUTHORIZED') return 'Authorize the selected source before running hosted scanners.';
  const repositoryTarget = product.repositoryUrl || ((source?.providerType === 'GITHUB' || source?.providerType === 'GITLAB') ? source.externalReference : '') || '';
  if (!repositoryTarget.trim()) return 'Add a repository source or product repository URL for static scanners.';
  const runtimeTarget = form.runtimeTargetUrl || (source?.providerType === 'RUNTIME_URL' ? source.externalReference : '') || product.productUrl || '';
  if (!runtimeTarget.trim()) return 'Add an authorized runtime URL for Lighthouse and ZAP.';
  if (!form.runtimeAuthorizationConfirmed) return 'Confirm runtime URL authorization for Lighthouse and ZAP.';
  const imageTarget = form.containerImageRef || (source?.providerType === 'EXTERNAL_TOOL' ? source.externalReference : '') || '';
  if (!imageTarget.trim()) return 'Add a container image reference for SBOM and image vulnerability scanners.';
  return '';
};

export const productHealth = (product?: ProductProfile, packageInstance?: PackageInstance, modules?: PackageModule[]) => {
  if (!product) return 0;
  if (!packageInstance) return product.businessStage === 'LIVE' ? 66 : 58;
  return packageScore(packageInstance, modules);
};

export const shortDateTime = (value?: string) => {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
};
