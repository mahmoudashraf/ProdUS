# ProdUS Prototype-To-Product Diagnosis Loop Plan

Date: 2026-06-05

Audience: product, engineering, catalog, scanner, LoomAI, and delivery stakeholders

Status: revised for MVPs, startups, and AI-created prototypes

Primary references:

- `docs/planning/SCANNER_READINESS_NEXT_STEPS.md`
- `docs/PRODUS_NEXT_STRATEGY_PLAN.md`
- `docs/planning/Scanners-AI-integration/PROJECT_AI_ANALYSIS_USEFUL_CREATION_CHANGE_PLAN.md`
- `docs/planning/Scanners-AI-integration/LOOMAI_PRODUCT_AI_INTEGRATION_PLAN.md`

## 1. Product Bet

ProdUS should help owners of MVPs, startup products, internal prototypes, and AI-created apps answer one practical question:

> What is stopping this from becoming a real product, and what should I do next?

The next product slice should feel like a fast productization assistant, not an enterprise audit workflow.

Target loop:

```text
Owner describes the prototype
  -> repo/documents/links are attached
  -> ProdUS runs scanner checks
  -> findings become a plain-language product diagnosis
  -> diagnosis maps to concrete ProdUS services
  -> owner sees the fix path before starting a workspace
  -> workspace starts with repo, services, milestones, proof tasks, and next decisions
```

The backend can remain rigorous. The owner experience should feel lightweight, useful, and confidence-building.

## 2. Positioning

### Primary Positioning

ProdUS helps product owners turn prototypes into production-ready products by diagnosing readiness gaps, recommending practical productization services, and creating a clear path to launch.

### Not The Primary Positioning

ProdUS governs enterprise production readiness workflows with evidence-backed lifecycle controls.

That second statement may become relevant later for enterprise buyers. It should not drive the first product experience.

## 3. Target Users

Primary users for this phase:

- startup founder with a working prototype
- product owner with an internal MVP
- builder with an AI-generated app that needs cleanup
- small team preparing a pilot for real users
- operator trying to understand whether a repo is safe to ship

Secondary users:

- specialist team reviewing the fix path
- LoomAI partner proposing AI enablement services
- delivery lead using the workspace after the owner starts the project

## 4. Product Tone

Use practical language:

- fix path
- proof needed
- ship confidence
- ready-to-ship
- known rough edges
- needs attention
- start workspace
- productization services
- launch checkpoints

Avoid making the default UI feel like a compliance tool:

- governance
- guardrail
- hard blocker
- evidence requirement
- lifecycle control
- audit enforcement
- enterprise readiness ceremony

The system can still store strong evidence, perform permission checks, and keep audit records. Those are implementation strengths, not the first words the owner should see.

## 5. Scope

### In Scope

- prototype-to-product diagnosis
- scanner-backed fix path
- finding-to-service mapping
- missing service gaps before workspace start
- owner action UI for adding recommended services
- workspace enrichment from scanner proof
- user-triggered LoomAI explanations
- catalog-backed service recommendations only
- traceability from scanner finding -> fix path -> service -> milestone -> proof task

### Out Of Scope For This Plan

- full team marketplace expansion
- public expert community growth
- heavy enterprise approval chains
- automatic AI calls on every page load
- generic chat surfaces unrelated to the active project/workspace
- AI mutation flows beyond the existing governed project creation action

## 6. Experience Principles

1. Help the owner move.
   The default outcome should be "here is what to fix next", not "you failed readiness."

2. Warn clearly, block rarely.
   Hard blocks should be reserved for exposed secrets, missing repo/source access, impossible service dependencies, or owner-confirmed stop conditions.

3. Keep recommendations concrete.
   Every stored service recommendation must resolve to a real ProdUS service module.

4. Keep AI useful and bounded.
   AI explains, summarizes, compares, and helps the owner understand decisions. It should not silently mutate project or workspace state.

5. Keep proof human-readable.
   "Proof needed" should tell the owner what to attach, run, or confirm. It should not sound like a courtroom exhibit list.

6. Make re-analysis explicit.
   Deterministic refresh can happen when scanner data changes. LoomAI explanation should run only when the user asks.

## 7. Target Owner Journey

### Step 1: Create Productization Project

Owner provides:

- prototype description
- target users
- product/app URL
- repository URL
- optional README/spec/business notes
- known rough edges
- optional AI opportunities analysis

ProdUS returns:

- project name and description
- business problem
- target users
- core capabilities
- business outcomes
- ready-to-ship goals
- scanner focus areas
- recommended services from the catalog
- LoomAI opportunities, when requested
- document usage evidence, when files are shared

Desired feeling:

> "ProdUS understood what I am building and turned it into an actionable productization plan."

### Step 2: Run Scanner

Owner connects repo or uses an existing source, then runs scanner checks.

ProdUS should show:

- ship confidence score
- highest-risk findings
- scanner proof collected
- findings that need a service
- findings that need quick human review

Desired feeling:

> "I know what is risky and what is noise."

### Step 3: Turn Findings Into Fix Path

ProdUS maps findings to service modules.

Example:

```text
Exposed token finding
  -> security/secrets risk
  -> Secrets review service
  -> proof needed: rotated credential, clean scan, env handling note
  -> launch checkpoint: security cleanup
```

Desired feeling:

> "This scanner result is not just an error. It became a practical fix path."

### Step 4: Add Services

Owner adds recommended services to the start plan.

The UI should show:

- what the service fixes
- why it matters
- what proof it should produce
- whether it depends on another service
- whether the owner can still start with known risk

Desired feeling:

> "I can choose the work I need without decoding the scanner myself."

### Step 5: Start Workspace

Before workspace start, ProdUS should show a simple "Before you start" panel:

- selected product
- selected repo
- selected services
- missing service gaps
- proof tasks that will be created
- first launch checkpoints

If something stops the workspace from starting, the message should be direct:

```text
Add these services before starting:

1. CI/CD setup
   Needed because the repo has release pipeline risk.

2. Monitoring setup
   Needed because production monitoring proof is missing.
```

Avoid:

```text
Resolve required catalog services before starting a project.
```

Desired feeling:

> "I understand what is missing and can fix it in one click."

### Step 6: Use Workspace

Workspace should show:

- scanner fix path
- launch checkpoints
- proof tasks
- mapped services
- selected repo
- AI explainer
- readiness changes over time

Desired feeling:

> "This is the place where the prototype becomes a managed productization effort."

## 8. Implementation Sequence

### Sequence 1: Language And UX Retune

Update visible product language:

- "Scanner Readiness" -> "Scanner Fix Path" or "Ship Confidence"
- "Evidence required" -> "Proof needed"
- "Top blockers" -> "Priority fixes"
- "Catalog guard" -> "Before you start"
- "Blocked items" -> "Needs attention"
- "Readiness goals" -> "Launch goals"
- "Catalog recommendations" -> "Suggested fix path"

Acceptance criteria:

- UI feels approachable for a startup/prototype owner.
- Risk remains visible without sounding like formal compliance.
- Every button still maps to a real backend action.

### Sequence 2: Product Diagnosis Contract

Create or refine a stable diagnosis response for project and workspace views.

Owner-facing fields:

- ship confidence score
- status
- summary
- priority fix count
- mapped finding count
- unmapped finding count
- proof gap count
- recommended service module IDs
- suggested next step

Internal fields may remain rigorous:

- scanner run IDs
- generation source
- diagnosis source
- evidence/proof IDs
- owner/action trace IDs

Acceptance criteria:

- product and workspace diagnosis surfaces can share the same mental model
- frontend does not need scanner-specific hacks for common diagnosis display
- diagnosis can be persisted and refreshed

### Sequence 3: Finding-To-Service Mapping

Use deterministic backend mapping as the source of truth.

Detailed mapping rules remain in:

```text
docs/planning/SCANNER_READINESS_NEXT_STEPS.md
```

Core path:

```text
Scanner finding
  -> risk area
  -> owner-readable risk
  -> ProdUS service module
  -> proof needed
  -> launch checkpoint
```

Mapping must resolve only active catalog modules. AI can explain the recommendation, but should not invent stored service names.

Acceptance criteria:

- mapped findings point to real active service modules
- unmapped findings remain visible
- owner can add a mapped service directly from the UI

### Sequence 4: Service Recommendation Aggregation

Group findings into a short owner-readable list of services.

Rules:

- one recommendation per unique service module
- priority comes from highest linked severity and owner impact
- merge repeated proof tasks
- avoid duplicating services already in the plan
- keep the first list short, with expandable detail

Acceptance criteria:

- owner sees a practical fix path, not a raw issue dump
- each recommendation explains what it fixes
- each recommendation can be added to the start plan

### Sequence 5: Before-You-Start Gaps

Improve workspace start validation so missing dependencies are clear.

Backend should return structured gap details:

- missing service module code
- service name
- plain-language reason
- linked finding IDs, if known
- linked launch checkpoint, if known
- available action: add service, attach proof, or continue with known risk if allowed

Acceptance criteria:

- blocked start messages are understandable
- owner can add missing services from the message
- hard blocking is used sparingly

### Sequence 6: Workspace Scanner Fix Path

Build on the current scanner readiness implementation.

Workspace UI should support:

- ship confidence score
- priority fix cards
- mapped service chips
- proof gap checklist
- unmapped finding review
- add service action
- refresh deterministic fix path
- user-triggered AI explanation

Acceptance criteria:

- owner understands the state in under 30 seconds
- scanner results are translated into decisions
- no LoomAI request runs automatically on page load

### Sequence 7: AI Explainer

LoomAI should help owners understand the active project/workspace context.

AI should answer:

- What is the project?
- What is the tech stack?
- What did the attached document say?
- What are the priority fixes?
- Which services help?
- What proof is missing?
- Can I start the workspace?

AI should receive:

- product/project summary
- current analysis result
- scanner fix path
- mapped service modules
- proof gaps
- selected repo/source
- document usage evidence
- workspace context when available

Acceptance criteria:

- chat understands the active page context
- thinker mode can use readonly actions
- write actions remain governed
- AI does not answer from generic catalog knowledge when project context is available

### Sequence 8: Readiness Trend

Track changes over time without making it feel like enterprise reporting.

Owner-facing name:

- ship confidence history

Stored snapshot fields:

- score
- status
- priority fix count
- mapped finding count
- proof gap count
- scan run IDs
- service plan version
- created at

Acceptance criteria:

- owner can see whether the product is getting closer to launch
- regressions are visible
- AI can explain what changed since the last scan

### Sequence 9: Demo Path Hardening

Maintain one clean staging demo path:

```text
Create productization project
  -> attach repo and README
  -> run scanner
  -> view scanner fix path
  -> add recommended services
  -> resolve before-you-start gaps
  -> start workspace
  -> review workspace fix path
  -> ask AI why the next decision matters
```

Acceptance criteria:

- no database edits required
- every step has visible owner value
- errors are plain English
- screenshots look polished and coherent

## 9. Backend Work

Required backend capabilities:

- stable diagnosis/fix-path API
- persisted diagnosis snapshots
- scanner finding classification
- finding-to-service mapping
- recommendation aggregation
- structured before-you-start gap response
- add recommended service to start plan/workspace
- optional continue-with-known-risk policy
- page-context-safe AI payload builder
- ship confidence history

Implementation can extend existing endpoints where that fits the codebase.

## 10. Frontend Work

Required UI surfaces:

- project diagnosis panel
- scanner fix path panel
- suggested service cards
- before-you-start gap panel
- workspace fix path section
- ship confidence history
- AI explainer entry point
- responsive mobile view

Every visible action must be real:

- add service
- view finding
- view proof need
- refresh fix path
- ask AI
- open workspace
- attach proof, if supported

Do not show placeholder actions as if they work.

## 11. LoomAI Usage

ProdUS should use LoomAI where it improves judgment:

- explain project analysis
- explain document usage
- explain scanner findings
- summarize the fix path
- compare service choices
- explain readiness changes
- suggest LoomAI integration opportunities when explicitly requested

ProdUS should not use LoomAI to:

- invent stored services
- auto-create workspace changes on page load
- replace scanner results with vague advice
- hide missing data behind confident prose

## 12. Success Metrics

Product success:

- owner can name the top 3 priority fixes in under 30 seconds
- owner can add recommended services without leaving the flow
- workspace start gaps are understandable and fixable
- scanner findings become decisions, not noise

Technical success:

- high/critical findings map to risk areas consistently
- stored service recommendations always reference valid catalog modules
- unmapped findings are reviewable
- diagnosis APIs are tested
- staging demo path passes browser verification

AI success:

- AI can answer active project questions from page context
- AI can explain why each service was recommended
- AI can reference uploaded documents when provided
- AI remains clear about missing proof or uncertain context

## 13. Review Questions

1. Which issues should hard-stop workspace start, and which should allow "start with known risk"?
2. Should the default owner score be "ship confidence" instead of "readiness" everywhere?
3. Should service recommendations go to the draft start plan first, or directly into workspace after start?
4. Which scanner categories need manual mapping review before we trust automation?
5. Should the owner see all findings, or only the first few priority fixes by default?

## 14. Definition Of Done

This phase is done when a startup/prototype owner can complete this journey on staging:

```text
Describe prototype
  -> attach repo/document
  -> run scanner
  -> see priority fixes
  -> add recommended services
  -> resolve before-you-start gaps
  -> start workspace
  -> see scanner-backed launch checkpoints
  -> ask AI what to do next
```

The product should feel:

- fast
- practical
- specific
- owner-friendly
- evidence-backed without sounding bureaucratic
- AI-assisted without being chat-first
- polished enough to demo to a founder without explaining away the UI
