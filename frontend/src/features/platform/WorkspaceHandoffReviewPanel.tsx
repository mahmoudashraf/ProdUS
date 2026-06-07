'use client';

import { Box, Button, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  ProgressRing,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { HandoffDocument, ProductHealthReview } from './types';

interface WorkspaceHandoffReviewPanelProps {
  latestHandoff: HandoffDocument | undefined;
  latestHealthReview: ProductHealthReview | undefined;
  missingEvidenceCount: number;
  workspaceProgress: number;
  canCoordinate: boolean;
  isPreparingHandoff: boolean;
  isPublishingHealthReview: boolean;
  onPrepareHandoff: () => void;
  onPublishHealthReview: () => void;
}

export default function WorkspaceHandoffReviewPanel({
  latestHandoff,
  latestHealthReview,
  missingEvidenceCount,
  workspaceProgress,
  canCoordinate,
  isPreparingHandoff,
  isPublishingHealthReview,
  onPrepareHandoff,
  onPublishHealthReview,
}: WorkspaceHandoffReviewPanelProps) {
  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f6fffb)' }}>
      <SectionTitle title="Handoff And Health" action={<PastelChip label={latestHealthReview ? `${latestHealthReview.healthScore}/100` : 'No review'} accent={latestHealthReview ? appleColors.green : appleColors.purple} bg={latestHealthReview ? '#e7f8ee' : '#f1efff'} />} />
      <Stack spacing={1.25}>
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25, bgcolor: '#fff' }}>
          <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 900 }}>{latestHandoff?.title || 'Owner handoff'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {latestHandoff ? formatLabel(latestHandoff.status) : 'Prepare runbook, access, known issues, and support scope.'}
              </Typography>
            </Box>
            {latestHandoff && <StatusChip label={latestHandoff.status} color={latestHandoff.status === 'ACCEPTED' ? 'success' : 'default'} />}
          </Stack>
          {latestHandoff?.runbook && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.5 }}>
              {latestHandoff.runbook}
            </Typography>
          )}
        </Box>
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25, bgcolor: '#fff' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ProgressRing value={latestHealthReview?.healthScore || Math.max(55, workspaceProgress || 70)} size={64} color={latestHealthReview ? appleColors.green : appleColors.amber} label="health" />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 900 }}>{latestHealthReview?.summary || 'No health review published yet.'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {missingEvidenceCount ? `${missingEvidenceCount} required evidence items missing` : 'Evidence requirements are current'}
              </Typography>
            </Box>
          </Stack>
        </Box>
        {canCoordinate && (
          <Stack direction={{ xs: 'column', sm: 'row', lg: 'column' }} spacing={1}>
            <Button variant="outlined" onClick={onPrepareHandoff} disabled={isPreparingHandoff} sx={{ minHeight: 40 }}>
              Prepare handoff
            </Button>
            <Button variant="outlined" onClick={onPublishHealthReview} disabled={isPublishingHealthReview} sx={{ minHeight: 40 }}>
              Publish health review
            </Button>
          </Stack>
        )}
      </Stack>
    </Surface>
  );
}
