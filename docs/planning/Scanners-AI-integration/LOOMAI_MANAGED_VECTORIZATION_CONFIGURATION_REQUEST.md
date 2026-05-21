# LoomAI Managed Vectorization Configuration Request

Date: 2026-05-21

Status: ready for LoomAI platform configuration

## Purpose

ProdUS now supports LoomAI-managed vectorization through a backend-only paged export endpoint. ProdUS remains responsible for filtering safe exportable records. LoomAI should own the vectorization runner, checkpoints, retries, run history, runtime data-sync writes, and retrieval verification.

## Staging Deployment

- ProdUS API: `https://produs-api-staging.46.224.145.148.sslip.io`
- LoomAI deployment: `dep-7706fafb`
- Customer ID: `produs-staging`
- Dataset ID: `produs-safe-knowledge`
- Export version: `produs-safe-knowledge-v1`

## ProdUS Export Endpoint

```http
GET https://produs-api-staging.46.224.145.148.sslip.io/api/ai/loomai/knowledge-export?cursor=<opaque-cursor>&limit=<page-size>
Authorization: Bearer <produs-owned-loomai-vectorization-export-token>
Accept: application/json
```

Token handling:

- ProdUS staging backend is configured with `LOOMAI_SAFE_KNOWLEDGE_EXPORT_TOKEN`.
- The token must be shared through the agreed private secret channel only.
- Do not place the token in Marketplace plugin manifests, frontend configuration, docs, logs, or browser-accessible code.

Paging behavior:

- `limit` defaults to `100`.
- Maximum supported `limit` is `250`.
- `cursor` is opaque and safe to log.
- Continue paging until `hasMore=false`.

Response shape:

```json
{
  "records": [
    {
      "id": "service-module:api-security-review",
      "type": "SERVICE_MODULE",
      "vectorSpace": "service-module",
      "title": "API security review",
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

## Required Vector Spaces

The LoomAI DATA plugin must keep these vector spaces active for this deployment:

| Vector Space | ProdUS Record Type |
| --- | --- |
| `service-category` | `SERVICE_CATEGORY` |
| `service-module` | `SERVICE_MODULE` |
| `service-dependency` | `SERVICE_DEPENDENCY` |
| `package-template` | `PACKAGE_TEMPLATE` |
| `ai-capability-contract` | `AI_CAPABILITY_CONTRACT` |
| `milestone-template` | future `MILESTONE_TEMPLATE` |
| `acceptance-criteria-template` | future `ACCEPTANCE_CRITERIA_TEMPLATE` |
| `evidence-template` | future `EVIDENCE_TEMPLATE` |
| `scanner-tool-description` | future `SCANNER_TOOL_DESCRIPTION` |
| `case-pattern` | future `CASE_PATTERN` |
| `team-profile` | `TEAM_PROFILE` |
| `solo-expert-profile` | `SOLO_EXPERT_PROFILE` |

Talent records are intentionally dedicated spaces:

- `TEAM_PROFILE` must index into `team-profile`.
- `SOLO_EXPERT_PROFILE` must index into `solo-expert-profile`.
- Do not map talent profile records into `case-pattern`.

## Safe Data Boundary

ProdUS export includes:

- service categories
- service modules
- service dependencies
- package templates
- AI capability contracts
- active public team profiles
- active public solo expert profiles

ProdUS export excludes:

- product workspaces and private owner state
- package instance private state
- scanner findings, raw logs, SARIF, and evidence files
- object storage URLs
- credentials, secrets, JWTs, and provider tokens
- private messages, invitations, join requests, membership internals, and commercial/payment records

## Live ProdUS Verification

Completed on 2026-05-21:

- `GET /actuator/health` returned `UP`.
- Unauthenticated export call returned `401`.
- Wrong-token export call returned `401`.
- Valid-token export call returned `200`.
- Full export completed in 3 pages:
  - page 1: 50 records
  - page 2: 50 records
  - page 3: 21 records
  - total: 121 records
- Exported vector spaces observed:
  - `ai-capability-contract`
  - `package-template`
  - `service-category`
  - `service-dependency`
  - `service-module`
  - `solo-expert-profile`
  - `team-profile`
- Direct ProdUS admin sync to LoomAI runtime succeeded:
  - status: `SYNCED`
  - record count: 121
  - total operations: 121
  - succeeded operations: 121
  - failed operations: 0
  - provider request IDs: 3 batched runtime requests

## LoomAI Actions Requested

1. Configure a managed REST vectorization source for the ProdUS export endpoint.
2. Store the ProdUS export token as a LoomAI backend secret.
3. Use cursor pagination with page size `100`.
4. Map each record to the record-provided `vectorSpace`.
5. Use `id` as the stable external record ID.
6. Use `metadata.sourceRecordVersion` as the drift/version marker.
7. Treat `deleted=true` as a tombstone delete.
8. Run a full bootstrap ingestion for `produs-safe-knowledge-v1`.
9. Show vectorization run history, checkpoint, retry, and failure visibility in LoomAI Platform.
10. Confirm retrieval over real ProdUS service/package/team/solo-expert records through the deployed chat runtime.

## Retrieval Quality Checks

After managed vectorization is configured, run these staging questions through the live runtime:

- "Which ProdUS service handles API security review and what outcome should it produce?"
- "Which services help a prototype with CI/CD and dependency risk?"
- "Which package template is appropriate for launch readiness?"
- "Which public teams or solo experts are relevant for security and launch-readiness work?"

Expected behavior:

- Answers should use ProdUS lifecycle-service names such as `API security review`, `CI/CD setup`, `Dependency security review`, and `Launch risk review`.
- Answers should not invent non-catalog services.
- Answers should not expose private workspace, scanner artifact, token, or message data.
- Provider responses should include a provider request ID for traceability.

## Current Caveat

ProdUS direct sync is live-compatible and successful. A chat smoke through ProdUS backend returned a live LoomAI response with provider request ID, but did not yet retrieve the real synced catalog record. Treat retrieval quality as pending LoomAI managed-source/retrieval configuration, not a ProdUS export blocker.
