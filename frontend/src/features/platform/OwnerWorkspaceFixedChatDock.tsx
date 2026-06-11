'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AutoAwesomeOutlined,
  ChatBubbleOutlineOutlined,
  CloseFullscreenOutlined,
  OpenInFullOutlined,
  SendOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
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
      sx={{
        position: 'fixed',
        right: { xs: 12, md: 22, xl: 30 },
        bottom: { xs: 12, md: 22 },
        width: expanded
          ? { xs: 'calc(100vw - 24px)', sm: 390, xl: 410 }
          : { xs: 'calc(100vw - 24px)', sm: 280, xl: 300 },
        maxWidth: 'calc(100vw - 24px)',
        zIndex: theme => theme.zIndex.modal + 3,
        pointerEvents: 'auto',
      }}
    >
      <Box
        sx={{
          borderRadius: 1,
          border: '1px solid #dbe4f0',
          bgcolor: '#ffffff',
          boxShadow: '0 22px 60px rgba(15, 23, 42, 0.18)',
          overflow: 'hidden',
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 1.15, py: 1, borderBottom: expanded ? '1px solid #edf2f7' : 'none' }}
        >
          <Stack direction="row" spacing={0.9} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1,
                bgcolor: '#f1efff',
                color: appleColors.purple,
                display: 'grid',
                placeItems: 'center',
                flex: '0 0 auto',
              }}
            >
              <ChatBubbleOutlineOutlined sx={{ fontSize: 19 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 950 }} noWrap>
                ProdUS AI
              </Typography>
              <DotLabel
                label={chatQuery.isPending ? 'Thinking' : liveStatus ? 'Live product chat' : 'AI issue shown'}
                color={chatQuery.isPending ? appleColors.amber : liveStatus ? appleColors.green : appleColors.amber}
              />
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.25} alignItems="center">
            <Tooltip title={fullChatReady ? 'Open full chat' : 'Full chat is loading'}>
              <span>
                <IconButton
                  size="small"
                  onClick={onOpenFullChat}
                  disabled={!fullChatReady}
                  aria-label="Open full ProdUS AI chat"
                >
                  {fullChatReady ? <OpenInFullOutlined sx={{ fontSize: 18 }} /> : <CircularProgress size={16} />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={expanded ? 'Collapse chat' : 'Show chat'}>
              <IconButton size="small" onClick={() => setExpanded(value => !value)} aria-label={expanded ? 'Collapse ProdUS AI chat' : 'Show ProdUS AI chat'}>
                {expanded ? <CloseFullscreenOutlined sx={{ fontSize: 18 }} /> : <AutoAwesomeOutlined sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {expanded && (
          <Stack spacing={1} sx={{ p: 1.15 }}>
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

            <Stack direction="row" spacing={0.65} flexWrap="wrap" useFlexGap>
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

            <Box component="form" onSubmit={submit}>
              <TextField
                fullWidth
                size="small"
                value={input}
                placeholder="Ask about this product..."
                onChange={event => setInput(event.target.value)}
                disabled={chatQuery.isPending}
                inputProps={{ 'aria-label': 'Ask ProdUS AI about this product' }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        type="submit"
                        disabled={!input.trim() || chatQuery.isPending}
                        aria-label="Send ProdUS AI chat message"
                        sx={{ color: appleColors.purple }}
                      >
                        <SendOutlined sx={{ fontSize: 18 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Stack>
        )}

        {!expanded && (
          <Box component="form" onSubmit={submit} sx={{ px: 1.15, pb: 1.15 }}>
            <TextField
              fullWidth
              size="small"
              value={input}
              placeholder="Ask ProdUS AI..."
              onChange={event => setInput(event.target.value)}
              disabled={chatQuery.isPending}
              inputProps={{ 'aria-label': 'Ask ProdUS AI about this product' }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      type="submit"
                      disabled={!input.trim() || chatQuery.isPending}
                      aria-label="Send ProdUS AI chat message"
                      sx={{ color: appleColors.purple }}
                    >
                      <SendOutlined sx={{ fontSize: 18 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
