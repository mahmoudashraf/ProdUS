'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteJson, postJson, putJson } from './api';
import { formatLabel } from './PlatformComponents';
import type {
  CatalogRuleItem,
  ProductizationCart,
  ProductizationCartConvertResponse,
  ProjectWorkspace,
} from './types';

interface CartUpdatePayload {
  productProfileId?: string;
  title?: string;
  businessGoal?: string;
}

interface CartConvertPayload {
  projectName: string;
}

interface ProjectStartPlanActionsInput {
  currentCart?: ProductizationCart | undefined;
  projectName: string;
  setCreatedWorkspace: (workspace: ProjectWorkspace | null) => void;
  setNotice: (notice: string) => void;
  setProjectName: (name: string) => void;
}

export const useProjectStartPlanActions = ({
  currentCart,
  projectName,
  setCreatedWorkspace,
  setNotice,
  setProjectName,
}: ProjectStartPlanActionsInput) => {
  const queryClient = useQueryClient();

  const updateCart = useMutation({
    mutationFn: (payload: CartUpdatePayload) => putJson<ProductizationCart, CartUpdatePayload>('/productization-cart/current', payload),
    onSuccess: async () => {
      setCreatedWorkspace(null);
      setNotice('Product plan product updated.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });

  const removeService = useMutation({
    mutationFn: (itemId: string) => deleteJson<ProductizationCart>(`/productization-cart/services/${itemId}`),
    onSuccess: async () => {
      setNotice('Service removed from the product plan.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });

  const removeTalent = useMutation({
    mutationFn: (itemId: string) => deleteJson<ProductizationCart>(`/productization-cart/talent/${itemId}`),
    onSuccess: async () => {
      setNotice('Team or expert removed from the product plan.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });

  const addRecommendedService = useMutation({
    mutationFn: (payload: { serviceModuleId: string; notes: string }) => postJson<ProductizationCart, { serviceModuleId: string; notes: string }>('/productization-cart/services', payload),
    onSuccess: async () => {
      setNotice('Recommended service chosen for the product plan.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });

  const applyTemplate = useMutation({
    mutationFn: (templateId: string) => postJson<ProductizationCart, Record<string, never>>(`/productization-cart/templates/${templateId}/apply`, {}),
    onSuccess: async () => {
      setCreatedWorkspace(null);
      setNotice('Launch-hardening template applied. Review the suggested next steps before approving the workspace.');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
    },
  });

  const convertCart = useMutation({
    mutationFn: () =>
      postJson<ProductizationCartConvertResponse, CartConvertPayload>('/productization-cart/convert', {
        projectName: projectName || `${currentCart?.productProfile?.name || 'Product'} product workspace`,
      }),
    onSuccess: async (result) => {
      setNotice('Workspace created. Your approved plan became service milestones, participants, and a product workspace.');
      setCreatedWorkspace(result.workspace);
      setProjectName('');
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
      await queryClient.invalidateQueries({ queryKey: ['packages'] });
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const addCatalogRecommendation = (item: CatalogRuleItem) => {
    addRecommendedService.mutate({
      serviceModuleId: item.recommendedModule.id,
      notes: `Chosen from the suggested fix path (${formatLabel(item.source)}). ${item.reason || ''}`.trim(),
    });
  };

  return {
    addCatalogRecommendation,
    addRecommendedService,
    applyTemplate,
    convertCart,
    removeService,
    removeTalent,
    updateCart,
  };
};
