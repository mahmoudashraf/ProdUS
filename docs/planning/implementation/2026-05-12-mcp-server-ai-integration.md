# MCP Server AI Integration Plan

Date: 2026-05-12

Status: implemented

## Implementation Status

Completed in this implementation slice:

- Added a standalone TypeScript MCP gateway in `mcp-server/` with Streamable HTTP at `/mcp`.
- Added authenticated bearer-token forwarding to the Spring Boot API with request ID and MCP request ID propagation.
- Added 8 MCP resources, 6 MCP prompts, and 23 launch-critical MCP tools covering owner, team, specialist/support, and admin workflows.
- Required `confirm: true` and a human-readable `reason` for every mutating MCP tool.
- Added stable redacted input hashing for audit records so secrets and tokens are not stored in audit payloads.
- Added backend MCP invocation persistence and APIs at `/api/mcp/invocations`.
- Added Liquibase migration coverage for `mcp_tool_invocations`.
- Added Dockerfile and Docker Compose service wiring for the MCP gateway across dev/default/prod compose files.
- Fixed catalog dependency reads so MCP catalog search can request the full dependency graph or a module-specific graph.

Remaining production-readiness work:

- Register the deployed MCP endpoint with the selected AI host and configure production origin/host allowlists per environment.
- Decide whether the AI host requires OAuth/OIDC MCP auth metadata in addition to bearer-token forwarding.
- Add persistent backend idempotency records for high-impact repeated mutations such as proposal acceptance and workspace creation.
- Add operational dashboards for MCP invocation rate, latency, forbidden attempts, and failed backend calls.
- Add role-aware tool filtering at the MCP host layer where supported; backend authorization remains the enforcement boundary.

## Objective

Introduce a Model Context Protocol server for ProdUS so AI assistants can safely read platform context and execute governed productization actions through the existing backend API.

The MCP server must not bypass backend authorization, domain validation, audit logging, or workflow rules. It should act as an AI-facing integration facade over the current Spring Boot API.

## Product Boundary

The MCP layer is for assistant access to ProdUS workflows:

- Help owners productize a specific product from diagnosis through package, team match, delivery, and support.
- Help teams manage proposals, delivery evidence, blockers, support requests, and reputation signals.
- Help admins inspect catalog quality, platform health, SLA escalations, notification delivery, and audit records.

It is not a replacement for the backend API, the frontend UI, Supabase auth, PostgreSQL, or LoomAI. LoomAI can remain one optional AI provider behind ProdUS recommendation and governance flows.

## Recommended Architecture

Use a separate MCP gateway service first, then consider in-process consolidation later.

1. MCP gateway service
   - Exposes one Streamable HTTP MCP endpoint, for example `/mcp`.
   - Implements MCP lifecycle, tool discovery, resources, prompts, and tool calls.
   - Calls the existing backend API over HTTP.
   - Forwards the end-user Supabase JWT to the backend whenever the AI acts on behalf of a user.
   - Adds `X-Request-ID` and MCP invocation metadata to every backend request.

2. Existing Spring Boot backend
   - Remains source of truth for authorization, workflow transitions, validation, and persistence.
   - Continues writing recommendation/audit records and operational records.
   - Adds a dedicated MCP audit table or extends AI recommendation audit records for tool invocations.

3. Frontend / AI host integration
   - Logged-in users can connect an AI assistant to the MCP endpoint with their user context.
   - Admin, owner, team manager, specialist, and advisor users receive role-appropriate tools.
   - The UI should expose a "Connect AI assistant" settings panel later, but this is not required for the first backend MCP slice.

## Protocol Decisions

- Transport: Streamable HTTP for remote AI clients.
- Local development fallback: stdio can be added later for local debugging, but production should use Streamable HTTP.
- Auth: bearer token from Supabase JWT for user-scoped calls.
- Tool surface: deterministic tool names with explicit role metadata. If the selected MCP version and host support role-aware presentation, hide unauthorized tools client-side; backend authorization remains authoritative either way.
- Data access: use backend REST API only. No direct database reads from the MCP server.
- Audit: every mutating tool call must record user, role, tool name, input hash, target entity, backend response status, request ID, and timestamp.
- Safety: high-impact tools require explicit confirmation fields and idempotency keys.

## MCP Resources

Resources provide context to the assistant without creating side effects.

1. `produs://catalog/categories`
   - Source: `GET /api/catalog/categories`
   - Purpose: available service families.

2. `produs://catalog/modules`
   - Source: `GET /api/catalog/modules`
   - Purpose: production service descriptions, required inputs, deliverables, acceptance criteria, timelines, and price ranges.

3. `produs://products/{productId}`
   - Source: `GET /api/products/{id}`
   - Purpose: owner product profile context.

4. `produs://packages/{packageId}`
   - Source: `GET /api/packages/{id}` and `GET /api/packages/{id}/modules`
   - Purpose: package summary, service sequence, rationale, deliverables, and acceptance criteria.

5. `produs://packages/{packageId}/team-recommendations`
   - Source: `GET /api/packages/{id}/team-recommendations`
   - Purpose: matched teams and reasons.

6. `produs://workspaces/{workspaceId}`
   - Source: `GET /api/workspaces/{id}`, milestones, deliverables, support requests, disputes, attachments.
   - Purpose: unified delivery state for a productization workspace.

7. `produs://notifications/summary`
   - Source: `GET /api/notifications/summary`
   - Purpose: current user action queue.

8. `produs://admin/operations`
   - Source: dashboard/admin APIs.
   - Purpose: admin-only platform health and operational state.

## MCP Prompts

Prompts should be opinionated templates that combine the resources and tools above.

1. `owner_productization_brief`
   - Inputs: product ID or free-form product context.
   - Output: structured diagnosis, recommended lifecycle services, risks, and next backend action.

2. `package_builder_review`
   - Inputs: requirement ID or package ID.
   - Output: package quality review, missing dependencies, milestone sequence, acceptance criteria gaps.

3. `team_match_explainer`
   - Inputs: package ID.
   - Output: shortlist recommendation, comparison notes, questions to ask teams before proposal acceptance.

4. `workspace_risk_review`
   - Inputs: workspace ID.
   - Output: blocked milestones, missing evidence, support risks, next actions by owner/team/admin.

5. `support_response_draft`
   - Inputs: support request ID.
   - Output: suggested response, owner/team handoff notes, resolution checklist.

6. `admin_platform_review`
   - Inputs: optional catalog or operations scope.
   - Output: catalog hygiene, SLA issues, notification delivery health, security/configuration follow-ups.

## MCP Tools

### Read Tools

1. `produs.catalog.search`
   - Backend: catalog categories/modules.
   - Roles: all authenticated roles.
   - Side effects: none.

2. `produs.product.list`
   - Backend: `GET /api/products`
   - Roles: owner sees own products; admin sees all.
   - Side effects: none.

3. `produs.package.inspect`
   - Backend: package detail, modules, team recommendations, proposals.
   - Roles: package owner, admin, authorized team context.
   - Side effects: none.

4. `produs.workspace.inspect`
   - Backend: workspace detail, milestones, deliverables, participants, support, disputes, attachments.
   - Roles: workspace participants, owner, assigned team, admin.
   - Side effects: none.

5. `produs.notifications.list`
   - Backend: notifications list/summary.
   - Roles: authenticated user.
   - Side effects: none.

### Owner Tools

1. `produs.product.create`
   - Backend: `POST /api/products`
   - Confirmation: required.
   - Audit: required.

2. `produs.requirement.submit`
   - Backend: `POST /api/requirements`
   - Confirmation: required.
   - Audit: required.

3. `produs.package.build_from_requirement`
   - Backend: `POST /api/packages/from-requirement/{requirementId}`
   - Confirmation: required.
   - Audit: required.

4. `produs.team.shortlist`
   - Backend: `POST /api/shortlists`
   - Confirmation: required.
   - Audit: required.

5. `produs.proposal.accept`
   - Backend: proposal status update.
   - Confirmation: required with accepted proposal ID.
   - Audit: required.

6. `produs.workspace.create`
   - Backend: `POST /api/workspaces`
   - Confirmation: required.
   - Audit: required.

7. `produs.support_request.create`
   - Backend: support request create endpoint.
   - Confirmation: required.
   - Audit: required.

### Team Tools

1. `produs.team.profile.update`
   - Backend: team update endpoint.
   - Roles: team manager/admin.
   - Confirmation: required.

2. `produs.team.capability.add`
   - Backend: team capability endpoint.
   - Roles: team manager/admin.
   - Confirmation: required.

3. `produs.proposal.submit`
   - Backend: package proposal endpoint.
   - Roles: team manager/admin.
   - Confirmation: required.

4. `produs.deliverable.update`
   - Backend: deliverable update endpoint.
   - Roles: workspace contributors/coordinators/admin.
   - Confirmation: required.

5. `produs.support_request.update_status`
   - Backend: support request status endpoint.
   - Roles: support participant/admin.
   - Confirmation: required for resolved/cancelled states.

### Admin Tools

1. `produs.admin.catalog.create_category`
   - Backend: admin catalog endpoint.
   - Roles: admin.
   - Confirmation: required.

2. `produs.admin.catalog.create_module`
   - Backend: admin catalog endpoint.
   - Roles: admin.
   - Confirmation: required.

3. `produs.admin.sla.run_scan`
   - Backend: SLA scan endpoint.
   - Roles: admin.
   - Confirmation: required.

4. `produs.admin.notifications.dispatch`
   - Backend: notification delivery dispatch endpoint.
   - Roles: admin.
   - Confirmation: required.

5. `produs.admin.recommendations.review`
   - Backend: AI recommendation audit endpoints.
   - Roles: admin/advisor as allowed.
   - Side effects: optional feedback update in a later slice.

## Backend Additions

1. MCP audit persistence
   - Add `mcp_tool_invocations`.
   - Columns: ID, user ID, role, tool name, request ID, target type, target ID, input hash, status, backend status, error summary, created at.
   - Do not store secrets or raw credentials.

2. Idempotency support
   - Accept idempotency keys in MCP mutating tools.
   - Forward `Idempotency-Key` to backend endpoints.
   - Add backend idempotency records later for payment-like or proposal-like operations if repeated execution risk is high.

3. API metadata manifest
   - Add an internal endpoint or static descriptor that maps backend capabilities to MCP tools.
   - Include tool name, role policy, backend endpoint, request schema, response schema, and confirmation requirement.

4. Error normalization
   - Convert backend validation and authorization errors into MCP tool execution errors.
   - Keep protocol errors for invalid MCP requests only.

## Security Requirements

- Validate `Origin` for Streamable HTTP connections.
- Require authentication for all non-public MCP access.
- Use Supabase JWT user context; do not use a service role for end-user actions.
- Bind local dev MCP servers to `127.0.0.1`.
- Enforce backend role checks on every API call.
- Keep `tools/list` deterministic where required by the selected MCP version; include role metadata and return controlled authorization errors for forbidden tool calls.
- Require explicit `confirm: true` and a human-readable `reason` on mutating tools.
- Add rate limiting per user and per tool.
- Redact secrets, tokens, file URLs, and webhook secrets from MCP logs.
- Treat all resource content as prompt-injection capable; never let resource text override system/developer policy.
- Mark read-only tools as read-only in tool metadata where supported by the selected SDK.

## Implementation Sequence

### Slice 1: MCP Gateway Skeleton

- Create `mcp-server/` or `backend-mcp/` service.
- Implement Streamable HTTP `/mcp`.
- Support initialization, protocol version negotiation, `tools/list`, `resources/list`, and `prompts/list`.
- Add local env configuration:
  - `PRODUS_API_BASE_URL`
  - `PRODUS_MCP_ALLOWED_ORIGINS`
  - `PRODUS_MCP_REQUIRE_AUTH`
  - `PRODUS_MCP_LOG_LEVEL`
- Add Dockerfile and docker-compose service for local development.

Acceptance:
- MCP inspector or a simple JSON-RPC smoke can initialize the server and list resources/tools.
- No backend mutation tools are exposed yet.

### Slice 2: Authenticated Read Resources

- Validate bearer token presence.
- Forward bearer token to backend API.
- Add resources for catalog, products, packages, team matches, workspaces, and notifications.
- Add request ID propagation.
- Add read-only tools for catalog search, package inspection, workspace inspection, and notification summary.

Acceptance:
- Owner token only sees owner products/packages/workspaces.
- Team manager token only sees permitted team/workspace data.
- Admin token sees admin-permitted data.
- Unauthorized requests fail with clear MCP errors.

### Slice 3: Owner Workflow Tools

- Add product create, requirement submit, package build, team shortlist/compare, proposal accept, workspace create, and support request create.
- Require `confirm: true`, `reason`, and idempotency key for every mutating call.
- Add MCP audit persistence.

Acceptance:
- Owner can complete product -> requirement -> package -> shortlist -> workspace from MCP.
- Tool calls create the same backend records as the UI.
- Audit records exist for each tool invocation.

### Slice 4: Team Workflow Tools

- Add team capability, proposal submit, deliverable update, support request status update, and dispute status update where role rules allow.
- Scope tools to team managers/specialists based on backend authorization.

Acceptance:
- Team manager can submit proposal and manage support status.
- Specialist can update permitted deliverables but cannot perform owner/admin-only actions.
- Forbidden operations return controlled tool errors.

### Slice 5: Admin Operations Tools

- Add catalog create/update tools, SLA scan, notification dispatch, and provider configuration reads.
- Require stronger confirmation text for catalog mutations and delivery dispatch.

Acceptance:
- Admin can run SLA and dispatch tools from MCP.
- Owner/team users never see admin tools.
- Audit records capture all admin MCP operations.

### Slice 6: Prompt Library

- Add MCP prompts for owner productization, package review, team match explanation, workspace risk review, support response drafting, and admin platform review.
- Keep prompts grounded in MCP resources and backend IDs.

Acceptance:
- Prompts can be listed and fetched.
- Prompts include required inputs and guide assistants toward safe tool usage.

### Slice 7: Production Hardening

- Add CI checks for MCP protocol smoke tests.
- Add integration tests using mock auth and mocked backend failures.
- Add Docker image build for the MCP service.
- Add deployment variables and Railway/service documentation.
- Add monitoring for MCP request rate, tool latency, failure rate, and forbidden-operation attempts.

Acceptance:
- MCP service passes tests and Docker build in CI.
- Production deployment can point MCP at the backend API with mock auth disabled.
- Runbook documents auth, allowed origins, rollback, and emergency tool disablement.

## Testing Strategy

- Unit tests for tool input validation and backend response mapping.
- Contract tests for each MCP tool against mocked backend responses.
- Integration tests against the dev backend using mock users:
  - `admin@produs.com` / `admin123`
  - `owner@produs.com` / `owner123`
  - `team@produs.com` / `team123`
  - `specialist@produs.com` / `specialist123`
  - `advisor@produs.com` / `advisor123`
- Negative tests for missing token, wrong role, missing confirmation, invalid entity ID, and replayed idempotency key.
- Live smoke:
  - Initialize MCP session.
  - List tools for owner and admin.
  - Read catalog resource.
  - Owner creates a product and requirement.
  - Owner builds package and shortlists a team.
  - Team updates support request status.
  - Admin runs a dry-run SLA scan if dry-run is available, otherwise skip destructive admin smoke.

## Open Decisions

1. Implementation runtime
   - Option A: TypeScript MCP gateway using the official MCP SDK ecosystem.
   - Option B: Java/Spring in-process MCP endpoint.
   - Recommendation: start with a separate TypeScript gateway for faster MCP compatibility and isolation, unless deployment simplicity requires keeping everything in Spring Boot.

2. Tool approval model
   - Minimum: `confirm: true` field on mutating tools.
   - Better: frontend/host-mediated approval before MCP tool execution.

3. Audit storage location
   - Minimum: new `mcp_tool_invocations` table.
   - Alternative: extend `ai_recommendations` with a subtype for MCP tool execution.

4. Public vs private MCP server
   - Recommendation: private authenticated MCP endpoint only for production.
   - Do not publish public unauthenticated tools.

## Definition of Done

- MCP server exposes role-aware resources, prompts, and tools for the launch-critical ProdUS workflows.
- All tools call existing backend APIs and preserve backend authorization.
- Mutating tool calls are confirmed, audited, idempotency-aware, and request-ID correlated.
- Owner, team, specialist, advisor, and admin flows pass with mock users in local integration tests.
- Production deployment path documents auth, origins, monitoring, rollback, and emergency disablement.

## Verification Results

- MCP gateway: `npm run type-check`, `npm test`, `npm run build`, and `npm audit --omit=dev` passed in `mcp-server`.
- Backend: `mvn clean test` passed, including Liquibase validation for `mcp_tool_invocations` and MCP audit API coverage.
- Docker Compose: `docker compose -f docker-compose.dev.yml config`, `docker compose -f docker-compose.yml config`, and `docker compose -f docker-compose.prod.yml config` passed.
- Docker images: `docker build -t produs-mcp-server:local ./mcp-server` and `docker build -t produs-backend:local ./backend` passed.
- Live MCP smoke: dev backend plus MCP gateway accepted an owner mock token, listed 23 MCP tools, executed `produs.catalog.search`, created a product through `produs.product.create`, and persisted a successful MCP audit row.
