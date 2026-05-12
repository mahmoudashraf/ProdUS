import assert from 'node:assert/strict';
import test from 'node:test';
import type { McpConfig } from './config.js';
import { ProdusApi, ProdusApiError, createRequestContext } from './produsApi.js';

const config: McpConfig = {
  apiBaseUrl: 'https://backend.example.com/api',
  allowedOrigins: ['https://app.example.com'],
  requireAuth: true,
  logLevel: 'error',
  host: '127.0.0.1',
  port: 8081
};

test('ProdusApi forwards auth, request id, and idempotency headers', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(String(input), 'https://backend.example.com/api/products');
      assert.equal(init?.method, 'POST');
      const headers = init?.headers as Record<string, string>;
      assert.equal(headers.Authorization, 'Bearer test-token');
      assert.equal(headers['X-Request-ID'], 'request-1');
      assert.equal(headers['X-MCP-Request-ID'], 'request-1');
      assert.equal(headers['Idempotency-Key'], 'idem-123456');
      assert.equal(init?.body, JSON.stringify({ name: 'Payments Hub' }));
      return new Response(JSON.stringify({ id: 'product-1' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }) as typeof fetch;

    const api = new ProdusApi(config, createRequestContext({
      authorization: 'Bearer test-token',
      requestId: 'request-1'
    }));

    const response = await api.post<{ id: string }>('/products', { name: 'Payments Hub' }, 'idem-123456');
    assert.equal(response.status, 201);
    assert.deepEqual(response.data, { id: 'product-1' });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('ProdusApi raises normalized backend errors', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async () => new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })) as typeof fetch;
    const api = new ProdusApi(config, createRequestContext({ requestId: 'request-2' }));

    await assert.rejects(api.get('/admin/dashboard'), (error) => {
      assert.ok(error instanceof ProdusApiError);
      assert.equal(error.status, 403);
      assert.deepEqual(error.body, { error: 'Forbidden' });
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
