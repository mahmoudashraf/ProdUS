'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteJson, postJson, putJson } from './api';
import type {
  CartConvertPayload,
  CartServicePayload,
  CartTalentPayload,
  CartUpdatePayload,
  DiagnosisPayload,
  ProductProfilePayload,
  RequirementPayload,
  ScannerReadinessDiagnosisPayload,
  ShortlistPayload,
} from './ownerProductizationWorkspaceConfig';
import type {
  LaunchReadinessReport,
  PackageInstance,
  ProductDiagnosis,
  ProductProfile,
  ProductizationCart,
  ProductizationCartConvertResponse,
  ProjectWorkspace,
  QuoteProposal,
  RepoSignalSummary,
  RequirementIntake,
  TeamShortlist,
} from './types';

interface OwnerWorkspaceMutationForm<TValues> {
  values: TValues;
  resetForm: () => void;
}

interface OwnerWorkspaceProductActionsInput {
  cartBusinessGoal: string | undefined;
  diagnosisForm: OwnerWorkspaceMutationForm<DiagnosisPayload>;
  productForm: OwnerWorkspaceMutationForm<ProductProfilePayload>;
  projectName: string;
  requirementForm: OwnerWorkspaceMutationForm<RequirementPayload>;
  selectedPackage: PackageInstance | undefined;
  selectedProduct: ProductProfile | undefined;
  selectedWorkspace: ProjectWorkspace | undefined;
  setCartNotice: (notice: string) => void;
  setPendingRequirementId: (requirementId: string) => void;
  setProjectName: (projectName: string) => void;
  setSelectedPackageId: (packageId: string) => void;
  setSelectedProductId: (productId: string) => void;
}

export function useOwnerWorkspaceProductActions({
  cartBusinessGoal,
  diagnosisForm,
  productForm,
  projectName,
  requirementForm,
  selectedPackage,
  selectedProduct,
  selectedWorkspace,
  setCartNotice,
  setPendingRequirementId,
  setProjectName,
  setSelectedPackageId,
  setSelectedProductId,
}: OwnerWorkspaceProductActionsInput) {
  const queryClient = useQueryClient();

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
      setCartNotice('Service added to the product plan.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const removeServiceFromCart = useMutation({
    mutationFn: (itemId: string) => deleteJson<ProductizationCart>(`/productization-cart/services/${itemId}`),
    onSuccess: async () => {
      setCartNotice('Service removed from the product plan.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const addTalentToCart = useMutation({
    mutationFn: (payload: CartTalentPayload) => postJson<ProductizationCart, CartTalentPayload>('/productization-cart/talent', payload),
    onSuccess: async () => {
      setCartNotice('Delivery talent added to the product plan.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const removeTalentFromCart = useMutation({
    mutationFn: (itemId: string) => deleteJson<ProductizationCart>(`/productization-cart/talent/${itemId}`),
    onSuccess: async () => {
      setCartNotice('Delivery talent removed from the product plan.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });
  const convertCart = useMutation({
    mutationFn: () =>
      postJson<ProductizationCartConvertResponse, CartConvertPayload>('/productization-cart/convert', {
        projectName: projectName || `${selectedProduct?.name || 'Product'} product workspace`,
      }),
    onSuccess: async (result) => {
      setCartNotice('Product workspace created. Open the workspace to manage milestones, evidence, and participants.');
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
        businessGoal: diagnosisForm.values.businessGoal || requirementForm.values.businessGoal || cartBusinessGoal || '',
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

  const productActionError = createProduct.error
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
    || refreshRepoSignals.error;

  return {
    acceptProposal,
    addServiceToCart,
    addTalentToCart,
    buildPackage,
    convertCart,
    createDiagnosis,
    createProduct,
    createRequirement,
    createScannerReadinessDiagnosis,
    generateLaunchReadinessReport,
    productActionError,
    refreshRepoSignals,
    removeServiceFromCart,
    removeTalentFromCart,
    updateCart,
    upsertShortlist,
  };
}
