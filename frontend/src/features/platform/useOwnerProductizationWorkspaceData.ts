'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getJson, postJson } from './api';
import type {
  AIRecommendation,
  AssistantSuggestionsResponse,
  ConnectorPermission,
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
  ScannerConnectorInstallation,
  ServiceCategory,
  ServiceModule,
  ShipConfidenceHistory,
  SupportRequest,
  Team,
  TeamRecommendation,
  TeamShortlist,
} from './types';

interface OwnerProductizationWorkspaceDataInput {
  selectedProductId: string;
  selectedPackageId: string;
  selectedFindingId: string;
}

export function useOwnerProductizationWorkspaceData({
  selectedProductId,
  selectedPackageId,
  selectedFindingId,
}: OwnerProductizationWorkspaceDataInput) {
  const queryClient = useQueryClient();
  const [lastDiagnosisRefreshRunId, setLastDiagnosisRefreshRunId] = useState('');
  const [lastRepoSignalAutoRefreshProductId, setLastRepoSignalAutoRefreshProductId] = useState('');

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
  const connectorPermissions = useQuery({
    queryKey: ['scanner-connector-permissions'],
    queryFn: () => getJson<ConnectorPermission[]>('/scanner/connector-permissions'),
  });
  const scannerConnectors = useQuery({
    queryKey: ['scanner-connectors'],
    queryFn: () => getJson<ScannerConnectorInstallation[]>('/scanner/connectors'),
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
        content: `Suggest the next useful product actions for ${selectedProduct?.name || 'this product'}.`,
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

  const latestCompletedScannerRunId = scannerSummary.data?.recentRuns.find((run) => run.status === 'COMPLETED')?.id || '';
  useEffect(() => {
    if (!selectedProductId || !latestCompletedScannerRunId || latestCompletedScannerRunId === lastDiagnosisRefreshRunId) return;
    setLastDiagnosisRefreshRunId(latestCompletedScannerRunId);
    queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProductId, 'diagnoses'] });
    queryClient.invalidateQueries({ queryKey: ['productization-engine', selectedProductId, 'ship-confidence'] });
    queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
    queryClient.invalidateQueries({ queryKey: ['repo-signals', selectedProductId] });
  }, [latestCompletedScannerRunId, lastDiagnosisRefreshRunId, queryClient, selectedProductId]);

  useEffect(() => {
    const productId = selectedProduct?.id;
    const hasRepoContext = Boolean(
      selectedProduct?.repositoryUrl
      || selectedProduct?.techStack
      || scannerSummary.data?.sources.length
      || scannerSummary.data?.recentRuns.length
    );
    if (
      !productId
      || repoSignals.data?.sourceStatus !== 'NOT_REFRESHED'
      || !hasRepoContext
      || repoSignals.isFetching
      || lastRepoSignalAutoRefreshProductId === productId
    ) {
      return;
    }
    setLastRepoSignalAutoRefreshProductId(productId);
    void postJson<RepoSignalSummary, Record<string, never>>(`/products/${productId}/repo-signals/refresh`, {})
      .then((summary) => {
        queryClient.setQueryData(['repo-signals', productId], summary);
      })
      .catch(() => {
        queryClient.invalidateQueries({ queryKey: ['repo-signals', productId] });
      });
  }, [
    lastRepoSignalAutoRefreshProductId,
    queryClient,
    repoSignals.data?.sourceStatus,
    repoSignals.isFetching,
    scannerSummary.data?.recentRuns.length,
    scannerSummary.data?.sources.length,
    selectedProduct?.id,
    selectedProduct?.repositoryUrl,
    selectedProduct?.techStack,
  ]);

  const primaryQueries = [
    products,
    requirements,
    packages,
    workspaces,
    categories,
    catalogModules,
    proposals,
    supportRequests,
    recommendations,
    teams,
    experts,
    cart,
    diagnoses,
    shipConfidence,
    launchReadinessReport,
    scannerSummary,
    repoSignals,
    scannerConnectors,
  ];
  const dependentQueries = [packageModules, teamRecommendations, milestones, shortlists];

  return {
    products,
    requirements,
    packages,
    workspaces,
    categories,
    catalogModules,
    proposals,
    supportRequests,
    recommendations,
    teams,
    experts,
    cart,
    diagnoses,
    shipConfidence,
    launchReadinessReport,
    scannerSummary,
    repoSignals,
    connectorPermissions,
    scannerConnectors,
    packageModules,
    teamRecommendations,
    milestones,
    shortlists,
    assistantSuggestions,
    productList,
    selectedProduct,
    selectedProductPackages,
    selectedPackage,
    selectedProductRequirements,
    selectedWorkspace,
    queriesLoading: primaryQueries.some((query) => query.isLoading),
    queryError: [...primaryQueries, ...dependentQueries, connectorPermissions].find((query) => query.error)?.error,
  };
}
