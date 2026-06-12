# LoomAI Staging Deployment Handover For ProdUS

Date: 2026-05-19

Audience: ProdUS backend, frontend, platform operations, MCP, scanner, and LoomAI integration owners.

Status: staging LoomAI deployment is live and verified. ProdUS should integrate through the standardized backend-mediated private runtime contract. The Platform consumer bridge remains useful for operator smoke tests and fallback comparison, but it is not the target application path.

Latest LoomAI-side status, verified 2026-06-02:

- 2026-06-02 production-Coolify shift-left update: LoomAI exported staging deployment `dep-7706fafb` with sealed secrets through the Platform deployment export API, reimported it on the production Platform/Coolify server after the private-runtime audience clone fix, published imported deployment version `ver-a9f46201`, and applied it through release `rel-7aa6f229`.
- Imported production-server staging runtime deployment is `dep-53f9ca56`.
- Production Platform consumer `produs-staging` is now assigned to `dep-53f9ca56`; assignment discovery returns `externalIntegrationReady=true`, `privateRuntimeAudience=produs-staging`, and `privateRuntimeAudienceMode=CONSUMER_ID`.
- Production-hosted runtime health, connector health, and managed vectorization runner health all return `UP`.
- Direct private-runtime auth smoke passed against `dep-53f9ca56` using issuer `produs-staging-backend` and audience `produs-staging`.
- Direct private-runtime `POST /api/chat/me/query-once` smoke passed against `dep-53f9ca56` with `mode=thinker`. Runtime selected a read-only ProdUS catalog action and returned a grounded answer.
- Source staging deployment `dep-7706fafb` remains healthy and untouched: runtime, connector, and vectorization runner return `UP`; latest staging release `rel-2d0807c7` is `APPLIED_VERIFIED`, verification `PASSED`, provisioning `ACTIVE` on `dtp-coolify-staging`.
- Runtime assignment discovery now requires the scoped `X-LOOMAI-ASSIGNMENT-API-KEY` header. Anonymous, wrong-key, other-consumer, and credentials requests were rejected; the correct key returned `200` only for `produs-staging/runtime-assignment`.

- 2026-06-01 update: LoomAI rediscovered the ProdUS staging MCP server, imported `produs.catalog.export`, published `mkp-action-produs-productization-read-mcp@0.1.1`, updated the live deployment install, published deployment version `ver-37ca6cc2`, and applied it through release `rel-68c38e15`.
- Live release verification `vrf-55a0bfc1` passed with `28 passed, 0 failed, 1 skipped`.
- Runtime action verification now shows 10 ProdUS actions and includes `produs_catalog_export`.
- Explicit runtime smoke passed with `mode=thinker` and `query-once`: “Use the full active service catalog export to explain what lifecycle services and testing-related packages ProdUS offers.” The runtime executed `produs_catalog_export` and returned a grounded answer.
- The broader smoke phrase “What lifecycle services and testing-related packages does ProdUS offer?” currently returns a valid answer through `produs_catalog_search`. If ProdUS requires that exact natural wording to force the export tool, the next step is action-selection metadata tuning; both tools remain read-only and owner-safe.
- Active runtime assignment discovery is live at `GET /api/public/consumers/produs-staging/runtime-assignment`. Use it from the ProdUS backend to discover the current runtime URL/endpoints instead of hardcoding the runtime base URL.
- Runtime `dep-7706fafb` accepts issuer `produs-staging-backend`.
- Runtime `dep-7706fafb` accepts the stable consumer audience `produs-staging`; it also accepts `dep-7706fafb` as a transition audience.
- Runtime assignment discovery now returns `privateRuntimeIssuer=produs-staging-backend`, `privateRuntimeAudience=produs-staging`, and `externalIntegrationReady=true`.
- ProdUS should sign private runtime assertions with `aud=produs-staging`. Keep the current assignment `deploymentId` only as audit/debug metadata.
- Deployment version `ver-e55296b1` / label `v11` was applied through release `rel-2d0807c7`; latest verification `vrf-7b9ffb3d` passed.
- Live smoke passed for `GET /api/chat/me/auth-context` and `POST /api/chat/me/query-once` using issuer `produs-staging-backend` and audience `produs-staging`.
- Runtime trusted backend key and HMAC private assertion signing key are configured in Coolify. Values are not stored in this document.
- Raw runtime and MCP secret material is captured in the LoomAI private handoff under `2026-05-20 ProdUS Direct Runtime Auth Material (Private)`. Transfer those values only through the agreed secure operations channel.
- Direct private runtime `GET /api/chat/me/auth-context` passed with a ProdUS-shaped `rpa1` assertion.
- Direct private runtime `POST /api/chat/me/query` should use the default curated runtime pack. Use `mode=thinker` for grounded/read-only productization analysis and `mode=executor` only for governed action execution. The older `support_assistant`/`support_deep` modes belonged to the support pack and should not be used by ProdUS after this transition.
- Direct private runtime `POST /api/chat/me/query-once` is the supported one-time answer endpoint for page helpers and smoke checks. It uses the same request/response contract as `/api/chat/me/query` and the same `chat:query` scope. Runtime treats `conversationId` as correlation only on this endpoint, skips persisted chat-memory loading, and skips conversation turn recording.
- Runtime default curated module was applied through deployment version `ver-b0c54807` and release `rel-37d07c7c`; the release finished `APPLIED_VERIFIED` with verification `PASSED` on staging target profile `dtp-coolify-staging`.
- Live default-mode smoke passed: `/api/chat/me/auth-context` accepted the ProdUS-shaped private assertion, `/api/chat/me/query` echoed `mode=thinker` and returned a grounded answer with a `rag-*` provider request id, `/api/chat/me/query-once` echoed `mode=thinker`, and `/api/chat/me/suggestions` returned four suggestions.
- Runtime code deployment `jz8ntc2b03kmllnpfn43esa7` deployed commit `22fa7fb48` for the implementation smoke; follow-up deployment `kpx28b02ryukztitqvem2399` deployed commit `969f87dfb` after the status documentation update. Live smoke verified `/query-once` returns `200` without creating a chat conversation (`GET /conversations/{queryOnceConversationId}` returned `404`), while normal `/query` still persists (`GET /conversations/{queryConversationId}` returned `200`).
- Direct private runtime `POST /api/chat/me/suggestions` passed with `content` and `maxSuggestions`.
- Negative auth smoke passed for missing runtime API key and wrong issuer.
- ProdUS backend `/health` and `/loomai/tool-allowlist` are reachable and tool allowlist reports `ready=true`.
- ProdUS MCP API-key auth is enabled on staging: unauthenticated `POST /mcp tools/list` returns `401 PRODUS_MCP_AUTH_REQUIRED`; authenticated discovery through LoomAI returns `ready=true` with 19 tools after adding `produs.catalog.export` and the bounded `produs.productization_project.create` action candidate.
- LoomAI Marketplace discovery for `produs-staging` returns `ready=true` through the managed MCP Gateway.
- Read-only ProdUS MCP action bundle `mkp-action-produs-productization-read-mcp@0.1.1` is published, installed on `dep-7706fafb`, and applied in version `v10`.
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

Required ProdUS changes after the default-pack transition:

- Keep the existing backend-mediated private runtime auth path. No browser runtime secret, Coolify token, Platform key, MCP key, or provider key should be added to ProdUS frontend code.
- Keep the existing LoomAI base URL and endpoint paths unless LoomAI explicitly rotates the deployment. The current staging runtime base URL remains `http://dep-7706fafb.46.224.145.148.sslip.io`.
- Use `mode=thinker` for read-only analysis, productization guidance, indexed-knowledge answers, page helpers, and project-creation analysis.
- Use `mode=executor` only for governed action execution flows where ProdUS has intentionally prepared the action UX, authorization, consent, idempotency, and audit path.
- Stop sending `support_assistant`, `support_deep`, `support_operator`, or `thinker_deep` for this deployment. Those are not the ProdUS default-pack contract.
- Update ProdUS runtime smoke tests and response assertions to expect `response.mode == "thinker"` for analysis calls.
- Keep `/api/chat/me/query` for persistent chat panels and `/api/chat/me/query-once` for one-time page helpers or one-time document analysis. Do not send a `persistConversation` flag.
- Continue sending all product/workspace/package/finding state under canonical `context`, after ProdUS backend authorizes every referenced id.
- Continue treating `providerRequestId` as the trace id to store on ProdUS evidence, analysis, and audit records.

Information LoomAI should share with ProdUS:

- Non-secret contract values in this document: deployment id, runtime base URL, supported modes, endpoint paths, issuer, audience, latest applied release, and active version.
- Secret values only through the agreed secure operations channel: runtime API key and HMAC assertion signing secret. These are not stored in this handover.
- No new secret rotation is required for the default-pack transition if ProdUS already has the current staging runtime API key and assertion signing secret configured.

## 0. Active Runtime Assignment Discovery

ProdUS should stop hardcoding the runtime URL in application code. The ProdUS backend can discover the currently assigned LoomAI runtime at startup and when the cached runtime fails health/query checks.

```http
GET https://loomai-platform-backend.46.225.162.106.sslip.io/api/public/consumers/produs-staging/runtime-assignment
X-LOOMAI-ASSIGNMENT-API-KEY: <backend-only-assignment-key>
```

Current non-secret response shape:

```json
{
  "consumerId": "produs-staging",
  "deploymentId": "dep-53f9ca56",
  "runtimeBaseUrl": "http://dep-53f9ca56.46.225.162.106.sslip.io",
  "runtimeAuthMode": "PRIVATE_RUNTIME_SIGNED_ASSERTION",
  "preferredIntegrationMode": "BACKEND_MEDIATED_PRIVATE_RUNTIME",
  "privateRuntimeIssuer": "produs-staging-backend",
  "privateRuntimeAudience": "produs-staging",
  "privateRuntimeAudienceMode": "CONSUMER_ID",
  "externalIntegrationReady": true,
  "assignmentRevision": "<changes-when-assignment-material-changes>",
  "cacheTtlSeconds": 300,
  "endpoints": {
    "chatQueryUrl": "http://dep-53f9ca56.46.225.162.106.sslip.io/api/chat/me/query",
    "queryOnceUrl": "http://dep-53f9ca56.46.225.162.106.sslip.io/api/chat/me/query-once",
    "suggestionsUrl": "http://dep-53f9ca56.46.225.162.106.sslip.io/api/chat/me/suggestions",
    "authContextUrl": "http://dep-53f9ca56.46.225.162.106.sslip.io/api/chat/me/auth-context",
    "healthUrl": "http://dep-53f9ca56.46.225.162.106.sslip.io/actuator/health"
  }
}
```

ProdUS implementation rule:

- Fetch this assignment from the ProdUS backend only. Never call it from browser code.
- Cache for at most `cacheTtlSeconds`; refresh immediately when `assignmentRevision` changes, runtime health fails, or chat calls return repeated connection failures.
- Use `endpoints.chatQueryUrl`, `endpoints.queryOnceUrl`, `endpoints.suggestionsUrl`, and `endpoints.authContextUrl` for direct runtime calls.
- Treat `deploymentId` as audit/debug metadata, not as the routing source of truth.
- Sign private assertions with `aud=produs-staging`, using the returned `privateRuntimeAudience`.
- Keep the assignment `deploymentId` in the assertion payload for audit/debug metadata, but do not use it as the private-runtime audience in new ProdUS code.
- `LOOMAI_ASSERTION_DEPLOYMENT_ID` is not required when `LOOMAI_ASSIGNMENT_URL` is configured and reachable. The backend derives `deploymentId` from assignment discovery. The env var exists only as a fallback for local/break-glass direct-runtime diagnostics without assignment discovery.

ProdUS implementation status:

- Backend code now supports `LOOMAI_ASSIGNMENT_URL` and caches the assignment response by `cacheTtlSeconds`.
- Backend assignment discovery supports `LOOMAI_ASSIGNMENT_API_KEY` and `LOOMAI_ASSIGNMENT_API_KEY_HEADER_NAME`; if omitted it falls back to `LOOMAI_API_KEY`.
- Backend direct runtime calls resolve assignment endpoint URLs before falling back to `LOOMAI_BASE_URL`.
- Backend assertions now keep `aud` and `deploymentId` separate: `aud=produs-staging`, `deploymentId` comes from assignment discovery.
- Safe knowledge sync trace/auth context also uses the resolved assignment deployment/customer/issuer values.

## 0A. Production Coolify-Hosted Staging Runtime

This is the shift-left environment on the LoomAI production server. It was created by sealed Platform deployment export/import, not by manual runtime recreation.

Use this environment when ProdUS wants staging integration traffic to exercise production Coolify infrastructure while still keeping the ProdUS integration posture as staging.

```http
GET https://loomai-platform-backend.46.225.162.106.sslip.io/api/public/consumers/produs-staging/runtime-assignment
X-LOOMAI-ASSIGNMENT-API-KEY: <backend-only-assignment-key>
```

Current non-secret response shape:

```json
{
  "consumerId": "produs-staging",
  "deploymentId": "dep-53f9ca56",
  "runtimeBaseUrl": "http://dep-53f9ca56.46.225.162.106.sslip.io",
  "runtimeAuthMode": "PRIVATE_RUNTIME_SIGNED_ASSERTION",
  "preferredIntegrationMode": "BACKEND_MEDIATED_PRIVATE_RUNTIME",
  "privateRuntimeIssuer": "produs-staging-backend",
  "privateRuntimeAudience": "produs-staging",
  "privateRuntimeAudienceMode": "CONSUMER_ID",
  "externalIntegrationReady": true,
  "cacheTtlSeconds": 300,
  "endpoints": {
    "chatQueryUrl": "http://dep-53f9ca56.46.225.162.106.sslip.io/api/chat/me/query",
    "queryOnceUrl": "http://dep-53f9ca56.46.225.162.106.sslip.io/api/chat/me/query-once",
    "suggestionsUrl": "http://dep-53f9ca56.46.225.162.106.sslip.io/api/chat/me/suggestions",
    "conversationsUrl": "http://dep-53f9ca56.46.225.162.106.sslip.io/api/chat/me/conversations",
    "authContextUrl": "http://dep-53f9ca56.46.225.162.106.sslip.io/api/chat/me/auth-context",
    "healthUrl": "http://dep-53f9ca56.46.225.162.106.sslip.io/actuator/health"
  }
}
```

ProdUS backend configuration for this environment:

```bash
LOOMAI_ENABLED=true
LOOMAI_INTEGRATION_MODE=BACKEND_MEDIATED_PRIVATE_RUNTIME
LOOMAI_AUTH_MODE=PRIVATE_RUNTIME_ASSERTION
LOOMAI_ASSIGNMENT_URL=https://loomai-platform-backend.46.225.162.106.sslip.io/api/public/consumers/produs-staging/runtime-assignment
LOOMAI_ASSIGNMENT_API_KEY_HEADER_NAME=X-LOOMAI-ASSIGNMENT-API-KEY
LOOMAI_ASSIGNMENT_API_KEY=<provided-through-secure-channel>
LOOMAI_ASSERTION_ISSUER=produs-staging-backend
LOOMAI_ASSERTION_AUDIENCE=produs-staging
LOOMAI_ASSISTANT_QUERY_PATH=/api/chat/me/query
LOOMAI_ASSISTANT_QUERY_ONCE_PATH=/api/chat/me/query-once
LOOMAI_ASSISTANT_SUGGESTIONS_PATH=/api/chat/me/suggestions
```

Rules for ProdUS:

- Fetch the assignment from the ProdUS backend at startup and cache it for at most `cacheTtlSeconds`.
- Refetch assignment when runtime health fails or direct runtime calls repeatedly fail with connection-level errors.
- Do not route every chat request through Platform. Platform is used for assignment discovery, not as the per-request chat proxy.
- Sign runtime assertions with `aud=produs-staging`; keep the assignment `deploymentId` only as audit/debug metadata after assignment discovery resolves it.
- Do not expose the Platform assignment key, runtime API key, assertion signing secret, MCP key, provider keys, or Coolify tokens to browser code.
- Keep using `mode=thinker` for read-only analysis and `mode=executor` only for governed action execution.
- Use `/query-once` for one-time helpers and analysis that must not create chat history. Use `/query` only for persistent chat panels.

## 0B. Chat UI Integration Notes

This section restores the UI integration notes from the older LoomAI/ProdUS rollout context. The current supported posture is **backend-mediated private runtime**: the ProdUS browser talks only to ProdUS backend routes, and the ProdUS backend talks to the assigned LoomAI runtime.

Do not expose LoomAI assignment keys, runtime API keys, assertion signing secrets, MCP keys, provider keys, Platform keys, or Coolify tokens to browser code.

### Browser-To-ProdUS Routes

ProdUS frontend should call only ProdUS-owned backend routes:

```text
POST /api/ai/assistant/query
POST /api/ai/assistant/query-once
POST /api/ai/assistant/suggestions
GET  /api/ai/assistant/auth-context
```

The frontend may use relative paths through the existing frontend API client, for example `/ai/assistant/query`, when `NEXT_PUBLIC_API_URL` already points at the ProdUS API base.

Use:

- `/api/ai/assistant/query` for persistent chat panels, docks, and product/workspace conversations.
- `/api/ai/assistant/query-once` for one-time page helpers, product analysis, document analysis, and explanation cards that must not create chat history.
- `/api/ai/assistant/suggestions` for prompt suggestions.
- `/api/ai/assistant/auth-context` for integration health/auth posture display.

### Widget / Max Mode Shell

The current ProdUS UI can load the LoomAI Max Mode widget through a ProdUS-hosted proxy:

```text
GET /api/loomai/max-mode-widget
```

Frontend configuration:

```text
NEXT_PUBLIC_API_URL=<ProdUS API base ending in /api>
NEXT_PUBLIC_LOOMAI_MAX_MODE_WIDGET_URL=<optional override; default /api/loomai/max-mode-widget>
```

The widget should be initialized in backend-mediated mode:

```js
MaxMode.init({
  integrationMode: "backend-mediated-private-runtime",
  apiConfig: {
    chatBaseUrl: "<ProdUS API base>",
    fetchCredentials: "include",
    runtimeRoutes: {
      chatQueryUrl: "/ai/assistant/query",
      suggestionsUrl: "/ai/assistant/suggestions",
      authContextUrl: "/ai/assistant/auth-context"
    },
    runtimeAuth: {
      probeAuthContextOnOpen: false
    }
  },
  features: {
    cart: false,
    debug: false,
    conversations: false,
    quickActions: false
  }
});
```

The widget is a UI shell only. It must not know the LoomAI runtime URL, assignment endpoint, assignment key, runtime API key, or assertion signing secret.

### Required ProdUS UI Surfaces

ProdUS should treat the LoomAI UI integration as a small set of backend-mediated surfaces. Every surface calls ProdUS backend routes only; no surface calls the LoomAI runtime, Platform assignment endpoint, MCP endpoint, or vector store directly from the browser.

1. Always-on product workspace fixed chat input.

   Use `OwnerWorkspaceAiChatDock` to mount both the hidden Max Mode shell and the visible `OwnerWorkspaceFixedChatDock`.

   Required behavior:

   - Render a fixed bottom-right chat input on product workspace pages when a `product.id` is available.
   - Start collapsed/minimized; expand when the owner clicks the dock/header, submits a prompt, or chooses a starter prompt.
   - Use `conversationId=product-workspace-<productId>`.
   - Use `mode=thinker` and `position=product_workspace_fixed_chat`.
   - Send to `POST /api/ai/assistant/query` through the ProdUS API client, normally as relative path `/ai/assistant/query`.
   - Send page/product/workspace context under `context`, including product id/name/url, workspace area, launch status, scanner totals, and a read-only AI policy.
   - Keep this surface read-only: it may explain, recommend, summarize, and inspect context, but must not create, update, execute, prepare, or call app actions.
   - Prefer `safeSummary || answer` for rendered copy.
   - Show structured failure/fallback states from `provider`, `mode`, `success`, `fallbackReason`, `errorCode`, and `providerRequestId`; do not parse English text to detect failures.

   The fixed dock's "open full chat" control must call the Max Mode shell, not a separate runtime path. In the current code this is `onOpenFullChat={openWidgetAssistant}`.

2. Full Max Mode chat for the product workspace.

   Use `LoomAIMaxModeAssistant` as the full chat shell behind the fixed dock.

   Required behavior:

   - Initialize with `integrationMode=backend-mediated-private-runtime`.
   - Use `showLauncher=false` when paired with the fixed workspace dock, so the fixed dock is the always-on visible entry point.
   - Reuse the same `conversationId`, `mode=thinker`, `position=product_workspace_fixed_chat`, `requestContext`, and starter prompts as the fixed dock.
   - Load the widget through `GET /api/loomai/max-mode-widget`.
   - Use `chatBaseUrl=<ProdUS API base>`, `fetchCredentials=include`, and the ProdUS-owned routes `/ai/assistant/query`, `/ai/assistant/suggestions`, and `/ai/assistant/auth-context`.
   - Keep widget features that imply external mutation or unrelated commerce behavior disabled unless ProdUS explicitly implements the governed backend path for them.

3. Product intake / analysis chat panel.

   Use `ProductAnalysisChatPanel` for richer analysis flows while onboarding or analyzing a product.

   Required behavior:

   - Use `LoomAIMaxModeAssistant`.
   - Use `mode=thinker` and `position=product_intake_analysis`.
   - Send analysis/product context through the same backend-mediated route set.
   - Treat this as an analysis and explanation surface, not as an execution surface.

4. One-time page helper cards.

   Use `PlatformAssistantCard` and `StudioAssistantCard` for non-persistent helper answers.

   Required behavior:

   - Send to `POST /api/ai/assistant/query-once` through the ProdUS API client, normally as `/ai/assistant/query-once`.
   - Use `mode=thinker` and `position=page-helper`.
   - Do not create or depend on persistent chat history.
   - Use for page explanations, reviews, guidance, and short analysis cards.

5. Suggestions.

   Use `POST /api/ai/assistant/suggestions` for prompt suggestions.

   Required behavior:

   - Send `content` and `maxSuggestions` plus safe page context where needed.
   - Render returned suggestions as prompts only. Selecting a suggestion should still submit through the correct surface route, usually `/query` for persistent chat or `/query-once` for helper cards.

6. Optional generic Max Mode companion dock.

   LoomAI's generic full-width bottom chat input is named `CompanionDock` in the Max Mode widget source. This is different from ProdUS's current custom `OwnerWorkspaceFixedChatDock`.

   If ProdUS later wants the generic LoomAI widget to render the always-on input itself instead of the custom bottom-right dock, initialize `LoomAIMaxModeAssistant` with `companionDock=true` and `showLauncher=false`.

   Expected behavior:

   - The generic `CompanionDock` renders fixed at the bottom center of the page and spans nearly the full viewport width.
   - It starts minimized.
   - It expands on input focus or owner interaction.
   - The `MAX` control opens full Max Mode.
   - It uses the same backend-mediated route set and request context rules above.
   - It should remain visually lightweight and should not block the product workspace page.

### UI Surface Checklist

ProdUS has enough integration information in this handover when each of these is wired:

- Product workspace always-on fixed input: `OwnerWorkspaceAiChatDock` + `OwnerWorkspaceFixedChatDock`.
- Full workspace Max Mode: hidden `LoomAIMaxModeAssistant` opened by the fixed dock.
- Optional LoomAI-provided full-width bottom input: `CompanionDock`, enabled through `companionDock=true` and `showLauncher=false`.
- Product analysis Max Mode panel: `ProductAnalysisChatPanel`.
- One-time helper cards: `PlatformAssistantCard` and `StudioAssistantCard`.
- Suggestions route: `/api/ai/assistant/suggestions`.
- Widget proxy: `/api/loomai/max-mode-widget`.
- Backend runtime proxy/signing: `LoomAIIntegrationController` and `LoomAIIntegrationService`.

### Canonical Chat Payload

ProdUS frontend-to-backend assistant requests should use the canonical LoomAI chat shape:

```json
{
  "conversationId": "product-workspace-<product-id>",
  "query": "What should I do next?",
  "mode": "thinker",
  "position": "product_workspace_fixed_chat",
  "context": {
    "pageType": "product-workspace-fixed-chat",
    "productId": "<uuid>",
    "workspaceArea": "overview",
    "aiPolicy": "Answer from read-only ProdUS context. Do not create or mutate records from chat."
  }
}
```

Rules:

- Use `mode=thinker` for read-only analysis, AI opportunity guidance, service/package explanation, scanner/evidence explanation, and owner decision support.
- Use `mode=executor` only for deliberately governed action execution flows with consent, authorization, idempotency, and audit.
- Put page/product/workspace/package/finding/evidence context under `context`.
- Do not send top-level `userId`, `ownerId`, `tenantId`, raw Supabase session values, bearer tokens, runtime secrets, MCP keys, raw scanner logs, private artifact URLs, or raw temporary file URLs from browser context.
- ProdUS backend must authorize every referenced product/package/workspace/milestone/finding/evidence id before forwarding summarized context to LoomAI.
- Backend may convert browser conversation ids into subject-scoped provider conversation ids before calling LoomAI.

### Canonical Chat Response For UI Rendering

ProdUS UI should consume the flat response fields:

```json
{
  "provider": "LOOMAI",
  "mode": "thinker",
  "success": true,
  "type": "INFORMATION_PROVIDED",
  "answer": "Safe answer",
  "safeSummary": "Safe answer",
  "conversationId": "product-workspace-<product-id>",
  "confidence": 0.82,
  "sources": [],
  "documents": [],
  "actions": [],
  "suggestions": [],
  "metadata": {},
  "fallbackReason": null,
  "errorCode": null,
  "providerRequestId": "rag-..."
}
```

Rendering rules:

- Prefer `answer` for the visible assistant message; use `safeSummary` as equivalent/fallback safe copy.
- Store `providerRequestId` for audit/debug correlation.
- Treat `provider != LOOMAI`, `mode == FALLBACK`, `success == false`, `fallbackReason`, or `errorCode` as structured UI states.
- Do not parse English answer text to detect auth, access, action, provider, or fallback failures.
- If an action is returned, render it as a proposed/inspected action unless the surface has a reviewed confirmed-action UX. Chat surfaces must not silently execute mutations.

### Current ProdUS Code References

Current ProdUS implementation points:

```text
frontend/src/features/platform/loomAIMaxModeWidgetRuntime.ts
frontend/src/features/platform/LoomAIMaxModeAssistant.tsx
frontend/src/features/platform/OwnerWorkspaceAiChatDock.tsx
frontend/src/features/platform/OwnerWorkspaceFixedChatDock.tsx
frontend/src/features/platform/ProductAnalysisChatPanel.tsx
frontend/src/features/platform/PlatformAssistantCard.tsx
frontend/src/features/platform/StudioAssistantCard.tsx
frontend/src/app/api/loomai/max-mode-widget/route.ts
backend/src/main/java/com/produs/ai/LoomAIIntegrationController.java
backend/src/main/java/com/produs/ai/LoomAIIntegrationService.java
```

LoomAI widget source references for the optional full-width bottom input:

```text
max-mode-widget/src/components/CompanionDock.tsx
max-mode-widget/src/entries/WidgetShell.tsx
```

The key integration rule remains: **UI calls ProdUS backend only; ProdUS backend discovers assignment, signs private runtime assertions, and calls LoomAI runtime.**

Live verification performed by LoomAI on 2026-06-02:

- Platform production backend health: `UP`.
- Platform production backend deployed commit `b067fe3033895eebf82c2edd60b043165c7b869e` with scoped assignment-key support.
- Imported runtime `dep-53f9ca56` health: `UP`.
- Imported connector `dep-53f9ca56-connector` health: `UP`.
- Imported vectorization runner `dep-53f9ca56-vectorization-runner` health: `UP`.
- Runtime assignment discovery now requires `X-LOOMAI-ASSIGNMENT-API-KEY`; anonymous, wrong-key, other-consumer, and credentials requests were rejected.
- Scoped assignment key returned `200` only for `produs-staging/runtime-assignment`.
- `GET /api/chat/me/auth-context` accepted a ProdUS private assertion with `iss=produs-staging-backend` and `aud=produs-staging`.
- `POST /api/chat/me/query-once` returned success with `mode=thinker`; runtime selected the read-only ProdUS catalog search action and returned grounded ProdUS lifecycle/package information.

## 1. Live Staging Deployment

| Field                      | Value                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Platform deployment id     | `dep-7706fafb`                                                                                                 |
| Platform deployment name   | `ProdUS AI Enablement Staging`                                                                                 |
| Environment                | `staging`                                                                                                      |
| Latest applied release     | `rel-68c38e15`                                                                                                 |
| Runtime template           | `dev-openai-qdrant`                                                                                            |
| Runtime curated module     | `default`                                                                                                      |
| Runtime supported modes    | `thinker` for analysis/read-only help, `executor` for governed actions                                         |
| Template plugin            | Initially bootstrapped from `mkp-template-support-desk-shell`; runtime behavior is now controlled by `default` |
| Installed action plugins   | `mkp-action-produs-productization-read-mcp@0.1.1`, `mkp-action-produs-productization-project-create-mcp@0.1.1` |
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
AI_FABRIC_RUNTIME_AUTH_ACCEPTED_AUDIENCES=<existing-audiences>,produs-staging,dep-7706fafb
```

Rules:

- Preserve any existing accepted issuers/audiences used by Platform operator smoke tests.
- Do not add `platform-consumer-bridge` as an accepted issuer for this ProdUS runtime unless LoomAI intentionally moves ProdUS back to the Platform bridge path. Assignment discovery chooses the preferred issuer from runtime configuration, and the ProdUS direct path should report `produs-staging-backend`.
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
LOOMAI_ASSIGNMENT_URL=https://loomai-platform-backend.46.225.162.106.sslip.io/api/public/consumers/produs-staging/runtime-assignment
LOOMAI_ASSIGNMENT_API_KEY=<backend-only assignment key>
LOOMAI_ASSIGNMENT_API_KEY_HEADER_NAME=X-LOOMAI-ASSIGNMENT-API-KEY
LOOMAI_BASE_URL=<fallback-only: use assignment endpoints first>
LOOMAI_RUNTIME_API_KEY=<same value accepted by X-AIFABRIC-RUNTIME-API-KEY>
LOOMAI_ASSERTION_ISSUER=produs-staging-backend
LOOMAI_ASSERTION_AUDIENCE=produs-staging
LOOMAI_ASSERTION_SIGNING_ALGORITHM=HS256
LOOMAI_ASSERTION_SIGNING_SECRET=<same HMAC signing secret configured on runtime>
LOOMAI_TIMEOUT_MS=8000
LOOMAI_ASSISTANT_QUERY_PATH=/api/chat/me/query
LOOMAI_ASSISTANT_QUERY_ONCE_PATH=/api/chat/me/query-once
LOOMAI_ASSISTANT_SUGGESTIONS_PATH=/api/chat/me/suggestions
LOOMAI_AUTH_CONTEXT_PATH=/api/chat/me/auth-context
```

Do not set these in frontend env. They are backend-only. Prefer the assignment endpoint over `LOOMAI_BASE_URL`; keep a fallback base URL only for break-glass local diagnostics. `LOOMAI_ASSERTION_DEPLOYMENT_ID=dep-7706fafb` is optional and only needed if assignment discovery is disabled.

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
  "aud": "produs-staging",
  "exp": "2026-05-19T21:30:00Z",
  "scopes": ["chat:query", "chat:suggestions", "chat:conversations"]
}
```

Rules:

- `iss` must be in runtime `AI_FABRIC_RUNTIME_AUTH_ACCEPTED_ISSUERS`.
- `aud` must be `produs-staging` for new ProdUS direct-runtime calls and must match runtime `AI_FABRIC_RUNTIME_AUTH_ACCEPTED_AUDIENCES`.
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
  "mode": "thinker",
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
  "mode": "thinker",
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

ProdUS project creation uses a two-step LoomAI flow. Step 1 is runtime analysis through `POST /api/chat/me/query-once` with `mode=thinker`, `position=product_intake_analysis`, and a neutral owner-intake output schema. `thinker` is the default-pack analysis mode and does not execute mutating actions; the project-creation analysis response must not enter the runtime action planner. Step 2 is project creation through a governed runtime action named `produs.productization_project.create` and should use the action/execution contract only after ProdUS has minted an owner-approved creation intent. This is scoped to project creation only; it does not create packages, workspaces, team selections, invitations, or participants.

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
  "mode": "thinker",
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
    "mode": "thinker",
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

### LoomAI UI Integration Capability

LoomAI now has two relevant UI layers:

1. A reusable `MaxMode` widget bundle.
2. A Shopify-specific storefront shell that wraps that bundle with Shopify page, cart, customer-account, and storefront event context.

ProdUS should use the reusable `MaxMode` bundle through a thin ProdUS shell/wrapper. Do not reuse the Shopify shell directly. The Shopify shell is intentionally coupled to Shopify storefront behavior, while the underlying widget can be mounted by any product UI that provides the standard backend-mediated chat routes and safe page context.

Supported ProdUS UI surfaces:

- Full Max Mode workspace: a large overlay for productization project analysis, package planning, scanner/finding review, milestone readiness, and guided implementation decisions.
- Fixed page assistant: a floating launcher or fixed chat box attached to the current ProdUS page, similar to the Shopify storefront assistant but powered by ProdUS context.
- Inline one-time help: page buttons or helper panels that call a non-persistent query endpoint for suggestions, explanations, or validation.
- Evidence/source panel: optional right-panel document/source cards when LoomAI returns safe `sources`, `documents`, `attachments`, or `documentUsage` evidence in the canonical response.

Plugin-style usage model:

- Treat the reusable `MaxMode` bundle as a ProdUS frontend plugin/module, not as a Shopify app extension.
- The plugin can be mounted on any ProdUS page by loading the bundle and calling `window.MaxMode.init(...)`.
- The same plugin supports two primary UI modes:
  - Max Mode: full shopping/workspace-style overlay opened with `window.MaxMode.open()` or a launcher button.
  - Fixed chat box: page-level assistant/dock enabled through launcher and host dock configuration.
- ProdUS owns the shell adapter: page context collection, auth/session handling, route URLs, feature flags, theme, and which pages mount the plugin.
- LoomAI owns the generic widget contract: canonical request/response rendering, attachments, source cards, debug display, action evidence, and conversation controls.
- This is separate from Marketplace ACTION/DATA plugins. It is a frontend integration plugin/module that talks to ProdUS backend routes.

Using the deployed widget script:

- Current LoomAI source artifact: `Platfrom/partner-ui/public/max-mode-widget.iife.js`.
- The Shopify bridge also carries a copied widget bundle, but ProdUS should not load Shopify bridge assets because those are packaged with Shopify-specific shell behavior.
- For staging smoke, ProdUS may load the hosted LoomAI Partner UI static asset:

```html
<script src="https://loomai-partner-ui.46.224.145.148.sslip.io/max-mode-widget.iife.js?v=2026-04-14-opaque-shell-v1"></script>
```

- For production, prefer a pinned/self-hosted copy inside the ProdUS frontend static assets, for example:

```text
frontend/public/vendor/loomai/max-mode-widget.iife.js
```

- Do not load an unpinned `latest` script in production. Pin by version query or release hash and update intentionally.
- If ProdUS uses a strict CSP, allow the script source only for the pinned asset origin and allow `connect-src` only to the ProdUS backend. Browser traffic still goes to ProdUS, not to LoomAI runtime.
- On sign-out, tenant/workspace switch, or app teardown, call `window.MaxMode.destroy()` before reinitializing for a different user context.

Minimal dynamic loader:

```ts
const LOOMAI_MAX_MODE_SCRIPT_ID = "loomai-max-mode-widget";

export function loadLoomAIMaxModeWidget(
  src = "/vendor/loomai/max-mode-widget.iife.js?v=2026-04-14-opaque-shell-v1"
): Promise<void> {
  if (window.MaxMode) {
    return Promise.resolve();
  }
  const existing = document.getElementById(LOOMAI_MAX_MODE_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load LoomAI widget.")), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = LOOMAI_MAX_MODE_SCRIPT_ID;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load LoomAI widget."));
    document.head.appendChild(script);
  });
}
```

Mode selection:

- Full Max Mode overlay: use `launcher: true`, omit `host.companionDock` or set it to `false`, and open with `window.MaxMode.open()` when the user clicks a page CTA.
- Fixed chat box / page dock: set `host.companionDock: true`, keep `launcher: true` if ProdUS also wants a floating button, and set `position: "bottom-right"` or `"bottom-left"`.
- Inline one-time helper: either call ProdUS `/api/ai/assistant/query-once` directly from the page UI, or initialize a page-specific widget instance with `chatQueryUrl` pointing to `/query-once` and `features.conversations: false`.

The same loaded script powers all three modes; the difference is the `window.MaxMode.init(...)` config and which ProdUS backend route the shell points at.

Required ProdUS widget configuration checklist:

| Config area | ProdUS value / decision |
| ----------- | ------------------------ |
| Widget script source | Staging may use `https://loomai-partner-ui.46.224.145.148.sslip.io/max-mode-widget.iife.js?v=2026-04-14-opaque-shell-v1`; production should use a pinned self-hosted copy. |
| Widget global | `window.MaxMode` exposed by the script. |
| Init method | `window.MaxMode.init(config)` after the script is loaded. |
| Teardown method | `window.MaxMode.destroy()` on sign-out, tenant switch, workspace switch, or app unmount. |
| Integration mode | `backend-mediated-private-runtime`. |
| Browser auth | Normal ProdUS app session only. Prefer HttpOnly cookie plus `fetchCredentials: "include"`. |
| Runtime auth | Never in browser. ProdUS backend signs private-runtime assertions. |
| Chat base URL | `/api/ai/assistant` or the ProdUS-owned equivalent. |
| Persistent chat route | `POST /api/ai/assistant/query`. |
| One-time helper route | `POST /api/ai/assistant/query-once`. |
| Suggestions route | `POST /api/ai/assistant/suggestions`. |
| Auth/status route | `GET /api/ai/assistant/auth-context` or a ProdUS status wrapper. |
| Conversation routes | Enable only when persistent chat is desired: `GET /api/ai/assistant/conversations` and `GET /api/ai/assistant/conversations/{conversationId}`. |
| Max Mode overlay | `launcher: true`, `host.companionDock: false`, open with `window.MaxMode.open()`. |
| Fixed chat box | `host.companionDock: true`, `position: "bottom-right"` or `"bottom-left"`. |
| Inline query-once UI | Prefer a direct ProdUS page component calling `/query-once`; use widget only when a chat-like shell is desired. |
| Cart feature | `features.cart: false` unless ProdUS intentionally models a cart-like workflow. |
| Debug feature | `features.debug: false` for normal users; enable only for admin/operator surfaces. |
| Conversations feature | `features.conversations: true` for persistent panels, `false` for query-once helpers. |
| Quick actions | `features.quickActions: true` only when ProdUS provides safe prompt/action starters. |
| Assistant label | ProdUS-owned copy, for example `ProdUS AI`. |
| Theme | ProdUS-owned theme values: `primaryColor`, `borderRadius`, optional `darkMode`, optional `fontFamily`. |
| Request context provider | ProdUS-owned function returning safe page state and object IDs only. |

Recommended `requestContextProvider` output shape:

```json
{
  "pageType": "owner-product-workspace",
  "productId": "prod-123",
  "workspaceId": "ws-456",
  "packageId": "pkg-789",
  "milestoneId": "ms-001",
  "findingId": "finding-002",
  "scannerRunId": "scan-003",
  "selectedAttachmentIds": ["attachment-004"]
}
```

ProdUS backend must authorize every ID before it forwards context to LoomAI. The frontend must not send raw scanner logs, private object storage URLs, tokens, credentials, repository content, private messages, or unbounded object JSON.

ProdUS backend route mapping:

| ProdUS browser route | Backend action | LoomAI runtime path |
| -------------------- | -------------- | ------------------- |
| `POST /api/ai/assistant/query` | Authorize context, sign assertion, call runtime persistent chat. | `LOOMAI_ASSISTANT_QUERY_PATH=/api/chat/me/query` |
| `POST /api/ai/assistant/query-once` | Authorize context, sign assertion, call runtime one-time query. | `LOOMAI_ASSISTANT_QUERY_ONCE_PATH=/api/chat/me/query-once` |
| `POST /api/ai/assistant/suggestions` | Authorize context, sign assertion, call runtime suggestions. | `LOOMAI_ASSISTANT_SUGGESTIONS_PATH=/api/chat/me/suggestions` |
| `GET /api/ai/assistant/auth-context` | Return ProdUS-safe status and/or probe runtime auth. | `LOOMAI_AUTH_CONTEXT_PATH=/api/chat/me/auth-context` |
| `GET /api/ai/assistant/conversations*` | Optional persistent-history wrapper. | Runtime conversation routes only if ProdUS enables persistent chat. |

Canonical response fields ProdUS should preserve for the widget:

- `success`
- `type`
- `answer`
- `safeSummary`
- `conversationId`
- `mode`
- `position`
- `sources`
- `ragResponse`
- `actions`
- `suggestions`
- `fallbackReason`
- `providerRequestId`
- `metadata`
- `documentUsage`

ProdUS-owned implementation decisions still required:

- Where to host the pinned widget bundle in production.
- Which pages mount Max Mode, fixed chat box, or direct query-once helpers.
- Whether conversations are enabled for each page.
- Which roles can see debug evidence.
- Final CSP `script-src` and `connect-src` entries.
- Final theme and assistant copy.

Recommended posture:

- Browser calls ProdUS backend only.
- ProdUS backend calls LoomAI runtime with private-runtime assertions.
- ProdUS frontend sends only page type, stable object IDs, and user intent.
- ProdUS backend authorizes those IDs and enriches them into compact safe summaries before sending to LoomAI.
- ProdUS frontend never receives LoomAI runtime API keys, Platform keys, MCP credentials, Coolify credentials, object storage credentials, assertion signing keys, or raw private URLs.

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

### Widget Contract For ProdUS

ProdUS should expose its own backend routes and map them to the LoomAI canonical runtime contract. Suggested browser-facing routes:

```text
POST /api/ai/assistant/query
POST /api/ai/assistant/query-once
POST /api/ai/assistant/suggestions
GET  /api/ai/assistant/auth-context
GET  /api/ai/assistant/shell-config
GET  /api/ai/assistant/conversations
GET  /api/ai/assistant/conversations/{conversationId}
```

Auth path to use:

- Browser to ProdUS: use the normal ProdUS authenticated app session. Prefer HttpOnly session cookies with `fetchCredentials: "include"`. A ProdUS frontend session token is acceptable only if it is already part of the ProdUS app auth model.
- ProdUS backend to LoomAI runtime: use `BACKEND_MEDIATED_PRIVATE_RUNTIME` with `PRIVATE_RUNTIME_ASSERTION`.
- Current staging assertion format: `rpa1` HMAC signed by the ProdUS backend and verified by the LoomAI runtime.
- Future production hardening path: migrate to asymmetric private-runtime assertions after LoomAI's runtime key registry is enabled.
- Do not use `PUBLIC_ANONYMOUS`, public browser runtime auth, Shopify storefront auth, Partner Portal max-widget auth paths, or direct browser-to-runtime calls for ProdUS production surfaces.
- Platform-mediated calls are an operator fallback/control-plane path, not the preferred ProdUS application path.

Persistent chat panels should use `/query` and conversation routes. Inline suggestions and one-shot page helpers should use `/query-once` and must not create or update stored chat turns.

The canonical request sent from ProdUS backend to LoomAI should remain:

```json
{
  "query": "Summarize this scanner finding and propose the next step.",
  "conversationId": "produs-conv-123",
  "mode": "thinker",
  "position": "owner-product-workspace",
  "context": {
    "pageType": "owner-product-workspace",
    "productId": "prod-123",
    "workspaceId": "ws-456",
    "findingId": "finding-789"
  }
}
```

ProdUS may include `attachments` when the user explicitly attaches safe objects or short-lived document URLs. Short-lived URLs must be passed as transient provider file inputs, not copied into prompt text, not indexed, and not retained in chat history or application logs.

### MaxMode Initialization Sketch

ProdUS can mount the reusable widget from its frontend bundle or an approved static asset copy. The exact asset path can be changed by ProdUS, but the integration shape should stay backend-mediated:

```html
<script src="/assets/max-mode-widget.iife.js"></script>
<script>
  window.MaxMode.init({
    integrationMode: "backend-mediated-private-runtime",
    launcher: true,
    position: "bottom-right",
    apiConfig: {
      chatBaseUrl: "/api/ai/assistant",
      fetchCredentials: "include",
      probeShellConfigOnOpen: false,
      runtimeRoutes: {
        chatQueryUrl: "/api/ai/assistant/query",
        suggestionsUrl: "/api/ai/assistant/suggestions",
        authContextUrl: "/api/ai/assistant/auth-context",
        conversationsUrl: "/api/ai/assistant/conversations",
        conversationItemUrlTemplate: "/api/ai/assistant/conversations/{conversationId}"
      },
      runtimeAuth: {
        probeAuthContextOnOpen: false
      }
    },
    features: {
      cart: false,
      debug: false,
      conversations: true,
      quickActions: true
    },
    theme: {
      primaryColor: "#6366f1",
      borderRadius: "10px"
    },
    host: {
      experience: "produs-productization-workspace",
      assistantLabel: "ProdUS AI",
      welcomeMessage: "Ask about productization, scanner findings, packages, milestones, or launch readiness.",
      requestContext: {
        pageType: "owner-product-workspace"
      },
      requestContextProvider: function () {
        return window.ProdUSAIContext && window.ProdUSAIContext.current
          ? window.ProdUSAIContext.current()
          : {};
      }
    }
  });
</script>
```

If ProdUS uses HttpOnly cookies, keep `fetchCredentials: "include"` and do not send an `Authorization` header from the browser. If ProdUS uses a frontend session token, add only a ProdUS session token header to calls to ProdUS backend; never expose LoomAI runtime secrets.

### Source And Debug Display

The widget can show retrieved documents, source cards, attached objects, and action evidence only if ProdUS preserves the canonical response fields from LoomAI.

ProdUS should render:

- `answer` or normalized display text for the user-visible response.
- `sources` / `documents` / `attachments` as safe evidence cards.
- `documentUsage` for temporary-file analysis evidence.
- `actions` / `actionEvidence` for action execution outcomes.
- `errorCode`, `reason`, and `retryable` for machine-controlled UI states.

ProdUS should not parse English answer text to infer success or failure. Debug panels should be enabled only for admin/operator contexts and should show sanitized request, response, retrieval, and action evidence without secrets or raw private URLs.

### What Is Generalized Today

Already reusable:

- The `window.MaxMode` widget API with `init`, `open`, `close`, `toggle`, `sendMessage`, `attachItem`, `attachProduct`, and `destroy`.
- Fixed launcher / overlay behavior.
- Theme options such as primary color, dark mode, and border radius.
- Backend-mediated route configuration.
- Attachments and source/evidence display when the backend response includes canonical fields.
- Persistent conversation mode and one-time query mode when ProdUS provides separate routes.

Not reusable as-is:

- Shopify cart/customer-account context collection.
- Shopify page-mode mappings.
- Shopify storefront bootstrap.
- Shopify customer OAuth prompts.
- Shopify-specific product/card actions.

ProdUS should implement its own small adapter for current page state, selected productization objects, package/workspace/milestone/finding IDs, and safe attachments.

### UI Acceptance Checklist

- Widget loads without Shopify globals.
- Browser network calls go only to ProdUS `/api/ai/assistant/*` routes.
- Persistent panels use `/query`; inline one-shot helpers use `/query-once`.
- ProdUS backend authorizes every object ID before forwarding context to LoomAI.
- Normal users do not see LoomAI, MCP, vector, runtime, provider, or Coolify terminology.
- Admin/operator debug mode shows sanitized retrieval/action evidence only.
- Source/document cards appear when LoomAI returns safe canonical evidence.
- The UI degrades to ProdUS fallback when LoomAI is disabled or unreachable.

## 15. Release Gates For Calling This Complete

Do not mark ProdUS LoomAI integration complete until these pass:

- ProdUS backend can call `/api/chat/me/auth-context` with private-runtime assertion and receives expected verified context.
- ProdUS backend can query LoomAI through the direct private runtime adapter.
- ProdUS frontend and backend use `query`, `conversationId`, and `context` as the canonical assistant payload.
- `POST /api/ai/assistant/query` returns `provider=LOOMAI`, `mode=thinker`, `success=true`, and no fallback/error for an authorized owner.
- `POST /api/ai/assistant/query-once` returns `provider=LOOMAI`, `mode=thinker`, `success=true`, and no fallback/error for an authorized owner.
- `POST /api/ai/assistant/suggestions` returns non-empty owner-safe suggestions for an authorized owner.
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
