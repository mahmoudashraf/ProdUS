'use client';

import NextLink from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AddOutlined,
  AddShoppingCartOutlined,
  ArticleOutlined,
  AutoAwesomeOutlined,
  BugReportOutlined,
  CancelOutlined,
  CloudUploadOutlined,
  ContentCopyOutlined,
  EventRepeatOutlined,
  FactCheckOutlined,
  InfoOutlined,
  OpenInNewOutlined,
  PlayArrowOutlined,
  RefreshOutlined,
  SendOutlined,
  ShieldOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import { deleteJson, getJson, patchJson, postJson, putJson } from './api';
import {
  DotLabel,
  EmptyState,
  MetricTile,
  PageHeader,
  PastelChip,
  QueryState,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  clampScore,
  formatLabel,
} from './PlatformComponents';
import ShipConfidencePanel from './ShipConfidencePanel';
import LaunchReadinessReportPanel from './LaunchReadinessReportPanel';
import OwnerWorkspaceTimelineDialog from './OwnerWorkspaceTimelineDialog';
import { OwnerWorkspaceJourneyNav, WorkspaceBreadcrumbs, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import OwnerFindingReviewDrawer from './OwnerFindingReviewDrawer';
import RepoReadoutPanel from './RepoReadoutPanel';
import StudioAssistantCard, { assistantRecordText, type StudioAssistantContext } from './StudioAssistantCard';
import OwnerActionPlanPanel from './OwnerActionPlanPanel';
import OwnerFindingsEvidencePanel from './OwnerFindingsEvidencePanel';
import OwnerFindingsRiskPanel from './OwnerFindingsRiskPanel';
import OwnerWorkspaceProductHero from './OwnerWorkspaceProductHero';
import OwnerOverviewDecisionPanel from './OwnerOverviewDecisionPanel';
import OwnerScannerEvidenceCenterPanel from './OwnerScannerEvidenceCenterPanel';
import ScannerCoverageGrid from './ScannerCoverageGrid';
import ScannerFixPathPanel from './ScannerFixPathPanel';
import ScannerProofRunway from './ScannerProofRunway';
import OwnerServicesRecommendationPanel, { type OwnerServiceRiskSummary } from './OwnerServicesRecommendationPanel';
import OwnerProjectStartPanel from './OwnerProjectStartPanel';
import OwnerTeamMatchPanel from './OwnerTeamMatchPanel';
import OwnerServicePlanPanel from './OwnerServicePlanPanel';
import { findingStatusAccent, severityAccent } from './ownerFindingPresentation';
import {
  OwnerControlPanel,
  OwnerLaunchReadyCelebration,
  OwnerReadinessVerdictReveal,
  VerdictRisk,
} from './OwnerJourneyCards';
import {
  WorkspaceTab,
  buildOwnerLaunchStatus,
  ownerActionForCategory,
  ownerCategoryFromSignal,
  ownerImpactForCategory,
  ownerProofLine,
  scannerEvidenceCategories,
  severityWeight,
  workspaceTabs,
} from './ownerWorkspaceModel';
import {
  AIRecommendation,
  Milestone,
  PackageInstance,
  PackageModule,
  ProductDiagnosis,
  ProductProfile,
  ProductScannerSummary,
  ProductizationCart,
  ProductizationCartConvertResponse,
  ProjectWorkspace,
  QuoteProposal,
  RequirementIntake,
  RepoSignalSummary,
  ServiceCategory,
  ServiceModule,
  SupportRequest,
  ExpertProfile,
  Team,
  TeamRecommendation,
  TeamShortlist,
  NormalizedFinding,
  ScanRun,
  ScanSource,
  CiTemplateResponse,
  ConnectorPermission,
  ConnectorInstallUrlResponse,
  EvidenceExportBundle,
  ExternalImportProvider,
  AssistantSuggestionsResponse,
  ScannerConnectorInstallation,
  ScannerEvidenceItem,
  ScannerToolCoverage,
  SignedArtifactResponse,
  ShipConfidenceHistory,
  LaunchReadinessReport,
  FullHostedScanResponse,
} from './types';

type OverviewJourneyView = 'decision' | 'progress';
type ActionJourneyView = 'plan' | 'diagnosis';
type FindingsJourneyView = 'risks' | 'evidence' | 'technical';
type ServicesJourneyView = 'recommend' | 'plan' | 'team';

const workspaceViewValues: Record<WorkspaceTab, string[]> = {
  overview: ['decision', 'progress'],
  actions: ['plan', 'diagnosis'],
  findings: ['risks', 'evidence', 'technical'],
  services: ['recommend', 'plan', 'team'],
};

const isWorkspaceTabValue = (value: string | null): value is WorkspaceTab =>
  !!value && workspaceTabs.some((tab) => tab.value === value);

const isWorkspaceViewValue = (tab: WorkspaceTab, value: string | null) =>
  !!value && workspaceViewValues[tab].includes(value);

interface ProductProfilePayload {
  name: string;
  summary: string;
  businessStage: ProductProfile['businessStage'];
  techStack: string;
  productUrl: string;
  repositoryUrl: string;
  riskProfile: string;
}

interface RequirementPayload {
  productProfileId: string;
  requestedServiceModuleId: string | null;
  businessGoal: string;
  currentProblems: string;
  constraints: string;
  riskSignals: string;
  requirementBrief: string;
  status: RequirementIntake['status'];
}

interface ShortlistPayload {
  packageInstanceId: string;
  teamId: string;
  status: TeamShortlist['status'];
  notes: string;
}

interface CartServicePayload {
  serviceModuleId: string;
  notes?: string;
}

interface CartUpdatePayload {
  productProfileId?: string;
  title?: string;
  businessGoal?: string;
}

interface CartTalentPayload {
  itemType: 'TEAM' | 'EXPERT';
  teamId?: string;
  expertProfileId?: string;
  notes?: string;
}

interface CartConvertPayload {
  projectName: string;
}

interface DiagnosisPayload {
  businessGoal: string;
  currentProblems: string;
  accessSignals: string;
  summary: string;
}

interface ScannerReadinessDiagnosisPayload {
  workspaceId?: string;
  createServiceRecommendations: boolean;
  includeAcceptedRisk: boolean;
  summary?: string;
}

interface ScanSourcePayload {
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

interface ProviderSourcePayload {
  installationId: string;
  productId: string;
  workspaceId?: string;
  repositoryFullName: string;
  cloneUrl?: string;
  defaultBranch?: string;
  displayName?: string;
}

interface DisconnectSourcePayload {
  reason: string;
  deleteArtifacts?: boolean;
}

interface HostedScanPayload {
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

interface FullHostedScanPayload {
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

interface ScannerSchedulePayload {
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

interface ScannerUploadPayload {
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

interface ExternalImportPayload {
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

interface FindingStatusPayload {
  status: NormalizedFinding['status'];
  reason?: string;
  reviewDueOn?: string;
}

const productInitialValues: ProductProfilePayload = {
  name: '',
  summary: '',
  businessStage: 'PROTOTYPE',
  techStack: '',
  productUrl: '',
  repositoryUrl: '',
  riskProfile: '',
};

const requirementInitialValues: RequirementPayload = {
  productProfileId: '',
  requestedServiceModuleId: null,
  businessGoal: '',
  currentProblems: '',
  constraints: '',
  riskSignals: '',
  requirementBrief: '',
  status: 'SUBMITTED',
};

const scanToolOptions = [
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
] as const;

const defaultToolsForDepth = (depth: ScanRun['depth']) =>
  scanToolOptions.filter((tool) => (tool.depths as readonly string[]).includes(depth)).map((tool) => tool.key);

const externalImportProviders: { value: ExternalImportProvider; label: string; toolName: string; format: ScannerUploadPayload['format'] }[] = [
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

const statusAccent = (status?: string) => {
  if (!status) return appleColors.purple;
  if (status.includes('BLOCK') || status.includes('REJECT') || status.includes('URGENT')) return appleColors.red;
  if (status.includes('REVIEW') || status.includes('NEGOTIATION') || status.includes('AWAITING') || status.includes('SUBMITTED')) return appleColors.amber;
  if (status.includes('ACTIVE') || status.includes('ACCEPT') || status.includes('DELIVER') || status.includes('SIGNED') || status.includes('ON_TRACK')) return appleColors.green;
  return appleColors.purple;
};

const packageScore = (packageInstance?: PackageInstance, modules?: PackageModule[]) => {
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

const hostedScanBlockReason = (
  product: ProductProfile | undefined,
  source: ScanSource | undefined,
  form: {
    depth: ScanRun['depth'];
    authorizationConfirmed: boolean;
    runtimeAuthorizationConfirmed: boolean;
    runtimeTargetUrl: string;
    containerImageRef: string;
    toolKeys: string[];
    reason: string;
  }
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

const fullHostedScanBlockReason = (
  product: ProductProfile | undefined,
  source: ScanSource | undefined,
  form: {
    authorizationConfirmed: boolean;
    runtimeAuthorizationConfirmed: boolean;
    runtimeTargetUrl: string;
    containerImageRef: string;
    branchRef: string;
    reason: string;
  }
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

const productHealth = (product?: ProductProfile, packageInstance?: PackageInstance, modules?: PackageModule[]) => {
  if (!product) return 0;
  if (!packageInstance) return product.businessStage === 'LIVE' ? 66 : 58;
  return packageScore(packageInstance, modules);
};

const shortDateTime = (value?: string) => {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
};

export default function OwnerProductizationWorkspace({
  productId,
  showProductCreation = true,
}: {
  productId?: string;
  showProductCreation?: boolean;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const products = useQuery({ queryKey: ['products'], queryFn: () => getJson<ProductProfile[]>('/products') });
  const requirements = useQuery({ queryKey: ['requirements'], queryFn: () => getJson<RequirementIntake[]>('/requirements') });
  const packages = useQuery({ queryKey: ['packages'], queryFn: () => getJson<PackageInstance[]>('/packages') });
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: () => getJson<ProjectWorkspace[]>('/workspaces') });
  const categories = useQuery({ queryKey: ['catalog-categories'], queryFn: () => getJson<ServiceCategory[]>('/catalog/categories') });
  const catalogModules = useQuery({ queryKey: ['catalog-modules'], queryFn: () => getJson<ServiceModule[]>('/catalog/modules') });
  const proposals = useQuery({ queryKey: ['commerce-proposals'], queryFn: () => getJson<QuoteProposal[]>('/commerce/proposals') });
  const supportRequests = useQuery({ queryKey: ['commerce-support-requests'], queryFn: () => getJson<SupportRequest[]>('/commerce/support-requests') });
  const recommendations = useQuery({ queryKey: ['ai-recommendations'], queryFn: () => getJson<AIRecommendation[]>('/ai/recommendations') });
  const teams = useQuery({ queryKey: ['teams'], queryFn: () => getJson<Team[]>('/teams') });
  const experts = useQuery({ queryKey: ['expert-profiles'], queryFn: () => getJson<ExpertProfile[]>('/expert-profiles') });
  const cart = useQuery({ queryKey: ['productization-cart'], queryFn: () => getJson<ProductizationCart>('/productization-cart/current') });

  const [selectedProductId, setSelectedProductId] = useState(productId || '');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [pendingRequirementId, setPendingRequirementId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [cartNotice, setCartNotice] = useState('');
  const [lastDiagnosisRefreshRunId, setLastDiagnosisRefreshRunId] = useState('');
  const diagnoses = useQuery({
    queryKey: ['productization-engine', selectedProductId, 'diagnoses'],
    enabled: !!selectedProductId,
    queryFn: () => getJson<ProductDiagnosis[]>(`/productization-engine/products/${selectedProductId}/diagnoses`),
  });
  const shipConfidence = useQuery({
    queryKey: ['productization-engine', selectedProductId, 'ship-confidence'],
    enabled: !!selectedProductId,
    queryFn: () => getJson<ShipConfidenceHistory>(`/productization-engine/products/${selectedProductId}/ship-confidence`),
  });
  const launchReadinessReport = useQuery({
    queryKey: ['productization-engine', selectedProductId, 'launch-readiness-report'],
    enabled: !!selectedProductId,
    retry: false,
    queryFn: async () => {
      try {
        return await getJson<LaunchReadinessReport>(`/productization-engine/products/${selectedProductId}/launch-readiness-report/latest`);
      } catch (error: any) {
        if (error?.response?.status === 400 && String(error?.response?.data?.detail || '').includes('No launch readiness report')) {
          return null;
        }
        throw error;
      }
    },
  });
  const scannerSummary = useQuery({
    queryKey: ['scanner-summary', selectedProductId],
    enabled: !!selectedProductId,
    queryFn: () => getJson<ProductScannerSummary>(`/scanner/products/${selectedProductId}/summary`),
    refetchInterval: (query) => {
      const data = query.state.data as ProductScannerSummary | undefined;
      return data?.recentRuns.some((run) => run.status === 'QUEUED' || run.status === 'RUNNING') ? 5000 : false;
    },
  });
  const repoSignals = useQuery({
    queryKey: ['repo-signals', selectedProductId],
    enabled: !!selectedProductId,
    queryFn: () => getJson<RepoSignalSummary>(`/products/${selectedProductId}/repo-signals`),
  });
  const latestCompletedScannerRunId = scannerSummary.data?.recentRuns.find((run) => run.status === 'COMPLETED')?.id || '';
  useEffect(() => {
    if (!selectedProductId || !latestCompletedScannerRunId || latestCompletedScannerRunId === lastDiagnosisRefreshRunId) return;
    setLastDiagnosisRefreshRunId(latestCompletedScannerRunId);
    queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProductId, 'diagnoses'] });
    queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProductId, 'ship-confidence'] });
    queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
    queryClient.invalidateQueries({ queryKey: ['repo-signals', selectedProductId] });
  }, [latestCompletedScannerRunId, lastDiagnosisRefreshRunId, queryClient, selectedProductId]);
  const connectorPermissions = useQuery({
    queryKey: ['scanner-connector-permissions'],
    queryFn: () => getJson<ConnectorPermission[]>('/scanner/connector-permissions'),
  });
  const scannerConnectors = useQuery({
    queryKey: ['scanner-connectors'],
    queryFn: () => getJson<ScannerConnectorInstallation[]>('/scanner/connectors'),
  });

  const [scanSourceForm, setScanSourceForm] = useState({
    providerType: 'GITHUB' as ScanSource['providerType'],
    displayName: 'GitHub Security Pipeline',
    externalReference: '',
    authorizationConfirmed: false,
    scopeNote: 'CI and security evidence imported for production readiness review.',
  });
  const [providerSourceForm, setProviderSourceForm] = useState({
    installationId: '',
    repositoryFullName: '',
    cloneUrl: '',
    defaultBranch: 'main',
  });
  const [hostedScanForm, setHostedScanForm] = useState<{
    sourceId: string;
    depth: ScanRun['depth'];
    toolKeys: string[];
    branchRef: string;
    runtimeTargetUrl: string;
    containerImageRef: string;
    authorizationConfirmed: boolean;
    runtimeAuthorizationConfirmed: boolean;
    reason: string;
  }>({
    sourceId: '',
    depth: 'SAFE_STATIC' as ScanRun['depth'],
    toolKeys: defaultToolsForDepth('SAFE_STATIC'),
    branchRef: 'main',
    runtimeTargetUrl: '',
    containerImageRef: '',
    authorizationConfirmed: false,
    runtimeAuthorizationConfirmed: false,
    reason: 'Owner authorized scanner execution for productization readiness.',
  });
  const [scannerUploadForm, setScannerUploadForm] = useState({
    sourceId: '',
    toolName: 'CodeQL',
    toolVersion: '',
    format: 'SARIF' as ScannerUploadPayload['format'],
    artifactFileName: 'scanner-results.sarif',
    artifactPayload: '',
    milestoneId: '',
  });
  const [externalImportForm, setExternalImportForm] = useState<{
    sourceId: string;
    provider: ExternalImportProvider;
    importMethod: ExternalImportPayload['importMethod'];
    toolName: string;
    toolVersion: string;
    format: ScannerUploadPayload['format'];
    artifactFileName: string;
    artifactPayload: string;
    externalReference: string;
    milestoneId: string;
    scopeNote: string;
  }>({
    sourceId: '',
    provider: 'GITHUB_CODE_SCANNING',
    importMethod: 'MANUAL_API_IMPORT',
    toolName: 'GitHub Code Scanning',
    toolVersion: '',
    format: 'JSON',
    artifactFileName: 'github-code-scanning-alerts.json',
    artifactPayload: '',
    externalReference: '',
    milestoneId: '',
    scopeNote: 'Customer-owned scanner evidence imported without source code upload.',
  });
  const [ciTemplateType, setCiTemplateType] = useState<CiTemplateResponse['type']>('GITHUB_ACTIONS');
  const [ciTemplate, setCiTemplate] = useState<CiTemplateResponse | null>(null);
  const [deleteArtifactsOnDisconnect, setDeleteArtifactsOnDisconnect] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    intervalDays: '7',
    nextRunAt: '',
    reason: 'Scheduled evidence refresh for productization readiness.',
  });
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('overview');
  const [overviewView, setOverviewView] = useState<OverviewJourneyView>('decision');
  const [actionView, setActionView] = useState<ActionJourneyView>('plan');
  const [findingsView, setFindingsView] = useState<FindingsJourneyView>('risks');
  const [servicesView, setServicesView] = useState<ServicesJourneyView>('recommend');
  const [workspaceDetailOpen, setWorkspaceDetailOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [selectedFindingId, setSelectedFindingId] = useState('');
  const [findingDrawerOpen, setFindingDrawerOpen] = useState(false);
  const [openFindingGroups, setOpenFindingGroups] = useState<Record<string, boolean>>({ 'Launch blockers': true });
  const [evidenceFilter, setEvidenceFilter] = useState<'ALL' | 'FINDINGS' | 'MILESTONES' | 'REDACTED'>('ALL');
  const [findingReasonById, setFindingReasonById] = useState<Record<string, string>>({});
  const [findingReviewDueById, setFindingReviewDueById] = useState<Record<string, string>>({});

  const productForm = useAdvancedForm<ProductProfilePayload>({
    initialValues: productInitialValues,
    validationRules: {
      name: [{ type: 'required', message: 'Product name is required' }],
    },
  });
  const requirementForm = useAdvancedForm<RequirementPayload>({
    initialValues: requirementInitialValues,
    validationRules: {
      businessGoal: [{ type: 'required', message: 'Business goal is required' }],
    },
  });
  const diagnosisForm = useAdvancedForm<DiagnosisPayload>({
    initialValues: {
      businessGoal: '',
      currentProblems: '',
      accessSignals: '',
      summary: '',
    },
  });

  const productList = products.data || [];
  const packageList = packages.data || [];
  const selectedProduct = useMemo(
    () => productList.find((product) => product.id === selectedProductId) || productList[0],
    [productList, selectedProductId]
  );
  const selectedProductPackages = useMemo(
    () => packageList.filter((item) => item.productProfile?.id === selectedProduct?.id),
    [packageList, selectedProduct?.id]
  );
  const selectedPackage = useMemo(
    () => selectedProductPackages.find((item) => item.id === selectedPackageId) || selectedProductPackages[0],
    [selectedPackageId, selectedProductPackages]
  );
  const selectedProductRequirements = useMemo(
    () => (requirements.data || []).filter((requirement) => requirement.productProfile?.id === selectedProduct?.id),
    [requirements.data, selectedProduct?.id]
  );
  const selectedWorkspace = useMemo(
    () => (workspaces.data || []).find((workspace) => workspace.packageInstance?.id === selectedPackage?.id),
    [selectedPackage?.id, workspaces.data]
  );
  const assistantSuggestions = useQuery({
    queryKey: ['assistant-suggestions', selectedProduct?.id, selectedPackage?.id, selectedWorkspace?.id, selectedFindingId],
    enabled: false,
    queryFn: () =>
      postJson<AssistantSuggestionsResponse, { content: string; conversationId: string; maxSuggestions: number; context: Record<string, string | undefined> }>('/ai/assistant/suggestions', {
        content: `Suggest the next useful productization actions for ${selectedProduct?.name || 'this product'}.`,
        conversationId: `owner-productization-${selectedProduct?.id || 'product'}`,
        maxSuggestions: 4,
        context: {
          pageType: 'owner-product-workspace',
          productId: selectedProduct?.id,
          packageId: selectedPackage?.id,
          workspaceId: selectedWorkspace?.id,
          findingId: selectedFindingId || undefined,
        },
      }),
    retry: false,
  });

  useEffect(() => {
    if (!selectedProductId && productList[0]) {
      setSelectedProductId(productList[0].id);
    }
  }, [productList, selectedProductId]);

  useEffect(() => {
    if (selectedPackage?.id && selectedPackage.id !== selectedPackageId) {
      setSelectedPackageId(selectedPackage.id);
    }
  }, [selectedPackage, selectedPackageId]);

  const packageModules = useQuery({
    queryKey: ['packages', selectedPackage?.id, 'modules'],
    enabled: !!selectedPackage?.id,
    queryFn: () => getJson<PackageModule[]>(`/packages/${selectedPackage?.id}/modules`),
  });
  const teamRecommendations = useQuery({
    queryKey: ['packages', selectedPackage?.id, 'team-recommendations'],
    enabled: !!selectedPackage?.id,
    queryFn: () => getJson<TeamRecommendation[]>(`/packages/${selectedPackage?.id}/team-recommendations`),
  });
  const milestones = useQuery({
    queryKey: ['workspaces', selectedWorkspace?.id, 'milestones'],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<Milestone[]>(`/workspaces/${selectedWorkspace?.id}/milestones`),
  });
  const shortlists = useQuery({
    queryKey: ['shortlists', selectedPackage?.id],
    enabled: !!selectedPackage?.id,
    queryFn: () => getJson<TeamShortlist[]>(`/shortlists?packageId=${selectedPackage?.id}`),
  });

  const createProduct = useMutation({
    mutationFn: () => postJson<ProductProfile, ProductProfilePayload>('/products', productForm.values),
    onSuccess: async (product) => {
      productForm.resetForm();
      setSelectedProductId(product.id);
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
  const createRequirement = useMutation({
    mutationFn: () =>
      postJson<RequirementIntake, RequirementPayload>('/requirements', {
        ...requirementForm.values,
        productProfileId: selectedProduct?.id || '',
        businessGoal:
          requirementForm.values.businessGoal ||
          `Productize ${selectedProduct?.name || 'this product'} with verified services, evidence, and launch-ready milestones.`,
      }),
    onSuccess: async (requirement) => {
      requirementForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['requirements'] });
      await queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
      if (!selectedPackage && requirement.id) {
        setPendingRequirementId(requirement.id);
      }
    },
  });
  const buildPackage = useMutation({
    mutationFn: (requirementId: string) => postJson<PackageInstance, Record<string, never>>(`/packages/from-requirement/${requirementId}`, {}),
    onSuccess: async (packageInstance) => {
      setSelectedPackageId(packageInstance.id);
      setPendingRequirementId('');
      await queryClient.invalidateQueries({ queryKey: ['packages'] });
      await queryClient.invalidateQueries({ queryKey: ['requirements'] });
      await queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
    },
  });
  const acceptProposal = useMutation({
    mutationFn: (proposalId: string) =>
      putJson<QuoteProposal, { status: QuoteProposal['status'] }>(`/commerce/proposals/${proposalId}/status`, { status: 'OWNER_ACCEPTED' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['commerce-proposals'] });
    },
  });
  const upsertShortlist = useMutation({
    mutationFn: (payload: ShortlistPayload) => postJson<TeamShortlist, ShortlistPayload>('/shortlists', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['shortlists', selectedPackage?.id] });
    },
  });
  const updateCart = useMutation({
    mutationFn: (payload: CartUpdatePayload) => putJson<ProductizationCart, CartUpdatePayload>('/productization-cart/current', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const addServiceToCart = useMutation({
    mutationFn: (payload: CartServicePayload) => postJson<ProductizationCart, CartServicePayload>('/productization-cart/services', payload),
    onSuccess: async () => {
      setCartNotice('Service added to the draft cart.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const removeServiceFromCart = useMutation({
    mutationFn: (itemId: string) => deleteJson<ProductizationCart>(`/productization-cart/services/${itemId}`),
    onSuccess: async () => {
      setCartNotice('Service removed from the draft cart.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const addTalentToCart = useMutation({
    mutationFn: (payload: CartTalentPayload) => postJson<ProductizationCart, CartTalentPayload>('/productization-cart/talent', payload),
    onSuccess: async () => {
      setCartNotice('Delivery talent added to the draft cart.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const removeTalentFromCart = useMutation({
    mutationFn: (itemId: string) => deleteJson<ProductizationCart>(`/productization-cart/talent/${itemId}`),
    onSuccess: async () => {
      setCartNotice('Delivery talent removed from the draft cart.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const convertCart = useMutation({
    mutationFn: () =>
      postJson<ProductizationCartConvertResponse, CartConvertPayload>('/productization-cart/convert', {
        projectName: projectName || `${selectedProduct?.name || 'Product'} productization workspace`,
      }),
    onSuccess: async (result) => {
      setCartNotice('Project workspace created. Open the workspace to manage milestones, evidence, and participants.');
      setSelectedPackageId(result.packageInstance.id);
      setProjectName('');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
      await queryClient.invalidateQueries({ queryKey: ['packages'] });
      await queryClient.invalidateQueries({ queryKey: ['requirements'] });
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      await queryClient.invalidateQueries({ queryKey: ['workspaces', result.workspace.id, 'milestones'] });
      await queryClient.invalidateQueries({ queryKey: ['shortlists', result.packageInstance.id] });
      await queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
    },
  });
  const createDiagnosis = useMutation({
    mutationFn: () =>
      postJson<ProductDiagnosis, DiagnosisPayload>(`/productization-engine/products/${selectedProduct?.id}/diagnoses`, {
        businessGoal: diagnosisForm.values.businessGoal || requirementForm.values.businessGoal || cart.data?.businessGoal || '',
        currentProblems: diagnosisForm.values.currentProblems || selectedProduct?.riskProfile || '',
        accessSignals: diagnosisForm.values.accessSignals,
        summary: diagnosisForm.values.summary,
      }),
    onSuccess: async () => {
      diagnosisForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProduct?.id, 'diagnoses'] });
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProduct?.id, 'ship-confidence'] });
    },
  });
  const createScannerReadinessDiagnosis = useMutation({
    mutationFn: (payload: ScannerReadinessDiagnosisPayload) =>
      postJson<ProductDiagnosis, ScannerReadinessDiagnosisPayload>(
        `/productization-engine/products/${selectedProduct?.id}/scanner-diagnosis`,
        payload
      ),
    onSuccess: async () => {
      setCartNotice('Scanner findings were mapped to readiness services. Review the diagnosis, then add the right services to the plan.');
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProduct?.id, 'diagnoses'] });
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProduct?.id, 'ship-confidence'] });
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
      await queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
    },
  });
  const generateLaunchReadinessReport = useMutation({
    mutationFn: () => {
      const payload: { workspaceId?: string; focus: string } = {
        focus: 'Give the owner a practical launch, pilot, or paid-beta decision from the current diagnosis, services, scanner proof, and workspace context.',
      };
      if (selectedWorkspace?.id) payload.workspaceId = selectedWorkspace.id;
      return postJson<LaunchReadinessReport, typeof payload>(`/productization-engine/products/${selectedProduct?.id}/launch-readiness-report`, payload);
    },
    onSuccess: async () => {
      setCartNotice('Launch readiness report generated from the latest diagnosis, scanner proof, and service plan.');
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProduct?.id, 'launch-readiness-report'] });
    },
  });
  const refreshRepoSignals = useMutation({
    mutationFn: () => {
      if (!selectedProduct?.id) {
        throw new Error('Select a product before refreshing repo signals.');
      }
      return postJson<RepoSignalSummary, Record<string, never>>(`/products/${selectedProduct.id}/repo-signals/refresh`, {});
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['repo-signals', selectedProduct?.id] });
    },
  });
  const createScanSource = useMutation({
    mutationFn: () => {
      const payload: ScanSourcePayload = {
        productId: selectedProduct?.id || '',
        providerType: scanSourceForm.providerType,
        displayName: scanSourceForm.displayName,
        externalReference: scanSourceForm.externalReference,
        authorizationStatus: scanSourceForm.providerType === 'CI_UPLOAD' || scanSourceForm.authorizationConfirmed ? 'AUTHORIZED' : 'PENDING',
        scopeNote: scanSourceForm.scopeNote,
      };
      if (selectedWorkspace?.id) payload.workspaceId = selectedWorkspace.id;
      return postJson<ScanSource, ScanSourcePayload>('/scanner/sources', payload);
    },
    onSuccess: async (source) => {
      setScannerUploadForm((current) => ({ ...current, sourceId: source.id }));
      setHostedScanForm((current) => ({ ...current, sourceId: source.id }));
      setScanSourceForm((current) => ({ ...current, externalReference: '', authorizationConfirmed: false }));
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });
  const requestConnectorInstall = useMutation({
    mutationFn: (provider: 'github' | 'gitlab') =>
      postJson<ConnectorInstallUrlResponse, { returnPath: string }>(`/scanner/connectors/${provider}/install-url`, {
        returnPath: typeof window === 'undefined' ? '/owner/productization' : window.location.pathname + window.location.search,
      }),
    onSuccess: (response) => {
      if (response.url) {
        window.location.assign(response.url);
      }
    },
  });
  const createProviderSource = useMutation({
    mutationFn: () => {
      const provider = scanSourceForm.providerType === 'GITLAB' ? 'gitlab' : 'github';
      const payload: ProviderSourcePayload = {
        installationId: providerSourceForm.installationId || activeProviderInstallations[0]?.id || '',
        productId: selectedProduct?.id || '',
        repositoryFullName: providerSourceForm.repositoryFullName.trim(),
        defaultBranch: providerSourceForm.defaultBranch.trim() || 'main',
        displayName: scanSourceForm.displayName || providerSourceForm.repositoryFullName,
      };
      if (selectedWorkspace?.id) payload.workspaceId = selectedWorkspace.id;
      if (providerSourceForm.cloneUrl.trim()) payload.cloneUrl = providerSourceForm.cloneUrl.trim();
      return postJson<ScanSource, ProviderSourcePayload>(`/scanner/connectors/${provider}/sources`, payload);
    },
    onSuccess: async (source) => {
      setScannerUploadForm((current) => ({ ...current, sourceId: source.id }));
      setHostedScanForm((current) => ({ ...current, sourceId: source.id }));
      setProviderSourceForm((current) => ({ ...current, repositoryFullName: '', cloneUrl: '' }));
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });
  const uploadScannerEvidence = useMutation({
    mutationFn: () => {
      const payload: ScannerUploadPayload = {
        productId: selectedProduct?.id || '',
        toolName: scannerUploadForm.toolName,
        toolVersion: scannerUploadForm.toolVersion,
        format: scannerUploadForm.format,
        artifactFileName: scannerUploadForm.artifactFileName,
        artifactPayload: scannerUploadForm.artifactPayload,
      };
      if (selectedWorkspace?.id) payload.workspaceId = selectedWorkspace.id;
      if (scannerUploadForm.sourceId) payload.sourceId = scannerUploadForm.sourceId;
      if (scannerUploadForm.milestoneId) payload.milestoneId = scannerUploadForm.milestoneId;
      return postJson<ScanRun, ScannerUploadPayload>('/scanner/runs/ci-upload', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProduct?.id, 'diagnoses'] });
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProduct?.id, 'ship-confidence'] });
      await queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
    },
  });
  const importExternalEvidence = useMutation({
    mutationFn: () => {
      const payload: ExternalImportPayload = {
        productId: selectedProduct?.id || '',
        provider: externalImportForm.provider,
        importMethod: externalImportForm.importMethod,
        toolName: externalImportForm.toolName,
        format: externalImportForm.format,
        artifactPayload: externalImportForm.artifactPayload,
      };
      if (selectedWorkspace?.id) payload.workspaceId = selectedWorkspace.id;
      if (externalImportForm.sourceId) payload.sourceId = externalImportForm.sourceId;
      if (externalImportForm.milestoneId) payload.milestoneId = externalImportForm.milestoneId;
      if (externalImportForm.toolVersion) payload.toolVersion = externalImportForm.toolVersion;
      if (externalImportForm.artifactFileName) payload.artifactFileName = externalImportForm.artifactFileName;
      if (externalImportForm.externalReference) payload.externalReference = externalImportForm.externalReference;
      if (externalImportForm.scopeNote) payload.scopeNote = externalImportForm.scopeNote;
      return postJson('/scanner/imports/external', payload);
    },
    onSuccess: async () => {
      setExternalImportForm((current) => ({ ...current, artifactPayload: '', externalReference: '' }));
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProduct?.id, 'diagnoses'] });
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProduct?.id, 'ship-confidence'] });
      await queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
    },
  });
  const fetchCiTemplate = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({ productId: selectedProduct?.id || '' });
      if (selectedWorkspace?.id) params.set('workspaceId', selectedWorkspace.id);
      if (scannerUploadForm.sourceId) params.set('sourceId', scannerUploadForm.sourceId);
      return getJson<CiTemplateResponse>(`/scanner/ci-templates/${ciTemplateType}?${params.toString()}`);
    },
    onSuccess: (template) => {
      setCiTemplate(template);
    },
  });
  const disconnectScanSource = useMutation({
    mutationFn: (sourceId: string) => postJson<ScanSource, DisconnectSourcePayload>(`/scanner/sources/${sourceId}/disconnect`, {
      reason: deleteArtifactsOnDisconnect ? 'Owner disconnected source and requested scanner artifact deletion from Studio.' : 'Owner disconnected source from Studio.',
      deleteArtifacts: deleteArtifactsOnDisconnect,
    }),
    onSuccess: async () => {
      setDeleteArtifactsOnDisconnect(false);
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });
  const startHostedScan = useMutation({
    mutationFn: () => {
      const payload: HostedScanPayload = {
        productId: selectedProduct?.id || '',
        depth: hostedScanForm.depth,
        toolKeys: hostedScanForm.toolKeys,
        authorizationConfirmed: hostedScanForm.authorizationConfirmed,
        runtimeAuthorizationConfirmed: hostedScanForm.depth === 'RUNTIME_BASELINE' ? hostedScanForm.runtimeAuthorizationConfirmed : false,
        reason: hostedScanForm.reason,
      };
      if (selectedWorkspace?.id) payload.workspaceId = selectedWorkspace.id;
      if (hostedScanForm.sourceId) payload.sourceId = hostedScanForm.sourceId;
      if (hostedScanForm.branchRef.trim()) payload.branchRef = hostedScanForm.branchRef.trim();
      if (hostedScanForm.runtimeTargetUrl.trim()) payload.runtimeTargetUrl = hostedScanForm.runtimeTargetUrl.trim();
      if (hostedScanForm.containerImageRef.trim()) payload.containerImageRef = hostedScanForm.containerImageRef.trim();
      return postJson<ScanRun, HostedScanPayload>('/scanner/runs/hosted', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });
  const startFullHostedScan = useMutation({
    mutationFn: () => {
      const payload: FullHostedScanPayload = {
        productId: selectedProduct?.id || '',
        authorizationConfirmed: hostedScanForm.authorizationConfirmed,
        runtimeAuthorizationConfirmed: hostedScanForm.runtimeAuthorizationConfirmed,
        reason: hostedScanForm.reason,
      };
      if (selectedWorkspace?.id) payload.workspaceId = selectedWorkspace.id;
      if (hostedScanForm.sourceId) payload.sourceId = hostedScanForm.sourceId;
      if (hostedScanForm.branchRef.trim()) payload.branchRef = hostedScanForm.branchRef.trim();
      if (hostedScanForm.runtimeTargetUrl.trim()) payload.runtimeTargetUrl = hostedScanForm.runtimeTargetUrl.trim();
      if (hostedScanForm.containerImageRef.trim()) payload.containerImageRef = hostedScanForm.containerImageRef.trim();
      return postJson<FullHostedScanResponse, FullHostedScanPayload>('/scanner/runs/hosted/full', payload);
    },
    onSuccess: async (response) => {
      setCartNotice(`Full scanner suite queued ${response.queuedToolKeys.length} tool${response.queuedToolKeys.length === 1 ? '' : 's'} across ${response.queuedRuns.length} run${response.queuedRuns.length === 1 ? '' : 's'}.`);
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProduct?.id, 'diagnoses'] });
      await queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProduct?.id, 'ship-confidence'] });
      await queryClient.invalidateQueries({ queryKey: ['repo-signals', selectedProduct?.id] });
      await queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
    },
  });
  const cancelScannerRun = useMutation({
    mutationFn: (runId: string) => postJson<ScanRun, { reason: string }>(`/scanner/runs/${runId}/cancel`, { reason: 'Owner canceled scanner run from Studio.' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });
  const rescanRun = useMutation({
    mutationFn: (runId: string) => postJson<ScanRun, { reason: string }>(`/scanner/runs/${runId}/rescan`, { reason: 'Owner requested rescan after remediation or evidence review.' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });
  const createScannerSchedule = useMutation({
    mutationFn: () => {
      const intervalDays = Number.parseInt(scheduleForm.intervalDays, 10);
      const payload: ScannerSchedulePayload = {
        productId: selectedProduct?.id || '',
        sourceId: hostedScanForm.sourceId,
        depth: hostedScanForm.depth,
        toolKeys: hostedScanForm.toolKeys,
        intervalDays: Number.isFinite(intervalDays) ? intervalDays : 7,
        reason: scheduleForm.reason,
        active: true,
      };
      if (selectedWorkspace?.id) payload.workspaceId = selectedWorkspace.id;
      if (hostedScanForm.branchRef.trim()) payload.branchRef = hostedScanForm.branchRef.trim();
      if (hostedScanForm.runtimeTargetUrl.trim()) payload.runtimeTargetUrl = hostedScanForm.runtimeTargetUrl.trim();
      if (hostedScanForm.containerImageRef.trim()) payload.containerImageRef = hostedScanForm.containerImageRef.trim();
      if (scheduleForm.nextRunAt) payload.nextRunAt = scheduleForm.nextRunAt;
      return postJson('/scanner/schedules', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });
  const updateScannerSchedule = useMutation({
    mutationFn: ({ scheduleId, active }: { scheduleId: string; active: boolean }) =>
      patchJson(`/scanner/schedules/${scheduleId}`, { active }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });
  const updateFindingStatus = useMutation({
    mutationFn: ({ findingId, payload }: { findingId: string; payload: FindingStatusPayload }) =>
      patchJson<NormalizedFinding, FindingStatusPayload>(`/scanner/findings/${findingId}/status`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });
  const openSignedEvidence = useMutation({
    mutationFn: (evidenceId: string) => getJson<SignedArtifactResponse>(`/scanner/evidence/${evidenceId}/artifact-url`),
    onSuccess: (response) => {
      window.open(response.signedUrl, '_blank', 'noopener,noreferrer');
    },
  });
  const createEvidenceExport = useMutation({
    mutationFn: () => postJson<EvidenceExportBundle, { productId: string; workspaceId?: string }>('/scanner/evidence-exports', {
      productId: selectedProduct?.id || '',
      ...(selectedWorkspace?.id ? { workspaceId: selectedWorkspace.id } : {}),
    }),
    onSuccess: async (bundle) => {
      if (bundle.signedUrl) {
        window.open(bundle.signedUrl, '_blank', 'noopener,noreferrer');
      }
      await queryClient.invalidateQueries({ queryKey: ['scanner-summary', selectedProduct?.id] });
    },
  });

  const productProposals = (proposals.data || []).filter((proposal) => proposal.packageInstance?.productProfile?.id === selectedProduct?.id);
  const activeShortlists = (shortlists.data || []).filter((shortlist) => shortlist.status !== 'ARCHIVED');
  const productSupport = (supportRequests.data || []).filter(
    (request) => request.workspace?.packageInstance?.productProfile?.id === selectedProduct?.id
  );
  const recommendedServices = packageModules.data?.length
    ? packageModules.data.map((module) => module.serviceModule)
    : selectedProductRequirements.map((requirement) => requirement.requestedServiceModule).filter(Boolean) as ServiceModule[];
  const cartServiceItems = cart.data?.serviceItems || [];
  const cartTalentItems = cart.data?.talentItems || [];
  const cartServiceIds = new Set(cartServiceItems.map((item) => item.serviceModule.id));
  const cartStartReadiness = cart.data?.startReadiness;
  const cartStartGaps = cartStartReadiness?.gaps || [];
  const cartBlockers = cartStartReadiness?.blockerCount ?? cart.data?.catalogEvaluation?.blockerCount ?? 0;
  const cartBlockingRecommendations = (cart.data?.catalogEvaluation?.recommendations || []).filter(
    (item) => item.severity === 'BLOCKER' && !item.alreadySelected
  );
  const cartBlockingGaps = cartStartGaps.filter((gap) => gap.blocking);
  const canStartProjectWorkspace = !!selectedProduct && (cartStartReadiness?.ready ?? (cartServiceItems.length > 0 && cartBlockers === 0));
  const cartStartContext = cartStartReadiness
    ? {
        status: cartStartReadiness.status,
        ready: cartStartReadiness.ready,
        summary: cartStartReadiness.summary,
        gaps: cartStartGaps.slice(0, 8).map((gap) => ({
          type: gap.type,
          severity: gap.severity,
          title: gap.title,
          description: gap.description,
          serviceModuleId: gap.serviceModule?.id,
          serviceModuleCode: gap.serviceModule?.stableCode || gap.serviceModule?.slug,
        })),
      }
    : undefined;
  const cartStartPromptFacts = `Project start plan: status ${cartStartReadiness?.status || 'not evaluated'}, ready ${cartStartReadiness?.ready ? 'yes' : 'no'}, summary "${cartStartReadiness?.summary || 'not available'}". Selected services: ${cartServiceItems.map((item) => `${item.serviceModule.name}${item.serviceModule.stableCode ? ` (${item.serviceModule.stableCode})` : ''}`).join(', ') || 'none'}. Start gaps: ${cartStartGaps.slice(0, 8).map((gap) => `${gap.title} (${gap.severity}${gap.serviceModule?.stableCode ? `, ${gap.serviceModule.stableCode}` : ''}): ${gap.description || 'no description'}`).join('; ') || 'none'}. Next actions: ${(cartStartReadiness?.nextBestActions || []).join('; ') || 'none'}.`;
  const suggestedTeams = (teams.data || []).slice(0, 3);
  const suggestedExperts = (experts.data || []).filter((expert) => expert.active).slice(0, 3);
  const health = productHealth(selectedProduct, selectedPackage, packageModules.data);
  const latestDiagnosis = diagnoses.data?.[0];
  const latestScannerDiagnosis = (diagnoses.data || []).find((diagnosis) => diagnosis.diagnosisSource === 'SCANNER_READINESS');
  const scannerCounts = scannerSummary.data?.counts;
  const scannerReadiness = scannerSummary.data?.readinessScore ?? (scannerCounts?.total ? 72 : 100);
  const scannerOpenFindings = (scannerSummary.data?.findings || []).filter((finding) => ['NEW', 'OPEN', 'REGRESSED'].includes(finding.status));
  const hasCompletedScannerRun = !!scannerSummary.data?.recentRuns.some((run) => run.status === 'COMPLETED');
  const selectedFinding = (scannerSummary.data?.findings || []).find((finding) => finding.id === selectedFindingId) || scannerOpenFindings[0] || scannerSummary.data?.findings?.[0];
  const selectedFindingOwnerCategory = selectedFinding
    ? ownerCategoryFromSignal(selectedFinding.sourceTool, selectedFinding.readinessArea, selectedFinding.title)
    : 'Product risk';
  const selectedFindingEvidence = (scannerSummary.data?.evidence || []).filter((item) => item.findingId && item.findingId === selectedFinding?.id);
  const selectedFindingReason = selectedFinding ? findingReasonById[selectedFinding.id] || '' : '';
  const selectedFindingReviewDue = selectedFinding ? findingReviewDueById[selectedFinding.id] || '' : '';
  const selectedFindingCanResolve = !!selectedFindingReason.trim();
  const selectedFindingCanAcceptRisk = !!selectedFindingReason.trim() && !!selectedFindingReviewDue;
  const selectedFindingRecommendedInCart = !!selectedFinding?.recommendedModule && cartServiceIds.has(selectedFinding.recommendedModule.id);
  const scannerMappedFindings = latestScannerDiagnosis?.findings || [];
  const scannerMappedServices = Array.from(
    new Set(scannerMappedFindings.map((finding) => finding.recommendedModuleName).filter((name): name is string => Boolean(name)))
  );
  const scannerReadinessPromptFacts = latestScannerDiagnosis
    ? `Scanner ship-readiness map: score ${latestScannerDiagnosis.readinessScore}/100, priority fixes ${latestScannerDiagnosis.topBlockerCount || 0}, proof items ${latestScannerDiagnosis.evidenceCount || 0}, unmapped findings ${latestScannerDiagnosis.unmappedFindingCount || 0}. Mapped services: ${scannerMappedServices.join(', ') || 'none'}. Top mapped findings: ${scannerMappedFindings.slice(0, 6).map((finding) => `${finding.title} (${finding.severity}, ${finding.readinessArea || 'unclassified'}, service ${finding.recommendedModuleName || 'unmapped'}): risk ${finding.businessRisk || finding.description}; proof ${finding.evidenceRequired || 'not recorded'}`).join('; ') || 'none'}.`
    : 'No scanner readiness diagnosis has been generated yet.';
  const diagnosisPromptFacts = latestDiagnosis
    ? `Visible diagnosis facts: readiness score ${latestDiagnosis.readinessScore}/100, status ${formatLabel(latestDiagnosis.status)}, source ${formatLabel(latestDiagnosis.diagnosisSource || 'MANUAL_DETERMINISTIC')}, AI state ${latestDiagnosis.aiExecuted ? 'AI executed' : 'AI context ready'}, finding count ${latestDiagnosis.findings.length}. Diagnosis summary: "${latestDiagnosis.summary || 'not recorded'}". Access signals: "${latestDiagnosis.accessSignals || 'not recorded'}". Top findings: ${latestDiagnosis.findings.slice(0, 6).map((finding) => `${finding.title} (${finding.severity}, ${finding.status}, area ${finding.readinessArea || 'not classified'}, recommended service ${finding.recommendedModuleName || 'not mapped'}): ${finding.businessRisk || finding.description}`).join('; ') || 'none recorded'}. Scanner facts: scanner score ${scannerReadiness}/100 with ${scannerCounts?.critical || 0} critical, ${scannerCounts?.high || 0} high, and ${scannerCounts?.open || 0} open findings; scanner top findings ${scannerOpenFindings.slice(0, 4).map((finding) => `${finding.title} (${finding.severity}, ${finding.status})`).join('; ') || 'none open'}. Ship-confidence history: ${shipConfidence.data?.trendSummary || 'not available yet'} Latest checkpoint: ${shipConfidence.data?.latest ? `${shipConfidence.data.latest.shipConfidenceScore}/100, ${shipConfidence.data.latest.statusLabel}, next step ${shipConfidence.data.latest.suggestedNextStep}` : 'none'}. ${scannerReadinessPromptFacts}`
    : `No deterministic productization diagnosis exists yet for ${selectedProduct?.name || 'this product'}. Ask the owner to run diagnosis before making readiness claims. Scanner facts: scanner score ${scannerReadiness}/100 with ${scannerCounts?.critical || 0} critical, ${scannerCounts?.high || 0} high, and ${scannerCounts?.open || 0} open findings.`;
  const filteredScannerEvidence = (scannerSummary.data?.evidence || []).filter((item) => {
    if (evidenceFilter === 'FINDINGS') return !!item.findingId;
    if (evidenceFilter === 'MILESTONES') return !!item.milestoneId;
    if (evidenceFilter === 'REDACTED') return item.redactionStatus !== 'NONE';
    return true;
  });
  const activeScanRun = scannerSummary.data?.recentRuns.find((run) => run.status === 'QUEUED' || run.status === 'RUNNING');
  const selectedScanSource = (scannerSummary.data?.sources || []).find((source) => source.id === hostedScanForm.sourceId);
  const hostedScanBlockedReason = hostedScanBlockReason(selectedProduct, selectedScanSource, hostedScanForm);
  const fullHostedScanBlockedReason = fullHostedScanBlockReason(selectedProduct, selectedScanSource, hostedScanForm);
  const scannerToolCoverage = scannerSummary.data?.toolCoverage || [];
  const latestCoveredTools = scannerToolCoverage.filter((tool) => !!tool.latestStatus).length;
  const latestCompletedTools = scannerToolCoverage.filter((tool) => tool.latestStatus === 'COMPLETED').length;
  const latestMappedToolFindings = scannerToolCoverage.reduce((total, tool) => total + (tool.mappedFindingCount || 0), 0);
  const unavailableScannerTools = scannerToolCoverage.filter((tool) => tool.enabled && !tool.executableAvailable).length;
  const selectedConnectorPermission = (connectorPermissions.data || []).find((permission) => permission.providerType === scanSourceForm.providerType);
  const activeProviderInstallations = (scannerConnectors.data || []).filter(
    (connector) => connector.providerType === scanSourceForm.providerType && connector.status === 'ACTIVE'
  );
  const scheduleInterval = Number.parseInt(scheduleForm.intervalDays, 10);
  const scheduleBlockedReason = !selectedProduct
    ? 'Select a product first.'
    : !hostedScanForm.sourceId || !selectedScanSource
      ? 'Choose an authorized evidence source before scheduling scans.'
      : selectedScanSource.authorizationStatus !== 'AUTHORIZED'
        ? 'Only authorized evidence sources can be scheduled.'
        : !Number.isFinite(scheduleInterval) || scheduleInterval < 1 || scheduleInterval > 90
          ? 'Use a schedule interval between 1 and 90 days.'
          : '';
  const blockedMilestones = (milestones.data || []).filter((milestone) => milestone.status === 'BLOCKED').length;
  const submittedRequirement = selectedProductRequirements.find((requirement) => requirement.status === 'SUBMITTED' || requirement.status === 'PACKAGE_RECOMMENDED');
  const buildTargetRequirementId = pendingRequirementId || submittedRequirement?.id || '';
  const ownerRiskPool = [
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
  const ownerRiskMap = new Map<string, typeof ownerRiskPool[number]>();
  ownerRiskPool.forEach((risk) => {
    const key = `${risk.title}-${risk.sourceTool || ''}`.toLowerCase();
    if (!ownerRiskMap.has(key) || severityWeight(risk.severity) > severityWeight(ownerRiskMap.get(key)?.severity)) {
      ownerRiskMap.set(key, risk);
    }
  });
  const topOwnerRisks = Array.from(ownerRiskMap.values())
    .sort((left, right) => {
      const severityDelta = severityWeight(right.severity) - severityWeight(left.severity);
      if (severityDelta !== 0) return severityDelta;
      const leftRuntime = ownerCategoryFromSignal(left.sourceTool, left.readinessArea, left.title) === 'Runtime baseline' ? 1 : 0;
      const rightRuntime = ownerCategoryFromSignal(right.sourceTool, right.readinessArea, right.title) === 'Runtime baseline' ? 1 : 0;
      return rightRuntime - leftRuntime;
    })
    .slice(0, 5);
  const launchBlockerCount = latestScannerDiagnosis?.topBlockerCount
    ?? scannerOpenFindings.filter((finding) => finding.severity === 'CRITICAL' || finding.severity === 'HIGH').length;
  const launchImprovementCount = Math.max(
    0,
    (scannerOpenFindings.length || latestMappedToolFindings || scannerCounts?.open || 0) - launchBlockerCount
  );
  const hasLaunchEvidenceContext = !!scannerSummary.data || !!latestDiagnosis || !!launchReadinessReport.data || hasCompletedScannerRun || latestMappedToolFindings > 0;
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
  const verdictRisks: VerdictRisk[] = topOwnerRisks.slice(0, 2).map((risk) => {
    const category = ownerCategoryFromSignal(risk.sourceTool, risk.readinessArea, risk.title);
    return {
      id: risk.id,
      title: risk.title,
      impact: risk.businessRisk || ownerImpactForCategory(category),
      evidence: ownerProofLine({ sourceTool: risk.sourceTool, sourceRuleId: risk.sourceRuleId, category }),
    };
  });
  const scannerCoverageGroups = scannerEvidenceCategories.map((category) => {
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
  const evidenceReadme = (repoSignals.data?.signals || []).find((signal) => signal.signalType === 'DOCUMENTATION')
    || (scannerSummary.data?.evidence || []).find((item) => /readme|documentation/i.test(`${item.title} ${item.summary || ''}`));
  const primarySource = scannerSummary.data?.sources[0];
  const runtimeTarget = hostedScanForm.runtimeTargetUrl || selectedProduct?.productUrl || scannerSummary.data?.sources.find((source) => source.providerType === 'RUNTIME_URL')?.externalReference || '';
  const evidenceSummaryItems = [
    { label: 'Repository', value: selectedProduct?.repositoryUrl || primarySource?.externalReference || 'Not connected', accent: selectedProduct?.repositoryUrl || primarySource ? appleColors.green : appleColors.amber },
    { label: 'Document', value: evidenceReadme ? 'README or documentation evidence found' : 'No README evidence shown', accent: evidenceReadme ? appleColors.green : appleColors.amber },
    { label: 'Runtime', value: runtimeTarget || 'Runtime URL missing', accent: runtimeTarget ? appleColors.green : appleColors.amber },
    { label: 'Scanner suite', value: `${latestCompletedTools}/${scanToolOptions.length} checks completed`, accent: latestCompletedTools === scanToolOptions.length ? appleColors.green : latestCompletedTools ? appleColors.amber : appleColors.muted },
  ];
  const topRecommendedServiceName = scannerMappedServices[0] || selectedPackage?.name || cartServiceItems[0]?.serviceModule.name || '';
  const serviceRiskItems: OwnerServiceRiskSummary[] = topOwnerRisks.slice(0, 3).map((risk, index) => {
    const category = ownerCategoryFromSignal(risk.sourceTool, risk.readinessArea, risk.title);
    return {
      id: risk.id,
      title: risk.title,
      impact: risk.businessRisk || ownerImpactForCategory(category),
      proof: ownerProofLine({ sourceTool: risk.sourceTool, sourceRuleId: risk.sourceRuleId, category }),
      service: risk.recommendedModuleName || (index === 0 ? topRecommendedServiceName : undefined),
    };
  });
  const ownerActionGroups: {
    label: string;
    accent: string;
    items: {
      title: string;
      detail: string;
      action: string;
      proof?: string;
      service?: string;
    }[];
  }[] = [
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
          proof: ownerProofLine({ sourceTool: risk.sourceTool, sourceRuleId: risk.sourceRuleId, category }),
          service: index === 0 ? topRecommendedServiceName : '',
        };
      }),
    },
    {
      label: 'Schedule this week',
      accent: appleColors.purple,
      items: (scannerMappedServices.length ? scannerMappedServices : cartStartGaps.map((gap) => gap.title)).slice(0, 3).map((item) => ({
        title: String(item),
        detail: 'Turn this into planned productization work with a clear owner.',
        action: 'Add or confirm the service in the project start plan.',
      })),
    },
    {
      label: 'Monitor',
      accent: appleColors.cyan,
      items: [
        {
          title: 'Rerun the full evidence check after fixes',
          detail: `${latestCompletedTools}/${scanToolOptions.length} checks currently have completed results.`,
          action: 'Use Findings technical proof to rerun the full suite after remediation.',
        },
        {
          title: 'Export owner proof before sharing externally',
          detail: `${filteredScannerEvidence.length} evidence item${filteredScannerEvidence.length === 1 ? '' : 's'} available for the report.`,
          action: 'Use Findings proof to export stored evidence.',
        },
      ],
    },
  ];
  const rawLaunchBlockerFindings = (scannerSummary.data?.findings || []).filter((finding) =>
    ['CRITICAL', 'HIGH'].includes(finding.severity) && ['NEW', 'OPEN', 'REGRESSED'].includes(finding.status)
  );
  const ownerLaunchBlockerFindings = launchStatus.blockerCount > 0
    ? topOwnerRisks.slice(0, Math.max(1, launchStatus.blockerCount))
    : rawLaunchBlockerFindings;
  const ownerLaunchBlockerIds = new Set(ownerLaunchBlockerFindings.map((finding) => finding.id));
  const groupedFindings = [
    {
      label: 'Launch blockers',
      findings: ownerLaunchBlockerFindings,
      accent: appleColors.red,
    },
    {
      label: 'High-priority technical risks',
      findings: (scannerSummary.data?.findings || []).filter((finding) => !ownerLaunchBlockerIds.has(finding.id) && finding.severity === 'MEDIUM' && ['NEW', 'OPEN', 'REGRESSED', 'INSUFFICIENT_EVIDENCE'].includes(finding.status)),
      accent: appleColors.amber,
    },
    {
      label: 'Medium-priority improvements',
      findings: (scannerSummary.data?.findings || []).filter((finding) => ['LOW', 'INFO'].includes(finding.severity) && ['NEW', 'OPEN', 'REGRESSED', 'INSUFFICIENT_EVIDENCE'].includes(finding.status)),
      accent: appleColors.blue,
    },
    {
      label: 'Resolved or accepted',
      findings: (scannerSummary.data?.findings || []).filter((finding) => ['RESOLVED', 'ACCEPTED_RISK', 'FALSE_POSITIVE'].includes(finding.status)),
      accent: appleColors.green,
    },
  ];
  const workspaceTimeline = [
    { label: 'Product created', status: selectedProduct ? 'Done' : 'Waiting', detail: selectedProduct?.createdAt ? shortDateTime(selectedProduct.createdAt) : selectedProduct?.name || 'Select a product', accent: selectedProduct ? appleColors.green : appleColors.muted },
    { label: 'Repository authorized', status: selectedProduct?.repositoryUrl || primarySource ? 'Done' : 'Needed', detail: selectedProduct?.repositoryUrl || primarySource?.displayName || 'Add repository evidence', accent: selectedProduct?.repositoryUrl || primarySource ? appleColors.green : appleColors.amber },
    { label: 'README attached', status: evidenceReadme ? 'Found' : 'Needed', detail: evidenceReadme ? ('title' in evidenceReadme ? evidenceReadme.title : evidenceReadme.signalValue) : 'Attach documentation evidence', accent: evidenceReadme ? appleColors.green : appleColors.amber },
    { label: 'Scanner suite completed', status: latestCompletedTools === scanToolOptions.length ? 'Done' : 'Partial', detail: `${latestCompletedTools}/${scanToolOptions.length} checks completed`, accent: latestCompletedTools === scanToolOptions.length ? appleColors.green : appleColors.amber },
    { label: 'Findings normalized', status: scannerCounts?.total ? 'Done' : 'Waiting', detail: `${scannerCounts?.total || 0} findings`, accent: scannerCounts?.total ? appleColors.green : appleColors.muted },
    { label: 'Findings mapped', status: latestMappedToolFindings ? 'Done' : 'Needed', detail: `${latestMappedToolFindings} mapped to readiness`, accent: latestMappedToolFindings ? appleColors.green : appleColors.amber },
    { label: 'Service plan', status: selectedPackage ? 'Created' : 'Needed', detail: selectedPackage?.name || 'Create or confirm plan', accent: selectedPackage ? appleColors.green : appleColors.amber },
    { label: 'Workspace', status: selectedWorkspace ? 'Created' : 'Pending', detail: selectedWorkspace?.name || 'Start once plan is ready', accent: selectedWorkspace ? appleColors.green : appleColors.muted },
  ];
  const selectedMilestone = (milestones.data || []).find((milestone) => milestone.status === 'BLOCKED')
    || (milestones.data || []).find((milestone) => milestone.status === 'SUBMITTED' || milestone.status === 'IN_PROGRESS')
    || (milestones.data || [])[0];
  const assistantContext = (pageType: string, overrides: Partial<StudioAssistantContext> = {}): StudioAssistantContext => ({
    pageType,
    productId: selectedProduct?.id,
    packageId: selectedPackage?.id,
    workspaceId: selectedWorkspace?.id,
    startReadiness: cartStartContext,
    ...overrides,
  });
  const assistantActionName = (action: Record<string, unknown>) =>
    assistantRecordText(action, ['name', 'action', 'toolName']).toLowerCase();
  const assistantActionInput = (action: Record<string, unknown>) =>
    action.input && typeof action.input === 'object' && !Array.isArray(action.input)
      ? action.input as Record<string, unknown>
      : {};
  const assistantActionDisabledReason = (action: Record<string, unknown>) => {
    const name = assistantActionName(action);
    if (name.includes('package.build') || name.includes('requirement.submit')) {
      const requirementId = assistantActionInput(action).requirementId;
      return typeof requirementId === 'string' || buildTargetRequirementId ? '' : 'Submit a product brief before building a package.';
    }
    if (name.includes('workspace.create')) {
      if (!(cart.data?.serviceItems || []).length) {
        return 'Add at least one lifecycle service to the draft cart first.';
      }
      if (cartBlockers > 0) {
        return `Add required services first: ${cartBlockingGaps.map((gap) => gap.title).join(', ') || cartBlockingRecommendations.map((item) => item.recommendedModule.name).join(', ')}.`;
      }
      return '';
    }
    if (name.includes('scan.start')) {
      return hostedScanBlockedReason;
    }
    if (name.includes('finding.accept_risk')) {
      return selectedFinding?.id ? '' : 'Select a scanner finding first.';
    }
    return 'This action is not in the confirmed ProdUS execution allowlist yet.';
  };
  const handleAssistantAction = async (action: Record<string, unknown>) => {
    const name = assistantActionName(action);
    const input = assistantActionInput(action);
    if (name.includes('package.build') || name.includes('requirement.submit')) {
      const requirementId = typeof input.requirementId === 'string' && input.requirementId ? input.requirementId : buildTargetRequirementId;
      if (!requirementId) throw new Error('No requirement intake is available for package creation.');
      await buildPackage.mutateAsync(requirementId);
      return;
    }
    if (name.includes('workspace.create')) {
      if (!(cart.data?.serviceItems || []).length) throw new Error('Add lifecycle services to the draft cart before creating a workspace.');
      if (cartBlockers > 0) {
        throw new Error(`Add required services first: ${cartBlockingGaps.map((gap) => gap.title).join(', ') || cartBlockingRecommendations.map((item) => item.recommendedModule.name).join(', ')}.`);
      }
      await convertCart.mutateAsync();
      return;
    }
    if (name.includes('scan.start')) {
      if (hostedScanBlockedReason) throw new Error(hostedScanBlockedReason);
      await startHostedScan.mutateAsync();
      return;
    }
    if (name.includes('finding.accept_risk')) {
      if (!selectedFinding?.id) throw new Error('Select a scanner finding first.');
      await updateFindingStatus.mutateAsync({
        findingId: selectedFinding.id,
        payload: {
          status: 'ACCEPTED_RISK',
          reason: assistantRecordText(action, ['rationale', 'summary'], 'Owner confirmed AI-proposed risk acceptance for review tracking.'),
        },
      });
      return;
    }
    throw new Error('This AI proposed action is not enabled for execution in this surface.');
  };
  const assistantActionProps = {
    onConfirmAction: handleAssistantAction,
    actionDisabledReason: assistantActionDisabledReason,
  };

  useEffect(() => {
    if (!scannerUploadForm.sourceId && scannerSummary.data?.sources[0]?.id) {
      setScannerUploadForm((current) => ({ ...current, sourceId: scannerSummary.data?.sources[0]?.id || '' }));
    }
    if (!hostedScanForm.sourceId && scannerSummary.data?.sources[0]?.id) {
      setHostedScanForm((current) => ({ ...current, sourceId: scannerSummary.data?.sources[0]?.id || '' }));
    }
    if (!externalImportForm.sourceId && scannerSummary.data?.sources[0]?.id) {
      setExternalImportForm((current) => ({ ...current, sourceId: scannerSummary.data?.sources[0]?.id || '' }));
    }
  }, [scannerSummary.data?.sources, scannerUploadForm.sourceId, hostedScanForm.sourceId, externalImportForm.sourceId]);

  const submitProduct = productForm.handleSubmit(() => createProduct.mutate());
  const submitRequirement = requirementForm.handleSubmit(() => {
    if (selectedProduct?.id) {
      requirementForm.setValue('productProfileId', selectedProduct.id);
      createRequirement.mutate();
    }
  });

  const loading = [products, requirements, packages, workspaces, categories, catalogModules, proposals, supportRequests, recommendations, teams, experts, cart, diagnoses, shipConfidence, launchReadinessReport, scannerSummary, repoSignals, scannerConnectors].some((query) => query.isLoading);
  const error = [products, requirements, packages, workspaces, categories, catalogModules, proposals, supportRequests, recommendations, teams, experts, cart, diagnoses, shipConfidence, launchReadinessReport, scannerSummary, repoSignals, scannerConnectors, packageModules, teamRecommendations, milestones, shortlists].find((query) => query.error)?.error
    || createProduct.error
    || createRequirement.error
    || buildPackage.error
    || acceptProposal.error
    || upsertShortlist.error
    || updateCart.error
    || addServiceToCart.error
    || removeServiceFromCart.error
    || addTalentToCart.error
    || removeTalentFromCart.error
    || convertCart.error
    || createDiagnosis.error
    || createScannerReadinessDiagnosis.error
    || generateLaunchReadinessReport.error
    || refreshRepoSignals.error
    || createScanSource.error
    || requestConnectorInstall.error
    || createProviderSource.error
    || uploadScannerEvidence.error
    || importExternalEvidence.error
    || fetchCiTemplate.error
    || disconnectScanSource.error
    || startHostedScan.error
    || cancelScannerRun.error
    || rescanRun.error
    || updateFindingStatus.error
    || openSignedEvidence.error
    || createEvidenceExport.error;

  const recordShortlist = (teamId: string, status: TeamShortlist['status']) => {
    if (!selectedPackage?.id) return;
    upsertShortlist.mutate({
      packageInstanceId: selectedPackage.id,
      teamId,
      status,
      notes: status === 'COMPARED'
        ? 'Owner compared this team against service plan needs, evidence, and commercial readiness.'
        : 'Owner shortlisted this team for productization service plan review.',
    });
  };

  const addLifecycleService = (serviceModule: ServiceModule, categoryName?: string) => {
    if (!selectedProduct?.id) return;
    const businessGoal = `Add ${serviceModule.name} to ${selectedProduct.name} so the product can move toward production-ready delivery.`;
    requirementForm.setValue('requestedServiceModuleId', serviceModule.id);
    requirementForm.setValue('businessGoal', businessGoal);
    if (cart.data?.productProfile?.id !== selectedProduct.id) {
      updateCart.mutate({
        productProfileId: selectedProduct.id,
        title: `${selectedProduct.name} productization plan`,
        businessGoal,
      });
    }
    addServiceToCart.mutate({
      serviceModuleId: serviceModule.id,
      notes: categoryName ? `Owner selected from ${categoryName}.` : 'Owner selected from lifecycle services.',
    });
  };

  const addRecommendationTeamToCart = (recommendation: TeamRecommendation) => {
    addTalentToCart.mutate({
      itemType: 'TEAM',
      teamId: recommendation.team.id,
      notes: `Owner saved team from service plan matching. Match score ${Math.round(recommendation.score * 100)}%.`,
    });
  };

  const addTeamToCart = (team: Team) => {
    addTalentToCart.mutate({
      itemType: 'TEAM',
      teamId: team.id,
      notes: 'Owner saved team from productization workspace recommendations.',
    });
  };

  const addExpertToCart = (expert: ExpertProfile) => {
    addTalentToCart.mutate({
      itemType: 'EXPERT',
      expertProfileId: expert.id,
      notes: 'Owner saved solo expert from productization workspace recommendations.',
    });
  };

  const recordFindingDecision = (finding: NormalizedFinding, status: FindingStatusPayload['status']) => {
    const reason = findingReasonById[finding.id]?.trim();
    const reviewDueOn = findingReviewDueById[finding.id];
    const requiresReason = status === 'RESOLVED' || status === 'ACCEPTED_RISK' || status === 'FALSE_POSITIVE';
    const requiresDueDate = status === 'ACCEPTED_RISK';
    if ((requiresReason && !reason) || (requiresDueDate && !reviewDueOn)) {
      return;
    }
    updateFindingStatus.mutate({
      findingId: finding.id,
      payload: {
        status,
        ...(reason ? { reason } : {}),
        ...(reviewDueOn ? { reviewDueOn } : {}),
      },
    });
  };

  const selectProduct = (productId: string) => {
    setSelectedProductId(productId);
    const product = productList.find((item) => item.id === productId);
    if (product) {
      updateCart.mutate({
        productProfileId: product.id,
        title: `${product.name} productization plan`,
        businessGoal: cart.data?.businessGoal || `Move ${product.name} toward production-ready delivery with selected lifecycle services and verified talent.`,
      });
    }
  };

  const openEvidenceArtifact = (evidence: ScannerEvidenceItem) => {
    if (evidence.storageKey) {
      openSignedEvidence.mutate(evidence.id);
      return;
    }
    if (evidence.artifactRef) {
      window.open(evidence.artifactRef, '_blank', 'noopener,noreferrer');
    }
  };

  useEffect(() => {
    if (productId && productId !== selectedProductId) {
      setSelectedProductId(productId);
    }
  }, [productId, selectedProductId]);

  useEffect(() => {
    if (selectedProduct?.id && cart.data?.status === 'DRAFT' && cart.data.productProfile?.id !== selectedProduct.id && !updateCart.isPending) {
      updateCart.mutate({
        productProfileId: selectedProduct.id,
        title: `${selectedProduct.name} productization plan`,
        businessGoal: cart.data?.businessGoal || `Move ${selectedProduct.name} toward production-ready delivery with selected lifecycle services and verified talent.`,
      });
    }
  }, [cart.data?.businessGoal, cart.data?.productProfile?.id, cart.data?.status, selectedProduct?.id]);

  const searchParamString = searchParams?.toString() || '';

  useEffect(() => {
    const currentParams = new URLSearchParams(searchParamString);
    const tabParam = currentParams.get('tab');
    const viewParam = currentParams.get('view');
    const nextTab = isWorkspaceTabValue(tabParam) ? tabParam : 'overview';

    setWorkspaceTab(nextTab);
    if (isWorkspaceViewValue(nextTab, viewParam)) {
      setWorkspaceDetailOpen(true);
      if (nextTab === 'overview') setOverviewView(viewParam as OverviewJourneyView);
      if (nextTab === 'actions') setActionView(viewParam as ActionJourneyView);
      if (nextTab === 'findings') setFindingsView(viewParam as FindingsJourneyView);
      if (nextTab === 'services') setServicesView(viewParam as ServicesJourneyView);
    } else {
      setWorkspaceDetailOpen(false);
    }
  }, [searchParamString]);

  const pushWorkspaceLocation = (tab: WorkspaceTab, view?: string) => {
    const next = new URLSearchParams(searchParamString);
    next.set('tab', tab);
    if (view) {
      next.set('view', view);
    } else {
      next.delete('view');
    }
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const openWorkspaceArea = (tab: WorkspaceTab) => {
    setWorkspaceTab(tab);
    setWorkspaceDetailOpen(false);
    pushWorkspaceLocation(tab);
  };

  const openWorkspaceDetail = (tab: WorkspaceTab, view: string) => {
    setWorkspaceTab(tab);
    setWorkspaceDetailOpen(true);
    if (tab === 'overview') setOverviewView(view as OverviewJourneyView);
    if (tab === 'actions') setActionView(view as ActionJourneyView);
    if (tab === 'findings') setFindingsView(view as FindingsJourneyView);
    if (tab === 'services') setServicesView(view as ServicesJourneyView);
    pushWorkspaceLocation(tab, view);
  };

  const openActionView = (view: ActionJourneyView) => {
    openWorkspaceDetail('actions', view);
  };

  const openFindingsView = (view: FindingsJourneyView) => {
    openWorkspaceDetail('findings', view);
  };

  const openServicesView = (view: ServicesJourneyView) => {
    openWorkspaceDetail('services', view);
  };

  const overviewJourneyItems: JourneyStepItem<OverviewJourneyView>[] = [
    {
      value: 'decision',
      label: 'Decision',
      detail: 'Verdict, blockers, top actions, proof summary.',
      accent: launchStatus.accent,
      meta: <PastelChip label={launchStatus.confidence} accent={launchStatus.accent} bg={`${launchStatus.accent}12`} />,
    },
    {
      value: 'progress',
      label: 'Progress',
      detail: 'Confidence history and the shareable readiness report.',
      accent: appleColors.cyan,
      meta: <PastelChip label={launchReadinessReport.data ? 'Report ready' : 'Report'} accent={appleColors.cyan} bg="#e4f9fd" />,
    },
  ];

  const actionJourneyItems: JourneyStepItem<ActionJourneyView>[] = [
    {
      value: 'plan',
      label: 'Action plan',
      detail: 'Do now, schedule next, and monitor after launch.',
      accent: appleColors.purple,
      meta: <PastelChip label={`${launchStatus.blockerCount} blockers`} accent={launchStatus.blockerCount ? appleColors.red : appleColors.green} bg={launchStatus.blockerCount ? '#fff1f2' : '#e7f8ee'} />,
    },
    {
      value: 'diagnosis',
      label: 'Diagnosis',
      detail: 'Stored owner brief, mapped rough edges, and AI explanation.',
      accent: appleColors.blue,
      meta: <PastelChip label={latestDiagnosis ? `${latestDiagnosis.findings.length} findings` : 'Not run'} accent={latestDiagnosis ? appleColors.amber : appleColors.blue} />,
    },
  ];

  const findingsJourneyItems: JourneyStepItem<FindingsJourneyView>[] = [
    {
      value: 'risks',
      label: 'Owner risks',
      detail: 'Plain-language launch risks before raw scanner detail.',
      accent: appleColors.amber,
      meta: <PastelChip label={`${topOwnerRisks.length} risks`} accent={topOwnerRisks.length ? appleColors.amber : appleColors.green} bg={topOwnerRisks.length ? '#fff4dc' : '#e7f8ee'} />,
    },
    {
      value: 'evidence',
      label: 'Stored proof',
      detail: 'Authorized sources, evidence exports, and repo readout.',
      accent: appleColors.cyan,
      meta: <PastelChip label={`${filteredScannerEvidence.length} proof`} accent={appleColors.cyan} bg="#e4f9fd" />,
    },
    {
      value: 'technical',
      label: 'Technical proof',
      detail: 'Scanner operations, fix path, decisions, and reruns.',
      accent: appleColors.green,
      meta: <PastelChip label={`${scannerCounts?.total || 0} findings`} accent={scannerOpenFindings.length ? appleColors.amber : appleColors.green} bg={scannerOpenFindings.length ? '#fff4dc' : '#e7f8ee'} />,
    },
  ];

  const servicesJourneyItems: JourneyStepItem<ServicesJourneyView>[] = [
    {
      value: 'recommend',
      label: 'Recommended service',
      detail: 'Pick the work that answers the launch verdict.',
      accent: appleColors.purple,
      meta: <PastelChip label={`${categories.data?.length || 0} families`} accent={appleColors.purple} />,
    },
    {
      value: 'plan',
      label: 'Service plan',
      detail: 'Turn the selected work into a scoped owner-ready plan.',
      accent: appleColors.blue,
      meta: <PastelChip label={selectedPackage ? 'Plan exists' : 'Draft'} accent={selectedPackage ? appleColors.green : appleColors.amber} bg={selectedPackage ? '#e7f8ee' : '#fff4dc'} />,
    },
    {
      value: 'team',
      label: 'Team match',
      detail: 'Compare teams, experts, workspace handoff, and risk.',
      accent: appleColors.cyan,
      meta: <PastelChip label={`${teamRecommendations.data?.length || 0} matches`} accent={appleColors.cyan} bg="#e4f9fd" />,
    },
  ];
  const currentJourneyItems: JourneyStepItem<string>[] =
    workspaceTab === 'overview'
      ? overviewJourneyItems
      : workspaceTab === 'actions'
        ? actionJourneyItems
        : workspaceTab === 'findings'
          ? findingsJourneyItems
          : servicesJourneyItems;
  const currentJourneyValue: string =
    workspaceTab === 'overview'
      ? overviewView
      : workspaceTab === 'actions'
        ? actionView
        : workspaceTab === 'findings'
          ? findingsView
          : servicesView;
  const currentAreaLabel = workspaceTabs.find((tab) => tab.value === workspaceTab)?.label || 'Workspace';
  const currentDetailLabel = currentJourneyItems.find((item) => item.value === currentJourneyValue)?.label || currentAreaLabel;

  return (
    <>
      <PageHeader
        title="Productization Workspace"
        description="One product-centered command surface for lifecycle service selection, draft cart decisions, team comparison, and delivery evidence."
        action={
          productList.length ? (
            <TextField
              select
              size="small"
              label="Product"
              value={selectedProduct?.id || ''}
              onChange={(event) => selectProduct(event.target.value)}
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
      <QueryState isLoading={loading} error={error} />

      {selectedProduct && hasLaunchEvidenceContext && (
        <Box sx={{ mb: 2.5 }}>
          <OwnerReadinessVerdictReveal
            productName={selectedProduct.name}
            launchStatus={launchStatus}
            risks={verdictRisks}
            completedChecks={latestCompletedTools}
            totalChecks={scanToolOptions.length}
            onSeePlan={() => launchStatus.blockerCount ? openActionView('plan') : openServicesView('recommend')}
            onViewProof={() => openFindingsView('technical')}
          />
        </Box>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 340px' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          {selectedProduct ? (
            <OwnerWorkspaceProductHero
              product={selectedProduct}
              launchStatus={launchStatus}
              topOwnerRisks={topOwnerRisks}
              evidenceSummaryItems={evidenceSummaryItems}
              onPrimaryAction={() => topOwnerRisks.length ? openActionView('plan') : openServicesView('recommend')}
              onViewProof={() => openFindingsView('technical')}
              onExportReport={() => createEvidenceExport.mutate()}
              isExporting={createEvidenceExport.isPending}
            />
          ) : (
            <EmptyState label="Create a product profile to start the owner productization workflow." />
          )}

          <Surface sx={{ p: { xs: 1, md: 1 }, boxShadow: 'none', position: { xl: 'sticky' }, top: { xl: 76 }, zIndex: 2 }}>
            <Tabs
              value={workspaceTab}
              onChange={(_, value) => openWorkspaceArea(value as WorkspaceTab)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 44,
                '& .MuiTab-root': {
                  minHeight: 44,
                  textTransform: 'none',
                  fontWeight: 850,
                  letterSpacing: 0,
                  borderRadius: 1,
                },
              }}
            >
              {workspaceTabs.map((tab) => (
                <Tab key={tab.value} value={tab.value} label={tab.label} />
              ))}
            </Tabs>
          </Surface>

          {selectedProduct && (
            workspaceDetailOpen ? (
              <WorkspaceBreadcrumbs
                items={[
                  { label: 'Workspace', onClick: () => openWorkspaceArea('overview') },
                  { label: selectedProduct.name, onClick: () => openWorkspaceArea('overview') },
                  { label: currentAreaLabel, onClick: () => openWorkspaceArea(workspaceTab) },
                  { label: currentDetailLabel },
                ]}
                backLabel={`${currentAreaLabel} hub`}
                onBack={() => openWorkspaceArea(workspaceTab)}
              />
            ) : (
              <OwnerWorkspaceJourneyNav
                label={`${currentAreaLabel} hub`}
                value={currentJourneyValue}
                items={currentJourneyItems}
                onChange={(value) => openWorkspaceDetail(workspaceTab, value)}
              />
            )
          )}

          {selectedProduct && workspaceTab === 'overview' && (
            <Stack spacing={2.5}>
              <OwnerLaunchReadyCelebration
                readinessScore={launchStatus.score}
                blockerCount={launchStatus.blockerCount}
                improvementCount={launchStatus.improvementCount}
                completedChecks={latestCompletedTools}
                totalChecks={scanToolOptions.length}
                isGenerating={generateLaunchReadinessReport.isPending}
                onGenerateReport={() => generateLaunchReadinessReport.mutate()}
              />

              {workspaceDetailOpen && overviewView === 'decision' && (
                <OwnerOverviewDecisionPanel
                  launchStatus={launchStatus}
                  latestCompletedTools={latestCompletedTools}
                  totalScanTools={scanToolOptions.length}
                  topRecommendedServiceName={topRecommendedServiceName}
                  topOwnerRisks={topOwnerRisks}
                  ownerActionGroups={ownerActionGroups}
                  scannerCoverageGroups={scannerCoverageGroups}
                  selectedPackage={selectedPackage}
                  scannerMappedServices={scannerMappedServices}
                  onOpenServicesRecommend={() => openServicesView('recommend')}
                  onOpenServicesPlan={() => openServicesView('plan')}
                  onOpenFindingsEvidence={() => openFindingsView('evidence')}
                  onOpenFindingsRisks={() => openFindingsView('risks')}
                  onOpenTimeline={() => setTimelineOpen(true)}
                />
              )}
            </Stack>
          )}

          {selectedProduct && workspaceTab === 'actions' && workspaceDetailOpen && actionView === 'plan' && (
            <OwnerActionPlanPanel
              ownerActionGroups={ownerActionGroups}
              onOpenServicesRecommend={() => openServicesView('recommend')}
            />
          )}

          {selectedProduct && workspaceTab === 'findings' && workspaceDetailOpen && findingsView === 'risks' && (
            <OwnerFindingsRiskPanel
              groups={groupedFindings}
              totalFindingCount={scannerSummary.data?.findings.length || 0}
              openGroups={openFindingGroups}
              onGroupToggle={(label, expanded) => setOpenFindingGroups((current) => ({ ...current, [label]: expanded }))}
              onReviewFinding={(findingId) => {
                setSelectedFindingId(findingId);
                setFindingDrawerOpen(true);
              }}
              onOpenTechnicalProof={() => openFindingsView('technical')}
            />
          )}

          {selectedProduct && workspaceTab === 'findings' && workspaceDetailOpen && findingsView === 'evidence' && (
            <OwnerFindingsEvidencePanel
              summaryItems={evidenceSummaryItems}
              sources={scannerSummary.data?.sources || []}
              evidence={filteredScannerEvidence}
              evidenceFilter={evidenceFilter}
              isExporting={createEvidenceExport.isPending}
              isOpeningEvidence={openSignedEvidence.isPending}
              onEvidenceFilterChange={setEvidenceFilter}
              onExport={() => createEvidenceExport.mutate()}
              onOpenEvidence={openEvidenceArtifact}
              formatDateTime={shortDateTime}
            />
          )}

          {selectedProduct && workspaceTab === 'findings' && workspaceDetailOpen && findingsView === 'evidence' && (
            <RepoReadoutPanel
              summary={repoSignals.data}
              scannerSummary={scannerSummary.data}
              isFetching={repoSignals.isFetching}
              isRefreshing={refreshRepoSignals.isPending}
              onRefresh={() => refreshRepoSignals.mutate()}
            />
          )}

          {selectedProduct && workspaceTab === 'actions' && workspaceDetailOpen && actionView === 'diagnosis' && (
            <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)' }}>
              <SectionTitle
                title="Product Diagnosis"
                action={<PastelChip label={latestDiagnosis ? `${latestDiagnosis.findings.length} findings` : 'Not run'} accent={latestDiagnosis ? appleColors.amber : appleColors.purple} />}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '320px minmax(0, 1fr)' }, gap: 2 }}>
                <Box component="form" onSubmit={diagnosisForm.handleSubmit(() => createDiagnosis.mutate())}>
                  <Stack spacing={1.25}>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      Turn the owner brief into a practical launch-readiness view. This is deterministic and stored; AI explanation only runs when you ask for it.
                    </Typography>
                    <TextField
                      size="small"
                      label="Launch goal"
                      value={diagnosisForm.values.businessGoal}
                      onChange={(event) => diagnosisForm.setValue('businessGoal', event.target.value)}
                    />
                    <TextField
                      size="small"
                      label="Known rough edges"
                      value={diagnosisForm.values.currentProblems}
                      onChange={(event) => diagnosisForm.setValue('currentProblems', event.target.value)}
                      multiline
                    />
                    <TextField
                      size="small"
                      label="Repo / app signals"
                      placeholder="Repo available, staging missing, no monitoring, payment flow exists..."
                      value={diagnosisForm.values.accessSignals}
                      onChange={(event) => diagnosisForm.setValue('accessSignals', event.target.value)}
                      multiline
                    />
                    <Button type="submit" variant="contained" disabled={createDiagnosis.isPending} sx={{ minHeight: 42 }}>
                      Map rough edges
                    </Button>
                  </Stack>
                </Box>
                <Stack spacing={1.25}>
                  {latestDiagnosis ? (
                    <>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between">
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{ width: 54, height: 54, borderRadius: 1, bgcolor: '#f8f7ff', color: appleColors.purple, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            <FactCheckOutlined />
                          </Box>
                          <Box>
                            <Typography variant="h4">{latestDiagnosis.productName}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{latestDiagnosis.summary}</Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent={{ sm: 'flex-end' }}>
                          <PastelChip label={formatLabel(latestDiagnosis.diagnosisSource || 'MANUAL_DETERMINISTIC')} accent={latestDiagnosis.diagnosisSource === 'SCANNER_READINESS' ? appleColors.green : appleColors.blue} bg={latestDiagnosis.diagnosisSource === 'SCANNER_READINESS' ? '#e7f8ee' : '#eaf3ff'} />
                          <PastelChip label={latestDiagnosis.aiExecuted ? 'AI analyzed' : 'AI context ready'} accent={appleColors.blue} bg="#eaf3ff" />
                        </Stack>
                      </Stack>
                      {latestDiagnosis.diagnosisSource === 'SCANNER_READINESS' && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
                          <MetricTile label="Priority fixes" value={latestDiagnosis.topBlockerCount || 0} detail="Critical/high scanner findings" accent={(latestDiagnosis.topBlockerCount || 0) ? appleColors.red : appleColors.green} icon={<BugReportOutlined />} />
                          <MetricTile label="Proof linked" value={latestDiagnosis.evidenceCount || 0} detail="Scanner proof items" accent={appleColors.cyan} icon={<ArticleOutlined />} />
                          <MetricTile label="Unmapped" value={latestDiagnosis.unmappedFindingCount || 0} detail="Need human classification" accent={(latestDiagnosis.unmappedFindingCount || 0) ? appleColors.amber : appleColors.green} icon={<InfoOutlined />} />
                        </Box>
                      )}
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
                        {latestDiagnosis.findings.map((finding) => {
                          const recommendedModule = (catalogModules.data || []).find((module) => module.id === finding.recommendedModuleId);
                          const inCart = !!recommendedModule && cartServiceIds.has(recommendedModule.id);
                          return (
                            <Box key={finding.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.25, bgcolor: '#fff' }}>
                              <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontWeight: 900 }}>{finding.title}</Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>{finding.businessRisk || finding.description}</Typography>
                                </Box>
                                <StatusChip label={finding.severity} color={finding.severity === 'CRITICAL' || finding.severity === 'HIGH' ? 'error' : 'warning'} />
                              </Stack>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                                <PastelChip label={finding.confidenceLevel} accent={appleColors.cyan} bg="#e4f9fd" />
                                {finding.readinessArea && <PastelChip label={finding.readinessArea} accent={appleColors.green} bg="#e7f8ee" />}
                                {finding.recommendedModuleName && <PastelChip label={finding.recommendedModuleName} accent={appleColors.purple} />}
                              </Stack>
                              {(finding.ownerDecision || finding.evidenceRequired) && (
                                <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
                                  {finding.ownerDecision && (
                                    <Box sx={{ p: 1, borderRadius: 1, border: '1px solid', borderColor: '#dbeafe', bgcolor: '#fbfdff' }}>
                                      <Typography variant="caption" color="text.secondary">Owner decision</Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.45 }}>{finding.ownerDecision}</Typography>
                                    </Box>
                                  )}
                                  {finding.evidenceRequired && (
                                    <Box sx={{ p: 1, borderRadius: 1, border: '1px solid', borderColor: '#dcfce7', bgcolor: '#fbfffd' }}>
                                      <Typography variant="caption" color="text.secondary">Proof needed</Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.45 }}>{finding.evidenceRequired}</Typography>
                                    </Box>
                                  )}
                                </Box>
                              )}
                              {recommendedModule && (
                                <Button
                                  variant={inCart ? 'outlined' : 'contained'}
                                  size="small"
                                  disabled={inCart || addServiceToCart.isPending}
                                  onClick={() => addLifecycleService(recommendedModule, 'Diagnosis')}
                                  sx={{ mt: 1.25, minHeight: 36 }}
                                >
                                  {inCart ? 'Service in plan' : 'Add recommended service'}
                                </Button>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    </>
                  ) : (
                    <EmptyState label="No product diagnosis yet. Add the launch goal and map the rough edges." />
                  )}
                </Stack>
              </Box>
              <Box sx={{ mt: 2 }}>
                <StudioAssistantCard
                  title="Ask AI About This Diagnosis"
                  description="Translate the diagnosis into practical fixes, tradeoffs, and the next owner decision."
                  prompt={`Do not call tools for this answer. Explain the productization diagnosis for ${selectedProduct.name} using these visible facts directly. ${diagnosisPromptFacts} Focus on the ship-readiness score, priority fixes, recommended lifecycle services, scanner signals, and the next owner decision. Do not certify production readiness; call out where human review is needed.`}
                  conversationId={`studio-diagnosis-${selectedProduct.id}`}
                  context={assistantContext('product-diagnosis')}
                  {...assistantActionProps}
                  accent={appleColors.purple}
                  cta="Ask AI"
                />
              </Box>
            </Surface>
          )}

          {selectedProduct && workspaceTab === 'overview' && workspaceDetailOpen && overviewView === 'progress' && (
            <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f9fcff 100%)' }}>
              <ShipConfidencePanel
                history={shipConfidence.data}
                isLoading={shipConfidence.isFetching}
                title="Ship Confidence History"
                subtitle="Every diagnosis and scanner map becomes a checkpoint, so this prototype has a visible path from rough edges to ready-to-ship."
                showScoreRing={false}
              />
            </Surface>
          )}

          {selectedProduct && workspaceTab === 'overview' && workspaceDetailOpen && overviewView === 'progress' && (
            <LaunchReadinessReportPanel
              report={launchReadinessReport.data ?? null}
              isLoading={launchReadinessReport.isFetching}
              isGenerating={generateLaunchReadinessReport.isPending}
              onGenerate={() => generateLaunchReadinessReport.mutate()}
              title="Launch Readiness Report"
              subtitle="Create a shareable snapshot for the next pilot, paid beta, customer demo, or launch decision. This is deterministic and only updates when you generate it."
            />
          )}

          {selectedProduct && workspaceTab === 'findings' && workspaceDetailOpen && findingsView === 'technical' && (
            <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f6fffb 100%)' }}>
              <ScannerProofRunway
                scannerReadiness={scannerReadiness}
                criticalCount={scannerCounts?.critical || 0}
                highCount={scannerCounts?.high || 0}
                openFindingCount={scannerCounts?.open || 0}
                sourceCount={scannerSummary.data?.sources.length || 0}
                evidenceCount={filteredScannerEvidence.length}
                latestCoveredTools={latestCoveredTools}
                totalTools={scanToolOptions.length}
                normalizedFindingCount={scannerCounts?.total || 0}
                activeScanRun={Boolean(activeScanRun)}
                fullSuiteBlockedReason={fullHostedScanBlockedReason}
                isStartingFullSuite={startFullHostedScan.isPending}
                isExporting={createEvidenceExport.isPending}
                onRunFullSuite={() => startFullHostedScan.mutate()}
                onReviewBlockers={() => openFindingsView('risks')}
                onExportProof={() => createEvidenceExport.mutate()}
              />

              <ScannerCoverageGrid
                tools={scannerToolCoverage}
                latestCoveredTools={latestCoveredTools}
                totalTools={scanToolOptions.length}
                latestMappedToolFindings={latestMappedToolFindings}
                unavailableScannerTools={unavailableScannerTools}
              />

              <ScannerFixPathPanel
                diagnosis={latestScannerDiagnosis}
                mappedFindings={scannerMappedFindings}
                mappedServiceNames={scannerMappedServices}
                serviceModules={catalogModules.data || []}
                cartServiceIds={cartServiceIds}
                hasCompletedScannerRun={hasCompletedScannerRun}
                isRefreshing={createScannerReadinessDiagnosis.isPending}
                isAddingService={addServiceToCart.isPending}
                onRefreshMap={() =>
                  createScannerReadinessDiagnosis.mutate({
                    ...(selectedWorkspace?.id ? { workspaceId: selectedWorkspace.id } : {}),
                    createServiceRecommendations: true,
                    includeAcceptedRisk: false,
                    summary: `Scanner-backed readiness map for ${selectedProduct.name}.`,
                  })
                }
                onAddService={addLifecycleService}
              />

              <Box sx={{ mb: 2 }}>
                <StudioAssistantCard
                  title="AI Fix Path Summary"
                  description="Summarize scanner findings, explain the highest-risk fixes, and turn proof into practical productization actions."
                  prompt={`Do not call write actions for this answer. Summarize scanner ship-readiness for ${selectedProduct.name}. Current scanner score is ${scannerReadiness}/100 with ${scannerCounts?.critical || 0} critical, ${scannerCounts?.high || 0} high, and ${scannerCounts?.open || 0} open findings. Top visible findings: ${scannerOpenFindings.slice(0, 4).map((finding) => `${finding.title} (${finding.severity}, ${finding.status})`).join('; ') || 'none'}. ${scannerReadinessPromptFacts} Prioritize critical and high findings, explain the business risk in plain language, identify missing proof, and recommend lifecycle services or milestone actions. Use the provided context and visible facts directly. Avoid raw artifact details.`}
                  conversationId={`studio-scanner-${selectedProduct.id}-${selectedFinding?.id || 'summary'}`}
                  context={assistantContext('scanner-readiness', { findingId: selectedFinding?.id })}
                  {...assistantActionProps}
                  accent={scannerOpenFindings.length ? appleColors.amber : appleColors.green}
                  cta="Summarize Fixes"
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '360px minmax(0, 1fr)' }, gap: 2 }}>
                <Stack spacing={2}>
                  <Box component="form" onSubmit={(event) => {
                    event.preventDefault();
                    if (selectedProduct && scanSourceForm.displayName.trim()) createScanSource.mutate();
                  }}>
                    <Stack spacing={1.25}>
                      <Typography sx={{ fontWeight: 900 }}>Connect evidence source</Typography>
                      <TextField
                        select
                        size="small"
                        label="Source type"
                        value={scanSourceForm.providerType}
                        onChange={(event) => setScanSourceForm((current) => ({ ...current, providerType: event.target.value as ScanSource['providerType'] }))}
                      >
                        <MenuItem value="GITHUB">GitHub</MenuItem>
                        <MenuItem value="GITLAB">GitLab</MenuItem>
                        <MenuItem value="CI_UPLOAD">CI upload</MenuItem>
                        <MenuItem value="RUNTIME_URL">Runtime URL</MenuItem>
                        <MenuItem value="EXTERNAL_TOOL">External tool</MenuItem>
                      </TextField>
                      {selectedConnectorPermission && (
                        <Box sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: '#dbeafe', bgcolor: '#f8fbff' }}>
                          <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 900 }}>{selectedConnectorPermission.label}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.35, lineHeight: 1.45 }}>
                                {selectedConnectorPermission.purpose}
                              </Typography>
                            </Box>
                            {selectedConnectorPermission.appConnectorPreferred && <PastelChip label="App Preferred" accent={appleColors.purple} />}
                          </Stack>
                          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                            {selectedConnectorPermission.permissions.map((permission) => (
                              <PastelChip key={permission} label={permission} accent={appleColors.cyan} bg="#e8f8ff" />
                            ))}
                          </Stack>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, lineHeight: 1.45 }}>
                            {selectedConnectorPermission.operatingNote}
                          </Typography>
                        </Box>
                      )}
                      {(scanSourceForm.providerType === 'GITHUB' || scanSourceForm.providerType === 'GITLAB') && (
                        <Box sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: '#e7e4ff', bgcolor: '#fbfaff' }}>
                          <Stack spacing={1}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                                  {scanSourceForm.providerType === 'GITHUB' ? 'GitHub App connection' : 'GitLab project connection'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Connect once, then attach repository sources to this product with an auditable installation record.
                                </Typography>
                              </Box>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<OpenInNewOutlined />}
                                onClick={() => requestConnectorInstall.mutate(scanSourceForm.providerType === 'GITHUB' ? 'github' : 'gitlab')}
                                disabled={requestConnectorInstall.isPending}
                                sx={{ minHeight: 36, minWidth: 154 }}
                              >
                                Connect App
                              </Button>
                            </Stack>
                            {activeProviderInstallations.length ? (
                              <>
                                <TextField
                                  select
                                  size="small"
                                  label="Connected account"
                                  value={providerSourceForm.installationId || activeProviderInstallations[0]?.id || ''}
                                  onChange={(event) => setProviderSourceForm((current) => ({ ...current, installationId: event.target.value }))}
                                >
                                  {activeProviderInstallations.map((installation) => (
                                    <MenuItem key={installation.id} value={installation.id}>
                                      {installation.accountLogin || installation.externalInstallationId} · {formatLabel(installation.providerType)}
                                    </MenuItem>
                                  ))}
                                </TextField>
                                <TextField
                                  size="small"
                                  label="Repository full name"
                                  placeholder={scanSourceForm.providerType === 'GITHUB' ? 'owner/repository' : 'group/project'}
                                  value={providerSourceForm.repositoryFullName}
                                  onChange={(event) => setProviderSourceForm((current) => ({ ...current, repositoryFullName: event.target.value }))}
                                />
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' }, gap: 1 }}>
                                  <TextField
                                    size="small"
                                    label="Default branch"
                                    value={providerSourceForm.defaultBranch}
                                    onChange={(event) => setProviderSourceForm((current) => ({ ...current, defaultBranch: event.target.value }))}
                                  />
                                  <TextField
                                    size="small"
                                    label="Clone URL override"
                                    placeholder="Optional. Leave empty for standard provider HTTPS URL."
                                    value={providerSourceForm.cloneUrl}
                                    onChange={(event) => setProviderSourceForm((current) => ({ ...current, cloneUrl: event.target.value }))}
                                  />
                                </Box>
                                <Button
                                  variant="contained"
                                  startIcon={<AddOutlined />}
                                  disabled={!selectedProduct || !providerSourceForm.repositoryFullName.trim() || !(providerSourceForm.installationId || activeProviderInstallations[0]?.id) || createProviderSource.isPending}
                                  onClick={() => createProviderSource.mutate()}
                                  sx={{ minHeight: 42 }}
                                >
                                  Add Repository Source
                                </Button>
                              </>
                            ) : (
                              <Alert severity="info" sx={{ borderRadius: 1 }}>
                                No active {formatLabel(scanSourceForm.providerType)} connector is attached yet. Manual source entry still works for public repositories and CI imports.
                              </Alert>
                            )}
                          </Stack>
                        </Box>
                      )}
                      <TextField
                        size="small"
                        label="Display name"
                        value={scanSourceForm.displayName}
                        onChange={(event) => setScanSourceForm((current) => ({ ...current, displayName: event.target.value }))}
                      />
                      <TextField
                        size="small"
                        label="Reference"
                        placeholder="Repository, pipeline, or scanner URL"
                        value={scanSourceForm.externalReference}
                        onChange={(event) => setScanSourceForm((current) => ({ ...current, externalReference: event.target.value }))}
                      />
                      <TextField
                        size="small"
                        label="Scope note"
                        value={scanSourceForm.scopeNote}
                        onChange={(event) => setScanSourceForm((current) => ({ ...current, scopeNote: event.target.value }))}
                        multiline
                        minRows={2}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={scanSourceForm.authorizationConfirmed}
                            onChange={(event) => setScanSourceForm((current) => ({ ...current, authorizationConfirmed: event.target.checked }))}
                          />
                        }
                        label={
                          <Typography variant="body2" color="text.secondary">
                            I confirm this source is authorized for scanner evidence collection.
                          </Typography>
                        }
                      />
                      <Button
                        type="submit"
                        variant="outlined"
                        startIcon={<AddOutlined />}
                        disabled={!selectedProduct || !scanSourceForm.displayName.trim() || createScanSource.isPending}
                        sx={{ minHeight: 42 }}
                      >
                        Save Source
                      </Button>
                    </Stack>
                  </Box>

                  <Divider />

                  <Box component="form" onSubmit={(event) => {
                    event.preventDefault();
                    if (!hostedScanBlockedReason && !activeScanRun) startHostedScan.mutate();
                  }}>
                    <Stack spacing={1.25}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                        <Typography sx={{ fontWeight: 900 }}>Run governed scan</Typography>
                        {activeScanRun && <StatusChip label={activeScanRun.status} color={activeScanRun.status === 'RUNNING' ? 'warning' : 'default'} />}
                      </Stack>
                      <TextField
                        select
                        size="small"
                        label="Evidence source"
                        value={hostedScanForm.sourceId}
                        onChange={(event) => setHostedScanForm((current) => ({ ...current, sourceId: event.target.value }))}
                      >
                        <MenuItem value="">Use product repository / target</MenuItem>
                        {(scannerSummary.data?.sources || []).map((source) => (
                          <MenuItem key={source.id} value={source.id}>
                            {source.displayName} · {formatLabel(source.authorizationStatus)}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        select
                        size="small"
                        label="Scan depth"
                        value={hostedScanForm.depth}
                        onChange={(event) => {
                          const depth = event.target.value as ScanRun['depth'];
                          setHostedScanForm((current) => ({ ...current, depth, toolKeys: defaultToolsForDepth(depth) }));
                        }}
                      >
                        <MenuItem value="SAFE_STATIC">L1 Safe static</MenuItem>
                        <MenuItem value="DEPENDENCY_CONTAINER">L2 Dependency / container</MenuItem>
                        <MenuItem value="RUNTIME_BASELINE">L3 Runtime baseline</MenuItem>
                      </TextField>
                      <TextField
                        select
                        size="small"
                        label="Scanner tools"
                        value={hostedScanForm.toolKeys}
                        SelectProps={{ multiple: true }}
                        onChange={(event) => {
                          const value = event.target.value;
                          setHostedScanForm((current) => ({
                            ...current,
                            toolKeys: typeof value === 'string' ? value.split(',') : value as string[],
                          }));
                        }}
                      >
                        {scanToolOptions
                          .filter((tool) => (tool.depths as readonly string[]).includes(hostedScanForm.depth))
                          .map((tool) => (
                            <MenuItem key={tool.key} value={tool.key}>{tool.label}</MenuItem>
                          ))}
                      </TextField>
                      {hostedScanForm.depth === 'SAFE_STATIC' && (
                        <TextField
                          size="small"
                          label="Branch"
                          value={hostedScanForm.branchRef}
                          onChange={(event) => setHostedScanForm((current) => ({ ...current, branchRef: event.target.value }))}
                        />
                      )}
                      {hostedScanForm.depth === 'DEPENDENCY_CONTAINER' && (
                        <TextField
                          size="small"
                          label="Container image"
                          placeholder="registry.example.com/app:sha"
                          value={hostedScanForm.containerImageRef}
                          onChange={(event) => setHostedScanForm((current) => ({ ...current, containerImageRef: event.target.value }))}
                        />
                      )}
                      {hostedScanForm.depth === 'RUNTIME_BASELINE' && (
                        <TextField
                          size="small"
                          label="Runtime URL"
                          placeholder={selectedProduct?.productUrl || 'https://staging.example.com'}
                          value={hostedScanForm.runtimeTargetUrl}
                          onChange={(event) => setHostedScanForm((current) => ({ ...current, runtimeTargetUrl: event.target.value }))}
                        />
                      )}
                      <TextField
                        size="small"
                        label="Audit reason"
                        value={hostedScanForm.reason}
                        onChange={(event) => setHostedScanForm((current) => ({ ...current, reason: event.target.value }))}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={hostedScanForm.authorizationConfirmed}
                            onChange={(event) => setHostedScanForm((current) => ({ ...current, authorizationConfirmed: event.target.checked }))}
                          />
                        }
                        label={<Typography variant="body2" color="text.secondary">I am authorized to run selected scanners on this source.</Typography>}
                      />
                      {hostedScanForm.depth === 'RUNTIME_BASELINE' && (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={hostedScanForm.runtimeAuthorizationConfirmed}
                              onChange={(event) => setHostedScanForm((current) => ({ ...current, runtimeAuthorizationConfirmed: event.target.checked }))}
                            />
                          }
                          label={<Typography variant="body2" color="text.secondary">I confirm the runtime URL/domain is authorized for baseline scanning.</Typography>}
                        />
                      )}
                      {hostedScanBlockedReason && <Alert severity="info" sx={{ borderRadius: 1 }}>{hostedScanBlockedReason}</Alert>}
                      {fullHostedScanBlockedReason && fullHostedScanBlockedReason !== hostedScanBlockedReason && (
                        <Alert severity="info" sx={{ borderRadius: 1 }}>Full suite: {fullHostedScanBlockedReason}</Alert>
                      )}
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <Button
                          type="submit"
                          variant="contained"
                          startIcon={<PlayArrowOutlined />}
                          disabled={!!hostedScanBlockedReason || !!activeScanRun || startHostedScan.isPending}
                          sx={{ minHeight: 44, flex: 1 }}
                        >
                          Start Scan
                        </Button>
                        <Tooltip title={fullHostedScanBlockedReason || 'Queue every configured scanner across repository, image, and runtime targets.'}>
                          <span style={{ flex: 1 }}>
                            <Button
                              type="button"
                              variant="outlined"
                              startIcon={<ShieldOutlined />}
                              disabled={!!fullHostedScanBlockedReason || !!activeScanRun || startFullHostedScan.isPending}
                              onClick={() => startFullHostedScan.mutate()}
                              sx={{ minHeight: 44, width: '100%' }}
                            >
                              Run Full Suite
                            </Button>
                          </span>
                        </Tooltip>
                        {activeScanRun && (
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<CancelOutlined />}
                            disabled={cancelScannerRun.isPending}
                            onClick={() => cancelScannerRun.mutate(activeScanRun.id)}
                            sx={{ minHeight: 44, flex: 1 }}
                          >
                            Cancel
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  </Box>

                  <Box component="form" onSubmit={(event) => {
                    event.preventDefault();
                    if (!scheduleBlockedReason) createScannerSchedule.mutate();
                  }}>
                    <Stack spacing={1.25}>
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Typography sx={{ fontWeight: 900 }}>Schedule evidence refresh</Typography>
                        <EventRepeatOutlined sx={{ color: appleColors.cyan }} />
                      </Stack>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1.4fr' }, gap: 1 }}>
                        <TextField
                          size="small"
                          type="number"
                          label="Every days"
                          value={scheduleForm.intervalDays}
                          inputProps={{ min: 1, max: 90 }}
                          onChange={(event) => setScheduleForm((current) => ({ ...current, intervalDays: event.target.value }))}
                        />
                        <TextField
                          size="small"
                          type="datetime-local"
                          label="First run"
                          value={scheduleForm.nextRunAt}
                          onChange={(event) => setScheduleForm((current) => ({ ...current, nextRunAt: event.target.value }))}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Box>
                      <TextField
                        size="small"
                        label="Schedule reason"
                        value={scheduleForm.reason}
                        onChange={(event) => setScheduleForm((current) => ({ ...current, reason: event.target.value }))}
                      />
                      {scheduleBlockedReason && <Alert severity="info" sx={{ borderRadius: 1 }}>{scheduleBlockedReason}</Alert>}
                      <Button
                        type="submit"
                        variant="outlined"
                        startIcon={<EventRepeatOutlined />}
                        disabled={!!scheduleBlockedReason || createScannerSchedule.isPending}
                        sx={{ minHeight: 42 }}
                      >
                        Create Schedule
                      </Button>
                    </Stack>
                  </Box>

                  <Divider />

                  <Box component="form" onSubmit={(event) => {
                    event.preventDefault();
                    if (selectedProduct && scannerUploadForm.toolName.trim() && scannerUploadForm.artifactPayload.trim()) uploadScannerEvidence.mutate();
                  }}>
                    <Stack spacing={1.25}>
                      <Typography sx={{ fontWeight: 900 }}>Upload CI evidence</Typography>
                      <TextField
                        select
                        size="small"
                        label="Evidence source"
                        value={scannerUploadForm.sourceId}
                        onChange={(event) => setScannerUploadForm((current) => ({ ...current, sourceId: event.target.value }))}
                      >
                        <MenuItem value="">Auto-create CI source</MenuItem>
                        {(scannerSummary.data?.sources || []).map((source) => (
                          <MenuItem key={source.id} value={source.id}>{source.displayName}</MenuItem>
                        ))}
                      </TextField>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 120px' }, gap: 1 }}>
                        <TextField
                          size="small"
                          label="Tool"
                          value={scannerUploadForm.toolName}
                          onChange={(event) => setScannerUploadForm((current) => ({ ...current, toolName: event.target.value }))}
                        />
                        <TextField
                          select
                          size="small"
                          label="Format"
                          value={scannerUploadForm.format}
                          onChange={(event) => setScannerUploadForm((current) => ({ ...current, format: event.target.value as ScannerUploadPayload['format'] }))}
                        >
                          <MenuItem value="SARIF">SARIF</MenuItem>
                          <MenuItem value="JSON">JSON</MenuItem>
                          <MenuItem value="LOG">Log</MenuItem>
                          <MenuItem value="JUNIT">JUnit</MenuItem>
                        </TextField>
                      </Box>
                      <TextField
                        size="small"
                        label="Tool version"
                        value={scannerUploadForm.toolVersion}
                        onChange={(event) => setScannerUploadForm((current) => ({ ...current, toolVersion: event.target.value }))}
                      />
                      <TextField
                        size="small"
                        label="Artifact file name"
                        value={scannerUploadForm.artifactFileName}
                        onChange={(event) => setScannerUploadForm((current) => ({ ...current, artifactFileName: event.target.value }))}
                      />
                      {selectedWorkspace && (
                        <TextField
                          select
                          size="small"
                          label="Attach to milestone"
                          value={scannerUploadForm.milestoneId}
                          onChange={(event) => setScannerUploadForm((current) => ({ ...current, milestoneId: event.target.value }))}
                        >
                          <MenuItem value="">Product-level evidence</MenuItem>
                          {(milestones.data || []).map((milestone) => (
                            <MenuItem key={milestone.id} value={milestone.id}>{milestone.title}</MenuItem>
                          ))}
                        </TextField>
                      )}
                      <TextField
                        size="small"
                        label="Artifact payload"
                        placeholder="Paste SARIF, JSON, JUnit XML, or CI log output from a real scanner run."
                        value={scannerUploadForm.artifactPayload}
                        onChange={(event) => setScannerUploadForm((current) => ({ ...current, artifactPayload: event.target.value }))}
                        multiline
                        minRows={7}
                        InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13, alignItems: 'flex-start' } }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<CloudUploadOutlined />}
                        disabled={!selectedProduct || !scannerUploadForm.toolName.trim() || !scannerUploadForm.artifactPayload.trim() || uploadScannerEvidence.isPending}
                        sx={{ minHeight: 44 }}
                      >
                        Normalize Evidence
                      </Button>
                    </Stack>
                  </Box>

                  <Divider />

                  <Box component="form" onSubmit={(event) => {
                    event.preventDefault();
                    if (selectedProduct && externalImportForm.toolName.trim() && externalImportForm.artifactPayload.trim()) importExternalEvidence.mutate();
                  }}>
                    <Stack spacing={1.25}>
                      <Typography sx={{ fontWeight: 900 }}>Import external tool results</Typography>
                      <TextField
                        select
                        size="small"
                        label="Provider"
                        value={externalImportForm.provider}
                        onChange={(event) => {
                          const provider = externalImportProviders.find((item) => item.value === event.target.value) ?? externalImportProviders[0]!;
                          setExternalImportForm((current) => ({
                            ...current,
                            provider: provider.value,
                            toolName: provider.toolName,
                            format: provider.format,
                            artifactFileName: provider.format === 'SARIF' ? 'external-results.sarif' : `${provider.value.toLowerCase().replaceAll('_', '-')}.json`,
                          }));
                        }}
                      >
                        {externalImportProviders.map((provider) => (
                          <MenuItem key={provider.value} value={provider.value}>{provider.label}</MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        select
                        size="small"
                        label="Source"
                        value={externalImportForm.sourceId}
                        onChange={(event) => setExternalImportForm((current) => ({ ...current, sourceId: event.target.value }))}
                      >
                        <MenuItem value="">Create provider source automatically</MenuItem>
                        {(scannerSummary.data?.sources || []).map((source) => (
                          <MenuItem key={source.id} value={source.id}>{source.displayName}</MenuItem>
                        ))}
                      </TextField>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 120px' }, gap: 1 }}>
                        <TextField
                          size="small"
                          label="Tool"
                          value={externalImportForm.toolName}
                          onChange={(event) => setExternalImportForm((current) => ({ ...current, toolName: event.target.value }))}
                        />
                        <TextField
                          select
                          size="small"
                          label="Format"
                          value={externalImportForm.format}
                          onChange={(event) => setExternalImportForm((current) => ({ ...current, format: event.target.value as ScannerUploadPayload['format'] }))}
                        >
                          <MenuItem value="SARIF">SARIF</MenuItem>
                          <MenuItem value="JSON">JSON</MenuItem>
                          <MenuItem value="LOG">Log</MenuItem>
                        </TextField>
                      </Box>
                      <TextField
                        size="small"
                        label="External reference"
                        placeholder="Run URL, import job ID, commit SHA, or provider project URL"
                        value={externalImportForm.externalReference}
                        onChange={(event) => setExternalImportForm((current) => ({ ...current, externalReference: event.target.value }))}
                      />
                      {selectedWorkspace && (
                        <TextField
                          select
                          size="small"
                          label="Attach to milestone"
                          value={externalImportForm.milestoneId}
                          onChange={(event) => setExternalImportForm((current) => ({ ...current, milestoneId: event.target.value }))}
                        >
                          <MenuItem value="">Product-level evidence</MenuItem>
                          {(milestones.data || []).map((milestone) => (
                            <MenuItem key={milestone.id} value={milestone.id}>{milestone.title}</MenuItem>
                          ))}
                        </TextField>
                      )}
                      <TextField
                        size="small"
                        label="Artifact payload"
                        placeholder="Paste a real provider JSON, SARIF, or scanner export."
                        value={externalImportForm.artifactPayload}
                        onChange={(event) => setExternalImportForm((current) => ({ ...current, artifactPayload: event.target.value }))}
                        multiline
                        minRows={6}
                        InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13, alignItems: 'flex-start' } }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<CloudUploadOutlined />}
                        disabled={!selectedProduct || !externalImportForm.toolName.trim() || !externalImportForm.artifactPayload.trim() || importExternalEvidence.isPending}
                        sx={{ minHeight: 44 }}
                      >
                        Import Results
                      </Button>
                    </Stack>
                  </Box>

                  <Divider />

                  <Box>
                    <Stack spacing={1.25}>
                      <Typography sx={{ fontWeight: 900 }}>Customer-owned CI template</Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <TextField
                          select
                          size="small"
                          label="Template"
                          value={ciTemplateType}
                          onChange={(event) => setCiTemplateType(event.target.value as CiTemplateResponse['type'])}
                          sx={{ flex: 1 }}
                        >
                          <MenuItem value="GITHUB_ACTIONS">GitHub Actions</MenuItem>
                          <MenuItem value="GITLAB_CI">GitLab CI</MenuItem>
                          <MenuItem value="GENERIC_CURL">Generic curl</MenuItem>
                        </TextField>
                        <Button
                          variant="outlined"
                          onClick={() => selectedProduct && fetchCiTemplate.mutate()}
                          disabled={!selectedProduct || fetchCiTemplate.isPending}
                          sx={{ minHeight: 40, minWidth: 132 }}
                        >
                          Generate
                        </Button>
                      </Stack>
                      {ciTemplate && (
                        <Box sx={{ border: 1, borderColor: appleColors.line, bgcolor: '#fbfdff', borderRadius: 1, overflow: 'hidden' }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1.25, py: 1, borderBottom: 1, borderColor: appleColors.line }}>
                            <Typography variant="caption" color="text.secondary">
                              Uses `{ciTemplate.tokenEnvironmentVariable}` and uploads to ProdUS.
                            </Typography>
                            <Tooltip title="Copy template">
                              <IconButton size="small" onClick={() => navigator.clipboard?.writeText(ciTemplate.template)}>
                                <ContentCopyOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                          <Box component="pre" sx={{ m: 0, p: 1.25, maxHeight: 240, overflow: 'auto', fontSize: 12, lineHeight: 1.5, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                            {ciTemplate.template}
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                </Stack>

                <Stack spacing={1.5}>
                  {(scannerSummary.isFetching || createScannerReadinessDiagnosis.isPending || createProviderSource.isPending || requestConnectorInstall.isPending || uploadScannerEvidence.isPending || importExternalEvidence.isPending || fetchCiTemplate.isPending || disconnectScanSource.isPending || startHostedScan.isPending || startFullHostedScan.isPending || cancelScannerRun.isPending || rescanRun.isPending || createScannerSchedule.isPending || updateScannerSchedule.isPending || updateFindingStatus.isPending || openSignedEvidence.isPending || createEvidenceExport.isPending) && <LinearProgress sx={{ borderRadius: 999 }} />}
                  {scannerSummary.data?.sources.length ? (
                    <Stack spacing={1}>
                      <FormControlLabel
                        control={<Checkbox checked={deleteArtifactsOnDisconnect} onChange={(event) => setDeleteArtifactsOnDisconnect(event.target.checked)} />}
                        label={<Typography variant="body2" color="text.secondary">Delete stored scanner artifacts when disconnecting a source.</Typography>}
                      />
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
                        {scannerSummary.data.sources.slice(0, 5).map((source) => (
                          <Stack
                            key={source.id}
                            spacing={1}
                            sx={{
                              border: 1,
                              borderColor: source.authorizationStatus === 'AUTHORIZED' ? '#c8f2da' : appleColors.line,
                              borderRadius: 1,
                              p: 1.25,
                              bgcolor: source.authorizationStatus === 'AUTHORIZED' ? '#fbfffd' : '#fff',
                            }}
                          >
                            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>{source.displayName}</Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>{source.externalReference || formatLabel(source.providerType)}</Typography>
                              </Box>
                              <StatusChip label={source.authorizationStatus} color={source.authorizationStatus === 'AUTHORIZED' ? 'success' : source.authorizationStatus === 'FAILED' ? 'error' : 'warning'} />
                            </Stack>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                              <PastelChip label={formatLabel(source.providerType)} accent={appleColors.cyan} bg="#e4f9fd" />
                              {source.scopeNote && <PastelChip label="Scoped" accent={appleColors.purple} />}
                            </Stack>
                            <Tooltip title={source.authorizationStatus === 'AUTHORIZED' ? 'Disconnect this source from future scanner use' : 'Only authorized sources can be disconnected'}>
                              <span>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color={deleteArtifactsOnDisconnect ? 'error' : 'inherit'}
                                  disabled={source.authorizationStatus !== 'AUTHORIZED' || disconnectScanSource.isPending}
                                  onClick={() => disconnectScanSource.mutate(source.id)}
                                  sx={{ minHeight: 34, alignSelf: 'flex-start' }}
                                >
                                  {deleteArtifactsOnDisconnect ? 'Disconnect + Delete' : 'Disconnect'}
                                </Button>
                              </span>
                            </Tooltip>
                          </Stack>
                        ))}
                      </Box>
                    </Stack>
                  ) : (
                    <EmptyState label="No scanner source exists yet. Save a source, upload CI evidence, or import a customer-owned scanner result to start the evidence chain." />
                  )}

                  {scannerSummary.data?.schedules?.length ? (
                    <Box sx={{ border: '1px solid', borderColor: appleColors.line, borderRadius: 1, p: 1.5, bgcolor: '#fff' }}>
                      <SectionTitle title="Scheduled Scans" action={<PastelChip label={`${scannerSummary.data.schedules.length} configured`} accent={appleColors.cyan} bg="#e4f9fd" />} />
                      <Stack spacing={1}>
                        {scannerSummary.data.schedules.slice(0, 4).map((schedule) => (
                          <Box key={schedule.id} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: '#e5edf7', bgcolor: schedule.active ? '#fbfffd' : '#f8fafc' }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                              <Box sx={{ minWidth: 0 }}>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                                  <Typography variant="body2" sx={{ fontWeight: 900 }}>{formatLabel(schedule.depth)}</Typography>
                                  <StatusChip label={schedule.active ? 'ACTIVE' : 'PAUSED'} color={schedule.active ? 'success' : 'default'} />
                                </Stack>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                  Every {schedule.intervalDays} days · Next {shortDateTime(schedule.nextRunAt)} · {schedule.toolKeys.join(', ') || 'default tools'}
                                </Typography>
                              </Box>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={updateScannerSchedule.isPending}
                                onClick={() => updateScannerSchedule.mutate({ scheduleId: schedule.id, active: !schedule.active })}
                                sx={{ minHeight: 34, minWidth: 92 }}
                              >
                                {schedule.active ? 'Pause' : 'Resume'}
                              </Button>
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  ) : null}

                  {scannerSummary.data?.imports?.length ? (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
                      {scannerSummary.data.imports.slice(0, 4).map((importRun) => (
                        <Box key={importRun.id} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: '#e5edf7', bgcolor: '#fff' }}>
                          <Stack direction="row" justifyContent="space-between" spacing={1}>
                            <Typography variant="body2" sx={{ fontWeight: 900 }}>{formatLabel(importRun.provider)}</Typography>
                            <StatusChip label={importRun.status} color={importRun.status === 'COMPLETED' ? 'success' : importRun.status === 'FAILED' ? 'error' : 'warning'} />
                          </Stack>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                            {importRun.importedCount} findings imported · {formatLabel(importRun.importMethod)}
                          </Typography>
                          {importRun.externalReference && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {importRun.externalReference}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  ) : null}

                  <OwnerScannerEvidenceCenterPanel
                    hasProduct={!!selectedProduct}
                    evidence={filteredScannerEvidence}
                    evidenceFilter={evidenceFilter}
                    isExporting={createEvidenceExport.isPending}
                    isOpeningEvidence={openSignedEvidence.isPending}
                    onEvidenceFilterChange={setEvidenceFilter}
                    onExport={() => createEvidenceExport.mutate()}
                    onOpenEvidence={openEvidenceArtifact}
                    formatDateTime={shortDateTime}
                  />

                  {scannerSummary.data?.findings.length ? (
                    <Stack spacing={1.25}>
                      {scannerSummary.data.findings.slice(0, 8).map((finding) => {
                        const reason = findingReasonById[finding.id] || '';
                        const reviewDue = findingReviewDueById[finding.id] || '';
                        const canResolve = !!reason.trim();
                        const canAcceptRisk = !!reason.trim() && !!reviewDue;
                        const recommendedModule = finding.recommendedModule;
                        const recommendedInCart = !!recommendedModule && cartServiceIds.has(recommendedModule.id);
                        return (
                          <Box key={finding.id} sx={{ p: 1.5, borderRadius: 1, border: '1px solid', borderColor: selectedFinding?.id === finding.id ? `${findingStatusAccent(finding.status)}66` : appleColors.line, bgcolor: selectedFinding?.id === finding.id ? '#fbfdff' : '#fff' }}>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} justifyContent="space-between" alignItems={{ md: 'flex-start' }}>
                              <Box sx={{ minWidth: 0 }}>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                                  <PastelChip label={formatLabel(finding.severity)} accent={severityAccent(finding.severity)} bg={`${severityAccent(finding.severity)}12`} />
                                  <PastelChip label={formatLabel(finding.status)} accent={findingStatusAccent(finding.status)} bg={`${findingStatusAccent(finding.status)}12`} />
                                  {finding.readinessArea && <PastelChip label={finding.readinessArea} accent={appleColors.green} bg="#e7f8ee" />}
                                  {finding.recommendedModule && <PastelChip label={finding.recommendedModule.name} accent={appleColors.purple} />}
                                </Stack>
                                <Typography sx={{ mt: 1, fontWeight: 900 }}>{finding.title}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>{finding.businessRisk || finding.description}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                                  {finding.sourceTool}{finding.sourceRuleId ? ` · ${finding.sourceRuleId}` : ''}{finding.affectedComponent ? ` · ${finding.affectedComponent}` : ''}
                                </Typography>
                              </Box>
                              <Button
                                size="small"
                                variant={selectedFinding?.id === finding.id ? 'contained' : 'outlined'}
                                startIcon={<InfoOutlined />}
                                onClick={() => {
                                  setSelectedFindingId(finding.id);
                                  setFindingDrawerOpen(true);
                                }}
                                sx={{ minHeight: 34, minWidth: 132 }}
                              >
                                Review
                              </Button>
                            </Stack>
                            {recommendedModule && (
                              <Box sx={{ mt: 1.25, p: 1, borderRadius: 1, bgcolor: '#f8f7ff', border: '1px solid', borderColor: '#e3e0ff' }}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 900 }}>Recommended service: {recommendedModule.name}</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.35 }}>
                                      {recommendedModule.ownerOutcome || recommendedModule.description || 'Add this service to the productization plan for tracked remediation.'}
                                    </Typography>
                                  </Box>
                                  <Button
                                    size="small"
                                    variant={recommendedInCart ? 'outlined' : 'contained'}
                                    disabled={recommendedInCart || addServiceToCart.isPending}
                                    startIcon={<AddShoppingCartOutlined />}
                                    onClick={() => addLifecycleService(recommendedModule, 'Scanner findings')}
                                    sx={{ minHeight: 34, minWidth: 142 }}
                                  >
                                    {recommendedInCart ? 'In Plan' : 'Add Service'}
                                  </Button>
                                </Stack>
                              </Box>
                            )}
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 150px' }, gap: 1, mt: 1.25 }}>
                              <TextField
                                size="small"
                                label="Decision note"
                                value={reason}
                                onChange={(event) => setFindingReasonById((current) => ({ ...current, [finding.id]: event.target.value }))}
                                placeholder="Evidence reviewed, fix merged, compensating control..."
                              />
                              <TextField
                                size="small"
                                type="date"
                                label="Risk review"
                                value={reviewDue}
                                onChange={(event) => setFindingReviewDueById((current) => ({ ...current, [finding.id]: event.target.value }))}
                                InputLabelProps={{ shrink: true }}
                              />
                            </Box>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
                              <Button size="small" variant="outlined" disabled={!canResolve || updateFindingStatus.isPending} onClick={() => recordFindingDecision(finding, 'RESOLVED')}>
                                Mark Resolved
                              </Button>
                              <Button size="small" variant="outlined" disabled={!canAcceptRisk || updateFindingStatus.isPending} onClick={() => recordFindingDecision(finding, 'ACCEPTED_RISK')}>
                                Accept Risk
                              </Button>
                              <Button size="small" variant="outlined" disabled={!canResolve || updateFindingStatus.isPending} onClick={() => recordFindingDecision(finding, 'FALSE_POSITIVE')}>
                                False Positive
                              </Button>
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                  ) : (
                    <EmptyState label="No normalized findings yet. Run a governed scan or upload SARIF, JSON, JUnit, or CI log evidence." />
                  )}

                  {scannerSummary.data?.recentRuns.length ? (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
                      {scannerSummary.data.recentRuns.slice(0, 4).map((run) => (
                        <Box key={run.id} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: '#e5edf7', bgcolor: '#fbfdff' }}>
                          <Stack direction="row" spacing={1} justifyContent="space-between">
                            <Typography variant="body2" sx={{ fontWeight: 900 }}>{formatLabel(run.depth)}</Typography>
                            <StatusChip label={run.status} color={run.status === 'COMPLETED' ? 'success' : run.status === 'FAILED' ? 'error' : 'default'} />
                          </Stack>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                            {(run.toolRuns || []).map((tool) => `${tool.toolName}: ${formatLabel(tool.status)} · ${tool.normalizedCount}`).join(' · ') || 'No tool runs'}
                          </Typography>
                          {run.failureSummary && (
                            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.75, lineHeight: 1.4 }}>
                              {run.failureSummary}
                            </Typography>
                          )}
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            {(run.status === 'QUEUED' || run.status === 'RUNNING') ? (
                              <Button size="small" variant="outlined" color="error" startIcon={<CancelOutlined />} disabled={cancelScannerRun.isPending} onClick={() => cancelScannerRun.mutate(run.id)}>
                                Cancel
                              </Button>
                            ) : (
                              <Button size="small" variant="outlined" startIcon={<RefreshOutlined />} disabled={!!activeScanRun || rescanRun.isPending} onClick={() => rescanRun.mutate(run.id)}>
                                Rescan
                              </Button>
                            )}
                          </Stack>
                        </Box>
                      ))}
                    </Box>
                  ) : null}
                </Stack>
              </Box>
            </Surface>
          )}

          {workspaceTab === 'services' && workspaceDetailOpen && (
            <>
              {servicesView === 'recommend' && (
                <OwnerServicesRecommendationPanel
                  product={selectedProduct}
                  categories={categories.data || []}
                  catalogModules={catalogModules.data || []}
                  recommendedServices={recommendedServices}
                  cartServiceItems={cartServiceItems}
                  cartServiceIds={cartServiceIds}
                  blockerCount={launchStatus.blockerCount}
                  improvementCount={launchStatus.improvementCount}
                  mappedServiceNames={scannerMappedServices}
                  ownerRisks={serviceRiskItems}
                  cartStartPromptFacts={cartStartPromptFacts}
                  assistantContext={assistantContext('service-selection')}
                  assistantActions={assistantActionProps}
                  isAddingService={addServiceToCart.isPending}
                  isRemovingService={removeServiceFromCart.isPending}
                  onAddService={addLifecycleService}
                  onRemoveService={(itemId) => removeServiceFromCart.mutate(itemId)}
                />
              )}

              {servicesView === 'plan' && (
                <OwnerServicePlanPanel
                  showProductCreation={showProductCreation}
                  selectedProduct={selectedProduct}
                  productFormValues={productForm.values}
                  requirementFormValues={requirementForm.values}
                  selectedProductRequirements={selectedProductRequirements}
                  catalogModules={catalogModules.data || []}
                  selectedPackage={selectedPackage}
                  packageModules={packageModules.data || []}
                  isPackageFetching={packageModules.isFetching}
                  isTeamRecommendationsFetching={teamRecommendations.isFetching}
                  isCreatingProduct={createProduct.isPending}
                  isCreatingRequirement={createRequirement.isPending}
                  isBuildingPackage={buildPackage.isPending}
                  cartStartPromptFacts={cartStartPromptFacts}
                  packageAssistantContext={assistantContext('package-recommendation')}
                  assistantActions={assistantActionProps}
                  onProductValueChange={(key, value) => productForm.setValue(key as keyof ProductProfilePayload, value as any)}
                  onRequirementValueChange={(key, value) => requirementForm.setValue(key as keyof RequirementPayload, value as any)}
                  onSubmitProduct={submitProduct}
                  onSubmitRequirement={submitRequirement}
                  onBuildPackage={(requirementId) => buildPackage.mutate(requirementId)}
                />
              )}

              {servicesView === 'team' && (
                <OwnerTeamMatchPanel
                  recommendations={teamRecommendations.data || []}
                  productProposals={productProposals}
                  cartTalentItems={cartTalentItems}
                  activeShortlists={activeShortlists}
                  suggestedTeams={suggestedTeams}
                  suggestedExperts={suggestedExperts}
                  hasServicePlan={!!selectedPackage}
                  isAddingTalent={addTalentToCart.isPending}
                  isRemovingTalent={removeTalentFromCart.isPending}
                  isShortlisting={upsertShortlist.isPending}
                  isAcceptingProposal={acceptProposal.isPending}
                  onAddRecommendationTeam={addRecommendationTeamToCart}
                  onAddTeam={addTeamToCart}
                  onAddExpert={addExpertToCart}
                  onRemoveTalent={(itemId) => removeTalentFromCart.mutate(itemId)}
                  onRecordShortlist={recordShortlist}
                  onAcceptProposal={(proposalId) => acceptProposal.mutate(proposalId)}
                />
              )}
            </>
          )}
        </Stack>

        <Stack spacing={2.5}>
          {selectedProduct && (
            <OwnerControlPanel
              status={launchStatus}
              primaryAction={launchStatus.blockerCount ? 'Open action plan' : topRecommendedServiceName ? 'Review service path' : 'Open proof'}
              lastScanLabel={scannerSummary.data?.recentRuns[0]?.completedAt ? shortDateTime(scannerSummary.data.recentRuns[0].completedAt) : latestCompletedTools ? `${latestCompletedTools} checks completed` : 'No completed check yet'}
              evidenceLabel={`${latestCompletedTools}/${scanToolOptions.length} checks`}
              onPrimaryAction={() => launchStatus.blockerCount ? openActionView('plan') : topRecommendedServiceName ? openServicesView('recommend') : openFindingsView('evidence')}
              secondary={
                <Button variant="outlined" startIcon={<EventRepeatOutlined />} onClick={() => setTimelineOpen(true)} sx={{ minHeight: 38 }}>
                  View timeline
                </Button>
              }
            />
          )}

          {workspaceTab === 'services' && workspaceDetailOpen && (servicesView === 'plan' || servicesView === 'team') && (
            <OwnerProjectStartPanel
              product={selectedProduct}
              cart={cart.data}
              notice={cartNotice}
              canStartWorkspace={canStartProjectWorkspace}
              blockers={cartBlockers}
              blockingGaps={cartBlockingGaps}
              blockingRecommendationNames={cartBlockingRecommendations.map((item) => item.recommendedModule.name)}
              projectName={projectName}
              hasWorkspace={!!(selectedWorkspace || cart.data?.convertedWorkspace)}
              isAddingService={addServiceToCart.isPending}
              isRemovingService={removeServiceFromCart.isPending}
              isRemovingTalent={removeTalentFromCart.isPending}
              isConverting={convertCart.isPending}
              onNoticeClose={() => setCartNotice('')}
              onProjectNameChange={setProjectName}
              onAddGapService={(serviceModule, notes) => addServiceToCart.mutate({ serviceModuleId: serviceModule.id, notes })}
              onRemoveService={(itemId) => removeServiceFromCart.mutate(itemId)}
              onRemoveTalent={(itemId) => removeTalentFromCart.mutate(itemId)}
              onConvert={() => convertCart.mutate()}
            />
          )}

          {workspaceDetailOpen && (workspaceTab === 'overview' || workspaceTab === 'actions') && (
          <Surface>
            <SectionTitle
              title="AI Owner Brief"
              action={
                <Stack direction="row" spacing={1} alignItems="center">
                  <PastelChip
                    label={assistantSuggestions.data ? (assistantSuggestions.data.mode !== 'FALLBACK' ? 'LoomAI live' : 'ProdUS fallback') : 'On demand'}
                    accent={assistantSuggestions.data && assistantSuggestions.data.mode !== 'FALLBACK' ? appleColors.purple : appleColors.blue}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AutoAwesomeOutlined />}
                    disabled={!selectedProduct?.id || assistantSuggestions.isFetching}
                    onClick={() => assistantSuggestions.refetch()}
                    sx={{ minHeight: 34 }}
                  >
                    {assistantSuggestions.isFetching ? 'Thinking...' : 'Suggest'}
                  </Button>
                </Stack>
              }
            />
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 52, height: 52, borderRadius: 1, bgcolor: '#f1efff', color: appleColors.purple, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <AutoAwesomeOutlined />
              </Box>
              <Box>
                <Typography variant="h4">Productization clarity</Typography>
                <Typography color="success.main" sx={{ fontWeight: 800 }}>Evidence-led next steps</Typography>
              </Box>
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.7 }}>
              {recommendations.data?.[0]?.rationale || 'Use lifecycle services, plan evidence, and verified teams to keep productization decisions concrete.'}
            </Typography>
            <Stack spacing={1} sx={{ mt: 2 }}>
              {(assistantSuggestions.data?.suggestions || [
                'Explain productization readiness',
                'Recommend lifecycle services from evidence',
                'Prepare the next package action',
              ]).slice(0, 3).map((suggestion) => (
                <Box
                  key={suggestion}
                  sx={{
                    p: 1.25,
                    border: '1px solid',
                    borderColor: appleColors.line,
                    borderRadius: 1,
                    background: 'rgba(248, 250, 252, 0.78)',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AutoAwesomeOutlined sx={{ color: appleColors.purple, fontSize: 18 }} />
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{suggestion}</Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
            {assistantSuggestions.data?.fallbackReason && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                {formatLabel(assistantSuggestions.data.fallbackReason)}. Suggestions are generated by the ProdUS deterministic fallback until LoomAI is configured.
              </Typography>
            )}
          </Surface>
          )}

          {workspaceTab === 'services' && workspaceDetailOpen && servicesView === 'team' && (
          <Surface>
            <SectionTitle title="Delivery Workspace" action={selectedWorkspace && <StatusChip label={selectedWorkspace.status} />} />
            {selectedWorkspace ? (
              <Stack spacing={1.5}>
                <Typography sx={{ fontWeight: 900 }}>{selectedWorkspace.name}</Typography>
                {(milestones.data || []).slice(0, 5).map((milestone) => (
                  <Stack key={milestone.id} direction="row" spacing={1} justifyContent="space-between" sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{milestone.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{milestone.dueDate || 'No date'}</Typography>
                    </Box>
                    <StatusChip label={milestone.status} />
                  </Stack>
                ))}
                <StudioAssistantCard
                  title="AI Milestone Evidence"
                  description="Check what the current milestone needs before owner approval or team handoff."
                  prompt={`Do not call tools for this answer. Review milestone and evidence readiness for ${selectedMilestone?.title || selectedWorkspace.name}. Visible workspace "${selectedWorkspace.name}" is ${selectedWorkspace.status}. Current milestone details: title "${selectedMilestone?.title || 'workspace summary'}", status "${selectedMilestone?.status || selectedWorkspace.status}", due date "${selectedMilestone?.dueDate || 'not recorded'}", description "${selectedMilestone?.description || 'not recorded'}". Explain missing acceptance evidence, scanner proof, owner review risks, and the next safe decision. Do not approve the milestone automatically.`}
                  conversationId={`studio-milestone-${selectedWorkspace.id}-${selectedMilestone?.id || 'summary'}`}
                  context={assistantContext('milestone-evidence-readiness', { milestoneId: selectedMilestone?.id })}
                  {...assistantActionProps}
                  accent={blockedMilestones ? appleColors.red : appleColors.green}
                  compact
                  cta="Check Evidence"
                />
                <Button component={NextLink} href="/workspaces" variant="outlined" endIcon={<OpenInNewOutlined />} sx={{ minHeight: 42 }}>
                  Manage workspace
                </Button>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">A workspace appears after service plan handoff.</Typography>
            )}
          </Surface>
          )}

          {workspaceTab === 'services' && workspaceDetailOpen && servicesView === 'team' && (
          <Surface sx={{ background: productSupport.some((request) => request.slaStatus === 'OVERDUE') ? '#fff7f8' : '#f6fffb' }}>
            <SectionTitle title="Support and Risk" />
            {productSupport.length ? (
              <Stack spacing={1.25}>
                {productSupport.slice(0, 4).map((request) => (
                  <Stack key={request.id} direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{request.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatLabel(request.status)} · {formatLabel(request.slaStatus)}</Typography>
                    </Box>
                    <PastelChip label={formatLabel(request.priority)} accent={statusAccent(request.priority)} />
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">No support requests are attached to this product.</Typography>
            )}
          </Surface>
          )}

          <Surface>
            <SectionTitle title="Next Decision" />
            <Stack spacing={1.25}>
              {!selectedPackage && <DotLabel label="Create the service plan" color={appleColors.amber} />}
              {selectedPackage && !productProposals.some((proposal) => proposal.status === 'OWNER_ACCEPTED') && <DotLabel label="Compare and accept a team proposal" color={appleColors.purple} />}
              {selectedPackage && selectedWorkspace && <DotLabel label="Review milestone evidence" color={blockedMilestones ? appleColors.red : appleColors.green} />}
              {buildTargetRequirementId && !selectedPackage && (
                <Button variant="contained" startIcon={<SendOutlined />} onClick={() => buildPackage.mutate(buildTargetRequirementId)} disabled={buildPackage.isPending}>
                  Create service plan
                </Button>
              )}
            </Stack>
          </Surface>
        </Stack>
      </Box>
      <OwnerFindingReviewDrawer
        open={findingDrawerOpen}
        product={selectedProduct}
        finding={selectedFinding}
        ownerCategory={selectedFindingOwnerCategory}
        evidence={selectedFindingEvidence}
        decisionReason={selectedFindingReason}
        reviewDueOn={selectedFindingReviewDue}
        canResolve={selectedFindingCanResolve}
        canAcceptRisk={selectedFindingCanAcceptRisk}
        recommendedInCart={selectedFindingRecommendedInCart}
        isAddingService={addServiceToCart.isPending}
        isUpdatingStatus={updateFindingStatus.isPending}
        isOpeningEvidence={openSignedEvidence.isPending}
        onClose={() => setFindingDrawerOpen(false)}
        onDecisionReasonChange={(value) => selectedFinding && setFindingReasonById((current) => ({ ...current, [selectedFinding.id]: value }))}
        onReviewDueChange={(value) => selectedFinding && setFindingReviewDueById((current) => ({ ...current, [selectedFinding.id]: value }))}
        onRecordDecision={(status) => selectedFinding && recordFindingDecision(selectedFinding, status)}
        onAddService={addLifecycleService}
        onOpenEvidence={openEvidenceArtifact}
        assistantSlot={
          selectedFinding && selectedProduct ? (
            <StudioAssistantCard
              title="AI Finding Review"
              description="Turn this finding into an owner-readable decision with evidence needs and remediation direction."
              prompt={`Do not call write actions for this answer. Review scanner finding ${selectedFinding.id} for ${selectedProduct.name}. Finding details: title "${selectedFinding.title}", severity ${selectedFinding.severity}, status ${selectedFinding.status}, affected area "${selectedFinding.readinessArea || selectedFinding.affectedComponent || 'not specified'}", source rule "${selectedFinding.sourceRuleId || selectedFinding.sourceTool}", description "${selectedFinding.description}", business risk "${selectedFinding.businessRisk || 'not mapped'}", required evidence "${selectedFinding.evidenceRequired || 'not mapped'}", recommended service "${selectedFinding.recommendedModule?.name || 'not mapped'}", linked evidence count ${selectedFindingEvidence.length}. Explain likely impact, what evidence is needed to resolve or accept risk, and which productization service or milestone should own follow-up. Use these provided details directly. Do not include raw artifact contents.`}
              conversationId={`studio-finding-${selectedProduct.id}-${selectedFinding.id}`}
              context={assistantContext('scanner-finding-review', { findingId: selectedFinding.id })}
              {...assistantActionProps}
              accent={findingStatusAccent(selectedFinding.status)}
              compact
              cta="Review Finding"
            />
          ) : undefined
        }
      />
      <OwnerWorkspaceTimelineDialog
        open={timelineOpen}
        items={workspaceTimeline}
        onClose={() => setTimelineOpen(false)}
      />
    </>
  );
}
