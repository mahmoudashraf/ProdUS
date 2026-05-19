# LoomAI Contract Standardization Change Plan

Date: 2026-05-19

Status: backend implementation completed; frontend/browser smoke and staging env verification still pending.

Platform source of truth is:

`/Users/mahmoudashraf/Downloads/Projects/TheBaseRepo/doc/Productization/future-work/MarketPlace/Products/Strategy/RoadMaps/Implementation/010_5_LOOMAI_CANONICAL_RUNTIME_BRIDGE_CONTRACT_STANDARDIZATION_PLAN.md`

Related handover: `docs/LOOMAI_STAGING_DEPLOYMENT_HANDOVER.md`

## 1. Goal

Standardize ProdUS to the LoomAI platform canonical assistant contract while both sides are still greenfield.

The target is one stable business contract:

- ProdUS frontend calls only ProdUS backend.
- ProdUS backend validates user/session/resource access.
- ProdUS backend calls LoomAI through either direct private runtime or Platform consumer bridge.
- The request and response payload shape matches the platform canonical contract used by Shopify Companion and future LoomAI products.
- Runtime/bridge-specific envelopes are adapter internals and are never exposed to the ProdUS browser.

## 2. Non-Goals

This document is not the platform-level implementation source of truth. It describes the ProdUS downstream adoption of the canonical LoomAI contract after the platform/runtime/bridge standard is implemented.

Platform-level changes belong in the 010.5 plan in `TheBaseRepo`.

## 3. Canonical Contract

### Request

Use this request shape everywhere in ProdUS assistant integration:

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

Rules:

- `query` is the user request text.
- `conversationId` is the stable ProdUS assistant conversation id.
- `context` contains only backend-authorized, safe page/business context.
- Do not use `message`.
- Do not use `sessionId` as the public assistant contract.
- Do not use Shopify-style `storefrontContext`.

### Response

ProdUS frontend should receive this flat response shape:

```json
{
  "provider": "LOOMAI",
  "mode": "LIVE",
  "success": true,
  "type": "INFORMATION_PROVIDED",
  "answer": "Safe user-facing answer",
  "safeSummary": "Safe user-facing answer",
  "confidence": 0.0,
  "sources": [],
  "actions": [],
  "fallbackReason": null,
  "providerRequestId": "rag-..."
}
```

Rules:

- `answer` is the primary display text.
- `safeSummary` mirrors or summarizes the safe display text.
- `actions` contains already-filtered safe suggestions/actions only.
- `providerRequestId` is optional trace evidence for operators.
- Runtime envelopes such as `result.sanitizedPayload.safeSummary` must be flattened in the ProdUS backend adapter.

## 4. Current Drift To Remove

Current code still has evidence of the older adapter contract:

- `AssistantQueryRequest` uses `message`.
- `AssistantQueryRequest` uses `sessionId`.
- `LoomAIRuntimeAssertionService#createAssertion` accepts `sessionId`; internally this can remain as an auth claim input, but the public API should pass `conversationId`.
- Current response mapping returns `answer` but does not expose explicit `success`, `type`, or `safeSummary` in the target shape.

Because this integration is greenfield, do not keep permanent aliases from `message` to `query` or from `sessionId` to `conversationId`.

## 5. Files To Change

Expected ProdUS backend files:

```text
backend/src/main/java/com/produs/ai/LoomAIIntegrationService.java
backend/src/main/java/com/produs/ai/LoomAIIntegrationController.java
backend/src/main/java/com/produs/ai/loom/LoomAIProperties.java
backend/src/main/java/com/produs/ai/loom/LoomAIRuntimeAssertionService.java
backend/src/main/resources/application.yml
backend/src/main/resources/application-prod.yml
```

Expected ProdUS frontend files:

```text
frontend/src/features/platform/OwnerProductizationWorkspace.tsx
frontend/src/features/platform/AdminRecommendationsPage.tsx
frontend/src/features/platform/types.ts
```

Expected tests:

```text
backend/src/test/java/com/produs/platform/LoomAIIntegrationControllerTest.java
backend/src/test/java/com/produs/platform/LoomAIStagingIntegrationTest.java
backend/src/test/java/com/produs/ai/loom/LoomAIProviderTest.java
```

Only update other files if the implementation proves they are part of the current assistant integration.

## 6. Implementation Slices

### Slice 1: Backend DTO Contract

Change assistant DTOs to the canonical names:

- `AssistantQueryRequest.query`
- `AssistantQueryRequest.conversationId`
- `AssistantQueryRequest.mode`
- `AssistantQueryRequest.position`
- `AssistantQueryRequest.context`
- `AssistantSuggestionsRequest.conversationId` when needed.
- `AssistantSessionResponse.conversationId` if session creation remains.

Validation:

- Reject missing/blank `query`.
- Return a clear 400 for old `message`-only requests.
- Keep route paths stable: `/api/ai/assistant/query`, `/api/ai/assistant/suggestions`, `/api/ai/assistant/session`.

### Slice 2: Backend LoomAI Adapter

Send the same canonical request body to:

- direct runtime mode.
- Platform consumer bridge mode.

Normalize provider responses to the flat canonical response:

- If LoomAI returns flat canonical response, pass through allowlisted fields.
- If LoomAI returns current nested runtime envelope, map:
  - `result.type` to `type`
  - `result.sanitizedPayload.safeSummary` to `answer` and `safeSummary`
  - `result.sanitizedPayload.suggestions` to `actions`
  - `result.metadata.requestId` to `providerRequestId`
- On non-2xx, timeout, malformed response, or provider `success=false`, return deterministic fallback with `success=false`, `mode=FALLBACK`, and `fallbackReason`.

### Slice 3: Private Runtime Assertion Naming

Use `conversationId` as the public input. The private runtime assertion may still include internal claims named `sid` or `sessionId` if LoomAI runtime expects them.

The important boundary is:

- browser and ProdUS public assistant API use `conversationId`.
- private assertion internals are not public contract.

### Slice 4: Frontend Contract

Update frontend assistant calls to send:

```json
{
  "conversationId": "...",
  "query": "...",
  "mode": "support_assistant",
  "position": "productization",
  "context": {}
}
```

Update frontend response handling to read:

- `answer`
- `safeSummary`
- `success`
- `type`
- `actions`
- `fallbackReason`
- `providerRequestId`

Do not show runtime, MCP, vector, bridge, or provider envelope terminology to end users.

### Slice 5: Tests And Contract Guards

Add tests that prove:

- `query` request succeeds.
- blank `query` is rejected.
- old `message`-only request is rejected.
- response normalization flattens nested runtime envelope.
- response normalization passes through flat canonical response.
- fallback response is flat and deterministic.
- frontend types no longer require `message` or `sessionId`.
- unauthorized context IDs are still denied before LoomAI calls.

## 7. Shopify Safety Plan

This plan is safe for Shopify if implementation stays inside the ProdUS repository and does not modify shared LoomAI runtime or Shopify services.

Shopify isolation rules:

- Do not edit `/Users/mahmoudashraf/Downloads/Projects/TheBaseRepo/product-services/shopify-bridge-service`.
- Do not edit `/Users/mahmoudashraf/Downloads/Projects/TheBaseRepo/Platfrom/backend/src/main/java/com/ai/fabric/platform/backend/shopify`.
- Do not edit Shopify MCP Marketplace bundle migrations or action catalogs.
- Do not rename LoomAI runtime fields globally.
- Keep this standardization as a ProdUS adapter/API contract.

If a shared Platform/LoomAI change is required, apply it as a separate slice and run:

```bash
mvn -f /Users/mahmoudashraf/Downloads/Projects/TheBaseRepo/product-services/shopify-bridge-service/pom.xml -q test
mvn -f /Users/mahmoudashraf/Downloads/Projects/TheBaseRepo/Platfrom/backend/pom.xml -q -Dtest=DeploymentMarketplaceDraftCompilerServiceTest test
bash -n /Users/mahmoudashraf/Downloads/Projects/TheBaseRepo/scripts/verify-shopify-companion.sh
```

Do not deploy shared changes to Shopify staging until those gates pass.

## 8. Verification Commands

ProdUS backend:

```bash
cd /Users/mahmoudashraf/Downloads/Projects/ProdUS
mvn -f backend/pom.xml -q -Dtest=LoomAIIntegrationControllerTest test
mvn -f backend/pom.xml -q -Dtest=LoomAIStagingIntegrationTest test
mvn -f backend/pom.xml -q test
```

ProdUS frontend:

```bash
cd /Users/mahmoudashraf/Downloads/Projects/ProdUS
npm --prefix frontend run build
```

Contract smoke after deployment:

```bash
curl -fsS \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <produs-user-token>" \
  -X POST \
  "https://produs-api-staging.46.224.145.148.sslip.io/api/ai/assistant/query" \
  --data '{
    "query": "What is blocking this product from launch?",
    "conversationId": "produs-contract-smoke",
    "mode": "support_assistant",
    "position": "productization",
    "context": {"pageType": "owner-product-workspace"}
  }'
```

Expected response:

- has `answer`.
- has `safeSummary`.
- has `success`.
- does not contain `result.sanitizedPayload`.
- does not require `message`.
- does not require `sessionId`.

## 9. Acceptance Gates

The standardization is complete when:

- ProdUS frontend and backend use `query` and `conversationId`.
- Old `message`-only requests fail fast.
- ProdUS frontend receives only the flat response shape.
- Direct runtime and Platform bridge modes use the same business payload.
- Runtime nested envelopes are hidden by backend normalization.
- No browser-visible contract exposes LoomAI runtime internals.
- Authorization checks still happen before any LoomAI call.
- Shopify files are untouched, or Shopify regression gates pass if shared code was changed.

## 10. Release Notes To Capture

When implemented, update:

- `docs/LOOMAI_STAGING_DEPLOYMENT_HANDOVER.md`
- `docs/PRODOPS_AI_ENABLEMENT_USING_LOOMAI_DEPLOYMENTS.md`

Capture:

- final request/response schema.
- environment variables used for chosen integration mode.
- whether staging uses direct private runtime or Platform bridge.
- exact test and smoke results.
