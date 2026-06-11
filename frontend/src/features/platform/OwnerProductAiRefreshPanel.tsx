'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postFormData, putJson } from './api';
import OwnerProductAiRefreshReviewView from './OwnerProductAiRefreshReviewView';
import OwnerProductAiRefreshSetupView from './OwnerProductAiRefreshSetupView';
import {
  buildFieldSuggestions,
  changedFields,
  fieldOrder,
  suggestedFieldValue,
  textValue,
  toBusinessStage,
  type ProductProfileField,
  type ProductProfileUpdatePayload,
} from './ownerProductAiRefreshModel';
import type { AiAssistedProductAnalysisResponse, ProductProfile } from './types';

interface OwnerProductAiRefreshPanelProps {
  mode?: 'setup' | 'review';
  product: ProductProfile;
}

export default function OwnerProductAiRefreshPanel({
  mode = 'setup',
  product,
}: OwnerProductAiRefreshPanelProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams?.toString() || '';
  const [ownerNote, setOwnerNote] = useState('');
  const [analysis, setAnalysis] = useState<AiAssistedProductAnalysisResponse | null>(null);
  const [selectedFields, setSelectedFields] = useState<ProductProfileField[]>([]);

  const openOverviewView = (view: 'refresh' | 'refresh-review') => {
    const next = new URLSearchParams(searchParamString);
    const routePath = pathname || `/products/${product.id}`;
    next.set('tab', 'overview');
    next.set('view', view);
    next.delete('proof');
    router.push(`${routePath}?${next.toString()}`, { scroll: false });
  };

  const suggestions = useMemo(() => {
    if (!analysis) return [];
    return buildFieldSuggestions(product, analysis.analysis);
  }, [analysis, product]);

  useEffect(() => {
    if (!analysis) return;
    setSelectedFields(current =>
      current.filter(field => suggestions.some(item => item.field === field))
    );
  }, [analysis, suggestions]);

  const analyzeProduct = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.append('analysisMode', 'FULL_WITH_AI_OPPORTUNITIES');
      if (ownerNote.trim()) payload.append('ownerMessage', ownerNote.trim());
      return postFormData<AiAssistedProductAnalysisResponse>(
        `/products/${product.id}/ai-assisted/analyze`,
        payload,
        { timeoutMs: 360000 }
      );
    },
    onSuccess: response => {
      setAnalysis(response);
      setSelectedFields(changedFields(product, response.analysis));
      openOverviewView('refresh-review');
    },
  });

  const updateProduct = useMutation({
    mutationFn: async () => {
      if (!analysis) {
        throw new Error('Run the product brief refresh first.');
      }
      const nextValues = fieldOrder.reduce<ProductProfileUpdatePayload>(
        (payload, field) => {
          if (!selectedFields.includes(field)) return payload;
          const suggested = suggestedFieldValue(analysis.analysis, field);
          if (!textValue(suggested)) return payload;
          if (field === 'businessStage') {
            const businessStage = toBusinessStage(suggested);
            return businessStage ? { ...payload, businessStage } : payload;
          }
          return { ...payload, [field]: suggested };
        },
        {
          name: product.name,
          summary: product.summary || '',
          businessStage: product.businessStage,
          techStack: product.techStack || '',
          productUrl: product.productUrl || '',
          repositoryUrl: product.repositoryUrl || '',
          riskProfile: product.riskProfile || '',
        }
      );

      if (!nextValues.name.trim()) {
        nextValues.name = product.name;
      }
      return putJson<ProductProfile, ProductProfileUpdatePayload>(
        `/products/${product.id}`,
        nextValues
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['repo-signals', product.id] });
      await queryClient.invalidateQueries({
        queryKey: ['productization-engine', product.id, 'diagnoses'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['productization-engine', product.id, 'ship-confidence'],
      });
    },
  });

  if (mode === 'review') {
    return (
      <OwnerProductAiRefreshReviewView
        analysis={analysis}
        isSaving={updateProduct.isPending}
        product={product}
        saveError={updateProduct.error}
        saveSuccess={updateProduct.isSuccess}
        selectedFields={selectedFields}
        suggestions={suggestions}
        onOpenRefresh={() => openOverviewView('refresh')}
        onSave={() => updateProduct.mutate()}
        onSelectedFieldsChange={setSelectedFields}
      />
    );
  }

  return (
    <OwnerProductAiRefreshSetupView
      analysis={analysis}
      analyzeError={analyzeProduct.error}
      isRunning={analyzeProduct.isPending}
      ownerNote={ownerNote}
      product={product}
      selectedFieldCount={selectedFields.length}
      suggestionCount={suggestions.length}
      onOpenReview={() => openOverviewView('refresh-review')}
      onOwnerNoteChange={setOwnerNote}
      onRun={() => analyzeProduct.mutate()}
    />
  );
}
