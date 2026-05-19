# LoomAI Staging Deployment Handover For ProdUS

Date: 2026-05-19

Audience: ProdUS backend, frontend, platform operations, MCP, scanner, and LoomAI integration owners.

Status: staging LoomAI deployment is live and verified. ProdUS backend now targets direct private-runtime integration as the preferred path. The Platform consumer bridge remains available for operator smoke tests and fallback validation, but it should not be the primary application path.

## 1. What Exists Now

The current ProdUS staging LoomAI deployment is:

| Field | Value |
| --- | --- |
| Platform deployment id | `dep-7706fafb` |
| Platform deployment name | `ProdUS AI Enablement Staging` |
| Environment | `staging` |
| Active version | `v2` |
| Runtime template | `dev-openai-qdrant` |
| Template plugin | `mkp-template-support-desk-shell` |
| Installed data plugins | `mkp-data-help-center`, `mkp-data-policy-folder` |
| Stable consumer id | `produs-staging` |
| Runtime base URL | `http://dep-7706fafb.46.224.145.148.sslip.io` |
| Integration mode | `BACKEND_MEDIATED_PRIVATE_RUNTIME` |
| Release status | `APPLIED_VERIFIED` |
| Health | `HEALTHY`, `25 passed, 0 failed, 4 skipped` |

The deployment is intentionally generic. It does not contain Shopify-specific plugins, Shopify actions, ProdUS-owned data, raw scanner artifacts, repository content, secrets, or tenant-private workspace data.

## 2. Ownership Boundary

ProdUS remains the product system of record.

ProdUS owns:

- Supabase user sessions and role checks.
- Product, package, workspace, scanner, evidence, milestone, and marketplace data.
- Authorization and tenant isolation.
- All mutations and audit records.
- UI/UX and product workflow decisions.
- Safe knowledge export decisions.

LoomAI owns:

- Runtime chat orchestration.
- Retrieval over approved indexed knowledge.
- Grounded answers and suggestions.
- Governed action preparation once ProdUS MCP is importable.
- Runtime trace and execution evidence.

LoomAI must not connect directly to ProdUS Postgres, MinIO, Supabase, repositories, scanner execution runtime, or user sessions.

## 3. Greenfield Contract Decision

ProdUS and LoomAI should use the platform canonical chat contract from the start. The source-of-truth implementation plan is:

`/Users/mahmoudashraf/Downloads/Projects/TheBaseRepo/doc/Productization/future-work/MarketPlace/Products/Strategy/RoadMaps/Implementation/010_5_LOOMAI_CANONICAL_RUNTIME_BRIDGE_CONTRACT_STANDARDIZATION_PLAN.md`

Do not preserve `message` / `sessionId` as the long-term LoomAI contract and do not make the Platform bridge a payload compatibility layer.

The canonical chat request is:

```json
{
  "query": "What is blocking this product from launch?",
  "conversationId": "produs-session-123",
  "mode": "support_assistant",
  "position": "productization",
  "context": {
    "pageType": "owner-product-workspace",
    "actorRole": "PRODUCT_OWNER",
    "productId": "<uuid>",
    "packageId": "<uuid>",
    "workspaceId": "<uuid>",
    "findingId": "<uuid>"
  }
}
```

The canonical chat response is:

```json
{
  "success": true,
  "type": "INFORMATION_PROVIDED",
  "answer": "Safe user-facing answer",
  "safeSummary": "Safe user-facing answer",
  "conversationId": "produs-session-123",
  "providerRequestId": "rag-...",
  "sources": [],
  "actions": []
}
```

This is the ProdUS-facing response contract. If a current LoomAI endpoint returns a nested runtime envelope such as `result.sanitizedPayload`, that nesting is an adapter input only. ProdUS backend must flatten it before returning data to the browser. Do not expose runtime, bridge, or provider envelopes as the public ProdUS assistant API.

This payload shape should be the same for:

- ProdUS frontend to ProdUS backend.
- ProdUS backend to Platform consumer bridge.
- ProdUS backend to direct LoomAI runtime.

The bridge and direct runtime may differ in URL, deployment lookup, and authentication, but not in the business payload semantics.

| Concern | Canonical decision |
| --- | --- |
| User text | `query` |
| Conversation/thread id | `conversationId` |
| Page/business context | `context` |
| Shopify/storefront-specific context | Not used for ProdUS. Use generic `context`. |
| User-facing answer | `answer` and `safeSummary` |
| Provider trace | `providerRequestId` |
| Fallback | ProdUS backend maps runtime/bridge failure to deterministic fallback |
| Bridge role | Deployment resolution and signed-runtime auth, not DTO translation |

If current ProdUS code still exposes `message` / `sessionId`, update it as part of the integration work. Because this is greenfield, do not add permanent backward-compatible aliases unless a temporary migration window is explicitly documented.

## 4. Current Working Surfaces

### Platform-Managed Runtime

The runtime is reachable and healthy:

```bash
curl -fsS http://dep-7706fafb.46.224.145.148.sslip.io/actuator/health
```

Expected:

```json
{"status":"UP"}
```

### Platform Private Widget Proxy

This is useful for operator smoke tests. It uses the Platform backend to mint the private runtime assertion.

```bash
PLATFORM_BASE_URL="https://loomai-platform-backend.46.224.145.148.sslip.io"
PLATFORM_API_KEY="$(cat /private/tmp/platform_staging_admin_api_key.secret)"

curl -fsS \
  -H "X-PLATFORM-API-KEY: ${PLATFORM_API_KEY}" \
  -H "Content-Type: application/json" \
  -X POST \
  "${PLATFORM_BASE_URL}/api/deployments/dep-7706fafb/poc-widget/chat/me/query?authPath=PLATFORM_PRIVATE" \
  --data '{"query":"What can you help me with?","conversationId":"produs-platform-smoke"}'
```

Current internal answer shape from this smoke-test endpoint:

```json
{
  "success": true,
  "result": {
    "type": "INFORMATION_PROVIDED",
    "success": true,
    "message": "I can assist you with troubleshooting workflows, help-center guidance, and support actions."
  }
}
```

This verifies the runtime is alive. It is not the target ProdUS frontend contract; ProdUS should expose the flat canonical response defined above.

### Stable Consumer Bridge

This is the stable operator bridge while the deployment is managed by Platform. It is useful for smoke tests and fallback comparison, but ProdUS prefers direct private-runtime calls from its backend.

```bash
PLATFORM_BASE_URL="https://loomai-platform-backend.46.224.145.148.sslip.io"
PLATFORM_API_KEY="$(cat /private/tmp/platform_staging_admin_api_key.secret)"

curl -fsS \
  -H "X-PLATFORM-API-KEY: ${PLATFORM_API_KEY}" \
  -H "Content-Type: application/json" \
  -X POST \
  "${PLATFORM_BASE_URL}/api/public/consumers/produs-staging/bridge/chat/query" \
  --data '{"query":"What can you help me with?","conversationId":"produs-consumer-smoke"}'
```

Current internal answer shape is the same as the private widget proxy. ProdUS backend should normalize it to the flat canonical response before returning it to the frontend.

Important: the Platform API key is an operator credential. Do not expose it in the browser. If ProdUS uses this bridge, it must be called only from the ProdUS backend or a trusted server-side adapter.

## 5. Current Blocked Surfaces

### Current ProdUS Backend DTO Is Not The Target Contract

The existing ProdUS backend integration currently sends requests as:

```json
{
  "environment": "staging",
  "sessionId": "...",
  "message": "...",
  "context": {},
  "allowedActions": []
}
```

This is not the target greenfield contract. It must be changed to the canonical LoomAI shape:

```json
{
  "query": "...",
  "conversationId": "...",
  "mode": "optional",
  "position": "optional",
  "context": {}
}
```

The current direct ProdUS-style payload fails with:

```text
query is required
```

The existing ProdUS backend also sends:

```text
Authorization: Bearer <LOOMAI_API_KEY>
```

The current runtime is configured for private-runtime signed assertions:

```text
X-AIFABRIC-RUNTIME-API-KEY
X-AIFABRIC-RUNTIME-AUTHORIZATION: Bearer <signed-private-runtime-assertion>
```

Therefore, do not turn on direct runtime integration by only setting `LOOMAI_BASE_URL` and `LOOMAI_API_KEY`. It will either fail closed or encourage the wrong auth model.

### ProdUS MCP Import Is Not Ready

The deployment did not import ProdUS MCP tools because the current ProdUS MCP endpoints fail during discovery.

Observed:

```text
POST https://produs-api-staging.46.224.145.148.sslip.io/mcp
GET  https://produs-api-staging.46.224.145.148.sslip.io/loomai/tool-allowlist
```

Platform discovery result:

```json
{
  "ready": false,
  "message": "MCP server returned HTTP 500.",
  "errorCode": "MCP_DISCOVERY_FAILED",
  "serverRef": "produs-staging",
  "tools": 0
}
```

ProdUS must fix MCP runtime health and discovery before LoomAI can use ProdUS tools for live reads/actions.

## 6. Recommended Integration Path

Use this order.

### Phase 1: Direct Backend-Mediated Private Runtime

This is the preferred ProdUS application integration path.

ProdUS backend should call the runtime directly:

```text
POST http://dep-7706fafb.46.224.145.148.sslip.io/api/chat/me/query
POST http://dep-7706fafb.46.224.145.148.sslip.io/api/chat/me/suggestions
```

Required headers:

```text
X-AIFABRIC-RUNTIME-API-KEY: <ProdUS backend runtime key>
X-AIFABRIC-RUNTIME-AUTHORIZATION: Bearer <ProdUS signed private-runtime assertion>
```

Backend request contract:

ProdUS backend should send the canonical chat request directly. No permanent `message` to `query` or `sessionId` to `conversationId` translation should survive the greenfield integration.

Required request fields:

| Field | Requirement |
| --- | --- |
| `query` | Required user request text |
| `conversationId` | Required stable ProdUS assistant conversation id |
| `mode` | Optional LoomAI conversation mode, for example `support_assistant` |
| `position` | Optional product UI position, for example `productization` |
| `context` | Safe ProdUS page/user/domain context after backend authorization |

Backend response normalization:

The ProdUS backend adapter must return the flat canonical response. Current LoomAI runtime/bridge responses are expected to be canonical already, so ProdUS should pass through only the approved fields: `success`, `type`, `answer`, `safeSummary`, `conversationId`, `mode`, `position`, `sources`, `actions`, `suggestions`, `fallbackReason`, `providerRequestId`, and safe metadata. Non-2xx provider responses should become deterministic fallback responses. Do not expose runtime/provider envelopes to the browser.

This is not a compatibility promise for old ProdUS request DTOs. The ProdUS public assistant contract remains `query`, `conversationId`, `context`, and the flat canonical response.

ProdUS can keep the same frontend-facing endpoint paths:

```text
POST /api/ai/assistant/query
POST /api/ai/assistant/suggestions
POST /api/ai/assistant/session
```

But the request/response payloads behind those endpoints should use the canonical `query` / `conversationId` / `context` contract.

The browser should never call LoomAI or Platform directly.

The signed assertion must include:

| Claim | Staging value/rule |
| --- | --- |
| issuer | ProdUS-specific issuer configured in deployment security |
| audience | `dep-7706fafb` |
| subject | stable ProdUS user/session subject |
| session id | ProdUS assistant session id |
| scopes | low-privilege chat/read scopes only |
| expiry | short-lived |

Do not put either runtime key or signing material in frontend code.

### Phase 2: Platform Consumer Bridge Fallback

Use the Platform bridge only if direct private runtime integration is temporarily unavailable or for operator smoke tests.

ProdUS backend can call:

```text
POST https://loomai-platform-backend.46.224.145.148.sslip.io/api/public/consumers/produs-staging/bridge/chat/query
POST https://loomai-platform-backend.46.224.145.148.sslip.io/api/public/consumers/produs-staging/bridge/chat/suggestions
```

Important: the Platform API key is an operator credential. Do not expose it in the browser.

### Phase 3: MCP Tool Import

After ProdUS MCP returns healthy `tools/list`, import only:

```text
PRODUS_MCP_TOOL_PROFILE=loomai-productization
```

Do not import the full internal MCP surface.

Initial allowed groups:

- catalog/service search
- product/package inspection
- workspace inspection
- scanner status/findings
- evidence listing
- milestone evidence review
- confirmed requirement/package/workspace actions

Excluded groups:

- team creation
- team invitations
- solo expert join requests
- profile/account settings
- community messages
- payments/commercial actions
- broad admin operations

## 7. ProdUS Environment Configuration

### Current Safe Default

Until the ProdUS issuer, runtime key, and signing material are configured in Coolify and accepted by LoomAI deployment security, keep:

```bash
LOOMAI_ENABLED=false
LOOMAI_ENVIRONMENT=staging
```

This keeps deterministic fallback active.

### Phase 1 Direct Private Runtime Config

Recommended once the ProdUS issuer and signing material are registered with the LoomAI deployment security policy:

```bash
LOOMAI_ENABLED=true
LOOMAI_ENVIRONMENT=staging
LOOMAI_INTEGRATION_MODE=BACKEND_MEDIATED_PRIVATE_RUNTIME
LOOMAI_AUTH_MODE=PRIVATE_RUNTIME_ASSERTION
LOOMAI_BASE_URL=http://dep-7706fafb.46.224.145.148.sslip.io
LOOMAI_RUNTIME_API_KEY=<produs-staging-runtime-api-key>
LOOMAI_ASSERTION_ISSUER=produs-staging-backend
LOOMAI_ASSERTION_AUDIENCE=dep-7706fafb
LOOMAI_ASSERTION_SIGNING_ALGORITHM=HS256
LOOMAI_ASSERTION_SIGNING_SECRET=<produs-owned-staging-signing-secret>
LOOMAI_TIMEOUT_MS=8000
LOOMAI_ASSISTANT_QUERY_PATH=/api/chat/me/query
LOOMAI_ASSISTANT_SUGGESTIONS_PATH=/api/chat/me/suggestions
```

For RSA signing, replace `LOOMAI_ASSERTION_SIGNING_SECRET` with `LOOMAI_ASSERTION_PRIVATE_KEY_PATH` and register the corresponding public key/issuer with LoomAI deployment security.

ProdUS generates local assistant sessions for this path and calls LoomAI only for query/suggestions turns.

### Phase 2 Bridge Fallback Config

Use only for fallback/operator validation:

```bash
LOOMAI_ENABLED=true
LOOMAI_ENVIRONMENT=staging
LOOMAI_INTEGRATION_MODE=PLATFORM_BRIDGE
LOOMAI_AUTH_MODE=PLATFORM_API_KEY
LOOMAI_BASE_URL=https://loomai-platform-backend.46.224.145.148.sslip.io
LOOMAI_API_KEY=<platform-operator-api-key>
LOOMAI_TIMEOUT_MS=8000
LOOMAI_ASSISTANT_QUERY_PATH=/api/public/consumers/produs-staging/bridge/chat/query
LOOMAI_ASSISTANT_SUGGESTIONS_PATH=/api/public/consumers/produs-staging/bridge/chat/suggestions
```

Never store runtime keys, signing material, Platform API keys, or assertions in frontend env vars.

## 8. Indexing And Retrieval

There are three different data classes. Treat them differently.

### A. Deployment-Managed Generic Data

Already live.

Installed data plugins:

- `mkp-data-help-center`
- `mkp-data-policy-folder`

Compiled entity types:

- `faq-article`
- `support-policy`

Compiled knowledge sources:

- `help-center`
- `policy-folder`

These were synced by Platform during release verification. They are generic support/policy sources, not ProdUS product data.

### B. ProdUS Safe Knowledge

ProdUS safe knowledge is generated by:

```text
GET  /api/ai/loomai/knowledge-preview
POST /api/ai/loomai/knowledge-sync
```

Only admins can use these endpoints.

Current safe record shape:

```json
{
  "id": "service-module:example",
  "type": "SERVICE_MODULE",
  "title": "Example Service",
  "body": "Approved productization text",
  "metadata": {
    "slug": "example",
    "releaseStage": "LIVE"
  }
}
```

Current safe record sources:

- service categories
- service modules
- service dependencies
- package templates
- AI capability contracts

Do not index:

- raw repositories
- raw scanner logs
- raw evidence files
- object storage URLs
- access tokens
- Supabase JWTs
- credentials
- customer secrets
- personal messages

Current blocker: the live generic LoomAI runtime does not yet expose a confirmed ProdUS-compatible data-sync contract for these records through the existing ProdUS `Authorization: Bearer` client. Connect this through one of:

- a ProdUS backend adapter that calls the Platform/Runtime indexing surface with the correct private auth, or
- a ProdUS-specific Marketplace DATA plugin once the safe knowledge source is formalized, or
- a governed runtime import endpoint that accepts the safe record schema above.

### C. User-Owned Live Context

Do not bulk-index user-owned workspace/product evidence.

Use live, authorized reads through ProdUS backend/MCP for:

- current product state
- current package state
- workspace status
- scanner findings
- milestone evidence
- private owner/team context

The user must already be authorized in ProdUS. LoomAI should receive only a safe summary or the MCP result, never raw source credentials.

## 9. Chat Contract

### Frontend To ProdUS Backend

Keep the frontend route paths stable:

```text
POST /api/ai/assistant/session
POST /api/ai/assistant/query
POST /api/ai/assistant/suggestions
```

Example query from UI:

```json
{
  "conversationId": "produs-ui-session-123",
  "query": "What is blocking this product from launch?",
  "mode": "support_assistant",
  "position": "productization",
  "context": {
    "pageType": "owner-product-workspace",
    "productId": "<uuid>",
    "packageId": "<uuid>",
    "workspaceId": "<uuid>",
    "findingId": "<uuid>"
  }
}
```

ProdUS backend must validate the current user can read every referenced ID before sending any AI context.

### ProdUS Backend To LoomAI

The same request body should work for both the Platform consumer bridge and direct runtime:

```json
{
  "query": "What is blocking this product from launch?",
  "conversationId": "produs-ui-session-123",
  "mode": "support_assistant",
  "position": "productization",
  "context": {
    "pageType": "owner-product-workspace",
    "actorRole": "PRODUCT_OWNER",
    "productId": "<uuid>",
    "productStage": "MVP",
    "packageId": "<uuid>",
    "packageStatus": "DRAFT",
    "workspaceId": "<uuid>",
    "workspaceStatus": "ACTIVE"
  }
}
```

Unknown fields must remain safe because they can enter prompts or logs.

### ProdUS Backend To Frontend Response

Target response:

```json
{
  "provider": "LOOMAI",
  "mode": "LIVE",
  "success": true,
  "type": "INFORMATION_PROVIDED",
  "answer": "Safe answer",
  "safeSummary": "Safe answer",
  "confidence": 0.0,
  "sources": [],
  "actions": [],
  "fallbackReason": null,
  "providerRequestId": "rag-..."
}
```

The frontend should code against this flat shape only.

### Runtime Adapter Input

Current LoomAI runtime or Platform bridge endpoints may return this internal envelope:

```json
{
  "success": true,
  "result": {
    "type": "INFORMATION_PROVIDED",
    "success": true,
    "message": "Safe answer",
    "sanitizedPayload": {
      "safeSummary": "Safe answer"
    },
    "metadata": {
      "requestId": "rag-..."
    }
  }
}
```

Normalize it to the target response:

```json
{
  "provider": "LOOMAI",
  "mode": "LIVE",
  "success": true,
  "type": "INFORMATION_PROVIDED",
  "answer": "Safe answer",
  "safeSummary": "Safe answer",
  "confidence": 0.0,
  "sources": [],
  "actions": [],
  "fallbackReason": null,
  "providerRequestId": "rag-..."
}
```

On non-2xx, `success=false`, timeout, malformed response, or forbidden action request, return deterministic fallback.

## 10. Widget Install And Frontend Usage

The ProdUS widget should be a productization assistant, not a generic platform chatbot.

Mount points:

- owner product workspace
- package planning views
- workspace/milestone views
- scanner/finding views
- admin AI status/readiness page

Frontend rules:

- The widget calls ProdUS backend only.
- The widget never calls LoomAI runtime, Platform backend, MCP, Coolify, Supabase admin, object storage, or scanner internals directly.
- The widget sends only safe page context IDs and page type.
- The widget displays provider state: `LoomAI live` or `ProdUS fallback`.
- The widget displays fallback reason only in admin/operator contexts, not as noisy end-user copy.
- The widget does not show MCP, runtime, vector, or indexing terminology to owners/teams.

Suggested UI behavior:

- Collapsed assistant pill on supported productization pages.
- Expanded panel with message history, current page context label, and suggestions.
- Suggestions come from `/api/ai/assistant/suggestions` using the canonical `context` payload.
- Chat turns go to `/api/ai/assistant/query` using the canonical `query` / `conversationId` / `context` payload.
- Admin page keeps `knowledge-preview`, `knowledge-sync`, and readiness controls separate from end-user chat.

Current frontend references:

```text
frontend/src/features/platform/OwnerProductizationWorkspace.tsx
frontend/src/features/platform/AdminRecommendationsPage.tsx
frontend/src/features/platform/types.ts
```

Current backend references:

```text
backend/src/main/java/com/produs/ai/LoomAIIntegrationController.java
backend/src/main/java/com/produs/ai/LoomAIIntegrationService.java
backend/src/main/java/com/produs/ai/loom/LoomAIProperties.java
```

## 11. MCP Setup Checklist

ProdUS MCP must be healthy before action/read tools are imported.

Required staging env:

```bash
PRODUS_MCP_TOOL_PROFILE=loomai-productization
PRODUS_MCP_REQUIRE_AUTH=true
```

Required healthy endpoints:

```text
GET  https://produs-api-staging.46.224.145.148.sslip.io/health
GET  https://produs-api-staging.46.224.145.148.sslip.io/loomai/tool-allowlist
POST https://produs-api-staging.46.224.145.148.sslip.io/mcp
```

Discovery command:

```bash
PLATFORM_BASE_URL="https://loomai-platform-backend.46.224.145.148.sslip.io"
PLATFORM_API_KEY="$(cat /private/tmp/platform_staging_admin_api_key.secret)"

curl -fsS \
  -H "X-PLATFORM-API-KEY: ${PLATFORM_API_KEY}" \
  -H "Content-Type: application/json" \
  -X POST \
  "${PLATFORM_BASE_URL}/api/marketplace/mcp/discover" \
  --data '{
    "serverRef": "produs-staging",
    "server": {
      "transport": "STREAMABLE_HTTP",
      "endpointUrl": "https://produs-api-staging.46.224.145.148.sslip.io/mcp",
      "auth": {"mode": "NONE"}
    },
    "trace": {
      "environment": "staging",
      "source": "produs-ai-enablement"
    },
    "allowedTools": [],
    "gatewayServiceRef": "mcp-execution-gateway"
  }'
```

Do not compile MCP action plugins into the deployment until discovery returns `ready: true` and the tools match the `loomai-productization` allowlist.

## 12. Operations Commands

### Deployment Overview

```bash
PLATFORM_BASE_URL="https://loomai-platform-backend.46.224.145.148.sslip.io"
PLATFORM_API_KEY="$(cat /private/tmp/platform_staging_admin_api_key.secret)"

curl -fsS \
  -H "X-PLATFORM-API-KEY: ${PLATFORM_API_KEY}" \
  "${PLATFORM_BASE_URL}/api/deployments/overview?includeArchived=false" \
  | jq '.[] | select(.id=="dep-7706fafb")'
```

### Consumer Credentials

```bash
curl -fsS \
  -H "X-PLATFORM-API-KEY: ${PLATFORM_API_KEY}" \
  "${PLATFORM_BASE_URL}/api/public/consumers/produs-staging/credentials"
```

### Runtime Shell Config

```bash
curl -fsS \
  -H "X-PLATFORM-API-KEY: ${PLATFORM_API_KEY}" \
  "${PLATFORM_BASE_URL}/api/deployments/dep-7706fafb/poc-widget/chat/me/shell-config?authPath=PLATFORM_PRIVATE"
```

### Chat Smoke

```bash
curl -fsS \
  -H "X-PLATFORM-API-KEY: ${PLATFORM_API_KEY}" \
  -H "Content-Type: application/json" \
  -X POST \
  "${PLATFORM_BASE_URL}/api/public/consumers/produs-staging/bridge/chat/query" \
  --data '{"query":"What can you help me with?","conversationId":"produs-smoke"}'
```

### ProdUS Backend Health

```bash
curl -fsS https://produs-api-staging.46.224.145.148.sslip.io/actuator/health
curl -fsS https://produs-api-staging.46.224.145.148.sslip.io/api/health
```

## 13. Release Gates For Calling This Complete

Do not mark ProdUS LoomAI integration complete until these pass:

- ProdUS backend can query LoomAI through the direct private runtime adapter.
- ProdUS frontend and backend use `query`, `conversationId`, and `context` as the canonical assistant payload.
- `POST /api/ai/assistant/query` returns `provider=LOOMAI`, `mode=LIVE` for an authorized owner.
- `POST /api/ai/assistant/suggestions` returns `provider=LOOMAI`, `mode=LIVE`.
- `GET /api/ai/loomai/status` shows enabled/configured for admin.
- `GET /api/ai/loomai/knowledge-preview` returns only safe records.
- `POST /api/ai/loomai/knowledge-sync` indexes safe records or clearly reports a supported skipped/blocked reason.
- MCP discovery for `produs-staging` returns `ready=true`.
- Imported MCP tools match only the `loomai-productization` allowlist.
- Unauthorized users cannot use AI to read another owner's product/package/workspace/finding.
- ProdUS fallback works when LoomAI is disabled or unreachable.
- Browser never receives Platform API keys, runtime trusted backend keys, private assertion signing keys, MCP credentials, Supabase admin credentials, or object storage credentials.

## 14. Known Gaps

Current gaps are expected and should be tracked:

1. ProdUS staging still needs issuer/signing material registered and configured before `LOOMAI_ENABLED=true`.
2. ProdUS backend DTOs have been aligned to the canonical `query` / `conversationId` / `context` payload. Frontend wiring still needs a browser smoke once the UI surface is enabled.
3. ProdUS safe knowledge sync is designed but not connected to a confirmed runtime ingestion endpoint.
4. ProdUS MCP tools are not installed in the LoomAI deployment until discovery is rerun and approved.
5. Current indexed data is generic help/policy marketplace data, not ProdUS productization knowledge.

## 15. Recommended Next Work

1. Register the ProdUS staging issuer and signing material with LoomAI deployment security.
2. Configure Coolify backend env vars for direct private runtime mode.
3. Keep frontend route paths unchanged through `/api/ai/assistant/*`, but use the canonical payload.
4. Keep session creation local in ProdUS until a runtime session endpoint is formalized.
5. Rerun MCP discovery against ProdUS `/mcp` and `/loomai/tool-allowlist`.
6. Decide safe knowledge ingestion path: runtime import endpoint or ProdUS-specific Marketplace DATA plugin.
8. Run end-to-end role tests: admin, owner, team manager, specialist, advisor.
9. Only after staging passes, design production deployment with separate runtime, credentials, vector namespace, rate limits, and rollback plan.
