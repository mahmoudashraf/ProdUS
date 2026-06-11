'use client';

import { AutoAwesomeOutlined, ArrowForwardOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { PastelChip, Surface, appleColors } from './PlatformComponents';
import type { AiAssistedProductAnalysisResponse, ProductProfile } from './types';

interface OwnerProductAiRefreshSetupViewProps {
  analyzeError: unknown;
  analysis: AiAssistedProductAnalysisResponse | null;
  isRunning: boolean;
  ownerNote: string;
  product: ProductProfile;
  selectedFieldCount: number;
  suggestionCount: number;
  onOpenReview: () => void;
  onOwnerNoteChange: (value: string) => void;
  onRun: () => void;
}

export default function OwnerProductAiRefreshSetupView({
  analyzeError,
  analysis,
  isRunning,
  ownerNote,
  product,
  selectedFieldCount,
  suggestionCount,
  onOpenReview,
  onOwnerNoteChange,
  onRun,
}: OwnerProductAiRefreshSetupViewProps) {
  const analyzeErrorMessage = analyzeError
    ? analyzeError instanceof Error
      ? analyzeError.message
      : 'AI refresh failed.'
    : null;
  const aiBadge = analysis?.aiApplied
    ? { label: 'LoomAI analysis', accent: appleColors.green, bg: '#e7f8ee' }
    : analysis
      ? { label: 'AI failed - fallback shown', accent: appleColors.amber, bg: '#fff4dc' }
      : null;

  return (
    <Stack spacing={2}>
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #fbfdff 100%)' }}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ lg: 'flex-start' }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h3">Refresh product brief</Typography>
              {aiBadge && <PastelChip label={aiBadge.label} accent={aiBadge.accent} bg={aiBadge.bg} />}
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 820, lineHeight: 1.65 }}>
              Rerun analysis for {product.name}. ProdUS will propose profile updates, then the
              owner chooses exactly which fields to save on the review page.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AutoAwesomeOutlined />}
            onClick={onRun}
            disabled={isRunning}
            sx={{ minHeight: 44, whiteSpace: 'normal', minWidth: { lg: 190 } }}
          >
            {isRunning ? 'Refreshing...' : 'Refresh brief'}
          </Button>
        </Stack>
      </Surface>

      <Surface>
        <Stack spacing={1.5}>
          <Typography variant="h4">What changed?</Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
            Add a short note when the product direction, repo, launch risk, customer evidence, or
            positioning changed.
          </Typography>
          <TextField
            label="Owner note"
            value={ownerNote}
            onChange={event => onOwnerNoteChange(event.target.value)}
            minRows={3}
            multiline
            placeholder="Example: make the name clearer for a startup founder, include the latest repo status, or focus on launch blockers."
            fullWidth
          />
        </Stack>
      </Surface>

      {analyzeErrorMessage && <Alert severity="error">{analyzeErrorMessage}</Alert>}

      {analysis && (
        <Surface sx={{ background: analysis.aiApplied ? '#fbfffd' : '#fffaf2' }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ md: 'center' }}
          >
            <Box>
              <Typography variant="h4">AI result waiting</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
                {suggestionCount
                  ? `${suggestionCount} suggested field update${suggestionCount === 1 ? '' : 's'} are ready. ${selectedFieldCount} currently selected.`
                  : 'The refresh did not return product profile fields to apply.'}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              endIcon={<ArrowForwardOutlined />}
              onClick={onOpenReview}
              sx={{ minHeight: 42, whiteSpace: 'normal' }}
            >
              Review AI result
            </Button>
          </Stack>
        </Surface>
      )}
    </Stack>
  );
}
