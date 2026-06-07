'use client';

import NextLink from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AddOutlined,
  AddShoppingCartOutlined,
  ArticleOutlined,
  AutoAwesomeOutlined,
  BugReportOutlined,
  CancelOutlined,
  CloudUploadOutlined,
  ContentCopyOutlined,
  DeleteOutlineOutlined,
  EventRepeatOutlined,
  FactCheckOutlined,
  GroupAddOutlined,
  InfoOutlined,
  Inventory2Outlined,
  OpenInNewOutlined,
  PersonAddAltOutlined,
  PlayArrowOutlined,
  RefreshOutlined,
  RocketLaunchOutlined,
  ScienceOutlined,
  SendOutlined,
  ShoppingCartOutlined,
  ShieldOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  ProgressRing,
  QueryState,
  SaveButton,
  SectionTitle,
  StatusChip,
  Surface,
  TextInput,
  appleColors,
  categoryPalette,
  clampScore,
  formatLabel,
} from './PlatformComponents';
import ShipConfidencePanel from './ShipConfidencePanel';
import LaunchReadinessReportPanel from './LaunchReadinessReportPanel';
import OwnerWorkspaceTimelineDialog from './OwnerWorkspaceTimelineDialog';
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
  RepoSignal,
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
  AssistantQueryResponse,
  AssistantSuggestionsResponse,
  ScannerConnectorInstallation,
  ScannerEvidenceItem,
  ScannerToolCoverage,
  SignedArtifactResponse,
  ShipConfidenceHistory,
  LaunchReadinessReport,
  FullHostedScanResponse,
} from './types';

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

interface StudioAssistantContext {
  pageType: string;
  productId?: string | undefined;
  packageId?: string | undefined;
  workspaceId?: string | undefined;
  milestoneId?: string | undefined;
  findingId?: string | undefined;
  startReadiness?: {
    status?: string;
    ready?: boolean;
    summary?: string;
    gaps?: {
      type: string;
      severity: string;
      title: string;
      description?: string | undefined;
      serviceModuleId?: string | undefined;
      serviceModuleCode?: string | undefined;
    }[];
  } | undefined;
}

interface StudioAssistantCardProps {
  title: string;
  description: string;
  prompt: string;
  conversationId: string;
  context: StudioAssistantContext;
  disabled?: boolean;
  accent?: string;
  compact?: boolean;
  cta?: string;
  onConfirmAction?: (action: Record<string, unknown>) => Promise<void> | void;
  actionDisabledReason?: (action: Record<string, unknown>) => string;
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

const stageOptions: ProductProfile['businessStage'][] = ['IDEA', 'PROTOTYPE', 'VALIDATED', 'LIVE', 'SCALING'];

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

const formatMoney = (amountCents: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format((amountCents || 0) / 100);

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

const compactIntakeFieldSx = {
  '& .MuiOutlinedInput-root': {
    minHeight: 44,
    borderRadius: 1,
    bgcolor: '#fbfdff',
    transition: 'border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease',
    '& fieldset': {
      borderColor: '#dbe4f0',
    },
    '&:hover fieldset': {
      borderColor: '#b9c8dc',
    },
    '&.Mui-focused': {
      bgcolor: '#fff',
      boxShadow: '0 0 0 4px rgba(98, 92, 255, 0.1)',
      '& fieldset': {
        borderColor: appleColors.purple,
        borderWidth: 1,
      },
    },
  },
  '& .MuiInputLabel-root': {
    color: appleColors.muted,
  },
};

const intakeActionButtonSx = {
  width: { xs: '100%', md: 132 },
  minWidth: 132,
  height: 44,
  borderRadius: 1,
  textTransform: 'none',
  whiteSpace: 'nowrap',
  fontWeight: 800,
  letterSpacing: 0,
  boxShadow: '0 10px 22px rgba(24, 119, 242, 0.18)',
  '&:hover': {
    boxShadow: '0 12px 26px rgba(24, 119, 242, 0.24)',
  },
  '&.Mui-disabled': {
    boxShadow: 'none',
  },
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

const scannerCoverageAccent = (coverage?: ScannerToolCoverage) => {
  if (!coverage) return appleColors.muted;
  if (!coverage.enabled || !coverage.executableAvailable || coverage.latestStatus === 'FAILED') return appleColors.red;
  if (coverage.latestStatus === 'COMPLETED') return appleColors.green;
  if (coverage.latestStatus === 'RUNNING' || coverage.latestStatus === 'QUEUED') return appleColors.amber;
  if (!coverage.applicable) return appleColors.muted;
  return appleColors.blue;
};

const scannerCoverageStatusColor = (coverage?: ScannerToolCoverage): 'default' | 'success' | 'error' | 'warning' | 'primary' => {
  if (!coverage) return 'default';
  if (!coverage.enabled || !coverage.executableAvailable || coverage.latestStatus === 'FAILED') return 'error';
  if (coverage.latestStatus === 'COMPLETED') return 'success';
  if (coverage.latestStatus === 'RUNNING' || coverage.latestStatus === 'QUEUED') return 'warning';
  if (coverage.applicable) return 'primary';
  return 'default';
};

const productHealth = (product?: ProductProfile, packageInstance?: PackageInstance, modules?: PackageModule[]) => {
  if (!product) return 0;
  if (!packageInstance) return product.businessStage === 'LIVE' ? 66 : 58;
  return packageScore(packageInstance, modules);
};

const severityAccent = (severity?: string) => {
  if (severity === 'CRITICAL') return appleColors.red;
  if (severity === 'HIGH') return '#ea580c';
  if (severity === 'MEDIUM') return appleColors.amber;
  if (severity === 'LOW') return appleColors.blue;
  return appleColors.muted;
};

const repoSignalAccent = (signal?: Pick<RepoSignal, 'signalType' | 'evidenceKind'>) => {
  if (!signal) return appleColors.purple;
  if (signal.signalType === 'UNKNOWN') return appleColors.amber;
  if (signal.signalType === 'SECURITY' || signal.signalType === 'SCANNER_FINDING') return appleColors.red;
  if (signal.signalType === 'TESTING' || signal.signalType === 'CI_CD' || signal.signalType === 'DEPLOYMENT') return appleColors.cyan;
  if (signal.evidenceKind === 'AUTHORIZED_CONNECTOR' || signal.evidenceKind === 'SCANNER_RESULT') return appleColors.green;
  if (signal.signalType === 'FRAMEWORK' || signal.signalType === 'LANGUAGE' || signal.signalType === 'DATABASE') return appleColors.blue;
  return appleColors.purple;
};

const repoSourceStatusLabel = (status?: string) => {
  if (status === 'AUTHORIZED_SOURCE') return 'Repo connected';
  if (status === 'OWNER_PROVIDED_SOURCE') return 'Owner-provided repo';
  if (status === 'SOURCE_UNKNOWN') return 'Repo unknown';
  return 'Not refreshed';
};

const repoSignalConfidence = (confidence?: number) => `${Math.round((confidence || 0) * 100)}%`;

function RepoSignalRow({ signal }: { signal: RepoSignal }) {
  const accent = repoSignalAccent(signal);
  return (
    <Box
      sx={{
        p: 1,
        borderRadius: 1,
        border: '1px solid',
        borderColor: `${accent}28`,
        bgcolor: '#fff',
        minWidth: 0,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            <PastelChip label={formatLabel(signal.signalType)} accent={accent} bg={`${accent}12`} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>
              {repoSignalConfidence(signal.confidence)}
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.65, fontWeight: 900, overflowWrap: 'anywhere' }}>
            {signal.signalValue}
          </Typography>
          {signal.ownerSafeEvidence && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.45, display: 'block', lineHeight: 1.45 }}>
              {signal.ownerSafeEvidence}
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

function RepoSignalColumn({
  title,
  empty,
  signals,
}: {
  title: string;
  empty: string;
  signals: RepoSignal[];
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 950, mb: 1 }}>
        {title}
      </Typography>
      {signals.length ? (
        <Stack spacing={0.9}>
          {signals.slice(0, 5).map((signal) => (
            <RepoSignalRow key={signal.id} signal={signal} />
          ))}
        </Stack>
      ) : (
        <Box sx={{ p: 1.25, borderRadius: 1, border: '1px dashed', borderColor: appleColors.line, bgcolor: '#fbfdff' }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
            {empty}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function RepoReadoutPanel({
  summary,
  scannerSummary,
  isFetching,
  isRefreshing,
  onRefresh,
}: {
  summary: RepoSignalSummary | undefined;
  scannerSummary: ProductScannerSummary | undefined;
  isFetching: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  const sourceSignal = summary?.signals.find((signal) => signal.signalType === 'REPOSITORY_SOURCE');
  const branchSignal = summary?.signals.find((signal) => signal.signalType === 'DEFAULT_BRANCH');
  const scannerStatus = summary?.signals.find((signal) => signal.signalType === 'SCANNER_STATUS');
  const unknownCount = summary?.unknowns.length || 0;
  const stackValues = Array.from(new Set((summary?.detectedStack || []).map((signal) => signal.signalValue))).slice(0, 6);
  const proofSignals = (summary?.scannerFacts || []).filter((signal) => signal.signalType !== 'REPOSITORY_SOURCE' && signal.signalType !== 'SOURCE_AUTHORIZATION');
  const topUnknowns = summary?.unknowns || [];
  const sourceStatus = repoSourceStatusLabel(summary?.sourceStatus);
  const accent = summary?.sourceStatus === 'AUTHORIZED_SOURCE'
    ? appleColors.green
    : summary?.sourceStatus === 'OWNER_PROVIDED_SOURCE'
      ? appleColors.blue
      : appleColors.amber;

  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #fbfdff 50%, #f7fff9 100%)' }}>
      <SectionTitle
        title="Repo Readout"
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <PastelChip label={sourceStatus} accent={accent} bg={`${accent}12`} />
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshOutlined />}
              disabled={isRefreshing}
              onClick={onRefresh}
              sx={{ minHeight: 36 }}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Stack>
        }
      />
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, mb: 1.5 }}>
        ProdUS turns owner input, connected repo sources, scanner runs, and normalized findings into a compact set of facts. This does not call AI; it keeps the diagnosis grounded before service choices or workspace decisions.
      </Typography>
      {(isFetching || isRefreshing) && <LinearProgress sx={{ borderRadius: 999, mb: 1.5 }} />}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.25, mb: 1.5 }}>
        <MetricTile
          label="Repository"
          value={sourceSignal?.signalValue || 'Unknown'}
          detail={branchSignal?.signalValue ? `Branch ${branchSignal.signalValue}` : 'Attach repo or source'}
          accent={sourceSignal ? repoSignalAccent(sourceSignal) : appleColors.amber}
          icon={<Inventory2Outlined />}
        />
        <MetricTile
          label="Stack signals"
          value={stackValues.length}
          detail={stackValues.length ? stackValues.join(', ') : 'Not detected yet'}
          accent={stackValues.length ? appleColors.blue : appleColors.amber}
          icon={<ScienceOutlined />}
        />
        <MetricTile
          label="Scanner proof"
          value={scannerStatus?.signalValue || `${scannerSummary?.recentRuns.length || 0} runs`}
          detail={`${scannerSummary?.findings.length || 0} findings available`}
          accent={scannerStatus ? repoSignalAccent(scannerStatus) : appleColors.cyan}
          icon={<ShieldOutlined />}
        />
        <MetricTile
          label="Still unknown"
          value={unknownCount}
          detail={unknownCount ? 'Needs evidence' : 'No gaps detected'}
          accent={unknownCount ? appleColors.amber : appleColors.green}
          icon={<InfoOutlined />}
        />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>
        <RepoSignalColumn
          title="Detected by ProdUS"
          empty="Refresh after adding a repository URL or scanner source."
          signals={summary?.detectedStack || []}
        />
        <RepoSignalColumn
          title="Scanner-backed facts"
          empty="Run a scanner or import CI evidence to ground this project."
          signals={proofSignals}
        />
        <RepoSignalColumn
          title="Still unknown"
          empty="No major unknowns from the latest readout."
          signals={topUnknowns}
        />
      </Box>
      {!!summary?.nextActions.length && (
        <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 1, border: '1px solid', borderColor: '#dbeafe', bgcolor: '#fbfdff' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 950, mb: 0.75 }}>
            Next proof steps
          </Typography>
          <Stack spacing={0.65}>
            {summary.nextActions.slice(0, 4).map((action) => (
              <DotLabel key={action} label={action} color={appleColors.blue} />
            ))}
          </Stack>
        </Box>
      )}
    </Surface>
  );
}

const findingStatusAccent = (status?: string) => {
  if (status === 'RESOLVED') return appleColors.green;
  if (status === 'ACCEPTED_RISK') return appleColors.amber;
  if (status === 'FALSE_POSITIVE') return appleColors.muted;
  if (status === 'REGRESSED') return appleColors.red;
  if (status === 'INSUFFICIENT_EVIDENCE') return '#7c3aed';
  return appleColors.purple;
};

const shortDateTime = (value?: string) => {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
};

const confidenceDots = (level?: string) => {
  if (level === 'HIGH') return '●●●';
  if (level === 'MEDIUM') return '●●○';
  return '●○○';
};

const assistantAnswerText = (response?: AssistantQueryResponse) =>
  response?.safeSummary || response?.answer || 'No assistant response has been generated yet.';

type AssistantMarkdownBlock =
  | { type: 'heading'; text: string; depth: number }
  | { type: 'paragraph'; text: string }
  | { type: 'ul' | 'ol'; items: string[] };

const parseAssistantMarkdown = (text: string): AssistantMarkdownBlock[] => {
  const blocks: AssistantMarkdownBlock[] = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let paragraph: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ').trim() });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (listType && listItems.length) {
      blocks.push({ type: listType, items: listItems });
    }
    listType = null;
    listItems = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      return;
    }

    const heading = /^(#{2,4})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const marker = heading[1] ?? '##';
      const headingText = (heading[2] ?? '').trim();
      blocks.push({ type: 'heading', depth: marker.length, text: headingText });
      return;
    }

    const ordered = /^\d+\.\s+(.+)$/.exec(line);
    if (ordered) {
      flushParagraph();
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push((ordered[1] ?? '').trim());
      return;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(line);
    if (unordered) {
      flushParagraph();
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push((unordered[1] ?? '').trim());
      return;
    }

    flushList();
    paragraph.push(line);
  });

  flushParagraph();
  flushList();
  return blocks;
};

const renderAssistantInline = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Box component="strong" key={`${part}-${index}`} sx={{ fontWeight: 900 }}>
          {part.slice(2, -2)}
        </Box>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <Box
          component="code"
          key={`${part}-${index}`}
          sx={{
            px: 0.45,
            py: 0.1,
            borderRadius: 0.6,
            bgcolor: '#eef4ff',
            color: appleColors.ink,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '0.88em',
          }}
        >
          {part.slice(1, -1)}
        </Box>
      );
    }
    return part;
  });
};

function AssistantMarkdown({ text }: { text: string }) {
  const blocks = parseAssistantMarkdown(text);
  return (
    <Stack spacing={0.9}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <Typography
              key={`${block.type}-${index}`}
              variant="subtitle2"
              sx={{
                mt: index === 0 ? 0 : 0.75,
                fontWeight: 950,
                color: appleColors.ink,
                lineHeight: 1.35,
              }}
            >
              {renderAssistantInline(block.text)}
            </Typography>
          );
        }
        if (block.type === 'paragraph') {
          return (
            <Typography key={`${block.type}-${index}`} variant="body2" sx={{ lineHeight: 1.7, color: appleColors.ink }}>
              {renderAssistantInline(block.text)}
            </Typography>
          );
        }
        return (
          <Box
            key={`${block.type}-${index}`}
            component={block.type}
            sx={{
              m: 0,
              pl: 2.35,
              display: 'grid',
              gap: 0.7,
              color: appleColors.ink,
              '& li::marker': { color: appleColors.purple, fontWeight: 900 },
            }}
          >
            {block.items.map((item, itemIndex) => (
              <Box key={`${item}-${itemIndex}`} component="li" sx={{ pl: 0.25 }}>
                <Typography component="span" variant="body2" sx={{ lineHeight: 1.65, color: appleColors.ink }}>
                  {renderAssistantInline(item)}
                </Typography>
              </Box>
            ))}
          </Box>
        );
      })}
    </Stack>
  );
}

const assistantRecordText = (record: Record<string, unknown>, keys: string[], fallback = '') => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return fallback;
};

const assistantActionLabel = (action: Record<string, unknown>) =>
  assistantRecordText(action, ['label', 'title', 'name'], 'Review proposed action');

const assistantSourceLabel = (source: Record<string, unknown>) =>
  assistantRecordText(source, ['title', 'name', 'id', 'type'], 'Source');

function StudioAssistantCard({
  title,
  description,
  prompt,
  conversationId,
  context,
  disabled,
  accent = appleColors.purple,
  compact = false,
  cta = 'Ask AI',
  onConfirmAction,
  actionDisabledReason,
}: StudioAssistantCardProps) {
  const [pendingAction, setPendingAction] = useState<Record<string, unknown> | null>(null);
  const assistantQuery = useMutation({
    mutationFn: () =>
      postJson<AssistantQueryResponse, {
        conversationId: string;
        query: string;
        mode: string;
        position: string;
        context: StudioAssistantContext;
      }>('/ai/assistant/query-once', {
        conversationId,
        query: prompt,
        mode: 'thinker',
        position: 'productization',
        context,
      }),
  });
  const confirmAssistantAction = useMutation({
    mutationFn: async (action: Record<string, unknown>) => {
      if (onConfirmAction) {
        await onConfirmAction(action);
        return;
      }
      throw new Error('This proposed action needs a product-specific confirmation flow before execution.');
    },
    onSuccess: () => setPendingAction(null),
  });

  const result = assistantQuery.data;
  const isLive = Boolean(result && result.provider === 'LOOMAI' && result.mode !== 'FALLBACK');
  const actionDisabled = pendingAction ? actionDisabledReason?.(pendingAction) || (!onConfirmAction ? 'This proposed action is displayed for review only.' : '') : '';

  return (
    <Box
      sx={{
        p: compact ? 1.25 : 1.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: assistantQuery.isError ? '#fecdd3' : `${accent}30`,
        bgcolor: assistantQuery.isError ? '#fff7f8' : '#ffffff',
        boxShadow: compact ? 'none' : '0 12px 32px rgba(15, 23, 42, 0.045)',
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} justifyContent="space-between" alignItems={{ sm: 'flex-start' }}>
        <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: compact ? 34 : 40,
              height: compact ? 34 : 40,
              borderRadius: 1,
              bgcolor: `${accent}12`,
              color: accent,
              display: 'grid',
              placeItems: 'center',
              flex: '0 0 auto',
            }}
          >
            <AutoAwesomeOutlined fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
              <Typography variant={compact ? 'body2' : 'h4'} sx={{ fontWeight: 900 }}>
                {title}
              </Typography>
              {result && (
                <PastelChip
                  label={isLive ? 'LoomAI live' : 'ProdUS fallback'}
                  accent={isLive ? appleColors.purple : appleColors.blue}
                  bg={isLive ? '#f1efff' : '#eaf3ff'}
                />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.55 }}>
              {description}
            </Typography>
          </Box>
        </Stack>
        <Button
          size="small"
          variant="contained"
          startIcon={<AutoAwesomeOutlined />}
          disabled={disabled || assistantQuery.isPending}
          onClick={() => assistantQuery.mutate()}
          sx={{
            minHeight: 36,
            minWidth: 118,
            borderRadius: 1,
            bgcolor: accent,
            boxShadow: `0 10px 22px ${accent}2e`,
            '&:hover': { bgcolor: accent, boxShadow: `0 14px 28px ${accent}38` },
          }}
        >
          {assistantQuery.isPending ? 'Thinking...' : cta}
        </Button>
      </Stack>

      {assistantQuery.isPending && <LinearProgress sx={{ borderRadius: 999, mt: 1.25 }} />}

      {assistantQuery.isError && (
        <Alert severity="warning" sx={{ mt: 1.25, borderRadius: 1 }}>
          The assistant could not answer this request. Try again after checking the backend AI status.
        </Alert>
      )}

      {result && (
        <Box sx={{ mt: 1.25, p: 1.25, borderRadius: 1, bgcolor: '#fbfdff', border: '1px solid', borderColor: appleColors.line }}>
          <AssistantMarkdown text={assistantAnswerText(result)} />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
            {typeof result.confidence === 'number' && (
              <PastelChip label={`${Math.round(result.confidence * 100)}% confidence`} accent={accent} />
            )}
            {result.providerRequestId && (
              <PastelChip label={`trace ${result.providerRequestId.slice(0, 8)}`} accent={appleColors.cyan} bg="#e4f9fd" />
            )}
            {result.sources?.length ? (
              <PastelChip label={`${result.sources.length} sources`} accent={appleColors.green} bg="#e7f8ee" />
            ) : null}
            {result.fallbackReason && (
              <PastelChip label={formatLabel(result.fallbackReason)} accent={appleColors.amber} bg="#fff4dc" />
            )}
          </Stack>
          {!!result.sources?.length && (
            <Box sx={{ mt: 1.25 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.65, fontWeight: 900, textTransform: 'uppercase' }}>
                Source basis
              </Typography>
              <Stack spacing={0.75}>
                {result.sources.slice(0, 4).map((source, index) => (
                  <Box key={`${assistantSourceLabel(source)}-${index}`} sx={{ p: 1, border: '1px solid', borderColor: '#dbeafe', borderRadius: 1, bgcolor: '#f8fbff' }}>
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>{assistantSourceLabel(source)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {assistantRecordText(source, ['summary', 'description', 'type'], 'Authorized ProdUS context')}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
          {!!result.actions?.length && (
            <Box sx={{ mt: 1.25 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.65, fontWeight: 900, textTransform: 'uppercase' }}>
                Proposed actions
              </Typography>
              <Stack spacing={0.75}>
                {result.actions.slice(0, 3).map((action, index) => {
                  const disabledReason = actionDisabledReason?.(action) || (!onConfirmAction ? 'Review only. No confirmed action handler is attached here.' : '');
                  return (
                    <Box key={`${assistantActionLabel(action)}-${index}`} sx={{ p: 1, border: '1px solid', borderColor: '#e7ddff', borderRadius: 1, bgcolor: '#f8f7ff' }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 900 }}>{assistantActionLabel(action)}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {assistantRecordText(action, ['rationale', 'summary'], 'Requires explicit human confirmation before ProdUS executes anything.')}
                          </Typography>
                          {disabledReason && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.35 }}>
                              {disabledReason}
                            </Typography>
                          )}
                        </Box>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={!!disabledReason}
                          onClick={() => setPendingAction(action)}
                          sx={{ minWidth: 112, minHeight: 34, bgcolor: accent, '&:hover': { bgcolor: accent } }}
                        >
                          Confirm
                        </Button>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}
        </Box>
      )}
      <Dialog open={!!pendingAction} onClose={() => setPendingAction(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>Confirm AI Proposed Action</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontWeight: 900 }}>{pendingAction ? assistantActionLabel(pendingAction) : ''}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
            {pendingAction ? assistantRecordText(pendingAction, ['rationale', 'summary'], 'ProdUS will execute this only after this confirmation.') : ''}
          </Typography>
          {pendingAction && assistantRecordText(pendingAction, ['riskLevel']) && (
            <Box sx={{ mt: 1.25 }}>
              <PastelChip label={`Risk ${assistantRecordText(pendingAction, ['riskLevel'])}`} accent={appleColors.amber} bg="#fff4dc" />
            </Box>
          )}
          {confirmAssistantAction.isError && (
            <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 1 }}>
              {confirmAssistantAction.error instanceof Error ? confirmAssistantAction.error.message : 'Could not execute this proposed action.'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPendingAction(null)} disabled={confirmAssistantAction.isPending}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => pendingAction && confirmAssistantAction.mutate(pendingAction)}
            disabled={!pendingAction || !!actionDisabled || confirmAssistantAction.isPending}
          >
            {confirmAssistantAction.isPending ? 'Confirming...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function OwnerProductizationWorkspace({
  productId,
  showProductCreation = true,
}: {
  productId?: string;
  showProductCreation?: boolean;
} = {}) {
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
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [selectedFindingId, setSelectedFindingId] = useState('');
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
  const selectedFindingEvidence = (scannerSummary.data?.evidence || []).filter((item) => item.findingId && item.findingId === selectedFinding?.id);
  const scannerMappedFindings = latestScannerDiagnosis?.findings || [];
  const scannerMappedServices = Array.from(new Set(scannerMappedFindings.map((finding) => finding.recommendedModuleName).filter(Boolean)));
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
  const scannerJourney = [
    { label: 'Connect', complete: !!scannerSummary.data?.sources.length, active: !scannerSummary.data?.sources.length },
    { label: 'Scan', complete: !!scannerSummary.data?.recentRuns.some((run) => run.status === 'COMPLETED'), active: !!activeScanRun },
    { label: 'Findings', complete: !!scannerSummary.data?.findings.length, active: !!scannerSummary.data?.findings.length && !selectedPackage },
    { label: 'Services', complete: !!cartServiceItems.length || !!packageModules.data?.length, active: !!scannerSummary.data?.findings.length && !cartServiceItems.length },
    { label: 'Workspace', complete: !!selectedWorkspace, active: !!selectedPackage && !selectedWorkspace },
    { label: 'Evidence', complete: !!scannerSummary.data?.evidence.length, active: !!selectedWorkspace && !scannerSummary.data?.evidence.length },
    { label: 'Handoff', complete: selectedWorkspace?.status === 'SUPPORT_HANDOFF' || selectedWorkspace?.status === 'DELIVERED' || selectedWorkspace?.status === 'CLOSED', active: selectedWorkspace?.status === 'SUPPORT_HANDOFF' },
  ];
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
  const groupedFindings = [
    {
      label: 'Launch blockers',
      findings: (scannerSummary.data?.findings || []).filter((finding) => ['CRITICAL', 'HIGH'].includes(finding.severity) && ['NEW', 'OPEN', 'REGRESSED'].includes(finding.status)),
      accent: appleColors.red,
    },
    {
      label: 'High-priority technical risks',
      findings: (scannerSummary.data?.findings || []).filter((finding) => finding.severity === 'MEDIUM' && ['NEW', 'OPEN', 'REGRESSED', 'INSUFFICIENT_EVIDENCE'].includes(finding.status)),
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
            onSeePlan={() => setWorkspaceTab(launchStatus.blockerCount ? 'actions' : 'services')}
            onViewProof={() => setWorkspaceTab('findings')}
          />
        </Box>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 340px' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          {selectedProduct ? (
            <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 55%, #f6fff9 100%)' }}>
              <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} alignItems={{ lg: 'flex-start' }} justifyContent="space-between">
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }} sx={{ minWidth: 0 }}>
                  <Box sx={{ width: 64, height: 64, borderRadius: 1, bgcolor: '#f1efff', color: appleColors.purple, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Inventory2Outlined />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="h2">{selectedProduct.name}</Typography>
                      <PastelChip label={formatLabel(selectedProduct.businessStage)} accent={appleColors.purple} />
                      <PastelChip label={launchStatus.label} accent={launchStatus.accent} bg={`${launchStatus.accent}12`} />
                    </Stack>
                    <Typography color="text.secondary" sx={{ maxWidth: 760, lineHeight: 1.7, mt: 0.75 }}>
                      {selectedProduct.summary || 'Capture a concise product summary to drive service recommendations.'}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center" justifyContent={{ xs: 'flex-start', lg: 'flex-end' }}>
                  <ProgressRing value={launchStatus.score} size={104} color={launchStatus.accent} label="ready" />
                  <Box sx={{ minWidth: 150 }}>
                    <Typography variant="caption" color="text.secondary">Launch decision</Typography>
                    <Typography variant="h4" sx={{ color: launchStatus.accent }}>{launchStatus.label}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>{launchStatus.confidence}</Typography>
                  </Box>
                </Stack>
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)' }, gap: 1.5, mt: 2.25 }}>
                <Box sx={{ p: 1.5, borderRadius: 1, border: '1px solid', borderColor: `${launchStatus.accent}35`, bgcolor: '#fff' }}>
                  <Typography variant="caption" color="text.secondary">Status reason</Typography>
                  <Typography variant="h4" sx={{ mt: 0.5, color: appleColors.ink }}>
                    {launchStatus.headline}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
                    {launchStatus.reason}
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }}>
                    <Button
                      variant="contained"
                      startIcon={<RocketLaunchOutlined />}
                      onClick={() => setWorkspaceTab(topOwnerRisks.length ? 'actions' : 'services')}
                      sx={{ minHeight: 42 }}
                    >
                      {topOwnerRisks.length ? 'Review launch blockers' : 'Plan next service'}
                    </Button>
                    <Button variant="outlined" startIcon={<ShieldOutlined />} onClick={() => setWorkspaceTab('findings')} sx={{ minHeight: 42 }}>
                      View scanner proof
                    </Button>
                    <Button variant="outlined" startIcon={<CloudUploadOutlined />} onClick={() => createEvidenceExport.mutate()} disabled={createEvidenceExport.isPending} sx={{ minHeight: 42 }}>
                      Export report
                    </Button>
                  </Stack>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 1, border: '1px solid', borderColor: appleColors.line, bgcolor: '#fff' }}>
                  <Typography variant="caption" color="text.secondary">Top risks</Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {topOwnerRisks.slice(0, 3).length ? topOwnerRisks.slice(0, 3).map((risk) => {
                      const category = ownerCategoryFromSignal(risk.sourceTool, risk.readinessArea, risk.title);
                      return (
                        <Box key={risk.id} sx={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: 1, alignItems: 'flex-start' }}>
                          <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: severityAccent(risk.severity), mt: 0.65 }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 900, lineHeight: 1.35 }}>{risk.title}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                              {ownerProofLine({ sourceTool: risk.sourceTool, sourceRuleId: risk.sourceRuleId, category })}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    }) : (
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                        No launch blockers are visible from the latest stored evidence.
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.25, mt: 1.5 }}>
                {evidenceSummaryItems.map((item) => (
                  <Box key={item.label} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: `${item.accent}32`, bgcolor: '#fff', minHeight: 84 }}>
                    <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.55, fontWeight: 900, lineHeight: 1.35, overflowWrap: 'anywhere' }}>{item.value}</Typography>
                  </Box>
                ))}
              </Box>
            </Surface>
          ) : (
            <EmptyState label="Create a product profile to start the owner productization workflow." />
          )}

          <Surface sx={{ p: { xs: 1, md: 1 }, boxShadow: 'none', position: { xl: 'sticky' }, top: { xl: 76 }, zIndex: 2 }}>
            <Tabs
              value={workspaceTab}
              onChange={(_, value) => setWorkspaceTab(value as WorkspaceTab)}
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

              <Surface>
                <SectionTitle
                  title="Launch Decision"
                  action={<PastelChip label={launchStatus.confidence} accent={launchStatus.accent} bg={`${launchStatus.accent}12`} />}
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 320px' }, gap: 2, alignItems: 'start' }}>
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="h3" sx={{ color: launchStatus.accent }}>{launchStatus.headline}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        The canonical readiness score is shown once in the page header. These counts explain the verdict.
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ lineHeight: 1.75, fontWeight: 700 }}>
                      {launchStatus.reason}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
                      <MetricTile label="Blockers" value={launchStatus.blockerCount} detail="Must fix before launch" accent={launchStatus.blockerCount ? appleColors.red : appleColors.green} icon={<BugReportOutlined />} />
                      <MetricTile label="Improvements" value={launchStatus.improvementCount} detail="Can be scheduled" accent={launchStatus.improvementCount ? appleColors.amber : appleColors.green} icon={<FactCheckOutlined />} />
                      <MetricTile label="Evidence checks" value={`${latestCompletedTools}/${scanToolOptions.length}`} detail="Completed scanner tools" accent={latestCompletedTools === scanToolOptions.length ? appleColors.green : appleColors.amber} icon={<ShieldOutlined />} />
                    </Box>
                  </Stack>
                  <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: '#fbfdff' }}>
                    <Typography variant="caption" color="text.secondary">Primary next step</Typography>
                    <Typography variant="h4" sx={{ mt: 0.5 }}>{launchStatus.blockerCount ? 'Fix launch blockers' : topRecommendedServiceName ? 'Confirm launch plan' : 'Add evidence'}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
                      {topRecommendedServiceName
                        ? `${topRecommendedServiceName} should carry the highest-priority action so the service plan follows the verdict.`
                        : 'Connect proof or run the full scanner suite so ProdUS can make a stronger launch call.'}
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={topRecommendedServiceName ? <AddShoppingCartOutlined /> : <ShieldOutlined />}
                      onClick={() => setWorkspaceTab(topRecommendedServiceName ? 'services' : 'findings')}
                      sx={{ mt: 1.25, minHeight: 40 }}
                    >
                      {topRecommendedServiceName ? 'Review service path' : 'Open proof'}
                    </Button>
                    <Button
                      variant="text"
                      startIcon={<EventRepeatOutlined />}
                      onClick={() => setTimelineOpen(true)}
                      sx={{ mt: 0.75, minHeight: 36, alignSelf: 'flex-start' }}
                    >
                      View product timeline
                    </Button>
                  </Box>
                </Box>
              </Surface>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)' }, gap: 2.5 }}>
                <Surface>
                  <SectionTitle title="Top Risks" action={<PastelChip label={`${topOwnerRisks.slice(0, 3).length} shown`} accent={topOwnerRisks.length ? appleColors.amber : appleColors.green} bg={topOwnerRisks.length ? '#fff4dc' : '#e7f8ee'} />} />
                  {topOwnerRisks.length ? (
                    <Stack spacing={1.25}>
                      {topOwnerRisks.slice(0, 3).map((risk) => {
                        const category = ownerCategoryFromSignal(risk.sourceTool, risk.readinessArea, risk.title);
                        return (
                          <Box key={risk.id} sx={{ p: 1.35, borderRadius: 1, bgcolor: '#fff' }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'flex-start' }}>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="caption" sx={{ color: severityAccent(risk.severity), fontWeight: 900 }}>
                                  {category} · {formatLabel(risk.severity)}
                                </Typography>
                                <Typography sx={{ mt: 0.55, fontWeight: 950, lineHeight: 1.35 }}>{risk.title}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.55, lineHeight: 1.55 }}>
                                  {risk.businessRisk || ownerImpactForCategory(category)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.55, lineHeight: 1.45 }}>
                                  Evidence: {ownerProofLine({ sourceTool: risk.sourceTool, sourceRuleId: risk.sourceRuleId, category })}
                                </Typography>
                              </Box>
                              <Button size="small" variant="outlined" onClick={() => setWorkspaceTab('findings')} sx={{ minHeight: 34, minWidth: 112 }}>
                                Inspect
                              </Button>
                            </Stack>
                            <Box sx={{ mt: 1, p: 1, borderRadius: 1, bgcolor: '#fbfdff' }}>
                              <Typography variant="caption" color="text.secondary">Recommended owner action</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.5 }}>{ownerActionForCategory(category)}</Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  ) : (
                    <EmptyState label="No launch blockers are visible. Keep final human review, evidence export, and a clean rerun before public launch." />
                  )}
                </Surface>

                <Surface>
                  <SectionTitle title="Recommended Next Actions" action={<PastelChip label="Owner plan" accent={appleColors.purple} />} />
                  <Stack spacing={1.25}>
                    {ownerActionGroups.map((group) => (
                      <Box key={group.label} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: `${group.accent}32`, bgcolor: '#fff' }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.9 }}>
                          <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: group.accent }} />
                          <Typography variant="body2" sx={{ fontWeight: 950 }}>{group.label}</Typography>
                        </Stack>
                        <Stack spacing={0.8}>
                          {group.items.length ? group.items.slice(0, 2).map((item) => (
                            <Box key={`${group.label}-${item.title}`}>
                              <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.35 }}>{item.title}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, lineHeight: 1.45 }}>{item.action}</Typography>
                              {'proof' in item && item.proof && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, lineHeight: 1.45 }}>
                                  Evidence: {item.proof}
                                </Typography>
                              )}
                            </Box>
                          )) : (
                            <Typography variant="body2" color="text.secondary">No action needed in this group right now.</Typography>
                          )}
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Surface>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) minmax(320px, 0.8fr)' }, gap: 2.5 }}>
                <Surface>
                  <SectionTitle
                    title="Evidence Checks"
                    action={<PastelChip label={`${latestCompletedTools}/${scanToolOptions.length} completed`} accent={latestCompletedTools === scanToolOptions.length ? appleColors.green : appleColors.amber} bg={latestCompletedTools === scanToolOptions.length ? '#e7f8ee' : '#fff4dc'} />}
                  />
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
                    {scannerCoverageGroups.map((group) => (
                      <Box key={group.key} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: `${group.accent}32`, bgcolor: '#fff' }}>
                        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 950 }}>{group.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {group.tools.length ? group.tools.map((tool) => tool.displayName).join(', ') : group.expectedLabels.join(', ')}
                            </Typography>
                          </Box>
                          <PastelChip label={group.status} accent={group.accent} bg={`${group.accent}12`} />
                        </Stack>
                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 850 }}>
                          {group.normalizedCount ? `${group.normalizedCount} findings` : 'No findings'}
                          {group.mappedFindingCount ? ` · ${group.mappedFindingCount} mapped` : ''}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Surface>

                <Surface>
                  <SectionTitle title="Top Service Recommendation" action={<PastelChip label={selectedPackage ? 'Plan exists' : 'Next step'} accent={selectedPackage ? appleColors.green : appleColors.amber} bg={selectedPackage ? '#e7f8ee' : '#fff4dc'} />} />
                  {selectedPackage ? (
                    <Stack spacing={1}>
                      <Typography variant="h4">{selectedPackage.name}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{selectedPackage.summary}</Typography>
                      <Button variant="outlined" startIcon={<OpenInNewOutlined />} onClick={() => setWorkspaceTab('services')} sx={{ minHeight: 40, alignSelf: 'flex-start' }}>
                        Review services
                      </Button>
                    </Stack>
                  ) : scannerMappedServices.length ? (
                    <Stack spacing={1}>
                      <Typography variant="h4">{scannerMappedServices[0]}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        This service appears because scanner findings mapped to launch-readiness work.
                      </Typography>
                      <Button variant="contained" startIcon={<AddShoppingCartOutlined />} onClick={() => setWorkspaceTab('services')} sx={{ minHeight: 40, alignSelf: 'flex-start' }}>
                        Add services
                      </Button>
                    </Stack>
                  ) : (
                    <EmptyState label="Run or map scanner evidence to generate a service recommendation." />
                  )}
                </Surface>
              </Box>
            </Stack>
          )}

          {selectedProduct && workspaceTab === 'actions' && (
            <Surface>
              <SectionTitle title="Action Plan" action={<PastelChip label="Do now / week / monitor" accent={appleColors.purple} />} />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>
                {ownerActionGroups.map((group) => (
                  <Box key={group.label} sx={{ p: 1.5, borderRadius: 1, border: '1px solid', borderColor: `${group.accent}35`, bgcolor: '#fff', minHeight: 220 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: group.accent }} />
                      <Typography variant="h4">{group.label}</Typography>
                    </Stack>
                    <Stack spacing={1.25}>
                      {group.items.length ? group.items.map((item) => (
                        <Box key={`${group.label}-${item.title}`} sx={{ borderTop: '1px solid', borderColor: appleColors.line, pt: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 950, lineHeight: 1.35 }}>{item.title}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, lineHeight: 1.5 }}>{item.detail}</Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: group.accent, fontWeight: 900, mt: 0.5 }}>{item.action}</Typography>
                          {'proof' in item && item.proof && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.4, lineHeight: 1.45 }}>
                              Evidence: {item.proof}
                            </Typography>
                          )}
                          {'service' in item && item.service && (
                            <Button size="small" variant="outlined" onClick={() => setWorkspaceTab('services')} sx={{ mt: 0.75, minHeight: 32 }}>
                              Review {item.service}
                            </Button>
                          )}
                        </Box>
                      )) : (
                        <Typography variant="body2" color="text.secondary">No action needed.</Typography>
                      )}
                    </Stack>
                  </Box>
                ))}
              </Box>
            </Surface>
          )}

          {selectedProduct && workspaceTab === 'findings' && (
            <Surface>
              <SectionTitle
                title="Findings"
                action={<PastelChip label={`${scannerSummary.data?.findings.length || 0} total`} accent={(scannerSummary.data?.findings.length || 0) ? appleColors.amber : appleColors.green} bg={(scannerSummary.data?.findings.length || 0) ? '#fff4dc' : '#e7f8ee'} />}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) 360px' }, gap: 2 }}>
                <Stack spacing={1.5}>
                  {groupedFindings.map((group) => (
                    <Box key={group.label} sx={{ border: '1px solid', borderColor: `${group.accent}30`, borderRadius: 1, bgcolor: '#fff', overflow: 'hidden' }}>
                      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ px: 1.5, py: 1.15, bgcolor: `${group.accent}0f`, borderBottom: '1px solid', borderColor: `${group.accent}20` }}>
                        <Typography sx={{ fontWeight: 950 }}>{group.label}</Typography>
                        <PastelChip label={`${group.findings.length}`} accent={group.accent} bg="#fff" />
                      </Stack>
                      {group.findings.length ? (
                        <Stack spacing={0} divider={<Divider />}>
                          {group.findings.slice(0, 8).map((finding) => {
                            const category = ownerCategoryFromSignal(finding.sourceTool, finding.readinessArea, finding.title);
                            return (
                              <Box key={finding.id} sx={{ p: 1.35 }}>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ md: 'flex-start' }}>
                                  <Box sx={{ minWidth: 0 }}>
                                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                      <PastelChip label={formatLabel(finding.severity)} accent={severityAccent(finding.severity)} bg={`${severityAccent(finding.severity)}12`} />
                                      <PastelChip label={category} accent={group.accent} bg={`${group.accent}12`} />
                                    </Stack>
                                    <Typography sx={{ mt: 0.8, fontWeight: 950, lineHeight: 1.35 }}>{finding.title}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.55 }}>{finding.businessRisk || finding.description || ownerImpactForCategory(category)}</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.45 }}>
                                      {finding.sourceTool}{finding.sourceRuleId ? ` · ${finding.sourceRuleId}` : ''}
                                    </Typography>
                                  </Box>
                                  <Button size="small" variant={selectedFinding?.id === finding.id ? 'contained' : 'outlined'} onClick={() => setSelectedFindingId(finding.id)} sx={{ minHeight: 34, minWidth: 112 }}>
                                    Review
                                  </Button>
                                </Stack>
                              </Box>
                            );
                          })}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>No findings in this group.</Typography>
                      )}
                    </Box>
                  ))}
                </Stack>

                <Box sx={{ position: { xl: 'sticky' }, top: { xl: 148 }, alignSelf: 'start' }}>
                  {selectedFinding ? (
                    <Surface sx={{ boxShadow: 'none' }}>
                      <SectionTitle title="Technical Detail" action={<PastelChip label={formatLabel(selectedFinding.status)} accent={findingStatusAccent(selectedFinding.status)} bg={`${findingStatusAccent(selectedFinding.status)}12`} />} />
                      <Typography sx={{ fontWeight: 950, lineHeight: 1.35 }}>{selectedFinding.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7, lineHeight: 1.6 }}>{selectedFinding.businessRisk || selectedFinding.description}</Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1.25 }}>
                        <Box sx={{ p: 1, borderRadius: 1, border: '1px solid', borderColor: appleColors.line, bgcolor: '#fbfdff' }}>
                          <Typography variant="caption" color="text.secondary">Source</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 850 }}>{selectedFinding.sourceTool}</Typography>
                        </Box>
                        <Box sx={{ p: 1, borderRadius: 1, border: '1px solid', borderColor: appleColors.line, bgcolor: '#fbfdff' }}>
                          <Typography variant="caption" color="text.secondary">Evidence</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 850 }}>{selectedFindingEvidence.length} linked</Typography>
                        </Box>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25 }}>Recommended action</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.5 }}>
                        {ownerActionForCategory(ownerCategoryFromSignal(selectedFinding.sourceTool, selectedFinding.readinessArea, selectedFinding.title))}
                      </Typography>
                    </Surface>
                  ) : (
                    <EmptyState label="Select a finding to inspect scanner details." />
                  )}
                </Box>
              </Box>
            </Surface>
          )}

          {selectedProduct && workspaceTab === 'findings' && (
            <Surface>
              <SectionTitle
                title="Evidence and Stored Proof"
                action={
                  <Button size="small" variant="outlined" startIcon={<CloudUploadOutlined />} disabled={createEvidenceExport.isPending} onClick={() => createEvidenceExport.mutate()} sx={{ minHeight: 36 }}>
                    Export
                  </Button>
                }
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.25, mb: 2 }}>
                {evidenceSummaryItems.map((item) => (
                  <Box key={item.label} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: `${item.accent}32`, bgcolor: '#fff', minHeight: 88 }}>
                    <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.55, fontWeight: 900, lineHeight: 1.35, overflowWrap: 'anywhere' }}>{item.value}</Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '340px minmax(0, 1fr)' }, gap: 2 }}>
                <Stack spacing={1.25}>
                  <Typography sx={{ fontWeight: 950 }}>Sources</Typography>
                  {(scannerSummary.data?.sources || []).length ? (scannerSummary.data?.sources || []).map((source) => (
                    <Box key={source.id} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: source.authorizationStatus === 'AUTHORIZED' ? '#c8f2da' : appleColors.line, bgcolor: '#fff' }}>
                      <Stack direction="row" spacing={1} justifyContent="space-between">
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>{source.displayName}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>{source.externalReference || formatLabel(source.providerType)}</Typography>
                        </Box>
                        <StatusChip label={source.authorizationStatus} color={source.authorizationStatus === 'AUTHORIZED' ? 'success' : 'warning'} />
                      </Stack>
                    </Box>
                  )) : (
                    <EmptyState label="No scanner source is attached yet." />
                  )}
                </Stack>
                <Stack spacing={1.25}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                    <Typography sx={{ fontWeight: 950 }}>Stored Proof</Typography>
                    <TextField
                      select
                      size="small"
                      label="Filter"
                      value={evidenceFilter}
                      onChange={(event) => setEvidenceFilter(event.target.value as typeof evidenceFilter)}
                      sx={{ minWidth: { xs: '100%', sm: 180 } }}
                    >
                      <MenuItem value="ALL">All evidence</MenuItem>
                      <MenuItem value="FINDINGS">Finding-linked</MenuItem>
                      <MenuItem value="MILESTONES">Milestone-linked</MenuItem>
                      <MenuItem value="REDACTED">Redacted</MenuItem>
                    </TextField>
                  </Stack>
                  {filteredScannerEvidence.length ? filteredScannerEvidence.slice(0, 10).map((evidence) => (
                    <Box key={evidence.id} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: '#e5edf7', bgcolor: evidence.redactionStatus === 'NONE' ? '#fbfdff' : '#fff7f8' }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>{evidence.title}</Typography>
                            <PastelChip label={confidenceDots(evidence.confidenceLevel)} accent={evidence.confidenceLevel === 'HIGH' ? appleColors.green : evidence.confidenceLevel === 'MEDIUM' ? appleColors.amber : appleColors.muted} />
                          </Stack>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.45, lineHeight: 1.45 }}>
                            {evidence.summary || evidence.source} · {shortDateTime(evidence.createdAt)}
                          </Typography>
                        </Box>
                        <Button size="small" variant="outlined" startIcon={<VisibilityOutlined />} disabled={(!evidence.storageKey && !evidence.artifactRef) || openSignedEvidence.isPending} onClick={() => openEvidenceArtifact(evidence)} sx={{ minHeight: 34 }}>
                          Open
                        </Button>
                      </Stack>
                    </Box>
                  )) : (
                    <EmptyState label="No stored scanner proof matches this filter." />
                  )}
                </Stack>
              </Box>
            </Surface>
          )}

          {selectedProduct && workspaceTab === 'findings' && (
            <RepoReadoutPanel
              summary={repoSignals.data}
              scannerSummary={scannerSummary.data}
              isFetching={repoSignals.isFetching}
              isRefreshing={refreshRepoSignals.isPending}
              onRefresh={() => refreshRepoSignals.mutate()}
            />
          )}

          {selectedProduct && workspaceTab === 'actions' && (
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

          {selectedProduct && workspaceTab === 'overview' && (
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

          {selectedProduct && workspaceTab === 'overview' && (
            <LaunchReadinessReportPanel
              report={launchReadinessReport.data ?? null}
              isLoading={launchReadinessReport.isFetching}
              isGenerating={generateLaunchReadinessReport.isPending}
              onGenerate={() => generateLaunchReadinessReport.mutate()}
              title="Launch Readiness Report"
              subtitle="Create a shareable snapshot for the next pilot, paid beta, customer demo, or launch decision. This is deterministic and only updates when you generate it."
            />
          )}

          {selectedProduct && workspaceTab === 'findings' && (
            <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f6fffb 100%)' }}>
              <SectionTitle
                title="Technical Proof and Scanner Fix Path"
                action={<PastelChip label={`${scannerCounts?.total || 0} normalized findings`} accent={scannerOpenFindings.length ? appleColors.amber : appleColors.green} bg={scannerOpenFindings.length ? '#fff4dc' : '#e7f8ee'} />}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '220px repeat(3, minmax(0, 1fr))' }, gap: 1.5, mb: 2 }}>
                <MetricTile label="Ship confidence" value={`${scannerReadiness}%`} detail="Scanner-backed signal" accent={scannerReadiness >= 80 ? appleColors.green : scannerReadiness >= 60 ? appleColors.amber : appleColors.red} icon={<ShieldOutlined />} />
                <MetricTile label="Critical / High" value={`${scannerCounts?.critical || 0}/${scannerCounts?.high || 0}`} detail="Require owner review" accent={(scannerCounts?.critical || scannerCounts?.high) ? appleColors.red : appleColors.green} icon={<BugReportOutlined />} />
                <MetricTile label="Open findings" value={scannerCounts?.open || 0} detail="New, open, or regressed" accent={scannerOpenFindings.length ? appleColors.amber : appleColors.green} icon={<FactCheckOutlined />} />
                <MetricTile label="Evidence sources" value={scannerSummary.data?.sources.length || 0} detail="CI, repo, runtime, or tool imports" accent={appleColors.cyan} icon={<CloudUploadOutlined />} />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${scannerJourney.length}, minmax(0, 1fr))` }, gap: 1, mb: 2 }}>
                {scannerJourney.map((step, index) => {
                  const color = step.complete ? appleColors.green : step.active ? appleColors.purple : appleColors.muted;
                  return (
                    <Box
                      key={step.label}
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: step.active ? `${appleColors.purple}55` : appleColors.line,
                        bgcolor: step.complete ? '#f6fff9' : step.active ? '#f8f7ff' : '#fbfdff',
                        minHeight: 70,
                      }}
                    >
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: `${color}14`, color, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 900 }}>
                          {step.complete ? '✓' : index + 1}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 900, color }}>{step.label}</Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {step.complete ? 'Ready' : step.active ? 'Current focus' : 'Upcoming'}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {scannerToolCoverage.length ? (
                <Box sx={{ mb: 2, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, p: 1.5, bgcolor: '#fff' }}>
                  <SectionTitle
                    title="Scanner Suite Coverage"
                    action={
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <PastelChip label={`${latestCoveredTools}/${scanToolOptions.length} latest`} accent={latestCoveredTools === scanToolOptions.length ? appleColors.green : appleColors.amber} bg={latestCoveredTools === scanToolOptions.length ? '#e7f8ee' : '#fff4dc'} />
                        <PastelChip label={`${latestMappedToolFindings} mapped findings`} accent={latestMappedToolFindings ? appleColors.purple : appleColors.muted} />
                        {unavailableScannerTools > 0 && <PastelChip label={`${unavailableScannerTools} unavailable`} accent={appleColors.red} bg="#fff1f2" />}
                      </Stack>
                    }
                  />
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(5, minmax(0, 1fr))' }, gap: 1 }}>
                    {scannerToolCoverage.map((tool) => {
                      const accent = scannerCoverageAccent(tool);
                      const statusLabel = tool.latestStatus || (!tool.enabled ? 'DISABLED' : !tool.executableAvailable ? 'UNAVAILABLE' : tool.applicable ? 'READY' : 'TARGET_NEEDED');
                      return (
                        <Box key={tool.toolKey} sx={{ p: 1.1, borderRadius: 1, border: '1px solid', borderColor: `${accent}35`, bgcolor: tool.latestStatus === 'COMPLETED' ? '#fbfffd' : '#fbfdff', minHeight: 132 }}>
                          <Stack spacing={0.9} sx={{ height: '100%' }}>
                            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 950 }} noWrap>{tool.displayName}</Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>{formatLabel(tool.depth)} · {formatLabel(tool.targetType)}</Typography>
                              </Box>
                              <StatusChip label={statusLabel} color={scannerCoverageStatusColor(tool)} />
                            </Stack>
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                              <PastelChip label={`${tool.normalizedCount || 0} findings`} accent={tool.normalizedCount ? severityAccent('HIGH') : appleColors.green} bg={tool.normalizedCount ? '#fff1f2' : '#e7f8ee'} />
                              <PastelChip label={`${tool.mappedFindingCount || 0} mapped`} accent={tool.mappedFindingCount ? appleColors.purple : appleColors.muted} />
                            </Stack>
                            <Typography variant="caption" color={tool.latestErrorSummary ? 'error' : 'text.secondary'} sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.35 }}>
                              {tool.latestErrorSummary || (tool.latestCompletedAt ? `Latest ${shortDateTime(tool.latestCompletedAt)}` : tool.applicabilityReason || 'Awaiting first run.')}
                            </Typography>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ) : null}

              <Box sx={{ mb: 2, p: 1.5, borderRadius: 1, border: '1px solid', borderColor: '#dbeafe', background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)' }}>
                <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ lg: 'center' }}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box sx={{ width: 44, height: 44, borderRadius: 1, bgcolor: '#eaf3ff', color: appleColors.blue, display: 'grid', placeItems: 'center' }}>
                      <AutoAwesomeOutlined />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 950 }}>Fix path from scanner findings</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        Stored automatically when scanner proof completes. Refresh only after services, findings, or owner decisions change.
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                    {latestScannerDiagnosis ? (
                      <>
                        <PastelChip label={`${latestScannerDiagnosis.topBlockerCount || 0} priority fixes`} accent={(latestScannerDiagnosis.topBlockerCount || 0) ? appleColors.red : appleColors.green} bg={(latestScannerDiagnosis.topBlockerCount || 0) ? '#fff1f2' : '#e7f8ee'} />
                        <PastelChip label={`${scannerMappedServices.length} services mapped`} accent={appleColors.purple} />
                        <PastelChip label={`${latestScannerDiagnosis.unmappedFindingCount || 0} unmapped`} accent={(latestScannerDiagnosis.unmappedFindingCount || 0) ? appleColors.amber : appleColors.green} bg={(latestScannerDiagnosis.unmappedFindingCount || 0) ? '#fff4dc' : '#e7f8ee'} />
                      </>
                    ) : (
                      hasCompletedScannerRun ? (
                        <PastelChip label="Awaiting refresh" accent={appleColors.amber} bg="#fff4dc" />
                      ) : (
                        <PastelChip label="Runs after scanner" accent={appleColors.muted} />
                      )
                    )}
                    <Button
                      variant={latestScannerDiagnosis ? 'outlined' : 'contained'}
                      startIcon={<RefreshOutlined />}
                      disabled={!hasCompletedScannerRun || createScannerReadinessDiagnosis.isPending}
                      onClick={() =>
                        createScannerReadinessDiagnosis.mutate({
                          ...(selectedWorkspace?.id ? { workspaceId: selectedWorkspace.id } : {}),
                          createServiceRecommendations: true,
                          includeAcceptedRisk: false,
                          summary: `Scanner-backed readiness map for ${selectedProduct.name}.`,
                        })
                      }
                      sx={{ minHeight: 40, px: 2, whiteSpace: 'nowrap' }}
                    >
                      {createScannerReadinessDiagnosis.isPending ? 'Refreshing...' : 'Refresh Map'}
                    </Button>
                  </Stack>
                </Stack>

                {latestScannerDiagnosis ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(3, minmax(0, 1fr))' }, gap: 1, mt: 1.5 }}>
                    {scannerMappedFindings.slice(0, 6).map((finding) => {
                      const recommendedModule = (catalogModules.data || []).find((module) => module.id === finding.recommendedModuleId);
                      const inCart = !!recommendedModule && cartServiceIds.has(recommendedModule.id);
                      return (
                        <Box key={finding.id} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: `${severityAccent(finding.severity)}30`, bgcolor: '#fff' }}>
                          <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                            <Box sx={{ minWidth: 0 }}>
                              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                <PastelChip label={formatLabel(finding.severity)} accent={severityAccent(finding.severity)} bg={`${severityAccent(finding.severity)}12`} />
                                {finding.readinessArea && <PastelChip label={finding.readinessArea} accent={appleColors.cyan} bg="#e4f9fd" />}
                              </Stack>
                              <Typography sx={{ mt: 0.9, fontWeight: 950 }}>{finding.title}</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 900, color: appleColors.muted }}>
                              {typeof finding.mappingConfidence === 'number' ? `${Math.round(finding.mappingConfidence * 100)}%` : 'Mapped'}
                            </Typography>
                          </Stack>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.55 }}>
                            {finding.businessRisk || finding.description}
                          </Typography>
                          <Box sx={{ mt: 1, p: 1, borderRadius: 1, bgcolor: '#fbfdff', border: '1px solid', borderColor: appleColors.line }}>
                            <Typography variant="caption" color="text.secondary">Proof needed</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.5 }}>
                              {finding.evidenceRequired || 'Owner review note and scanner rerun evidence.'}
                            </Typography>
                          </Box>
                          {recommendedModule ? (
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ mt: 1 }}>
                              <PastelChip label={recommendedModule.name} accent={appleColors.purple} />
                              <Button
                                size="small"
                                variant={inCart ? 'outlined' : 'contained'}
                                disabled={inCart || addServiceToCart.isPending}
                                startIcon={<AddShoppingCartOutlined />}
                                onClick={() => addLifecycleService(recommendedModule, 'Fix path from scanner findings')}
                                sx={{ minHeight: 34, minWidth: 128 }}
                              >
                                {inCart ? 'In Plan' : 'Add Service'}
                              </Button>
                            </Stack>
                          ) : (
                            <Alert severity="warning" sx={{ mt: 1, borderRadius: 1 }}>
                              Needs a quick review before this scanner signal can be mapped to a ProdUS service.
                            </Alert>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mt: 1.5, borderRadius: 1 }}>
                    {hasCompletedScannerRun
                      ? 'Older scanner evidence exists without a stored readiness map. Use Refresh Map once to backfill it.'
                      : 'Run a scanner first. ProdUS will store the readiness service map automatically when the scan completes.'}
                  </Alert>
                )}
              </Box>

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

                  <Box sx={{ border: '1px solid', borderColor: appleColors.line, borderRadius: 1, p: 1.5, bgcolor: '#fff' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 1.25 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ArticleOutlined sx={{ color: appleColors.purple }} />
                        <Typography sx={{ fontWeight: 900 }}>Evidence Center</Typography>
                      </Stack>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<CloudUploadOutlined />}
                          disabled={!selectedProduct || createEvidenceExport.isPending}
                          onClick={() => createEvidenceExport.mutate()}
                          sx={{ minHeight: 40, minWidth: 132 }}
                        >
                          Export
                        </Button>
                        <TextField
                          select
                          size="small"
                          label="Filter"
                          value={evidenceFilter}
                          onChange={(event) => setEvidenceFilter(event.target.value as typeof evidenceFilter)}
                          sx={{ minWidth: { xs: '100%', sm: 180 } }}
                        >
                          <MenuItem value="ALL">All evidence</MenuItem>
                          <MenuItem value="FINDINGS">Finding-linked</MenuItem>
                          <MenuItem value="MILESTONES">Milestone-linked</MenuItem>
                          <MenuItem value="REDACTED">Redacted</MenuItem>
                        </TextField>
                      </Stack>
                    </Stack>
                    {filteredScannerEvidence.length ? (
                      <Stack spacing={1}>
                        {filteredScannerEvidence.slice(0, 5).map((evidence) => (
                          <Box key={evidence.id} sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: '#e5edf7', bgcolor: evidence.redactionStatus === 'NONE' ? '#fbfdff' : '#fff7f8' }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                              <Box sx={{ minWidth: 0 }}>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                                  <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>{evidence.title}</Typography>
                                  <PastelChip label={confidenceDots(evidence.confidenceLevel)} accent={evidence.confidenceLevel === 'HIGH' ? appleColors.green : evidence.confidenceLevel === 'MEDIUM' ? appleColors.amber : appleColors.muted} />
                                  <StatusChip label={evidence.redactionStatus} color={evidence.redactionStatus === 'NONE' ? 'success' : 'warning'} />
                                </Stack>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.45 }}>
                                  {evidence.summary || evidence.source} · {shortDateTime(evidence.createdAt)}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={1}>
                                <Tooltip title={evidence.storageKey ? 'Open with a short-lived signed artifact URL' : evidence.artifactRef ? 'Open the stored evidence artifact' : 'No artifact link exists for this evidence item'}>
                                  <span>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      startIcon={<VisibilityOutlined />}
                                      disabled={(!evidence.storageKey && !evidence.artifactRef) || openSignedEvidence.isPending}
                                      onClick={() => openEvidenceArtifact(evidence)}
                                      sx={{ minHeight: 34 }}
                                    >
                                      Open
                                    </Button>
                                  </span>
                                </Tooltip>
                                <Tooltip title={evidence.storageKey ? 'Copy storage key for audit support' : 'No storage key recorded'}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      disabled={!evidence.storageKey}
                                      onClick={() => evidence.storageKey && navigator.clipboard?.writeText(evidence.storageKey)}
                                      sx={{ width: 34, height: 34, borderRadius: 1, border: '1px solid', borderColor: appleColors.line }}
                                    >
                                      <ContentCopyOutlined fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Stack>
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <EmptyState label="No scanner evidence matches this filter yet." />
                    )}
                  </Box>

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
                                onClick={() => setSelectedFindingId(finding.id)}
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

                  {selectedFinding && (
                    <Box sx={{ p: 1.5, borderRadius: 1, border: '1px solid', borderColor: `${findingStatusAccent(selectedFinding.status)}40`, bgcolor: '#fff' }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <ScienceOutlined sx={{ color: findingStatusAccent(selectedFinding.status) }} />
                          <Typography sx={{ fontWeight: 900 }}>Finding Detail</Typography>
                        </Stack>
                        <PastelChip label={selectedFinding.confidenceBasis || 'Evidence-backed'} accent={appleColors.cyan} bg="#e4f9fd" />
                      </Stack>
                      <Typography sx={{ fontWeight: 900 }}>{selectedFinding.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                        {selectedFinding.businessRisk || selectedFinding.description}
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1, mt: 1.25 }}>
                        <Box sx={{ p: 1, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fbfdff' }}>
                          <Typography variant="caption" color="text.secondary">Affected area</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 850 }}>{selectedFinding.readinessArea || selectedFinding.affectedComponent || 'Product surface'}</Typography>
                        </Box>
                        <Box sx={{ p: 1, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fbfdff' }}>
                          <Typography variant="caption" color="text.secondary">Source rule</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 850 }}>{selectedFinding.sourceRuleId || selectedFinding.sourceTool}</Typography>
                        </Box>
                        <Box sx={{ p: 1, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fbfdff' }}>
                          <Typography variant="caption" color="text.secondary">Evidence linked</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 850 }}>{selectedFindingEvidence.length}</Typography>
                        </Box>
                      </Box>
                      {(selectedFinding.evidenceRequired || selectedFinding.mappingReason) && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1, mt: 1.25 }}>
                          {selectedFinding.evidenceRequired && (
                            <Box sx={{ p: 1, border: '1px solid', borderColor: '#dcfce7', borderRadius: 1, bgcolor: '#fbfffd' }}>
                          <Typography variant="caption" color="text.secondary">Proof needed</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.5 }}>{selectedFinding.evidenceRequired}</Typography>
                            </Box>
                          )}
                          {selectedFinding.mappingReason && (
                            <Box sx={{ p: 1, border: '1px solid', borderColor: '#dbeafe', borderRadius: 1, bgcolor: '#fbfdff' }}>
                              <Typography variant="caption" color="text.secondary">Mapping reason</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.5 }}>{selectedFinding.mappingReason}</Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                      <Box sx={{ mt: 1.25 }}>
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
                      </Box>
                      {selectedFindingEvidence.length ? (
                        <Stack spacing={0.75} sx={{ mt: 1.25 }}>
                          {selectedFindingEvidence.slice(0, 3).map((item) => (
                            <Stack key={item.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 0.75 }}>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 850 }} noWrap>{item.title}</Typography>
                                <Typography variant="caption" color="text.secondary">{item.source} · {formatLabel(item.confidenceLevel)}</Typography>
                              </Box>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={(!item.storageKey && !item.artifactRef) || openSignedEvidence.isPending}
                                onClick={() => openEvidenceArtifact(item)}
                                sx={{ minHeight: 34, minWidth: 112 }}
                              >
                                Open Evidence
                              </Button>
                            </Stack>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          No dedicated evidence item is linked to this finding yet.
                        </Typography>
                      )}
                    </Box>
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

          {workspaceTab === 'services' && (
            <>
              <Surface>
                <SectionTitle title="Lifecycle Services" action={<PastelChip label={`${categories.data?.length || 0} service families`} accent={appleColors.purple} />} />
                <Box sx={{ mb: 1.5 }}>
                  <StudioAssistantCard
                    title="AI Service Selector"
                    description="Use catalog knowledge and current product context to narrow the services that belong in the draft cart."
                    prompt={`Recommend the most relevant lifecycle services for ${selectedProduct?.name || 'the selected product'}. Consider current diagnosis, scanner findings, product stage, cart services, dependencies, and launch readiness. Use these visible project start facts directly: ${cartStartPromptFacts} Explain why each service should or should not be selected, identify which missing services are required before workspace start, and avoid proposing services that are already in the cart unless the owner should revisit scope.`}
                    conversationId={`studio-services-${selectedProduct?.id || 'none'}`}
                    context={assistantContext('service-selection')}
                    disabled={!selectedProduct}
                    {...assistantActionProps}
                    accent={appleColors.cyan}
                    cta="Recommend Services"
                  />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 1.5 }}>
              {(categories.data || []).map((category, index) => {
                const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
                const categoryModules = (catalogModules.data || []).filter((module) => module.category?.id === category.id);
                const selected = recommendedServices.some((module) => module.category?.id === category.id)
                  || categoryModules.some((module) => cartServiceIds.has(module.id));

                return (
                  <Box
                    key={category.id}
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: selected ? `${palette.accent}66` : 'divider',
                      borderTop: `3px solid ${palette.accent}`,
                      background: selected ? `linear-gradient(180deg, ${palette.soft}, #fff)` : '#fff',
                      minHeight: 190,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Stack spacing={1.25}>
                      <Box sx={{ width: 48, height: 48, borderRadius: 1, bgcolor: palette.bg, color: palette.accent, display: 'grid', placeItems: 'center', fontWeight: 900 }}>
                        {index + 1}
                      </Box>
                      <Typography variant="h4">{category.name}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {category.description || 'Specialist service category.'}
                      </Typography>
                      <Stack spacing={0.75}>
                        {categoryModules.slice(0, 3).map((module) => {
                          const cartItem = cartServiceItems.find((item) => item.serviceModule.id === module.id);
                          const inCart = !!cartItem;
                          return (
                            <Box
                              key={module.id}
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(0, 1fr) 38px',
                                alignItems: 'center',
                                gap: 0.75,
                                minHeight: 42,
                                px: 1,
                                py: 0.75,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: inCart ? `${palette.accent}55` : '#e5edf7',
                                bgcolor: inCart ? palette.bg : '#fff',
                              }}
                            >
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 850, color: appleColors.ink }} noWrap>
                                  {module.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {module.timelineRange || module.priceRange || 'Lifecycle module'}
                                </Typography>
                              </Box>
                              <Tooltip title={inCart ? 'Remove from draft cart' : 'Add to draft cart for this product'}>
                                <span>
                                  <IconButton
                                    size="small"
                                    disabled={!selectedProduct || addServiceToCart.isPending || removeServiceFromCart.isPending}
                                    onClick={() => {
                                      if (cartItem) {
                                        removeServiceFromCart.mutate(cartItem.id);
                                      } else {
                                        addLifecycleService(module, category.name);
                                      }
                                    }}
                                    sx={{
                                      width: 34,
                                      height: 34,
                                      borderRadius: 1,
                                      color: inCart ? appleColors.red : palette.accent,
                                      bgcolor: inCart ? '#fff7f8' : palette.bg,
                                      border: '1px solid',
                                      borderColor: inCart ? '#fecdd3' : `${palette.accent}24`,
                                    }}
                                  >
                                    {inCart ? <DeleteOutlineOutlined fontSize="small" /> : <AddShoppingCartOutlined fontSize="small" />}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Stack>
                    <DotLabel label={selected ? 'Selected for plan' : 'Available'} color={selected ? palette.accent : appleColors.muted} />
                  </Box>
                );
              })}
                </Box>
              </Surface>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: showProductCreation ? '420px 1fr' : '1fr' }, gap: 2.5 }}>
            {showProductCreation && (
              <Surface>
                <SectionTitle
                  title="Add Product"
                  action={
                    <Button
                      component={NextLink}
                      href="/products/new"
                      size="small"
                      variant="contained"
                      startIcon={<AutoAwesomeOutlined />}
                      sx={{
                        borderRadius: 999,
                        boxShadow: '0 12px 26px rgba(99, 91, 255, 0.2)',
                        textTransform: 'none',
                      }}
                    >
                      AI create
                    </Button>
                  }
                />
                <Box component="form" onSubmit={submitProduct}>
                  <Stack spacing={1.5}>
                    <TextInput label="Name" value={productForm.values.name} onChange={(value) => productForm.setValue('name', value)} />
                    <TextInput label="Summary" value={productForm.values.summary} onChange={(value) => productForm.setValue('summary', value)} multiline />
                    <TextField select fullWidth label="Stage" value={productForm.values.businessStage} onChange={(event) => productForm.setValue('businessStage', event.target.value as ProductProfile['businessStage'])}>
                      {stageOptions.map((stage) => (
                        <MenuItem key={stage} value={stage}>{formatLabel(stage)}</MenuItem>
                      ))}
                    </TextField>
                    <TextInput label="Tech stack" value={productForm.values.techStack} onChange={(value) => productForm.setValue('techStack', value)} />
                    <TextInput label="Known risks" value={productForm.values.riskProfile} onChange={(value) => productForm.setValue('riskProfile', value)} multiline />
                    <SaveButton disabled={!productForm.values.name || createProduct.isPending} label="Create product" />
                  </Stack>
                </Box>
              </Surface>
            )}

            <Surface>
              <SectionTitle title="Product Brief to Service Plan" action={<PastelChip label={`${selectedProductRequirements.length} intakes`} accent={appleColors.blue} />} />
              <Box component="form" onSubmit={submitRequirement} sx={{ mb: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(210px, 1fr) minmax(240px, 1fr) 132px' }, gap: 1.25, alignItems: 'start' }}>
                  <TextField
                    select
                    size="small"
                    label="Requested service"
                    value={requirementForm.values.requestedServiceModuleId || ''}
                    onChange={(event) => requirementForm.setValue('requestedServiceModuleId', event.target.value || null)}
                    sx={compactIntakeFieldSx}
                  >
                    <MenuItem value="">General diagnosis</MenuItem>
                    {(catalogModules.data || []).map((module) => (
                      <MenuItem key={module.id} value={module.id}>{module.name}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    size="small"
                    label="Business goal"
                    value={requirementForm.values.businessGoal}
                    onChange={(event) => requirementForm.setValue('businessGoal', event.target.value)}
                    sx={compactIntakeFieldSx}
                  />
                  <Button
                    type="submit"
                    variant="outlined"
                    disabled={!selectedProduct || !requirementForm.values.businessGoal || createRequirement.isPending}
                    sx={{
                      ...intakeActionButtonSx,
                      borderColor: '#dbe4f0',
                      color: appleColors.purple,
                      bgcolor: '#fff',
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: appleColors.purple,
                        bgcolor: '#f8f7ff',
                        boxShadow: '0 10px 22px rgba(98, 92, 255, 0.12)',
                      },
                    }}
                  >
                    Submit intake
                  </Button>
                </Box>
              </Box>
              <Stack spacing={1.25}>
                {selectedProductRequirements.length ? (
                  selectedProductRequirements.slice(0, 4).map((requirement) => (
                    <Box
                      key={requirement.id}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
                        gap: { xs: 1.25, md: 2 },
                        alignItems: 'center',
                        p: 1.5,
                        border: '1px solid',
                        borderColor: '#e5edf7',
                        borderRadius: 1,
                        background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
                        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.045)',
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900, color: appleColors.ink, lineHeight: 1.25 }}>{requirement.requestedServiceModule?.name || 'Product diagnosis'}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.55 }}>
                          {requirement.businessGoal}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} sx={{ minWidth: { md: 282 } }}>
                        <StatusChip label={requirement.status} />
                        <Button size="small" variant="contained" onClick={() => buildPackage.mutate(requirement.id)} disabled={buildPackage.isPending} sx={intakeActionButtonSx}>
                          Create Plan
                        </Button>
                      </Stack>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">Add lifecycle services to the draft cart, then submit a product brief or create the project workspace directly.</Typography>
                )}
              </Stack>
            </Surface>
              </Box>

              <Surface>
            <SectionTitle title="Service Plan" action={selectedPackage && <StatusChip label={selectedPackage.status} />} />
            {selectedPackage ? (
              <Stack spacing={2}>
                {(packageModules.isFetching || teamRecommendations.isFetching) && <LinearProgress sx={{ borderRadius: 999 }} />}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
                  <Box>
                    <Typography variant="h3">{selectedPackage.name}</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.7 }}>{selectedPackage.summary}</Typography>
                  </Box>
                  <ProgressRing value={packageScore(selectedPackage, packageModules.data)} color={statusAccent(selectedPackage.status)} label="confidence" />
                </Stack>
                <StudioAssistantCard
                  title="AI Package Recommendation"
                  description="Validate this service plan against product goals, dependencies, delivery evidence, and team-readiness."
                  prompt={`Evaluate the service plan "${selectedPackage.name}" for ${selectedProduct?.name || 'this product'}. Use these visible project start facts directly: ${cartStartPromptFacts} Explain whether the package sequence is appropriate, which dependencies or proof gates matter, what a team should prove, and what the owner should decide next. Keep the answer practical for an MVP or AI-built prototype owner.`}
                  conversationId={`studio-package-${selectedPackage.id}`}
                  context={assistantContext('package-recommendation')}
                  {...assistantActionProps}
                  accent={appleColors.purple}
                  cta="Review Package"
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${Math.max(1, packageModules.data?.length || 1)}, 1fr)` }, gap: 1.25 }}>
                  {(packageModules.data || []).map((module, index) => {
                    const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
                    return (
                      <Box key={module.id} sx={{ p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'divider', background: palette.soft }}>
                        <PastelChip label={`Step ${index + 1}`} accent={palette.accent} bg={palette.bg} />
                        <Typography sx={{ mt: 1.25, fontWeight: 900 }}>{module.serviceModule.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.55 }}>{module.acceptanceCriteria || module.serviceModule.acceptanceCriteria}</Typography>
                        <Box sx={{ mt: 1.25 }}><StatusChip label={module.status} /></Box>
                      </Box>
                    );
                  })}
                </Box>
              </Stack>
            ) : (
              <EmptyState label="No service plan exists for this product yet. Create one from a product brief or convert the cart into a project workspace." />
            )}
              </Surface>

              <Surface>
            <SectionTitle title="Team Shortlist and Compare" action={<PastelChip label={`${teamRecommendations.data?.length || 0} matches`} accent={appleColors.cyan} />} />
            {teamRecommendations.data?.length ? (
              <Stack spacing={1.5}>
                {teamRecommendations.data.slice(0, 4).map((recommendation, index) => {
                  const proposal = productProposals.find((item) => item.team.id === recommendation.team.id);
                  const cartTeamItem = cartTalentItems.find((item) => item.team?.id === recommendation.team.id);
                  return (
                    <Box key={recommendation.team.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '82px 1.2fr 1.5fr auto' }, gap: 1.5, alignItems: 'center', py: 1.5, borderTop: index === 0 ? 0 : '1px solid', borderColor: 'divider' }}>
                      <ProgressRing value={Math.round(recommendation.score * 100)} size={72} color={appleColors.cyan} label="match" />
                      <Box>
                        <Typography variant="h4">{recommendation.team.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{recommendation.team.timezone || recommendation.team.typicalProjectSize}</Typography>
                        {proposal && <Typography variant="body2" color="text.secondary">{formatMoney(proposal.fixedPriceCents + proposal.platformFeeCents, proposal.currency)} · {proposal.timelineDays} days</Typography>}
                      </Box>
                      <Stack spacing={0.5}>
                        {recommendation.reasons.slice(0, 3).map((reason) => <DotLabel key={reason} label={reason} color={appleColors.green} />)}
                      </Stack>
                      <Stack spacing={1}>
                        <Button
                          variant={cartTeamItem ? 'contained' : 'outlined'}
                          size="small"
                          startIcon={cartTeamItem ? <DeleteOutlineOutlined /> : <AddShoppingCartOutlined />}
                          onClick={() => {
                            if (cartTeamItem) {
                              removeTalentFromCart.mutate(cartTeamItem.id);
                            } else {
                              addRecommendationTeamToCart(recommendation);
                            }
                          }}
                          disabled={addTalentToCart.isPending || removeTalentFromCart.isPending}
                        >
                          {cartTeamItem ? 'Remove Team' : 'Add Team'}
                        </Button>
                        <Button
                          variant={activeShortlists.some((item) => item.team.id === recommendation.team.id && item.status === 'COMPARED') ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => recordShortlist(recommendation.team.id, 'COMPARED')}
                          disabled={upsertShortlist.isPending}
                        >
                          Compare
                        </Button>
                        <Button
                          variant={activeShortlists.some((item) => item.team.id === recommendation.team.id) ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => recordShortlist(recommendation.team.id, 'ACTIVE')}
                          disabled={upsertShortlist.isPending}
                        >
                          Shortlist
                        </Button>
                        {proposal?.status === 'SUBMITTED' ? (
                          <Button variant="contained" size="small" onClick={() => acceptProposal.mutate(proposal.id)} disabled={acceptProposal.isPending}>
                            Accept
                          </Button>
                        ) : (
                          <StatusChip label={proposal?.status || recommendation.team.verificationStatus} color={proposal?.status === 'OWNER_ACCEPTED' ? 'success' : 'default'} />
                        )}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <Stack spacing={1.5}>
                <EmptyState label={selectedPackage ? 'No team recommendations available yet.' : 'Create a service plan to unlock ranked matches. You can still add promising teams or solo experts to the draft cart now.'} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.5 }}>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <GroupAddOutlined sx={{ color: appleColors.cyan }} />
                      <Typography sx={{ fontWeight: 900 }}>Teams to consider</Typography>
                    </Stack>
                    <Stack spacing={1}>
                      {suggestedTeams.map((team) => {
                        const cartTeamItem = cartTalentItems.find((item) => item.team?.id === team.id);
                        return (
                          <Stack key={team.id} direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ border: '1px solid', borderColor: appleColors.line, borderRadius: 1, p: 1 }}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>{team.name}</Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>{team.headline || team.typicalProjectSize}</Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => cartTeamItem ? removeTalentFromCart.mutate(cartTeamItem.id) : addTeamToCart(team)}
                              disabled={addTalentToCart.isPending || removeTalentFromCart.isPending}
                              sx={{ borderRadius: 1, color: cartTeamItem ? appleColors.red : appleColors.cyan, bgcolor: cartTeamItem ? '#fff7f8' : '#e4f9fd' }}
                            >
                              {cartTeamItem ? <DeleteOutlineOutlined fontSize="small" /> : <AddShoppingCartOutlined fontSize="small" />}
                            </IconButton>
                          </Stack>
                        );
                      })}
                    </Stack>
                  </Box>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <PersonAddAltOutlined sx={{ color: appleColors.purple }} />
                      <Typography sx={{ fontWeight: 900 }}>Solo experts</Typography>
                    </Stack>
                    <Stack spacing={1}>
                      {suggestedExperts.map((expert) => {
                        const cartExpertItem = cartTalentItems.find((item) => item.expertProfile?.id === expert.id);
                        return (
                          <Stack key={expert.id} direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ border: '1px solid', borderColor: appleColors.line, borderRadius: 1, p: 1 }}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>{expert.displayName}</Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>{expert.headline || expert.skills}</Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => cartExpertItem ? removeTalentFromCart.mutate(cartExpertItem.id) : addExpertToCart(expert)}
                              disabled={addTalentToCart.isPending || removeTalentFromCart.isPending}
                              sx={{ borderRadius: 1, color: cartExpertItem ? appleColors.red : appleColors.purple, bgcolor: cartExpertItem ? '#fff7f8' : '#f1efff' }}
                            >
                              {cartExpertItem ? <DeleteOutlineOutlined fontSize="small" /> : <AddShoppingCartOutlined fontSize="small" />}
                            </IconButton>
                          </Stack>
                        );
                      })}
                    </Stack>
                  </Box>
                </Box>
              </Stack>
            )}
              </Surface>
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
              onPrimaryAction={() => setWorkspaceTab(launchStatus.blockerCount ? 'actions' : topRecommendedServiceName ? 'services' : 'findings')}
              secondary={
                <Button variant="outlined" startIcon={<EventRepeatOutlined />} onClick={() => setTimelineOpen(true)} sx={{ minHeight: 38 }}>
                  View timeline
                </Button>
              }
            />
          )}

          <Box id="project-cart" sx={{ scrollMarginTop: 96 }}>
          <Surface>
            <SectionTitle
              title="Project Start Plan"
              action={<ShoppingCartOutlined sx={{ color: appleColors.purple }} />}
            />
            <Stack spacing={1.5}>
              {cartNotice && (
                <Alert severity="success" onClose={() => setCartNotice('')} sx={{ borderRadius: 1 }}>
                  {cartNotice}
                </Alert>
              )}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {selectedProduct ? `Draft for ${selectedProduct.name}` : 'Select a product before starting a workspace'}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                  <PastelChip label={`${cart.data?.serviceItems.length || 0} services`} accent={appleColors.purple} />
                  <PastelChip label={`${cart.data?.talentItems.length || 0} teams / experts`} accent={appleColors.cyan} bg="#e4f9fd" />
                  {cartStartReadiness?.status && <PastelChip label={formatLabel(cartStartReadiness.status)} accent={canStartProjectWorkspace ? appleColors.green : cartBlockers > 0 ? appleColors.red : appleColors.amber} bg={canStartProjectWorkspace ? '#e7f8ee' : cartBlockers > 0 ? '#fff1f2' : '#fff7ed'} />}
                </Stack>
                {cartStartReadiness?.summary && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.55 }}>
                    {cartStartReadiness.summary}
                  </Typography>
                )}
              </Box>

              {(cart.data?.serviceItems || []).length ? (
                <Stack spacing={0.75}>
                  {(cart.data?.serviceItems || []).map((item) => (
                    <Stack
                      key={item.id}
                      direction="row"
                      spacing={1}
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>
                          {item.serviceModule.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.serviceModule.category?.name || 'Lifecycle service'}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="text"
                        color="error"
                        onClick={() => removeServiceFromCart.mutate(item.id)}
                        disabled={removeServiceFromCart.isPending}
                        sx={{ minHeight: 32, minWidth: 72 }}
                      >
                        Remove
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Use the add-to-cart buttons on productization services to collect the work needed before this becomes a project.
                </Typography>
              )}

              {cartBlockingGaps.length > 0 && (
                <Surface sx={{ boxShadow: 'none', bgcolor: '#fff7ed', borderColor: '#fed7aa' }}>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AutoAwesomeOutlined sx={{ color: appleColors.amber }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 900 }}>
                          Before this becomes a workspace
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          These practical gaps keep the first project workspace useful instead of vague.
                        </Typography>
                      </Box>
                    </Stack>
                    {cartBlockingGaps.map((gap) => (
                      <Box
                        key={`${gap.type}-${gap.serviceModule?.id || gap.title}`}
                        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto' }, gap: 1, alignItems: 'center' }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 900 }}>{gap.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {gap.description || 'Required before starting.'}
                          </Typography>
                        </Box>
                        {gap.serviceModule ? (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<AddShoppingCartOutlined />}
                            disabled={addServiceToCart.isPending}
                            onClick={() => addServiceToCart.mutate({
                              serviceModuleId: gap.serviceModule!.id,
                              notes: `Added from the project start plan. ${gap.description || ''}`.trim(),
                            })}
                            sx={{ minHeight: 36 }}
                          >
                            Add
                          </Button>
                        ) : (
                          <Button component={NextLink} href={gap.type === 'PRODUCT' ? '/products/new' : '/services'} size="small" variant="outlined" sx={{ minHeight: 36 }}>
                            Open
                          </Button>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Surface>
              )}

              {(cart.data?.talentItems || []).length ? (
                <Stack spacing={0.75}>
                  {(cart.data?.talentItems || []).map((item) => (
                    <Stack key={item.id} direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>
                          {item.team?.name || item.expertProfile?.displayName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{formatLabel(item.itemType)}</Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => removeTalentFromCart.mutate(item.id)}
                        disabled={removeTalentFromCart.isPending}
                        sx={{ width: 34, height: 34, borderRadius: 1, color: appleColors.red, bgcolor: '#fff7f8' }}
                      >
                        <DeleteOutlineOutlined fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Add matched teams or solo experts before converting this draft into a project workspace.
                </Typography>
              )}

              <Divider />
              <TextField
                size="small"
                label="Project workspace name"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder={selectedProduct ? `${selectedProduct.name} productization workspace` : 'Productization workspace'}
              />

              <Button
                variant="contained"
                startIcon={<RocketLaunchOutlined />}
                disabled={!canStartProjectWorkspace || convertCart.isPending}
                onClick={() => convertCart.mutate()}
                sx={{ minHeight: 44 }}
              >
                {convertCart.isPending ? 'Creating...' : 'Start Project Workspace'}
              </Button>
              {!selectedProduct && <DotLabel label="Select a product before starting" color={appleColors.amber} />}
              {selectedProduct && !cartServiceItems.length && <DotLabel label="Add at least one productization service" color={appleColors.amber} />}
              {selectedProduct && cartServiceItems.length > 0 && cartBlockers > 0 && (
                <DotLabel
                  label={`Add these services first: ${cartBlockingGaps.map((gap) => gap.title).join(', ') || cartBlockingRecommendations.map((item) => item.recommendedModule.name).join(', ')}`}
                  color={appleColors.red}
                />
              )}
              {(selectedWorkspace || cart.data?.convertedWorkspace) && (
                <Button component={NextLink} href="/workspaces" variant="outlined" endIcon={<OpenInNewOutlined />} sx={{ minHeight: 42 }}>
                  Open Project Workspace
                </Button>
              )}
            </Stack>
          </Surface>
          </Box>

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

          {workspaceTab === 'services' && (
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

          {workspaceTab === 'services' && (
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
      <OwnerWorkspaceTimelineDialog
        open={timelineOpen}
        items={workspaceTimeline}
        onClose={() => setTimelineOpen(false)}
      />
    </>
  );
}
