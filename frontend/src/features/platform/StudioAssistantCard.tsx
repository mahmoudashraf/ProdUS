'use client';

import { useState } from 'react';
import { AutoAwesomeOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { postJson } from './api';
import AssistantMarkdownRenderer from './AssistantMarkdownRenderer';
import { PastelChip, appleColors, formatLabel } from './PlatformComponents';
import type { AssistantQueryResponse } from './types';

export interface StudioAssistantContext {
  pageType: string;
  productId?: string | undefined;
  packageId?: string | undefined;
  workspaceId?: string | undefined;
  milestoneId?: string | undefined;
  findingId?: string | undefined;
  startReadiness?: {
    status?: string;
    ready?: boolean;
    summary?: string;
    gaps?: {
      type: string;
      severity: string;
      title: string;
      description?: string | undefined;
      serviceModuleId?: string | undefined;
      serviceModuleCode?: string | undefined;
    }[];
  } | undefined;
}

interface StudioAssistantCardProps {
  title: string;
  description: string;
  prompt: string;
  conversationId: string;
  context: StudioAssistantContext;
  disabled?: boolean;
  accent?: string;
  compact?: boolean;
  cta?: string;
  onConfirmAction?: (action: Record<string, unknown>) => Promise<void> | void;
  actionDisabledReason?: (action: Record<string, unknown>) => string;
}

const assistantAnswerText = (response?: AssistantQueryResponse) =>
  response?.safeSummary || response?.answer || 'No assistant response has been generated yet.';

export const assistantRecordText = (record: Record<string, unknown>, keys: string[], fallback = '') => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return fallback;
};

const assistantActionLabel = (action: Record<string, unknown>) =>
  assistantRecordText(action, ['label', 'title', 'name'], 'Review proposed action');

const assistantSourceLabel = (source: Record<string, unknown>) =>
  assistantRecordText(source, ['title', 'name', 'id', 'type'], 'Source');

export default function StudioAssistantCard({
  title,
  description,
  prompt,
  conversationId,
  context,
  disabled,
  accent = appleColors.purple,
  compact = false,
  cta = 'Ask AI',
  onConfirmAction,
  actionDisabledReason,
}: StudioAssistantCardProps) {
  const [pendingAction, setPendingAction] = useState<Record<string, unknown> | null>(null);
  const assistantQuery = useMutation({
    mutationFn: () =>
      postJson<AssistantQueryResponse, {
        conversationId: string;
        query: string;
        mode: string;
        position: string;
        context: StudioAssistantContext;
      }>('/ai/assistant/query-once', {
        conversationId,
        query: prompt,
        mode: 'thinker',
        position: 'productization',
        context,
      }),
  });
  const confirmAssistantAction = useMutation({
    mutationFn: async (action: Record<string, unknown>) => {
      if (onConfirmAction) {
        await onConfirmAction(action);
        return;
      }
      throw new Error('This proposed action needs a product-specific confirmation flow before execution.');
    },
    onSuccess: () => setPendingAction(null),
  });

  const result = assistantQuery.data;
  const isLive = Boolean(result && result.provider === 'LOOMAI' && result.mode !== 'FALLBACK');
  const actionDisabled = pendingAction
    ? actionDisabledReason?.(pendingAction) || (!onConfirmAction ? 'This proposed action is displayed for review only.' : '')
    : '';

  return (
    <Box
      sx={{
        p: compact ? 1.25 : 1.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: assistantQuery.isError ? '#fecdd3' : `${accent}30`,
        bgcolor: assistantQuery.isError ? '#fff7f8' : '#ffffff',
        boxShadow: compact ? 'none' : '0 12px 32px rgba(15, 23, 42, 0.045)',
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} justifyContent="space-between" alignItems={{ sm: 'flex-start' }}>
        <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: compact ? 34 : 40,
              height: compact ? 34 : 40,
              borderRadius: 1,
              bgcolor: `${accent}12`,
              color: accent,
              display: 'grid',
              placeItems: 'center',
              flex: '0 0 auto',
            }}
          >
            <AutoAwesomeOutlined fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
              <Typography variant={compact ? 'body2' : 'h4'} sx={{ fontWeight: 900 }}>
                {title}
              </Typography>
              {result && (
                <PastelChip
                  label={isLive ? 'LoomAI live' : 'ProdUS fallback'}
                  accent={isLive ? appleColors.purple : appleColors.blue}
                  bg={isLive ? '#f1efff' : '#eaf3ff'}
                />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.55 }}>
              {description}
            </Typography>
          </Box>
        </Stack>
        <Button
          size="small"
          variant="contained"
          startIcon={<AutoAwesomeOutlined />}
          disabled={disabled || assistantQuery.isPending}
          onClick={() => assistantQuery.mutate()}
          sx={{
            minHeight: 36,
            minWidth: 118,
            borderRadius: 1,
            bgcolor: accent,
            boxShadow: `0 10px 22px ${accent}2e`,
            '&:hover': { bgcolor: accent, boxShadow: `0 14px 28px ${accent}38` },
          }}
        >
          {assistantQuery.isPending ? 'Thinking...' : cta}
        </Button>
      </Stack>

      {assistantQuery.isPending && <LinearProgress sx={{ borderRadius: 999, mt: 1.25 }} />}

      {assistantQuery.isError && (
        <Alert severity="warning" sx={{ mt: 1.25, borderRadius: 1 }}>
          The assistant could not answer this request. Try again after checking the backend AI status.
        </Alert>
      )}

      {result && (
        <Box sx={{ mt: 1.25, p: 1.25, borderRadius: 1, bgcolor: '#fbfdff', border: '1px solid', borderColor: appleColors.line }}>
          <AssistantMarkdownRenderer text={assistantAnswerText(result)} />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
            {typeof result.confidence === 'number' && (
              <PastelChip label={`${Math.round(result.confidence * 100)}% confidence`} accent={accent} />
            )}
            {result.providerRequestId && (
              <PastelChip label={`trace ${result.providerRequestId.slice(0, 8)}`} accent={appleColors.cyan} bg="#e4f9fd" />
            )}
            {result.sources?.length ? (
              <PastelChip label={`${result.sources.length} sources`} accent={appleColors.green} bg="#e7f8ee" />
            ) : null}
            {result.fallbackReason && (
              <PastelChip label={formatLabel(result.fallbackReason)} accent={appleColors.amber} bg="#fff4dc" />
            )}
          </Stack>
          {!!result.sources?.length && (
            <Box sx={{ mt: 1.25 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.65, fontWeight: 900, textTransform: 'uppercase' }}
              >
                Source basis
              </Typography>
              <Stack spacing={0.75}>
                {result.sources.slice(0, 4).map((source, index) => (
                  <Box
                    key={`${assistantSourceLabel(source)}-${index}`}
                    sx={{ p: 1, border: '1px solid', borderColor: '#dbeafe', borderRadius: 1, bgcolor: '#f8fbff' }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>
                      {assistantSourceLabel(source)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {assistantRecordText(source, ['summary', 'description', 'type'], 'Authorized ProdUS context')}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
          {!!result.actions?.length && (
            <Box sx={{ mt: 1.25 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.65, fontWeight: 900, textTransform: 'uppercase' }}
              >
                Proposed actions
              </Typography>
              <Stack spacing={0.75}>
                {result.actions.slice(0, 3).map((action, index) => {
                  const disabledReason =
                    actionDisabledReason?.(action) || (!onConfirmAction ? 'Review only. No confirmed action handler is attached here.' : '');
                  return (
                    <Box
                      key={`${assistantActionLabel(action)}-${index}`}
                      sx={{ p: 1, border: '1px solid', borderColor: '#e7ddff', borderRadius: 1, bgcolor: '#f8f7ff' }}
                    >
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 900 }}>
                            {assistantActionLabel(action)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {assistantRecordText(action, ['rationale', 'summary'], 'Requires explicit human confirmation before ProdUS executes anything.')}
                          </Typography>
                          {disabledReason && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.35 }}>
                              {disabledReason}
                            </Typography>
                          )}
                        </Box>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={!!disabledReason}
                          onClick={() => setPendingAction(action)}
                          sx={{ minWidth: 112, minHeight: 34, bgcolor: accent, '&:hover': { bgcolor: accent } }}
                        >
                          Confirm
                        </Button>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}
        </Box>
      )}
      <Dialog open={!!pendingAction} onClose={() => setPendingAction(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>Confirm AI Proposed Action</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontWeight: 900 }}>{pendingAction ? assistantActionLabel(pendingAction) : ''}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
            {pendingAction ? assistantRecordText(pendingAction, ['rationale', 'summary'], 'ProdUS will execute this only after this confirmation.') : ''}
          </Typography>
          {pendingAction && assistantRecordText(pendingAction, ['riskLevel']) && (
            <Box sx={{ mt: 1.25 }}>
              <PastelChip label={`Risk ${assistantRecordText(pendingAction, ['riskLevel'])}`} accent={appleColors.amber} bg="#fff4dc" />
            </Box>
          )}
          {confirmAssistantAction.isError && (
            <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 1 }}>
              {confirmAssistantAction.error instanceof Error ? confirmAssistantAction.error.message : 'Could not execute this proposed action.'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPendingAction(null)} disabled={confirmAssistantAction.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => pendingAction && confirmAssistantAction.mutate(pendingAction)}
            disabled={!pendingAction || !!actionDisabled || confirmAssistantAction.isPending}
          >
            {confirmAssistantAction.isPending ? 'Confirming...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
