'use client';

import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { appleColors, formatLabel, PastelChip, SectionTitle } from './PlatformComponents';
import type { NormalizedFinding, ScannerEvidenceItem } from './types';

const wrapFindingText = {
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
} as const;

export function OwnerFindingDecisionPanel({
  decisionReason,
  reviewDueOn,
  canResolve,
  canAcceptRisk,
  isUpdatingStatus,
  onDecisionReasonChange,
  onReviewDueChange,
  onRecordDecision,
}: {
  decisionReason: string;
  reviewDueOn: string;
  canResolve: boolean;
  canAcceptRisk: boolean;
  isUpdatingStatus: boolean;
  onDecisionReasonChange: (value: string) => void;
  onReviewDueChange: (value: string) => void;
  onRecordDecision: (status: NormalizedFinding['status']) => void;
}) {
  return (
    <Box sx={{ p: 1.25, borderRadius: 1, bgcolor: '#fff', border: '1px solid', borderColor: appleColors.line }}>
      <Typography sx={{ fontWeight: 950 }}>
        Owner decision
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) 150px' }, gap: 1, mt: 1 }}>
        <TextField
          size="small"
          label="Decision note"
          value={decisionReason}
          onChange={(event) => onDecisionReasonChange(event.target.value)}
          placeholder="Evidence reviewed, fix merged, compensating control..."
        />
        <TextField
          size="small"
          type="date"
          label="Risk review"
          value={reviewDueOn}
          onChange={(event) => onReviewDueChange(event.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
        <Button size="small" variant="outlined" disabled={!canResolve || isUpdatingStatus} onClick={() => onRecordDecision('RESOLVED')}>
          Mark Resolved
        </Button>
        <Button size="small" variant="outlined" disabled={!canAcceptRisk || isUpdatingStatus} onClick={() => onRecordDecision('ACCEPTED_RISK')}>
          Accept Risk
        </Button>
        <Button size="small" variant="outlined" disabled={!canResolve || isUpdatingStatus} onClick={() => onRecordDecision('FALSE_POSITIVE')}>
          False Positive
        </Button>
      </Stack>
    </Box>
  );
}

export function OwnerFindingLinkedEvidencePanel({
  evidence,
  isOpeningEvidence,
  onOpenEvidence,
}: {
  evidence: ScannerEvidenceItem[];
  isOpeningEvidence: boolean;
  onOpenEvidence: (evidence: ScannerEvidenceItem) => void;
}) {
  return (
    <Box sx={{ p: 1.25, borderRadius: 1, bgcolor: '#fff', border: '1px solid', borderColor: appleColors.line }}>
      <SectionTitle title="Linked Evidence" action={<PastelChip label={`${evidence.length}`} accent={appleColors.cyan} bg="#e4f9fd" />} />
      {evidence.length ? (
        <Stack spacing={0.75}>
          {evidence.slice(0, 4).map((item) => (
            <Stack key={item.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 0.75 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.35, ...wrapFindingText }}>
                  {item.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={wrapFindingText}>
                  {item.source} · {formatLabel(item.confidenceLevel)}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                disabled={(!item.storageKey && !item.artifactRef) || isOpeningEvidence}
                onClick={() => onOpenEvidence(item)}
                sx={{ minHeight: 34, minWidth: 112 }}
              >
                Open Evidence
              </Button>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
          No dedicated evidence item is linked to this finding yet.
        </Typography>
      )}
    </Box>
  );
}
