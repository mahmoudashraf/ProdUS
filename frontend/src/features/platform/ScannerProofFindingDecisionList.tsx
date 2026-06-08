'use client';

import { Box, Stack, Typography } from '@mui/material';

import { EmptyState, appleColors } from './PlatformComponents';
import ScannerProofFindingCard from './ScannerProofFindingCard';
import type { NormalizedFinding, ServiceModule } from './types';

type ScannerProofFindingDecisionListProps = {
  findings: NormalizedFinding[];
  selectedFinding: NormalizedFinding | undefined;
  cartServiceIds: Set<string>;
  findingReasonById: Record<string, string>;
  findingReviewDueById: Record<string, string>;
  isUpdatingStatus: boolean;
  isAddingService: boolean;
  onSelectFinding: (findingId: string) => void;
  onFindingReasonChange: (findingId: string, value: string) => void;
  onFindingReviewDueChange: (findingId: string, value: string) => void;
  onAddService: (serviceModule: ServiceModule, source?: string) => void;
  onRecordDecision: (finding: NormalizedFinding, status: NormalizedFinding['status']) => void;
};

export default function ScannerProofFindingDecisionList({
  findings,
  selectedFinding,
  cartServiceIds,
  findingReasonById,
  findingReviewDueById,
  isUpdatingStatus,
  isAddingService,
  onSelectFinding,
  onFindingReasonChange,
  onFindingReviewDueChange,
  onAddService,
  onRecordDecision,
}: ScannerProofFindingDecisionListProps) {
  if (!findings.length) {
    return (
      <EmptyState label="No normalized findings yet. Run a governed scan or upload SARIF, JSON, JUnit, or CI log evidence." />
    );
  }

  const visibleFindings = findings.slice(0, 8);
  const hiddenFindingCount = Math.max(0, findings.length - visibleFindings.length);

  return (
    <Stack spacing={1.25}>
      {visibleFindings.map((finding, index) => {
        const reason = findingReasonById[finding.id] || '';
        const reviewDue = findingReviewDueById[finding.id] || '';
        const expanded = selectedFinding?.id === finding.id || (!selectedFinding && index === 0);

        return (
          <ScannerProofFindingCard
            key={finding.id}
            finding={finding}
            expanded={expanded}
            cartServiceIds={cartServiceIds}
            reason={reason}
            reviewDue={reviewDue}
            isUpdatingStatus={isUpdatingStatus}
            isAddingService={isAddingService}
            onSelectFinding={onSelectFinding}
            onFindingReasonChange={onFindingReasonChange}
            onFindingReviewDueChange={onFindingReviewDueChange}
            onAddService={onAddService}
            onRecordDecision={onRecordDecision}
          />
        );
      })}
      {hiddenFindingCount > 0 && (
        <Box sx={{ p: 1.25, border: '1px dashed', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#f8fafc' }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            {hiddenFindingCount} more normalized findings remain available in stored scanner proof and exports.
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
