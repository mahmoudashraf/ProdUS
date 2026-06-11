'use client';

import { useMemo, useState } from 'react';
import { Alert, Stack } from '@mui/material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getJson, postFormData, postJson } from './api';
import OwnerProductAiOpportunityDetailsView from './OwnerProductAiOpportunityDetailsView';
import OwnerProductAiOpportunityHome from './OwnerProductAiOpportunityHome';
import OwnerProductAiOpportunityRefreshView from './OwnerProductAiOpportunityRefreshView';
import {
  buildAiOpportunityAcceptancePayload,
  defaultAiOpportunitySelection,
  emptyAiOpportunitySelection,
  type AiOpportunitySelectionState,
} from './ownerProductAiOpportunityModel';
import type { AiJourneyView } from './ownerWorkspaceJourneyConfig';
import type {
  AiAssistedProductAnalysisResponse,
  ProductAiOpportunityAcceptanceResponse,
  ProductAiOpportunityContextResponse,
  ProductProfile,
} from './types';

export default function OwnerProductAiOpportunityPanel({
  product,
  view,
}: {
  product: ProductProfile;
  view: AiJourneyView;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams?.toString() || '';
  const [ownerNote, setOwnerNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [sharedFileIndexes, setSharedFileIndexes] = useState<Set<number>>(new Set());
  const [analysis, setAnalysis] = useState<AiAssistedProductAnalysisResponse | null>(null);
  const [selection, setSelection] = useState<AiOpportunitySelectionState>(emptyAiOpportunitySelection);
  const [acceptedResult, setAcceptedResult] = useState<ProductAiOpportunityAcceptanceResponse | null>(null);
  const aiOpportunityContext = useQuery({
    queryKey: ['product-ai-opportunities', product.id],
    queryFn: () => getJson<ProductAiOpportunityContextResponse>(`/products/${product.id}/ai-opportunities`),
  });

  const openAiView = (nextView: AiJourneyView) => {
    const next = new URLSearchParams(searchParamString);
    const routePath = pathname || `/products/${product.id}`;
    next.set('tab', 'ai');
    next.set('view', nextView);
    next.delete('proof');
    router.push(`${routePath}?${next.toString()}`, { scroll: false });
  };

  const analyzeProduct = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.append('analysisMode', 'AI_OPPORTUNITIES');
      if (ownerNote.trim()) payload.append('ownerMessage', ownerNote.trim());
      files.forEach((file) => payload.append('files', file));
      Array.from(sharedFileIndexes).sort((left, right) => left - right).forEach((index) => {
        payload.append('aiSharedFileIndexes', String(index));
      });
      return postFormData<AiAssistedProductAnalysisResponse>(
        `/products/${product.id}/ai-assisted/analyze`,
        payload,
        { timeoutMs: 360000 }
      );
    },
    onSuccess: (response) => {
      setAnalysis(response);
      setSelection(defaultAiOpportunitySelection(response));
      setAcceptedResult(null);
      openAiView('refresh-review');
    },
  });

  const selectedItemCount = useMemo(
    () =>
      selection.useCaseKeys.length
      + selection.serviceModuleKeys.length
      + selection.scannerFocus.length
      + selection.nextSteps.length,
    [selection]
  );
  const acceptSelection = useMutation({
    mutationFn: async () => {
      if (!analysis) throw new Error('Refresh AI opportunities first.');
      return postJson<ProductAiOpportunityAcceptanceResponse, Record<string, unknown>>(
        `/products/${product.id}/ai-opportunities/accept`,
        buildAiOpportunityAcceptancePayload(analysis, selection)
      );
    },
    onSuccess: async (response) => {
      setAcceptedResult(response);
      setAnalysis(null);
      setSelection(emptyAiOpportunitySelection);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['product-ai-opportunities', product.id] }),
        queryClient.invalidateQueries({ queryKey: ['productization-engine', product.id, 'diagnoses'] }),
        queryClient.invalidateQueries({ queryKey: ['productization-engine', product.id, 'ship-confidence'] }),
        queryClient.invalidateQueries({ queryKey: ['scanner-summary', product.id] }),
        queryClient.invalidateQueries({ queryKey: ['productization-cart'] }),
      ]);
      openAiView('opportunities');
    },
  });

  const setAllFilesShared = (nextFiles: File[]) => {
    setFiles(nextFiles);
    setSharedFileIndexes(new Set(nextFiles.map((_, index) => index)));
  };

  const activeView = view === 'loomai' ? 'details' : view;

  return (
    <Stack spacing={2.5}>
      {aiOpportunityContext.error && (
        <Alert severity="warning">
          Could not load the accepted AI opportunity context. You can still refresh analysis below.
        </Alert>
      )}

      {activeView === 'refresh' || activeView === 'refresh-review' ? (
        <OwnerProductAiOpportunityRefreshView
          acceptedResult={acceptedResult}
          acceptError={acceptSelection.error}
          accepting={acceptSelection.isPending}
          analysis={analysis}
          analyzeError={analyzeProduct.error}
          context={aiOpportunityContext.data}
          files={files}
          isRunning={analyzeProduct.isPending}
          ownerNote={ownerNote}
          product={product}
          selectedItemCount={selectedItemCount}
          selection={selection}
          sharedFileIndexes={sharedFileIndexes}
          mode={activeView === 'refresh-review' ? 'review' : 'setup'}
          onAccept={() => acceptSelection.mutate()}
          onFilesChange={setAllFilesShared}
          onOwnerNoteChange={setOwnerNote}
          onRefreshSetup={() => openAiView('refresh')}
          onReviewResult={() => openAiView('refresh-review')}
          onRun={() => analyzeProduct.mutate()}
          onSelectAll={() => {
            if (analysis) setSelection(defaultAiOpportunitySelection(analysis));
          }}
          onSelectionChange={setSelection}
          onToggleSharedFile={(index, checked) => {
            setSharedFileIndexes((current) => {
              const next = new Set(current);
              if (checked) next.add(index);
              else next.delete(index);
              return next;
            });
          }}
        />
      ) : activeView === 'details' ? (
        <OwnerProductAiOpportunityDetailsView
          context={aiOpportunityContext.data}
          latestAnalysis={analysis}
          product={product}
          onRefresh={() => openAiView('refresh')}
        />
      ) : (
        <OwnerProductAiOpportunityHome
          context={aiOpportunityContext.data}
          latestAnalysis={analysis}
          product={product}
          selectedItemCount={selectedItemCount}
          onRefresh={() => openAiView('refresh')}
          onReviewResult={() => openAiView('refresh-review')}
          onViewDetails={() => openAiView('details')}
        />
      )}
    </Stack>
  );
}
