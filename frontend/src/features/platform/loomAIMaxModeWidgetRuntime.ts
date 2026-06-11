import { supabase } from '@/lib/supabase';

const WIDGET_SCRIPT_ID = 'loomai-max-mode-widget-script';
const DEFAULT_WIDGET_SRC = '/api/loomai/max-mode-widget';

export type WidgetStatus = 'idle' | 'loading' | 'ready' | 'error';

export type MaxModeRequestContext = Record<string, unknown>;

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

export function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
}

export function widgetScriptUrl() {
  return process.env.NEXT_PUBLIC_LOOMAI_MAX_MODE_WIDGET_URL || DEFAULT_WIDGET_SRC;
}

export function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return '{}';
  }
}

export function safeParseContext(value: string): MaxModeRequestContext {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as MaxModeRequestContext)
      : {};
  } catch {
    return {};
  }
}

export function withConversationContext(
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

export function primeWidgetConversationState(mode: string, position: string, conversationId: string) {
  if (typeof window === 'undefined') return;
  try {
    const existing = JSON.parse(window.sessionStorage.getItem('maxmode_widget_state') || '{}') as Record<string, unknown>;
    window.sessionStorage.setItem(
      'maxmode_widget_state',
      JSON.stringify({
        chatMessages: Array.isArray(existing.chatMessages) ? existing.chatMessages : [],
        attachedItems: Array.isArray(existing.attachedItems) ? existing.attachedItems : [],
        contextDocuments: Array.isArray(existing.contextDocuments) ? existing.contextDocuments : [],
        ...existing,
        currentMode: mode,
        currentPosition: position,
        conversationId,
      })
    );
  } catch {
    window.sessionStorage.setItem(
      'maxmode_widget_state',
      JSON.stringify({
        chatMessages: [],
        attachedItems: [],
        contextDocuments: [],
        currentMode: mode,
        currentPosition: position,
        conversationId,
      })
    );
  }
}

export async function loadWidgetScript(src: string) {
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

export function openWidgetAssistant() {
  if (typeof window === 'undefined' || !window.MaxMode) return false;
  window.MaxMode?.open();
  return true;
}

export async function assistantHeaders() {
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
