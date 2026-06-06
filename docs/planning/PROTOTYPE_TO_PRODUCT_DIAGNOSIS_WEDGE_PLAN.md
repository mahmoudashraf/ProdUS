# ProdUS Prototype-To-Product Diagnosis Wedge Plan

Date: 2026-06-05

Audience: product, engineering, design, AI integration, catalog, scanner, and delivery stakeholders

Status: implementation plan; Sequence 1 implemented; Sequence 2 implemented; Sequence 3 is the next build slice

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

The current system can already perform the broad journey, but the experience is still more "possible" than "obvious":

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

## 3. Implementation Spine

This plan should be implemented as one cohesive owner flow, not as separate feature islands:

```text
Project Analysis
  -> Repo And Scanner Facts
  -> Production Diagnosis
  -> Fix Path
  -> Service Plan
  -> Workspace Start
  -> Launch Readiness Report
```

Each layer has a clear job:

- scanners and repo tools collect grounded facts
- ProdUS normalizes those facts into safe product signals
- LoomAI explains and synthesizes from bounded context
- the catalog translates blockers into real services
- the workspace turns selected services into milestones, proof tasks, and delivery context
- the report proves what is ready, what is risky, and what decision comes next

Implementation principle:

> Store deterministic facts and validated choices. Let AI explain, prioritize, and suggest, but do not persist unsupported AI claims as source-of-truth data.

## 4. Target Users

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

## 5. Product Tone

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

## 6. Non-Goals

Do not prioritize these until the diagnosis wedge is credible:

- broad team marketplace expansion
- public expert community growth
- generic AI chatbot surfaces
- heavy enterprise approval chains
- public social or reputation network
- automatic AI calls on every page load
- AI write actions beyond the governed project creation flow
- a full project management replacement

## 7. Success Criteria

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

## 8. Sequence Dependency Map

| Sequence | Build Slice | Depends On | Produces |
| --- | --- | --- | --- |
| 1 | Diagnosis Quality Harness | Existing scanner classifier and catalog modules | Regression harness for diagnosis and service-mapping quality |
| 2 | Repo And Scanner Fact Understanding | Repo source connection, scanner outputs, safe file access | Grounded repo signal snapshot and owner-facing repo readout |
| 3 | AI Analysis Contract Upgrade | Sequence 2 facts when available, service catalog snapshot, LoomAI private runtime | Validated project intelligence and catalog-backed recommendations |
| 4 | Scanner To Fix Path Hardening | Scanner findings, catalog modules, Sequence 2/3 context | Stored diagnosis snapshot and owner-readable fix path |
| 5 | Service Plan From Diagnosis | Sequence 4 fix path and catalog dependency rules | Workspace-ready service plan with dependency guidance |
| 6 | Launch Readiness Report | Diagnosis, service plan, scanner evidence, workspace proof | Shareable readiness report |
| 7 | Project Analysis To Fix Path Demo Flow | Sequences 2 through 6 | One polished owner journey for staging and external validation |
| 8 | Measurement And Review | All prior slices | Product and quality feedback loop |

Build rule:

- Implement the deterministic foundation first.
- Add AI synthesis where it improves understanding.
- Keep expensive AI calls user-triggered.
- Validate every persisted AI-derived service/module/reference against backend data.

## 9. Implemented Build Slice

**Sequence 2: Repo And Scanner Fact Understanding** is implemented.

Goal:

> When an owner creates a project with a repo, ProdUS should show what it safely knows about that repo before asking the owner to trust AI interpretation or service recommendations.

Backend scope:

- add a repo signal model for product/workspace context:
  - `productId`
  - `workspaceId`, optional
  - `signalType`
  - `signalValue`
  - `confidence`
  - `source`
  - `sourceTool`
  - `sourcePath`
  - `evidenceKind`
  - `ownerSafeEvidence`
  - `detectedAt`
- add repo signal refresh service:
  - reads existing product repo source
  - uses scanner outputs when available
  - reads bounded safe files only when provider/source access allows it
  - stores normalized signals
  - never stores secrets or raw large file contents
- add endpoints:
  - `GET /api/products/{productId}/repo-signals`
  - `POST /api/products/{productId}/repo-signals/refresh`
  - workspace equivalents if workspace-scoped signals already have enough context
- add compact repo/scanner facts builder for LoomAI context:
  - used by project analysis and future diagnosis explanation
  - excludes unsupported/unverified claims

Frontend scope:

- add Repo Readout panel to the product page:
  - source status
  - detected stack
  - dependency/test/deploy/docs signals
  - scanner facts
  - unknowns and next scan action
- show facts separately from AI interpretation:
  - "Detected by ProdUS"
  - "Explained by LoomAI"
  - "Still unknown"
- add user-triggered refresh action.

Verification scope:

- backend tests for signal normalization, owner access, scanner-backed facts, and safe unknowns
- frontend build/type-check
- live product page verification with `mahmoudashraf/ProdUS`

Implemented artifacts:

- `repo_signals` database table and Liquibase migration
- product endpoints:
  - `GET /api/products/{productId}/repo-signals`
  - `POST /api/products/{productId}/repo-signals/refresh`
- workspace endpoints:
  - `GET /api/workspaces/{workspaceId}/repo-signals`
  - `POST /api/workspaces/{workspaceId}/repo-signals/refresh`
- deterministic repo signal builder using product profile, scanner sources, scanner runs, and normalized findings
- compact `aiContextFacts` response for future LoomAI context enrichment
- owner Productization Workspace Repo Readout panel with manual refresh

## 9A. Immediate Next Build Slice

The next implementation slice is **Sequence 3: AI Analysis Contract Upgrade**.

Goal:

> Project analysis should use grounded repo/scanner facts and a compact service catalog snapshot so AI output becomes actionable project intelligence, not descriptive text.

Backend scope:

- include repo signal `aiContextFacts` when a product/workspace already exists
- keep project-creation analysis grounded in owner input, temporary document URLs, repository URL, and the compact service catalog snapshot
- require recommended services to return real catalog module codes/slugs
- validate all AI-returned catalog references before persistence
- persist only owner-approved project intelligence during project creation

Frontend scope:

- show which project intelligence fields will be persisted when the owner creates the project
- show AI-recommended services as selectable catalog-backed chips/cards
- separate "AI observed", "Owner confirmed", and "Still missing" in the creation UI
- keep AI analysis user-triggered.

Verification scope:

- test analysis contract parsing and catalog validation
- verify project creation stores service recommendations and repo source correctly
- verify AI analysis does not block project creation only because document usage proof is inconclusive unless the explicit config says so

## 10. Implementation Sequence

### Sequence 1: Diagnosis Quality Harness

Purpose:

Create a repeatable way to prove the diagnosis is specific, useful, and regression-safe.

Depends on:

- existing scanner finding classifier
- existing catalog service modules
- admin-only internal review surface

Produces:

- repeatable diagnosis/service-mapping regression harness
- fixture results that show whether the diagnosis became generic or less actionable

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

### Sequence 2: Repo And Scanner Fact Understanding

Purpose:

Make repository and source understanding strong enough that the diagnosis feels project-specific, without relying on AI as the only detector.

The preferred technical model is:

```text
repo connection + scanners/tools
  -> bounded raw facts
  -> ProdUS repo signal normalization
  -> LoomAI extraction/explanation from those facts
  -> backend validation and storage
  -> owner-facing repo readout and scanner focus
```

ProdUS should not ask an LLM to blindly inspect a whole repository as the source of truth. Scanners and repo tools should collect grounded facts. AI should turn those facts into a useful productization interpretation.

Depends on:

- product repository URL or connected GitHub/GitLab source
- scanner output where available
- bounded safe file access for README/config/manifests

Produces:

- normalized repo signal snapshot
- owner-facing Repo Readout
- scanner focus areas for the next diagnosis run

Backend deliverables:

- repo fact collection from available scanners/tools:
  - GitHub/GitLab repository metadata and language stats, when available
  - dependency/SBOM summaries from supported scanners such as Syft, cdxgen, Trivy, or equivalent
  - security/config findings from supported scanners such as Trivy, Semgrep, OSV, or equivalent
  - CI/CD workflow presence from `.github/workflows`, `.gitlab-ci.yml`, or connected provider metadata
  - container/deployment file presence from Docker, compose, platform config, or CI deployment steps
  - README/documentation summary from bounded safe files
  - test/tooling signals from package manifests, test directories, and scanner output
- deterministic repository metadata normalization:
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
  - `sourceTool`, when derived from scanner output
  - `evidenceKind`
  - `ownerSafeEvidence`
  - `detectedAt`
- compact repo intelligence request to LoomAI:
  - owner brief
  - product/repository URL
  - language/framework/dependency facts
  - scanner summary and top findings
  - CI/CD, test, deploy, database, auth, and documentation signals
  - service catalog snapshot
  - explicit instruction to explain only from provided facts and identify missing evidence
- backend validation for AI-extracted repo intelligence:
  - reject invented scanner facts from stored signals
  - reject invented catalog service module codes from persisted recommendations
  - keep unsupported AI suggestions as `missingEvidence` or `missingCatalogCoverage`
  - store confidence and source attribution for each accepted signal
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
- scanner/tool fact cards:
  - dependency inventory
  - CI/CD detected or missing
  - test tooling detected or missing
  - deploy/container signals
  - documentation/readme signal
- AI interpretation card:
  - "What this repo appears to be"
  - "What looks production-ready"
  - "What is still unknown"
  - "What to scan next"
- "Run scanner" and "Refresh repo signals" actions

Acceptance criteria:

- A provided repo URL appears after project creation and is ready for scan when accessible.
- Product pages show scanner/tool facts separately from AI interpretation.
- Scanner focus areas are informed by repo metadata, scanner output, and validated AI extraction.
- AI repo intelligence includes evidence references or marks the point as unverified.
- Stored repo signals are grounded in scanner/tool facts or safe bounded repo files, not unverified AI claims.

### Sequence 3: AI Project Analysis Contract Upgrade

Purpose:

Make AI analysis useful for project creation and downstream diagnosis, not just descriptive.

Depends on:

- service catalog snapshot
- Sequence 2 repo/scanner facts when available
- LoomAI private runtime integration
- temporary document URL support

Produces:

- validated project intelligence snapshot
- catalog-backed service recommendations
- AI opportunities that can be carried into project creation

Backend deliverables:

- compact service catalog snapshot passed to LoomAI during project analysis:
  - `moduleCode`
  - `name`
  - `categorySlug`
  - `outcome`
  - `tags`
  - `requiredSignals`
- compact repo/scanner facts snapshot passed to LoomAI when available:
  - detected languages and frameworks
  - package manager and dependency summary
  - CI/CD, deploy, database, auth, test, and documentation signals
  - scanner finding summary by severity/category
  - owner-safe evidence references
  - unverified or missing evidence list
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
- AI analysis uses scanner/tool-derived repo facts as grounded context when those facts exist.

### Sequence 4: Scanner To Fix Path Hardening

Purpose:

Turn scanner findings into owner-readable fix paths and catalog-backed service recommendations.

Depends on:

- scanner runs and normalized findings
- catalog module mapping rules
- repo signals and project analysis context when available

Produces:

- persisted diagnosis snapshot
- stored finding-to-service mapping
- owner-readable priority fix path

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

Depends on:

- Sequence 4 fix path
- catalog dependencies and service requirements
- owner-selected or accepted recommendations

Produces:

- workspace-ready service plan
- dependency guidance before workspace start
- clear blocked-conversion recovery path

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

Depends on:

- latest diagnosis snapshot
- scanner evidence
- selected services
- workspace proof tasks, when a workspace exists

Produces:

- shareable readiness report
- owner/advisor-facing summary of what is ready, risky, and next

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

### Sequence 7: Project Analysis To Scanner To Fix Path Demo Flow

Purpose:

Create one excellent path that the team can demo, test, and use for external validation.

Depends on:

- Sequences 2 through 6
- staging test repo and README/spec attachment
- mock and production-like auth paths

Produces:

- one polished, repeatable owner journey
- the external validation path for MVP/startup users

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

Depends on:

- events and snapshots from the previous sequences
- fixture harness results
- staging demo runs

Produces:

- product quality feedback loop
- weekly diagnosis/service-mapping review inputs

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

## 11. LoomAI Role

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

## 12. Security And Production Constraints

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

## 13. Backend Deliverables Summary

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

## 14. Frontend Deliverables Summary

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

## 15. Test And Verification Plan

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

## 16. Review Gates

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

## 17. Product Decision After This Plan

After this plan is implemented and tested with real users, decide one of three paths:

1. Double down on diagnosis and scanner depth.
   Choose this if users trust the diagnosis but want deeper technical proof.

2. Expand service execution and specialist matching.
   Choose this if users say, "I believe the diagnosis. Who can fix this?"

3. Rework the product promise.
   Choose this if users do not trust or act on the diagnosis.

The first external product should not chase all three at once.
