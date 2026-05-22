# LoomAI Product AI Integration Plan

Date: 2026-05-20

Status: implementation plan - aligned to current staging direct-runtime integration

Audience: ProdUS backend, frontend, scanner, MCP, product, and LoomAI integration owners

## 1. Purpose

This document defines the AI functionality ProdUS needs from LoomAI and the exact integration contract ProdUS should use for staging and production.

ProdUS remains the system of record for identity, authorization, product data, scanner execution, package creation, workspace delivery, evidence, and audit. LoomAI is the governed reasoning runtime used for productization guidance, evidence explanation, scanner-aware recommendations, and confirmed action preparation.

The target architecture is:

```text
ProdUS frontend
  -> ProdUS backend broker
    -> validates user, role, resource access, and safe context
    -> calls LoomAI direct private runtime
    -> optionally exposes safe MCP tools for live lookup/action preparation
  -> ProdUS frontend renders normalized answer/actions/fallback
```

The browser must not call LoomAI directly for the core application path. ProdUS backend owns the runtime credentials and private assertion signing.

## 2. Current Verified Baseline

Current staging direct-runtime behavior is verified:

- ProdUS backend calls LoomAI with `BACKEND_MEDIATED_PRIVATE_RUNTIME`.
- Runtime auth uses `X-AIFABRIC-RUNTIME-API-KEY` and `X-AIFABRIC-RUNTIME-AUTHORIZATION: Bearer rpa1...`.
- `GET /api/chat/me/auth-context` works with ProdUS-generated assertions.
- `POST /api/chat/me/query` works with canonical `query`, `conversationId`, `mode`, `position`, and `context`.
- `POST /api/chat/me/query-once` is the supported LoomAI endpoint for page helpers, inline explainers, smoke checks, and other non-conversational requests that must not persist chat history.
- `POST /api/chat/me/suggestions` works with `content` and `maxSuggestions`.
- ProdUS staging broker endpoints return live LoomAI query and suggestions responses.
- ProdUS MCP authentication is enforced in staging: unauthenticated `/mcp tools/list` returns `401`; authenticated discovery returns the ProdUS tool catalog.
- LoomAI staging deployment `dep-7706fafb` has installed the read-only Marketplace plugin `mkp-action-produs-productization-read-mcp@0.1.0`.
- Runtime action discovery currently loads these 8 ProdUS read actions only: `produs_catalog_search`, `produs_product_list`, `produs_package_inspect`, `produs_workspace_inspect`, `produs_scan_status`, `produs_finding_inspect`, `produs_evidence_list`, and `produs_milestone_review_evidence`.
- Mutation MCP tools are intentionally not imported into LoomAI runtime yet. They require ProdUS confirmation UX, audit enforcement, and a separate reviewed confirmed-action Marketplace manifest.
- Suggestions endpoint must not receive `conversationId` or `context` in the runtime request body unless LoomAI changes its OpenAPI contract.
- Query endpoint must not receive legacy or unsupported top-level fields such as `message`, `sessionId`, `allowedActions`, or `storefrontContext`.

Implemented ProdUS frontend-facing endpoints:

```text
GET  /api/ai/loomai/status
GET  /api/ai/loomai/auth-context
GET  /api/ai/loomai/knowledge-preview
GET  /api/ai/loomai/knowledge-export
POST /api/ai/loomai/knowledge-sync
POST /api/ai/assistant/session
POST /api/ai/assistant/query
POST /api/ai/assistant/query-once
POST /api/ai/assistant/suggestions
```

## 3. AI Scope In ProdUS

AI support must stay inside the core productization value chain:

```text
Product -> diagnosis -> scan/evidence -> findings -> service plan/package
  -> project workspace -> milestone review -> handoff readiness
```

### 3.1 Owner AI Functionality

Owners need AI around the product they are trying to productize.

Required AI capabilities:

- explain product readiness from safe product, package, scanner, workspace, and evidence context
- identify launch blockers and missing evidence
- recommend lifecycle services from product stage, risk signals, and normalized findings
- explain why a package/service dependency exists
- summarize package readiness and budget/timeline risk
- compare service plan options without inventing capabilities
- explain scanner findings in owner-readable language
- recommend next workspace or milestone actions
- draft questions for teams based on blockers and evidence gaps
- prepare actions such as package creation, scan start, or workspace creation for explicit owner confirmation

### 3.2 Team Member / Team Manager AI Functionality

Teams need AI around delivery evidence and acceptance criteria.

Required AI capabilities:

- explain assigned workspace status and milestone blockers
- list missing evidence for a milestone
- summarize scanner findings that affect team deliverables
- map findings to remediation work and service categories
- explain acceptance criteria and evidence requirements
- prepare deliverable status/evidence updates for explicit confirmation
- explain handoff readiness gaps before support transition

### 3.3 Advisor / Security Reviewer AI Functionality

Advisors need AI around governance, review, and risk interpretation.

Required AI capabilities:

- summarize milestone evidence against criteria
- distinguish verified evidence, missing proof, and inferred risk
- explain risk acceptance implications
- identify findings that need human security review
- prepare review notes or change requests
- never certify production readiness, security, or compliance without human review

### 3.4 Admin AI Functionality

Admins need AI around platform operations and integration health, not unrestricted data mutation.

Required AI capabilities:

- inspect LoomAI readiness and provider health
- preview and sync safe knowledge records
- understand scanner runtime readiness and recent job failures
- audit provider request IDs and fallback reasons
- review production readiness gates
- summarize safe platform trends without exposing private tenant records broadly

### 3.5 Explicitly Out Of Scope

LoomAI must not support or execute:

- team creation
- team invitations
- solo expert join requests
- expert or team profile edits
- account settings
- community messages
- payment or commercial operations
- broad admin mutation
- direct source-code reading
- direct scanner binary execution
- production deployment approval
- security, compliance, or production-readiness certification

Team data is allowed only where it supports productization value: shortlist rationale, team comparison, workspace delivery status, evidence quality, and risk context.

## 4. Authentication Contract

ProdUS backend sends private runtime auth headers. Raw values must be stored only as deployment secrets.

Required headers:

```http
X-AIFABRIC-RUNTIME-API-KEY: <deployment-scoped-runtime-api-key>
X-AIFABRIC-RUNTIME-AUTHORIZATION: Bearer <rpa1-assertion>
Content-Type: application/json
Accept: application/json
```

Required assertion claims:

```json
{
  "sub": "produs-user-or-session-id",
  "subjectType": "END_USER",
  "authMode": "PRIVATE_RUNTIME_BACKEND_MEDIATED",
  "callerType": "TRUSTED_BACKEND",
  "sessionId": "produs-conversation-id",
  "deploymentId": "dep-7706fafb",
  "customerId": "produs-staging",
  "tenantId": "optional-tenant-id",
  "iss": "produs-staging-backend",
  "aud": "dep-7706fafb",
  "iat": "ISO-8601 timestamp",
  "exp": "ISO-8601 timestamp",
  "jti": "uuid",
  "scopes": ["chat:query", "chat:suggestions", "chat:conversations"]
}
```

Rules:

- `conversationId` is the public ProdUS assistant conversation field.
- `sessionId` exists only inside the private runtime assertion because the runtime auth contract expects it.
- The browser never receives runtime API keys or assertion signing material.
- Staging uses HMAC `HS256`; production can move to asymmetric signing if LoomAI supports public-key verification.

## 5. ProdUS Frontend To Backend Contract

The frontend must call only ProdUS backend broker endpoints.

### 5.1 Query Request

```http
POST /api/ai/assistant/query
Authorization: Bearer <Supabase JWT or staging mock token>
Content-Type: application/json
```

```json
{
  "conversationId": "produs-owner-product-workspace-123",
  "query": "What is blocking this product from launch?",
  "mode": "support_assistant",
  "position": "productization",
  "context": {
    "pageType": "owner-product-workspace",
    "productId": "uuid",
    "packageId": "uuid",
    "workspaceId": "uuid",
    "milestoneId": "uuid",
    "findingId": "uuid"
  }
}
```

Frontend rules:

- `query` is required and non-empty.
- `conversationId` should be stable per assistant surface/session.
- `context` may include IDs visible on the current page.
- Do not send raw files, private URLs, Supabase session data, access tokens, raw scanner logs, or source code.

Use `POST /api/ai/assistant/query` only for persistent assistant conversations where the user expects a chat thread to continue.

### 5.1a One-Time Query Request

Use `POST /api/ai/assistant/query-once` for page-level helpers and non-conversational assistant panels:

```http
POST /api/ai/assistant/query-once
Authorization: Bearer <Supabase JWT or staging mock token>
Content-Type: application/json
```

The request and response shape is identical to `/api/ai/assistant/query`. ProdUS backend maps this endpoint to LoomAI runtime `POST /api/chat/me/query-once`, which treats `conversationId` as correlation only and must not create chat history. Do not add a `persistConversation` field; choose `/query` or `/query-once` by product UX intent.

### 5.2 Query Response

```json
{
  "provider": "LOOMAI",
  "mode": "LIVE",
  "success": true,
  "type": "INFORMATION_PROVIDED",
  "answer": "Safe user-facing answer.",
  "safeSummary": "Safe user-facing answer.",
  "conversationId": "produs-owner-product-workspace-123",
  "confidence": 0.72,
  "sources": [],
  "actions": [],
  "suggestions": [],
  "fallbackReason": null,
  "providerRequestId": "rag-..."
}
```

Fallback response:

```json
{
  "provider": "PRODUS_FALLBACK",
  "mode": "FALLBACK",
  "success": false,
  "type": "FALLBACK",
  "answer": "Deterministic ProdUS guidance.",
  "safeSummary": "Deterministic ProdUS guidance.",
  "conversationId": "produs-owner-product-workspace-123",
  "confidence": 0.0,
  "sources": [],
  "actions": [],
  "suggestions": ["Review missing milestone evidence"],
  "fallbackReason": "LOOMAI_UNAVAILABLE",
  "providerRequestId": null
}
```

Frontend rules:

- Display `answer` as the primary text.
- Use `safeSummary` for compact summaries, history, or activity cards.
- Show live/fallback state in admin/operator UI; owner/team UI should show it subtly.
- Render `actions` only as proposed actions. Mutations require a user confirmation flow before calling a ProdUS backend/MCP action.

### 5.3 Suggestions Request

```http
POST /api/ai/assistant/suggestions
```

```json
{
  "content": "Owner is reviewing a product workspace with unresolved scanner findings.",
  "conversationId": "produs-owner-product-workspace-123",
  "maxSuggestions": 4,
  "context": {
    "pageType": "owner-product-workspace",
    "productId": "uuid"
  }
}
```

Backend keeps `conversationId` and `context` for local authorization/fallback. In direct runtime mode it forwards only:

```json
{
  "content": "Owner is reviewing a product workspace with unresolved scanner findings.",
  "maxSuggestions": 4
}
```

### 5.4 Suggestions Response

```json
{
  "provider": "LOOMAI",
  "mode": "LIVE",
  "success": true,
  "suggestions": [
    "Summarize launch blockers",
    "Show scanner risks",
    "Explain package readiness",
    "List missing milestone evidence"
  ],
  "fallbackReason": null,
  "providerRequestId": "optional"
}
```

## 6. ProdUS Backend To LoomAI Runtime Contract

### 6.1 Query Runtime Request

ProdUS sends this exact body to LoomAI direct runtime:

```http
POST /api/chat/me/query
```

```json
{
  "query": "What is blocking this product from launch?",
  "conversationId": "produs-owner-product-workspace-123",
  "mode": "support_assistant",
  "position": "productization",
  "context": {
    "contextVersion": "produs-safe-summary-v1",
    "contextBoundary": "authorized-redacted-summaries-only",
    "actionProfile": "loomai-productization-read",
    "availableActionGroups": ["catalog", "product", "package", "workspace", "scanner", "finding", "evidence", "milestone"],
    "actorRole": "PRODUCT_OWNER",
    "pageType": "owner-product-workspace",
    "productId": "uuid",
    "productStage": "PROTOTYPE",
    "productName": "Payments Hub",
    "productSummary": {
      "name": "Payments Hub",
      "summary": "Payment orchestration platform summary.",
      "businessStage": "PROTOTYPE",
      "techStack": "Next.js, Spring Boot, PostgreSQL",
      "riskProfile": "Missing CI evidence and deployment hardening.",
      "productUrlAvailable": true,
      "repositoryUrlAvailable": true
    },
    "packageId": "uuid",
    "packageStatus": "DRAFT",
    "packageSummary": {
      "name": "Payments Hub production package",
      "status": "DRAFT",
      "serviceCount": 4,
      "serviceStatusCounts": {"PLANNED": 3, "BLOCKED": 1},
      "services": []
    },
    "workspaceId": "uuid",
    "workspaceStatus": "ACTIVE",
    "workspaceSummary": {
      "name": "Payments Hub delivery",
      "status": "ACTIVE_DELIVERY",
      "participantCount": 3,
      "milestoneCount": 6,
      "milestoneStatusCounts": {"ACCEPTED": 3, "IN_PROGRESS": 2, "BLOCKED": 1}
    },
    "milestoneId": "uuid",
    "milestoneStatus": "IN_PROGRESS",
    "milestoneSummary": {
      "title": "Launch readiness",
      "status": "IN_PROGRESS",
      "deliverableCount": 5,
      "evidenceCount": 4
    },
    "findingId": "uuid",
    "findingSeverity": "HIGH",
    "findingStatus": "OPEN",
    "findingSummary": {
      "title": "Dependency vulnerability",
      "severity": "HIGH",
      "status": "OPEN",
      "sourceTool": "dependency-scan",
      "recommendedService": {"slug": "dependency-security-review"}
    },
    "scannerSummary": {
      "scanRunCount": 3,
      "scanRunStatusCounts": {"COMPLETED": 2, "FAILED": 1},
      "findingSeverityCounts": {"CRITICAL": 1, "HIGH": 3, "MEDIUM": 7},
      "findingStatusCounts": {"OPEN": 8, "RESOLVED": 3},
      "evidenceCount": 12
    }
  }
}
```

Do not send these top-level fields to direct runtime:

- `message`
- `sessionId`
- `allowedActions`
- `storefrontContext`
- `environment`
- raw `user`
- raw `token`
- raw `supabaseSession`

### 6.2 Query Runtime Response Expected

LoomAI should return a flat response:

```json
{
  "success": true,
  "type": "INFORMATION_PROVIDED",
  "answer": "Safe answer.",
  "safeSummary": "Safe answer.",
  "conversationId": "produs-owner-product-workspace-123",
  "mode": "support_assistant",
  "position": "productization",
  "confidence": 0.72,
  "sources": [
    {
      "type": "service_module",
      "id": "service-module:security-hardening",
      "title": "Security Hardening",
      "summary": "Used because unresolved high-severity findings remain.",
      "confidence": 0.8
    }
  ],
  "actions": [
    {
      "name": "produs.package.build_from_requirement",
      "label": "Build package from readiness requirement",
      "mode": "mutation",
      "confirmationRequired": true,
      "targetType": "package",
      "targetId": "uuid",
      "input": {
        "requirementId": "uuid",
        "recommendedServiceSlugs": ["security-hardening", "ci-cd-readiness"]
      },
      "rationale": "The product has security and delivery blockers that map to these services.",
      "riskLevel": "medium",
      "idempotencyKey": "produs-owner-product-workspace-123:package-build:uuid"
    }
  ],
  "suggestions": [
    "Show missing evidence",
    "Recommend lifecycle services"
  ],
  "fallbackReason": null,
  "providerRequestId": "rag-..."
}
```

Required response rules:

- `answer` and `safeSummary` must be safe for end-user display.
- `success=false` must include `fallbackReason` or `errorCode`.
- `sources` must reference safe records or authorized live records only.
- `actions` must be proposals only; ProdUS executes them only after explicit confirmation.
- `providerRequestId` should be present for trace correlation.

### 6.3 Suggestions Runtime Request

```http
POST /api/chat/me/suggestions
```

```json
{
  "content": "Current ProdUS productization context for owner-product-workspace. Product: Payments Hub. Workspace status: ACTIVE. Suggest useful next questions or actions for product readiness, scanner evidence, package planning, and milestone blockers.",
  "maxSuggestions": 4
}
```

Expected response:

```json
{
  "success": true,
  "suggestions": [
    "Summarize current blockers",
    "Show unresolved scanner findings",
    "List missing milestone evidence",
    "Recommend lifecycle services"
  ],
  "providerRequestId": "optional"
}
```

### 6.4 Auth Context Runtime Request

```http
GET /api/chat/me/auth-context
```

Expected response:

```json
{
  "subjectId": "produs-user-id",
  "subjectType": "END_USER",
  "authMode": "PRIVATE_RUNTIME_BACKEND_MEDIATED",
  "callerType": "TRUSTED_BACKEND",
  "sessionId": "produs-conversation-id",
  "deploymentId": "dep-7706fafb",
  "issuer": "produs-staging-backend",
  "grantedScopes": ["chat:query", "chat:suggestions", "chat:conversations"]
}
```

ProdUS uses this endpoint for admin/operator smoke tests, not normal user rendering.

## 7. Context Enrichment Plan

Current implementation builds backend-owned safe context before the LoomAI call. It authorizes each requested product/package/workspace/milestone/finding ID, fetches compact summaries, redacts obvious secrets and URLs, and sends bounded context only.

The service should be deterministic, redacted, and bounded by page type.

### 7.1 Page Context Matrix

| Page Type | AI Use | Safe Context To Send | Must Not Send |
| --- | --- | --- | --- |
| `owner-product-workspace` | product readiness, blockers, next steps | product ID/name/stage, package status, workspace status, open finding counts, milestone completion, service plan summary | raw evidence URLs, logs, source code |
| `owner-package-builder` | service/package recommendation | selected service slugs, dependency warnings, budget/timeline band, product stage, requirement summary | payment data, private messages |
| `scanner-dashboard` | scan status and scanner health | scan run ID/status, tool status counts, finding severity counts, redaction state | raw scanner artifacts, secret values |
| `scanner-finding-detail` | finding explanation and remediation | finding ID/title/severity/status, scanner type, affected area summary, mapped service slugs, redaction state | raw secret match, exact private code snippet |
| `milestone-review` | evidence review support | milestone ID/status, acceptance criteria counts, evidence counts, failed checks summary | private files, private URLs |
| `active-workspace` | delivery support | workspace ID/status, milestone progress, blocker counts, deliverable statuses, support/dispute summary | private user messages |
| `service-catalog` | service education and cart guidance | category/module slug, service dependency info, current cart service slugs | account/session data |
| `admin-scanner-ops` | operational summary | aggregate job status, tool health, import failures, readiness gate states | tenant private details unless explicitly scoped |

### 7.2 Enriched Context Shape

The enriched context must remain compact:

```json
{
  "actorRole": "PRODUCT_OWNER",
  "pageType": "owner-product-workspace",
  "product": {
    "id": "uuid",
    "name": "Payments Hub",
    "stage": "PROTOTYPE",
    "summary": "Payment orchestration and settlement platform",
    "techStack": ["Next.js", "Spring Boot", "PostgreSQL"]
  },
  "package": {
    "id": "uuid",
    "status": "DRAFT",
    "selectedServices": ["security-hardening", "ci-cd-readiness"],
    "dependencyWarnings": ["Cloud readiness depends on deployment pipeline."]
  },
  "workspace": {
    "id": "uuid",
    "status": "ACTIVE",
    "milestonesCompleted": 3,
    "milestonesTotal": 6,
    "blockerCount": 2
  },
  "scanner": {
    "latestRunStatus": "COMPLETED",
    "openFindings": {"critical": 1, "high": 3, "medium": 7, "low": 12},
    "redactionState": "REDACTED"
  },
  "evidence": {
    "missingRequired": 4,
    "passedChecks": 12,
    "failedChecks": 2
  }
}
```

Rules:

- Enrichment must be built after backend authorization checks.
- Keep context size bounded; send summaries and IDs, not raw records.
- Include source IDs so LoomAI can cite them, but not private object URLs.
- Use MCP/live lookup for details when LoomAI needs more context.
- Do not add top-level `allowedActions` to the direct runtime query payload.
- Do not send the full mutation tool list in `context` unless LoomAI explicitly adds a documented field for it. Use the lightweight `actionProfile` and `availableActionGroups` hints instead.

## 8. Safe Knowledge Sync Contract

ProdUS safe knowledge is shared/catalog knowledge, not customer-owned private records.

Status: LoomAI-side DATA plugin, live data-sync smoke, managed vectorization ingestion, and retrieval quality checks are complete for staging as of 2026-05-21. Chat/query/suggestions, private runtime auth, canonical assistant payloads, context enrichment, read MCP actions, canonical safe knowledge sync payloads, the ProdUS managed-vectorization export endpoint, and LoomAI-managed indexing are implemented and live-verified.

LoomAI published and installed the ProdUS DATA Marketplace plugin before treating live sync as stable. This registers the vector spaces/entity types so valid record-specific operations do not fail with `VECTOR_SPACE_NOT_FOUND`.

Required DATA Marketplace plugin:

```text
mkp-data-produs-safe-knowledge
```

Staging install:

- Version: `0.1.1`
- Deployment: `dep-7706fafb`
- Release: `rel-f17c4793`
- Status: `APPLIED_VERIFIED`, verification `PASSED`
- Runtime vector-space check: all required spaces present
- Live data-sync smoke: dedicated `team-profile` and `solo-expert-profile` ProdUS-shaped upsert/delete passed with `providerRequestId` and success/failure counts

Required vector spaces:

| Vector Space | Record Types |
| --- | --- |
| `service-category` | `SERVICE_CATEGORY` |
| `service-module` | `SERVICE_MODULE` |
| `service-dependency` | `SERVICE_DEPENDENCY` |
| `package-template` | `PACKAGE_TEMPLATE` |
| `ai-capability-contract` | `AI_CAPABILITY_CONTRACT` |
| `milestone-template` | `MILESTONE_TEMPLATE` |
| `acceptance-criteria-template` | `ACCEPTANCE_CRITERIA_TEMPLATE` |
| `evidence-template` | `EVIDENCE_TEMPLATE` |
| `scanner-tool-description` | `SCANNER_TOOL_DESCRIPTION` |
| `case-pattern` | approved anonymized `CASE_PATTERN` records only |
| `team-profile` | `TEAM_PROFILE` public active team discovery profiles |
| `solo-expert-profile` | `SOLO_EXPERT_PROFILE` public active solo expert discovery profiles |

Current safe record shape:

```json
{
  "id": "service-module:security-hardening",
  "type": "SERVICE_MODULE",
  "title": "Security Hardening",
  "body": "Description, owner outcome, required inputs, deliverables, acceptance criteria, workflow steps, evidence types, and AI assistance tags.",
  "metadata": {
    "slug": "security-hardening",
    "category": "Security",
    "serviceLayer": "security",
    "maturityLevel": "production",
    "timelineRange": "1-2 weeks",
    "priceRange": "$5K-$15K",
    "humanReviewRequired": true,
    "releaseStage": "active"
  }
}
```

Required LoomAI runtime sync request:

```http
POST <LOOMAI_DATA_SYNC_BATCH_PATH>
```

```json
{
  "trace": {
    "requestId": "produs-safe-knowledge-sync-uuid",
    "metadata": {
      "source": "ProdUS",
      "environment": "staging",
      "datasetId": "produs-safe-knowledge",
      "recordCount": 1
    },
    "authContext": {
      "subjectId": "system:produs-safe-knowledge-sync",
      "subjectType": "SYSTEM_PROCESS",
      "authMode": "PRIVATE_RUNTIME_BACKEND_MEDIATED",
      "callerType": "SYSTEM_PROCESS",
      "deploymentId": "dep-7706fafb",
      "customerId": "produs-staging",
      "issuer": "produs-staging-backend",
      "grantedScopes": ["data-sync:upsert"]
    }
  },
  "operations": [
    {
      "type": "UPSERT",
      "vectorSpace": "service-module",
      "id": "service-module:security-hardening",
      "content": "Security Hardening\n\nSafe text.",
      "metadata": {
        "recordType": "SERVICE_MODULE",
        "title": "Security Hardening",
        "slug": "security-hardening"
      },
      "identity": {
        "sourceRecordId": "service-module:security-hardening",
        "sourceRecordVersion": "stable hash or updated timestamp"
      }
    }
  ]
}
```

ProdUS must not send the older runtime-incompatible shape:

```json
{
  "environment": "staging",
  "source": "ProdUS",
  "records": []
}
```

Safe record types:

- `SERVICE_CATEGORY`
- `SERVICE_MODULE`
- `SERVICE_DEPENDENCY`
- `PACKAGE_TEMPLATE`
- `AI_CAPABILITY_CONTRACT`
- `TEAM_PROFILE` for active public team discovery profiles
- `SOLO_EXPERT_PROFILE` for active public solo expert discovery profiles
- `MILESTONE_TEMPLATE` from approved package/template sequencing
- `ACCEPTANCE_CRITERIA_TEMPLATE` from catalog acceptance template definitions
- `EVIDENCE_TEMPLATE` from catalog evidence template definitions
- `SCANNER_TOOL_DESCRIPTION` from configured scanner tool descriptions
- approved anonymized `CASE_PATTERN` records derived from package templates

Current staging vector-space mapping:

| Safe Record Type | Vector Space |
| --- | --- |
| `SERVICE_CATEGORY` | `service-category` |
| `SERVICE_MODULE` | `service-module` |
| `SERVICE_DEPENDENCY` | `service-dependency` |
| `PACKAGE_TEMPLATE` | `package-template` |
| `AI_CAPABILITY_CONTRACT` | `ai-capability-contract` |
| `MILESTONE_TEMPLATE` | `milestone-template` |
| `ACCEPTANCE_CRITERIA_TEMPLATE` | `acceptance-criteria-template` |
| `EVIDENCE_TEMPLATE` | `evidence-template` |
| `SCANNER_TOOL_DESCRIPTION` | `scanner-tool-description` |
| `CASE_PATTERN` | `case-pattern` |
| `TEAM_PROFILE` | `team-profile` |
| `SOLO_EXPERT_PROFILE` | `solo-expert-profile` |

Not safe to index:

- raw repositories
- raw scanner logs
- raw SARIF artifacts
- secret values
- private object storage URLs
- Supabase JWTs
- webhook payloads
- private community/team messages
- private invitations and join requests
- team membership internals
- payment/commercial records

Expected LoomAI data-sync response:

```json
{
  "success": true,
  "upserted": 128,
  "skipped": 0,
  "failed": 0,
  "index": "produs_catalog",
  "providerRequestId": "index-..."
}
```

ProdUS must normalize success and failure counts from the live response when available. The admin UI should expose sanitized `status`, `providerRequestId`, `total`, `succeeded`, `failed`, `errorCode`, and `message`.

Indexing rules:

- Safe shared catalog/platform knowledge uses DATA Marketplace vector spaces and runtime data-sync batches.
- Live user-owned product/workspace/package/scanner state is not bulk-indexed.
- Private current state is supplied through authorized context enrichment and read-only ProdUS MCP actions.
- Do not index specific product workspaces, private scanner findings, raw scanner logs, raw evidence files, private package state, team/private messages, object storage URLs, tokens, or secrets.

### 8.1 LoomAI-Managed Vectorization Export

ProdUS supports LoomAI-managed vectorization by exposing a backend-only paged export endpoint. This is the preferred production-grade indexing lifecycle because LoomAI can own checkpoints, retries, run history, failure visibility, and verification while ProdUS keeps the safe-data boundary.

```http
GET /api/ai/loomai/knowledge-export?cursor=<opaque-cursor>&limit=<page-size>
Authorization: Bearer <produs-owned-loomai-vectorization-export-token>
```

Required ProdUS backend env:

```text
LOOMAI_SAFE_KNOWLEDGE_EXPORT_TOKEN=<produs-owned-loomai-vectorization-export-token>
```

Response:

```json
{
  "records": [
    {
      "id": "service-module:security-hardening",
      "type": "SERVICE_MODULE",
      "vectorSpace": "service-module",
      "title": "Security hardening",
      "body": "Approved public productization text.",
      "metadata": {
        "recordType": "SERVICE_MODULE",
        "datasetId": "produs-safe-knowledge",
        "sourceRecordVersion": "stable-content-hash"
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

Rules:

- The export endpoint is not a browser/user API. It uses a machine bearer token and does not accept Supabase JWTs as authorization.
- Missing or invalid bearer token returns `401`; missing server-side export token config returns `503`.
- `limit` defaults to `100` and is capped at `250`.
- `cursor` is opaque, versioned, deterministic, and safe to log.
- Returned records are the same approved safe-knowledge records used by direct sync, with exact `vectorSpace` values included.
- `TEAM_PROFILE` records map to `team-profile`; `SOLO_EXPERT_PROFILE` records map to `solo-expert-profile`.
- Metadata includes `sourceRecordVersion` for drift detection.
- The API rate limiter and security audit logging apply to the export route.

LoomAI source-connection configuration should use:

```text
adapterType: REST_API
authMode: API_KEY
baseUrl: https://produs-api-staging.46.224.145.148.sslip.io
path: /api/ai/loomai/knowledge-export
pagination: CURSOR
pageSize: 100
entityScope:
  - service-category
  - service-module
  - service-dependency
  - package-template
  - ai-capability-contract
  - milestone-template
  - acceptance-criteria-template
  - evidence-template
  - scanner-tool-description
  - case-pattern
  - team-profile
  - solo-expert-profile
```

Live LoomAI-managed vectorization state:

- Source connection: configured for the ProdUS export endpoint.
- Token storage: Platform managed secret, not in docs or manifests.
- Runner service: `vectorization-runner-dep-7706fafb`.
- Full reindex run: `vrn-9f98d115`, `157` processed, `157` succeeded, `0` failed.
- Runtime release/version: `rel-579d7fce` / `ver-0b3324cd`, applied and verified.
- RAG tuning: threshold `0.2`, max docs `8`, max context chars `7000`.
- Retrieval checks: grounded ProdUS service, package, team, and solo-expert answers.

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

Managed vectorization acceptance:

- `GET /api/ai/loomai/knowledge-export?limit=1` returns one safe record with no private fields.
- Paged export completes until `hasMore=false`.
- LoomAI bootstrap run writes exported records through runtime `/api/ai/data-sync/batch` without `VECTOR_SPACE_NOT_FOUND`.
- A retry run resumes from checkpoint.
- Retrieval smoke answers from real ProdUS service, package, team, and solo-expert records.

## 9. MCP And Action Contract

LoomAI may propose or prepare actions. ProdUS executes actions through backend/MCP only after authorization and confirmation.

Current staging deployment imports only read actions into LoomAI runtime. ProdUS exposes confirmed mutation candidates in its own MCP catalog for future review, but LoomAI must not call them until a separate confirmed-action Marketplace manifest is reviewed, installed, and verified.

Allowed read tools:

- `produs.catalog.search`
- `produs.product.list`
- `produs.package.inspect`
- `produs.workspace.inspect`
- `produs.scan.status`
- `produs.finding.inspect`
- `produs.evidence.list`
- `produs.milestone.review_evidence`

Future mutation tools with confirmation:

- `produs.requirement.submit`
- `produs.package.build_from_requirement`
- `produs.team.shortlist`
- `produs.workspace.create`
- `produs.deliverable.update`
- `produs.scan.start`
- `produs.scan.cancel`
- `produs.finding.accept_risk`
- `produs.evidence.upload_ci_result`

Common mutation input requirements:

```json
{
  "confirm": true,
  "reason": "Human-readable reason captured from user confirmation.",
  "idempotencyKey": "stable-action-key",
  "targetType": "package",
  "targetId": "uuid",
  "payload": {}
}
```

Action rules:

- LoomAI can propose actions in `actions[]`.
- Frontend must render action proposals as previews, not execute them automatically.
- User confirmation must happen in ProdUS UI.
- Backend authorization remains the enforcement boundary.
- Every executed MCP mutation must create an invocation/audit record.
- AI cannot execute excluded team/profile/community/account/payment operations.

## 10. Capability-Specific Contracts

### 10.1 Product Readiness Diagnosis

ProdUS sends:

```json
{
  "query": "What is blocking this product from launch?",
  "conversationId": "produs-product-uuid-readiness",
  "mode": "support_assistant",
  "position": "productization",
  "context": {
    "pageType": "owner-product-workspace",
    "actorRole": "PRODUCT_OWNER",
    "productId": "uuid",
    "productStage": "PROTOTYPE",
    "workspaceStatus": "ACTIVE",
    "findingSeverityCounts": {"critical": 1, "high": 3, "medium": 7},
    "missingEvidenceCount": 4
  }
}
```

LoomAI should return:

- owner-readable readiness summary
- blocker list with evidence basis
- recommended service categories/modules
- suggested next questions
- optional confirmed-action proposals such as building a package or starting a scan

### 10.2 Scanner Finding Explanation

ProdUS sends:

```json
{
  "query": "Explain this finding and what service should fix it.",
  "conversationId": "produs-finding-uuid",
  "mode": "support_assistant",
  "position": "productization",
  "context": {
    "pageType": "scanner-finding-detail",
    "actorRole": "PRODUCT_OWNER",
    "findingId": "uuid",
    "findingSeverity": "HIGH",
    "findingStatus": "OPEN",
    "scannerType": "dependency",
    "redactionState": "REDACTED",
    "mappedServices": ["dependency-remediation", "security-hardening"]
  }
}
```

LoomAI should return:

- safe explanation of risk
- impact framed as productization risk, not compliance certification
- recommended services and evidence needed
- no raw secret, source snippet, or private artifact URL
- optional `produs.finding.accept_risk` proposal only when user asks and the response explains human-review requirements

### 10.3 Package / Service Recommendation

ProdUS sends:

```json
{
  "query": "What services should I add to move this product toward production?",
  "conversationId": "produs-package-uuid",
  "mode": "support_assistant",
  "position": "productization",
  "context": {
    "pageType": "owner-package-builder",
    "actorRole": "PRODUCT_OWNER",
    "productId": "uuid",
    "productStage": "PROTOTYPE",
    "packageId": "uuid",
    "packageStatus": "DRAFT",
    "selectedServices": ["cloud-deployment"],
    "riskSignals": ["missing-ci", "high-dependency-risk"]
  }
}
```

LoomAI should return:

- service recommendations from indexed catalog knowledge
- dependency explanations
- budget/timeline risk framing
- acceptance criteria/evidence suggestions
- optional `produs.package.build_from_requirement` or `produs.requirement.submit` proposal requiring confirmation

### 10.4 Workspace / Milestone Evidence Review

ProdUS sends:

```json
{
  "query": "Is this milestone ready for review?",
  "conversationId": "produs-milestone-uuid",
  "mode": "support_assistant",
  "position": "productization",
  "context": {
    "pageType": "milestone-review",
    "actorRole": "PRODUCT_OWNER",
    "workspaceId": "uuid",
    "workspaceStatus": "ACTIVE",
    "milestoneId": "uuid",
    "milestoneStatus": "SUBMITTED",
    "criteria": {"passed": 5, "failed": 1, "pending": 0},
    "evidence": {"required": 6, "attached": 5, "missing": 1}
  }
}
```

LoomAI should return:

- evidence-based readiness explanation
- missing evidence list
- failed automated check summary
- recommended reviewer notes
- no final certification claim
- optional `produs.deliverable.update` proposal only after confirmation

### 10.5 Handoff Readiness

ProdUS sends:

```json
{
  "query": "What is missing before support handoff?",
  "conversationId": "produs-workspace-handoff-uuid",
  "mode": "support_assistant",
  "position": "productization",
  "context": {
    "pageType": "active-workspace",
    "actorRole": "PRODUCT_OWNER",
    "workspaceId": "uuid",
    "workspaceStatus": "ACTIVE",
    "milestonesCompleted": 5,
    "milestonesTotal": 6,
    "openSupportRisks": 2,
    "handoffChecklistStatus": "INCOMPLETE"
  }
}
```

LoomAI should return:

- handoff gap summary
- missing runbook/access/monitoring evidence
- recommended lifecycle services
- suggested owner/team questions
- no claim that support is fully ready unless evidence supports human review

## 11. UI Integration Plan

AI UI should be embedded where it helps the current workflow, not as a scattered chatbot.

### Owner UI

Surfaces:

- product workspace right-side assistant
- package builder recommendations
- scanner finding detail explanation
- milestone review guidance
- service cart/package readiness assistant

Required behavior:

- show answers tied to current product/package/workspace
- show source basis and next actions
- render proposed actions as Apple-like compact action rows
- require confirmation for mutation actions
- use deterministic fallback suggestions when LoomAI is unavailable

### Team UI

Surfaces:

- active workspace evidence panel
- deliverable/milestone detail
- scanner finding remediation view
- handoff readiness panel

Required behavior:

- focus on what evidence is missing and what work is blocked
- avoid owner commercial/package language where it does not help team delivery
- do not expose owner-only data or other teams' private context

### Admin UI

Surfaces:

- AI provider status
- safe knowledge preview/sync
- production readiness gates
- scanner operations and import ledger
- provider trace/audit review

Required behavior:

- show provider request IDs
- show fallback rate and recent errors
- show safe knowledge counts and sync status
- expose rollout gates without secrets

## 12. Implementation Sequence

### Phase 1: Stabilize Current Runtime Contract

Status: mostly complete.

Required:

- keep direct private runtime as target path
- keep query payload free of unsupported top-level fields
- keep suggestions payload to `content` plus `maxSuggestions`
- keep private runtime minimum timeout appropriate for LLM latency
- keep safe fallback for disabled, timeout, non-2xx, invalid JSON, and provider errors

### Phase 2: Add Context Enrichment Service

Build `AssistantContextEnrichmentService` in backend.

Responsibilities:

- authorize each resource ID
- fetch compact summaries for product/package/workspace/milestone/finding/scan
- redact sensitive fields
- bound payload size
- add source references suitable for LoomAI citation
- keep a unit-tested allowlist per page type

### Phase 3: Standardize LoomAI Response Normalization

Extend adapter normalization for:

- flat canonical runtime response
- nested `result.sanitizedPayload` response if LoomAI returns it
- `sources[]` safe schema
- `actions[]` safe schema
- `suggestions[]` strings or objects
- provider failure objects
- provider request ID from response field or header

### Phase 4: Register And Smoke MCP Tooling

Required:

- expose `loomai-productization` allowlist only
- authenticate `GET /loomai/tool-allowlist` and `POST /mcp` where required
- register only product/project/scanner/evidence tools
- verify excluded tools are absent
- verify mutation tools require `confirm`, `reason`, and audit

### Phase 5: Safe Knowledge Sync

Required:

- replace old `environment/source/records` request with canonical `trace + operations`; implemented in ProdUS backend on 2026-05-21
- grant data-sync scope in private-runtime system assertions; implemented in ProdUS backend on 2026-05-21
- map safe knowledge records to `UPSERT` operations with `vectorSpace`, `content`, `metadata`, and `identity`; implemented in ProdUS backend on 2026-05-21
- include public active team and solo expert profiles in safe knowledge; implemented in ProdUS backend on 2026-05-21
- migrate current data through `POST /api/ai/loomai/knowledge-sync`; implemented as admin endpoint
- send direct runtime sync in bounded batches through `LOOMAI_SAFE_KNOWLEDGE_SYNC_BATCH_SIZE`; implemented in ProdUS backend on 2026-05-21
- live-index newly created safe records through optional scheduled replay; implemented with `LOOMAI_SAFE_KNOWLEDGE_AUTO_SYNC_ENABLED`
- normalize live runtime response into status/providerRequestId/totalOperations/succeededOperations/failedOperations/errors; implemented in ProdUS backend and admin UI on 2026-05-21
- live-smoke `GET /api/ai/loomai/knowledge-preview` and `POST /api/ai/loomai/knowledge-sync` against `dep-7706fafb`; completed on 2026-05-21
- add counters and partial-failure handling to ProdUS sync response
- add delete/tombstone sync
- add admin UI sync health and stale record status
- add evaluation fixtures for catalog/package/scanner guidance retrieval; LoomAI-managed retrieval smoke completed on 2026-05-21, durable regression fixtures remain recommended

### Phase 6: UI Completion

Status: implemented for current Studio assistant surfaces on 2026-05-22; staging deployment and live verification are required after each UI change.

Implemented:

- owner product workspace AI diagnosis, scanner summary, finding review, service selection, package recommendation, and milestone/evidence readiness panels now use the ProdUS backend `query-once` broker.
- package builder includes an AI service plan advisor.
- active delivery/workspace views include delivery evidence, milestone evidence, and handoff readiness assistant panels.
- admin recommendations includes an AI operations brief.
- assistant answers render Markdown safely as UI blocks instead of raw Markdown text.
- source basis, confidence, provider trace, fallback state, and proposed actions render in compact Apple-like action/source rows.
- owner workspace action proposals are connected to confirmed ProdUS flows for package build, workspace creation, hosted scan start, and finding risk acceptance where the current page has the required context.

Remaining:

- run live staging verification after deployment for every assistant surface.
- broaden confirmed action handlers only after each action has explicit UX confirmation, authorization, audit, and deterministic backend execution.
- verify mobile layout for assistant panels/action previews in staging screenshots.

### Phase 7: Production Readiness

Required:

- separate staging and production LoomAI deployments
- production credential rotation path
- audit export or provider trace access
- rate-limit and timeout tuning from staging metrics
- fallback rollback by `LOOMAI_ENABLED=false`
- no mock auth in production
- Supabase auth and Postgres production path verified
- production MCP host/origin allowlist locked down

## 13. Acceptance Tests

Backend contract tests:

- blank query is rejected
- direct runtime query sends only supported fields
- suggestions runtime request sends only `content` and `maxSuggestions`
- unauthorized product/package/workspace/finding context is denied before LoomAI call
- LoomAI flat response is normalized
- LoomAI nested response is normalized
- LoomAI timeout returns deterministic fallback
- provider request ID is captured when present

Live staging smoke:

- admin can call `/api/ai/loomai/status`
- admin can call `/api/ai/loomai/auth-context`
- owner query returns `provider=LOOMAI`, `mode=LIVE`, `success=true`
- owner suggestions return `provider=LOOMAI`, `mode=LIVE`, non-empty suggestions
- scanner finding query does not expose raw secret/log/artifact data
- excluded team/profile/community actions are absent

MCP tests:

- allowlist contains only approved productization tools
- read tools work for authorized user
- mutation without confirmation is rejected
- mutation with confirmation creates audit
- excluded tool request fails

Frontend tests:

- owner product workspace displays answer, sources, fallback state, and proposed actions
- package builder actions use confirmation modal before mutation
- milestone review assistant shows evidence gaps
- scanner finding assistant renders redacted risk explanation
- admin AI status and sync views render configured/fallback states

## 14. Open Gaps

These are the remaining integration gaps to close after the current direct-runtime smoke:

- Context enrichment currently sends lean IDs/statuses; richer safe summaries should be added.
- Data-sync response schema is not fully confirmed; current implementation only needs sync success and provider request ID.
- MCP registration with LoomAI must be verified with the production host behavior, not only local allowlist tests.
- Package governance through private runtime is not yet implemented as a dedicated LoomAI package review path; current private-runtime package governance remains deterministic fallback.
- UI action proposals need a stricter normalized action schema before they can be rendered broadly.
- Provider audit/export from LoomAI is not yet wired into ProdUS admin dashboards beyond provider request ID visibility.
- Production must move from temporary staging mock auth to real Supabase-only auth before external pilots.

## 15. Decision Summary

Use LoomAI for:

- product readiness and diagnosis
- service/package recommendations
- scanner finding explanation
- evidence and milestone review guidance
- workspace/handoff readiness
- admin AI/scanner readiness visibility
- confirmed productization actions through the ProdUS allowlist

Do not use LoomAI for:

- team creation or invitations
- solo expert/community messaging
- profile/account edits
- payments/commercial execution
- direct source-code/scanner execution
- final security/compliance/production certification

ProdUS sends LoomAI only safe, authorized context and safe indexed knowledge. LoomAI returns safe answers, sources, suggestions, and proposed actions. ProdUS normalizes the response, enforces authorization, requires human confirmation for mutations, and keeps deterministic fallback active.
