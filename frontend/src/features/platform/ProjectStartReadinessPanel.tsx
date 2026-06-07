'use client';

import NextLink from 'next/link';
import { AddTaskOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import {
  DotLabel,
  StatusChip,
  Surface,
  appleColors,
} from './PlatformComponents';
import type { ProductizationCart, ProductizationStartGap, ProductizationStartReadiness } from './types';

interface ProjectStartReadinessPanelProps {
  startReadiness?: ProductizationStartReadiness | undefined;
  startGaps: ProductizationStartGap[];
  blockingStartGaps: ProductizationStartGap[];
  currentCart?: ProductizationCart | undefined;
  serviceCount: number;
  blockers: number;
  canStartWorkspace: boolean;
  isAddingService: boolean;
  onAddGapService: (gap: ProductizationStartGap) => void;
}

export default function ProjectStartReadinessPanel({
  startReadiness,
  startGaps,
  blockingStartGaps,
  currentCart,
  serviceCount,
  blockers,
  canStartWorkspace,
  isAddingService,
  onAddGapService,
}: ProjectStartReadinessPanelProps) {
  const statusLabel = startReadiness?.status || (blockers ? `${blockers} service gaps` : 'Looks complete');
  const nextBestActions = startReadiness?.nextBestActions || currentCart?.catalogEvaluation?.nextBestActions || [];

  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #fffaf1 100%)' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.25} alignItems={{ sm: 'center' }} sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="h4">Before You Start</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.6 }}>
            Use this as the owner gate: the plan can start only when the product and required services are clear.
          </Typography>
        </Box>
        <StatusChip label={statusLabel} color={canStartWorkspace ? 'success' : blockers ? 'error' : 'warning'} />
      </Stack>

      {startReadiness?.summary && (
        <Typography color="text.secondary" sx={{ lineHeight: 1.65, mb: 1.5 }}>
          {startReadiness.summary}
        </Typography>
      )}

      {blockingStartGaps.length > 0 ? (
        <Alert severity="warning" sx={{ borderRadius: 1, mb: 1.5 }}>
          {blockingStartGaps.length === 1
            ? `${blockingStartGaps[0]?.title} is needed before starting.`
            : `${blockingStartGaps.length} practical gaps need attention before starting.`}
        </Alert>
      ) : (
        <Alert severity={serviceCount ? 'success' : 'info'} sx={{ borderRadius: 1, mb: 1.5 }}>
          {serviceCount
            ? 'The selected services fit together for this start plan. You can start the workspace when the product and service list are ready.'
            : 'Add productization services first. ProdUS will show service gaps here before you start the workspace.'}
        </Alert>
      )}

      {startGaps.length ? (
        <Stack spacing={1.25}>
          {startGaps.slice(0, 6).map((gap) => (
            <Box
              key={`${gap.type}-${gap.serviceModule?.id || gap.title}`}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr auto' },
                gap: 1.5,
                alignItems: 'center',
                p: 1.5,
                border: '1px solid',
                borderColor: gap.severity === 'BLOCKER' ? '#fecdd3' : '#fde68a',
                borderRadius: 1,
                bgcolor: '#fff',
              }}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography sx={{ fontWeight: 900 }}>{gap.title}</Typography>
                  <StatusChip label={gap.severity} color={gap.severity === 'BLOCKER' ? 'error' : 'warning'} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
                  {gap.description || 'Recommended before this workspace starts.'}
                </Typography>
              </Box>
              {gap.serviceModule ? (
                <Button
                  variant="contained"
                  startIcon={<AddTaskOutlined />}
                  disabled={isAddingService}
                  onClick={() => onAddGapService(gap)}
                  sx={{ minHeight: 42, minWidth: 148 }}
                >
                  {gap.actionLabel || 'Choose service'}
                </Button>
              ) : (
                <Button
                  component={NextLink}
                  href={gap.type === 'PRODUCT' ? '/products/new' : '/services'}
                  variant="outlined"
                  sx={{ minHeight: 42, minWidth: 148 }}
                >
                  {gap.actionLabel || 'Open'}
                </Button>
              )}
            </Box>
          ))}
          <Stack spacing={0.75}>
            {nextBestActions.map((action) => (
              <DotLabel key={action} label={action} color={blockers ? appleColors.red : appleColors.amber} />
            ))}
          </Stack>
        </Stack>
      ) : (
        <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
          AI-ready metadata is attached when available, but no AI execution is performed from this panel.
        </Typography>
      )}
    </Surface>
  );
}
