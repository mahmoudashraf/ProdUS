# ProdUS Staging Direct Runtime Request For LoomAI

Date: 2026-05-20

Audience: LoomAI runtime, platform operations, MCP, and ProdUS integration owners.

Purpose: provide LoomAI with the ProdUS staging values we already know, and list the exact confirmations/secrets needed before ProdUS enables direct private runtime calls.

This document must not contain raw secrets. Runtime API keys, HMAC signing secrets, Platform API keys, and MCP API keys must be exchanged through a secure secret channel only.

## 2026-05-20 Status Update

LoomAI reported that direct runtime auth material is now available only in the private handoff:

```text
/Users/mahmoudashraf/Downloads/Projects/TheBaseRepo/Final_Documentation/Development_Guides/LLM-guides/PLATFORM_NEXT_LLM_SESSION_HANDOFF_PRIVATE.md
```

ProdUS code should consume the backend env contract from that private handoff, without copying raw secrets into this repo. The remaining explicit gap is `PRODUS_MCP_API_KEY`: create a ProdUS-owned MCP API key, add it to the ProdUS backend/Coolify env, and mirror the same value into LoomAI Platform secret `MCP_SECRET_PRODUS_STAGING_MCP_API_KEY` before authenticated MCP discovery is considered complete.

Live runtime smoke from ProdUS confirmed:

- `GET /api/chat/me/auth-context` accepts the ProdUS-generated `rpa1` assertion.
- `POST /api/chat/me/query` accepts the canonical query payload and returns a safe summary.
- `POST /api/chat/me/suggestions` currently follows live OpenAPI schema `SuggestionsRequest`, which accepts `content`, optional `attachments`, and `maxSuggestions`. It rejects `conversationId` and `context` as request-body fields. ProdUS therefore keeps suggestions context backend-side and sends only `content` plus `maxSuggestions` to runtime.

## Target Integration Decision

ProdUS prefers direct backend-to-runtime integration.

```text
Integration mode: BACKEND_MEDIATED_PRIVATE_RUNTIME
Auth mode: PRIVATE_RUNTIME_ASSERTION
Bridge usage: operator smoke/fallback comparison only, not the target application path
```

ProdUS browser clients will call only ProdUS backend APIs. ProdUS backend will call LoomAI runtime with private runtime headers.

## Known LoomAI Deployment Values

| Field | Value |
| --- | --- |
| Platform deployment id | `dep-7706fafb` |
| Platform deployment name | `ProdUS AI Enablement Staging` |
| Environment | `staging` |
| Active version | `v2` |
| Runtime template | `dev-openai-qdrant` |
| Template plugin | `mkp-template-support-desk-shell` |
| Installed data plugins | `mkp-data-help-center`, `mkp-data-policy-folder` |
| Stable consumer id / customer id | `produs-staging` |
| Runtime base URL | `http://dep-7706fafb.46.224.145.148.sslip.io` |
| Preferred integration mode | `BACKEND_MEDIATED_PRIVATE_RUNTIME` |
| Auth mode | `PRIVATE_RUNTIME_ASSERTION` |

## ProdUS Values To Register In LoomAI Runtime

```text
issuer: produs-staging-backend
audience: dep-7706fafb
deploymentId: dep-7706fafb
customerId: produs-staging
authMode: PRIVATE_RUNTIME_BACKEND_MEDIATED
callerType: TRUSTED_BACKEND
required scopes:
  - chat:query
  - chat:suggestions
  - chat:conversations
```

Expected runtime accepted issuer/audience additions:

```bash
AI_FABRIC_RUNTIME_AUTH_ACCEPTED_ISSUERS=<existing-issuers>,produs-staging-backend
AI_FABRIC_RUNTIME_AUTH_ACCEPTED_AUDIENCES=<existing-audiences>,dep-7706fafb
```

Please preserve existing accepted issuers/audiences used by Platform operator smoke tests.

## LoomAI Runtime Env Requested

Please set or confirm these on runtime `dep-7706fafb`:

```bash
AI_FABRIC_RUNTIME_AUTH_INGRESS_MODE=VERIFIED_CONTEXT_REQUIRED
AI_FABRIC_RUNTIME_TRUSTED_BACKEND_API_KEY_HEADER=X-AIFABRIC-RUNTIME-API-KEY
AI_FABRIC_RUNTIME_TRUSTED_BACKEND_API_KEY=<deployment-scoped-runtime-api-key>
AI_FABRIC_RUNTIME_PRIVATE_AUTHORIZATION_HEADER=X-AIFABRIC-RUNTIME-AUTHORIZATION
AI_FABRIC_RUNTIME_PRIVATE_TOKEN_SCHEME=Bearer
AI_FABRIC_RUNTIME_PRIVATE_ASSERTION_SIGNING_KEY=<deployment-scoped-hmac-signing-secret>
AI_FABRIC_RUNTIME_AUTH_ACCEPTED_ISSUERS=<existing-issuers>,produs-staging-backend
AI_FABRIC_RUNTIME_AUTH_ACCEPTED_AUDIENCES=<existing-audiences>,dep-7706fafb
```

Required secret decision:

| Secret | Needed By ProdUS? | Needed By LoomAI Runtime? | Request |
| --- | --- | --- | --- |
| Deployment runtime API key | Yes | Yes | LoomAI to provide through secure channel, or confirm ProdUS should generate it. |
| HMAC assertion signing secret | Yes | Yes | Confirm whether LoomAI generates it or ProdUS generates it and shares securely. |
| Platform API key | No for app path | Yes for operator smoke only | Do not provide to browser or ordinary app runtime. |

## ProdUS Backend Env Expected After Runtime Is Ready

ProdUS will configure backend-only env vars after LoomAI confirms the runtime is ready:

```bash
LOOMAI_ENABLED=true
LOOMAI_ENVIRONMENT=staging
LOOMAI_INTEGRATION_MODE=BACKEND_MEDIATED_PRIVATE_RUNTIME
LOOMAI_AUTH_MODE=PRIVATE_RUNTIME_ASSERTION
LOOMAI_BASE_URL=http://dep-7706fafb.46.224.145.148.sslip.io
LOOMAI_RUNTIME_API_KEY=<secure-secret>
LOOMAI_RUNTIME_API_KEY_HEADER_NAME=X-AIFABRIC-RUNTIME-API-KEY
LOOMAI_ASSERTION_AUTHORIZATION_HEADER=X-AIFABRIC-RUNTIME-AUTHORIZATION
LOOMAI_ASSERTION_ISSUER=produs-staging-backend
LOOMAI_ASSERTION_AUDIENCE=dep-7706fafb
LOOMAI_ASSERTION_CUSTOMER_ID=produs-staging
LOOMAI_ASSERTION_SIGNING_ALGORITHM=HS256
LOOMAI_ASSERTION_SIGNING_SECRET=<secure-secret>
LOOMAI_ASSERTION_SCOPES=chat:query,chat:suggestions,chat:conversations
LOOMAI_TIMEOUT_MS=8000
LOOMAI_ASSISTANT_QUERY_PATH=/api/chat/me/query
LOOMAI_ASSISTANT_SUGGESTIONS_PATH=/api/chat/me/suggestions
LOOMAI_AUTH_CONTEXT_PATH=/api/chat/me/auth-context
```

Do not require or rely on `LOOMAI_ASSERTION_PRIVATE_KEY_PATH` for this staging setup unless LoomAI adds asymmetric public-key verification first.

## Private Runtime Assertion Confirmation Needed

ProdUS will implement:

```http
X-AIFABRIC-RUNTIME-API-KEY: <deployment-scoped-runtime-api-key>
X-AIFABRIC-RUNTIME-AUTHORIZATION: Bearer rpa1.<base64url-json-payload>.<base64url-hmac-sha256-signature>
```

Expected payload:

```json
{
  "sub": "produs-user-or-session-id",
  "subjectType": "END_USER",
  "authMode": "PRIVATE_RUNTIME_BACKEND_MEDIATED",
  "callerType": "TRUSTED_BACKEND",
  "sessionId": "produs-assistant-session-id",
  "deploymentId": "dep-7706fafb",
  "customerId": "produs-staging",
  "tenantId": "optional-tenant-or-org-id",
  "iss": "produs-staging-backend",
  "aud": "dep-7706fafb",
  "exp": "2026-05-20T12:00:00Z",
  "scopes": ["chat:query", "chat:suggestions", "chat:conversations"]
}
```

Please confirm:

1. Is the base64url encoding unpadded?
2. Is the HMAC input exactly the base64url payload segment, as currently documented?
3. Is the signature algorithm always HMAC-SHA256 for `HS256`?
4. Should `exp` be ISO-8601 UTC string, numeric epoch seconds, or are both accepted?
5. What clock skew does runtime allow for `exp`?
6. Are all fields above required for both query and suggestions?
7. For anonymous users, confirm `subjectType=ANONYMOUS_SESSION` and `sub == sessionId`.
8. Confirm missing `chat:query` rejects query and missing `chat:suggestions` rejects suggestions.
9. Confirm runtime rejects a normal `Authorization` bearer token in this mode.

## Chat API Contract Confirmation Needed

ProdUS backend to LoomAI runtime:

```http
POST /api/chat/me/query
Content-Type: application/json
X-AIFABRIC-RUNTIME-API-KEY: <runtime-api-key>
X-AIFABRIC-RUNTIME-AUTHORIZATION: Bearer <rpa1-token>
```

Request shape:

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
    "productStage": "PROTOTYPE",
    "packageId": "<uuid>",
    "packageStatus": "DRAFT",
    "workspaceId": "<uuid>",
    "workspaceStatus": "ACTIVE"
  }
}
```

Expected flat response shape:

```json
{
  "success": true,
  "type": "INFORMATION_PROVIDED",
  "answer": "Safe answer",
  "safeSummary": "Safe answer",
  "conversationId": "produs-ui-session-123",
  "providerRequestId": "rag-...",
  "sources": [],
  "actions": [],
  "suggestions": []
}
```

Please confirm:

1. Is `mode=support_assistant` accepted for this deployment?
2. Is `position=productization` accepted and useful for routing?
3. Are `actions[].errorCode` and `actions[].actionResult.errorCode` always preserved for tool/action failures?
4. What are the full possible `type` values?
5. What is the canonical field for trace correlation: `providerRequestId`, response header, or both?
6. Should ProdUS surface `answer` or `safeSummary` first when both exist?

## Suggestions API Contract Confirmation Needed

ProdUS backend to LoomAI runtime:

```http
POST /api/chat/me/suggestions
```

Expected request:

```json
{
  "content": "Current page or current draft answer",
  "maxSuggestions": 4
}
```

Frontend may still send `conversationId` and `context` to ProdUS backend for local routing and fallback. ProdUS backend should not forward those fields to the live runtime suggestions endpoint unless LoomAI updates the runtime OpenAPI contract to accept them.

Expected response:

```json
{
  "success": true,
  "suggestions": [
    "Summarize launch blockers",
    "Show scanner risks",
    "Explain package readiness"
  ]
}
```

## Auth Context Smoke Confirmation Needed

ProdUS will call:

```http
GET /api/chat/me/auth-context
X-AIFABRIC-RUNTIME-API-KEY: <runtime-api-key>
X-AIFABRIC-RUNTIME-AUTHORIZATION: Bearer <rpa1-token>
```

Expected response fields:

```json
{
  "subjectId": "produs-user-or-session-id",
  "subjectType": "END_USER",
  "authMode": "PRIVATE_RUNTIME_BACKEND_MEDIATED",
  "callerType": "TRUSTED_BACKEND",
  "sessionId": "produs-assistant-session-id",
  "deploymentId": "dep-7706fafb",
  "issuer": "produs-staging-backend",
  "grantedScopes": ["chat:query", "chat:suggestions", "chat:conversations"]
}
```

Please confirm this endpoint is live on `dep-7706fafb` and whether it returns `issuer` or `iss`, `subjectId` or `sub`, and `grantedScopes` or `scopes`.

## MCP Discovery And Tool Import Request

ProdUS staging MCP endpoints expected:

```text
GET  https://produs-api-staging.46.224.145.148.sslip.io/health
GET  https://produs-api-staging.46.224.145.148.sslip.io/loomai/tool-allowlist
POST https://produs-api-staging.46.224.145.148.sslip.io/mcp
```

Requested ProdUS MCP profile:

```bash
PRODUS_MCP_TOOL_PROFILE=loomai-productization
PRODUS_MCP_REQUIRE_AUTH=true
PRODUS_MCP_API_KEY=<produs-owned-mcp-api-key>
```

Requested Platform secret reference:

```text
MCP_SECRET_PRODUS_STAGING_MCP_API_KEY
```

Expected discovery auth:

```json
{
  "mode": "API_KEY_HEADER_SECRET",
  "headerName": "X-MCP-API-KEY",
  "secretRef": "MCP_SECRET_PRODUS_STAGING_MCP_API_KEY"
}
```

Please confirm:

1. Should `GET /loomai/tool-allowlist` require `X-MCP-API-KEY`, or only `POST /mcp`?
2. Does the MCP gateway support `STREAMABLE_HTTP` for this endpoint?
3. Should `allowedTools` be empty during discovery, or pre-populated with the ProdUS allowlist?
4. What exact `ready=true` response should ProdUS expect from Platform discovery?
5. Should LoomAI import tools only after ProdUS confirms the allowlist, or is discovery output enough?

ProdUS AI tool scope is intentionally limited to productization value:

- product readiness and diagnosis
- project/workspace status and evidence
- service/package recommendations
- scanner findings and evidence summaries
- milestone readiness and blocker explanations

Excluded from AI tool control:

- invite solo expert to team
- create team
- profile/account settings
- community messages
- payments and commercial actions
- broad admin operations

## Safe Knowledge Ingestion Decision Needed

ProdUS already plans safe knowledge export endpoints:

```text
GET  /api/ai/loomai/knowledge-preview
POST /api/ai/loomai/knowledge-sync
```

Safe records will include approved service catalog, package templates, readiness guidance, scanner taxonomy, and public/productization-safe documentation only.

ProdUS will not index:

- raw repositories
- raw scanner logs
- raw evidence files
- object storage URLs
- access tokens
- Supabase JWTs
- credentials
- customer secrets
- personal messages

Please confirm the ingestion path:

1. Runtime import endpoint path and schema, if supported.
2. Or whether LoomAI wants a ProdUS-specific Marketplace DATA plugin.
3. Required batch size, idempotency key, delete/upsert semantics, and indexing latency expectations.
4. Whether deployment `dep-7706fafb` should use a separate vector namespace for ProdUS safe knowledge.

## Operational Confirmation Needed

Please provide:

1. Runtime rate limits for query, suggestions, and auth-context.
2. Recommended ProdUS backend timeout and retry policy.
3. Request ID/header names that LoomAI preserves in traces.
4. How ProdUS can view runtime trace IDs or provider request IDs during staging debugging.
5. Expected negative auth error response bodies and status codes.
6. Rollback steps if runtime direct auth breaks after enabling `LOOMAI_ENABLED=true`.

## Go/No-Go Criteria

ProdUS will not enable live staging until:

- Runtime accepts `produs-staging-backend` issuer.
- Runtime accepts `dep-7706fafb` audience.
- Runtime and ProdUS share a deployment-scoped runtime API key through secure secret handling.
- Runtime and ProdUS share a deployment-scoped HMAC signing secret through secure secret handling.
- ProdUS-generated `rpa1` assertion passes `/api/chat/me/auth-context`.
- `POST /api/chat/me/query` returns a flat canonical response.
- `POST /api/chat/me/suggestions` returns a flat canonical response.
- Negative auth tests fail closed.
- MCP discovery is authenticated and ready.
- Safe knowledge ingestion path is confirmed or intentionally disabled with a clear skipped state.

## Requested LoomAI Reply Format

Please reply with:

```text
Runtime configured: yes/no
Accepted issuer configured: yes/no
Accepted audience configured: yes/no
Runtime API key handoff method:
HMAC signing secret handoff method:
rpa1 details confirmed or corrections:
Auth-context endpoint status:
Query endpoint status:
Suggestions endpoint expected body:
MCP allowlist auth requirement:
MCP discovery status:
Safe knowledge ingestion path:
Rate limits/timeouts:
Known blockers:
```
