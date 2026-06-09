# ProdUS Real User Production Readiness Plan

Date: 2026-06-06

Audience: product, engineering, design, AI integration, operations, security, and beta-support stakeholders

Status: planning document for real-user production readiness

Primary references:

- `docs/planning/PROTOTYPE_TO_PRODUCT_DIAGNOSIS_WEDGE_PLAN.md`
- `docs/planning/DIAGNOSIS_TO_ACTION_LOOP_PLAN.md`
- `docs/planning/SCANNER_READINESS_NEXT_STEPS.md`
- `docs/PRODUS_NEXT_STRATEGY_PLAN.md`
- `docs/planning/Scanners-AI-integration/LOOMAI_PRODUCT_AI_INTEGRATION_PLAN.md`
- `docs/LOOMAI_STAGING_DEPLOYMENT_HANDOVER.md`

## 1. Readiness Goal

ProdUS should be ready for real users when one owner journey is trustworthy, understandable, and operationally safe:

```text
Prototype, MVP, AI-built app, repo, document, or idea
  -> AI-assisted project intake
  -> repo and document grounding
  -> scanner-backed production diagnosis
  -> priority fix path
  -> catalog-backed service plan
  -> workspace with repo, evidence, milestones, and next actions
```

The goal is not to make every platform area complete. The goal is to make the core diagnosis-to-action loop good enough for serious startup, MVP, agency, and prototype owners to use without hand-holding.

## 2. Product Readiness Bar

ProdUS is ready for real-user production when it reliably answers:

- What is this project trying to become?
- What did ProdUS inspect or use as evidence?
- What is blocking production readiness?
- Which blockers matter first?
- Which concrete ProdUS services address them?
- What proof is missing?
- What can the owner do next?
- What workspace state was created from the diagnosis?

The answer must be specific to the product. Generic launch checklists are not enough.

## 3. Release Posture

Target posture:

```text
Production-facing beta
```

This means:

- real users can sign in and use the core flow
- the product handles private repo/document/project data carefully
- diagnosis quality is measured and reviewed
- AI is useful but bounded
- scanner and workspace failures are recoverable
- support and rollback paths exist

This does not mean:

- every marketplace/community/team feature is complete
- every scanner type is perfect
- AI can execute every action
- all enterprise controls are finished
- the product replaces Jira, GitHub, Notion, or CI/CD tools

## 4. Readiness Gates

### Gate 1: Real Auth And Tenant Boundaries

Goal:

> A real user can sign in, own projects, and only access data they are allowed to see.

Required work:

- Replace production-facing mock auth with Supabase auth for real users.
- Keep mock auth available only for local/dev or explicitly isolated staging demos.
- Enforce product, workspace, document, scanner, and evidence ownership checks.
- Confirm role rules for owner, team member, solo expert, and admin.
- Add tests for cross-user and cross-tenant access denial.
- Ensure all protected backend routes use the same authorization model.

Acceptance criteria:

- A user cannot read or mutate another user's product/workspace.
- Project creation intents cannot be executed by a different signed-in user.
- Expired/stale AI creation payloads return owner-readable errors.
- Mock auth cannot accidentally be enabled for production users.

### Gate 2: Diagnosis Trust And Quality Harness

Goal:

> ProdUS diagnosis is specific enough that owners act on it.

Required work:

- Expand the diagnosis quality harness with real prototype scenarios.
- Include expected findings, expected service mappings, and bad/generic diagnosis examples.
- Score diagnosis specificity, evidence grounding, catalog mapping, and action usefulness.
- Add sample repos or external fixture repos for startup/MVP/AI-built-app cases.
- Track unmapped scanner findings and missing catalog coverage.
- Add review workflow for tuning scanner rules, service mappings, and AI prompts.

Acceptance criteria:

- Harness can run without affecting production data.
- A diagnosis gets a quality score and reasons.
- Generic diagnosis language is penalized.
- Each critical/high scanner finding is mapped or explicitly marked for review.
- Weekly review can identify whether ProdUS is improving.

### Gate 3: GitHub Repo And Scanner Reliability

Goal:

> Repo connection and scanner execution feel boringly reliable.

Required work:

- Verify GitHub App install, repo selection, and repo-source attachment for real users.
- Show clear states: not connected, connected, scanning, failed, completed, needs permission.
- Add scanner retry and failure messaging.
- Store scan runs, findings, artifacts, and evidence with product/workspace context.
- Prevent scanner actions on unauthorized repos.
- Keep scanner execution bounded, observable, and recoverable.

Acceptance criteria:

- Owner can attach a repo and run a scan from the UI.
- Scanner findings are visible without manual backend inspection.
- Failed scans explain what failed and what to do next.
- Scan evidence can be used in product diagnosis and workspace readiness.

### Gate 4: Fix Path Clarity

Goal:

> After a scan, the owner sees the few important things blocking production and what service path resolves them.

Required work:

- Persist scanner-to-service mapping results.
- Show top blockers in founder-friendly language.
- Map findings to real catalog service modules, not free-text service names.
- Surface missing dependencies before workspace creation.
- Provide one-click resolution for missing required services.
- Keep AI explanations user-triggered or tied to explicit analysis runs.

Acceptance criteria:

- Owner sees top blockers, recommended services, evidence needed, and next action.
- Every recommended service resolves to an active catalog module.
- Blocked workspace conversion errors are clear and actionable.
- Owner can add required services without leaving the flow.

### Gate 5: Private Document Handling

Goal:

> Owners can upload project documents safely, share selected files temporarily with AI, and keep documents attached privately to the project/workspace.

Required work:

- Finalize allowed document types and size limits.
- Store uploaded documents privately.
- Generate short-lived AI access URLs only for selected files.
- Report document use evidence from AI responses.
- Do not index temporary project documents by default.
- Support deletion and access revocation.

Acceptance criteria:

- Uploaded documents are not public.
- AI-shared document URLs expire quickly.
- UI shows whether each file was used, not used, or unavailable.
- Project/workspace participants can access only approved documents.

### Gate 6: AI Accountability

Goal:

> AI helps owners understand the diagnosis without becoming an unbounded black box.

Required work:

- Keep all LoomAI calls backend-mediated.
- Use `thinker` mode for analysis/read-only/page helper conversations.
- Use governed action execution only for explicit creation/action flows.
- Pass page context and analysis context into the LoomAI UI widget/chat.
- Show what AI used: owner brief, repo, scanner findings, documents, catalog, assumptions.
- Show what AI could not verify.
- Prevent automatic expensive AI calls on page load.

Acceptance criteria:

- Browser never receives LoomAI runtime secrets.
- Analysis chat can answer questions about the current page analysis.
- AI output includes evidence/source usage where required.
- AI does not silently invent service modules or persisted project facts.

### Gate 7: Workspace Starts Useful

Goal:

> A created workspace is not an empty shell. It carries the project intelligence forward.

Required work:

- Carry product profile, repo source, scanner focus, recommended services, service plan, milestones, evidence needs, and diagnosis summary into workspace creation.
- Make next action obvious after workspace creation.
- Link scanner findings to milestones/proof tasks where possible.
- Keep selected team/expert recommendations owner-confirmed.

Acceptance criteria:

- After project creation, owner can immediately run scanner or review existing scan results.
- Workspace shows selected services and launch-readiness tasks.
- Workspace includes evidence expectations tied to blockers.
- Owner understands what needs to happen before inviting/choosing delivery support.

### Gate 8: Production Operations

Goal:

> The system can be operated safely when real users depend on it.

Required work:

- Configure production/staging environment separation.
- Add database backup and restore procedure.
- Add monitoring for backend, frontend, scanner jobs, object storage, and LoomAI calls.
- Add error tracking and request IDs for support.
- Add rate limits for auth, AI, scanning, uploads, and webhooks.
- Add secret rotation checklist.
- Add deploy/rollback runbook.
- Add health checks for backend, frontend, scanner runtime, and LoomAI assignment/runtime.

Acceptance criteria:

- A production incident has a clear triage path.
- A bad deploy can be rolled back.
- Secrets are not stored in docs or frontend bundles.
- Operational health can be checked without manual shell access.

### Gate 9: First-User UX Cleanup

Goal:

> Real users see one confident product journey, not every internal feature at once.

Required work:

- Hide or de-emphasize incomplete marketplace/community surfaces for first users.
- Tune language for MVPs, startups, and AI-built prototypes.
- Replace rigid enterprise wording with builder-friendly readiness language.
- Make product creation, scan, fix path, and workspace start the primary path.
- Add empty states that explain the next useful action.
- Verify desktop and mobile layouts.

Acceptance criteria:

- A new owner can complete the core flow without internal context.
- The UI does not expose confusing half-ready actions.
- Buttons have concrete backend behavior or are removed.
- Mobile screens are readable and usable.

### Gate 10: Beta Onboarding And Support

Goal:

> First users understand what ProdUS does, what data it uses, and how to get help.

Required work:

- Add external business-facing overview.
- Add data handling and AI usage explanation.
- Add terms/privacy placeholders or production-ready legal text.
- Add support contact/path.
- Add beta feedback mechanism.
- Add short guide: "How to use ProdUS to assess your prototype."

Acceptance criteria:

- Owner understands what happens to repo links, documents, scanner evidence, and AI context.
- Support can identify the user's product/workspace and request ID.
- Product team can collect beta feedback tied to the core journey.

## 5. Production-Beta Demo Flow

The first real-user demo flow must be excellent:

```text
1. Owner signs in.
2. Owner creates product with AI using a brief, repo URL, and optional document.
3. ProdUS shows structured project intelligence and what evidence AI used.
4. Owner creates the productization project.
5. Repo source is attached or clearly marked as needing connection.
6. Owner runs scanner.
7. ProdUS shows production blockers, not just raw findings.
8. Owner maps/adds recommended services.
9. ProdUS shows missing dependencies and one-click fixes.
10. Owner starts workspace.
11. Workspace opens with service plan, milestones, evidence needs, scanner context, and next action.
12. Owner asks AI about the diagnosis/page context.
```

This flow is the production readiness proof. Other platform areas should not dilute it.

## 6. Measurement Plan

Track these events and outcomes:

- product creation started/completed
- AI analysis mode selected
- document attached/shared/used/not-used
- repo URL provided
- GitHub source connected
- scanner run started/completed/failed
- findings count by severity
- findings mapped/unmapped
- recommended services accepted/rejected
- workspace conversion blocked/resolved/completed
- AI chat opened on diagnosis/page context
- workspace created
- owner next-action clicked

Quality metrics:

- diagnosis specificity score
- mapped critical/high finding rate
- service recommendation acceptance rate
- workspace conversion success rate
- AI document-use success rate
- scanner failure rate
- user-reported "this was useful" rate

## 7. Risk Register

| Risk | Why It Matters | Mitigation |
| --- | --- | --- |
| Diagnosis is generic | Users can get generic advice from any AI tool | Quality harness, scanner grounding, service mapping, evidence trace |
| UI feels enterprise-heavy | Startup/MVP users may bounce | Builder-friendly language and guided flow |
| Scanner fails silently | Trust breaks immediately | Clear states, retries, logs, owner-readable failure messages |
| AI overclaims | Users may act on unsupported claims | Evidence usage, assumptions, verification boundaries |
| Catalog mappings are wrong | Fix path becomes misleading | Deterministic mapping, active module validation, unmapped review |
| Documents are mishandled | Privacy and trust risk | Private storage, short-lived URLs, no default indexing |
| Marketplace distracts | Wedge gets diluted | Keep team/expert flows secondary until diagnosis pull is proven |

## 8. Implementation Order

Recommended order:

1. Auth and tenant boundary hardening.
2. Diagnosis quality harness expansion.
3. GitHub/scanner reliability pass.
4. Scanner-to-fix-path persistence and UI clarity.
5. Workspace carry-forward completeness.
6. AI accountability and page-context chat verification.
7. Private document handling hardening.
8. Production operations runbooks and monitoring.
9. First-user UX cleanup.
10. Beta onboarding/support package.

Parallelizable work:

- UX language cleanup can happen alongside backend hardening.
- Beta docs can happen alongside operations readiness.
- Harness fixture creation can happen while scanner reliability improves.

## 9. Go/No-Go Checklist

Go for real-user production beta only when:

- real auth is enabled and mock auth is isolated
- tenant access tests pass
- core flow works live with at least one real repo
- scanner findings map to services and persist
- workspace creation carries repo, diagnosis, services, milestones, and evidence needs
- AI page chat sees the current analysis context
- private documents are protected and temporary AI URLs expire
- production/staging envs are separated
- backup, rollback, monitoring, and support paths exist
- first-user UI is focused on the prototype-to-product journey

No-go if:

- a user can access another user's product/workspace
- scanner failures are unclear or unrecoverable
- AI produces unsupported service recommendations that persist as facts
- workspace creation loses repo/source/service context
- documents are public or permanently exposed to AI by default
- the core flow requires developer help to complete

## 10. Definition Of Ready For First External Users

ProdUS is ready for first external users when a founder, product owner, or studio lead can bring a real prototype and leave with:

- a clear productization diagnosis
- the top production blockers
- evidence behind the blockers
- a concrete fix path
- selected lifecycle services
- a workspace ready for execution
- a clear next action

The product does not need to be broad. It needs to be trusted.
