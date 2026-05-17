# Sequence 03 - Assistant Mock UX For Productization

Date: 2026-05-17

Status: implemented - owner assistant brief backed by real ProdUS context

## Objective

Add a feature-flagged assistant mock experience that demonstrates LoomAI-style value in the productization workflow while staying grounded in real ProdUS backend records.

The assistant mock must not pretend scanner execution happened. It should explain current deterministic data, provider mock outputs, evidence state, and allowed next actions.

## In Scope

- Product/project assistant panel in the owner workspace.
- Workspace risk review panel for active delivery.
- Package governance explanation from `AIRecommendation`.
- Finding/service recommendation explanation from deterministic diagnosis.
- Action previews for allowlisted productization actions.
- Disabled states for unavailable scanner-backed actions.

## Out Of Scope

- General chat across the entire marketplace.
- Team creation, solo expert invitations, profile editing, account settings, or community messaging.
- Real LoomAI runtime UI.
- Streaming chat.
- Fake scanner claims.

## UX Placement

Primary placement:

- Owner productization workspace.
- Package builder/service plan area.
- Active project workspace/evidence area.
- Milestone review/evidence review area.

Secondary placement:

- Team delivery workspace, but only for active package/workspace context.
- Admin scanner health later after scanner implementation.

## Frontend Implementation

Implemented:

- Owner productization workspace includes an AI Owner Brief grounded in selected product, package, workspace, finding, recommendation, scanner, and cart state.
- The assistant suggestion panel calls the backend `/api/ai/assistant/suggestions` broker with safe page context.
- Suggestions explicitly show `LoomAI live` or `ProdUS fallback`, so the UI does not imply real LoomAI execution when disabled.
- Visible owner actions around requirements, service cart, package creation, scanner upload/import, hosted scan, shortlist, proposal, and workspace creation remain wired to real backend mutations.
- Team/profile/community/account actions are not exposed through this assistant placement.

### 1. Feature Flag

Add a frontend flag:

```bash
NEXT_PUBLIC_AI_ASSISTANT_MOCK_ENABLED=true
```

The UI should not depend on this flag for core productization workflows.

### 2. Assistant Data Source

Use real API data:

- products
- requirement intakes
- package instances
- package modules
- team recommendations
- workspaces
- milestones
- deliverables
- evidence attachments
- product diagnoses
- product findings
- acceptance criteria
- evidence requirements
- AI recommendations
- MCP/action metadata if available

### 3. Assistant Cards

Suggested card types:

- Product readiness summary.
- Package governance summary.
- Missing dependency warning.
- Evidence gap warning.
- Workspace risk summary.
- Milestone review readiness.
- Handoff readiness.
- Next safe action.

Every card must show:

- source basis
- confidence or evidence quality
- related product/package/workspace ID where useful
- action availability

### 4. Action Preview

Allowed actions:

- submit requirement
- build package from requirement
- add team to package shortlist
- create project workspace
- update deliverable evidence/status
- inspect package/workspace/catalog

Scanner actions must render disabled until Sequence 04/05 exist:

- start scan
- view scan status
- upload CI evidence
- inspect scanner finding

Excluded actions must never be shown:

- create team
- invite solo expert
- edit team profile
- edit expert profile
- send community message
- account settings
- broad admin/commercial operations

### 5. Apple-Like UI Rules

Follow the existing `docs/UI-Design-Prompot.md` direction:

- white canvas
- calm hierarchy
- soft borders
- compact Apple-style cards
- clear icon buttons
- restrained pastel status colors
- no bulky dashboard clutter
- no fake explanatory marketing text inside the app
- buttons have consistent size and obvious purpose
- every button has a real backend effect or a disabled reason

## Backend Support

If frontend composition becomes too heavy, add a read-only backend endpoint:

```text
GET /api/productization-engine/products/{productId}/assistant-context
GET /api/productization-engine/workspaces/{workspaceId}/assistant-context
```

These endpoints should aggregate existing records only. They should not call LoomAI directly in this sequence.

## MCP/AI Support

The mock assistant may reference the same action names as the MCP allowlist, but UI button clicks should call existing frontend API clients directly unless the goal is specifically to test MCP.

The assistant should label source type:

- `RULES_FALLBACK`
- `LOOMAI_MOCK`
- `DETERMINISTIC_DIAGNOSIS`
- `EVIDENCE_RECORD`
- `MISSING_DATA`

## Tests

Frontend tests:

- Assistant renders from deterministic product/package/workspace data.
- Buttons for allowed actions call the right API.
- Excluded actions are not rendered.
- Scanner actions are disabled until scanner APIs exist.
- Loading, empty, error, and mobile states are usable.

Manual verification:

- Owner can understand next action from product workspace.
- Team-side active workspace only shows project-scoped guidance.
- No AI button can manage team membership or profile/account settings.

Suggested commands:

```bash
cd frontend
npm run lint
npm run build
```

## Exit Criteria

- Assistant mock appears only where it adds productization value.
- It is grounded in real backend records.
- It does not claim real AI/scanner execution unless recorded.
- All visible actions work or are disabled with a clear reason.
- Mobile layout remains usable.

## Production Considerations

- Keep mock assistant behind a dev/staging flag until real LoomAI staging contract is available.
- Do not introduce frontend-only security assumptions.
- Do not store sensitive data in localStorage for assistant context.
