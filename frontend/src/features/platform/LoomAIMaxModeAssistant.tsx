'use client';

import { useEffect, useMemo, useState } from 'react';
import { AutoAwesomeOutlined, ChatBubbleOutlineOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { supabase } from '@/lib/supabase';
import { DotLabel, appleColors } from './PlatformComponents';

const WIDGET_SCRIPT_ID = 'loomai-max-mode-widget-script';
const DEFAULT_WIDGET_SRC = '/api/loomai/max-mode-widget';

type WidgetStatus = 'idle' | 'loading' | 'ready' | 'error';

type MaxModeRequestContext = Record<string, unknown>;

type MaxModeApi = {
  init: (config: Record<string, unknown>) => void;
  open: () => void;
  destroy: () => void;
  sendMessage: (
    message: string,
    options?: {
      open?: boolean;
      position?: string;
      mode?: string;
      requestContext?: MaxModeRequestContext;
    }
  ) => void;
};

declare global {
  interface Window {
    MaxMode?: MaxModeApi;
  }
}

interface LoomAIMaxModeAssistantProps {
  disabled: boolean;
  requestContext: MaxModeRequestContext;
  conversationId: string;
  mode: string;
  position: string;
  title: string;
  eyebrow: string;
  description: string;
  starterPrompts: string[];
}

function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
}

function widgetScriptUrl() {
  return process.env.NEXT_PUBLIC_LOOMAI_MAX_MODE_WIDGET_URL || DEFAULT_WIDGET_SRC;
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return '{}';
  }
}

function safeParseContext(value: string): MaxModeRequestContext {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as MaxModeRequestContext)
      : {};
  } catch {
    return {};
  }
}

function withConversationContext(
  context: MaxModeRequestContext,
  conversationId: string
): MaxModeRequestContext {
  const pageContext =
    context.pageContext && typeof context.pageContext === 'object' && !Array.isArray(context.pageContext)
      ? (context.pageContext as MaxModeRequestContext)
      : {};
  return {
    ...context,
    conversationId,
    pageContext: {
      ...pageContext,
      conversationId,
    },
  };
}

async function loadWidgetScript(src: string) {
  if (typeof window === 'undefined') return;
  if (window.MaxMode) return;

  const existing = document.getElementById(WIDGET_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    await new Promise<void>((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load ProdUS AI chat.')), {
        once: true,
      });
    });
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = WIDGET_SCRIPT_ID;
    script.src = src;
    script.async = true;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('Failed to load ProdUS AI chat.')), {
      once: true,
    });
    document.head.appendChild(script);
  });
}

async function assistantHeaders() {
  const headers: Record<string, string> = {};
  if (typeof window === 'undefined') return headers;

  const mockToken = window.localStorage.getItem('mock_token');
  if (mockToken) {
    headers.Authorization = `Bearer ${mockToken}`;
    return headers;
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {
    return headers;
  }

  return headers;
}

export function LoomAIMaxModeAssistant({
  disabled,
  requestContext,
  conversationId,
  mode,
  position,
  title,
  eyebrow,
  description,
  starterPrompts,
}: LoomAIMaxModeAssistantProps) {
  const [status, setStatus] = useState<WidgetStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const contextKey = safeStringify(requestContext);
  const parsedContext = useMemo(() => safeParseContext(contextKey), [contextKey]);
  const widgetContext = useMemo(
    () => withConversationContext(parsedContext, conversationId),
    [conversationId, parsedContext]
  );
  const canUseAssistant = !disabled && status === 'ready';

  useEffect(() => {
    if (disabled) {
      setStatus('idle');
      return undefined;
    }

    let cancelled = false;
    setStatus('loading');
    setError(null);

    async function initialize() {
      try {
        await loadWidgetScript(widgetScriptUrl());
        const headers = await assistantHeaders();
        if (cancelled) return;

        window.MaxMode?.destroy();
        window.MaxMode?.init({
          integrationMode: 'backend-mediated-private-runtime',
          launcher: true,
          position: 'bottom-right',
          apiConfig: {
            chatBaseUrl: apiBaseUrl(),
            fetchCredentials: 'include',
            defaultHeaders: headers,
            probeShellConfigOnOpen: false,
            runtimeRoutes: {
              chatQueryUrl: '/ai/assistant/query',
              suggestionsUrl: '/ai/assistant/suggestions',
              authContextUrl: '/ai/assistant/auth-context',
            },
            runtimeAuth: {
              probeAuthContextOnOpen: false,
            },
          },
          features: {
            cart: false,
            debug: false,
            conversations: false,
            quickActions: true,
          },
          theme: {
            primaryColor: appleColors.purple,
            borderRadius: '10px',
            fontFamily:
              'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
          },
          host: {
            experience: 'produs-productization-workspace',
            assistantLabel: 'ProdUS AI',
            launcherLabel: 'Ask ProdUS AI',
            launcherAriaLabel: 'Ask ProdUS AI about this page',
            launcherVariant: 'pill',
            companionDock: true,
            showUtilityPanel: true,
            welcomeMessage: description,
            requestContext: widgetContext,
            requestContextProvider: () => widgetContext,
            starterPrompts: starterPrompts.map(prompt => ({
              label: prompt,
              message: prompt,
              mode,
              position,
            })),
          },
        });
        setStatus('ready');
      } catch (unknownError) {
        if (cancelled) return;
        setStatus('error');
        setError(unknownError instanceof Error ? unknownError.message : 'ProdUS AI chat could not load.');
      }
    }

    initialize();

    return () => {
      cancelled = true;
      window.MaxMode?.destroy();
    };
  }, [description, disabled, mode, position, starterPrompts, widgetContext]);

  const openAssistant = () => {
    if (!canUseAssistant) return;
    window.MaxMode?.open();
  };

  const sendPrompt = (prompt: string) => {
    if (!canUseAssistant) return;
    window.MaxMode?.sendMessage(prompt, {
      open: true,
      mode,
      position,
      requestContext: widgetContext,
    });
  };

  return (
    <Box
      sx={{
        borderRadius: 1,
        border: '1px solid #dfe7f5',
        background: 'linear-gradient(145deg, #ffffff, #f8fbff)',
        p: 1.25,
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.045)',
      }}
    >
      <Stack spacing={1.15}>
        <Stack direction="row" spacing={0.85} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={0.85} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                display: 'grid',
                placeItems: 'center',
                bgcolor: '#f0efff',
                color: appleColors.purple,
                flex: '0 0 auto',
              }}
            >
              <ChatBubbleOutlineOutlined sx={{ fontSize: 18 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 950 }} noWrap>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {eyebrow}
              </Typography>
            </Box>
          </Stack>
          <DotLabel
            label={status === 'ready' ? 'Fixed dock ready' : status === 'loading' ? 'Loading' : 'Page AI'}
            color={status === 'error' ? appleColors.amber : appleColors.purple}
          />
        </Stack>

        <Box
          sx={{
            borderRadius: 1,
            border: '1px solid #eef2ff',
            bgcolor: '#fbfbff',
            p: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.55 }}>
            {description}
          </Typography>
        </Box>

        {error && (
          <Alert severity="warning" sx={{ borderRadius: 1 }}>
            {error}
          </Alert>
        )}

        <Stack direction="row" spacing={0.65} flexWrap="wrap" useFlexGap>
          {starterPrompts.map(prompt => (
            <Button
              key={prompt}
              size="small"
              variant="outlined"
              disabled={!canUseAssistant}
              onClick={() => sendPrompt(prompt)}
              sx={{ minHeight: 30, px: 1, fontSize: 12 }}
            >
              {prompt}
            </Button>
          ))}
        </Stack>

        <Button
          variant="contained"
          startIcon={<AutoAwesomeOutlined />}
          disabled={!canUseAssistant}
          onClick={openAssistant}
          sx={{ minHeight: 40 }}
        >
          {status === 'loading' ? 'Preparing ProdUS AI...' : 'Open analysis chat'}
        </Button>
      </Stack>
    </Box>
  );
}
