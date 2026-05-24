# AI-Supported Project To Product User Story

Date: 2026-05-24

Status: productization journey definition for implementation and QA

Audience: product, backend, frontend, scanner, LoomAI, delivery, and operations owners

## 1. Purpose

This document defines the full AI-supported ProdUS user story from the moment an owner creates a productization project until the work reaches product-level readiness.

ProdUS remains the system of record for identity, authorization, product data, source connections, scanner execution, service packages, team selection, workspace delivery, evidence, milestones, and audit. LoomAI supports the journey with governed explanation, recommendations, summaries, and decision preparation. AI must not mutate business records without an explicit ProdUS confirmation path.

The target journey is:

```text
Create productization project
  -> describe product and business goal
  -> AI-assisted diagnosis
  -> connect source and run scanners
  -> normalize findings and evidence
  -> choose lifecycle services
  -> build package and project cart
  -> shortlist teams or solo experts
  -> create delivery workspace
  -> execute milestones with evidence
  -> review readiness and blockers
  -> reach product-level readiness
```

## 2. Primary Actors

| Actor | Primary Need | AI Support |
| --- | --- | --- |
| Product Owner | Turn a prototype or internal project into a production-ready product | Diagnosis, service selection, package recommendation, blocker explanation, next decision guidance |
| Team Lead | Understand delivery scope and evidence requirements | Workspace summary, milestone risk, missing proof, remediation guidance |
| Solo Expert | Join productization work with scoped contribution | Capability match rationale, work context, evidence expectations |
| Reviewer or Advisor | Assess readiness, evidence, and risk | Evidence summary, finding explanation, review notes, risk framing |
| Admin or Operator | Keep AI, scanner, connectors, and indexing healthy | Integration health, sync status, production readiness checks, audit trace visibility |

## 3. Core User Story

As a product owner, I want to create a productization project, connect the product context and source evidence, receive AI-guided diagnosis and service recommendations, select the right delivery support, and move through a governed workspace until the product has evidence-backed readiness.

The system must:

- keep every business mutation in ProdUS
- use AI only through ProdUS backend-mediated LoomAI integration
- use real scanner, catalog, package, workspace, team, solo expert, milestone, and evidence data
- keep private product data authorized and bounded
- index safe reusable knowledge through managed vectorization
- provide live context to LoomAI through backend context enrichment and read-only MCP actions
- show AI output as supporting guidance, not final authority
- require explicit human confirmation for package creation, workspace creation, milestone approval, and risk acceptance

## 4. Journey Stages

### 4.1 Stage 1: Productization Project Creation

Owner opens ProdUS Studio and creates a productization project.

Required inputs:

- product name
- current stage: idea, prototype, internal tool, pilot, production candidate, live product
- business goal
- target users or customers
- current tech stack
- known risks
- target launch or readiness date
- optional source repository

AI support:

- improve product summary language
- identify missing project context
- suggest initial productization questions
- explain what evidence will be needed later

Expected UI behavior:

- form validates required fields
- owner can save draft or continue to diagnosis
- AI helper appears as a compact Studio assistant panel, not a blocking wizard
- AI suggestions can be accepted into fields only by explicit click

Backend responsibilities:

- create product/project record
- create audit event for product creation
- expose product context to AI only after authorization
- include product id in later assistant context

Acceptance criteria:

- product record is created with owner identity
- empty or vague required fields are blocked
- AI cannot create the project by itself
- product appears in owner dashboard and product studio

### 4.2 Stage 2: AI-Assisted Diagnosis

Owner opens the product diagnosis view.

Diagnosis inputs:

- product metadata
- declared business goal
- stage
- known risks
- linked service catalog knowledge
- source connection status
- existing scanner and evidence state
- current service/package/workspace state

AI support:

- explain product readiness in plain language
- identify likely blockers
- distinguish facts, missing evidence, and assumptions
- suggest the next owner decision
- recommend whether to connect source code, build a service package, or request expert review

LoomAI request pattern:

```json
{
  "query": "Explain this product diagnosis and the next owner decision.",
  "conversationId": "product-diagnosis:<productId>",
  "mode": "support_assistant",
  "position": "productization",
  "context": {
    "pageType": "product-diagnosis",
    "actorRole": "PRODUCT_OWNER",
    "productId": "<productId>",
    "contextPurpose": "diagnosis_explanation"
  }
}
```

Expected response handling:

- render Markdown safely
- show answer, confidence, trace id, provider request id if present
- show "based on available evidence" language
- never show runtime internals or raw prompts

Acceptance criteria:

- diagnosis page gives clear readiness interpretation
- AI response references real product context
- access-denied responses are rendered as actionable product-access issues
- no private secrets, repository code, or raw scanner logs are sent to LoomAI

### 4.3 Stage 3: Source Connection And Scanner Run

Owner connects GitHub or GitLab source to the product.

Supported source paths:

- GitHub App installation
- GitLab connector when configured
- manual public source URL
- external CI/imported scan artifacts

AI support:

- explain why source connection is valuable
- explain which scanners will run
- summarize what each scanner checks
- after scan completion, explain the result in owner language

Scanner flow:

```text
Owner connects source
  -> ProdUS records connector/source
  -> Owner starts hosted SAFE_STATIC scan
  -> scanner workers execute configured tools
  -> findings are normalized
  -> evidence/artifacts are stored
  -> product diagnosis and AI context are refreshed
```

Required scanner families:

- secret exposure
- dependency vulnerability
- static application security
- container or filesystem configuration
- infrastructure/configuration risk where available

Acceptance criteria:

- GitHub App-backed private repository scans use installation tokens
- scanner run status updates are visible
- findings are grouped by severity, tool, and affected area
- AI can summarize findings without reading raw repository source
- scanner artifacts are retained according to storage policy

### 4.4 Stage 4: Finding Review And Evidence Mapping

Owner, advisor, or team lead reviews scanner findings and evidence.

AI support:

- explain each finding in business and delivery terms
- map findings to service categories and modules
- identify missing proof
- suggest acceptance criteria for remediation
- highlight critical blockers before package or launch decisions

Required AI surfaces:

- AI Scanner Summary
- AI Finding Review
- Evidence Readiness Explainer

Backend context rules:

- authorize product and finding ids
- include compact finding summaries only
- include severity, status, source, scanner, affected area, and safe remediation text
- exclude raw logs, object storage URLs, credentials, tokens, and source snippets unless separately approved

Acceptance criteria:

- critical/high findings are visually obvious
- AI does not downgrade risk severity
- owners can convert findings into service needs or package requirements
- reviewer can see which claims are evidence-backed

### 4.5 Stage 5: Lifecycle Service Selection

Owner selects lifecycle services needed to productize the product.

Example service categories:

- validation and readiness
- code rewrite or refactor
- scaling and performance
- cloud and DevOps
- database readiness
- security hardening
- launch readiness
- operations and support

AI support:

- recommend services from product context and findings
- explain service dependencies
- explain why a service is or is not needed
- warn about conflicts or missing prerequisites
- help compare service bundle options

Expected UI behavior:

- service cards have clear action buttons such as "Add to project cart"
- added services visibly move into the cart
- service dependencies are shown before conversion to package
- AI explanation is tied to the selected product, not generic marketing text

Acceptance criteria:

- every service add/remove action persists through backend
- cart state is specific to the selected product
- service recommendations cite product stage, findings, and evidence gaps
- owner can proceed without AI, but AI guidance is available

### 4.6 Stage 6: Package And Project Cart

Owner converts selected services, source evidence, and product goals into a package proposal.

Package inputs:

- selected lifecycle services
- scanner findings and severity mix
- target launch date
- budget range
- desired delivery model
- team or solo expert preferences
- known constraints

AI support:

- recommend package structure
- explain budget and timeline risk
- identify missing dependencies
- suggest milestone sequence
- explain what must be done before workspace creation

Package output:

- service plan
- dependencies
- milestone plan
- acceptance criteria
- risk register
- evidence requirements
- team/expert matching criteria

Acceptance criteria:

- package can be saved as draft
- owner can adjust service plan before workspace creation
- package recommendation is backed by real catalog and product context
- AI does not create package automatically without owner confirmation

### 4.7 Stage 7: Team And Solo Expert Matching

Owner reviews matched teams and solo experts.

AI support:

- explain why a team or solo expert matches the package
- compare capability coverage
- highlight gaps between package needs and provider capabilities
- suggest questions to ask before selecting

Indexed safe knowledge:

- team public profiles
- solo expert public profiles
- verified service categories
- capability tags
- safe case patterns
- public reputation summaries

Private/live context:

- current shortlist state
- invitations and messages remain ProdUS-owned
- AI must not invite teams or solo experts
- AI must not create or edit profiles

Acceptance criteria:

- shortlist, compare, invite, and cancel actions have backend effects
- pending invitations are visibly disabled or cancelable
- AI can explain match rationale but not send invites
- team and solo expert public data participates in safe indexing where allowed

### 4.8 Stage 8: Workspace Creation

Owner converts package and selected delivery support into a project workspace.

Workspace contains:

- product context
- package scope
- selected team or experts
- milestones
- deliverables
- acceptance criteria
- evidence requirements
- scanner baseline
- owner and reviewer participants

AI support:

- summarize workspace scope
- explain milestone order
- identify early blockers
- generate draft kickoff questions
- explain evidence expectations to teams

Acceptance criteria:

- workspace creation requires explicit owner confirmation
- participants are authorized
- milestones and deliverables are created from the package plan
- AI-generated kickoff content is editable before use

### 4.9 Stage 9: Milestone Execution And Evidence Collection

Team works through milestones and uploads evidence.

AI support:

- summarize milestone status
- list missing evidence
- connect scanner findings to milestone work
- explain whether acceptance criteria are supported by evidence
- prepare review notes for humans

Required evidence types:

- scanner report
- CI/build result
- deployment proof
- test coverage or quality proof
- runbook
- monitoring proof
- rollback plan
- security review note
- stakeholder approval

Acceptance criteria:

- evidence can be attached and reviewed
- milestone readiness is transparent
- AI separates passed, failed, pending, and missing criteria
- failed criteria block approval until human resolves or accepts risk

### 4.10 Stage 10: Product-Level Readiness Review

Owner, reviewer, and team assess whether the product has reached product-level readiness.

Product-level readiness means:

- critical launch blockers are closed or explicitly risk-accepted
- source and scanner baseline is current
- package milestones are complete or intentionally deferred
- required evidence is attached
- operational ownership is clear
- monitoring and support path exist
- rollout, rollback, and handoff steps are documented

AI support:

- produce readiness summary
- explain remaining blockers
- identify missing evidence
- recommend owner decision: continue remediation, approve milestone, request changes, or defer launch
- prepare a non-binding readiness memo for human review

Acceptance criteria:

- AI never certifies readiness on its own
- final decision is human-owned and audited
- readiness state is visible on product, workspace, and dashboard views
- product can transition to product-level status only through ProdUS controlled workflow

## 5. AI Surfaces Required In Studio

| Surface | Page | Purpose | Runtime Endpoint |
| --- | --- | --- | --- |
| Owner Brief | Product Studio | Explain product state and next decision | `/api/ai/assistant/query-once` |
| Diagnosis Explainer | Product Diagnosis | Explain readiness and blockers | `/api/ai/assistant/query-once` |
| Service Selector Assistant | Service Catalog/Product Cart | Recommend lifecycle services | `/api/ai/assistant/query-once` |
| Package Recommendation | Package Builder | Explain package structure, dependencies, budget/timeline risk | `/api/ai/assistant/query-once` |
| Scanner Summary | Product Scanner | Summarize scan outcome and risk | `/api/ai/assistant/query-once` |
| Finding Review | Finding Detail | Explain finding impact and remediation | `/api/ai/assistant/query-once` |
| Team Match Rationale | Team/Expert Matching | Explain shortlist and comparison logic | `/api/ai/assistant/query-once` |
| Workspace Brief | Active Workspace | Summarize scope, blockers, and next work | `/api/ai/assistant/query-once` |
| Milestone Evidence Review | Milestone Review | Explain evidence readiness and missing proof | `/api/ai/assistant/query-once` |
| Conversational Assistant | Studio Side Panel | Follow-up questions within authorized product context | `/api/ai/assistant/query` |

Use `query-once` for page helpers and explainers. Use persistent `query` only for conversational assistant panels where saved chat history is intended.

## 6. Data And Indexing Model

### 6.1 Safe Managed Vectorization

The following entity types should be exported through `GET /api/ai/loomai/knowledge-export` for LoomAI managed vectorization when the relevant vector spaces exist:

- service category
- service module
- service dependency
- package template
- AI capability contract
- milestone template
- acceptance criteria template
- evidence template
- scanner tool description
- case pattern
- team public profile
- solo expert public profile

Export rules:

- include only safe, non-secret, non-tenant-private content
- include stable ids, versions, updated timestamps, and record type metadata
- exclude private messages, invitations, raw evidence files, source code, raw logs, tokens, object storage URLs, and credentials
- team and solo expert records must include only profile content that is safe for marketplace discovery

### 6.2 Live Context Enrichment

The following data should be passed at query time after authorization, not bulk-indexed:

- specific product state
- project cart state
- private service plan state
- specific scanner findings
- workspace status
- milestone evidence status
- private owner/team/reviewer comments
- artifact availability
- current user role and permissions

Context must be compact, redacted, and bounded before sending to LoomAI.

## 7. Backend Responsibilities

ProdUS backend must:

- authenticate user through Supabase or staging mock auth
- authorize product/package/workspace/finding/milestone ids
- build safe context summaries
- redact secrets and sensitive fields
- sign private runtime assertions
- call LoomAI runtime from backend only
- normalize LoomAI responses for frontend
- store audit events for AI requests where needed
- expose provider request id and trace id for support
- enforce confirmation for all business mutations

## 8. Frontend Responsibilities

ProdUS frontend must:

- call only ProdUS backend AI endpoints
- never store or expose LoomAI secrets
- render Markdown safely
- show loading, error, denied, fallback, and retry states
- tie every AI surface to the current product or workspace context
- make AI suggestions visibly optional
- provide clear owner actions after AI output
- keep Apple-like Studio UI: clean hierarchy, soft cards, compact controls, clear status labels, and consistent button sizing

## 9. Human Confirmation Boundary

AI may prepare:

- service recommendations
- package rationale
- milestone suggestions
- evidence review notes
- team comparison questions
- scanner remediation summaries
- readiness memos

AI must not directly execute:

- create product
- create package
- add/remove cart items
- connect repository
- start scan
- invite team or solo expert
- create workspace
- approve milestone
- accept risk
- mark product as product-level ready

Each mutation must remain a ProdUS UI/backend action with audit logging.

## 10. Product-Level Definition Of Done

A product reaches product-level readiness when all of these are true:

- product profile is complete enough for delivery and support
- source connection or external evidence baseline exists
- scanner run is current for the selected source or justified as not applicable
- critical findings are closed, mitigated, or risk-accepted by an authorized human
- selected lifecycle services are complete or intentionally deferred
- package milestones are complete or explicitly waived
- evidence satisfies acceptance criteria
- deployment, rollback, monitoring, and support ownership are documented
- final owner decision is recorded
- readiness summary is visible and auditable

AI may generate the readiness explanation, but ProdUS records the readiness decision.

## 11. End-To-End Acceptance Test

Use this scenario to verify the complete AI-supported story:

1. Log in as product owner.
2. Create a productization project for a prototype product.
3. Ask AI for an owner brief.
4. Open diagnosis and request AI diagnosis explanation.
5. Connect GitHub App source.
6. Run hosted SAFE_STATIC scan.
7. Review scanner summary and a critical/high finding with AI.
8. Add recommended lifecycle services to the project cart.
9. Build a package and request AI package recommendation.
10. Compare matched teams and solo experts with AI rationale.
11. Create workspace from package and selected delivery support.
12. Upload or attach milestone evidence.
13. Use AI milestone evidence review.
14. Resolve or risk-accept blockers through human workflow.
15. Generate final readiness memo.
16. Mark product-level readiness only through authorized ProdUS action.

Expected outcome:

- every AI response is grounded in current product context
- every business action has backend persistence
- no browser call goes directly to LoomAI
- no secrets or raw private artifacts are sent to LoomAI
- product readiness is human-confirmed and auditable

## 12. Open Implementation Checks

These checks must be tracked as part of implementation QA:

- verify all Studio assistant surfaces use `/api/ai/assistant/query-once` except persistent chat
- verify product, scanner, package, workspace, milestone, team, and solo expert contexts are authorized
- verify managed vectorization export includes team and solo expert public profiles
- verify UI renders Markdown and denial/error states cleanly
- verify scanner findings can be converted into service/package decisions
- verify team invite and shortlist actions are backend-backed and not AI-executed
- verify product-level readiness transition is audited
- verify staging and production secrets remain backend-only
