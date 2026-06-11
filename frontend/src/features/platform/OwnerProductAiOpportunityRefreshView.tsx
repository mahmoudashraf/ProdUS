'use client';

import { ArrowBackOutlined, AutoAwesomeOutlined, SaveOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import OwnerProductAiOpportunityControls from './OwnerProductAiOpportunityControls';
import OwnerProductAiOpportunityResult from './OwnerProductAiOpportunityResult';
import { PastelChip, Surface, appleColors } from './PlatformComponents';
import { hasLiveAiOpportunityResult } from './ownerProductAiOpportunityModel';
import type {
  AiAssistedProductAnalysisResponse,
  ProductAiOpportunityAcceptanceResponse,
  ProductAiOpportunityContextResponse,
  ProductProfile,
} from './types';
import type { AiOpportunitySelectionState } from './ownerProductAiOpportunityModel';

interface OwnerProductAiOpportunityRefreshViewProps {
  acceptedResult: ProductAiOpportunityAcceptanceResponse | null;
  acceptError: unknown;
  accepting: boolean;
  analysis: AiAssistedProductAnalysisResponse | null;
  analyzeError: unknown;
  context: ProductAiOpportunityContextResponse | undefined;
  files: File[];
  isRunning: boolean;
  ownerNote: string;
  product: ProductProfile;
  selectedItemCount: number;
  selection: AiOpportunitySelectionState;
  sharedFileIndexes: ReadonlySet<number>;
  onBackHome: () => void;
  onAccept: () => void;
  onFilesChange: (files: File[]) => void;
  onOwnerNoteChange: (value: string) => void;
  onRun: () => void;
  onSelectAll: () => void;
  onSelectionChange: (selection: AiOpportunitySelectionState) => void;
  onToggleSharedFile: (index: number, checked: boolean) => void;
}

export default function OwnerProductAiOpportunityRefreshView({
  acceptedResult,
  acceptError,
  accepting,
  analysis,
  analyzeError,
  context,
  files,
  isRunning,
  ownerNote,
  product,
  selectedItemCount,
  selection,
  sharedFileIndexes,
  onAccept,
  onBackHome,
  onFilesChange,
  onOwnerNoteChange,
  onRun,
  onSelectAll,
  onSelectionChange,
  onToggleSharedFile,
}: OwnerProductAiOpportunityRefreshViewProps) {
  const acceptedUseCases = context?.aiOpportunityReport?.useCases?.length ?? 0;
  const analyzeErrorMessage = analyzeError
    ? analyzeError instanceof Error
      ? analyzeError.message
      : 'AI opportunity refresh failed.'
    : null;
  const acceptErrorMessage = acceptError
    ? acceptError instanceof Error
      ? acceptError.message
      : 'AI opportunity acceptance failed.'
    : null;
  const hasLiveResult = hasLiveAiOpportunityResult(analysis);

  return (
    <Stack spacing={2}>
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f6fbff 100%)' }}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ lg: 'flex-start' }}
        >
          <Stack spacing={1.25} sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <AutoAwesomeOutlined sx={{ color: appleColors.blue }} />
              <Typography variant="h3">Refresh AI opportunities</Typography>
              <PastelChip label={product.name} accent={appleColors.purple} bg="#f1efff" />
            </Stack>
            <Typography color="text.secondary" sx={{ maxWidth: 860, lineHeight: 1.65 }}>
              Add new context, let AI propose updates, then accept only the opportunities, LoomAI
              choices, services, scanner focus, and next steps that should update this product.
            </Typography>
          </Stack>
          <Button
            variant="outlined"
            startIcon={<ArrowBackOutlined />}
            onClick={onBackHome}
            sx={{ minHeight: 44, whiteSpace: 'normal' }}
          >
            Saved opportunities
          </Button>
        </Stack>
      </Surface>

      <Surface>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ md: 'center' }}
        >
          <Box>
            <Typography variant="h4">Current saved AI context</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
              {context?.hasAcceptedContext
                ? `${acceptedUseCases} accepted opportunities are already saved. A refresh will not update them until the owner accepts selected results.`
                : 'Nothing has been accepted yet. The first accepted refresh will create the AI opportunity home.'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <PastelChip
              label={`${acceptedUseCases} saved`}
              accent={acceptedUseCases ? appleColors.green : appleColors.amber}
              bg={acceptedUseCases ? '#e7f8ee' : '#fff4dc'}
            />
            <PastelChip
              label={`${context?.recommendedServiceModules.length ?? 0} services`}
              accent={appleColors.green}
              bg="#e7f8ee"
            />
            <PastelChip
              label={`${context?.scannerFocusAreas.length ?? 0} scanner focus`}
              accent={appleColors.amber}
              bg="#fff4dc"
            />
          </Stack>
        </Stack>
      </Surface>

      <OwnerProductAiOpportunityControls
        files={files}
        isRunning={isRunning}
        ownerNote={ownerNote}
        sharedFileIndexes={sharedFileIndexes}
        onFilesChange={onFilesChange}
        onOwnerNoteChange={onOwnerNoteChange}
        onRun={onRun}
        onToggleSharedFile={onToggleSharedFile}
      />

      {analyzeErrorMessage && <Alert severity="error">{analyzeErrorMessage}</Alert>}

      <OwnerProductAiOpportunityResult
        analysis={analysis}
        focus="refresh"
        selection={selection}
        onSelectAll={onSelectAll}
        onSelectionChange={onSelectionChange}
      />

      {acceptErrorMessage && <Alert severity="error">{acceptErrorMessage}</Alert>}

      {acceptedResult && (
        <Alert severity="success" data-testid="ai-opportunity-accepted">
          Saved {acceptedResult.acceptedUseCases} opportunities,{' '}
          {acceptedResult.acceptedServiceRecommendations} services,{' '}
          {acceptedResult.acceptedScannerFocusAreas} scanner focus areas, and{' '}
          {acceptedResult.acceptedNextSteps} next steps for {acceptedResult.product.name}.
        </Alert>
      )}

      <Surface sx={{ background: '#fff' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ md: 'center' }}
          justifyContent="space-between"
        >
          <Typography color="text.secondary" sx={{ lineHeight: 1.55 }}>
            {analysis && !hasLiveResult
              ? 'This AI refresh failed or returned unusable structured output, so no product updates can be accepted from it.'
              : `${selectedItemCount} selected item${selectedItemCount === 1 ? '' : 's'} will update the product's accepted AI opportunity context.`}
          </Typography>
          <Button
            data-testid="accept-ai-opportunity-selection"
            variant="contained"
            startIcon={<SaveOutlined />}
            onClick={onAccept}
            disabled={!analysis || !hasLiveResult || !selectedItemCount || accepting}
            sx={{ minHeight: 44, whiteSpace: 'normal' }}
          >
            {accepting ? 'Saving...' : 'Accept selected'}
          </Button>
        </Stack>
      </Surface>
    </Stack>
  );
}
