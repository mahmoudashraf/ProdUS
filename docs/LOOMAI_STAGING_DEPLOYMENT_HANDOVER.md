# LoomAI Staging Deployment Handover For ProdUS

Date: 2026-05-19

Audience: ProdUS backend, frontend, platform operations, MCP, scanner, and LoomAI integration owners.

Status: staging LoomAI deployment is live and verified. ProdUS should integrate through the standardized backend-mediated private runtime contract. The Platform consumer bridge remains useful for operator smoke tests and fallback comparison, but it is not the target application path.

Latest LoomAI-side status, verified 2026-05-25:

- Runtime `dep-7706fafb` accepts issuer `produs-staging-backend`.
- Runtime `dep-7706fafb` accepts audience `dep-7706fafb`.
- Runtime trusted backend key and HMAC private assertion signing key are configured in Coolify. Values are not stored in this document.
- Raw runtime and MCP secret material is captured in the LoomAI private handoff under `2026-05-20 ProdUS Direct Runtime Auth Material (Private)`. Transfer those values only through the agreed secure operations channel.
- Direct private runtime `GET /api/chat/me/auth-context` passed with a ProdUS-shaped `rpa1` assertion.
- Direct private runtime `POST /api/chat/me/query` passed with `mode=support_assistant`, `position=productization`, and canonical `context`.
- Direct private runtime `POST /api/chat/me/query-once` is the supported one-time answer endpoint for page helpers and smoke checks. It uses the same request/response contract as `/api/chat/me/query` and the same `chat:query` scope. Runtime treats `conversationId` as correlation only on this endpoint, skips persisted chat-memory loading, and skips conversation turn recording.
- Runtime code deployment `jz8ntc2b03kmllnpfn43esa7` deployed commit `22fa7fb48` for the implementation smoke; follow-up deployment `kpx28b02ryukztitqvem2399` deployed commit `969f87dfb` after the status documentation update. Live smoke verified `/query-once` returns `200` without creating a chat conversation (`GET /conversations/{queryOnceConversationId}` returned `404`), while normal `/query` still persists (`GET /conversations/{queryConversationId}` returned `200`).
- Direct private runtime `POST /api/chat/me/suggestions` passed with `content` and `maxSuggestions`.
- Negative auth smoke passed for missing runtime API key and wrong issuer.
- ProdUS backend `/health` and `/loomai/tool-allowlist` are reachable and tool allowlist reports `ready=true`.
- ProdUS MCP API-key auth is enabled on staging: unauthenticated `POST /mcp tools/list` returns `401 PRODUS_MCP_AUTH_REQUIRED`; authenticated `POST /mcp tools/list` returns `200` with 18 tools after adding the bounded `produs.productization_project.create` action candidate.
- LoomAI Marketplace discovery for `produs-staging` returns `ready=true` through the managed MCP Gateway.
- Read-only ProdUS MCP action bundle `mkp-action-produs-productization-read-mcp@0.1.0` is published, installed on `dep-7706fafb`, and applied in version `v3`.
- Confirmed project-creation action bundle `mkp-action-produs-productization-project-create-mcp@0.1.1` is published, installed on `dep-7706fafb` as `mpi-47247a04`, readiness `READY`, and live state `LIVE`.
- Live runtime `/api/admin/actions/overview` shows 9 ProdUS actions: 8 read actions plus `produs_productization_project_create`.
- The confirmed action maps to ProdUS MCP tool `produs.productization_project.create` on server ref `produs-staging`, schema hash `sha256:6a64c636165a0e6c92e7fefd41fad8e53132f411f2aa7d107a992c6e517867c0`, schema drift policy `DISABLE_ACTION`, and hidden backend-supplied parameters for `creationIntentId`, `consentToken`, `idempotencyKey`, and `analysisProviderRequestId`.
- Deployment version `ver-f9069ce5` was published and applied through release `rel-623c91a0`; the apply finished `APPLIED_VERIFIED` with verification `PASSED`.
- Negative live execution-path proof reached the ProdUS MCP tool and failed closed with `Project creation intent not found`; schema drift was `OK` and actual tool schema hash matched the manifest hash. This proves LoomAI config, MCP routing, and ProdUS authorization guard behavior without creating a project.
- ProdUS positive action proof completed on 2026-05-25 through the staging ProdUS MCP endpoint with a real owner-approved `runtimeActionPayload` from `POST /api/products/ai-assisted/analyze`: product `595f259a-4fce-4468-83e3-5c110b999432`, `creationMode=AI_ASSISTED`, `createdByAi=true`, `attachmentCount=1`, `aiSourceAttachmentCount=1`, audit event `fcaeff37-1fd2-4273-9a69-1ba62f44eb03`, provider request `rag-9d588c66-264d-4d8e-95ea-3bde6689bd2f`. Replaying the same action payload returned the same product with `idempotentReplay=true`.
- Remaining LoomAI-side positive proof is executing a fresh owner-approved payload through LoomAI's managed MCP gateway/runtime action path. A Codex-side direct gateway call returned `401 Invalid MCP gateway internal API key`, so this final proof requires LoomAI to run it with the live gateway secret or provide a valid temporary operator test key.
- ProdUS DATA plugin `mkp-data-produs-safe-knowledge@0.1.1` is published, installed on `dep-7706fafb`, live, and applied through release `rel-f17c4793`.
- Runtime `/api/ai/data-sync/vector-spaces` lists all 12 ProdUS safe knowledge vector spaces with no missing spaces.
- Runtime `/api/ai/data-sync/batch` accepted platform-smoke and ProdUS-shaped `SYSTEM_PROCESS` upsert/delete operations with `providerRequestId` and success/failure counts. A temporary service-module retrieval smoke returned a grounded answer and was deleted.
- Managed vectorization is configured live for the ProdUS export endpoint through source connection `vcn-a9bb577d`, plan `vpl-33b42e24`, active revision `vpr-d9e4b704`, and runner `vectorization-runner-dep-7706fafb`.
- Managed reindex run `vrn-39e54227` completed with `157` processed, `157` succeeded, `0` failed, and two cursor checkpoints after a governed runtime vector reset.
- Runtime release `rel-579d7fce` / version `ver-0b3324cd` is `APPLIED_VERIFIED` and includes deployment RAG tuning for ProdUS retrieval: threshold `0.2`, context documents `8`, context chars `7000`.
- Live retrieval checks now return grounded ProdUS service, package, team, and solo-expert answers. Runtime search diagnostics show nonzero results from the ProdUS DATA plugin sources.

Current contract alignment:

- LoomAI runtime/bridge now returns the flat canonical chat response for supported chat calls.
- LoomAI runtime now separates persistent chat intent from one-time answer intent: `/api/chat/me/query` is for chat panels; `/api/chat/me/query-once` is for non-persistent one-time answers and must not be used to read or write chat history.
- Machine-safe action failures are preserved as `actions[].errorCode` and `actions[].actionResult.errorCode`.
- ProdUS must not parse shopper/user-facing answer text to detect auth, access, action, or provider failures.
- ProdUS must not expose runtime, bridge, provider, MCP, vector, or Coolify internals to the browser.

## 1. Live Staging Deployment

| Field                      | Value                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Platform deployment id     | `dep-7706fafb`                                                                                                 |
| Platform deployment name   | `ProdUS AI Enablement Staging`                                                                                 |
| Environment                | `staging`                                                                                                      |
| Latest applied release     | `rel-623c91a0`                                                                                                 |
| Runtime template           | `dev-openai-qdrant`                                                                                            |
| Template plugin            | `mkp-template-support-desk-shell`                                                                              |
| Installed action plugins   | `mkp-action-produs-productization-read-mcp@0.1.0`, `mkp-action-produs-productization-project-create-mcp@0.1.1` |
| Installed data plugins     | `mkp-data-help-center`, `mkp-data-policy-folder`, `mkp-data-produs-safe-knowledge@0.1.1`                       |
| Stable consumer id         | `produs-staging`                                                                                               |
| Runtime base URL           | `http://dep-7706fafb.46.224.145.148.sslip.io`                                                                  |
| Preferred integration mode | `BACKEND_MEDIATED_PRIVATE_RUNTIME`                                                                             |
| Auth mode                  | `PRIVATE_RUNTIME_ASSERTION`                                                                                    |
| Last known health          | `UP`                                                                                                           |

The deployment is generic. It does not contain Shopify-specific plugins, Shopify actions, ProdUS-owned private data, raw scanner artifacts, repository content, secrets, or tenant-private workspace data.

## 2. Ownership Boundary

ProdUS remains the product system of record.

ProdUS owns:

- Supabase user sessions and role checks.
- Product, package, workspace, scanner, evidence, milestone, and marketplace data.
- Authorization and tenant isolation.
- Mutations and audit records.
- UI/UX and product workflow decisions.
- Safe knowledge export decisions.
- Backend-to-runtime private assertion signing.

LoomAI owns:

- Runtime chat orchestration.
- Retrieval over approved indexed knowledge.
- Grounded answers and suggestions.
- Governed action preparation once ProdUS MCP is importable.
- Runtime trace and execution evidence.
- Runtime auth verification using deployment-scoped trusted backend credentials.

LoomAI must not connect directly to ProdUS Postgres, MinIO, Supabase, repositories, scanner execution runtime, or user sessions.

## 3. Required Work From LoomAI/Coolify Before Enabling Live ProdUS Staging

ProdUS correctly identified the LoomAI/Coolify-side prerequisites. These are now configured for runtime `dep-7706fafb`; the values below remain the required source-of-truth shape for future recreation or rotation.

### Runtime Env On `dep-7706fafb`

Set or confirm these on the managed runtime service for `dep-7706fafb`:

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

Rules:

- Preserve any existing accepted issuers/audiences used by Platform operator smoke tests.
- Do not print or commit the API key or signing secret.
- The runtime currently supports one HMAC signing key via `AI_FABRIC_RUNTIME_PRIVATE_ASSERTION_SIGNING_KEY`.
- A per-issuer public key registry is not live-supported yet. `LOOMAI_ASSERTION_PRIVATE_KEY_PATH` is therefore not enough by itself unless LoomAI first implements asymmetric assertion verification.

### ProdUS-Owned Secret Decision

For staging, use one of these postures:

| Posture                                                 | Status             | Notes                                                                                         |
| ------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| Deployment-scoped HMAC shared secret                    | Supported now      | ProdUS backend and runtime both know the same signing secret. Backend-only.                   |
| ProdUS-owned asymmetric private key + LoomAI public key | Future             | Requires runtime key registry/public-key verification support before use.                     |
| Platform bridge only                                    | Supported fallback | ProdUS backend calls Platform, Platform signs runtime assertions. Not the preferred app path. |

The practical staging choice is deployment-scoped HMAC.

## 4. ProdUS Backend Env To Enable Direct Runtime

After LoomAI/Coolify runtime env is configured, set backend-only ProdUS Coolify env vars:

```bash
LOOMAI_ENABLED=true
LOOMAI_ENVIRONMENT=staging
LOOMAI_INTEGRATION_MODE=BACKEND_MEDIATED_PRIVATE_RUNTIME
LOOMAI_AUTH_MODE=PRIVATE_RUNTIME_ASSERTION
LOOMAI_BASE_URL=http://dep-7706fafb.46.224.145.148.sslip.io
LOOMAI_RUNTIME_API_KEY=<same value accepted by X-AIFABRIC-RUNTIME-API-KEY>
LOOMAI_ASSERTION_ISSUER=produs-staging-backend
LOOMAI_ASSERTION_AUDIENCE=dep-7706fafb
LOOMAI_ASSERTION_SIGNING_ALGORITHM=HS256
LOOMAI_ASSERTION_SIGNING_SECRET=<same HMAC signing secret configured on runtime>
LOOMAI_TIMEOUT_MS=8000
LOOMAI_ASSISTANT_QUERY_PATH=/api/chat/me/query
LOOMAI_ASSISTANT_QUERY_ONCE_PATH=/api/chat/me/query-once
LOOMAI_ASSISTANT_SUGGESTIONS_PATH=/api/chat/me/suggestions
LOOMAI_AUTH_CONTEXT_PATH=/api/chat/me/auth-context
```

Do not set these in frontend env. They are backend-only.

If direct runtime is not configured yet, keep:

```bash
LOOMAI_ENABLED=false
LOOMAI_ENVIRONMENT=staging
```

This keeps deterministic fallback active.

## 5. Private Runtime Assertion Contract

This is not OAuth and not a standard JWT. The runtime expects:

```http
X-AIFABRIC-RUNTIME-API-KEY: <deployment-scoped-runtime-api-key>
X-AIFABRIC-RUNTIME-AUTHORIZATION: Bearer rpa1.<base64url-json-payload>.<base64url-hmac-sha256-signature>
```

The HMAC input is the base64url payload segment. The HMAC key is `LOOMAI_ASSERTION_SIGNING_SECRET`, which must match runtime `AI_FABRIC_RUNTIME_PRIVATE_ASSERTION_SIGNING_KEY`.

Required assertion payload:

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
  "exp": "2026-05-19T21:30:00Z",
  "scopes": ["chat:query", "chat:suggestions", "chat:conversations"]
}
```

Rules:

- `iss` must be in runtime `AI_FABRIC_RUNTIME_AUTH_ACCEPTED_ISSUERS`.
- `aud` must include `dep-7706fafb` and match runtime `AI_FABRIC_RUNTIME_AUTH_ACCEPTED_AUDIENCES`.
- `authMode` must be `PRIVATE_RUNTIME_BACKEND_MEDIATED`.
- `callerType` must be `TRUSTED_BACKEND`.
- Use short expiry, recommended 5 to 15 minutes.
- For anonymous users, use `subjectType=ANONYMOUS_SESSION` and set `sub == sessionId`.
- For logged-in ProdUS users, use `subjectType=END_USER`.
- Do not send a normal `Authorization` bearer token to runtime in this mode.

## 6. Canonical Chat Request

ProdUS frontend calls ProdUS backend only. ProdUS backend calls LoomAI.

Frontend to ProdUS backend:

```http
POST /api/ai/assistant/query
Content-Type: application/json
```

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
    "packageId": "<uuid>",
    "workspaceId": "<uuid>",
    "findingId": "<uuid>"
  }
}
```

ProdUS backend must validate that the current user can read every referenced ID before sending context to LoomAI.

Backend to LoomAI direct runtime:

```http
POST http://dep-7706fafb.46.224.145.148.sslip.io/api/chat/me/query
Content-Type: application/json
X-AIFABRIC-RUNTIME-API-KEY: <deployment-scoped-runtime-api-key>
X-AIFABRIC-RUNTIME-AUTHORIZATION: Bearer <rpa1-token>
```

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

For page-level helpers, inline analysis, and smoke checks that must not persist chat history, call the one-time endpoint instead:

```http
POST http://dep-7706fafb.46.224.145.148.sslip.io/api/chat/me/query-once
Content-Type: application/json
X-AIFABRIC-RUNTIME-API-KEY: <deployment-scoped-runtime-api-key>
X-AIFABRIC-RUNTIME-AUTHORIZATION: Bearer <rpa1-token>
```

The request and response shape is the same as `/api/chat/me/query`. `conversationId` may be supplied as a correlation id, but `/api/chat/me/query-once` must not create conversation history. Do not send a `persistConversation` flag; ProdUS should choose `/query` or `/query-once` by product UX intent.

ProdUS backend must convert UI-supplied conversation ids into opaque subject-scoped provider ids before calling runtime. Do not pass raw product, package, workspace, milestone, finding, user, or tenant identifiers inside the runtime `conversationId`.

ProdUS uses `/query-once` for page helpers with an explain-only context hint:

- `context.assistantIntent=one-time-explanation`
- `context.toolUsePolicy=answer-from-supplied-context-and-safe-indexed-knowledge`
- `context.actionProfile=loomai-productization-explain-only`
- `context.availableActionGroups=[]`

Persistent `/query` remains the action-capable chat path with `actionProfile=loomai-productization-read`.

### 6.1 Project Creation With Temporary Documents

ProdUS project creation is now an AI-first backend-mediated flow. The browser calls ProdUS only:

```http
POST https://produs-api-staging.46.224.145.148.sslip.io/api/products/ai-assisted/analyze
Authorization: Bearer <Supabase JWT or staging mock token>
Content-Type: multipart/form-data
```

ProdUS project creation uses a two-step LoomAI flow. Step 1 is runtime analysis through `POST /api/chat/me/query-once` with `mode=support_assistant`, `position=product_intake_analysis`, and a neutral owner-intake output schema. Step 2 is project creation through a governed runtime action named `produs.productization_project.create`. This is scoped to project creation only; it does not create packages, workspaces, team selections, invitations, or participants.

LoomAI runtime support status as of 2026-05-27: implemented for both `/api/chat/me/query-once` and `/api/chat/me/query`. ProdUS should still use `/query-once` for project creation because the selected files are one-time analysis inputs and should not create chat history. Runtime extracts `context.documents[].temporaryAccessUrl`, validates it as a safe short-lived HTTPS URL, redacts it from stored/debug context, and passes it to the configured provider through the transient provider file-input contract.

ProdUS-side implementation status:

- Backend endpoint `POST /api/products/ai-assisted/analyze` creates a short-lived creation intent, stores private attachments, grants owner-selected temporary AI document access, calls `/api/chat/me/query-once`, and returns a `runtimeActionPayload`.
- Backend endpoint `POST /api/products/ai-assisted/intents/{intentId}/create` executes the same server-side action adapter used by MCP for local UI continuity and fallback.
- MCP/action endpoint `/mcp` exposes `produs.productization_project.create` in the allowlist with `mode=mutation` and `confirmationRequired=false` because ProdUS UI already minted a consent-bound creation intent.
- The action validates `creationIntentId`, `consentToken`, `idempotencyKey`, TTL, and attachment ownership; duplicate idempotency calls return the existing product.
- Focused ProdUS integration test passed for analyze -> MCP action -> product creation -> private attachment download URL.

Step 1 analysis payload:

```json
{
  "query": "Owner intake analysis instruction",
  "conversationId": "opaque-provider-conversation-id",
  "mode": "support_assistant",
  "position": "product_intake_analysis",
  "context": {
    "contextVersion": "produs-owner-intake-analysis-v2",
    "contextBoundary": "owner-authorized-intake-and-temporary-documents",
    "pageType": "owner-intake-analysis",
    "actionProfile": "loomai-productization-explain-only",
    "assistantIntent": "owner-intake-document-analysis",
    "toolUsePolicy": "answer-from-owner-input-and-temporary-documents-only",
    "availableActionGroups": [],
    "runtimeActionPolicy": "actions-disabled-for-this-analysis-response",
    "ownerBrief": "Owner-provided intake text to analyze as data, not as an action-selection command.",
    "documentSharingPolicy": {
      "scope": "owner-intake-analysis-only",
      "indexing": "not-allowed",
      "retention": "do-not-store-document-content",
      "access": "temporary-url-selected-by-owner",
      "ttl": "minutes"
    },
    "documents": [
      {
        "documentId": "<uuid>",
        "attachmentId": "<uuid>",
        "fileName": "brief.pdf",
        "contentType": "application/pdf",
        "sizeBytes": 12345,
        "temporaryAccessUrl": "https://produs-api-staging.../api/product-attachments/ai-access/<token>",
        "expiresAt": "2026-05-25T12:34:56Z",
        "accessInstruction": "pass-temporaryAccessUrl-as-provider-typed-file-url-input-and-return-document-usage-evidence",
        "providerInputHint": "typed-file-url"
      }
    ],
    "outputContract": {
      "format": "strict-json-object",
      "fields": [
        "draftName",
        "outcomeSummary",
        "stage",
        "stack",
        "productUrl",
        "repositoryUrl",
        "riskNotes",
        "analysisSummary",
        "assumptions",
        "missingEvidence",
        "documentUsage"
      ]
    }
  }
}
```

LoomAI runtime behavior for this project-creation path:

- Treat `temporaryAccessUrl` documents as analysis-only transient inputs.
- Treat Step 1 as explain-only analysis. Do not select, suggest, prepare, or execute runtime actions from the `/query-once` analysis response.
- For Step 1, return the neutral owner-intake keys `draftName`, `outcomeSummary`, `stage`, `stack`, `riskNotes`, and `analysisSummary`. ProdUS maps these to product fields only after receiving the analysis response, which keeps the analysis response out of the confirmed-action planner.
- Treat `context.ownerBrief` as owner-provided data to analyze, not as an executable command. The query text remains an analysis instruction to avoid confirmed-action routing in Step 1.
- Do not index, vectorize, retain, or expose project-creation document content.
- Pass every selected `temporaryAccessUrl` to the configured model/provider as a typed file/document URL input, not as plain prompt text.
- Fetch/open every temporary document URL during the request window only. The URL is a ProdUS backend endpoint that returns the document bytes directly with `Cache-Control: no-store`; it is not a redirect and does not require browser credentials, custom headers, or cookies.
- ProdUS does not send document text or redacted excerpts for this flow.
- Runtime accepts at most 8 transient document URLs per request.
- Runtime rejects declared file sizes over 50 MB.
- `expiresAt`, when supplied, must be an ISO-8601 instant with timezone, must not be expired, and must be no more than 24 hours in the future.
- Runtime should be configured with `ai.fabric.runtime.transient-file-url.allowed-hosts=produs-api-staging.46.224.145.148.sslip.io` for staging so only ProdUS temporary file hosts are accepted.
- Return a strict JSON object in `answer` or `safeSummary` with `draftName`, `outcomeSummary`, `stage`, `stack`, `productUrl`, `repositoryUrl`, `riskNotes`, `analysisSummary`, `assumptions`, `missingEvidence`, and `documentUsage`.
- Return one `documentUsage` item per owner-selected document:

```json
{
  "fileName": "brief.pdf",
  "status": "USED",
  "accessMethod": "TEMPORARY_URL",
  "evidence": ["Owner-safe fact extracted from the opened file"],
  "reason": "Temporary URL opened and parsed successfully."
}
```

- `status` must be `USED` or `NOT_USED`.
- `accessMethod` must be `TEMPORARY_URL` or `NONE`.
- Do not claim `USED` unless the runtime extracted at least one owner-safe evidence item from the file.
- If a file is not used, `reason` must explain whether URL retrieval failed, parsing failed, access expired, or the file was irrelevant.
- Keep `/query-once` non-persistent: no chat conversation, no memory write, no document retention.

Provider support matrix:

| Provider | Temporary document support |
|---|---|
| OpenAI | Native Responses `input_file.file_url` for PDF, text-like, and Office-style files; native `input_image.image_url` for supported images. |
| Azure OpenAI | Responses input path; PDFs are fetched transiently and passed as `file_data`; supported images use image URL inputs. Other types fail closed. |
| Anthropic | Native URL blocks for PDFs and supported images only. Other types fail closed. |
| Gemini | Runtime fetches approved HTTPS URLs transiently and sends text, PDF, image, audio, and video as provider `inlineData`. |
| Cohere | Runtime fetches text-like files and PDFs transiently, extracts readable text, and sends it through Cohere `documents`. Unsupported files fail closed. |

Fail-closed means LoomAI returns `documentUsage.status=NOT_USED`, `accessMethod=NONE`, empty evidence, and a provider/type reason. ProdUS must show the file as not analyzed instead of claiming it was used.

ProdUS adaptation requirements:

- Include `documentId` in addition to any ProdUS-local `attachmentId`; LoomAI uses `documentId` in transient input descriptors and `documentUsage`.
- Use direct HTTPS byte-serving URLs with no redirect, cookie, or custom-header requirement.
- Do not send raw document text, storage URLs, Supabase tokens, repository tokens, or object storage credentials.
- Do not send `temporaryAccessUrl` to the Step 2 mutation. Step 2 receives only owner-approved creation fields and attachment ids.
- Mark an attachment `USED` only when LoomAI returns `documentUsage.status=USED` with owner-safe evidence for that attachment.
- Treat `NOT_USED` as a normal, honest result for unsupported file types or expired URLs.
- For best current coverage, prefer PDF/text-like files when the configured provider is not OpenAI or Gemini; Office-style files are currently best supported by OpenAI.

Step 2 runtime action configuration:

```json
{
  "name": "produs.productization_project.create",
  "mode": "mutation",
  "confirmationRequired": false,
  "confirmationModel": "pre_authorized_by_produs_ui_creation_intent",
  "profile": "loomai-productization-confirmed-actions",
  "description": "Create the initial ProdUS productization project from owner-approved AI analysis attributes.",
  "inputSchema": {
    "type": "object",
    "required": [
      "creationIntentId",
      "consentToken",
      "idempotencyKey",
      "productName",
      "summary",
      "businessStage"
    ],
    "properties": {
      "creationIntentId": { "type": "string", "format": "uuid" },
      "consentToken": { "type": "string" },
      "idempotencyKey": { "type": "string" },
      "analysisProviderRequestId": { "type": "string" },
      "productName": { "type": "string", "maxLength": 255 },
      "summary": { "type": "string" },
      "businessStage": {
        "type": "string",
        "enum": ["IDEA", "PROTOTYPE", "VALIDATED", "LIVE", "SCALING"]
      },
      "techStack": { "type": "string" },
      "productUrl": { "type": "string" },
      "repositoryUrl": { "type": "string" },
      "riskProfile": { "type": "string" },
      "aiCreationSummary": { "type": "string" },
      "assumptions": { "type": "array", "items": { "type": "string" } },
      "missingEvidence": { "type": "array", "items": { "type": "string" } },
      "sourceAttachmentIds": {
        "type": "array",
        "items": { "type": "string", "format": "uuid" }
      },
      "aiAccessibleAttachmentIds": {
        "type": "array",
        "items": { "type": "string", "format": "uuid" }
      }
    },
    "additionalProperties": false
  },
  "outputSchema": {
    "type": "object",
    "required": ["productId", "creationMode", "createdByAi", "idempotencyKey"],
    "properties": {
      "productId": { "type": "string", "format": "uuid" },
      "productName": { "type": "string" },
      "creationMode": { "const": "AI_ASSISTED" },
      "createdByAi": { "const": true },
      "aiProviderRequestId": { "type": "string" },
      "attachmentCount": { "type": "integer" },
      "aiSourceAttachmentCount": { "type": "integer" },
      "auditEventId": { "type": "string" },
      "idempotencyKey": { "type": "string" }
    }
  }
}
```

LoomAI-side Step 2 action status:

- Marketplace plugin `mkp-action-produs-productization-project-create-mcp@0.1.1` is published and installed live on `dep-7706fafb`.
- Platform install id is `mpi-47247a04`; deployment version is `ver-f9069ce5`; applied release is `rel-623c91a0`.
- Runtime action name is `produs_productization_project_create`; underlying MCP tool is `produs.productization_project.create`.
- Runtime action is `WRITE_ONLY`, `sideEffectLevel=MUTATING`, `confirmationRequired=false`, `groundingEligible=false`, and `readActionResolutionEligible=false`.
- Required parameters are `creationIntentId`, `consentToken`, `idempotencyKey`, `productName`, `summary`, and `businessStage`.
- `creationIntentId`, `consentToken`, `idempotencyKey`, and `analysisProviderRequestId` are hidden/backend-supplied parameters and must not be requested from the user.
- Live negative execution proof reached the ProdUS MCP tool, matched the expected schema hash, and failed closed with `Project creation intent not found` for an intentionally invalid creation intent. This proves routing and authorization guard behavior without creating a project.
- ProdUS positive MCP creation proof passed on 2026-05-25 using a real owner-approved `runtimeActionPayload` from the `POST /api/products/ai-assisted/analyze` flow. The action created product `595f259a-4fce-4468-83e3-5c110b999432`, persisted it as `AI_ASSISTED`, attached one private project document, stored LoomAI provider request `rag-9d588c66-264d-4d8e-95ea-3bde6689bd2f`, and produced audit event `fcaeff37-1fd2-4273-9a69-1ba62f44eb03`.
- The same payload was replayed and returned `idempotentReplay=true`, proving duplicate action safety.
- LoomAI runtime/gateway positive proof remains the final cross-system check. Codex attempted the managed MCP gateway endpoint and received `401 Invalid MCP gateway internal API key`; LoomAI should execute a fresh payload with its live gateway secret or provide a temporary operator test key for this verification.

ProdUS persists the product as `creationMode=AI_ASSISTED`, `createdByAi=true`, attaches documents privately to the product, and stores LoomAI `providerRequestId`. Selected documents are only available to LoomAI through short-lived ProdUS token URLs during Step 1 analysis; the Step 2 mutation receives attachment ids only. The browser never receives runtime secrets and LoomAI never receives storage credentials.

Current ProdUS UI flow:

1. Browser posts owner brief, optional hints, and selected files to `POST /api/products/ai-assisted/analyze`.
2. ProdUS returns analysis fields plus the consent-bound `runtimeActionPayload`.
3. Browser renders the analysis preview and calls `POST /api/products/ai-assisted/intents/{intentId}/create` when the owner continues.
4. LoomAI runtime can invoke `produs.productization_project.create` with the same payload shape after ProdUS supplies the owner-approved `runtimeActionPayload`.

ProdUS action validation requirements:

- Validate `creationIntentId`, `consentToken`, owner identity, TTL, and document ownership before creating anything.
- Validate `idempotencyKey`; duplicate calls return the existing product.
- Reject package, workspace, team, invitation, participant, scanner, readiness, payment, or contract creation in this action.
- Reject mutation calls that include temporary document URLs, storage URLs, credentials, or raw document content.

Do not send:

- `message` instead of `query`
- `sessionId` instead of `conversationId`
- top-level `userId`, `ownerId`, `tenantId`, or `storefrontContext`
- raw scanner logs, secrets, repository files, object storage URLs, Supabase JWTs, or admin keys

Legacy top-level identity/context fields should fail closed in greenfield integrations.

## 7. Canonical Chat Response

ProdUS backend should return this flat shape to the browser:

```json
{
  "provider": "LOOMAI",
  "mode": "LIVE",
  "success": true,
  "type": "INFORMATION_PROVIDED",
  "answer": "Safe answer",
  "safeSummary": "Safe answer",
  "conversationId": "produs-ui-session-123",
  "sources": [],
  "actions": [],
  "suggestions": [],
  "fallbackReason": null,
  "providerRequestId": "rag-..."
}
```

Runtime direct response already uses the standardized flat response:

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

ProdUS can add product-local wrapper fields such as `provider` and `mode`, but should not expose nested `result`, `sanitizedPayload`, runtime auth context, provider raw payloads, or bridge internals to the frontend.

## 8. Structured Error And Action Evidence Contract

New runtime contract requirement:

- Use `errorCode` and structured action evidence for deterministic UX.
- Do not inspect English answer text for auth, access, tool, or action status.

Action evidence can appear as:

```json
{
  "actions": [
    {
      "action": "produs_get_workspace_status",
      "errorCode": "PRODUS_WORKSPACE_ACCESS_DENIED",
      "actionResult": {
        "success": false,
        "errorCode": "PRODUS_WORKSPACE_ACCESS_DENIED",
        "message": "Safe technical summary for backend logs only."
      }
    }
  ],
  "fallbackReason": "PRODUS_WORKSPACE_ACCESS_DENIED"
}
```

ProdUS frontend/backend behavior:

| Condition               | Use                                                                            |
| ----------------------- | ------------------------------------------------------------------------------ |
| User-facing copy        | `answer` or `safeSummary`                                                      |
| Deterministic UI branch | `actions[].errorCode`, `actions[].actionResult.errorCode`, or `fallbackReason` |
| Trace correlation       | `providerRequestId`                                                            |
| Source display          | sanitized `sources[]` only                                                     |
| Confirmable action      | `type=CONFIRMATION_REQUIRED` plus `actions[]`                                  |

Recommended ProdUS error codes for future MCP/read actions:

```text
PRODUS_AUTH_REQUIRED
PRODUS_ACCESS_DENIED
PRODUS_RESOURCE_NOT_FOUND
PRODUS_WORKSPACE_ACCESS_DENIED
PRODUS_PRODUCT_NOT_FOUND
PRODUS_SCANNER_RESULT_UNAVAILABLE
PRODUS_ACTION_CONFIRMATION_REQUIRED
PRODUS_ACTION_NOT_ENABLED
PRODUS_UPSTREAM_UNAVAILABLE
```

These should be emitted by ProdUS MCP/tool adapters or LoomAI governed action adapters as machine codes, not inferred from user text.

## 9. Suggestions Contract

Frontend to ProdUS backend:

```http
POST /api/ai/assistant/suggestions
```

```json
{
  "content": "Current page or current draft answer",
  "conversationId": "produs-ui-session-123",
  "maxSuggestions": 4,
  "context": {
    "pageType": "owner-product-workspace",
    "productId": "<uuid>",
    "workspaceId": "<uuid>"
  }
}
```

Backend to runtime:

```http
POST /api/chat/me/suggestions
```

Use the same private runtime headers as chat query.

Response to frontend:

```json
{
  "provider": "LOOMAI",
  "mode": "LIVE",
  "success": true,
  "suggestions": [
    "Summarize launch blockers",
    "Show scanner risks",
    "Explain package readiness"
  ],
  "fallbackReason": null
}
```

## 10. Smoke Verification

### Runtime Health

```bash
curl -fsS http://dep-7706fafb.46.224.145.148.sslip.io/actuator/health
```

Expected:

```json
{ "status": "UP" }
```

### Auth Context Smoke

After ProdUS generates a private assertion:

```bash
curl -fsS \
  -H "X-AIFABRIC-RUNTIME-API-KEY: ${LOOMAI_RUNTIME_API_KEY}" \
  -H "X-AIFABRIC-RUNTIME-AUTHORIZATION: Bearer ${LOOMAI_PRIVATE_ASSERTION}" \
  http://dep-7706fafb.46.224.145.148.sslip.io/api/chat/me/auth-context
```

Expected fields:

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

### Query Smoke

```bash
curl -fsS \
  -H "Content-Type: application/json" \
  -H "X-AIFABRIC-RUNTIME-API-KEY: ${LOOMAI_RUNTIME_API_KEY}" \
  -H "X-AIFABRIC-RUNTIME-AUTHORIZATION: Bearer ${LOOMAI_PRIVATE_ASSERTION}" \
  -X POST \
  http://dep-7706fafb.46.224.145.148.sslip.io/api/chat/me/query \
  --data '{
    "query": "What can you help me with?",
    "conversationId": "produs-runtime-smoke",
    "mode": "support_assistant",
    "position": "productization",
    "context": {"pageType": "owner-product-workspace"}
  }'
```

Expected:

- HTTP 200
- `success=true`
- non-empty `answer` or safe fallback with `success=false`
- no nested provider secrets
- no internal runtime terminology in user-facing answer

### Negative Auth Smoke

These must fail:

- missing `X-AIFABRIC-RUNTIME-API-KEY`
- wrong runtime API key
- missing private assertion
- expired assertion
- `iss` not in accepted issuers
- `aud` not in accepted audiences
- missing `chat:query` scope for query
- both public `Authorization` and private `X-AIFABRIC-RUNTIME-AUTHORIZATION` supplied

## 11. Platform Bridge Fallback

Use only for operator validation or temporary fallback if direct runtime integration is not enabled.

```bash
PLATFORM_BASE_URL="https://loomai-platform-backend.46.224.145.148.sslip.io"
PLATFORM_API_KEY="<platform-operator-api-key>"

curl -fsS \
  -H "X-PLATFORM-API-KEY: ${PLATFORM_API_KEY}" \
  -H "Content-Type: application/json" \
  -X POST \
  "${PLATFORM_BASE_URL}/api/public/consumers/produs-staging/bridge/chat/query" \
  --data '{"query":"What can you help me with?","conversationId":"produs-consumer-smoke"}'
```

The Platform API key is an operator credential. Do not expose it in the browser.

If the bridge returns a nested internal envelope, ProdUS backend must normalize it to the flat response in Section 7 before returning to the frontend.

## 12. Indexing And Retrieval

There are three data classes. Treat them differently.

### A. Deployment-Managed Generic Data

Already live:

- `mkp-data-help-center`
- `mkp-data-policy-folder`

Compiled entity types:

- `faq-article`
- `support-policy`

This is generic support/policy data, not ProdUS productization data.

### B. ProdUS Safe Knowledge

LoomAI-side setup is complete for staging:

- Marketplace DATA plugin: `mkp-data-produs-safe-knowledge@0.1.1`
- Deployment install: enabled, ready, entitled, and live on `dep-7706fafb`
- Applied release: `rel-f17c4793`, `APPLIED_VERIFIED`, verification `PASSED`
- Runtime data-sync endpoint: `POST /api/ai/data-sync/batch`

Registered ProdUS vector spaces:

```text
service-category
service-module
service-dependency
package-template
ai-capability-contract
milestone-template
acceptance-criteria-template
evidence-template
scanner-tool-description
case-pattern
team-profile
solo-expert-profile
```

Team and solo expert spaces are already added on the LoomAI side. ProdUS maps public active `TEAM_PROFILE` records to `team-profile` and public active `SOLO_EXPERT_PROFILE` records to `solo-expert-profile`. Do not reuse `case-pattern` for profile records now that dedicated spaces exist.

ProdUS safe knowledge should be generated by backend-approved export endpoints:

```text
GET  https://produs-api-staging.46.224.145.148.sslip.io/api/ai/loomai/knowledge-preview
POST https://produs-api-staging.46.224.145.148.sslip.io/api/ai/loomai/knowledge-sync
```

Only ProdUS admins can use these endpoints. They are for direct preview/replay and are separate from the LoomAI-managed vectorization export endpoint below.

ProdUS sync requests must use the canonical `trace + operations` payload. Use `SYSTEM_PROCESS` auth context:

```json
{
  "subjectId": "system:produs-safe-knowledge-sync",
  "subjectType": "SYSTEM_PROCESS",
  "authMode": "PRIVATE_RUNTIME_BACKEND_MEDIATED",
  "callerType": "SYSTEM_PROCESS",
  "deploymentId": "dep-7706fafb",
  "customerId": "produs-staging",
  "issuer": "produs-staging-backend",
  "grantedScopes": ["data-sync:upsert"]
}
```

Live LoomAI smoke accepted ProdUS-shaped upsert/delete operations, including `team-profile` and `solo-expert-profile`. ProdUS direct replay also synced real staging safe records successfully on 2026-05-21: `157` total operations, `157` succeeded, `0` failed, with provider request IDs returned across four runtime batches.

#### Managed Vectorization Live Configuration

The current staging deployment now uses LoomAI-managed vectorization for ProdUS safe knowledge. ProdUS still owns the safe export decision; LoomAI owns the source connection, run lifecycle, checkpoints, retries, target data-sync writes, and retrieval verification.

Live flow:

```text
ProdUS safe export endpoint
  -> LoomAI Platform source connection vcn-a9bb577d
  -> managed vectorization runner vectorization-runner-dep-7706fafb
  -> runtime /api/ai/data-sync/batch
  -> Qdrant vector index
  -> runtime retrieval over DATA-plugin source handles
```

ProdUS now provides a backend-only paged export endpoint for LoomAI-managed vectorization:

```text
GET https://produs-api-staging.46.224.145.148.sslip.io/api/ai/loomai/knowledge-export?cursor=<opaque-cursor>&limit=<page-size>
Authorization: Bearer <produs-owned-loomai-vectorization-export-token>
```

ProdUS implementation status: deployed and live-verified on staging as of 2026-05-21. The staging backend is configured with backend-only `LOOMAI_SAFE_KNOWLEDGE_EXPORT_TOKEN`; the raw token must be exchanged through the private secret channel only.

Live export verification:

- `GET /actuator/health` returned `UP`.
- Unauthenticated export call returned `401`.
- Wrong-token export call returned `401`.
- Valid-token export call returned `200`.
- Full export completed in four pages: `50 + 50 + 50 + 7 = 157` records.
- Exported vector spaces observed: `service-category`, `service-module`, `service-dependency`, `package-template`, `ai-capability-contract`, `milestone-template`, `acceptance-criteria-template`, `evidence-template`, `scanner-tool-description`, `case-pattern`, `team-profile`, `solo-expert-profile`.
- `TEAM_PROFILE` records use `team-profile`; `SOLO_EXPERT_PROFILE` records use `solo-expert-profile`.

LoomAI live configuration:

| Field                 | Value                                                         |
| --------------------- | ------------------------------------------------------------- |
| Source connection     | `vcn-a9bb577d`                                                |
| Source adapter        | `REST_API`                                                    |
| Source status         | `READY`                                                       |
| Source base URL       | `https://produs-api-staging.46.224.145.148.sslip.io`          |
| Source path           | `/api/ai/loomai/knowledge-export`                             |
| Auth mode             | `BEARER`                                                      |
| Token secret ref      | `MANAGED_PRODUS_SAFE_KNOWLEDGE_EXPORT_TOKEN_DEP_DEP_7706FAFB` |
| Pagination            | cursor, `cursor`, `limit`, page size `100`                    |
| Items path            | `records`                                                     |
| Vector space field    | `vectorSpace`                                                 |
| Plan                  | `vpl-33b42e24`                                                |
| Active revision       | `vpr-d9e4b704`, revision `2`                                  |
| Runner mode           | `PLATFORM_MANAGED_AUTO`                                       |
| Runner registration   | `vrr-cb21c848`, `ACTIVE`, `CURRENT`                           |
| Latest successful run | `vrn-39e54227`                                                |

Plan mapping:

```json
{
  "entityMappings": {
    "produs-safe-knowledge": {
      "recordIdField": "id",
      "recordVersionField": "metadata.sourceRecordVersion",
      "targetEntityTypeField": "vectorSpace",
      "metadataStaticValues": {
        "datasetId": "produs-safe-knowledge",
        "exportVersion": "produs-safe-knowledge-v1"
      },
      "metadataStaticValuesByTargetEntityType": {
        "<vectorSpace>": {
          "knowledgeSourceHandleRef": "<deployment DATA plugin handle ref>",
          "knowledgeSourceId": "<deployment DATA source id>",
          "knowledgeSourceDatasetRef": "<deployment DATA dataset ref>"
        }
      }
    }
  }
}
```

The per-vector-space static metadata is required because the runtime shared-index retriever filters records by the installed DATA plugin source handle.

Latest managed reindex evidence:

```text
run: vrn-39e54227
status: COMPLETED
processed: 157
succeeded: 157
failed: 0
checkpoints: 2 pages
failureBuckets: []
```

Checkpoint details:

- page 1: `100` records, `hasMore=true`
- page 2: `57` records, `hasMore=false`

Reset/reindex verification on 2026-05-21:

- Governed Platform runtime vector reset removed `164` vectors from the Qdrant runtime index.
- Runtime indexing overview immediately after reset reported `totalVectors=0`.
- Managed vectorization run `vrn-39e54227` reindexed the ProdUS export successfully with `157` processed, `157` succeeded, and `0` failed.
- Runtime indexing overview after reindex reported `totalVectors=157`, including `service-module=75`, `package-template=12`, `team-profile=1`, and `solo-expert-profile=1`.
- Runtime vector metadata still includes `datasetId=produs-safe-knowledge`, `exportVersion=produs-safe-knowledge-v1`, and DATA plugin source handle metadata.
- Live retrieval checks after reindex still returned grounded answers, and runtime diagnostics showed nonzero successful results for all ProdUS DATA sources.

Observed source discovery counts:

```text
service-category: 8
service-module: 75
service-dependency: 18
package-template: 12
milestone-template: 12
case-pattern: 12
acceptance-criteria-template: 1
evidence-template: 1
ai-capability-contract: 6
scanner-tool-description: 10
team-profile: 1
solo-expert-profile: 1
```

Runtime prompt/retrieval tuning now applied in release `rel-579d7fce` / version `ver-0b3324cd`:

```json
{
  "ragSimilarityThreshold": 0.2,
  "ragMaxDocumentsUsedForContext": 8,
  "ragMaxContextChars": 7000
}
```

Live retrieval checks completed through `POST /api/chat/me/query`:

- `Which ProdUS service handles API security review and what outcome should it produce?`
- `Which services help a prototype with CI/CD and dependency risk?`
- `Which package template is appropriate for launch readiness?`
- `Which public teams or solo experts are relevant for security and launch-readiness work?`

Observed behavior:

- Answers referenced real ProdUS service/package/team/solo-expert records.
- Answers did not expose private workspace, scanner artifact, token, or message data.
- Each response included a `providerRequestId`.
- Runtime search diagnostics showed nonzero successful retrieval from ProdUS DATA sources, including `service-module`, `package-template`, `team-profile`, and `solo-expert-profile`.

Known hygiene follow-up: ProdUS staging Coolify currently has duplicate `LOOMAI_SAFE_KNOWLEDGE_EXPORT_TOKEN` env rows. LoomAI stored only one non-empty value in the managed Platform secret, but the duplicate rows should be cleaned on the ProdUS app before the next token rotation.

Recommended response shape:

```json
{
  "records": [
    {
      "id": "service-module:example",
      "type": "SERVICE_MODULE",
      "vectorSpace": "service-module",
      "title": "Example Service",
      "body": "Approved public productization text",
      "metadata": {
        "slug": "example",
        "releaseStage": "LIVE",
        "sourceUpdatedAt": "2026-05-21T10:00:00Z"
      },
      "deleted": false
    }
  ],
  "nextCursor": "opaque-next-cursor",
  "hasMore": true,
  "totalEstimate": 157,
  "exportVersion": "produs-safe-knowledge-v1"
}
```

Required ProdUS behavior:

- Return only approved safe shared knowledge. Never return workspace-private state, raw scanner logs, raw evidence files, object storage URLs, credentials, secrets, private messages, or team-private records.
- Use stable record IDs. Re-running the export must produce the same `id` for the same logical record.
- Include the exact LoomAI vector space per record in `vectorSpace`.
- Support paging until `hasMore=false`; `cursor` must be opaque and safe to log.
- Support deterministic full export for bootstrap/reindex runs.
- Support tombstones for deletions with `deleted=true`, or expose a separate delete feed if ProdUS prefers.
- Include `sourceUpdatedAt` or another source revision marker so LoomAI can reason about drift and reindex freshness.
- Keep payloads bounded. Prefer compact summaries over large raw objects.
- Use HTTPS only and backend-only auth. The export endpoint must not be callable from the browser.
- Rate limit and audit the export endpoint. Calls should be attributable to the LoomAI vectorization runner or Platform staging issuer.

Recommended auth:

```text
Authorization: Bearer <produs-owned-loomai-vectorization-export-token>
```

or the same private-runtime assertion pattern if ProdUS wants issuer/audience-bound requests:

```text
issuer: loomai-vectorization-runner-staging
audience: produs-staging-safe-knowledge-export
scope: knowledge-export:read
```

LoomAI-side configuration shape for recreation:

```text
source connection:
  adapterType: REST_API
  authMode: API_KEY or PRIVATE_ASSERTION
  baseUrl: https://produs-api-staging.46.224.145.148.sslip.io
  exportPath: /api/ai/loomai/knowledge-export
  authHeader: Authorization
  authHeaderValue: Bearer <produs-owned-loomai-vectorization-export-token>

vectorization plan:
  runnerMode: PLATFORM_MANAGED_AUTO
  entityScope:
    - produs-safe-knowledge
  pagination: CURSOR
  pageSize: 100
  mapping:
    recordIdField: id
    recordVersionField: metadata.sourceRecordVersion
    targetEntityTypeField: vectorSpace
```

Acceptance for enabling LoomAI-managed vectorization:

- `GET /api/ai/loomai/knowledge-export?limit=1` returns one safe record and no private fields.
- A full paged export completes until `hasMore=false`.
- Missing or wrong bearer token returns `401`; missing server-side export token config returns `503`.
- Exported `TEAM_PROFILE` and `SOLO_EXPERT_PROFILE` records use `team-profile` and `solo-expert-profile`.
- LoomAI Platform shows a vectorization source connection, plan, runner, and run history for `dep-7706fafb`.
- A bootstrap run writes records through `/api/ai/data-sync/batch` with zero `VECTOR_SPACE_NOT_FOUND` errors.
- A retry run resumes from checkpoint rather than duplicating or losing records.
- A retrieval smoke returns grounded answers from exported ProdUS safe knowledge.

Safe record shape:

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

### C. User-Owned Live Context

Do not bulk-index user-owned workspace/product evidence.

Use live, authorized reads through ProdUS backend/MCP for:

- current product state
- current package state
- workspace status
- scanner findings
- milestone evidence
- private owner/team context

LoomAI should receive only safe summaries or governed MCP results, never raw source credentials.

## 13. MCP Setup Checklist

ProdUS MCP must be healthy before LoomAI imports read/action tools.

Required staging env:

```bash
PRODUS_MCP_TOOL_PROFILE=loomai-productization
PRODUS_MCP_REQUIRE_AUTH=true
PRODUS_MCP_API_KEY=<produs-owned-mcp-api-key>
```

LoomAI Platform stores the matching MCP key as a Platform secret before discovery:

```text
MCP_SECRET_PRODUS_STAGING_MCP_API_KEY
```

Do not place the raw MCP key in a Marketplace manifest, discovery request, browser bundle, or deployment handoff. Platform discovery resolves `MCP_SECRET_*` references server-side and forwards only the resolved value to the managed MCP Gateway.

Required healthy endpoints:

```text
GET  https://produs-api-staging.46.224.145.148.sslip.io/health
GET  https://produs-api-staging.46.224.145.148.sslip.io/loomai/tool-allowlist
POST https://produs-api-staging.46.224.145.148.sslip.io/mcp
```

Discovery command:

```bash
PLATFORM_BASE_URL="https://loomai-platform-backend.46.224.145.148.sslip.io"
PLATFORM_API_KEY="<platform-operator-api-key>"

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
      "auth": {
        "mode": "API_KEY_HEADER_SECRET",
        "headerName": "X-MCP-API-KEY",
        "secretRef": "MCP_SECRET_PRODUS_STAGING_MCP_API_KEY"
      }
    },
    "trace": {
      "environment": "staging",
      "source": "produs-ai-enablement"
    },
    "allowedTools": [],
    "gatewayServiceRef": "mcp-execution-gateway"
  }'
```

Do not compile MCP action plugins into the deployment until discovery returns `ready=true` and the tools match the `loomai-productization` allowlist.

## 14. ProdUS Widget And Frontend Usage

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
- The widget displays fallback reason only in admin/operator contexts.
- The widget does not show MCP, runtime, vector, or indexing terminology to owners/teams.

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

## 15. Release Gates For Calling This Complete

Do not mark ProdUS LoomAI integration complete until these pass:

- ProdUS backend can call `/api/chat/me/auth-context` with private-runtime assertion and receives expected verified context.
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
- No UI branch relies on matching English text in `answer`; use machine `errorCode`.

## 16. Known Gaps

Current gaps are expected and should be tracked:

1. Current live runtime supports HMAC private assertions only. Asymmetric `LOOMAI_ASSERTION_PRIVATE_KEY_PATH` requires LoomAI runtime key-registry work before use.
2. ProdUS owner-browser smoke through `/api/ai/assistant/*` still depends on the ProdUS UI surface being enabled with an authenticated owner.
3. ProdUS-side positive `produs.productization_project.create` live creation verification passed through the staging ProdUS MCP endpoint with a real owner-approved payload. LoomAI-side runtime/gateway positive execution remains pending only because Codex did not have an accepted live MCP gateway internal key.
4. Platform apply currently requires preserving the ProdUS private-auth issuer in runtime env after rollout. LoomAI patched staging manually; Platform env rendering should be hardened before relying on repeated automatic applies.
5. Additional mutation MCP tools remain deferred. Each new mutation needs its own reviewed confirmed-action Marketplace manifest, explicit ProdUS UX confirmation/authorization contract, audit behavior, idempotency, and fail-closed verification.

## 17. Recommended Next Work

1. Ask LoomAI to execute a fresh owner-approved `runtimeActionPayload` through the managed MCP gateway/runtime action path using the live gateway secret, or provide ProdUS/Codex with a temporary accepted operator key for one positive execution proof.
2. Keep the local ProdUS REST create endpoint as fallback/continuity until the LoomAI runtime/gateway action path has positive creation evidence from an owner-authenticated flow.
3. Harden Platform env rendering so repeated deployment applies preserve ProdUS private-runtime issuer/audience and do not require manual Coolify correction.
4. Run `/api/ai/assistant/query`, `/api/ai/assistant/query-once`, and `/api/ai/assistant/suggestions` from an authenticated ProdUS owner session after enabling the UI surface.
5. Rerun Marketplace discovery against ProdUS `/mcp` and `/loomai/tool-allowlist` using `MCP_SECRET_PRODUS_STAGING_MCP_API_KEY` after each ProdUS tool catalog change.
6. Add reviewed confirmed-action manifests for additional ProdUS mutation tools only after each action has explicit confirmation UX, authorization, audit, idempotency, and fail-closed behavior wired.
7. Run end-to-end role tests: admin, owner, team manager, specialist, advisor.
8. Only after staging passes, design production deployment with separate runtime, credentials, vector namespace, rate limits, and rollback plan.
