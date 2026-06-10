'use client';

import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import {
  AutoAwesomeOutlined,
  CheckCircleOutlineOutlined,
  MovingOutlined,
  TroubleshootOutlined,
} from '@mui/icons-material';
import {
  EmptyState,
  MetricTile,
  PastelChip,
  ProgressRing,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { ShipConfidenceHistory } from './types';

const scoreColor = (score?: number) => {
  if (typeof score !== 'number') return appleColors.cyan;
  if (score >= 80) return appleColors.green;
  if (score >= 60) return appleColors.amber;
  return appleColors.red;
};

const trendColor = (direction?: string) => {
  if (direction === 'UP') return appleColors.green;
  if (direction === 'DOWN') return appleColors.red;
  if (direction === 'FLAT') return appleColors.amber;
  return appleColors.purple;
};

export default function ShipConfidencePanel({
  history,
  isLoading = false,
  title = 'Ship Confidence',
  subtitle = 'Each diagnosis creates a checkpoint so owners can see whether the prototype is getting closer to a real launch.',
  showScoreRing = true,
}: {
  history?: ShipConfidenceHistory | undefined;
  isLoading?: boolean | undefined;
  title?: string | undefined;
  subtitle?: string | undefined;
  showScoreRing?: boolean | undefined;
}) {
  const latest = history?.latest;
  const snapshots = history?.snapshots || [];
  const delta = history?.delta;
  const trendLabel = typeof delta === 'number'
    ? `${delta > 0 ? '+' : ''}${delta} pts`
    : latest?.trendDirection === 'NEW'
      ? 'First checkpoint'
      : 'No movement yet';

  return (
    <Box sx={{ border: '1px solid', borderColor: '#dce8f7', borderRadius: 1, bgcolor: '#fff', overflow: 'hidden' }}>
      <Box sx={{ p: 1.5, background: 'linear-gradient(135deg, #ffffff 0%, #f6fbff 55%, #fffaf2 100%)' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 42, height: 42, borderRadius: 1, bgcolor: '#eaf3ff', color: appleColors.blue, display: 'grid', placeItems: 'center' }}>
              <MovingOutlined />
            </Box>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography sx={{ fontWeight: 950 }}>{title}</Typography>
                {latest && <PastelChip label={latest.statusLabel} accent={scoreColor(latest.shipConfidenceScore)} bg={`${scoreColor(latest.shipConfidenceScore)}12`} />}
                {latest && <PastelChip label={trendLabel} accent={trendColor(latest.trendDirection)} bg={`${trendColor(latest.trendDirection)}12`} />}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6, maxWidth: 780 }}>
                {history?.trendSummary || subtitle}
              </Typography>
            </Box>
          </Stack>
          {showScoreRing && <ProgressRing value={latest?.shipConfidenceScore || 0} size={86} color={scoreColor(latest?.shipConfidenceScore)} label="ship" />}
        </Stack>
        {isLoading && <LinearProgress sx={{ mt: 1.5, borderRadius: 999 }} />}
      </Box>

      {latest ? (
        <Box sx={{ p: 1.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, minmax(0, 1fr))' }, gap: 1 }}>
            <MetricTile label="Priority fixes" value={latest.priorityFixCount} detail="Critical/high rough edges" accent={latest.priorityFixCount ? appleColors.red : appleColors.green} icon={<TroubleshootOutlined />} />
            <MetricTile label="Mapped fixes" value={latest.mappedFindingCount} detail="Signals with a service path" accent={appleColors.green} icon={<CheckCircleOutlineOutlined />} />
            <MetricTile label="Proof gaps" value={latest.proofGapCount} detail="Needs a scan, note, or link" accent={latest.proofGapCount ? appleColors.amber : appleColors.green} icon={<AutoAwesomeOutlined />} />
            <MetricTile label="Services" value={latest.recommendedServiceCount} detail="Recommended service work" accent={appleColors.purple} icon={<MovingOutlined />} />
          </Box>

          <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 1, border: '1px solid', borderColor: '#e5edf7', bgcolor: '#fbfdff' }}>
            <Typography variant="caption" color="text.secondary">Next practical move</Typography>
            <Typography variant="body2" sx={{ mt: 0.35, fontWeight: 850, lineHeight: 1.55 }}>
              {latest.suggestedNextStep}
            </Typography>
            {latest.recommendedServices.length > 0 && (
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                {latest.recommendedServices.slice(0, 6).map((service) => (
                  <PastelChip key={service} label={service} accent={appleColors.cyan} bg="#e4f9fd" />
                ))}
              </Stack>
            )}
          </Box>

          {snapshots.length > 1 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1, mt: 1.5 }}>
              {snapshots.slice(0, 3).map((snapshot) => (
                <Box key={snapshot.id} sx={{ border: '1px solid', borderColor: '#e5edf7', borderRadius: 1, p: 1.1, bgcolor: '#fff' }}>
                  <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontWeight: 900 }}>{snapshot.shipConfidenceScore}/100</Typography>
                    <PastelChip label={formatLabel(snapshot.source || 'MANUAL_DETERMINISTIC')} accent={snapshot.source === 'SCANNER_READINESS' ? appleColors.green : appleColors.blue} bg={snapshot.source === 'SCANNER_READINESS' ? '#e7f8ee' : '#eaf3ff'} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {snapshot.createdAt ? new Date(snapshot.createdAt).toLocaleString() : 'Checkpoint'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6, lineHeight: 1.5 }}>
                    {snapshot.priorityFixCount} priority fixes · {snapshot.proofGapCount} proof gaps
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ p: 1.5 }}>
          <EmptyState label="No ship-confidence checkpoint yet. Run a diagnosis or scanner to create one." />
        </Box>
      )}
    </Box>
  );
}
