'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import { postFormData, postJson, putJson } from './api';
import { appleColors } from './PlatformComponents';
import {
  buildProductAnalysisChatContext,
  buildProductCreationActionPayload,
  type ProductOnboardingProfileValues,
} from './productOnboardingAiPayloads';
import type {
  AiAssistedProductAnalysisResponse,
  ProductAnalysisMode,
  ProductCreationActionResponse,
  ProductProfile,
  ProductizationCart,
  ServiceModuleRecommendation,
} from './types';

const initialValues: ProductOnboardingProfileValues = {
  name: '',
  summary: '',
  businessStage: 'PROTOTYPE',
  techStack: '',
  productUrl: '',
  repositoryUrl: '',
  riskProfile: '',
};

export const analysisModeOptions: Array<{
  mode: ProductAnalysisMode;
  title: string;
  detail: string;
  accent: string;
}> = [
  {
    mode: 'FULL_WITH_AI_OPPORTUNITIES',
    title: 'Full analysis',
    detail: 'Project intelligence, service plan, scanner focus, AI opportunities, and LoomAI integration path.',
    accent: appleColors.purple,
  },
  {
    mode: 'AI_OPPORTUNITIES',
    title: 'AI integration only',
    detail: 'Evaluate AI opportunities and the LoomAI implementation overview without the full readiness analysis.',
    accent: appleColors.cyan,
  },
];

export function useProductOnboardingWizardState() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [aiBrief, setAiBrief] = useState('');
  const [aiDocumentFiles, setAiDocumentFiles] = useState<
    Array<{ file: File; shareWithAi: boolean }>
  >([]);
  const [aiAnalysis, setAiAnalysis] = useState<AiAssistedProductAnalysisResponse | null>(null);
  const [analysisMode, setAnalysisMode] = useState<ProductAnalysisMode>('FULL_WITH_AI_OPPORTUNITIES');
  const [reviewedServiceRecommendations, setReviewedServiceRecommendations] = useState<
    ServiceModuleRecommendation[]
  >([]);
  const [selectedServiceCodes, setSelectedServiceCodes] = useState<string[]>([]);
  const form = useAdvancedForm<ProductOnboardingProfileValues>({
    initialValues,
    validationRules: {
      name: [{ type: 'required', message: 'Product name is required' }],
      summary: [{ type: 'required', message: 'Product summary is required' }],
    },
  });

  const resetAiAnalysis = () => {
    setAiAnalysis(null);
    setReviewedServiceRecommendations([]);
    setSelectedServiceCodes([]);
  };

  const addAiDocumentFiles = (files: File[]) => {
    if (!files.length) return;
    setAiDocumentFiles(current => [
      ...current,
      ...files.map(file => ({
        file,
        shareWithAi: true,
      })),
    ]);
    resetAiAnalysis();
  };

  const updateAiDocumentShare = (index: number, shareWithAi: boolean) => {
    setAiDocumentFiles(current =>
      current.map((doc, docIndex) => (docIndex === index ? { ...doc, shareWithAi } : doc))
    );
    resetAiAnalysis();
  };

  const removeAiDocumentFile = (index: number) => {
    setAiDocumentFiles(current => current.filter((_, docIndex) => docIndex !== index));
    resetAiAnalysis();
  };

  const createProduct = useMutation({
    mutationFn: async () => {
      const product = await postJson<ProductProfile, ProductOnboardingProfileValues>(
        '/products',
        form.values
      );
      await putJson<
        ProductizationCart,
        { productProfileId: string; title: string; businessGoal: string }
      >('/productization-cart/current', {
        productProfileId: product.id,
        title: `${product.name} productization start plan`,
        businessGoal: form.values.summary,
      });
      return product;
    },
    onSuccess: async product => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
      router.push(`/products/${product.id}`);
    },
  });

  const analyzeProductWithAI = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.append('ownerMessage', aiBrief);
      payload.append('analysisMode', analysisMode);
      if (form.values.name) payload.append('productName', form.values.name);
      if (form.values.businessStage) payload.append('businessStage', form.values.businessStage);
      if (form.values.techStack) payload.append('techStack', form.values.techStack);
      if (form.values.productUrl) payload.append('productUrl', form.values.productUrl);
      if (form.values.repositoryUrl) payload.append('repositoryUrl', form.values.repositoryUrl);
      if (form.values.riskProfile) payload.append('knownRisks', form.values.riskProfile);
      aiDocumentFiles.forEach((item, index) => {
        payload.append('files', item.file);
        if (item.shareWithAi) {
          payload.append('aiSharedFileIndexes', String(index));
        }
      });
      return postFormData<AiAssistedProductAnalysisResponse>(
        '/products/ai-assisted/analyze',
        payload,
        { timeoutMs: 360000 }
      );
    },
    onSuccess: response => {
      setAiAnalysis(response);
      const recommendations = [...(response.analysis.recommendedServiceModules ?? [])].sort(
        (left, right) => (left.sequence ?? 999) - (right.sequence ?? 999)
      );
      setReviewedServiceRecommendations(recommendations);
      setSelectedServiceCodes(
        recommendations
          .filter(recommendation => recommendation.accepted !== false)
          .map(recommendation => recommendation.moduleCode)
      );
      form.setValue('name', response.analysis.productName || form.values.name);
      form.setValue('summary', response.analysis.summary || form.values.summary);
      form.setValue('businessStage', response.analysis.businessStage || form.values.businessStage);
      form.setValue('techStack', response.analysis.techStack || form.values.techStack);
      form.setValue('productUrl', response.analysis.productUrl || form.values.productUrl);
      form.setValue('repositoryUrl', response.analysis.repositoryUrl || form.values.repositoryUrl);
      form.setValue('riskProfile', response.analysis.riskProfile || form.values.riskProfile);
    },
  });

  const createProductFromAIAction = useMutation({
    mutationFn: async () => {
      if (!aiAnalysis) {
        throw new Error('Run AI analysis before creating the project.');
      }
      const actionPayload = buildProductCreationActionPayload({
        aiAnalysis,
        profile: form.values,
        reviewedServiceRecommendations,
        selectedServiceCodes,
      });
      const response = await postJson<ProductCreationActionResponse, Record<string, unknown>>(
        `/products/ai-assisted/intents/${aiAnalysis.intent.id}/create`,
        actionPayload
      );
      return response;
    },
    onSuccess: async response => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['productization-cart'] });
      router.push(`/products/${response.product.id}`);
    },
  });

  const analysisChatContext = () =>
    buildProductAnalysisChatContext({
      aiAnalysis,
      profile: form.values,
      reviewedServiceRecommendations,
      selectedServiceCodes,
    });

  const toggleServiceRecommendation = (moduleCode: string) => {
    setSelectedServiceCodes(current =>
      current.includes(moduleCode)
        ? current.filter(code => code !== moduleCode)
        : [...current, moduleCode]
    );
  };

  const moveServiceRecommendation = (moduleCode: string, direction: -1 | 1) => {
    setReviewedServiceRecommendations(current => {
      const index = current.findIndex(item => item.moduleCode === moduleCode);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) {
        return current;
      }
      const next = [...current];
      const [item] = next.splice(index, 1);
      if (!item) return current;
      next.splice(target, 0, item);
      return next.map((recommendation, orderIndex) => ({
        ...recommendation,
        sequence: orderIndex + 1,
      }));
    });
  };

  const submit = form.handleSubmit(() => createProduct.mutate());
  const selectedAiDocumentCount = aiDocumentFiles.filter(item => item.shareWithAi).length;
  const aiBusy = analyzeProductWithAI.isPending || createProductFromAIAction.isPending;
  const fullAnalysisMode = analysisMode === 'FULL_WITH_AI_OPPORTUNITIES';

  return {
    addAiDocumentFiles,
    aiAnalysis,
    aiBrief,
    aiBusy,
    aiDocumentFiles,
    analysisChatContext,
    analysisMode,
    analyzeProductWithAI,
    createProduct,
    createProductFromAIAction,
    form,
    fullAnalysisMode,
    moveServiceRecommendation,
    removeAiDocumentFile,
    resetAiAnalysis,
    reviewedServiceRecommendations,
    router,
    selectedAiDocumentCount,
    selectedServiceCodes,
    setAiBrief,
    setAnalysisMode,
    submit,
    toggleServiceRecommendation,
    updateAiDocumentShare,
  };
}
