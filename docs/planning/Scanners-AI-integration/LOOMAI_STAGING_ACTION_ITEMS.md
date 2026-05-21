# LoomAI Staging Action Items

Date: 2026-05-20

Status: action plan after LoomAI staging feedback

## 1. Current Readiness

Ready:

- Backend-mediated private runtime chat path.
- Backend-only LoomAI runtime credentials.
- `rpa1` assertions with ISO `iat` and `exp`.
- Canonical assistant query payload: `query`, `conversationId`, `mode`, `position`, `context`.
- Frontend calls ProdUS backend only; browser does not call LoomAI runtime.
- Backend context authorization for product, package, workspace, milestone, and finding IDs.
- Backend compact context enrichment and redaction.
- LoomAI staging runtime loads the 8 read-only ProdUS MCP actions.

Not ready yet:

- ProdUS must run live safe knowledge sync against staging real records before retrieval quality can be judged on real catalog, package, service, team, and solo expert content.
- Mutation MCP tools remain intentionally deferred until confirmed-action UX and audit enforcement are complete.

## 2. ProdUS Immediate Actions

### 2.0 Confirm DATA Marketplace Plugin

Owner: ProdUS + LoomAI

Status: LoomAI side complete for staging on 2026-05-21.

Priority: ProdUS payload alignment remains blocking for real safe knowledge ingestion.

Decision:

- Use a hybrid indexing model.
- Index only ProdUS shared safe knowledge into LoomAI.
- Do not bulk-index user-owned product/workspace/package/scanner state.
- Provide live private state at query time through authorized context enrichment and ProdUS MCP read tools.

Required LoomAI plugin:

```text
mkp-data-produs-safe-knowledge
```

Installed/applied state:

- Published plugin: `mkp-data-produs-safe-knowledge@0.1.1`
- Deployment: `dep-7706fafb`
- Install state: enabled, `READY`, live, free entitlement active
- Applied release: `rel-f17c4793`, `APPLIED_VERIFIED`, verification `PASSED`
- Runtime vector-space check: all required spaces present, no `VECTOR_SPACE_NOT_FOUND`
- Live data-sync smoke: dedicated `team-profile` and `solo-expert-profile` ProdUS-shaped upsert/delete passed with `providerRequestId` and success/failure counts
- Temporary retrieval smoke: synthetic `service-module` record was answered through runtime chat and deleted

Required vector spaces:

- `service-category`
- `service-module`
- `service-dependency`
- `package-template`
- `ai-capability-contract`
- `milestone-template`
- `acceptance-criteria-template`
- `evidence-template`
- `scanner-tool-description`
- `case-pattern`
- `team-profile`
- `solo-expert-profile`

Current ProdUS talent indexing:

- Public active team profiles must be indexed as `TEAM_PROFILE` records in `team-profile`.
- Public active solo expert profiles must be indexed as `SOLO_EXPERT_PROFILE` records in `solo-expert-profile`.
- Do not map these profile records into `case-pattern`.
- Private invitations, join requests, messages, team membership internals, commercial terms, and workspace-specific delivery records are not indexed.

Acceptance:

- LoomAI confirms the DATA Marketplace plugin is published, installed on `dep-7706fafb`, and applied. Done on 2026-05-21.
- Runtime data sync accepts one test operation for each active ProdUS vector space. Done on 2026-05-21.
- ProdUS does not send records to a generic fallback vector space such as `support-policy` unless LoomAI explicitly maps it.

### 2.1 Align Safe Knowledge Sync Payload

Owner: ProdUS backend

Status: implemented in ProdUS code on 2026-05-21; live staging smoke remains required.

Priority: blocking for knowledge ingestion proof

Actions:

- Replace `syncSafeKnowledge` request body with LoomAI canonical data-sync schema.
- Create a deterministic request ID such as `produs-safe-knowledge-sync-<uuid>`.
- Add `trace.metadata` with `source=ProdUS`, `environment`, record count, and sync version.
- Add `trace.authContext` with:
  - `subjectId=system:produs-safe-knowledge-sync`
  - `subjectType=SYSTEM_PROCESS`
  - `authMode=PRIVATE_RUNTIME_BACKEND_MEDIATED`
  - `callerType=SYSTEM_PROCESS`
  - `deploymentId=dep-7706fafb`
  - `customerId=produs-staging`
  - `issuer=produs-staging-backend`
  - `grantedScopes=["data-sync:upsert"]`
- Map every safe record into one operation:
  - `type=UPSERT`
  - `vectorSpace=<record-specific vector space>`
  - `id=<safe record id>`
  - `content=<title + body>`
  - `metadata=<safe metadata plus recordType/title/slug>`
  - `identity.sourceRecordId=<safe record id>`
  - `identity.sourceRecordVersion=<stable hash or updated timestamp>`
- Remove the old live request shape:
  - `environment`
  - `source`
  - `records`

Record-to-vector-space mapping:

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

Acceptance:

- Backend test fails if sync request includes top-level `records`.
- Backend test passes only when request includes `trace` and `operations`.
- Backend test verifies vector spaces are specific to record type.
- Live sync against `dep-7706fafb` returns a provider request ID or a structured provider error.

### 2.2 Add Data-Sync Runtime Scope

Owner: ProdUS backend / staging configuration

Status: implemented in ProdUS code on 2026-05-21.

Priority: blocking if LoomAI requires scope validation

Actions:

- Add `data-sync:upsert` to the assertion scope used for knowledge sync, or create a data-sync-specific assertion scope path.
- Keep chat requests scoped to current chat scopes if LoomAI prefers least privilege.
- Confirm runtime rejects sync if `data-sync:upsert` is missing.
- Use `SYSTEM_PROCESS` trace auth context for scheduled safe knowledge sync.

Acceptance:

- Knowledge sync request includes an auth context with `grantedScopes=["data-sync:upsert"]`.
- Knowledge sync trace identifies `system:produs-safe-knowledge-sync`.
- Chat requests remain working.

### 2.3 Normalize Knowledge Sync Response

Owner: ProdUS backend

Status: implemented in ProdUS code on 2026-05-21.

Priority: high

Actions:

- Extend `KnowledgeSyncResponse` to include:
  - `status`
  - `recordCount`
  - `totalOperations`
  - `succeededOperations`
  - `failedOperations`
  - `errors`
  - `providerRequestId`
  - `fallbackReason`
- Normalize provider request ID from response header or body.
- Preserve safe fallback behavior when LoomAI is disabled or unavailable.

Acceptance:

- Admin gets sanitized result without raw provider payload or secrets.
- Partial failures are visible.

### 2.4 Live Smoke Safe Knowledge Ingestion

Owner: ProdUS backend / staging operator

Priority: required before marking knowledge sync ready

Actions:

- Redeploy latest ProdUS backend after canonical sync change.
- Run:

```bash
curl -sS <produs-api>/api/ai/loomai/knowledge-preview
curl -sS -X POST <produs-api>/api/ai/loomai/knowledge-sync
```

- Share only sanitized output:
  - status
  - providerRequestId
  - total/succeeded/failed/skipped counts
  - errorCode/message if any

Acceptance:

- `knowledge-preview` returns only safe shared/catalog records.
- `knowledge-sync` reaches live LoomAI runtime and returns a traceable result.
- No raw secret, private URL, raw scanner artifact, JWT, or token is present in preview or sync payload.

### 2.4a Current Data Migration And Live Reindex Mechanism

Owner: ProdUS backend / staging operator

Status: implemented in ProdUS code on 2026-05-21; direct replay remains available, but LoomAI-managed vectorization is the preferred production-grade run lifecycle.

Mechanism:

- `POST /api/ai/loomai/knowledge-sync` performs a full safe-knowledge replay and migrates the current safe dataset into LoomAI.
- Optional scheduler replays the same export for newly created or updated safe records.
- Enable with:
  - `LOOMAI_SAFE_KNOWLEDGE_SYNC_BATCH_SIZE=50`
  - `LOOMAI_SAFE_KNOWLEDGE_AUTO_SYNC_ENABLED=true`
  - `LOOMAI_SAFE_KNOWLEDGE_AUTO_SYNC_DELAY_MS=300000`
  - `LOOMAI_SAFE_KNOWLEDGE_AUTO_SYNC_INITIAL_DELAY_MS=60000`
- Direct runtime replay sends canonical data-sync operations in bounded batches. Keep the batch size at or below `250`; staging defaults to `50`.
- The replay is idempotent because each operation uses stable `id` and `identity.sourceRecordId`; content changes produce a new `identity.sourceRecordVersion`.

Safe records included:

- service categories
- service modules
- service dependencies
- package templates
- AI capability contracts
- active public team profiles
- active public solo expert profiles

Records intentionally excluded:

- product workspaces
- package instance private state
- scanner findings and evidence artifacts
- raw scanner logs
- private team/community messages
- invitations and join requests
- object storage URLs
- payment records
- secrets, tokens, and JWTs

Acceptance:

- One manual sync migrates current data.
- Scheduler can be enabled on staging to replay new safe records without adding a separate worker.
- Team and solo expert public profiles appear in `knowledge-preview` as `TEAM_PROFILE` and `SOLO_EXPERT_PROFILE`.
- The sync payload remains canonical `trace + operations`; it never sends top-level `environment/source/records`.

### 2.4b LoomAI-Managed Vectorization Export

Owner: ProdUS backend / LoomAI platform

Status: implemented in ProdUS code on 2026-05-21; requires staging env token plus LoomAI source-connection configuration.

Purpose:

- ProdUS remains the authority for deciding what records are safe to export.
- LoomAI owns vectorization run lifecycle, checkpoints, retries, failures, run history, verification, and runtime data-sync writes.
- This replaces ad hoc operational sync jobs as the preferred managed indexing path while keeping `POST /api/ai/loomai/knowledge-sync` available for direct staging/admin replay.

ProdUS endpoint:

```text
GET /api/ai/loomai/knowledge-export?cursor=<opaque-cursor>&limit=<page-size>
Authorization: Bearer <produs-owned-loomai-vectorization-export-token>
```

ProdUS env:

```text
LOOMAI_SAFE_KNOWLEDGE_EXPORT_TOKEN=<produs-owned-loomai-vectorization-export-token>
```

Response shape:

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
  "totalEstimate": 121,
  "exportVersion": "produs-safe-knowledge-v1"
}
```

Implementation details:

- Missing or wrong bearer token returns `401`.
- Missing `LOOMAI_SAFE_KNOWLEDGE_EXPORT_TOKEN` returns `503`.
- `limit` defaults to `100` and is capped at `250`.
- `cursor` is opaque, versioned, safe to log, and resumes by offset for deterministic full export.
- Each record includes the record-specific LoomAI vector space.
- Each record includes `metadata.sourceRecordVersion` so LoomAI can detect drift.
- The endpoint is permitted through Spring Security only so the controller can perform machine-token authentication; it is still protected by the API rate limiter and security audit logging.
- Supabase JWT parsing is skipped for this endpoint so the LoomAI runner bearer token is not treated as a user JWT.

Safe records included:

- service categories
- service modules
- service dependencies
- package templates
- AI capability contracts
- active public team profiles as `TEAM_PROFILE` -> `team-profile`
- active public solo expert profiles as `SOLO_EXPERT_PROFILE` -> `solo-expert-profile`

Records intentionally excluded:

- product workspaces and user-owned private state
- raw scanner findings, logs, SARIF, and evidence files
- object storage URLs
- credentials, secrets, JWTs, and provider tokens
- private messages, invitations, join requests, membership internals, and commercial/payment records

Acceptance:

- `GET /api/ai/loomai/knowledge-export?limit=1` with the configured token returns one safe record.
- Unauthenticated and wrong-token calls return `401`.
- A full paged export completes until `hasMore=false`.
- Export records use `team-profile` and `solo-expert-profile`, not `case-pattern`, for talent profile records.
- LoomAI configures a REST source connection with cursor pagination, page size `100`, and the 12 ProdUS vector spaces.

### 2.5 Retrieval Quality Check

Owner: ProdUS product/backend

Priority: high after live sync succeeds

Actions:

- Ask LoomAI questions that should require indexed catalog knowledge:
  - "Which service handles API security review?"
  - "What evidence is expected for deployment readiness?"
  - "Which package should help a prototype with CI and dependency risks?"
- Confirm responses cite or reference safe service/package records.
- Record weak answers as catalog/content tuning issues.

Acceptance:

- LoomAI responses use ProdUS lifecycle-service terminology.
- Answers do not invent services that are not in catalog.

### 2.6 Admin UI Follow-Up

Owner: ProdUS frontend

Priority: medium

Actions:

- Show knowledge sync counts and provider request ID in the admin AI panel.
- Show last sync status, last sync time, and partial failures.
- Keep secrets and raw provider payload out of the UI.

Acceptance:

- Admin can verify sync health without reading logs.

## 3. ProdUS Deferred Actions

### 3.1 Confirmed Mutation UX

Owner: ProdUS frontend/backend

Priority: deferred until read path and knowledge sync are stable

Actions:

- Build action preview UI for LoomAI-proposed mutations.
- Require explicit user confirmation.
- Capture reason and idempotency key.
- Enforce backend authorization.
- Persist MCP/tool invocation audit record.

Acceptance:

- Mutation tools can be safely imported later through a separate confirmed-action Marketplace manifest.

### 3.2 Confirmed-Action Marketplace Manifest

Owner: ProdUS + LoomAI

Priority: deferred

Actions:

- Create separate mutation manifest after confirmed-action UX ships.
- Import only reviewed actions.
- Verify all mutation tools require confirmation and audit.

Acceptance:

- LoomAI cannot execute unconfirmed mutations.

## 4. LoomAI Actions

### 4.1 Confirm Data-Sync Contract Details

Owner: LoomAI

Actions:

- Publish and install `mkp-data-produs-safe-knowledge`.
- Confirm vector spaces are registered exactly as listed in this plan.
- Confirm whether `data-sync:upsert` must be in the `rpa1` assertion scopes.
- Confirm required response fields for successful, partial, and failed sync.
- Confirm max operations per batch and max content length.
- Confirm indexing latency expectations.

### 4.2 Validate ProdUS Live Sync

Owner: LoomAI

Actions:

- Inspect live runtime logs for ProdUS sync request by provider request ID.
- Confirm operations are accepted and indexed.
- Confirm no operation fails with `VECTOR_SPACE_NOT_FOUND`.
- Confirm no old `environment/source/records` payload is accepted as the target path.

### 4.2a Configure Managed Vectorization Source

Owner: LoomAI

Actions:

- Create a Platform-managed REST source connection for ProdUS safe knowledge:
  - base URL: `https://produs-api-staging.46.224.145.148.sslip.io`
  - path: `/api/ai/loomai/knowledge-export`
  - auth: `Authorization: Bearer <ProdUS export token>`
  - pagination: cursor
  - page size: `100`
- Use vector spaces from `mkp-data-produs-safe-knowledge@0.1.1`.
- Track run history, checkpoints, retries, failed records, and verification status on deployment `dep-7706fafb`.
- Share only sanitized run results with ProdUS:
  - run ID
  - records read
  - operations upserted/deleted
  - failures and error codes
  - provider request IDs

Acceptance:

- Bootstrap run completes without `VECTOR_SPACE_NOT_FOUND`.
- Retry run resumes from checkpoint.
- Retrieval smoke answers from exported real ProdUS catalog/package/service/team/solo-expert records.

### 4.3 Retrieval Verification

Owner: LoomAI

Actions:

- Verify synced ProdUS records are available to the deployed runtime.
- Verify answers can cite or ground against service and package records.
- Confirm unsafe private records are not indexed.

### 4.4 Keep Mutations Deferred

Owner: LoomAI

Actions:

- Keep current deployment read-only for ProdUS actions.
- Do not import mutation tools until ProdUS provides confirmed-action UX and audit proof.

## 5. Evidence To Share After ProdUS Runs It

Share this sanitized result with LoomAI:

```json
{
  "knowledgePreview": {
    "recordCount": 0,
    "recordTypes": []
  },
  "knowledgeSync": {
    "status": "SYNCED",
    "providerRequestId": "redacted-request-id",
    "total": 0,
    "succeeded": 0,
    "failed": 0,
    "skipped": 0,
    "errorCode": null,
    "message": null
  },
  "contract": {
    "usesTraceAndOperations": true,
    "usesLegacyRecordsShape": false
  }
}
```

Do not share runtime API keys, assertion signing secrets, raw assertions, private URLs, raw scanner logs, or raw provider payloads with secrets.

## 6. Completion Criteria

Mark safe knowledge ingestion ready only when all are true:

- ProdUS code sends canonical `trace + operations`.
- Live `POST /api/ai/loomai/knowledge-sync` succeeds or returns a structured provider error that confirms it reached LoomAI.
- Response includes provider request ID or equivalent trace ID.
- Counts are normalized in ProdUS response.
- Knowledge retrieval checks produce grounded service/package answers.
- No sensitive data appears in preview, sync payload, logs, or UI.
