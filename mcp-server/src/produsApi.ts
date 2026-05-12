import { randomUUID } from 'node:crypto';
import type { McpConfig } from './config.js';

export interface RequestContext {
  authorization?: string;
  requestId: string;
  origin?: string;
}

export interface ApiResult<T> {
  status: number;
  data: T;
}

export class ProdusApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
    message = typeof body === 'string' ? body : JSON.stringify(body)
  ) {
    super(message);
    this.name = 'ProdusApiError';
  }
}

export class ProdusApi {
  constructor(
    private readonly config: McpConfig,
    private readonly context: RequestContext
  ) {}

  async get<T>(path: string): Promise<ApiResult<T>> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body?: unknown, idempotencyKey?: string): Promise<ApiResult<T>> {
    return this.request<T>('POST', path, body, idempotencyKey);
  }

  async put<T>(path: string, body?: unknown, idempotencyKey?: string): Promise<ApiResult<T>> {
    return this.request<T>('PUT', path, body, idempotencyKey);
  }

  async request<T>(method: string, path: string, body?: unknown, idempotencyKey?: string): Promise<ApiResult<T>> {
    const response = await fetch(`${this.config.apiBaseUrl}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Request-ID': this.context.requestId,
        'X-MCP-Request-ID': this.context.requestId,
        ...(this.context.authorization ? { Authorization: this.context.authorization } : {}),
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {})
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await response.text();
    const parsed = parseBody(text);
    if (!response.ok) {
      throw new ProdusApiError(response.status, parsed);
    }
    return { status: response.status, data: parsed as T };
  }

  async optionalGet<T>(path: string): Promise<T | null> {
    try {
      return (await this.get<T>(path)).data;
    } catch (error) {
      if (error instanceof ProdusApiError && [403, 404].includes(error.status)) {
        return null;
      }
      throw error;
    }
  }

  async audit(payload: {
    toolName: string;
    targetType?: string;
    targetId?: string;
    inputHash?: string;
    status: 'SUCCEEDED' | 'FAILED' | 'FORBIDDEN';
    backendStatus?: number;
    errorSummary?: string;
  }): Promise<void> {
    try {
      await this.post('/mcp/invocations', {
        ...payload,
        requestId: this.context.requestId
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error(`Failed to audit MCP invocation ${payload.toolName}: ${detail}`);
    }
  }
}

function parseBody(text: string): unknown {
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function createRequestContext(headers: { authorization?: string; origin?: string; requestId?: string }): RequestContext {
  return {
    authorization: headers.authorization,
    origin: headers.origin,
    requestId: headers.requestId || randomUUID()
  };
}
