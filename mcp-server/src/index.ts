import type { NextFunction, Request, Response } from 'express';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { loadConfig } from './config.js';
import { createProdusMcpServer } from './mcpServer.js';
import { createRequestContext } from './produsApi.js';

const config = loadConfig();
const app = createMcpExpressApp({
  host: config.host,
  allowedHosts: config.allowedHosts
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'produs-mcp-server',
    apiBaseUrl: config.apiBaseUrl,
    requireAuth: config.requireAuth
  });
});

app.use('/mcp', mcpCors);
app.use('/mcp', requireMcpAuth);

app.post('/mcp', async (req, res) => {
  const context = createRequestContext({
    authorization: headerValue(req.headers.authorization),
    origin: headerValue(req.headers.origin),
    requestId: headerValue(req.headers['x-request-id']) || headerValue(req.headers['x-mcp-request-id'])
  });
  res.setHeader('X-Request-ID', context.requestId);

  const server = createProdusMcpServer(config, context);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    log('error', `MCP request failed: ${error instanceof Error ? error.stack || error.message : String(error)}`);
    if (!res.headersSent) {
      res.status(500).json(jsonRpcError(-32603, 'Internal server error'));
    }
  } finally {
    await safeClose(transport, server);
  }
});

app.get('/mcp', (_req, res) => {
  res.status(405).json(jsonRpcError(-32000, 'Method not allowed.'));
});

app.delete('/mcp', (_req, res) => {
  res.status(405).json(jsonRpcError(-32000, 'Method not allowed.'));
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  log('error', error.stack || error.message);
  if (!res.headersSent) {
    res.status(500).json(jsonRpcError(-32603, 'Internal server error'));
  }
});

const server = app.listen(config.port, config.host, () => {
  log('info', `ProdUS MCP server listening on http://${config.host}:${config.port}/mcp`);
});

server.on('error', (error) => {
  log('error', `Failed to start ProdUS MCP server: ${error.message}`);
  process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    log('info', `Received ${signal}, shutting down`);
    server.close(() => process.exit(0));
  });
}

function mcpCors(req: Request, res: Response, next: NextFunction): void {
  const origin = headerValue(req.headers.origin);
  if (origin && !isOriginAllowed(origin)) {
    res.status(403).json(jsonRpcError(-32000, `Origin not allowed: ${origin}`));
    return;
  }

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, Idempotency-Key, Last-Event-ID, Mcp-Session-Id, X-MCP-Request-ID, X-Request-ID'
  );
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, GET, OPTIONS, POST');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id, X-Request-ID');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
}

function requireMcpAuth(req: Request, res: Response, next: NextFunction): void {
  if (!config.requireAuth) {
    next();
    return;
  }

  const authorization = headerValue(req.headers.authorization);
  if (!authorization || !authorization.match(/^Bearer\s+\S+/i)) {
    res.setHeader('WWW-Authenticate', 'Bearer realm="ProdUS MCP"');
    res.status(401).json(jsonRpcError(-32001, 'Bearer token is required for ProdUS MCP access.'));
    return;
  }
  next();
}

function isOriginAllowed(origin: string): boolean {
  return config.allowedOrigins.includes('*') || config.allowedOrigins.includes(origin);
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function safeClose(
  transport: StreamableHTTPServerTransport,
  serverInstance: { close: () => Promise<void> }
): Promise<void> {
  try {
    await transport.close();
  } catch (error) {
    log('warn', `Failed to close MCP transport: ${error instanceof Error ? error.message : String(error)}`);
  }
  try {
    await serverInstance.close();
  } catch (error) {
    log('warn', `Failed to close MCP server instance: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function jsonRpcError(code: number, message: string): { jsonrpc: '2.0'; error: { code: number; message: string }; id: null } {
  return {
    jsonrpc: '2.0',
    error: { code, message },
    id: null
  };
}

function log(level: typeof config.logLevel, message: string): void {
  const rank = { debug: 10, info: 20, warn: 30, error: 40 };
  if (rank[level] < rank[config.logLevel]) {
    return;
  }
  const writer = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  writer(`[${new Date().toISOString()}] [${level}] ${message}`);
}
