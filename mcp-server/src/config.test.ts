import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig } from './config.js';

test('loadConfig applies secure MCP defaults', () => {
  const config = loadConfig({});

  assert.equal(config.apiBaseUrl, 'http://localhost:8080/api');
  assert.equal(config.requireAuth, true);
  assert.equal(config.host, '0.0.0.0');
  assert.equal(config.port, 8081);
  assert.deepEqual(config.allowedOrigins, [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ]);
});

test('loadConfig normalizes URL and comma-delimited lists', () => {
  const config = loadConfig({
    PRODUS_API_BASE_URL: 'https://api.example.com/api///',
    PRODUS_MCP_ALLOWED_ORIGINS: 'https://app.example.com, https://admin.example.com',
    PRODUS_MCP_ALLOWED_HOSTS: 'mcp.example.com, localhost',
    PRODUS_MCP_REQUIRE_AUTH: 'false',
    PRODUS_MCP_HOST: '127.0.0.1',
    PRODUS_MCP_PORT: '9090'
  });

  assert.equal(config.apiBaseUrl, 'https://api.example.com/api');
  assert.deepEqual(config.allowedOrigins, ['https://app.example.com', 'https://admin.example.com']);
  assert.deepEqual(config.allowedHosts, ['mcp.example.com', 'localhost']);
  assert.equal(config.requireAuth, false);
  assert.equal(config.host, '127.0.0.1');
  assert.equal(config.port, 9090);
});
