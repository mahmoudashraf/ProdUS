export interface McpConfig {
  apiBaseUrl: string;
  allowedOrigins: string[];
  allowedHosts?: string[];
  requireAuth: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  host: string;
  port: number;
}

function readBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function readOrigins(value: string | undefined): string[] {
  return (value || 'http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function readOptionalList(value: string | undefined): string[] | undefined {
  const parsed = (value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return parsed.length === 0 ? undefined : parsed;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): McpConfig {
  return {
    apiBaseUrl: (env.PRODUS_API_BASE_URL || 'http://localhost:8080/api').replace(/\/+$/, ''),
    allowedOrigins: readOrigins(env.PRODUS_MCP_ALLOWED_ORIGINS),
    allowedHosts: readOptionalList(env.PRODUS_MCP_ALLOWED_HOSTS),
    requireAuth: readBoolean(env.PRODUS_MCP_REQUIRE_AUTH, true),
    logLevel: (env.PRODUS_MCP_LOG_LEVEL as McpConfig['logLevel']) || 'info',
    host: env.HOST || env.PRODUS_MCP_HOST || '0.0.0.0',
    port: Number.parseInt(env.PORT || env.PRODUS_MCP_PORT || '8081', 10)
  };
}
