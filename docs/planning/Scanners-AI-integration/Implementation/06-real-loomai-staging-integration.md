# Sequence 06 - Real LoomAI Staging Integration

Date: 2026-05-17

Status: implemented - staging-ready LoomAI bridge with safe fallback

## Objective

Connect a staging LoomAI deployment to ProdUS after the provider contract, MCP allowlist, assistant mock UX, and scanner/evidence foundation are stable.

The real integration must preserve deterministic fallback, ProdUS backend authorization, action confirmation, and auditability.

## In Scope

- Confirm real LoomAI API contracts.
- Register staging MCP/action allowlist.
- Configure retrieval over safe knowledge only.
- Connect provider endpoint for package governance.
- Add runtime/session configuration for assistant UI if available.
- Verify failure modes and fallback.

## Out Of Scope

- Production rollout.
- Broad MCP import.
- Raw repository indexing.
- Raw scanner artifact indexing.
- AI team/profile/community operations.

## Required Contract Confirmation

Confirm with LoomAI before implementation:

- package governance endpoint shape
- chat/runtime endpoint shape
- streaming versus non-streaming behavior
- retrieval ingestion API
- retrieval search API
- MCP registration method
- action execution flow
- OAuth/OIDC or service-token model
- webhook signing and retry behavior
- rate limits
- timeout/retry expectations
- tenant/environment isolation model
- audit/event export model
- assistant session bootstrap contract
- contextual suggestion contract
- operator indexing overview contract

Expected LoomAI deployment surfaces from the planning docs:

```text
ProdUS browser/app -> LoomAI runtime
  POST /api/public/chat/session
  POST /api/chat/me/query
  POST /api/chat/me/suggestions

ProdUS backend/sync job -> LoomAI runtime
  POST /api/ai/data-sync/upsert
  POST /api/ai/data-sync/batch
  POST /api/ai/data-sync/delete

LoomAI runtime -> ProdUS connector/API/MCP
  POST /retrieval/search
  POST /actions/execute
  POST /mcp

LoomAI operator/release gate -> LoomAI runtime
  GET /api/admin/indexing/overview
  GET /api/admin/indexing/vectors
```

Do not implement these paths as hard dependencies in core ProdUS services until the real LoomAI contract is confirmed. Use provider adapters and feature flags.

## Integration Architecture

```text
ProdUS UI
  -> ProdUS backend APIs
  -> ProdUS MCP gateway
  -> LoomAI staging runtime
  -> ProdUS backend APIs through MCP/action connectors
```

Rules:

- UI may call LoomAI for assistant responses.
- LoomAI must call ProdUS through approved APIs/MCP only.
- ProdUS backend enforces authorization.
- ProdUS remains source of truth.

## Retrieval Configuration

Safe to index:

- service catalog
- service dependencies
- package templates
- milestone templates
- acceptance criteria templates
- evidence requirement templates
- scanner tool descriptions
- safe help docs
- anonymized case patterns after review

Not safe to index:

- raw repo contents
- raw scanner artifacts
- secrets
- private file URLs
- bearer tokens
- customer credentials
- full webhook payloads
- personally sensitive messages

Sensitive records should be fetched live through authorized APIs/MCP and converted into safe summaries.

Use Sequence 03A as the source of truth for safe data-sync record shapes, deletion tombstones, and case-pattern anonymization.

## Assistant Runtime Flow

Staging assistant bootstrap:

1. ProdUS UI loads assistant shell only on approved product/project pages.
2. UI requests a short-lived runtime session from LoomAI or through a ProdUS broker.
3. UI sends chat turns with safe page context only.
4. LoomAI retrieves approved knowledge or performs live ProdUS lookup through MCP/API.
5. LoomAI proposes an answer or governed action.
6. Sensitive actions require confirmation before execution.
7. ProdUS backend records action side effects and audit.

Safe page context may include:

- current product ID
- current package ID
- current workspace ID
- current milestone ID
- visible page type
- selected finding ID
- non-sensitive summary text

Safe page context must not include:

- bearer tokens
- Supabase session values
- raw evidence file URLs
- private artifact URLs
- raw scanner logs
- customer credentials
- secrets or webhook payloads

## Action Configuration

Register only the productization allowlist from Sequence 02.

Initial allowed actions:

- inspect catalog
- inspect product/package/workspace
- submit requirement
- build package from requirement
- add team to package shortlist
- create workspace
- update deliverable evidence/status

Scanner actions added only after Sequence 04/05:

- start scan
- view scan status
- inspect finding
- upload CI evidence
- review milestone evidence support

Excluded:

- team creation
- team invitations
- join requests
- profile edits
- account settings
- community messages
- broad admin/commercial operations

## Backend Implementation

- Add environment-specific LoomAI config.
- Add provider contract tests against a staging stub before real endpoint.
- Add trace IDs and provider request IDs to AI recommendation records where available.
- Add safe error mapping for LoomAI failures.
- Add provider status endpoint or admin visibility.
- Add optional server-side assistant session broker if direct browser-to-LoomAI auth is not acceptable.
- Add data-sync job wiring only through the Sequence 03A knowledge export adapter.
- Add retrieval connector only for safe, user-authorized summaries.

Implemented:

- Environment-specific LoomAI package governance, assistant session/query/suggestions, and data-sync paths are configurable in backend config.
- `LoomAIProvider` calls a real HTTP provider endpoint when enabled/configured and records provider request IDs where available.
- `/api/ai/assistant/session`, `/api/ai/assistant/query`, and `/api/ai/assistant/suggestions` broker safe page context without exposing Supabase sessions, bearer tokens, raw evidence URLs, raw scanner logs, credentials, or secrets.
- `/api/ai/loomai/status`, `/api/ai/loomai/knowledge-preview`, and `/api/ai/loomai/knowledge-sync` provide admin visibility and safe knowledge export/sync.
- The MCP server supports a `loomai-productization` tool profile and exposes safe allowlist metadata at `/loomai/tool-allowlist`.
- Owner UI consumes the assistant suggestions broker and shows live/fallback state.
- Admin AI audit UI shows provider traces, fallback state, safe knowledge sync, LoomAI readiness, and production readiness gates.
- Backend tests verify disabled fallback, safe context, admin-only status/sync, and that excluded tools are absent from the allowlist.

## Frontend Implementation

- Replace assistant mock transport with staging LoomAI transport behind feature flag.
- Preserve same UI action model.
- Keep disabled states for unavailable actions.
- Display source basis and confidence.
- Show fallback state when LoomAI is unavailable.

Feature flags:

```bash
NEXT_PUBLIC_AI_ASSISTANT_MOCK_ENABLED=false
NEXT_PUBLIC_LOOMAI_ASSISTANT_ENABLED=true
```

## Tests

Staging integration tests:

- LoomAI can answer catalog/package questions from safe indexed docs.
- LoomAI can inspect product/package/workspace through allowed action path.
- LoomAI can bootstrap a runtime assistant session without receiving Supabase secrets.
- LoomAI suggestions are scoped to the current product/project page.
- LoomAI data-sync indexes only approved knowledge record types.
- LoomAI live retrieval enforces current-user ACLs through ProdUS backend.
- LoomAI cannot see excluded tools.
- LoomAI mutation requires confirmation.
- Backend audit captures mutating tool call.
- Unauthorized user cannot access another owner's data.
- Provider fallback works when LoomAI returns error.
- Sensitive values are absent from AI recommendation output.

Manual review:

- Owner product workspace.
- Package governance.
- Workspace risk summary.
- Milestone evidence guidance.
- Scanner finding explanation after scanner APIs exist.

## Exit Criteria

- Staging LoomAI can perform allowed productization actions through ProdUS APIs/MCP after provider credentials and MCP registration are configured.
- Excluded tools are unavailable.
- Retrieval uses only approved safe sources.
- Runtime sessions are short-lived and do not expose backend auth secrets to the prompt.
- Knowledge indexing has deletion/update verification.
- Backend auth and audit remain authoritative.
- Fallback keeps the user workflow usable when LoomAI fails.

## Production Considerations

- Do not enable in production until Sequence 07 release gates pass.
- Keep separate staging and production LoomAI deployments.
- Use separate vector spaces/indexes per environment.
- Use separate API keys/secrets per environment.
