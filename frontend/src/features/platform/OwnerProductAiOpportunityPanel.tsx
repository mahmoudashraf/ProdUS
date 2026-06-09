'use client';

import { useMemo, useState } from 'react';
import {
  AutoAwesomeOutlined,
  SaveOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Button,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postFormData, postJson } from './api';
import OwnerProductAiOpportunityControls from './OwnerProductAiOpportunityControls';
import OwnerProductAiOpportunityResult from './OwnerProductAiOpportunityResult';
import {
  buildAiOpportunityAcceptancePayload,
  defaultAiOpportunitySelection,
  emptyAiOpportunitySelection,
  type AiOpportunitySelectionState,
} from './ownerProductAiOpportunityModel';
import { PastelChip, Surface, appleColors } from './PlatformComponents';
import type { AiJourneyView } from './ownerWorkspaceJourneyConfig';
import type {
  AiAssistedProductAnalysisResponse,
  ProductAiOpportunityAcceptanceResponse,
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
  const [ownerNote, setOwnerNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [sharedFileIndexes, setSharedFileIndexes] = useState<Set<number>>(new Set());
  const [analysis, setAnalysis] = useState<AiAssistedProductAnalysisResponse | null>(null);
  const [selection, setSelection] = useState<AiOpportunitySelectionState>(emptyAiOpportunitySelection);
  const [acceptedResult, setAcceptedResult] = useState<ProductAiOpportunityAcceptanceResponse | null>(null);

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
      if (!analysis) throw new Error('Run the AI opportunity scan first.');
      return postJson<ProductAiOpportunityAcceptanceResponse, Record<string, unknown>>(
        `/products/${product.id}/ai-opportunities/accept`,
        buildAiOpportunityAcceptancePayload(analysis, selection)
      );
    },
    onSuccess: async (response) => {
      setAcceptedResult(response);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['productization-engine', product.id, 'diagnoses'] }),
        queryClient.invalidateQueries({ queryKey: ['productization-engine', product.id, 'ship-confidence'] }),
        queryClient.invalidateQueries({ queryKey: ['scanner-summary', product.id] }),
        queryClient.invalidateQueries({ queryKey: ['productization-cart'] }),
      ]);
    },
  });

  const setAllFilesShared = (nextFiles: File[]) => {
    setFiles(nextFiles);
    setSharedFileIndexes(new Set(nextFiles.map((_, index) => index)));
  };

  return (
    <Stack spacing={2.5}>
      <Surface sx={{ background: view === 'loomai' ? 'linear-gradient(135deg, #ffffff 0%, #effcff 100%)' : 'linear-gradient(135deg, #ffffff 0%, #fbfaff 100%)' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ md: 'flex-start' }}>
          <Stack spacing={0.75} sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h3">
                {view === 'loomai' ? 'LoomAI for this product' : 'AI opportunities for this product'}
              </Typography>
              <PastelChip label={product.name} accent={appleColors.purple} bg="#f1efff" />
            </Stack>
            <Typography color="text.secondary" sx={{ maxWidth: 780, lineHeight: 1.65 }}>
              {view === 'loomai'
                ? 'Use the latest analysis to decide how LoomAI should fit the product experience and delivery plan.'
                : 'Rerun opportunity analysis when the product, customer insight, repo, or pitch material changes.'}
            </Typography>
          </Stack>
          <Button
            variant="contained"
            startIcon={<AutoAwesomeOutlined />}
            onClick={() => analyzeProduct.mutate()}
            disabled={analyzeProduct.isPending}
            sx={{ minHeight: 42, whiteSpace: 'normal' }}
          >
            {analyzeProduct.isPending ? 'Scanning...' : 'Run fresh scan'}
          </Button>
        </Stack>
      </Surface>

      <OwnerProductAiOpportunityControls
        files={files}
        isRunning={analyzeProduct.isPending}
        ownerNote={ownerNote}
        sharedFileIndexes={sharedFileIndexes}
        onFilesChange={setAllFilesShared}
        onOwnerNoteChange={setOwnerNote}
        onRun={() => analyzeProduct.mutate()}
        onToggleSharedFile={(index, checked) => {
          setSharedFileIndexes((current) => {
            const next = new Set(current);
            if (checked) next.add(index);
            else next.delete(index);
            return next;
          });
        }}
      />

      {analyzeProduct.error && (
        <Alert severity="error">
          {analyzeProduct.error instanceof Error ? analyzeProduct.error.message : 'AI opportunity scan failed.'}
        </Alert>
      )}

      <OwnerProductAiOpportunityResult
        analysis={analysis}
        focus={view}
        selection={selection}
        onSelectAll={() => {
          if (analysis) setSelection(defaultAiOpportunitySelection(analysis));
        }}
        onSelectionChange={setSelection}
      />

      {acceptSelection.error && (
        <Alert severity="error">
          {acceptSelection.error instanceof Error ? acceptSelection.error.message : 'AI opportunity acceptance failed.'}
        </Alert>
      )}

      {acceptedResult && (
        <Alert severity="success" data-testid="ai-opportunity-accepted">
          Saved {acceptedResult.acceptedUseCases} opportunities, {acceptedResult.acceptedServiceRecommendations} services, {acceptedResult.acceptedScannerFocusAreas} scanner focus areas, and {acceptedResult.acceptedNextSteps} next steps for {acceptedResult.product.name}.
        </Alert>
      )}

      <Surface sx={{ background: '#fff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} justifyContent="space-between">
          <Typography color="text.secondary" sx={{ lineHeight: 1.55 }}>
            {selectedItemCount} selected item{selectedItemCount === 1 ? '' : 's'} will update the product's accepted AI opportunity context.
          </Typography>
          <Button
            data-testid="accept-ai-opportunity-selection"
            variant="contained"
            startIcon={<SaveOutlined />}
            onClick={() => acceptSelection.mutate()}
            disabled={!analysis || !selectedItemCount || acceptSelection.isPending}
            sx={{ minHeight: 44, whiteSpace: 'normal' }}
          >
            {acceptSelection.isPending ? 'Saving...' : 'Accept selected'}
          </Button>
        </Stack>
      </Surface>
    </Stack>
  );
}
