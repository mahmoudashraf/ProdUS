# ProdUS Diagnosis-To-Action Loop Plan

Date: 2026-06-05

Audience: product, engineering, catalog, scanner, LoomAI, and delivery stakeholders

Status: proposed for review

Primary references:

- `docs/planning/SCANNER_READINESS_NEXT_STEPS.md`
- `docs/PRODUS_NEXT_STRATEGY_PLAN.md`
- `docs/planning/Scanners-AI-integration/PROJECT_AI_ANALYSIS_USEFUL_CREATION_CHANGE_PLAN.md`
- `docs/planning/Scanners-AI-integration/LOOMAI_PRODUCT_AI_INTEGRATION_PLAN.md`

## 1. Product Bet

ProdUS should win by making the owner trust the production-readiness diagnosis enough to act on it.

The next product slice should make this loop feel complete:

```text
Owner creates project
  -> repository and documents are attached
  -> scanner evidence is collected
  -> findings are converted into a credible diagnosis
  -> diagnosis maps to real catalog services
  -> owner sees missing dependencies before committing
  -> workspace is created with repo, milestones, evidence needs, and next decisions
```

This plan intentionally narrows the focus. Team matching, marketplace growth, reputation, and community features remain useful, but they should not be the primary investment until the diagnosis-to-action loop is excellent.

## 2. Why This Matters

The owner does not need another dashboard. The owner needs a clear answer:

> What is blocking this project from production, what needs to happen next, and what concrete service path gets us there?

ProdUS becomes useful when it can turn messy input into a concrete production plan:

- owner intent
- repository evidence
- uploaded project documents
- scanner findings
- service catalog modules
- milestone/evidence readiness
- optional AI explanation

The system should not merely describe a project. It should produce action-ready structure.

## 3. Scope

### In Scope

- Scanner-backed readiness diagnosis
- Finding-to-service mapping
- Missing dependency detection before workspace conversion
- Owner action UI for adding recommended services
- Workspace enrichment from scanner evidence
- AI explanations triggered by the owner, not automatically on page load
- Catalog-backed recommendations only
- Clear traceability from finding -> readiness blocker -> service -> milestone -> evidence

### Out Of Scope For This Plan

- Full marketplace liquidity
- Team bidding workflows
- Public expert community improvements
- AI write actions beyond the existing governed project creation path
- Generic chatbot behavior unrelated to the active project/workspace
- Automatic AI calls on every page load

## 4. Operating Principles

1. Diagnosis must be evidence-backed.
   Every blocker should point to scanner findings, owner input, repo metadata, uploaded documents, or known missing evidence.

2. Services must be catalog-backed.
   AI and deterministic rules may recommend services, but stored recommendations must resolve to real active catalog modules.

3. AI explains and assists, but deterministic state owns the workflow.
   AI can help owners understand blockers and compare actions. It should not silently mutate project/workspace state.

4. The owner should always know the next useful action.
   Each diagnosis state should answer: fix, accept risk, request service, attach evidence, or re-run scan.

5. Re-running analysis should be explicit.
   Deterministic mapping can refresh when new scanner evidence appears. LoomAI calls should be triggered intentionally by the user.

## 5. Target Owner Experience

### Project Creation

The owner provides:

- project description
- product or app URL
- repository URL
- optional documents
- optional AI opportunity analysis

ProdUS creates a project with:

- product profile
- repository source
- project intelligence from AI analysis, if selected
- recommended service modules, if resolved
- scanner focus areas
- initial readiness goals

### Scanner Run

The owner can run scanners from the project/workspace.

After scanner completion, ProdUS shows:

- readiness score
- top blockers
- mapped findings
- unmapped findings
- evidence gaps
- recommended catalog services
- affected milestone or suggested milestone

### Service Selection

The owner can add recommended services directly from the diagnosis UI.

The UI should show:

- what blocker the service addresses
- why the service is needed
- what evidence it should produce
- whether a dependency is missing
- whether another service must happen first

### Workspace Creation

Workspace conversion should not feel like a blind transition.

Before converting, ProdUS should show:

- required services
- unresolved dependencies
- missing evidence expectations
- scanner blockers that remain open
- selected repo source
- milestone plan

If conversion is blocked, the error should be owner-readable and actionable.

Bad:

```text
Resolve required catalog services before starting a project: CI/CD setup, Monitoring setup
```

Better:

```text
This workspace needs two required services before it can start:

1. CI/CD setup
   Needed because scanner evidence found release pipeline risk.

2. Monitoring setup
   Needed because no production monitoring evidence exists.

Add both to the service plan, or mark them as accepted risk with an owner note.
```

### Workspace Readiness

Inside the workspace, scanner readiness should stay visible:

- current readiness state
- milestone risks
- scanner-backed evidence
- unresolved blockers
- mapped services
- AI explainer, triggered by owner

## 6. Implementation Sequence

### Sequence 1: Readiness Diagnosis Contract

Create a stable diagnosis response used by project and workspace pages.

Required fields:

- readiness score
- readiness status
- summary
- blocker count
- mapped finding count
- unmapped finding count
- evidence gap count
- affected service module IDs
- affected milestone IDs
- scanner run IDs
- generated at
- generation source: `DETERMINISTIC`, `AI_ASSISTED`, or `MIXED`

Diagnosis statuses:

- `BLOCKED`
- `NEEDS_REVIEW`
- `READY_WITH_RISKS`
- `READY`

Acceptance criteria:

- API returns the same shape for project and workspace diagnosis surfaces.
- Frontend can render diagnosis without special-casing scanner type.
- Diagnosis can be persisted and refreshed.

### Sequence 2: Finding-To-Service Mapping

Use deterministic backend mapping as the source of truth.

Detailed mapping rules are defined in:

```text
docs/planning/SCANNER_READINESS_NEXT_STEPS.md
```

Core mapping path:

```text
Scanner finding
  -> readiness area
  -> business risk
  -> service module code
  -> required evidence
  -> suggested milestone
```

Mapping must resolve only active catalog modules.

Required output per mapped finding:

- finding ID
- readiness area
- severity
- business risk
- mapped service module ID
- mapped service module code
- mapping confidence
- mapping reason
- suggested evidence
- suggested milestone

Acceptance criteria:

- no free-text-only service recommendation is persisted
- unmapped findings are preserved and visible
- owner can add mapped services to the plan

### Sequence 3: Service Recommendation Aggregation

Group mapped findings into owner-readable service recommendations.

Aggregation rules:

- one recommendation per unique service module
- highest linked severity determines priority
- linked finding count is visible
- required evidence is merged and deduplicated
- services already in the cart/workspace are not duplicated

Recommended priority order:

1. critical secrets/auth/security
2. dependency/API/infrastructure
3. deployment/monitoring/testing
4. performance/documentation/launch

Acceptance criteria:

- owner sees a short list of services that clearly map to blockers
- each recommendation can be added to the service cart or workspace plan
- dependencies are shown before conversion

### Sequence 4: Dependency And Conversion Guardrails

Improve service plan conversion so it explains what is missing.

Backend should return structured blocking details:

- missing service module code
- missing service module name
- reason
- linked blocker/finding IDs
- linked milestone, if known
- owner available actions

Example actions:

- add service
- accept risk
- attach evidence
- re-run scan

Acceptance criteria:

- UI does not show raw backend validation text as the primary owner experience
- blocked conversion explains how to unblock
- owner can add missing services directly from the error panel

### Sequence 5: Workspace Scanner Readiness UI

Build on the current workspace scanner readiness section.

The UI should support:

- persisted readiness state
- blocker cards
- mapped service cards
- evidence gap checklist
- unmapped finding review
- add service action
- accepted risk action, if supported
- re-run deterministic mapping
- user-triggered AI explainer

Design expectations:

- Apple-like light interface
- calm spacing
- soft shadows and hairline borders
- no dense spreadsheet layout
- strong visual hierarchy around the next decision
- responsive mobile layout

Acceptance criteria:

- owner understands the readiness state in less than 30 seconds
- every button performs a backend action or opens a specific actionable panel
- no AI request runs automatically on page load

### Sequence 6: AI Explainer Integration

LoomAI should explain diagnosis and service path using page context.

AI surfaces:

- explain current diagnosis
- explain why a blocker matters
- compare recommended services
- summarize evidence gaps
- answer questions about scanner findings
- explain workspace readiness before owner decision

AI should receive:

- diagnosis summary
- mapped findings
- recommended service module IDs and names
- evidence gaps
- milestone risks
- selected product/workspace context
- document usage evidence, when available

AI should not receive:

- raw secrets
- private object storage URLs unless intentionally short-lived and selected
- unrestricted project data
- mutation permission for read-only explanation

Acceptance criteria:

- analysis chat can answer project/workspace-specific questions
- response cites available context where possible
- readonly MCP actions are allowed in thinker mode
- write actions remain governed and explicit

### Sequence 7: Readiness History

Store readiness snapshots over time.

This lets owners see whether work is improving production readiness.

Snapshot fields:

- score
- status
- blocker count
- mapped finding count
- evidence gap count
- scan run IDs
- service plan version
- created at

Acceptance criteria:

- owner can see readiness trend
- diagnosis can explain what changed since last scan
- scan-to-scan regressions are visible

### Sequence 8: Demo Path Hardening

Create a clean internal demo dataset and verification path:

```text
Create project with AI
  -> attach repository
  -> run scanner
  -> view diagnosis
  -> add recommended services
  -> resolve dependency guardrails
  -> create workspace
  -> review workspace readiness
  -> ask AI about blockers
```

Acceptance criteria:

- demo can be run from staging without manual database edits
- every step has visible owner value
- errors are owner-readable
- screenshots show a polished, coherent product

## 7. Backend Work

Required backend capabilities:

- stable readiness diagnosis API
- persisted diagnosis snapshots
- scanner finding classification
- finding-to-service mapping
- recommendation aggregation
- structured conversion guardrail response
- add recommended service to cart/workspace
- accepted-risk hook or placeholder policy
- readiness history
- page-context-safe AI payload builder

Recommended endpoints:

```text
GET  /api/products/{productId}/readiness-diagnosis
POST /api/products/{productId}/readiness-diagnosis/refresh
GET  /api/workspaces/{workspaceId}/readiness-diagnosis
POST /api/workspaces/{workspaceId}/readiness-diagnosis/refresh
POST /api/readiness-diagnosis/{diagnosisId}/services/{moduleId}/add
POST /api/readiness-diagnosis/{diagnosisId}/risks/accept
```

Existing endpoints may be extended if that better matches the codebase.

## 8. Frontend Work

Required UI surfaces:

- product diagnosis panel
- scanner blocker panel
- recommended services panel
- dependency guardrail modal/panel
- workspace readiness section
- readiness history mini-chart
- AI explainer entry point
- mobile responsive view

Every visible action must be real:

- add service
- view finding
- view evidence need
- refresh deterministic diagnosis
- ask AI
- open workspace
- attach evidence, if available

Buttons that depend on unavailable functionality should be hidden or clearly disabled with a real reason.

## 9. AI And LoomAI Work

ProdUS should keep AI usage bounded:

- thinker mode for analysis, explanation, and readonly actions
- executor mode only for governed write actions
- frontend calls ProdUS backend only
- backend signs private runtime assertions
- page context should include the active diagnosis snapshot

LoomAI should support:

- diagnosis explanation
- scanner blocker explanation
- service path explanation
- readiness change explanation
- catalog-aware suggestions through readonly actions/context

ProdUS should not ask LoomAI to invent services. It should pass catalog-backed recommendations and let LoomAI explain tradeoffs.

## 10. Data Model Additions

Potential new or extended entities:

- `ReadinessDiagnosis`
- `ReadinessDiagnosisItem`
- `FindingServiceRecommendation`
- `ReadinessSnapshot`
- `AcceptedReadinessRisk`

These can be introduced as separate tables or folded into the existing diagnosis/governance tables if the current model already supports the relationships cleanly.

## 11. Success Metrics

Product success:

- owner can identify top blockers within 30 seconds
- owner can add recommended services without leaving the diagnosis flow
- workspace conversion errors become self-explanatory
- scanner findings are not just listed; they become decisions

Technical success:

- 95 percent or more of high/critical findings map to a readiness area
- unmapped findings are tracked and reviewable
- service recommendations always reference valid catalog modules
- diagnosis APIs are covered by backend tests
- staging demo path passes browser verification

AI success:

- AI can answer "what is blocking this project?" from page context
- AI can explain why each recommended service exists
- AI does not answer from generic catalog knowledge when project context is available
- AI does not mutate state without governed action flow

## 12. Review Questions

1. Should accepted risk be available in this phase, or should every blocker require service/evidence before workspace conversion?
2. Should readiness scoring be strict by default, or should it allow `READY_WITH_RISKS` for lower-severity gaps?
3. Should service recommendations be added to the project cart first, or directly to the workspace plan after conversion?
4. Which scanner finding categories should be manually curated before automatic mapping is trusted?
5. Should owner-visible diagnosis focus on the top 5 blockers or all blockers by default?

## 13. Proposed Implementation Order

1. Normalize readiness diagnosis contract across product and workspace.
2. Persist scanner-backed diagnosis snapshots.
3. Add structured conversion guardrail responses.
4. Add owner action UI for missing services and mapped blockers.
5. Add readiness history.
6. Improve LoomAI page-context chat for diagnosis explanation.
7. Run full staging demo and screenshot verification.

## 14. Definition Of Done

This phase is done when the owner can complete this journey on staging:

```text
Create project
  -> attach repo
  -> run scanner
  -> see top production blockers
  -> add recommended catalog services
  -> understand missing dependencies
  -> create workspace
  -> see scanner-backed milestone readiness
  -> ask AI why the next decision matters
```

The final product feel should be:

- clear
- evidence-backed
- action-oriented
- catalog-grounded
- not chat-first
- not marketplace-first
- polished enough to demo without apology
