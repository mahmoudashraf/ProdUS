'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AutoAwesomeOutlined,
  SendOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { postJson } from './api';
import AssistantMarkdownRenderer from './AssistantMarkdownRenderer';
import { DotLabel, PastelChip, appleColors, errorMessageFromUnknown } from './PlatformComponents';
import type { WidgetStatus } from './loomAIMaxModeWidgetRuntime';
import type { AssistantContext, AssistantQueryResponse } from './types';

type FixedChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  response?: AssistantQueryResponse;
  error?: boolean;
};

interface OwnerWorkspaceFixedChatDockProps {
  conversationId: string;
  requestContext: Record<string, unknown>;
  mode: string;
  position: string;
  starterPrompts: string[];
  fullChatStatus: WidgetStatus;
  onOpenFullChat: () => boolean;
}

const answerText = (response?: AssistantQueryResponse) =>
  response?.safeSummary || response?.answer || 'LoomAI returned an empty answer for this request.';

const fixedChatPrompt = (prompt: string) =>
  `
Answer directly inside the ProdUS product workspace.
Use the supplied product, launch, service, scanner, evidence, AI opportunities, and page context as the source of truth.
This fixed chat is read-only. Do not create, update, execute, prepare, or call app actions.
If a fact is missing, state the unknown plainly and continue with the best evidence-backed recommendation.
Keep the answer practical for a startup, MVP, prototype, or product owner.

${prompt}
`.trim();

const stringValue = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);

const toAssistantContext = (requestContext: Record<string, unknown>): AssistantContext => ({
  pageType: stringValue(requestContext.pageType) || 'product-workspace-fixed-chat',
  productId: stringValue(requestContext.productId),
  packageId: stringValue(requestContext.packageId),
  workspaceId: stringValue(requestContext.workspaceId),
  milestoneId: stringValue(requestContext.milestoneId),
  findingId: stringValue(requestContext.findingId),
  vectorSpaces: ['service-module', 'package-template'],
  pageContext: requestContext,
});

export default function OwnerWorkspaceFixedChatDock({
  conversationId,
  requestContext,
  mode,
  position,
  starterPrompts,
  fullChatStatus,
  onOpenFullChat,
}: OwnerWorkspaceFixedChatDockProps) {
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<FixedChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Ask about this product, blockers, services, AI opportunities, or what to do next. I can read this page context but I cannot change records.',
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const assistantContext = useMemo(() => toAssistantContext(requestContext), [requestContext]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length, expanded]);

  const chatQuery = useMutation({
    mutationFn: (query: string) =>
      postJson<AssistantQueryResponse, {
        conversationId: string;
        query: string;
        mode: string;
        position: string;
        context: AssistantContext;
      }>('/ai/assistant/query', {
        conversationId,
        query: fixedChatPrompt(query),
        mode,
        position,
        context: assistantContext,
      }),
    onSuccess: response => {
      setMessages(current => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: answerText(response),
          response,
          error: response.provider !== 'LOOMAI' || response.mode === 'FALLBACK' || response.success === false,
        },
      ]);
    },
    onError: error => {
      setMessages(current => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          text: errorMessageFromUnknown(error, 'The live AI chat request failed.'),
          error: true,
        },
      ]);
    },
  });

  const sendPrompt = (prompt: string) => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || chatQuery.isPending) return;
    setExpanded(true);
    setMessages(current => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        text: cleanPrompt,
      },
    ]);
    setInput('');
    chatQuery.mutate(cleanPrompt);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendPrompt(input);
  };

  const latestResponse = [...messages].reverse().find(message => message.response)?.response;
  const liveStatus = latestResponse
    ? latestResponse.provider === 'LOOMAI' && latestResponse.mode !== 'FALLBACK' && latestResponse.success !== false
    : true;
  const fullChatReady = fullChatStatus === 'ready';

  return (
    <Box
      data-testid="owner-workspace-fixed-chat-window"
      aria-label="ProdUS AI"
      sx={{
        position: 'fixed',
        left: '50%',
        bottom: { xs: 8, sm: 14, md: 16 },
        width: { xs: 'calc(100vw - 16px)', sm: 'min(78rem, calc(100vw - 1rem))' },
        maxWidth: 'calc(100vw - 16px)',
        transform: 'translateX(-50%)',
        zIndex: theme => theme.zIndex.modal + 3,
        pointerEvents: 'auto',
      }}
    >
      <Box
        sx={{
          borderRadius: 3,
          border: '2px solid #2563eb',
          bgcolor: '#ffffff',
          boxShadow: '0 22px 64px rgba(37, 99, 235, 0.22)',
          overflow: 'hidden',
          p: 1,
        }}
      >
        {expanded && (
          <Stack spacing={1.1} sx={{ mb: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75} justifyContent="space-between" alignItems={{ sm: 'center' }}>
              <Stack spacing={0.2}>
                <Typography variant="body2" sx={{ fontWeight: 950 }}>
                  ProdUS AI
                </Typography>
                <DotLabel
                  label={chatQuery.isPending ? 'Thinking' : liveStatus ? 'Live product chat' : 'AI issue shown'}
                  color={chatQuery.isPending ? appleColors.amber : liveStatus ? appleColors.green : appleColors.amber}
                />
              </Stack>
              <Button
                size="small"
                variant="text"
                onClick={() => setExpanded(false)}
                sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, minHeight: 30 }}
              >
                Hide answer
              </Button>
            </Stack>
            <Stack spacing={0.85} sx={{ maxHeight: { xs: 230, sm: 300 }, overflowY: 'auto', pr: 0.25 }}>
              {messages.map(message => (
                <Box
                  key={message.id}
                  sx={{
                    alignSelf: message.role === 'user' ? 'flex-end' : 'stretch',
                    maxWidth: message.role === 'user' ? '84%' : '100%',
                    borderRadius: 1,
                    border: message.role === 'assistant' ? '1px solid #edf2f7' : '1px solid #dbeafe',
                    bgcolor: message.role === 'user' ? '#eef6ff' : message.error ? '#fff7ed' : '#fbfdff',
                    p: 0.95,
                  }}
                >
                  {message.error && message.role === 'assistant' && (
                    <Alert severity="warning" sx={{ mb: 0.85, borderRadius: 1 }}>
                      This is an AI failure state, not a generated recommendation.
                    </Alert>
                  )}
                  <AssistantMarkdownRenderer text={message.text} />
                  {message.response && (
                    <Stack direction="row" spacing={0.65} flexWrap="wrap" useFlexGap sx={{ mt: 0.85 }}>
                      <PastelChip
                        label={message.response.provider === 'LOOMAI' && message.response.mode !== 'FALLBACK' ? 'LoomAI live' : 'AI unavailable'}
                        accent={message.error ? appleColors.amber : appleColors.purple}
                        bg={message.error ? '#fff4dc' : '#f1efff'}
                      />
                      {message.response.sources?.length ? (
                        <PastelChip label={`${message.response.sources.length} sources`} accent={appleColors.green} bg="#e7f8ee" />
                      ) : null}
                      {message.response.providerRequestId && (
                        <PastelChip label={`trace ${message.response.providerRequestId.slice(0, 8)}`} accent={appleColors.cyan} bg="#e4f9fd" />
                      )}
                      {message.response.fallbackReason && (
                        <PastelChip label={message.response.fallbackReason} accent={appleColors.amber} bg="#fff4dc" />
                      )}
                    </Stack>
                  )}
                </Box>
              ))}
              {chatQuery.isPending && (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 0.5, py: 0.25 }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="text.secondary">
                    Asking LoomAI with this product context...
                  </Typography>
                </Stack>
              )}
              <div ref={messagesEndRef} />
            </Stack>

            <Stack direction="row" spacing={0.65} flexWrap="wrap" useFlexGap sx={{ display: { xs: 'none', sm: 'flex' } }}>
              {starterPrompts.slice(0, 3).map(prompt => (
                <Button
                  key={prompt}
                  size="small"
                  variant="outlined"
                  disabled={chatQuery.isPending}
                  onClick={() => sendPrompt(prompt)}
                  sx={{ minHeight: 30, px: 1, fontSize: 12 }}
                >
                  {prompt}
                </Button>
              ))}
            </Stack>
          </Stack>
        )}

        <Box component="form" onSubmit={submit}>
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <TextField
              fullWidth
              multiline
              minRows={1}
              maxRows={4}
              value={input}
              placeholder="Ask me anything..."
              onChange={event => setInput(event.target.value)}
              disabled={chatQuery.isPending}
              inputProps={{ 'aria-label': 'Ask ProdUS AI' }}
              sx={{
                minWidth: 0,
                flex: '1 1 auto',
                '& .MuiOutlinedInput-root': {
                  minHeight: 56,
                  alignItems: 'center',
                  borderRadius: 2.3,
                  bgcolor: '#fff',
                  boxShadow: 'inset 0 1px 8px rgba(15, 23, 42, 0.06)',
                  '& fieldset': { borderColor: '#dbe4f0' },
                },
                '& textarea': {
                  lineHeight: 1.55,
                  fontSize: { xs: 15, sm: 16 },
                },
              }}
            />
            <Button
              variant="outlined"
              startIcon={fullChatReady ? <AutoAwesomeOutlined /> : <CircularProgress size={16} />}
              disabled={!fullChatReady}
              onClick={onOpenFullChat}
              sx={{
                flex: '0 0 auto',
                minHeight: { xs: 48, sm: 52 },
                minWidth: { xs: 96, sm: 104 },
                borderRadius: 2,
                borderColor: '#f0a8ff',
                bgcolor: '#fff7ff',
                color: appleColors.purple,
                fontWeight: 950,
                '&:hover': {
                  borderColor: '#d946ef',
                  bgcolor: '#fdf2ff',
                },
              }}
            >
              MAX
            </Button>
            <IconButton
              type="submit"
              disabled={!input.trim() || chatQuery.isPending}
              aria-label="Send ProdUS AI chat message"
              sx={{
                flex: '0 0 auto',
                width: { xs: 48, sm: 52 },
                height: { xs: 48, sm: 52 },
                borderRadius: 2,
                color: '#fff',
                bgcolor: '#8fb2f4',
                '&:hover': { bgcolor: '#6f97e8' },
                '&.Mui-disabled': {
                  color: '#fff',
                  bgcolor: '#a7bff4',
                  opacity: 0.72,
                },
              }}
            >
              <SendOutlined />
            </IconButton>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
