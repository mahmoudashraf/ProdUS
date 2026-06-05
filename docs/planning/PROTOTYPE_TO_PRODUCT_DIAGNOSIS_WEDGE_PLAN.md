# ProdUS Prototype-To-Product Diagnosis Wedge Plan

Date: 2026-06-05

Audience: product, engineering, design, AI integration, catalog, scanner, and delivery stakeholders

Status: plan for review

Primary references:

- `docs/planning/DIAGNOSIS_TO_ACTION_LOOP_PLAN.md`
- `docs/planning/SCANNER_READINESS_NEXT_STEPS.md`
- `docs/PRODUS_NEXT_STRATEGY_PLAN.md`
- `docs/planning/Scanners-AI-integration/PROJECT_AI_ANALYSIS_USEFUL_CREATION_CHANGE_PLAN.md`
- `docs/planning/Scanners-AI-integration/LOOMAI_PRODUCT_AI_INTEGRATION_PLAN.md`
- `docs/planning/AI-Integration-Services/LOOMAI_PROVIDER_CAPABILITIES_USER_GUIDE.md`

## 1. Product Bet

ProdUS should win the first external version by being excellent at one thing:

> Turn a messy prototype, MVP, AI-built app, repo, document, or product idea into a credible diagnosis of what blocks production and a concrete fix path.

This is the wedge. The service catalog, scanner engine, workspace, AI assistant, and team/expert network should support this wedge. They should not compete with it for product attention.

The core question ProdUS must answer better than a generic chatbot is:

> What is stopping this from becoming a real product, what proof do we have, and what should I do next?

## 2. Why This Is Next

The current system can already perform the broad journey:

```text
Create project with AI
  -> attach repo/documents
  -> run scanner
  -> map scanner findings to catalog services
  -> create workspace
  -> view ship confidence and fix path
```

The next work should make that journey trustworthy, repeatable, and useful enough that owners act on it. The product should not expand into more marketplace, community, or enterprise workflow until the diagnosis and action plan become the thing users believe.

The kill-or-win assumption:

> ProdUS succeeds only if its diagnosis is specific and trustworthy enough that owners act on it.

If this assumption is false, more UI, more catalog entries, more marketplace features, or more AI chat will not save the product. If it is true, those layers become natural extensions.

## 3. Target Users

Primary users for this plan:

- startup founder with a rough but working MVP
- builder with an AI-generated prototype that needs cleanup
- product owner with an internal tool approaching real users
- technical founder preparing a customer pilot
- agency or studio assessing a client repo before delivery commitment

Secondary users:

- specialist team reviewing the recommended fix path
- solo expert evaluating whether to help
- LoomAI partner identifying where AI enablement adds value
- delivery lead using the workspace after the owner accepts the plan

## 4. Product Tone

The default experience should feel like a productization assistant for builders, not a rigid enterprise audit system.

Preferred language:

- ship confidence
- fix path
- proof needed
- ready-to-ship
- rough edge
- next move
- launch checkpoint
- production blocker
- recommended service
- start workspace

Language to avoid as default UI framing:

- governance control
- audit enforcement
- lifecycle compliance
- approval ceremony
- enterprise readiness gate

The backend can still be rigorous. It should store evidence, enforce permissions, validate catalog dependencies, and keep audit records. The UI should translate that into language that helps a founder or product owner move.

## 5. Non-Goals

Do not prioritize these until the diagnosis wedge is credible:

- broad team marketplace expansion
- public expert community growth
- generic AI chatbot surfaces
- heavy enterprise approval chains
- public social or reputation network
- automatic AI calls on every page load
- AI write actions beyond the governed project creation flow
- a full project management replacement

## 6. Success Criteria

### Product Success Criteria

- A weak owner brief plus repo link produces a useful project diagnosis.
- The diagnosis explains concrete risks in plain language.
- Scanner findings become catalog-backed fix steps, not only raw technical errors.
- Recommended services use real catalog module IDs or slugs.
- The owner can see missing dependencies before starting a workspace.
- The created workspace carries repo, scanner context, service plan, milestones, proof tasks, and next decisions.
- The owner can explain the top three blockers after reading the diagnosis.

### Quality Success Criteria

- Diagnosis output is not generic checklist text.
- Every critical/high scanner finding is either mapped to a fix path or marked unmapped for review.
- Every stored service recommendation resolves to an active catalog service module.
- AI analysis identifies what it used: owner brief, repo, URL, document, scanner evidence, catalog snapshot.
- AI analysis identifies what it could not verify.
- Documents are either reported as used with owner-safe evidence or not used with reason.

### Operational Success Criteria

- Backend tests cover the diagnosis contract, scanner mapping, service recommendations, workspace creation, and blocked conversion errors.
- Frontend tests cover the owner path on desktop and mobile.
- Staging validates the full demo flow with a real repo.
- LoomAI calls remain backend-mediated, with no browser runtime secrets.
- Expensive AI calls are user-triggered or tied to explicit analysis runs, not automatic page-load behavior.

## 7. Implementation Sequence

### Sequence 1: Diagnosis Quality Harness

Purpose:

Create a repeatable way to prove the diagnosis is specific, useful, and regression-safe.

Backend deliverables:

- fixture products for common prototype types:
  - AI-built SaaS app
  - internal admin dashboard
  - B2B customer portal
  - API/service backend
  - e-commerce prototype
  - data workflow app
- fixture repo metadata and scanner outputs
- fixture README/spec/document attachments
- expected diagnosis assertions
- quality rubric scoring:
  - specificity
  - evidence grounding
  - service mapping validity
  - missing evidence clarity
  - owner action clarity
- generic-answer detector for AI summaries
- regression test suite for diagnosis output shape

Frontend deliverables:

- fixture-driven preview route or test harness page for internal review
- visible quality signals in non-production/test environments
- snapshot tests for diagnosis cards, fix path, and missing evidence UI

Acceptance criteria:

- The team can run a test and see whether a diagnosis became more generic or less actionable.
- At least five fixture products have expected blocker/service assertions.
- The harness fails if AI or backend returns invented service names as stored recommendations.

Implementation status:

- Done in this repo as an admin-only deterministic quality harness at `/admin/diagnosis-quality`.
- Backend endpoints are available under `/api/productization-engine/diagnosis-quality`.
- Six curated prototype fixtures are included, inspired by the local `Real_Apps` material without committing those apps into this repo.
- The harness checks classifier category accuracy, catalog-backed service mapping, catalog resolution, diagnosis specificity, non-generic wording, and bad-diagnosis detection.
- Live browser verification was completed locally with a mock admin session, and production frontend/backend builds pass.

### Sequence 2: Better Repo Understanding

Purpose:

Make repository and source understanding strong enough that the diagnosis feels project-specific.

Backend deliverables:

- deterministic repository metadata extraction:
  - primary language
  - framework signals
  - package managers
  - database hints
  - auth hints
  - cloud/deploy hints
  - CI/CD hints
  - test framework hints
  - documentation hints
  - scanner tool compatibility hints
- source signal model stored with product/workspace:
  - `signalType`
  - `signalValue`
  - `confidence`
  - `source`
  - `sourcePath`, when safe
  - `detectedAt`
- repo source status states:
  - `READY`
  - `NEEDS_AUTH`
  - `PUBLIC_ONLY`
  - `UNREACHABLE`
  - `SCAN_PENDING`
  - `SCAN_COMPLETE`
- safe handling for public repo URLs and installed GitHub App sources

Frontend deliverables:

- "Repo readout" panel on project and workspace pages
- clear source status messages
- tech stack chips with source labels
- "Run scanner" and "Refresh repo signals" actions

Acceptance criteria:

- A provided repo URL appears after project creation and is ready for scan when accessible.
- Product pages show what ProdUS detected from the repo before AI explanation.
- Scanner focus areas are informed by repo metadata.

### Sequence 3: AI Project Analysis Contract Upgrade

Purpose:

Make AI analysis useful for project creation and downstream diagnosis, not just descriptive.

Backend deliverables:

- compact service catalog snapshot passed to LoomAI during project analysis:
  - `moduleCode`
  - `name`
  - `categorySlug`
  - `outcome`
  - `tags`
  - `requiredSignals`
- high-quality prompt that asks LoomAI to return:
  - project description
  - business problem
  - target users
  - core capabilities
  - business outcomes
  - readiness goals
  - scanner focus areas
  - recommended service modules by `moduleCode`
  - missing catalog coverage
  - document usage evidence
  - source insights
  - assumptions
  - missing evidence
  - confidence by section
- backend validation:
  - reject invented module codes from persisted recommendation sets
  - keep invalid suggestions as `missingCatalogCoverage`
  - allow project creation when AI opportunities exist but core analysis is partial
  - preserve user-provided repo/product URL even if AI omits them
- analysis modes:
  - `FULL_WITH_AI_OPPORTUNITIES`
  - `AI_OPPORTUNITIES`
- no backward compatibility aliases for green-field payloads

Frontend deliverables:

- clearer analysis mode selection:
  - "Full productization analysis"
  - "AI opportunities only"
- richer AI attributes panel:
  - product summary
  - business problem
  - target users
  - core capabilities
  - readiness goals
  - recommended services
  - AI opportunities
  - source insights
  - missing evidence
- visual separation between:
  - owner-provided
  - detected by ProdUS
  - suggested by LoomAI
  - needs input

Acceptance criteria:

- AI analysis returns catalog module codes for recommendations when catalog support exists.
- Project creation persists the validated recommended service modules.
- The UI explains which parts came from AI and which came from deterministic backend signals.

### Sequence 4: Scanner To Fix Path Hardening

Purpose:

Turn scanner findings into owner-readable fix paths and catalog-backed service recommendations.

Backend deliverables:

- persisted scanner finding classification:
  - finding category
  - readiness area
  - business risk
  - owner decision
  - evidence required
- deterministic service mapper:
  - scanner signal -> readiness area -> catalog module
  - stable module codes only
  - unmapped finding capture
- persisted `ProductDiagnosis` or equivalent snapshot:
  - score
  - status
  - top blockers
  - mapped services
  - unmapped findings
  - evidence gaps
  - source scan runs
- refresh behavior:
  - deterministic mapping can refresh when scanner data changes
  - AI explanation remains user-triggered

Frontend deliverables:

- "Fix path" panel on product/workspace pages
- mapped blocker cards:
  - finding
  - why it matters
  - recommended service
  - proof needed
  - add to plan
- unmapped findings section for review
- stored mapping result visible without rerunning AI

Acceptance criteria:

- Mapping is stored, not recalculated only as a transient user action.
- Owner can add mapped lifecycle services from the fix path.
- Unmapped findings are visible and do not silently disappear.

### Sequence 5: Service Plan From Diagnosis

Purpose:

Make the service plan a real translation of diagnosis into work.

Backend deliverables:

- service plan versioning:
  - source diagnosis id
  - selected service module ids
  - owner selections
  - dependency status
  - created/updated timestamps
- dependency evaluation:
  - required service dependencies
  - optional supporting services
  - blocked workspace conversion reasons
- structured conversion errors:
  - `missingRequiredServices`
  - `reason`
  - `recommendedAction`
  - `serviceModuleCode`
- service recommendation aggregation:
  - linked finding ids
  - linked evidence ids
  - priority
  - expected proof
  - suggested milestone

Frontend deliverables:

- "Before you start" workspace readiness panel:
  - selected services
  - missing required services
  - why each missing service matters
  - one-click add missing services
- service cards tuned for startups:
  - "What this fixes"
  - "Proof you will get"
  - "When to do it"
  - "Can you start without it?"
- better blocked conversion messaging:
  - no raw backend-only language
  - no vague "bad request"

Acceptance criteria:

- Workspace conversion errors are understandable and actionable.
- Owner can resolve missing service dependencies in-place.
- The service plan is traceable back to diagnosis and scanner evidence.

### Sequence 6: Launch Readiness Report

Purpose:

Produce a shareable outcome that proves ProdUS value beyond UI navigation.

Backend deliverables:

- report endpoint:
  - product id
  - workspace id, optional
  - latest diagnosis
  - scanner evidence
  - selected services
  - unresolved blockers
  - proof collected
  - next owner decision
- report snapshot persistence:
  - version
  - generated by
  - generated at
  - source diagnosis id
- export support:
  - JSON
  - printable HTML
  - PDF later, if needed

Frontend deliverables:

- "Launch readiness report" page or modal
- plain-language sections:
  - what this product is
  - what is ready
  - what is risky
  - what to fix next
  - services selected
  - proof collected
  - proof missing
  - recommended next decision
- LoomAI "explain this report" button, user-triggered

Acceptance criteria:

- The report can be shared with a founder, advisor, agency, or internal stakeholder.
- Report language is practical and not enterprise-heavy.
- Report links back to scanner evidence and service recommendations.

### Sequence 7: Demo Path And User Story

Purpose:

Create one excellent path that the team can demo, test, and use for external validation.

Demo path:

```text
1. Owner opens product creation.
2. Owner selects Full productization analysis.
3. Owner provides brief, repo URL, product URL, and README/spec document.
4. ProdUS analyzes project and shows:
   - product intelligence
   - repo signals
   - document use evidence
   - recommended services
   - AI opportunities
5. Owner creates project.
6. Project opens with repo source configured.
7. Owner runs scanner.
8. ProdUS stores scanner-backed diagnosis.
9. Owner reviews fix path.
10. Owner adds recommended services.
11. Owner resolves missing service dependencies.
12. Owner starts workspace.
13. Workspace opens with milestones, proof tasks, repo, scanner evidence, and ship confidence.
14. Owner generates launch readiness report.
```

Acceptance criteria:

- The path works on staging with `mahmoudashraf/ProdUS`.
- The path works with at least one small external/public repo fixture.
- The path works on desktop and mobile layouts.
- Every major step has a clear next action.

### Sequence 8: Measurement And Review

Purpose:

Prove the wedge is improving instead of only adding features.

Metrics:

- project analysis success rate
- project creation completion rate after analysis
- repo source configured rate
- scanner run completion rate
- mapped finding percentage
- unmapped finding percentage
- recommended service acceptance rate
- blocked workspace conversion resolution rate
- workspace creation completion rate
- launch report generation rate
- AI explanation usage rate

Quality review cadence:

- weekly diagnosis review against fixture repos
- weekly unmapped finding review
- weekly service recommendation quality review
- monthly owner usability review

Acceptance criteria:

- At least 80 percent of high/critical findings map to catalog services or clear human review buckets.
- At least 70 percent of owner-created projects have a repo source or explicit "no repo yet" reason.
- At least 60 percent of scanner-backed projects produce a usable fix path without manual admin cleanup.

## 8. LoomAI Role

LoomAI should be used where it adds understanding, explanation, or synthesis.

Use LoomAI for:

- project analysis from owner brief, repo links, and temporary document URLs
- AI integration opportunity analysis
- diagnosis explanation
- report explanation
- service recommendation rationale
- chat over page context, including completed analysis results

Do not use LoomAI as the source of truth for:

- stored service module identity
- catalog dependencies
- scanner severity normalization
- access control
- workspace mutation, except governed confirmed actions
- document storage or document indexing for temporary project documents

Mode expectations:

- use `thinker` for analysis, page-helper, read-only, and project-analysis chat
- use `executor` only for governed write action execution
- allow read-only MCP actions when the user is asking about product, catalog, service, scanner, evidence, or workspace context
- keep write actions behind explicit owner approval and backend consent/idempotency checks

## 9. Security And Production Constraints

Required constraints:

- no LoomAI runtime secrets in browser
- browser calls ProdUS backend only
- ProdUS backend signs private-runtime assertions
- temporary document URLs expire quickly
- temporary project documents are not indexed unless a separate owner-approved ingestion path exists
- private workspace data is provided as bounded context or read action results, not bulk-indexed by default
- scanner evidence should redact secrets before AI context
- all AI action payloads must be tied to the signed-in owner and creation intent

Creation action errors should be explicit:

- "This AI creation request expired. Re-run analysis."
- "This creation action belongs to a different signed-in user."
- "This action payload is stale. Use the latest AI analysis result."
- "This project is missing required services before workspace start."

## 10. Backend Deliverables Summary

- diagnosis fixture harness
- repo metadata extraction service
- project analysis contract validation
- catalog snapshot builder for AI context
- scanner finding classifier
- scanner finding service mapper
- persisted diagnosis snapshot
- persisted service plan version
- structured workspace conversion errors
- launch readiness report endpoint
- metrics events for the full path
- tests for each deterministic mapping and failure path

## 11. Frontend Deliverables Summary

- improved project creation AI analysis UI
- repo readout panel
- fix path panel
- mapped blocker cards
- before-you-start workspace panel
- launch readiness report UI
- LoomAI page chat context integration for analysis and diagnosis pages
- mobile checks for product creation, diagnosis, fix path, and workspace pages
- clear states for:
  - AI analysis ready
  - document used
  - document not used
  - repo ready
  - scanner pending
  - scanner complete
  - services missing
  - workspace ready

## 12. Test And Verification Plan

Automated tests:

- backend unit tests for classifier and mapper
- backend integration tests for project analysis and creation
- backend tests for conversion blocking and resolution
- backend tests for launch readiness report generation
- frontend component tests for diagnosis/fix path panels
- Playwright test for the demo path

Live staging verification:

- create project with AI using a repo and README attachment
- confirm document use evidence is visible
- confirm repo source is configured after project creation
- run scanner
- confirm findings are mapped and persisted
- add mapped services
- resolve missing service gaps
- start workspace
- confirm workspace has scanner/evidence context
- generate launch readiness report
- ask LoomAI chat about the analysis and confirm it sees page context

## 13. Review Gates

Gate 1: Diagnosis Credibility

- five fixture diagnoses reviewed
- no generic-checklist failures
- scanner evidence linked to top blockers

Gate 2: Fix Path Utility

- high/critical findings map to services or review buckets
- service recommendations can be added without manual translation
- owner-facing reasons are understandable

Gate 3: Workspace Readiness

- workspace opens with repo, services, milestones, proof tasks, and diagnosis summary
- missing dependency handling is clear

Gate 4: External Demo

- one polished staging flow is ready for external user testing
- report output is clear enough to share outside the product team

## 14. Product Decision After This Plan

After this plan is implemented and tested with real users, decide one of three paths:

1. Double down on diagnosis and scanner depth.
   Choose this if users trust the diagnosis but want deeper technical proof.

2. Expand service execution and specialist matching.
   Choose this if users say, "I believe the diagnosis. Who can fix this?"

3. Rework the product promise.
   Choose this if users do not trust or act on the diagnosis.

The first external product should not chase all three at once.
