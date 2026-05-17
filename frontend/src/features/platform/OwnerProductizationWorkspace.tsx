'use client';

import NextLink from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AddOutlined,
  AddShoppingCartOutlined,
  AutoAwesomeOutlined,
  BugReportOutlined,
  CancelOutlined,
  CheckCircleOutlineOutlined,
  CloudUploadOutlined,
  CompareArrowsOutlined,
  DeleteOutlineOutlined,
  FactCheckOutlined,
  GroupAddOutlined,
  Inventory2Outlined,
  OpenInNewOutlined,
  PersonAddAltOutlined,
  PlayArrowOutlined,
  RefreshOutlined,
  RocketLaunchOutlined,
  SendOutlined,
  ShoppingCartOutlined,
  ShieldOutlined,
} from '@mui/icons-material';
import { Alert, Box, Button, Checkbox, Divider, FormControlLabel, IconButton, LinearProgress, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material';
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

interface ScanSourcePayload {
  productId: string;
  workspaceId?: string;
  providerType: ScanSource['providerType'];
  displayName: string;
  externalReference: string;
  authorizationStatus: ScanSource['authorizationStatus'];
  scopeNote: string;
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

const productHealth = (product?: ProductProfile, packageInstance?: PackageInstance, modules?: PackageModule[]) => {
  if (!product) return 0;
  if (!packageInstance) return product.businessStage === 'LIVE' ? 66 : 58;
  return packageScore(packageInstance, modules);
};

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
  const diagnoses = useQuery({
    queryKey: ['productization-engine', selectedProductId, 'diagnoses'],
    enabled: !!selectedProductId,
    queryFn: () => getJson<ProductDiagnosis[]>(`/productization-engine/products/${selectedProductId}/diagnoses`),
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

  const [scanSourceForm, setScanSourceForm] = useState({
    providerType: 'GITHUB' as ScanSource['providerType'],
    displayName: 'GitHub Security Pipeline',
    externalReference: '',
    authorizationConfirmed: false,
    scopeNote: 'CI and security evidence imported for production readiness review.',
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
  const updateFindingStatus = useMutation({
    mutationFn: ({ findingId, payload }: { findingId: string; payload: FindingStatusPayload }) =>
      patchJson<NormalizedFinding, FindingStatusPayload>(`/scanner/findings/${findingId}/status`, payload),
    onSuccess: async () => {
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
  const suggestedTeams = (teams.data || []).slice(0, 3);
  const suggestedExperts = (experts.data || []).filter((expert) => expert.active).slice(0, 3);
  const health = productHealth(selectedProduct, selectedPackage, packageModules.data);
  const latestDiagnosis = diagnoses.data?.[0];
  const scannerCounts = scannerSummary.data?.counts;
  const scannerReadiness = scannerSummary.data?.readinessScore ?? (scannerCounts?.total ? 72 : 100);
  const scannerOpenFindings = (scannerSummary.data?.findings || []).filter((finding) => ['NEW', 'OPEN', 'REGRESSED'].includes(finding.status));
  const activeScanRun = scannerSummary.data?.recentRuns.find((run) => run.status === 'QUEUED' || run.status === 'RUNNING');
  const selectedScanSource = (scannerSummary.data?.sources || []).find((source) => source.id === hostedScanForm.sourceId);
  const hostedScanBlockedReason = hostedScanBlockReason(selectedProduct, selectedScanSource, hostedScanForm);
  const blockedMilestones = (milestones.data || []).filter((milestone) => milestone.status === 'BLOCKED').length;
  const submittedRequirement = selectedProductRequirements.find((requirement) => requirement.status === 'SUBMITTED' || requirement.status === 'PACKAGE_RECOMMENDED');
  const buildTargetRequirementId = pendingRequirementId || submittedRequirement?.id || '';

  useEffect(() => {
    if (!scannerUploadForm.sourceId && scannerSummary.data?.sources[0]?.id) {
      setScannerUploadForm((current) => ({ ...current, sourceId: scannerSummary.data?.sources[0]?.id || '' }));
    }
    if (!hostedScanForm.sourceId && scannerSummary.data?.sources[0]?.id) {
      setHostedScanForm((current) => ({ ...current, sourceId: scannerSummary.data?.sources[0]?.id || '' }));
    }
  }, [scannerSummary.data?.sources, scannerUploadForm.sourceId, hostedScanForm.sourceId]);

  const submitProduct = productForm.handleSubmit(() => createProduct.mutate());
  const submitRequirement = requirementForm.handleSubmit(() => {
    if (selectedProduct?.id) {
      requirementForm.setValue('productProfileId', selectedProduct.id);
      createRequirement.mutate();
    }
  });

  const loading = [products, requirements, packages, workspaces, categories, catalogModules, proposals, supportRequests, recommendations, teams, experts, cart, diagnoses, scannerSummary].some((query) => query.isLoading);
  const error = [products, requirements, packages, workspaces, categories, catalogModules, proposals, supportRequests, recommendations, teams, experts, cart, diagnoses, scannerSummary, packageModules, teamRecommendations, milestones, shortlists].find((query) => query.error)?.error
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
    || createScanSource.error
    || uploadScannerEvidence.error
    || startHostedScan.error
    || cancelScannerRun.error
    || rescanRun.error
    || updateFindingStatus.error;

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

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 340px' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          {selectedProduct ? (
            <Surface>
              <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} alignItems={{ lg: 'center' }} justifyContent="space-between">
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                  <Box sx={{ width: 64, height: 64, borderRadius: 1, bgcolor: '#f1efff', color: appleColors.purple, display: 'grid', placeItems: 'center' }}>
                    <Inventory2Outlined />
                  </Box>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="h2">{selectedProduct.name}</Typography>
                      <PastelChip label={formatLabel(selectedProduct.businessStage)} accent={appleColors.purple} />
                    </Stack>
                    <Typography color="text.secondary" sx={{ maxWidth: 760, lineHeight: 1.7, mt: 0.75 }}>
                      {selectedProduct.summary || 'Capture a concise product summary to drive service recommendations.'}
                    </Typography>
                  </Box>
                </Stack>
                <ProgressRing value={health} size={104} color={statusAccent(selectedPackage?.status)} label="health" />
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5, mt: 2.5 }}>
                <MetricTile label="Intakes" value={selectedProductRequirements.length} detail="Requirement records" accent={appleColors.purple} icon={<FactCheckOutlined />} />
                <MetricTile label="Service plan" value={selectedPackage ? formatLabel(selectedPackage.status) : 'Not created'} detail={selectedPackage?.name || 'Create from brief or cart'} accent={statusAccent(selectedPackage?.status)} icon={<RocketLaunchOutlined />} />
                <MetricTile label="Shortlist" value={activeShortlists.length || teamRecommendations.data?.length || productProposals.length} detail="Verified team options" accent={appleColors.cyan} icon={<CompareArrowsOutlined />} />
                <MetricTile label="Blockers" value={blockedMilestones + productSupport.filter((request) => request.slaStatus === 'OVERDUE').length} detail="Milestones and support" accent={blockedMilestones ? appleColors.red : appleColors.green} icon={<CheckCircleOutlineOutlined />} />
              </Box>
            </Surface>
          ) : (
            <EmptyState label="Create a product profile to start the owner productization workflow." />
          )}

          {selectedProduct && (
            <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)' }}>
              <SectionTitle
                title="Diagnosis And Findings"
                action={<PastelChip label={latestDiagnosis ? `${latestDiagnosis.findings.length} findings` : 'Not run'} accent={latestDiagnosis ? appleColors.amber : appleColors.purple} />}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '320px minmax(0, 1fr)' }, gap: 2 }}>
                <Box component="form" onSubmit={diagnosisForm.handleSubmit(() => createDiagnosis.mutate())}>
                  <Stack spacing={1.25}>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      Run a deterministic productization diagnosis from the product profile, owner goal, access signals, and catalog rules. It prepares AI-ready context without executing AI.
                    </Typography>
                    <TextField
                      size="small"
                      label="Production goal"
                      value={diagnosisForm.values.businessGoal}
                      onChange={(event) => diagnosisForm.setValue('businessGoal', event.target.value)}
                    />
                    <TextField
                      size="small"
                      label="Known blockers"
                      value={diagnosisForm.values.currentProblems}
                      onChange={(event) => diagnosisForm.setValue('currentProblems', event.target.value)}
                      multiline
                    />
                    <TextField
                      size="small"
                      label="Access signals"
                      placeholder="Repo available, staging missing, no monitoring, payment flow exists..."
                      value={diagnosisForm.values.accessSignals}
                      onChange={(event) => diagnosisForm.setValue('accessSignals', event.target.value)}
                      multiline
                    />
                    <Button type="submit" variant="contained" disabled={createDiagnosis.isPending} sx={{ minHeight: 42 }}>
                      Run diagnosis
                    </Button>
                  </Stack>
                </Box>
                <Stack spacing={1.25}>
                  {latestDiagnosis ? (
                    <>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between">
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <ProgressRing value={latestDiagnosis.readinessScore} size={82} color={latestDiagnosis.readinessScore >= 70 ? appleColors.green : appleColors.amber} label="ready" />
                          <Box>
                            <Typography variant="h4">{latestDiagnosis.productName}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{latestDiagnosis.summary}</Typography>
                          </Box>
                        </Stack>
                        <PastelChip label={latestDiagnosis.aiExecuted ? 'AI executed' : 'AI-ready, deterministic'} accent={appleColors.blue} bg="#eaf3ff" />
                      </Stack>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
                        {latestDiagnosis.findings.map((finding) => {
                          const recommendedModule = (catalogModules.data || []).find((module) => module.id === finding.recommendedModuleId);
                          const inCart = !!recommendedModule && cartServiceIds.has(recommendedModule.id);
                          return (
                            <Box key={finding.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.25, bgcolor: '#fff' }}>
                              <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontWeight: 900 }}>{finding.title}</Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>{finding.description}</Typography>
                                </Box>
                                <StatusChip label={finding.severity} color={finding.severity === 'CRITICAL' || finding.severity === 'HIGH' ? 'error' : 'warning'} />
                              </Stack>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                                <PastelChip label={finding.confidenceLevel} accent={appleColors.cyan} bg="#e4f9fd" />
                                {finding.recommendedModuleName && <PastelChip label={finding.recommendedModuleName} accent={appleColors.purple} />}
                              </Stack>
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
                    <EmptyState label="No diagnosis has been created for this product yet." />
                  )}
                </Stack>
              </Box>
            </Surface>
          )}

          {selectedProduct && (
            <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f6fffb 100%)' }}>
              <SectionTitle
                title="Scanner Evidence And Readiness"
                action={<PastelChip label={`${scannerCounts?.total || 0} normalized findings`} accent={scannerOpenFindings.length ? appleColors.amber : appleColors.green} bg={scannerOpenFindings.length ? '#fff4dc' : '#e7f8ee'} />}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '220px repeat(3, minmax(0, 1fr))' }, gap: 1.5, mb: 2 }}>
                <MetricTile label="Readiness" value={`${scannerReadiness}%`} detail="Scanner-backed score" accent={scannerReadiness >= 80 ? appleColors.green : scannerReadiness >= 60 ? appleColors.amber : appleColors.red} icon={<ShieldOutlined />} />
                <MetricTile label="Critical / High" value={`${scannerCounts?.critical || 0}/${scannerCounts?.high || 0}`} detail="Require owner review" accent={(scannerCounts?.critical || scannerCounts?.high) ? appleColors.red : appleColors.green} icon={<BugReportOutlined />} />
                <MetricTile label="Open findings" value={scannerCounts?.open || 0} detail="New, open, or regressed" accent={scannerOpenFindings.length ? appleColors.amber : appleColors.green} icon={<FactCheckOutlined />} />
                <MetricTile label="Evidence sources" value={scannerSummary.data?.sources.length || 0} detail="CI, repo, runtime, or tool imports" accent={appleColors.cyan} icon={<CloudUploadOutlined />} />
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
                </Stack>

                <Stack spacing={1.5}>
                  {(scannerSummary.isFetching || uploadScannerEvidence.isPending || startHostedScan.isPending || cancelScannerRun.isPending || rescanRun.isPending || updateFindingStatus.isPending) && <LinearProgress sx={{ borderRadius: 999 }} />}
                  {scannerSummary.data?.sources.length ? (
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {scannerSummary.data.sources.slice(0, 5).map((source) => (
                        <PastelChip
                          key={source.id}
                          label={`${source.displayName} · ${formatLabel(source.authorizationStatus)}`}
                          accent={source.authorizationStatus === 'AUTHORIZED' ? appleColors.green : appleColors.amber}
                          bg={source.authorizationStatus === 'AUTHORIZED' ? '#e7f8ee' : '#fff4dc'}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Add a source or upload CI evidence to create the first product scanner record.</Typography>
                  )}

                  {scannerSummary.data?.findings.length ? (
                    <Stack spacing={1.25}>
                      {scannerSummary.data.findings.slice(0, 8).map((finding) => {
                        const reason = findingReasonById[finding.id] || '';
                        const reviewDue = findingReviewDueById[finding.id] || '';
                        const canResolve = !!reason.trim();
                        const canAcceptRisk = !!reason.trim() && !!reviewDue;
                        return (
                          <Box key={finding.id} sx={{ p: 1.5, borderRadius: 1, border: '1px solid', borderColor: appleColors.line, bgcolor: '#fff' }}>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} justifyContent="space-between" alignItems={{ md: 'flex-start' }}>
                              <Box sx={{ minWidth: 0 }}>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                                  <StatusChip label={finding.severity} color={finding.severity === 'CRITICAL' || finding.severity === 'HIGH' ? 'error' : 'warning'} />
                                  <StatusChip label={finding.status} color={finding.status === 'RESOLVED' ? 'success' : 'default'} />
                                  {finding.recommendedModule && <PastelChip label={finding.recommendedModule.name} accent={appleColors.purple} />}
                                </Stack>
                                <Typography sx={{ mt: 1, fontWeight: 900 }}>{finding.title}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>{finding.description}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                                  {finding.sourceTool}{finding.sourceRuleId ? ` · ${finding.sourceRuleId}` : ''}{finding.affectedComponent ? ` · ${finding.affectedComponent}` : ''}
                                </Typography>
                              </Box>
                            </Stack>
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

          <Surface>
            <SectionTitle title="Lifecycle Services" action={<PastelChip label={`${categories.data?.length || 0} service families`} accent={appleColors.purple} />} />
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
                <SectionTitle title="Add Product" action={<AddOutlined sx={{ color: appleColors.purple }} />} />
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
        </Stack>

        <Stack spacing={2.5}>
          <Box id="project-cart" sx={{ scrollMarginTop: 96 }}>
          <Surface>
            <SectionTitle
              title="Draft Project Cart"
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
                </Stack>
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
                  Use the add-to-cart buttons on lifecycle services to collect the work needed before this becomes a project.
                </Typography>
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
                disabled={!selectedProduct || !(cart.data?.serviceItems || []).length || convertCart.isPending}
                onClick={() => convertCart.mutate()}
                sx={{ minHeight: 44 }}
              >
                {convertCart.isPending ? 'Creating...' : 'Start Project Workspace'}
              </Button>
              {(selectedWorkspace || cart.data?.convertedWorkspace) && (
                <Button component={NextLink} href="/workspaces" variant="outlined" endIcon={<OpenInNewOutlined />} sx={{ minHeight: 42 }}>
                  Open Project Workspace
                </Button>
              )}
            </Stack>
          </Surface>
          </Box>

          <Surface>
            <SectionTitle title="AI Owner Brief" action={<AutoAwesomeOutlined sx={{ color: appleColors.purple }} />} />
            <Stack direction="row" spacing={2} alignItems="center">
              <ProgressRing value={health || 68} size={92} color={appleColors.purple} label="/100" />
              <Box>
                <Typography variant="h4">Productization clarity</Typography>
                <Typography color="success.main" sx={{ fontWeight: 800 }}>Evidence-led next steps</Typography>
              </Box>
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.7 }}>
              {recommendations.data?.[0]?.rationale || 'Use lifecycle services, plan evidence, and verified teams to keep productization decisions concrete.'}
            </Typography>
          </Surface>

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
                <Button component={NextLink} href="/workspaces" variant="outlined" endIcon={<OpenInNewOutlined />} sx={{ minHeight: 42 }}>
                  Manage workspace
                </Button>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">A workspace appears after service plan handoff.</Typography>
            )}
          </Surface>

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
    </>
  );
}
