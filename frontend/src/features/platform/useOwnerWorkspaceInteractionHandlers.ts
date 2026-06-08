'use client';

import { useEffect } from 'react';
import type { Dispatch, FormEventHandler, SetStateAction } from 'react';
import type {
  CartServicePayload,
  CartTalentPayload,
  CartUpdatePayload,
  FindingStatusPayload,
  ProductProfilePayload,
  RequirementPayload,
  ShortlistPayload,
} from './ownerProductizationWorkspaceConfig';
import type {
  ExpertProfile,
  NormalizedFinding,
  PackageInstance,
  ProductProfile,
  ProductizationCart,
  ServiceModule,
  Team,
  TeamRecommendation,
  TeamShortlist,
} from './types';

interface OwnerWorkspaceFormAdapter<TValues> {
  values: TValues;
  setValue: <TKey extends keyof TValues>(key: TKey, value: TValues[TKey]) => void;
  handleSubmit: (onSubmit: () => void) => FormEventHandler<HTMLFormElement>;
}

interface MutationLike<TVariables> {
  isPending: boolean;
  mutate: (variables: TVariables) => void;
}

interface VoidMutationLike {
  isPending: boolean;
  mutate: () => void;
}

interface OwnerWorkspaceInteractionHandlersInput {
  addServiceToCart: MutationLike<CartServicePayload>;
  addTalentToCart: MutationLike<CartTalentPayload>;
  cart: ProductizationCart | undefined;
  createProduct: VoidMutationLike;
  createRequirement: VoidMutationLike;
  findingReasonById: Record<string, string>;
  findingReviewDueById: Record<string, string>;
  productForm: OwnerWorkspaceFormAdapter<ProductProfilePayload>;
  productId: string | undefined;
  productList: ProductProfile[];
  requirementForm: OwnerWorkspaceFormAdapter<RequirementPayload>;
  selectedPackage: PackageInstance | undefined;
  selectedPackageId: string;
  selectedProduct: ProductProfile | undefined;
  selectedProductId: string;
  setSelectedPackageId: Dispatch<SetStateAction<string>>;
  setSelectedProductId: Dispatch<SetStateAction<string>>;
  updateCart: MutationLike<CartUpdatePayload>;
  updateFindingStatus: MutationLike<{ findingId: string; payload: FindingStatusPayload }>;
  upsertShortlist: MutationLike<ShortlistPayload>;
}

export function useOwnerWorkspaceInteractionHandlers({
  addServiceToCart,
  addTalentToCart,
  cart,
  createProduct,
  createRequirement,
  findingReasonById,
  findingReviewDueById,
  productForm,
  productId,
  productList,
  requirementForm,
  selectedPackage,
  selectedPackageId,
  selectedProduct,
  selectedProductId,
  setSelectedPackageId,
  setSelectedProductId,
  updateCart,
  updateFindingStatus,
  upsertShortlist,
}: OwnerWorkspaceInteractionHandlersInput) {
  useEffect(() => {
    if (!selectedProductId && productList[0]) {
      setSelectedProductId(productList[0].id);
    }
  }, [productList, selectedProductId, setSelectedProductId]);

  useEffect(() => {
    if (selectedPackage?.id && selectedPackage.id !== selectedPackageId) {
      setSelectedPackageId(selectedPackage.id);
    }
  }, [selectedPackage, selectedPackageId, setSelectedPackageId]);

  useEffect(() => {
    if (productId && productId !== selectedProductId) {
      setSelectedProductId(productId);
    }
  }, [productId, selectedProductId, setSelectedProductId]);

  useEffect(() => {
    if (selectedProduct?.id && cart?.status === 'DRAFT' && cart.productProfile?.id !== selectedProduct.id && !updateCart.isPending) {
      updateCart.mutate({
        productProfileId: selectedProduct.id,
        title: `${selectedProduct.name} productization plan`,
        businessGoal: cart.businessGoal || `Move ${selectedProduct.name} toward production-ready delivery with selected lifecycle services and verified talent.`,
      });
    }
  }, [cart?.businessGoal, cart?.productProfile?.id, cart?.status, selectedProduct?.id]);

  const submitProduct = productForm.handleSubmit(() => createProduct.mutate());
  const submitRequirement = requirementForm.handleSubmit(() => {
    if (selectedProduct?.id) {
      requirementForm.setValue('productProfileId', selectedProduct.id);
      createRequirement.mutate();
    }
  });

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
    if (cart?.productProfile?.id !== selectedProduct.id) {
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

  const selectProduct = (nextProductId: string) => {
    setSelectedProductId(nextProductId);
    const product = productList.find((item) => item.id === nextProductId);
    if (product) {
      updateCart.mutate({
        productProfileId: product.id,
        title: `${product.name} productization plan`,
        businessGoal: cart?.businessGoal || `Move ${product.name} toward production-ready delivery with selected lifecycle services and verified talent.`,
      });
    }
  };

  return {
    addExpertToCart,
    addLifecycleService,
    addRecommendationTeamToCart,
    addTeamToCart,
    recordFindingDecision,
    recordShortlist,
    selectProduct,
    submitProduct,
    submitRequirement,
  };
}
