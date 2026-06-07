'use client';

import { useEffect, useMemo, useState } from 'react';
import { EventRepeatOutlined } from '@mui/icons-material';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import { deleteJson, getJson, patchJson, postJson, putJson } from './api';
import {
  EmptyState,
  PageHeader,
  QueryState,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import OwnerWorkspaceTimelineDialog from './OwnerWorkspaceTimelineDialog';
import { type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import OwnerFindingReviewDrawer from './OwnerFindingReviewDrawer';
import StudioAssistantCard, { assistantRecordText, type StudioAssistantContext } from './StudioAssistantCard';
import OwnerWorkspaceActionsPane from './OwnerWorkspaceActionsPane';
import OwnerWorkspaceFindingsPane from './OwnerWorkspaceFindingsPane';
import OwnerWorkspaceProductHero from './OwnerWorkspaceProductHero';
import OwnerWorkspaceOverviewPane from './OwnerWorkspaceOverviewPane';
import OwnerWorkspaceServicesPane from './OwnerWorkspaceServicesPane';
import OwnerWorkspaceNavigationPanel from './OwnerWorkspaceNavigationPanel';
import OwnerWorkspaceSideRailPane from './OwnerWorkspaceSideRailPane';
import { findingStatusAccent } from './ownerFindingPresentation';
import { OwnerReadinessVerdictReveal } from './OwnerJourneyCards';
import {
  buildOwnerWorkspaceJourneyItems,
} from './ownerWorkspaceJourneyConfig';
import {
  buildOwnerLaunchStatus,
  ownerCategoryFromSignal,
  workspaceTabs,
} from './ownerWorkspaceModel';
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
import {
  CartConvertPayload,
  CartServicePayload,
  CartTalentPayload,
  CartUpdatePayload,
  DiagnosisPayload,
  DisconnectSourcePayload,
  ExternalImportPayload,
  FindingStatusPayload,
  FullHostedScanPayload,
  HostedScanPayload,
  ProductProfilePayload,
  ProviderSourcePayload,
  RequirementPayload,
  ScanSourcePayload,
  ScannerReadinessDiagnosisPayload,
  ScannerSchedulePayload,
  ScannerUploadPayload,
  ShortlistPayload,
  defaultToolsForDepth,
  externalImportProviders,
  fullHostedScanBlockReason,
  hostedScanBlockReason,
  productHealth,
  productInitialValues,
  requirementInitialValues,
  scanToolOptions,
  shortDateTime,
} from './ownerProductizationWorkspaceConfig';
import type {
  ExternalImportForm,
  HostedScanForm,
  ProviderSourceForm,
  ScannerScheduleForm,
  ScannerUploadForm,
  ScanSourceForm,
} from './scannerProofOperationsTypes';
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
  AssistantSuggestionsResponse,
  ScannerConnectorInstallation,
  ScannerEvidenceItem,
  SignedArtifactResponse,
  ShipConfidenceHistory,
  LaunchReadinessReport,
  FullHostedScanResponse,
} from './types';
import { useOwnerWorkspaceNavigationState } from './useOwnerWorkspaceNavigationState';

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

  const [scanSourceForm, setScanSourceForm] = useState<ScanSourceForm>({
    providerType: 'GITHUB',
    displayName: 'GitHub Security Pipeline',
    externalReference: '',
    authorizationConfirmed: false,
    scopeNote: 'CI and security evidence imported for production readiness review.',
  });
  const [providerSourceForm, setProviderSourceForm] = useState<ProviderSourceForm>({
    installationId: '',
    repositoryFullName: '',
    cloneUrl: '',
    defaultBranch: 'main',
  });
  const [hostedScanForm, setHostedScanForm] = useState<HostedScanForm>({
    sourceId: '',
    depth: 'SAFE_STATIC',
    toolKeys: defaultToolsForDepth('SAFE_STATIC'),
    branchRef: 'main',
    runtimeTargetUrl: '',
    containerImageRef: '',
    authorizationConfirmed: false,
    runtimeAuthorizationConfirmed: false,
    reason: 'Owner authorized scanner execution for productization readiness.',
  });
  const [scannerUploadForm, setScannerUploadForm] = useState<ScannerUploadForm>({
    sourceId: '',
    toolName: 'CodeQL',
    toolVersion: '',
    format: 'SARIF' as ScannerUploadPayload['format'],
    artifactFileName: 'scanner-results.sarif',
    artifactPayload: '',
    milestoneId: '',
  });
  const [externalImportForm, setExternalImportForm] = useState<ExternalImportForm>({
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
  const [scheduleForm, setScheduleForm] = useState<ScannerScheduleForm>({
    intervalDays: '7',
    nextRunAt: '',
    reason: 'Scheduled evidence refresh for productization readiness.',
  });
  const {
    workspaceTab,
    overviewView,
    actionView,
    findingsView,
    servicesView,
    workspaceDetailOpen,
    openWorkspaceArea,
    openWorkspaceDetail,
    openActionView,
    openFindingsView,
    openServicesView,
  } = useOwnerWorkspaceNavigationState();
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
      setCartNotice('Service added to the start plan.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const removeServiceFromCart = useMutation({
    mutationFn: (itemId: string) => deleteJson<ProductizationCart>(`/productization-cart/services/${itemId}`),
    onSuccess: async () => {
      setCartNotice('Service removed from the start plan.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const addTalentToCart = useMutation({
    mutationFn: (payload: CartTalentPayload) => postJson<ProductizationCart, CartTalentPayload>('/productization-cart/talent', payload),
    onSuccess: async () => {
      setCartNotice('Delivery talent added to the start plan.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const removeTalentFromCart = useMutation({
    mutationFn: (itemId: string) => deleteJson<ProductizationCart>(`/productization-cart/talent/${itemId}`),
    onSuccess: async () => {
      setCartNotice('Delivery talent removed from the start plan.');
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
  const topOwnerRisks = buildTopOwnerRisks({ scannerMappedFindings, scannerOpenFindings });
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
  const verdictRisks = buildVerdictRisks(topOwnerRisks);
  const scannerCoverageGroups = buildScannerCoverageGroups({ scannerToolCoverage, scanToolOptions });
  const {
    evidenceReadme,
    primarySource,
    evidenceSummaryItems,
  } = buildEvidenceSummary({
    repoSignals: repoSignals.data,
    scannerSummary: scannerSummary.data,
    selectedProduct,
    hostedRuntimeTarget: hostedScanForm.runtimeTargetUrl,
    latestCompletedTools,
    totalTools: scanToolOptions.length,
  });
  const topRecommendedServiceName = scannerMappedServices[0] || selectedPackage?.name || cartServiceItems[0]?.serviceModule.name || '';
  const serviceRiskItems = buildServiceRiskItems({ topOwnerRisks, topRecommendedServiceName });
  const ownerActionGroups = buildOwnerActionGroups({
    topOwnerRisks,
    weekItems: scannerMappedServices.length ? scannerMappedServices : cartStartGaps.map((gap) => gap.title),
    topRecommendedServiceName,
    latestCompletedTools,
    totalTools: scanToolOptions.length,
    evidenceCount: filteredScannerEvidence.length,
  });
  const groupedFindings = buildGroupedFindings({
    scannerFindings: scannerSummary.data?.findings || [],
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
        return 'Choose at least one lifecycle service for the start plan first.';
      }
      if (cartBlockers > 0) {
        return `Choose required services first: ${cartBlockingGaps.map((gap) => gap.title).join(', ') || cartBlockingRecommendations.map((item) => item.recommendedModule.name).join(', ')}.`;
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
      if (!(cart.data?.serviceItems || []).length) throw new Error('Choose lifecycle services for the start plan before creating a workspace.');
      if (cartBlockers > 0) {
        throw new Error(`Choose required services first: ${cartBlockingGaps.map((gap) => gap.title).join(', ') || cartBlockingRecommendations.map((item) => item.recommendedModule.name).join(', ')}.`);
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

  const {
    overviewJourneyItems,
    actionJourneyItems,
    findingsJourneyItems,
    servicesJourneyItems,
  } = buildOwnerWorkspaceJourneyItems({
    launchStatus,
    hasLaunchReadinessReport: !!launchReadinessReport.data,
    latestDiagnosisFindingCount: latestDiagnosis?.findings.length,
    topOwnerRiskCount: topOwnerRisks.length,
    storedProofCount: filteredScannerEvidence.length,
    scannerFindingCount: scannerCounts?.total || 0,
    scannerOpenFindingCount: scannerOpenFindings.length,
    serviceFamilyCount: categories.data?.length || 0,
    hasSelectedPackage: !!selectedPackage,
    teamMatchCount: teamRecommendations.data?.length || 0,
  });
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
        description="One product-centered command surface for lifecycle service selection, start plan decisions, team comparison, and delivery evidence."
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

          <OwnerWorkspaceNavigationPanel
            currentAreaLabel={currentAreaLabel}
            currentDetailLabel={currentDetailLabel}
            currentJourneyItems={currentJourneyItems}
            currentJourneyValue={currentJourneyValue}
            productName={selectedProduct?.name}
            workspaceDetailOpen={workspaceDetailOpen}
            workspaceTab={workspaceTab}
            onAreaChange={openWorkspaceArea}
            onDetailChange={(value) => openWorkspaceDetail(workspaceTab, value)}
          />

          {selectedProduct && workspaceTab === 'overview' && (
            <OwnerWorkspaceOverviewPane
              view={overviewView}
              detailOpen={workspaceDetailOpen}
              launchCelebration={{
                readinessScore: launchStatus.score,
                blockerCount: launchStatus.blockerCount,
                improvementCount: launchStatus.improvementCount,
                completedChecks: latestCompletedTools,
                totalChecks: scanToolOptions.length,
                isGenerating: generateLaunchReadinessReport.isPending,
                onGenerateReport: () => generateLaunchReadinessReport.mutate(),
              }}
              decision={{
                launchStatus,
                latestCompletedTools,
                totalScanTools: scanToolOptions.length,
                topRecommendedServiceName,
                topOwnerRisks,
                ownerActionGroups,
                scannerCoverageGroups,
                selectedPackage,
                scannerMappedServices,
                onOpenServicesRecommend: () => openServicesView('recommend'),
                onOpenServicesPlan: () => openServicesView('plan'),
                onOpenFindingsEvidence: () => openFindingsView('evidence'),
                onOpenFindingsRisks: () => openFindingsView('risks'),
                onOpenTimeline: () => setTimelineOpen(true),
              }}
              shipConfidence={{
                history: shipConfidence.data,
                isLoading: shipConfidence.isFetching,
                title: 'Ship Confidence History',
                subtitle: 'Every diagnosis and scanner map becomes a checkpoint, so this prototype has a visible path from rough edges to ready-to-ship.',
                showScoreRing: false,
              }}
              launchReadinessReport={{
                report: launchReadinessReport.data ?? null,
                isLoading: launchReadinessReport.isFetching,
                isGenerating: generateLaunchReadinessReport.isPending,
                onGenerate: () => generateLaunchReadinessReport.mutate(),
                title: 'Launch Readiness Report',
                subtitle: 'Create a shareable snapshot for the next pilot, paid beta, customer demo, or launch decision. This is deterministic and only updates when you generate it.',
              }}
            />
          )}

          {selectedProduct && workspaceTab === 'actions' && (
            <OwnerWorkspaceActionsPane
              view={actionView}
              detailOpen={workspaceDetailOpen}
              actionPlan={{
                ownerActionGroups,
                onOpenServicesRecommend: () => openServicesView('recommend'),
              }}
              diagnosis={{
                product: selectedProduct,
                diagnosisForm,
                latestDiagnosis,
                catalogModules: catalogModules.data || [],
                cartServiceIds,
                diagnosisPromptFacts,
                assistantContext: assistantContext('product-diagnosis'),
                assistantActions: assistantActionProps,
                isCreatingDiagnosis: createDiagnosis.isPending,
                isAddingService: addServiceToCart.isPending,
                onCreateDiagnosis: () => createDiagnosis.mutate(),
                onAddService: addLifecycleService,
              }}
            />
          )}

          {selectedProduct && workspaceTab === 'findings' && (
            <OwnerWorkspaceFindingsPane
              view={findingsView}
              detailOpen={workspaceDetailOpen}
              risks={{
                groups: groupedFindings,
                totalFindingCount: scannerSummary.data?.findings.length || 0,
                openGroups: openFindingGroups,
                onGroupToggle: (label, expanded) => setOpenFindingGroups((current) => ({ ...current, [label]: expanded })),
                onReviewFinding: (findingId) => {
                  setSelectedFindingId(findingId);
                  setFindingDrawerOpen(true);
                },
                onOpenTechnicalProof: () => openFindingsView('technical'),
              }}
              evidence={{
                summaryItems: evidenceSummaryItems,
                sources: scannerSummary.data?.sources || [],
                evidence: filteredScannerEvidence,
                evidenceFilter,
                isExporting: createEvidenceExport.isPending,
                isOpeningEvidence: openSignedEvidence.isPending,
                onEvidenceFilterChange: setEvidenceFilter,
                onExport: () => createEvidenceExport.mutate(),
                onOpenEvidence: openEvidenceArtifact,
                formatDateTime: shortDateTime,
              }}
              repoReadout={{
                summary: repoSignals.data,
                scannerSummary: scannerSummary.data,
                isFetching: repoSignals.isFetching,
                isRefreshing: refreshRepoSignals.isPending,
                onRefresh: () => refreshRepoSignals.mutate(),
              }}
              technical={{
                runway: {
                  scannerReadiness,
                  criticalCount: scannerCounts?.critical || 0,
                  highCount: scannerCounts?.high || 0,
                  openFindingCount: scannerCounts?.open || 0,
                  sourceCount: scannerSummary.data?.sources.length || 0,
                  evidenceCount: filteredScannerEvidence.length,
                  latestCoveredTools,
                  totalTools: scanToolOptions.length,
                  normalizedFindingCount: scannerCounts?.total || 0,
                  activeScanRun: Boolean(activeScanRun),
                  fullSuiteBlockedReason: fullHostedScanBlockedReason,
                  isStartingFullSuite: startFullHostedScan.isPending,
                  isExporting: createEvidenceExport.isPending,
                  onRunFullSuite: () => startFullHostedScan.mutate(),
                  onReviewBlockers: () => openFindingsView('risks'),
                  onExportProof: () => createEvidenceExport.mutate(),
                },
                coverage: {
                  tools: scannerToolCoverage,
                  latestCoveredTools,
                  totalTools: scanToolOptions.length,
                  latestMappedToolFindings,
                  unavailableScannerTools,
                },
                fixPath: {
                  diagnosis: latestScannerDiagnosis,
                  mappedFindings: scannerMappedFindings,
                  mappedServiceNames: scannerMappedServices,
                  serviceModules: catalogModules.data || [],
                  cartServiceIds,
                  hasCompletedScannerRun,
                  isRefreshing: createScannerReadinessDiagnosis.isPending,
                  isAddingService: addServiceToCart.isPending,
                  onRefreshMap: () =>
                    createScannerReadinessDiagnosis.mutate({
                      ...(selectedWorkspace?.id ? { workspaceId: selectedWorkspace.id } : {}),
                      createServiceRecommendations: true,
                      includeAcceptedRisk: false,
                      summary: `Scanner-backed readiness map for ${selectedProduct.name}.`,
                    }),
                  onAddService: addLifecycleService,
                },
                assistant: {
                  title: 'AI Fix Path Summary',
                  description: 'Summarize scanner findings, explain the highest-risk fixes, and turn proof into practical productization actions.',
                  prompt: `Do not call write actions for this answer. Summarize scanner ship-readiness for ${selectedProduct.name}. Current scanner score is ${scannerReadiness}/100 with ${scannerCounts?.critical || 0} critical, ${scannerCounts?.high || 0} high, and ${scannerCounts?.open || 0} open findings. Top visible findings: ${scannerOpenFindings.slice(0, 4).map((finding) => `${finding.title} (${finding.severity}, ${finding.status})`).join('; ') || 'none'}. ${scannerReadinessPromptFacts} Prioritize critical and high findings, explain the business risk in plain language, identify missing proof, and recommend lifecycle services or milestone actions. Use the provided context and visible facts directly. Avoid raw artifact details.`,
                  conversationId: `studio-scanner-${selectedProduct.id}-${selectedFinding?.id || 'summary'}`,
                  context: assistantContext('scanner-readiness', { findingId: selectedFinding?.id }),
                  ...assistantActionProps,
                  accent: scannerOpenFindings.length ? appleColors.amber : appleColors.green,
                  cta: 'Summarize Fixes',
                },
                operations: {
                  selectedProduct,
                  selectedWorkspace,
                  milestones: milestones.data || [],
                  scannerSources: scannerSummary.data?.sources || [],
                  scanToolOptions,
                  externalImportProviders,
                  selectedConnectorPermission,
                  activeProviderInstallations,
                  activeScanRun,
                  hostedScanBlockedReason,
                  fullHostedScanBlockedReason,
                  scheduleBlockedReason,
                  scanSourceForm,
                  setScanSourceForm,
                  providerSourceForm,
                  setProviderSourceForm,
                  hostedScanForm,
                  setHostedScanForm,
                  scheduleForm,
                  setScheduleForm,
                  scannerUploadForm,
                  setScannerUploadForm,
                  externalImportForm,
                  setExternalImportForm,
                  ciTemplateType,
                  setCiTemplateType,
                  ciTemplate,
                  isCreatingSource: createScanSource.isPending,
                  isRequestingConnectorInstall: requestConnectorInstall.isPending,
                  isCreatingProviderSource: createProviderSource.isPending,
                  isStartingHostedScan: startHostedScan.isPending,
                  isStartingFullHostedScan: startFullHostedScan.isPending,
                  isCancelingScan: cancelScannerRun.isPending,
                  isCreatingSchedule: createScannerSchedule.isPending,
                  isUploadingEvidence: uploadScannerEvidence.isPending,
                  isImportingExternalEvidence: importExternalEvidence.isPending,
                  isFetchingCiTemplate: fetchCiTemplate.isPending,
                  onCreateScanSource: () => createScanSource.mutate(),
                  onRequestConnectorInstall: (provider) => requestConnectorInstall.mutate(provider),
                  onCreateProviderSource: () => createProviderSource.mutate(),
                  onStartHostedScan: () => startHostedScan.mutate(),
                  onStartFullHostedScan: () => startFullHostedScan.mutate(),
                  onCancelScan: (runId) => cancelScannerRun.mutate(runId),
                  onCreateSchedule: () => createScannerSchedule.mutate(),
                  onUploadScannerEvidence: () => uploadScannerEvidence.mutate(),
                  onImportExternalEvidence: () => importExternalEvidence.mutate(),
                  onFetchCiTemplate: () => fetchCiTemplate.mutate(),
                  defaultToolsForDepth,
                },
                companion: {
                  scannerSummary: scannerSummary.data,
                  filteredScannerEvidence,
                  evidenceFilter,
                  selectedFinding,
                  cartServiceIds,
                  findingReasonById,
                  findingReviewDueById,
                  deleteArtifactsOnDisconnect,
                  activeScanRun,
                  hasProduct: !!selectedProduct,
                  isBusy: scannerSummary.isFetching || createScannerReadinessDiagnosis.isPending || createProviderSource.isPending || requestConnectorInstall.isPending || uploadScannerEvidence.isPending || importExternalEvidence.isPending || fetchCiTemplate.isPending || disconnectScanSource.isPending || startHostedScan.isPending || startFullHostedScan.isPending || cancelScannerRun.isPending || rescanRun.isPending || createScannerSchedule.isPending || updateScannerSchedule.isPending || updateFindingStatus.isPending || openSignedEvidence.isPending || createEvidenceExport.isPending,
                  isDisconnectingSource: disconnectScanSource.isPending,
                  isUpdatingSchedule: updateScannerSchedule.isPending,
                  isOpeningEvidence: openSignedEvidence.isPending,
                  isExportingEvidence: createEvidenceExport.isPending,
                  isUpdatingFindingStatus: updateFindingStatus.isPending,
                  isAddingService: addServiceToCart.isPending,
                  isCancelingScan: cancelScannerRun.isPending,
                  isRescanning: rescanRun.isPending,
                  onDeleteArtifactsChange: setDeleteArtifactsOnDisconnect,
                  onDisconnectSource: (sourceId) => disconnectScanSource.mutate(sourceId),
                  onToggleSchedule: (scheduleId, active) => updateScannerSchedule.mutate({ scheduleId, active }),
                  onEvidenceFilterChange: setEvidenceFilter,
                  onExportEvidence: () => createEvidenceExport.mutate(),
                  onOpenEvidence: openEvidenceArtifact,
                  onSelectFinding: (findingId) => {
                    setSelectedFindingId(findingId);
                    setFindingDrawerOpen(true);
                  },
                  onFindingReasonChange: (findingId, value) => setFindingReasonById((current) => ({ ...current, [findingId]: value })),
                  onFindingReviewDueChange: (findingId, value) => setFindingReviewDueById((current) => ({ ...current, [findingId]: value })),
                  onAddService: addLifecycleService,
                  onRecordFindingDecision: recordFindingDecision,
                  onCancelRun: (runId) => cancelScannerRun.mutate(runId),
                  onRescanRun: (runId) => rescanRun.mutate(runId),
                  formatDateTime: shortDateTime,
                },
              }}
            />
          )}

          {workspaceTab === 'services' && (
            <OwnerWorkspaceServicesPane
              view={servicesView}
              detailOpen={workspaceDetailOpen}
              recommend={{
                product: selectedProduct,
                categories: categories.data || [],
                catalogModules: catalogModules.data || [],
                recommendedServices,
                cartServiceItems,
                cartServiceIds,
                blockerCount: launchStatus.blockerCount,
                improvementCount: launchStatus.improvementCount,
                mappedServiceNames: scannerMappedServices,
                ownerRisks: serviceRiskItems,
                cartStartPromptFacts,
                assistantContext: assistantContext('service-selection'),
                assistantActions: assistantActionProps,
                isAddingService: addServiceToCart.isPending,
                isRemovingService: removeServiceFromCart.isPending,
                onAddService: addLifecycleService,
                onRemoveService: (itemId) => removeServiceFromCart.mutate(itemId),
              }}
              plan={{
                showProductCreation,
                selectedProduct,
                productFormValues: productForm.values,
                requirementFormValues: requirementForm.values,
                selectedProductRequirements,
                catalogModules: catalogModules.data || [],
                selectedPackage,
                packageModules: packageModules.data || [],
                isPackageFetching: packageModules.isFetching,
                isTeamRecommendationsFetching: teamRecommendations.isFetching,
                isCreatingProduct: createProduct.isPending,
                isCreatingRequirement: createRequirement.isPending,
                isBuildingPackage: buildPackage.isPending,
                cartStartPromptFacts,
                packageAssistantContext: assistantContext('package-recommendation'),
                assistantActions: assistantActionProps,
                onProductValueChange: (key, value) => productForm.setValue(key as keyof ProductProfilePayload, value as any),
                onRequirementValueChange: (key, value) => requirementForm.setValue(key as keyof RequirementPayload, value as any),
                onSubmitProduct: submitProduct,
                onSubmitRequirement: submitRequirement,
                onBuildPackage: (requirementId) => buildPackage.mutate(requirementId),
              }}
              team={{
                recommendations: teamRecommendations.data || [],
                productProposals,
                cartTalentItems,
                activeShortlists,
                suggestedTeams,
                suggestedExperts,
                hasServicePlan: !!selectedPackage,
                isAddingTalent: addTalentToCart.isPending,
                isRemovingTalent: removeTalentFromCart.isPending,
                isShortlisting: upsertShortlist.isPending,
                isAcceptingProposal: acceptProposal.isPending,
                onAddRecommendationTeam: addRecommendationTeamToCart,
                onAddTeam: addTeamToCart,
                onAddExpert: addExpertToCart,
                onRemoveTalent: (itemId) => removeTalentFromCart.mutate(itemId),
                onRecordShortlist: recordShortlist,
                onAcceptProposal: (proposalId) => acceptProposal.mutate(proposalId),
              }}
            />
          )}
        </Stack>

        <OwnerWorkspaceSideRailPane
          control={selectedProduct ? {
            status: launchStatus,
            primaryAction: launchStatus.blockerCount ? 'Open action plan' : topRecommendedServiceName ? 'Review service path' : 'Open proof',
            lastScanLabel: scannerSummary.data?.recentRuns[0]?.completedAt ? shortDateTime(scannerSummary.data.recentRuns[0].completedAt) : latestCompletedTools ? `${latestCompletedTools} checks completed` : 'No completed check yet',
            evidenceLabel: `${latestCompletedTools}/${scanToolOptions.length} checks`,
            onPrimaryAction: () => launchStatus.blockerCount ? openActionView('plan') : topRecommendedServiceName ? openServicesView('recommend') : openFindingsView('evidence'),
            secondary: (
              <Button variant="outlined" startIcon={<EventRepeatOutlined />} onClick={() => setTimelineOpen(true)} sx={{ minHeight: 38 }}>
                View timeline
              </Button>
            ),
          } : undefined}
          projectStart={workspaceTab === 'services' && workspaceDetailOpen && (servicesView === 'plan' || servicesView === 'team') ? {
            product: selectedProduct,
            cart: cart.data,
            notice: cartNotice,
            canStartWorkspace: canStartProjectWorkspace,
            blockers: cartBlockers,
            blockingGaps: cartBlockingGaps,
            blockingRecommendationNames: cartBlockingRecommendations.map((item) => item.recommendedModule.name),
            projectName,
            hasWorkspace: !!(selectedWorkspace || cart.data?.convertedWorkspace),
            isAddingService: addServiceToCart.isPending,
            isRemovingService: removeServiceFromCart.isPending,
            isRemovingTalent: removeTalentFromCart.isPending,
            isConverting: convertCart.isPending,
            onNoticeClose: () => setCartNotice(''),
            onProjectNameChange: setProjectName,
            onAddGapService: (serviceModule, notes) => addServiceToCart.mutate({ serviceModuleId: serviceModule.id, notes }),
            onRemoveService: (itemId) => removeServiceFromCart.mutate(itemId),
            onRemoveTalent: (itemId) => removeTalentFromCart.mutate(itemId),
            onConvert: () => convertCart.mutate(),
          } : undefined}
          aiBrief={workspaceDetailOpen && (workspaceTab === 'overview' || workspaceTab === 'actions') ? {
            fallbackReason: assistantSuggestions.data?.fallbackReason,
            isDisabled: !selectedProduct?.id,
            isFetching: assistantSuggestions.isFetching,
            mode: assistantSuggestions.data?.mode,
            recommendationRationale: recommendations.data?.[0]?.rationale,
            suggestions: assistantSuggestions.data?.suggestions || [],
            onSuggest: () => assistantSuggestions.refetch(),
          } : undefined}
          deliveryWorkspace={workspaceTab === 'services' && workspaceDetailOpen && servicesView === 'team' ? {
            assistantActions: assistantActionProps,
            assistantContext: assistantContext('milestone-evidence-readiness', { milestoneId: selectedMilestone?.id }),
            blockedMilestoneCount: blockedMilestones,
            milestones: milestones.data || [],
            selectedMilestone,
            workspace: selectedWorkspace,
          } : undefined}
          supportRisk={workspaceTab === 'services' && workspaceDetailOpen && servicesView === 'team' ? {
            supportRequests: productSupport,
          } : undefined}
          nextDecision={{
            blockedMilestoneCount: blockedMilestones,
            buildTargetRequirementId: buildTargetRequirementId || undefined,
            hasServicePlan: !!selectedPackage,
            hasWorkspace: !!selectedWorkspace,
            isBuilding: buildPackage.isPending,
            proposals: productProposals,
            onBuildPlan: (requirementId) => buildPackage.mutate(requirementId),
          }}
        />
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
