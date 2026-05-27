# AI-Supported Project To Product User Story

Date: 2026-05-24

Status: productization journey definition for implementation and QA

Audience: product, backend, frontend, scanner, LoomAI, delivery, and operations owners

## 1. Purpose

This document defines the full AI-supported ProdUS user story from the moment an owner creates a productization project until the work reaches product-level readiness.

ProdUS remains the system of record for identity, authorization, product data, source connections, scanner execution, service packages, team selection, workspace delivery, evidence, milestones, and audit. LoomAI supports the journey with governed conversation, recommendations, summaries, decision preparation, and selected write-backed creation flows.

AI is a first-class productization participant when the owner intentionally chooses AI-assisted project analysis or AI-assisted creation from the ProdUS UI. In that mode, ProdUS may allow AI to create bounded business records through approved backend write actions. Those writes must be authorized by the current user session, scoped to the active productization intent, and audited as `created by AI` with the initiating human, prompt trace, source inputs, and provider request id. AI must not execute high-risk operational or contractual mutations without a separate human confirmation path.

The target journey is:

```text
AI-first intake conversation
  -> owner shares product goal, attachments, links, and constraints
  -> owner opts into AI-assisted project creation
  -> AI creates the productization project record through ProdUS write action
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

| Actor               | Primary Need                                                                                                | AI Support                                                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Product Owner       | Turn a prototype or internal project into a production-ready product                                        | Diagnosis, service selection, package recommendation, blocker explanation, next decision guidance                                   |
| Team Lead           | Understand delivery scope and evidence requirements                                                         | Workspace summary, milestone risk, missing proof, remediation guidance                                                              |
| Solo Expert         | Join productization work with scoped contribution                                                           | Capability match rationale, work context, evidence expectations                                                                     |
| Reviewer or Advisor | Assess readiness, evidence, and risk                                                                        | Evidence summary, finding explanation, review notes, risk framing                                                                   |
| Admin or Operator   | Keep AI, scanner, connectors, and indexing healthy                                                          | Integration health, sync status, production readiness checks, audit trace visibility                                                |
| AI Operator         | Convert owner-approved conversations, attachments, links, and analysis output into structured draft records | Governed write actions for draft project creation, intake normalization, analysis note creation, and suggested service plan seeding |

## 3. Core User Story

As a product owner, I want to explain my product naturally to an AI productization operator, attach the context I already have, let AI create the first structured project draft for me, connect source evidence, receive AI-guided diagnosis and service recommendations, select the right delivery support, and move through a governed workspace until the product has evidence-backed readiness.

The system must:

- keep every business mutation in ProdUS
- use AI only through ProdUS backend-mediated LoomAI integration
- use real scanner, catalog, package, workspace, team, solo expert, milestone, and evidence data
- keep private product data authorized and bounded
- index safe reusable knowledge through managed vectorization
- provide live context to LoomAI through backend context enrichment and approved MCP/read/write action contracts
- show AI output as supporting guidance for decisions, while allowing AI-created draft records when the owner has opted into AI-assisted creation
- require explicit human confirmation for selected teams/experts, workspace participant access, team invitations, milestone approval, risk acceptance, and product-level readiness
- audit every AI-created record with human initiator, AI actor, source inputs, and trace metadata

## 4. Journey Stages

### 4.1 Stage 1: Productization Project Creation

Owner opens ProdUS Studio and starts productization through either a guided form or an AI-first conversational intake.

The preferred experience is AI-first:

```text
Owner opens Studio
  -> chooses "Use AI to create my productization project"
  -> describes the product naturally
  -> attaches docs, screenshots, pitch notes, architecture notes, URLs, repo links, videos, or customer context
  -> explicitly selects which attached documents may be shared with AI for this analysis run
  -> AI asks targeted follow-up questions
  -> AI extracts structured product facts, risks, goals, users, constraints, and evidence hints
  -> Step 1: owner runs AI project analysis
  -> LoomAI returns creation attributes, assumptions, and missing evidence
  -> Step 2: owner continues with AI creation
  -> LoomAI runtime action invokes ProdUS project creation action with the analyzed attributes
  -> ProdUS backend validates consent, idempotency, authorization, and temporary document references
  -> ProdUS creates the productization project record
```

Minimum structured inputs, whether provided directly or extracted by AI:

- product name
- current stage: idea, prototype, internal tool, pilot, production candidate, live product
- business goal
- target users or customers
- current tech stack
- known risks
- target launch or readiness date
- optional source repository
- optional project attachments and links

AI support:

- conduct a creative intake conversation that feels like a senior productization partner
- use owner-selected project attachments and links only for the current AI analysis run
- extract candidate product facts, target users, business goal, product stage, tech stack, risks, dependencies, and missing evidence
- ask targeted follow-up questions only when needed to reduce ambiguity
- produce an owner-readable analysis brief before project creation
- return normalized creation attributes from the analysis step
- create the productization project through an approved runtime action when the owner continues after analysis
- store the AI creation summary, assumptions, missing-evidence notes, and provider request id on the created project context
- explain what evidence will be needed later
- avoid package, workspace, team, invite, participant, or access-list creation in this project creation flow

Expected UI behavior:

- owner can choose either manual creation or AI-assisted creation
- AI-assisted creation has a clear consent action such as "Use AI to create this project"
- AI-assisted creation has two visible steps: analysis first, then creation
- document upload is attached only to the project/product context, not public catalog knowledge
- each uploaded document has a clear "Share with AI for this analysis" control
- after consent, project creation does not require a second confirmation for each extracted field
- AI shows extracted facts, assumptions, attachments, and links before or immediately after creation
- AI shows document-use evidence for every owner-selected file: opened through temporary URL, or not used with reason
- owner can edit the AI-created project fields normally after creation
- AI helper appears as a Studio creation surface, not a generic chatbot floating outside context
- vague required fields can be created as assumptions only if marked clearly and routed to follow-up

Backend responsibilities:

- accept conversational intake, attachments, and links through ProdUS backend only
- store uploads and links as private project/product-scoped attachment records
- issue temporary AI access only for explicitly selected attachments during the analysis run
- instruct LoomAI to pass temporary document URLs as provider-native typed file/document URL inputs
- require LoomAI to return per-document evidence status before treating a selected document as used
- create and validate a short-lived project creation intent between analysis and mutation
- authorize AI-assisted creation against current user/session, creation intent, and productization intent
- expose a governed ProdUS action/MCP mutation for runtime action execution
- create the product/project record only from the approved runtime action call
- create audit event for product creation with `createdByType=AI`, `initiatedBy=<ownerId>`, `aiProviderRequestId`, `traceId`, and source input references
- mark AI-created fields with provenance where practical
- expose product context to AI only after authorization
- include product id in later assistant context

Project attachment handling:

- Attachments uploaded during project creation are stored as private project/product files.
- Attachments are not exported to managed vectorization and are not added to safe shared knowledge.
- Attachments are not publicly available and do not use permanent public URLs.
- The owner must explicitly select which attachments are shared with AI for the current project analysis run.
- ProdUS marks selected attachments as temporarily AI-accessible for a short TTL, normally 5-15 minutes.
- AI access is provided through a short-lived ProdUS backend document URL that returns the selected file bytes directly with `Cache-Control: no-store`.
- ProdUS does not send document text excerpts to LoomAI; LoomAI should pass the temporary URL to its provider adapter as a typed file/document URL input, such as OpenAI Responses API `input_file.file_url`, then report whether the document was used.
- The temporary URL/token is invalidated after TTL, after project creation completes, or when the owner revokes AI access.
- The document remains attached to the project/product for owner access after AI access expires. If the owner later creates a workspace, access for approved participants must be granted through the workspace flow, not by the AI creation flow.
- No indexing is required for this flow.
- AI must return a `documentUsage` entry for each selected file with `documentId`, `status`, `accessMethod`, owner-safe `evidence`, and `reason`.
- Valid `status` values are `USED` and `NOT_USED`.
- Valid `accessMethod` values are `TEMPORARY_URL` and `NONE`.
- AI must not mark a file as `USED` unless it extracted at least one owner-safe evidence fact from the file.

Recommended AI write action contract:

```json
{
  "action": "produs.productization_project.create",
  "initiatedBy": "<ownerUserId>",
  "actor": "AI_OPERATOR",
  "creationIntentId": "<produsProjectCreationIntentId>",
  "consentToken": "<server-issued-ai-assisted-creation-consent>",
  "idempotencyKey": "project-create:<creationIntentId>:<analysisProviderRequestId>",
  "inputs": {
    "conversationId": "project-intake:<temporaryOrProductId>",
    "ownerMessage": "Natural product description",
    "attachmentIds": ["<projectAttachmentId>"],
    "aiAccessibleAttachmentIds": ["<projectAttachmentId>"],
    "linkIds": ["<linkId>"]
  },
  "project": {
    "name": "Extracted product name",
    "stage": "PROTOTYPE",
    "businessGoal": "Owner-readable goal",
    "targetUsers": "Target users",
    "techStack": "Detected or declared stack",
    "knownRisks": "Known or inferred risks",
    "readinessTargetDate": "optional ISO date",
    "assumptions": ["Explicitly marked assumption"]
  }
}
```

Acceptance criteria:

- owner can create a project manually or through AI-assisted intake
- AI-assisted intake separates analysis and mutation into two backend-visible steps
- AI-created project record is persisted with owner identity and AI provenance
- AI-created project fields are normal editable project fields after creation
- attachments and links used for creation are visible in the project intake evidence trail
- only owner-selected attachments are temporarily shared with AI
- temporary AI document access expires quickly and does not create public availability
- UI shows whether each selected document was actually opened by AI, only used through fallback, or not used
- AI does not create packages, workspaces, teams, invites, participant lists, or access lists in Stage 1
- empty or vague required fields are either blocked in manual mode or clearly marked as AI assumptions in AI-assisted mode
- product appears in owner dashboard and product studio
- audit trail shows the AI write action, human initiator, created fields, and trace metadata
- duplicate runtime action calls with the same idempotency key return the existing product instead of creating duplicates

### 4.2 Stage 2: AI-Assisted Diagnosis

Owner opens the product diagnosis view or runs project analysis directly from AI-assisted creation.

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
- when invoked from Stage 1, seed the initial diagnosis draft from the AI-created project context and intake evidence

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
- project analysis can create the initial project and diagnosis draft through approved AI write actions after owner opt-in
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
- AI can create a package or workspace only when the owner explicitly chooses the AI creation action from the UI
- selected team/expert assignments and participant access require owner review before they are applied

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

Owner converts package scope into a project workspace manually or by choosing "Create workspace with AI."

When the owner chooses AI workspace creation, ProdUS can create the workspace immediately through an approved backend write action. This is not a separate draft-workspace concept. The workspace is a real workspace record, but owner-sensitive selections still have confirmation boundaries:

- selected team or solo experts must be reviewed and confirmed by the owner before assignment
- access and participant list must be reviewed and confirmed by the owner before invitations or access grants
- AI-recommended milestones, deliverables, acceptance criteria, evidence requirements, and kickoff notes can be created with the workspace
- owner can edit workspace fields normally after creation

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
- create the workspace record when owner has chosen AI workspace creation
- generate kickoff questions
- generate milestones, deliverables, acceptance criteria, and evidence requirements from package context
- explain evidence expectations to teams

Acceptance criteria:

- workspace creation requires either manual owner action or owner-selected AI workspace creation action
- AI-created workspace records are real records, editable after creation, and audited as AI-created with the initiating owner
- participant access and selected team/expert assignment require owner confirmation before they are applied
- participants are authorized before access is granted
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

| Surface                    | Page                         | Purpose                                                                                                               | Runtime Endpoint                                   |
| -------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| AI Project Intake          | Product Creation             | Conversationally collect owner input, attachments, and links, then create draft project through approved write action | `/api/ai/assistant/query` + ProdUS AI write action |
| Owner Brief                | Product Studio               | Explain product state and next decision                                                                               | `/api/ai/assistant/query-once`                     |
| Diagnosis Explainer        | Product Diagnosis            | Explain readiness and blockers                                                                                        | `/api/ai/assistant/query-once`                     |
| Service Selector Assistant | Service Catalog/Product Cart | Recommend lifecycle services                                                                                          | `/api/ai/assistant/query-once`                     |
| Package Recommendation     | Package Builder              | Explain package structure, dependencies, budget/timeline risk                                                         | `/api/ai/assistant/query-once`                     |
| Scanner Summary            | Product Scanner              | Summarize scan outcome and risk                                                                                       | `/api/ai/assistant/query-once`                     |
| Finding Review             | Finding Detail               | Explain finding impact and remediation                                                                                | `/api/ai/assistant/query-once`                     |
| Team Match Rationale       | Team/Expert Matching         | Explain shortlist and comparison logic                                                                                | `/api/ai/assistant/query-once`                     |
| Workspace Brief            | Active Workspace             | Summarize scope, blockers, and next work                                                                              | `/api/ai/assistant/query-once`                     |
| Milestone Evidence Review  | Milestone Review             | Explain evidence readiness and missing proof                                                                          | `/api/ai/assistant/query-once`                     |
| Conversational Assistant   | Studio Side Panel            | Follow-up questions within authorized product context                                                                 | `/api/ai/assistant/query`                          |

Use `query-once` for page helpers and explainers. Use persistent `query` only for conversational assistant panels where saved chat history is intended.

Use backend-approved AI write actions only for bounded draft creation flows. The frontend never calls LoomAI directly and never sends write instructions outside the ProdUS backend action gateway.

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
- exclude project/product attachments, private messages, invitations, raw evidence files, source code, raw logs, tokens, object storage URLs, and credentials
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
- owner-selected project/product attachments through short-lived AI access only

Context must be compact, redacted, and bounded before sending to LoomAI.

### 6.3 Temporary AI Document Access

Project/product documents are not indexed and are not exported as reusable knowledge. They are used only when the owner explicitly selects them for an AI run.

Simple flow:

```text
Owner uploads document during project creation
  -> ProdUS stores private project/product attachment
  -> Owner selects "Share with AI for this analysis"
  -> ProdUS creates short-lived AI access token or signed URL
  -> Backend sends only selected temporary access references to LoomAI
  -> AI analysis completes
  -> ProdUS invalidates or lets temporary access expire
  -> Document remains attached privately to the project/product
```

Rules:

- default document state is not AI-accessible
- AI access TTL should be measured in minutes
- temporary access is scoped to one project/product and one analysis request
- temporary access must be revocable by the owner
- the attachment remains available later only to the owner and approved workspace participants through ProdUS authorization
- no managed vectorization is required for uploaded project/product documents

## 7. Backend Responsibilities

ProdUS backend must:

- authenticate user through Supabase or staging mock auth
- authorize product/package/workspace/finding/milestone ids
- authorize project/product attachment ids before temporary AI sharing
- build safe context summaries
- redact secrets and sensitive fields
- sign private runtime assertions
- call LoomAI runtime from backend only
- expose an AI action gateway for approved write-backed flows
- normalize LoomAI responses for frontend
- store audit events for AI requests where needed
- expose provider request id and trace id for support
- enforce human opt-in and action-level policy for AI mutations
- persist AI-created records with provenance and editable draft status
- issue and revoke short-lived AI document access tokens or signed URLs for owner-selected attachments

## 8. Frontend Responsibilities

ProdUS frontend must:

- call only ProdUS backend AI endpoints
- never store or expose LoomAI secrets
- render Markdown safely
- show loading, error, denied, fallback, and retry states
- tie every AI surface to the current product or workspace context
- make AI suggestions visibly optional, except when the owner explicitly starts AI-assisted creation
- show AI-created fields, assumptions, source attachments, and edit controls clearly
- show per-document AI sharing state: not shared, temporarily shared, expired, or revoked
- provide clear owner actions after AI output
- keep Apple-like Studio UI: clean hierarchy, soft cards, compact controls, clear status labels, and consistent button sizing

## 9. Human Confirmation Boundary

For the project creation story, AI may directly create bounded records when the owner has opted into AI-assisted project creation:

- productization project/product profile
- extracted product facts and assumptions stored on that project context
- missing-evidence notes or AI creation summary stored on that project context
- source attachment references selected by the owner

These records must be marked as AI-created, editable, and audited. The owner consent to use AI-assisted creation from the UI is sufficient for project creation writes; individual field-level confirmation is not required.

Package creation, workspace creation, team selection, expert selection, participant access, invitations, contracts, payments, scanner execution, and readiness decisions are outside this Stage 1 creation flow. They require their own dedicated UI action and confirmation boundary.

AI may also prepare:

- service recommendations
- package rationale
- milestone suggestions
- evidence review notes
- team comparison questions
- scanner remediation summaries
- readiness memos

AI must not directly execute high-risk or external-impact actions:

- connect repository
- start scan
- invite team or solo expert
- assign selected team or solo expert without owner confirmation
- grant participant access without owner confirmation
- approve milestone
- accept risk
- mark product as product-level ready
- execute payment, contract, access-control, or deployment changes

AI-created records and AI-written analysis records are ProdUS backend actions with audit logging. High-risk workflow transitions and access-impacting actions require separate human confirmation and remain controlled by ProdUS.

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
2. Start AI-assisted project creation for a prototype product.
3. Add natural-language product context plus at least one attachment or link.
4. Run project analysis and allow AI to create the productization project.
5. Review AI-created fields, assumptions, intake evidence, and audit trace.
6. Ask AI for an owner brief.
7. Open diagnosis and request AI diagnosis explanation.
8. Connect GitHub App source.
9. Run hosted SAFE_STATIC scan.
10. Review scanner summary and a critical/high finding with AI.
11. Add recommended lifecycle services to the project cart.
12. Build a package and request AI package recommendation.
13. Compare matched teams and solo experts with AI rationale.
14. Create workspace from package and selected delivery support.
15. Upload or attach milestone evidence.
16. Use AI milestone evidence review.
17. Resolve or risk-accept blockers through human workflow.
18. Generate final readiness memo.
19. Mark product-level readiness only through authorized ProdUS action.

Expected outcome:

- every AI response is grounded in current product context
- AI can create draft project records only after owner opt-in to AI-assisted creation
- AI-created records have provenance, source inputs, and audit trace
- every business action has backend persistence
- no browser call goes directly to LoomAI
- no secrets or raw private artifacts are sent to LoomAI
- product readiness is human-confirmed and auditable

## 12. Open Implementation Checks

These checks must be tracked as part of implementation QA:

- verify all Studio assistant surfaces use `/api/ai/assistant/query-once` except persistent chat
- verify AI-assisted project intake uses persistent conversation plus approved write action gateway
- verify AI-created productization records are drafts with AI provenance and human initiator
- verify attachments and links used by AI intake are stored, authorized, redacted, and visible in the evidence trail
- verify project/product document uploads are private by default and never indexed
- verify only owner-selected documents receive short-lived AI access
- verify temporary AI document access expires or is invalidated after project creation/analysis
- verify product, scanner, package, workspace, milestone, team, and solo expert contexts are authorized
- verify managed vectorization export includes team and solo expert public profiles
- verify UI renders Markdown and denial/error states cleanly
- verify scanner findings can be converted into service/package decisions
- verify team invite and shortlist actions are backend-backed and not AI-executed
- verify product-level readiness transition is audited
- verify staging and production secrets remain backend-only
