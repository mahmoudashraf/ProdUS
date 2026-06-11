'use client';

import { useEffect, useMemo, useState } from 'react';
import { appleColors } from './PlatformComponents';
import LoomAIMaxModeAssistantCard from './LoomAIMaxModeAssistantCard';
import {
  type MaxModeRequestContext,
  type WidgetStatus,
  apiBaseUrl,
  assistantHeaders,
  loadWidgetScript,
  primeWidgetConversationState,
  safeParseContext,
  safeStringify,
  widgetScriptUrl,
  withConversationContext,
} from './loomAIMaxModeWidgetRuntime';

interface LoomAIMaxModeAssistantProps {
  disabled: boolean;
  requestContext: MaxModeRequestContext;
  conversationId: string;
  mode: string;
  position: string;
  companionDock?: boolean;
  openButtonLabel?: string;
  onStatusChange?: (status: WidgetStatus) => void;
  renderCard?: boolean;
  showLauncher?: boolean;
  title: string;
  eyebrow: string;
  description: string;
  starterPrompts: string[];
}

export function LoomAIMaxModeAssistant({
  disabled,
  requestContext,
  conversationId,
  mode,
  position,
  companionDock = false,
  openButtonLabel = 'Open analysis chat',
  onStatusChange,
  renderCard = true,
  showLauncher = true,
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
    onStatusChange?.(status);
  }, [onStatusChange, status]);

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

        primeWidgetConversationState(mode, position, conversationId);
        window.MaxMode?.destroy();
        window.MaxMode?.init({
          integrationMode: 'backend-mediated-private-runtime',
          launcher: showLauncher,
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
            quickActions: false,
          },
          theme: {
            primaryColor: appleColors.purple,
            borderRadius: '10px',
            fontFamily:
              'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
          },
          host: {
            experience: 'default',
            assistantLabel: 'ProdUS AI',
            launcherLabel: 'Ask ProdUS AI',
            launcherAriaLabel: 'Ask ProdUS AI about this page',
            launcherVariant: 'pill',
            companionDock,
            showUtilityPanel: false,
            defaultConversationMode: mode,
            effectiveConversationMode: mode,
            allowedConversationModes: [mode],
            pageModeMappings: {
              landing: mode,
              product: mode,
              collection: mode,
              content: mode,
              search: mode,
              catalog: mode,
            },
            welcomeMessage: description,
            requestContext: widgetContext,
            requestContextProvider: () => widgetContext,
            starterPrompts: starterPrompts.map(prompt => ({
              label: prompt,
              query: prompt,
              mode,
              position,
            })),
            starterSuggestions: starterPrompts,
          },
        });
        const sendMessage = window.MaxMode?.sendMessage?.bind(window.MaxMode);
        if (sendMessage && window.MaxMode) {
          window.MaxMode.sendMessage = (message, options) =>
            sendMessage(message, {
              ...options,
              mode: options?.mode ?? mode,
              position: options?.position ?? position,
              requestContext: options?.requestContext ?? widgetContext,
            });
        }
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
  }, [companionDock, description, disabled, mode, position, showLauncher, starterPrompts, widgetContext]);

  const openAssistant = () => {
    if (!canUseAssistant) return;
    primeWidgetConversationState(mode, position, conversationId);
    window.MaxMode?.open();
  };

  const sendPrompt = (prompt: string) => {
    if (!canUseAssistant) return;
    primeWidgetConversationState(mode, position, conversationId);
    window.MaxMode?.sendMessage(prompt, {
      open: true,
      mode,
      position,
      requestContext: widgetContext,
    });
  };

  if (!renderCard) return null;

  return (
    <LoomAIMaxModeAssistantCard
      canUseAssistant={canUseAssistant}
      description={description}
      error={error}
      eyebrow={eyebrow}
      starterPrompts={starterPrompts}
      status={status}
      title={title}
      onOpenAssistant={openAssistant}
      onSendPrompt={sendPrompt}
      openButtonLabel={openButtonLabel}
    />
  );
}
