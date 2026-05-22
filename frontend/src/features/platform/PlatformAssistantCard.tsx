'use client';

import { useState } from 'react';
import { AutoAwesomeOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Stack, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { postJson } from './api';
import { AssistantContext, AssistantQueryResponse } from './types';
import { PastelChip, appleColors, formatLabel } from './PlatformComponents';

type MarkdownBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'ul' | 'ol'; items: string[] };

interface PlatformAssistantCardProps {
  title: string;
  description: string;
  prompt: string;
  conversationId: string;
  context: AssistantContext;
  disabled?: boolean;
  compact?: boolean;
  cta?: string;
  accent?: string;
  onConfirmAction?: (action: Record<string, unknown>) => Promise<void> | void;
  actionDisabledReason?: (action: Record<string, unknown>) => string;
}

const parseMarkdown = (text: string): MarkdownBlock[] => {
  const blocks: MarkdownBlock[] = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let paragraph: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ').trim() });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (listType && listItems.length) {
      blocks.push({ type: listType, items: listItems });
    }
    listType = null;
    listItems = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      return;
    }
    const heading = /^(#{2,4})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', text: (heading[2] ?? '').trim() });
      return;
    }
    const ordered = /^\d+\.\s+(.+)$/.exec(line);
    if (ordered) {
      flushParagraph();
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push((ordered[1] ?? '').trim());
      return;
    }
    const unordered = /^[-*]\s+(.+)$/.exec(line);
    if (unordered) {
      flushParagraph();
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push((unordered[1] ?? '').trim());
      return;
    }
    flushList();
    paragraph.push(line);
  });

  flushParagraph();
  flushList();
  return blocks;
};

const inline = (text: string) =>
  text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <Box component="strong" key={`${part}-${index}`} sx={{ fontWeight: 900 }}>{part.slice(2, -2)}</Box>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <Box component="code" key={`${part}-${index}`} sx={{ px: 0.45, py: 0.1, borderRadius: 0.6, bgcolor: '#eef4ff', fontSize: '0.88em' }}>
          {part.slice(1, -1)}
        </Box>
      );
    }
    return part;
  });

const MarkdownAnswer = ({ text }: { text: string }) => (
  <Stack spacing={0.9}>
    {parseMarkdown(text).map((block, index) => {
      if (block.type === 'heading') {
        return <Typography key={`${block.type}-${index}`} variant="subtitle2" sx={{ mt: index === 0 ? 0 : 0.75, fontWeight: 950 }}>{inline(block.text)}</Typography>;
      }
      if (block.type === 'paragraph') {
        return <Typography key={`${block.type}-${index}`} variant="body2" sx={{ lineHeight: 1.7 }}>{inline(block.text)}</Typography>;
      }
      return (
        <Box key={`${block.type}-${index}`} component={block.type} sx={{ m: 0, pl: 2.35, display: 'grid', gap: 0.7, '& li::marker': { color: appleColors.purple, fontWeight: 900 } }}>
          {block.items.map((item, itemIndex) => (
            <Box key={`${item}-${itemIndex}`} component="li" sx={{ pl: 0.25 }}>
              <Typography component="span" variant="body2" sx={{ lineHeight: 1.65 }}>{inline(item)}</Typography>
            </Box>
          ))}
        </Box>
      );
    })}
  </Stack>
);

const answerText = (response?: AssistantQueryResponse) =>
  response?.safeSummary || response?.answer || 'No assistant response has been generated yet.';

const recordText = (record: Record<string, unknown>, keys: string[], fallback = '') => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return fallback;
};

const actionLabel = (action: Record<string, unknown>) => recordText(action, ['label', 'title', 'name'], 'Review proposed action');
const sourceLabel = (source: Record<string, unknown>) => recordText(source, ['title', 'name', 'id', 'type'], 'Source');

export default function PlatformAssistantCard({
  title,
  description,
  prompt,
  conversationId,
  context,
  disabled,
  compact,
  cta = 'Ask AI',
  accent = appleColors.purple,
  onConfirmAction,
  actionDisabledReason,
}: PlatformAssistantCardProps) {
  const [pendingAction, setPendingAction] = useState<Record<string, unknown> | null>(null);
  const assistantQuery = useMutation({
    mutationFn: () =>
      postJson<AssistantQueryResponse, {
        conversationId: string;
        query: string;
        mode: string;
        position: string;
        context: AssistantContext;
      }>('/ai/assistant/query-once', {
        conversationId,
        query: prompt,
        mode: 'support_assistant',
        position: 'productization',
        context,
      }),
  });
  const confirmAction = useMutation({
    mutationFn: async (action: Record<string, unknown>) => {
      if (!onConfirmAction) throw new Error('This proposed action needs a confirmed ProdUS execution flow before it can run.');
      await onConfirmAction(action);
    },
    onSuccess: () => setPendingAction(null),
  });

  const result = assistantQuery.data;
  const isLive = result?.mode === 'LIVE';
  const pendingDisabledReason = pendingAction ? actionDisabledReason?.(pendingAction) || (!onConfirmAction ? 'Review only on this surface.' : '') : '';

  return (
    <Box sx={{ p: compact ? 1.25 : 1.5, borderRadius: 1, border: '1px solid', borderColor: assistantQuery.isError ? '#fecdd3' : `${accent}30`, bgcolor: '#fff', boxShadow: compact ? 'none' : '0 12px 32px rgba(15, 23, 42, 0.045)' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} justifyContent="space-between" alignItems={{ sm: 'flex-start' }}>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <Box sx={{ width: compact ? 34 : 40, height: compact ? 34 : 40, borderRadius: 1, bgcolor: `${accent}12`, color: accent, display: 'grid', placeItems: 'center' }}>
            <AutoAwesomeOutlined fontSize="small" />
          </Box>
          <Box>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
              <Typography variant={compact ? 'body2' : 'h4'} sx={{ fontWeight: 900 }}>{title}</Typography>
              {result && <PastelChip label={isLive ? 'LoomAI live' : 'ProdUS fallback'} accent={isLive ? appleColors.purple : appleColors.blue} />}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.55 }}>{description}</Typography>
          </Box>
        </Stack>
        <Button size="small" variant="contained" startIcon={<AutoAwesomeOutlined />} disabled={disabled || assistantQuery.isPending} onClick={() => assistantQuery.mutate()} sx={{ minHeight: 36, minWidth: 118, borderRadius: 1, bgcolor: accent, '&:hover': { bgcolor: accent } }}>
          {assistantQuery.isPending ? 'Thinking...' : cta}
        </Button>
      </Stack>
      {assistantQuery.isPending && <LinearProgress sx={{ borderRadius: 999, mt: 1.25 }} />}
      {assistantQuery.isError && <Alert severity="warning" sx={{ mt: 1.25, borderRadius: 1 }}>The assistant could not answer this request.</Alert>}
      {result && (
        <Box sx={{ mt: 1.25, p: 1.25, borderRadius: 1, bgcolor: '#fbfdff', border: '1px solid', borderColor: appleColors.line }}>
          <MarkdownAnswer text={answerText(result)} />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
            {typeof result.confidence === 'number' && <PastelChip label={`${Math.round(result.confidence * 100)}% confidence`} accent={accent} />}
            {result.providerRequestId && <PastelChip label={`trace ${result.providerRequestId.slice(0, 8)}`} accent={appleColors.cyan} bg="#e4f9fd" />}
            {result.fallbackReason && <PastelChip label={formatLabel(result.fallbackReason)} accent={appleColors.amber} bg="#fff4dc" />}
          </Stack>
          {!!result.sources?.length && (
            <Stack spacing={0.75} sx={{ mt: 1.25 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>Source basis</Typography>
              {result.sources.slice(0, 4).map((source, index) => (
                <Box key={`${sourceLabel(source)}-${index}`} sx={{ p: 1, border: '1px solid', borderColor: '#dbeafe', borderRadius: 1, bgcolor: '#f8fbff' }}>
                  <Typography variant="body2" sx={{ fontWeight: 900 }}>{sourceLabel(source)}</Typography>
                  <Typography variant="caption" color="text.secondary">{recordText(source, ['summary', 'description', 'type'], 'Authorized ProdUS context')}</Typography>
                </Box>
              ))}
            </Stack>
          )}
          {!!result.actions?.length && (
            <Stack spacing={0.75} sx={{ mt: 1.25 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>Proposed actions</Typography>
              {result.actions.slice(0, 3).map((action, index) => {
                const disabledReason = actionDisabledReason?.(action) || (!onConfirmAction ? 'Review only. No confirmed action handler is attached here.' : '');
                return (
                  <Box key={`${actionLabel(action)}-${index}`} sx={{ p: 1, border: '1px solid', borderColor: '#e7ddff', borderRadius: 1, bgcolor: '#f8f7ff' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 900 }}>{actionLabel(action)}</Typography>
                        <Typography variant="caption" color="text.secondary">{recordText(action, ['rationale', 'summary'], 'Requires explicit confirmation before execution.')}</Typography>
                        {disabledReason && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.35 }}>{disabledReason}</Typography>}
                      </Box>
                      <Button size="small" variant="contained" disabled={!!disabledReason} onClick={() => setPendingAction(action)} sx={{ minWidth: 112, minHeight: 34, bgcolor: accent, '&:hover': { bgcolor: accent } }}>
                        Confirm
                      </Button>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      )}
      <Dialog open={!!pendingAction} onClose={() => setPendingAction(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>Confirm AI Proposed Action</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontWeight: 900 }}>{pendingAction ? actionLabel(pendingAction) : ''}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
            {pendingAction ? recordText(pendingAction, ['rationale', 'summary'], 'ProdUS will execute this only after this confirmation.') : ''}
          </Typography>
          {confirmAction.isError && <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 1 }}>{confirmAction.error instanceof Error ? confirmAction.error.message : 'Could not execute this proposed action.'}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPendingAction(null)} disabled={confirmAction.isPending}>Cancel</Button>
          <Button variant="contained" onClick={() => pendingAction && confirmAction.mutate(pendingAction)} disabled={!pendingAction || !!pendingDisabledReason || confirmAction.isPending}>
            {confirmAction.isPending ? 'Confirming...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
