'use client';

import { Stack } from '@mui/material';
import { EmptyState } from './PlatformComponents';
import OwnerProductAiOpportunityLoomAiFit from './OwnerProductAiOpportunityLoomAiFit';
import OwnerProductAiOpportunityResultSummary from './OwnerProductAiOpportunityResultSummary';
import OwnerProductAiOpportunitySelectionSections from './OwnerProductAiOpportunitySelectionSections';
import type { AiOpportunitySelectionState } from './ownerProductAiOpportunityModel';
import type { AiAssistedProductAnalysisResponse } from './types';

interface OwnerProductAiOpportunityResultProps {
  analysis: AiAssistedProductAnalysisResponse | null;
  focus: 'opportunities' | 'refresh' | 'loomai';
  selection: AiOpportunitySelectionState;
  onSelectAll: () => void;
  onSelectionChange: (selection: AiOpportunitySelectionState) => void;
}

export default function OwnerProductAiOpportunityResult({
  analysis,
  focus,
  selection,
  onSelectAll,
  onSelectionChange,
}: OwnerProductAiOpportunityResultProps) {
  if (!analysis) {
    return (
      <EmptyState label="Refresh analysis to review product-specific ideas, LoomAI fit, service modules, scanner focus, and next owner steps." />
    );
  }

  return (
    <Stack spacing={2}>
      <OwnerProductAiOpportunityResultSummary
        analysis={analysis}
        focus={focus}
        selection={selection}
        onSelectAll={onSelectAll}
        onSelectionChange={onSelectionChange}
      />
      <OwnerProductAiOpportunityLoomAiFit analysis={analysis} focus={focus} />
      <OwnerProductAiOpportunitySelectionSections
        analysis={analysis}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
    </Stack>
  );
}
