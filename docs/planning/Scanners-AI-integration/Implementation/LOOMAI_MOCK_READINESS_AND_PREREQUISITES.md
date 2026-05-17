# LoomAI Mock Readiness And Prerequisites

Date: 2026-05-17

Status: implemented baseline - replaced by sequence documents and verified code

## Purpose

This document converts the current scanner and LoomAI planning material into an implementation-ready understanding of what ProdUS can support today, what can be mocked during development, and what must be built before LoomAI can be used for real scanner-backed productization intelligence.

The goal is not to implement AI inside ProdUS. ProdUS remains the product, workflow, evidence, authorization, and audit system. LoomAI is treated as an optional external AI runtime/provider that can be mocked behind a stable ProdUS-owned adapter.

## Source Documents Reviewed

- `docs/PRODOPS_AI_ENABLEMENT_USING_LOOMAI_DEPLOYMENTS.md`
- `docs/planning/Scanners-AI-integration/PRODOPS_NETWORK_CUSTOM_AI_DEPLOYMENT_PROPOSAL.md`
- `docs/planning/Scanners-AI-integration/2026-05-12-mcp-server-ai-integration.md`
- `docs/planning/Scanners-AI-integration/integration_brd.md`
- `docs/planning/Scanners-AI-integration/INTEGRATION_LAYER_UI_DESIGN.md`
- `docs/DEVELOPMENT_GUIDE.md`

## Decision

ProdUS has enough product and code support to mock LoomAI for development now, as long as the mock is limited to AI runtime behavior around existing ProdUS data and approved core productization actions.

## AI Scope Boundary

LoomAI support must focus on the core value chain:

```text
Product -> diagnosis -> scan/evidence -> findings -> service plan/package -> project workspace -> milestone review -> handoff readiness
```

AI is in scope for:

- Product and project diagnosis.
- Scanner/evidence interpretation.
- Finding explanation and remediation context.
- Service and package recommendation.
- Dependency and sequencing checks.
- Workspace risk review.
- Milestone acceptance criteria and evidence review support.
- Handoff readiness checks.
- Owner-facing and team-facing explanations about the active productization project.

AI is not in scope for general marketplace, account, or team-administration operations:

- Creating teams.
- Inviting solo experts to teams.
- Accepting or rejecting team join requests.
- Editing team profiles or expert profiles.
- Managing account settings.
- Sending community messages.
- Running general expert-network social flows.
- Creating or changing commercial/payment records unless a future, separately approved governance policy allows it.

Team data may still be used by AI for project matching explanations, comparison, and project risk context. Team administration remains normal UI/backend workflow, not AI-driven workflow.

Project team matching is in scope only when it is tied to a specific package or workspace. For example, AI may explain or help add a recommended team to a package shortlist after confirmation. AI must not create teams, invite members, manage team membership, or edit profiles.

The MCP gateway can expose broader platform tools for future internal/admin use, but LoomAI and LoomAI mocks must use a narrower allowlist for productization/project/scanning functionality.

Supported mock scope today:

- Package governance review over deterministic package output.
- Assistant-style explanation over catalog, product, package, diagnosis, workspace, evidence, and project context exposed through backend APIs or MCP.
- Team matching explanation only when tied to a product package or project workspace.
- Governed action simulation through allowlisted MCP tool calls that still hit real backend APIs.
- Retrieval-style responses over safe ProdUS docs, catalog data, service templates, package templates, and workflow guidance.
- Failure and fallback behavior when LoomAI is disabled, unavailable, slow, or returns invalid JSON.

Not supported as real LoomAI-backed behavior yet:

- Scanner-backed diagnosis from real repository or runtime scans.
- Real SARIF, JSON, or scanner log normalization into findings.
- Real scan run status, scanner worker health, or scanner artifact lifecycle.
- Production LoomAI chat/runtime, retrieval, webhook, OAuth/OIDC, or streaming compatibility.

## Verified ProdUS Code Support

### MCP Gateway

The MCP implementation is real in code, not only documented.

Verified files:

- `mcp-server/src/index.ts`
- `mcp-server/src/config.ts`
- `mcp-server/src/mcpServer.ts`
- `mcp-server/src/produsApi.ts`
- `mcp-server/src/hash.ts`
- `mcp-server/package.json`

Implemented behavior:

- Standalone TypeScript MCP gateway.
- Streamable HTTP endpoint at `/mcp`.
- Health endpoint at `/health`.
- Origin allowlist handling for MCP requests.
- Bearer-token requirement by default.
- End-user bearer token forwarding to the Spring Boot API.
- `X-Request-ID` and `X-MCP-Request-ID` forwarding.
- Backend API access only; no direct PostgreSQL reads from MCP.
- Stable input hashing with token/secret field redaction.
- Mutating tools require `confirm: true` and a human-readable `reason`.
- Idempotency key forwarding is supported by MCP mutation helper signatures.
- MCP tool invocation audit is attempted through `/api/mcp/invocations`.

MCP surface verified from `mcp-server/src/mcpServer.ts`:

- 8 resources.
- 6 prompts.
- 23 tools.

Important scope note:

- The gateway is intentionally broader than the first LoomAI integration scope.
- The LoomAI host/mock must not import every available MCP tool.
- The first LoomAI allowlist should include only product, package, workspace, catalog, evidence, diagnosis, scan, and milestone-review capabilities.
- Team/profile/community/account tools must remain unavailable to LoomAI unless a later security and product review explicitly approves them.

Representative implemented tools:

- `produs.catalog.search`
- `produs.product.list`
- `produs.package.inspect`
- `produs.workspace.inspect`
- `produs.notifications.list`
- `produs.product.create`
- `produs.requirement.submit`
- `produs.package.build_from_requirement`
- `produs.team.shortlist`
- `produs.proposal.accept`
- `produs.workspace.create`
- `produs.team.profile.update`
- `produs.team.capability.add`
- `produs.proposal.submit`
- `produs.deliverable.update`
- `produs.admin.sla.run_scan`

Initial LoomAI-importable tool set:

- `produs.catalog.search`
- `produs.product.list`
- `produs.package.inspect`
- `produs.workspace.inspect`
- `produs.requirement.submit`
- `produs.package.build_from_requirement`
- `produs.team.shortlist`
- `produs.workspace.create`
- `produs.deliverable.update`

Excluded from LoomAI import for the first AI integration:

- `produs.team.profile.update`
- `produs.team.capability.add`
- any team creation, team invitation, join-request, expert profile, account settings, community message, or broad admin/commercial operation.

Conditional later additions after scanner/evidence implementation:

- `produs.scan.start`
- `produs.scan.status`
- `produs.scan.cancel`
- `produs.finding.inspect`
- `produs.finding.accept_risk`
- `produs.evidence.upload_ci_result`
- `produs.milestone.review_evidence`

Verification run:

```bash
cd mcp-server
npm test
npm run type-check
```

Result:

- MCP tests passed: 6/6.
- MCP TypeScript type-check passed.

### Backend MCP Invocation API

Verified files:

- `backend/src/main/java/com/produs/mcp/McpToolInvocationController.java`
- `backend/src/main/java/com/produs/mcp/McpToolInvocation.java`
- `backend/src/main/java/com/produs/mcp/McpToolInvocationRepository.java`
- `backend/src/main/resources/db/changelog/V010__mcp_tool_invocations.yaml`

Implemented behavior:

- `POST /api/mcp/invocations` persists invocation audit records.
- `GET /api/mcp/invocations` lists all records for admin users.
- `GET /api/mcp/invocations` lists only the current user's records for non-admin users.
- Records include user, role, tool name, request ID, target type, target ID, input hash, status, backend status, and error summary.

Verification run:

```bash
cd backend
mvn -q -Dtest=ProductizationWorkflowIntegrationTest test
```

Result:

- Passed. This integration test covers MCP invocation creation and owner-isolated reads.

### Productization Engine

Verified files:

- `backend/src/main/java/com/produs/engine/ProductizationEngineController.java`
- `backend/src/main/java/com/produs/engine/ProductizationEngineService.java`
- `backend/src/main/java/com/produs/engine/ProductDiagnosis.java`
- `backend/src/main/java/com/produs/engine/ProductFinding.java`
- `backend/src/main/java/com/produs/engine/AcceptanceCriterion.java`
- `backend/src/main/java/com/produs/engine/EvidenceRequirement.java`
- `backend/src/main/java/com/produs/engine/AutomatedCheck.java`
- `backend/src/main/java/com/produs/engine/ReviewDecision.java`
- `backend/src/main/java/com/produs/engine/HandoffDocument.java`
- `backend/src/main/java/com/produs/engine/ProductHealthReview.java`
- `backend/src/main/java/com/produs/engine/IntegrationConnection.java`
- `backend/src/main/java/com/produs/engine/IntegrationSignal.java`

Implemented behavior:

- Deterministic productization diagnosis.
- Product findings linked to recommended service modules.
- Milestone acceptance criteria generation.
- Evidence requirement tracking.
- Automated check records.
- Human review decisions.
- Workspace governance summary.
- Handoff documents.
- Product health reviews.
- Generic integration connections and signals.

Important limitation:

- These are AI-ready productization records, but they are not yet real scanner run records. Current diagnosis uses owner/product context and catalog rules, not repository scanners.

### Evidence Attachments

Verified files:

- `backend/src/main/java/com/produs/attachments/EvidenceAttachmentController.java`
- `backend/src/main/java/com/produs/attachments/EvidenceAttachmentService.java`
- `backend/src/main/java/com/produs/attachments/EvidenceAttachment.java`

Implemented behavior:

- Workspace/scope evidence attachment upload.
- Evidence list by workspace or scope.
- Download URL generation.
- Delete support with authorization handled in service layer.

This is useful for human and CI evidence, but it is not a raw scanner artifact lifecycle yet.

### Current LoomAI Adapter

Verified files:

- `backend/src/main/java/com/produs/ai/loom/LoomAIProvider.java`
- `backend/src/main/java/com/produs/ai/loom/LoomAIProperties.java`
- `backend/src/main/resources/application.yml`
- `backend/src/main/resources/application-prod.yml`

Current configured backend contract:

```text
POST {LOOMAI_BASE_URL}/api/v1/produs/package-governance
Authorization: Bearer {LOOMAI_API_KEY}
Content-Type: application/json
Accept: application/json
X-Request-ID: {requestId}
```

Current expected response fields:

```json
{
  "confidence": 0.86,
  "rationale": "Package includes required dependencies and has acceptable delivery risk."
}
```

Current fallback behavior:

- If LoomAI is disabled, unconfigured, unavailable, interrupted, returns non-2xx, empty body, or invalid JSON, the provider returns a deterministic rules fallback result.

Implementation status:

- `LoomAIProvider` is wired into `PackageBuilderService` through `PackageGovernanceProvider`.
- `PackageBuilderService` still creates deterministic package modules first, then records provider governance metadata in `AIRecommendation`.
- `LOOMAI_ENABLED=true` now affects provider governance output when `LOOMAI_BASE_URL` is configured, while disabled/unavailable/invalid provider responses fall back deterministically.

## Prerequisites Before LoomAI Mock Implementation

### P0 - Keep The Boundary Clear

ProdUS must own the interface and fallback behavior. The mock should sit behind a ProdUS-owned provider interface, not leak fake LoomAI endpoint assumptions into core workflow code.

Required decisions:

- Create or formalize an `AIProvider` or `PackageGovernanceProvider` interface.
- Keep deterministic rules as the default provider.
- Enable LoomAI or mock LoomAI only by environment/feature flag.
- Persist provider, prompt/version, confidence, rationale, output JSON, fallback reason, and source references.

### P0 - Wire Existing Provider Or Replace It With A Provider Interface

Before a useful mock is visible in the app, package governance must call the provider path.

Required implementation:

- Inject a provider into `PackageBuilderService`.
- Pass requirement, package, selected modules, deterministic output, and fallback confidence.
- Save the returned provider result into `AIRecommendation`.
- Keep the deterministic package builder as the source of package module truth.
- Never allow AI output to create package modules without deterministic validation.

### P0 - Add A Dev Mock LoomAI Service

The mock should implement only the contract ProdUS currently owns.

Minimum endpoint:

```text
POST /api/v1/produs/package-governance
```

Minimum mock response:

```json
{
  "confidence": 0.88,
  "rationale": "Mock LoomAI reviewed the deterministic package, confirmed required dependencies, and found no blocked governance issue.",
  "riskLevel": "LOW",
  "missingDependencies": [],
  "recommendedQuestions": [
    "Confirm repository access before milestone planning.",
    "Confirm ownership of deployment and monitoring credentials."
  ],
  "sourceRefs": [
    "deterministicPackage.modules",
    "requirement.businessGoal"
  ]
}
```

Development environment:

```bash
LOOMAI_ENABLED=true
LOOMAI_BASE_URL=http://localhost:8090
LOOMAI_API_KEY=dev-loomai-mock
LOOMAI_TIMEOUT_MS=2500
```

### P0 - Add Contract Tests

Required tests:

- Disabled LoomAI returns deterministic fallback.
- Mock LoomAI 2xx response is persisted as provider `LOOMAI`.
- Mock LoomAI invalid JSON falls back safely.
- Mock LoomAI 500 falls back safely.
- Slow mock request respects timeout and falls back safely.
- Saved recommendation never includes API keys, bearer tokens, or raw secrets.

### P1 - MCP End-To-End Smoke

The MCP gateway has unit tests, but we still need one automated end-to-end smoke that starts or targets the backend and verifies MCP protocol behavior through `/mcp`.

Required checks:

- Initialize MCP session or equivalent JSON-RPC request path.
- List tools.
- Call one read-only tool, such as `produs.catalog.search`.
- Call one mutating tool without confirmation and verify it is rejected before backend mutation.
- Call one low-risk mutating tool with `confirm: true`, `reason`, and an idempotency key.
- Verify `/api/mcp/invocations` records the successful mutation.

### P1 - LoomAI/MCP Bridge Mock

The docs describe LoomAI support for `tools/list`, `tools/call`, retrieval search, and actions execute. The exact real LoomAI contract is not verified in code.

For development, simulate this with a local test harness rather than treating it as production API compatibility.

Mock bridge behavior:

- Discover tools from ProdUS MCP.
- Present only the LoomAI-importable productization action catalog to tests.
- Execute selected MCP tools with a dev user bearer token.
- Require confirmation for mutations.
- Assert backend authorization remains authoritative.
- Assert excluded tools are not available through the mock bridge, even if the underlying MCP gateway exposes them.

### P2 - Scanner/Evidence Product Service

This is required before LoomAI can produce real scanner-backed diagnosis.

Missing product-specific services:

- GitHub App installation flow.
- GitLab connector.
- Repository metadata and branch selection.
- Scan run model.
- Tool run model.
- Job queue and cancellation.
- Isolated worker execution.
- Scan depth consent.
- Gitleaks, Semgrep, OSV, Trivy, Checkov, Lighthouse, and ZAP pipeline.
- SARIF/JSON/log normalization.
- Raw artifact storage, redaction, and retention.
- Finding fingerprint lifecycle.
- CI evidence upload endpoint.
- Scanner health dashboard.

Current generic `IntegrationConnection` and `IntegrationSignal` models can support early evidence signals, but they are not a replacement for scanner runs and normalized findings.

## Mocking Strategy

Use three layers of mocks, each with a clear boundary.

### Layer 1 - Provider Mock

Purpose:

- Let backend workflows exercise LoomAI success/failure/fallback behavior.

Implementation target:

- Local HTTP mock service for `POST /api/v1/produs/package-governance`.

Used by:

- Backend package governance adapter.
- Backend tests.

### Layer 2 - MCP Client Harness

Purpose:

- Let us verify AI-action behavior without a real LoomAI deployment.

Implementation target:

- Test harness or small script that calls the MCP server with a mock-auth bearer token.

Used by:

- Development smoke tests.
- CI later, if backend/MCP services can run together.

### Layer 3 - Assistant UI Mock

Purpose:

- Let frontend screens display assistant recommendations, explanations, and action previews without real LoomAI runtime.

Implementation target:

- Frontend dev fixture or backend endpoint that returns assistant cards from real ProdUS API data.

Rules:

- Every displayed action must map to a real backend action or explicitly render as read-only guidance.
- Every AI-visible action must belong to the product/project/scanning scope.
- Team matching recommendations may be displayed, but team creation, invite, profile edit, and community actions must stay outside the AI assistant.
- Do not show fake scanner claims.
- Do not show "AI executed" unless a provider call happened and was recorded.

## Production Guardrails

- Never bulk-index raw repository contents into LoomAI.
- Never send raw scanner artifacts, secrets, bearer tokens, private file URLs, webhook secrets, or customer credentials to LoomAI.
- Keep scanner artifacts in ProdUS storage with redacted summaries exposed through authorized APIs.
- Keep backend authorization authoritative even when MCP or LoomAI hides tools.
- Use a LoomAI tool allowlist; do not expose the entire MCP gateway to LoomAI by default.
- Keep team formation, solo expert invitations, account settings, profile editing, and community messaging outside AI execution.
- Require confirmation for every state-changing action.
- Require human approval for milestone acceptance, risk acceptance, handoff, payments, compliance claims, and security claims.
- Keep LoomAI optional; deterministic workflow must remain functional when it is disabled.

## Implementation Sequence

### Sequence 1 - Provider Contract And Mock

1. Create a provider interface for package governance.
2. Move deterministic fallback into the provider path.
3. Wire the provider into `PackageBuilderService`.
4. Add local LoomAI mock service or dev-only mock controller.
5. Add backend tests for success, invalid response, HTTP failure, timeout, and disabled-provider fallback.

Exit criteria:

- `LOOMAI_ENABLED=false` keeps current deterministic behavior.
- `LOOMAI_ENABLED=true` with mock URL records provider `LOOMAI` in `AIRecommendation`.
- Fallback paths are tested and do not break package creation.

### Sequence 2 - MCP Smoke Harness

1. Add an MCP smoke script for local development.
2. Use mock auth to obtain a bearer token.
3. Call `/mcp` through the MCP protocol path.
4. Apply the LoomAI productization allowlist in the harness.
5. Verify a read tool such as `produs.catalog.search` or `produs.package.inspect`.
6. Verify a confirmed productization mutation such as `produs.requirement.submit`, `produs.package.build_from_requirement`, or `produs.deliverable.update`.
7. Verify excluded team/profile/community tools are not available through the LoomAI mock bridge.
8. Verify backend audit row.

Exit criteria:

- A developer can verify MCP behavior with one command after backend and MCP are running.

### Sequence 3 - Assistant Mock UX

1. Add a feature-flagged assistant mock surface.
2. Source content from real product, diagnosis, package, workspace, catalog, and MCP/action metadata.
3. Render action previews with clear confirmation requirements.
4. Restrict action previews to product/project/scanning scope.
5. Ensure buttons call real APIs or are disabled with a clear reason.

Exit criteria:

- The UI can demonstrate LoomAI-style guidance without fake scanner execution.
- The UI does not offer AI actions for team creation, solo expert invitations, profile edits, account settings, or community messaging.

### Sequence 4 - Scanner-Backed AI Prerequisites

1. Add scan run and tool run backend models.
2. Add CI evidence upload first because it avoids source-code access risk.
3. Add normalizers for SARIF and simple JSON evidence.
4. Map normalized findings to `ProductFinding` or a richer scanner finding model.
5. Add MCP read tools for scan status and finding detail.

Exit criteria:

- LoomAI mock can explain real uploaded evidence and normalized findings.

### Sequence 5 - Real LoomAI Integration

1. Confirm real LoomAI API contract.
2. Confirm auth model: service token, OAuth/OIDC, or MCP host auth.
3. Confirm streaming/non-streaming chat contract.
4. Confirm retrieval ingestion/search contract.
5. Confirm webhook signing and retry behavior if used.
6. Replace mock runtime with staging LoomAI deployment.
7. Keep deterministic fallback and mock path for local development.

Exit criteria:

- Staging LoomAI can read safe context, call authorized MCP tools, and record auditable outcomes without bypassing ProdUS backend rules.

## Current Readiness Summary

Ready now:

- MCP gateway implementation.
- Backend MCP invocation audit API.
- Catalog, products, packages, teams, workspaces, notifications, support, and admin workflow APIs.
- Deterministic package composition.
- Deterministic diagnosis and findings.
- Acceptance criteria, evidence requirements, automated checks, review decisions, handoff, health reviews, integration signals.
- Evidence attachments.
- Local mock auth users and seeded platform data.
- Scanner source/run/tool/finding/evidence/import lifecycle.
- Hosted scanner execution, normalization, cancel/rescan, and admin scanner operations health.
- External scanner imports and customer-owned CI templates.
- LoomAI package governance provider contract and fallback tests.
- LoomAI-specific MCP/action allowlist profile with scanner/evidence tools.
- Backend assistant session/query/suggestions broker and safe knowledge sync.
- Admin production-readiness gates.

Deferred until real deployment credentials/contracts exist:

- Real LoomAI runtime/chat/retrieval/action API compatibility.
- Production LoomAI auth and deployment registration.
- Role-aware tool filtering at the AI host layer.
- MCP operational dashboard.

## Immediate Next Implementation Task

This baseline is superseded by `IMPLEMENTATION_SEQUENCE_INDEX.md`.

Remaining work is operational, not core implementation:

- configure real LoomAI staging credentials and MCP registration
- run a production-like deployment gate with PostgreSQL, Supabase, MCP, and scanner workers
- add external observability dashboards if the deployment platform does not provide them
