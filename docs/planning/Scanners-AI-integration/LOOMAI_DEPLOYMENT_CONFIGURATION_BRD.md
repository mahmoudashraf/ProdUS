# LoomAI Deployment Configuration BRD

Date: 2026-05-18

Status: ready for LoomAI integration team review

Owner: ProdUS Platform

Audience: LoomAI integration team, ProdUS backend/frontend/MCP owners, security reviewer

## 1. Purpose

ProdUS needs a configured LoomAI deployment that acts as the governed AI runtime for productization, project readiness, scanner findings, package recommendations, evidence review, and milestone support.

This BRD defines the LoomAI-side deployment configuration the integration team must provide. It is not a request for LoomAI to own ProdUS product data, scanner execution, repository access, team operations, or user management. ProdUS remains the system of record and policy authority.

## 2. Business Outcome

The configured LoomAI deployment must let ProdUS users ask product/project/scanner readiness questions and receive grounded answers from approved knowledge and live ProdUS context.

The deployment must support:

- owner guidance for product readiness, launch blockers, package/service planning, evidence gaps, and milestone status
- team/member guidance for workspace evidence, scanner findings, deliverables, and acceptance criteria
- admin visibility into LoomAI status, safe knowledge sync, provider traces, and production readiness
- governed actions through ProdUS APIs or MCP only, with explicit confirmation for mutations
- deterministic ProdUS fallback when LoomAI is disabled, unavailable, slow, or returns an invalid response

## 3. Product Boundary

### LoomAI Owns

- AI runtime deployment profiles for staging and production
- assistant session, query, and suggestion APIs
- retrieval over approved ProdUS knowledge records
- MCP/action connector registration and tool governance policy
- deployment-level rate limits, request tracing, audit export, and operational health
- model/prompt/runtime configuration inside the LoomAI tenant

### ProdUS Owns

- user identity, roles, authorization, and session validation
- product, package, workspace, milestone, scanner, finding, and evidence data
- scanner execution, CI evidence upload, normalization, redaction, and retention
- package creation, project workspace creation, shortlist and deliverable operations
- source-of-truth audit records for user actions and provider responses
- frontend UX and fallback behavior

### Explicitly Out Of Scope For AI

The LoomAI deployment must not expose or execute:

- team creation
- team invitations
- solo expert join requests
- profile edits
- account settings
- community messages
- commercial/payment actions
- broad admin data mutation
- production deployment approval
- security/compliance certification without human review

## 4. Deployment Profiles Required

The integration team must provide two isolated deployments.

| Profile | Purpose | Data | Required Before |
| --- | --- | --- | --- |
| `produs-staging` | Integration testing and safe validation | staging ProdUS data only | any production enablement |
| `produs-production` | live customer use | production ProdUS tenant data by current user authorization only | production readiness sign-off |

Each deployment must have separate:

- deployment ID
- API base URL
- API key or service credential
- retrieval index/vector spaces
- MCP/action connector registration
- rate limits
- audit stream/export destination
- webhook secret if webhooks are enabled
- environment label visible to ProdUS admin status

## 5. Required LoomAI Runtime APIs

ProdUS backend is already configurable for these LoomAI paths:

```yaml
loomai:
  base-url: ${LOOMAI_BASE_URL}
  api-key: ${LOOMAI_API_KEY}
  enabled: ${LOOMAI_ENABLED}
  environment: ${LOOMAI_ENVIRONMENT}
  timeout-ms: ${LOOMAI_TIMEOUT_MS}
  assistant-session-path: ${LOOMAI_ASSISTANT_SESSION_PATH}
  assistant-query-path: ${LOOMAI_ASSISTANT_QUERY_PATH}
  assistant-suggestions-path: ${LOOMAI_ASSISTANT_SUGGESTIONS_PATH}
  data-sync-batch-path: ${LOOMAI_DATA_SYNC_BATCH_PATH}
  data-sync-delete-path: ${LOOMAI_DATA_SYNC_DELETE_PATH}
```

Default expected paths:

```text
POST /api/public/chat/session
POST /api/chat/me/query
POST /api/chat/me/suggestions
POST /api/ai/data-sync/batch
POST /api/ai/data-sync/delete
```

The integration team must confirm:

- request/response schemas
- streaming versus non-streaming mode
- authentication header format
- timeout and retry behavior
- provider request ID header or response field
- error response format
- rate-limit headers
- idempotency semantics for data-sync
- deletion/tombstone behavior

## 6. ProdUS Backend Broker Endpoints

ProdUS exposes these backend endpoints for the frontend and admin views:

```text
GET  /api/ai/loomai/status
GET  /api/ai/loomai/knowledge-preview
POST /api/ai/loomai/knowledge-sync
POST /api/ai/assistant/session
POST /api/ai/assistant/query
POST /api/ai/assistant/suggestions
GET  /api/admin/production-readiness
```

LoomAI does not call these browser-facing broker endpoints directly unless explicitly agreed. They are included so the integration team understands the existing ProdUS control plane.

## 7. MCP Connector Requirement

ProdUS MCP gateway supports a LoomAI-safe profile:

```bash
PRODUS_MCP_TOOL_PROFILE=loomai-productization
```

The integration team must configure LoomAI to import only the `loomai-productization` profile. Do not import every MCP tool.

Expected MCP URLs:

```text
POST /mcp
GET  /loomai/tool-allowlist
GET  /health
```

MCP must use authenticated server-to-server access. ProdUS backend authorization remains authoritative even when LoomAI only sees allowlisted tools.

### Initial AI-Visible MCP Tools

| Tool | Mode | Confirmation |
| --- | --- | --- |
| `produs.catalog.search` | read | no |
| `produs.product.list` | read | no |
| `produs.package.inspect` | read | no |
| `produs.workspace.inspect` | read | no |
| `produs.requirement.submit` | mutation | yes |
| `produs.package.build_from_requirement` | mutation | yes |
| `produs.team.shortlist` | mutation | yes |
| `produs.workspace.create` | mutation | yes |
| `produs.deliverable.update` | mutation | yes |
| `produs.scan.start` | mutation | yes |
| `produs.scan.status` | read | no |
| `produs.scan.cancel` | mutation | yes |
| `produs.finding.inspect` | read | no |
| `produs.finding.accept_risk` | mutation | yes |
| `produs.evidence.list` | read | no |
| `produs.evidence.upload_ci_result` | mutation | yes |
| `produs.milestone.review_evidence` | read | no |

Risk acceptance, scan cancellation, package/workspace creation, CI upload, and deliverable updates must include explicit confirmation, human-readable reason, request ID, user/tenant context, and idempotency key where applicable.

## 8. Action Policy

LoomAI may recommend or prepare actions. ProdUS executes actions only through backend APIs/MCP after authorization and confirmation.

Rules:

- AI must not directly execute scanner binaries.
- AI must not clone repositories.
- AI must not read raw source code.
- AI must not certify a milestone, release, compliance state, or security status.
- AI can explain evidence and propose next steps.
- AI can propose package/service changes based on findings and catalog rules.
- AI can start a scan only after explicit owner/admin confirmation.
- AI can accept risk only through backend policy with reason and review date.
- AI answers must reference evidence/source basis where possible.

## 9. Knowledge Indexing Requirement

The LoomAI deployment must index only approved safe knowledge records from ProdUS.

### Safe To Index

- service categories
- service modules
- service dependencies
- package templates
- lifecycle workflow templates
- acceptance criteria templates
- evidence requirement templates
- scanner tool descriptions
- AI capability configuration
- public/product help docs
- approved anonymized case patterns

### Not Safe To Index

- raw repository source code
- raw scanner outputs
- secrets scan artifacts
- customer credentials
- bearer tokens
- Supabase session values
- private evidence URLs
- raw CI logs
- webhook payloads
- private messages
- PII beyond required actor identity metadata

Sensitive customer records must be fetched live through authorized ProdUS APIs/MCP and returned as redacted summaries.

## 10. Data-Sync Contract

ProdUS admin can preview and sync safe knowledge through:

```text
GET  /api/ai/loomai/knowledge-preview
POST /api/ai/loomai/knowledge-sync
```

The integration team must provide:

- batch upsert endpoint path
- delete endpoint path
- maximum batch size
- accepted record schema
- idempotent record identity rules
- delete/tombstone behavior
- index consistency SLA
- indexing overview endpoint if available
- vector space naming convention

Expected vector spaces:

| Vector Space | Records |
| --- | --- |
| `produs_catalog` | service categories/modules/dependencies |
| `produs_package_templates` | package templates and template modules |
| `produs_evidence_templates` | acceptance and evidence guidance |
| `produs_scanner_guidance` | scanner tool descriptions and remediation guidance |
| `produs_case_patterns` | approved anonymized case patterns |

## 11. Runtime Context Contract

ProdUS sends only safe page context to LoomAI:

- current user role
- page type
- product ID
- package ID
- workspace ID
- milestone ID
- selected finding ID
- selected scan run ID
- visible status/severity summaries
- non-sensitive product/service names and lifecycle labels

ProdUS must not send:

- bearer tokens
- Supabase session values
- raw evidence URLs
- raw scanner logs
- source code
- credentials
- secrets
- webhook payloads

LoomAI responses must include, where available:

- provider/deployment ID
- provider request ID
- mode: live or fallback
- answer/suggestions
- source references or evidence basis
- proposed action metadata
- confidence or uncertainty marker
- safe error object on failure

## 12. Scanner Coverage For AI Assistance

The deployment must be configured around the scanner categories ProdUS supports:

| Scanner Area | Initial Tooling | AI Role |
| --- | --- | --- |
| secrets | Gitleaks-compatible findings/imports | explain risk, map to secrets/security services |
| static/code security | Semgrep-compatible findings/imports | explain rule, map to code/security services |
| dependency vulnerabilities | OSV-compatible findings/imports | explain package risk, recommend dependency/security services |
| container/image risk | Trivy-compatible findings/imports | explain image/CVE risk, map to cloud/security services |
| CI evidence | SARIF/JSON/log/text uploads | summarize evidence and identify missing proof |
| milestone evidence | acceptance criteria and evidence items | explain pass/fail support and gaps |

LoomAI must treat scanner outputs as evidence summaries, not as source-of-truth certification.

## 13. Security And Privacy Requirements

The LoomAI deployment must meet these controls:

- per-environment tenant isolation
- service credential rotation support
- request ID propagation
- least-privilege MCP/action tool import
- no raw secret display
- no raw artifact indexing
- no prompt/tool logs containing credentials or bearer tokens
- audit export for every action proposal and executed tool call
- configurable retention for chat and retrieval logs
- failure behavior that does not leak sensitive error detail
- support for disabling the deployment without breaking core ProdUS flows

ProdUS will retain deterministic fallback. LoomAI failure must never block creating packages, reviewing evidence, or operating scanner workflows through ProdUS.

## 14. Operational Requirements

The integration team must provide:

- staging and production deployment URLs
- API credential delivery path
- health/status endpoint
- rate limits per minute and per day
- recommended timeout
- retry guidance
- maximum payload size
- maximum context size
- data-sync throughput limits
- operational dashboard access or exported health events
- audit log export path
- incident escalation contact
- release/change notification process

ProdUS currently defaults to a 2500 ms provider timeout. If LoomAI needs longer, the integration team must propose a value and justify the user-facing latency impact.

## 15. Prompt And Behavior Requirements

The deployment system prompt must position LoomAI as a ProdUS productization assistant.

Behavior rules:

- answer from indexed knowledge and authorized live context only
- ask for missing context instead of inventing scanner results
- distinguish evidence-backed statements from recommendations
- never claim a product is production-ready without required evidence
- never expose raw secrets or raw scanner payloads
- propose concrete next actions tied to ProdUS services, packages, findings, milestones, or evidence
- explain why an action requires human confirmation
- refuse excluded operations such as team creation, profile changes, account settings, community messaging, and payment/commercial actions

## 16. Required Configuration Deliverables From LoomAI Team

The integration team must provide the following for `produs-staging` first:

1. Deployment ID and environment name.
2. Runtime base URL.
3. API key/service credential delivery method.
4. Assistant session/query/suggestions endpoint schemas.
5. Data-sync batch/delete endpoint schemas.
6. MCP registration method and required headers.
7. Confirmation/action policy configuration.
8. Retrieval/vector space configuration.
9. Safe knowledge indexing limits and accepted record shape.
10. Provider request ID propagation contract.
11. Error schema and retry/rate-limit contract.
12. Audit export/access method.
13. Health endpoint and dashboard access.
14. Security/retention settings.
15. Production promotion checklist.

Production deployment must not be configured until staging passes the acceptance tests in this BRD.

## 17. ProdUS Configuration Inputs

ProdUS will configure the backend with:

```bash
LOOMAI_ENABLED=true
LOOMAI_ENVIRONMENT=staging
LOOMAI_BASE_URL=<loomai-staging-runtime-url>
LOOMAI_API_KEY=<loomai-staging-service-key>
LOOMAI_TIMEOUT_MS=2500
LOOMAI_ASSISTANT_SESSION_PATH=/api/public/chat/session
LOOMAI_ASSISTANT_QUERY_PATH=/api/chat/me/query
LOOMAI_ASSISTANT_SUGGESTIONS_PATH=/api/chat/me/suggestions
LOOMAI_DATA_SYNC_BATCH_PATH=/api/ai/data-sync/batch
LOOMAI_DATA_SYNC_DELETE_PATH=/api/ai/data-sync/delete
```

ProdUS will configure the MCP gateway with:

```bash
PRODUS_MCP_TOOL_PROFILE=loomai-productization
PRODUS_MCP_REQUIRE_AUTH=true
PRODUS_MCP_ALLOWED_ORIGINS=<loomai-runtime-origin>,<produs-app-origin>
PRODUS_MCP_ALLOWED_HOSTS=<loomai-runtime-host>,<produs-mcp-host>
```

Exact values must be supplied by the integration team per environment.

## 18. Acceptance Criteria

Staging acceptance:

- LoomAI status endpoint appears connected in ProdUS admin.
- Safe knowledge preview contains only approved catalog/package/evidence/scanner guidance records.
- Knowledge sync succeeds and returns indexed/upserted counts.
- LoomAI can answer service catalog/package questions from indexed knowledge.
- LoomAI can answer product/workspace/scanner questions using authorized live ProdUS context.
- LoomAI cannot access another owner's product data.
- LoomAI cannot see excluded team/profile/community/admin/commercial tools.
- Mutating MCP tools require explicit confirmation and reason.
- Mutation audit appears in ProdUS backend audit records.
- Scanner finding explanations do not expose raw secrets or raw artifacts.
- LoomAI failure, timeout, non-2xx, or invalid JSON returns a safe fallback state.
- Provider request IDs are captured in ProdUS recommendation/assistant records where LoomAI returns them.

Production promotion acceptance:

- staging acceptance completed
- production credentials issued through approved secret path
- production MCP profile verified as `loomai-productization`
- retention and audit export reviewed by security
- rate limits and timeout tuned from staging measurements
- rollback plan tested by setting `LOOMAI_ENABLED=false`
- admin production readiness gates show LoomAI/MCP/scanner configuration as ready

## 19. Open Questions For Integration Team

- What is the final LoomAI assistant session response schema?
- Does LoomAI support direct browser sessions, or should ProdUS always broker sessions server-side?
- What is the official MCP registration mechanism for a customer deployment?
- Can tool visibility be role-aware at the LoomAI host layer, or only through ProdUS authorization?
- What are the supported vector-space lifecycle APIs for batch upsert/delete?
- What request ID header should ProdUS capture?
- What audit events can LoomAI export back to ProdUS?
- What are the default retention periods for chat traces, retrieval logs, and tool-call traces?
- Are streaming assistant responses required for production, or is non-streaming acceptable for first release?

## 20. References

- `docs/planning/Scanners-AI-integration/PRODOPS_NETWORK_CUSTOM_AI_DEPLOYMENT_PROPOSAL.md`
- `docs/planning/Scanners-AI-integration/Implementation/02-mcp-productization-allowlist-and-smoke.md`
- `docs/planning/Scanners-AI-integration/Implementation/04-scanner-evidence-foundation.md`
- `docs/planning/Scanners-AI-integration/Implementation/06-real-loomai-staging-integration.md`
- `docs/planning/Scanners-AI-integration/Implementation/07-production-readiness-and-operations.md`
- `docs/planning/Scanners-AI-integration/integration_brd.md`
- `docs/PRODOPS_AI_ENABLEMENT_USING_LOOMAI_DEPLOYMENTS.md`
