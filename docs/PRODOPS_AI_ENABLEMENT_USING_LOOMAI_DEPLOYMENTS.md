# ProdOps AI Enablement Plan - LoomAI Runtime For Staging And Production

Date: 2026-05-19

Status: revised for the current Coolify staging deployment

Product scope: ProdUS Platform / ProdOps Network

Audience: ProdUS product, backend, frontend, scanner, MCP, and LoomAI integration owners

## Executive Position

ProdUS is the productization platform. LoomAI is the external AI runtime used by ProdUS for grounded product, project, scanner, package, and evidence intelligence.

ProdUS owns the marketplace, workflows, UI, business rules, authorization, product data, scanner execution, object storage, and audit records. LoomAI provides AI reasoning, retrieval, suggestions, and governed action preparation through a configured deployment.

The integration must run through ProdUS-controlled backend broker APIs and the ProdUS MCP allowlist. LoomAI must not connect directly to the database, object storage, repositories, user sessions, or scanner runtime.

## Current Staging Baseline

The proposal is no longer only conceptual. ProdUS now has a running Coolify staging stack that should be treated as the first LoomAI integration target.

| Area | Staging Configuration | Current State |
| --- | --- | --- |
| Frontend | `https://produs-staging.46.224.145.148.sslip.io` | Running and returning HTTP 200 |
| Backend API | `https://produs-api-staging.46.224.145.148.sslip.io` | Running with production profile and healthy actuator/API health checks |
| Database | Coolify Postgres database `produs_staging` | Running and healthy |
| Auth | Supabase email/password auth | Real Supabase auth is enabled for staging users |
| Storage | MinIO/S3-compatible storage, bucket `produs-staging` | Running and healthy |
| Scanner foundation | Backend scanner runtime, normalization, artifact storage, and readiness checks | Available for staging validation once provider credentials/source access are configured |
| LoomAI runtime | Backend LoomAI integration paths are configurable | Disabled on staging until real LoomAI deployment credentials are provided |
| GitHub/GitLab providers | Connector code paths, webhook verification, and mocked-provider tests | Real app/client credentials still pending |

### Staging Test Identities

These identities are for staging validation only and must not be treated as production credentials. Passwords are maintained in the private deployment handoff/auth runbook and must be rotated before any external pilot.

| Role | Email | Primary AI Validation Use |
| --- | --- | --- |
| Admin | `admin@produs.com` | LoomAI status, knowledge sync, readiness checks, provider traces |
| Product owner | `owner@produs.com` | Product readiness, package guidance, scanner findings, workspace evidence |
| Team manager | `team@produs.com` | Workspace evidence, deliverables, milestone criteria, scanner results |
| Specialist | `specialist@produs.com` | Productization service context, assigned evidence, scanner explanation |
| Advisor | `advisor@produs.com` | Governance review, evidence interpretation, milestone support |

## Product Boundary For AI

ProdUS will use AI where it improves productization outcomes. AI support is focused on:

- product readiness and diagnosis
- project/workspace status and evidence
- service/package recommendations
- scanner findings and normalized risk explanation
- milestone evidence review
- owner/team guidance during delivery
- admin visibility into AI health, knowledge sync, and provider traces

AI must not support or execute unrelated network/community operations:

- team creation
- team invitations
- solo expert join requests
- profile edits
- account settings
- community messages
- commercial/payment actions
- broad admin mutation
- production approval or compliance certification without human review

This boundary keeps LoomAI valuable without turning it into an unrestricted operator across the platform.

## Why ProdUS Needs LoomAI

The productization marketplace has manual bottlenecks at every step.

| Step | Without AI | Cost Of Manual Work |
| --- | --- | --- |
| Understanding product state | Owner describes vaguely, reviewer guesses | Slow intake, inconsistent recommendations |
| Identifying needed services | Generic checklists, owner picks randomly | Wrong services selected, missing dependencies |
| Building realistic packages | Human scoping from scratch | Expensive, slow, hard to scale |
| Matching teams | Directory browsing and guesswork | Poor matches, failed projects |
| Tracking delivery quality | Owner asks for updates manually | Late discovery of risks and blockers |
| Accepting milestones | Subjective opinion | Disputes, delayed payments, weak evidence |

LoomAI should help ProdUS convert product evidence into structured recommendations, governed decisions, and plain-language answers.

## What LoomAI Gives ProdUS

### 1. Diagnosis

Business value: turn vague product problems into structured, evidence-backed assessments.

ProdUS usage:

- explain product health from scanner evidence, product metadata, package state, and workspace progress
- identify blockers such as missing CI/CD, vulnerable dependencies, missing monitoring, weak handoff evidence, or incomplete acceptance criteria
- produce owner-readable summaries grounded in actual evidence

Revenue impact:

- stronger intake value
- higher package conversion
- lower dispute rate because recommendations are evidence-backed

### 2. Governance

Business value: important platform decisions are checked before execution.

ProdUS usage:

- validate package completeness against service dependencies
- identify unrealistic timeline, budget, or acceptance criteria gaps
- review milestone evidence before a human approves or requests changes
- explain risk acceptance implications without silently accepting risk

Governance rule: LoomAI may recommend, explain, or prepare actions. ProdUS backend remains the authority that authorizes and executes any mutation.

### 3. Intelligent Search And Answers

Business value: owners, teams, advisors, and admins can ask grounded questions instead of browsing scattered pages.

ProdUS usage:

- owner asks what their product needs next
- team asks what evidence is missing for a milestone
- admin asks which productization services are driving the most scanner risk
- advisor asks why a package was recommended

The assistant should use safe indexed knowledge plus live authorized ProdUS context through broker APIs/MCP.

### 4. Scanner-Aware Evidence Reasoning

Business value: the platform can explain verified evidence instead of relying on self-reports.

ProdUS owns scanner execution. LoomAI does not run scanners directly.

LoomAI should reason over normalized scanner outputs, such as:

- repository metadata and tech-stack evidence
- dependency and vulnerability findings
- secrets/configuration findings after redaction
- CI/CD signal and workflow status
- deployment probe results
- handoff readiness checks
- milestone evidence and acceptance criteria status

AI answers must distinguish verified evidence, missing evidence, inferred risk, and recommendation.

### 5. Knowledge And Pattern Matching

Business value: the platform improves as service taxonomy, package templates, delivery evidence, and completed case patterns mature.

ProdUS safe knowledge records include:

- service categories and modules
- service dependencies
- package templates
- lifecycle workflow templates
- acceptance criteria templates
- evidence requirement templates
- scanner tool descriptions
- approved anonymized case patterns
- public productization help content

Sensitive records must not be indexed directly. Private product/workspace data should be fetched live through authorized ProdUS APIs and returned as redacted summaries.

## Staging Integration Flow

The staging integration should work this way:

1. User signs in through the staging frontend with Supabase auth.
2. Frontend sends the Supabase JWT to the ProdUS backend.
3. Backend validates the user, role, and tenant context.
4. Backend builds a safe AI context from authorized product, project, scanner, package, and evidence data.
5. Backend calls LoomAI only when `LOOMAI_ENABLED=true`.
6. LoomAI answers using approved knowledge and allowlisted MCP tools.
7. ProdUS stores provider trace/audit data and returns the answer to the UI.
8. If LoomAI is disabled, unavailable, slow, or invalid, ProdUS returns deterministic fallback guidance instead of failing the core workflow.

## ProdUS Backend Broker Surface

The current backend is the broker between frontend, LoomAI, MCP, scanner evidence, and production data.

Frontend-facing AI endpoints:

```text
GET  /api/ai/loomai/status
GET  /api/ai/loomai/knowledge-preview
POST /api/ai/loomai/knowledge-sync
POST /api/ai/assistant/session
POST /api/ai/assistant/query
POST /api/ai/assistant/suggestions
GET  /api/admin/production-readiness
```

Expected LoomAI runtime configuration:

```text
LOOMAI_BASE_URL
LOOMAI_API_KEY
LOOMAI_ENABLED
LOOMAI_ENVIRONMENT
LOOMAI_TIMEOUT_MS
LOOMAI_ASSISTANT_SESSION_PATH
LOOMAI_ASSISTANT_QUERY_PATH
LOOMAI_ASSISTANT_SUGGESTIONS_PATH
LOOMAI_DATA_SYNC_BATCH_PATH
LOOMAI_DATA_SYNC_DELETE_PATH
```

Staging currently keeps `LOOMAI_ENABLED=false` until real LoomAI staging credentials are provided.

## MCP Integration Model

ProdUS MCP must expose a LoomAI-safe profile only.

```text
PRODUS_MCP_TOOL_PROFILE=loomai-productization
```

Expected MCP endpoints:

```text
POST /mcp
GET  /loomai/tool-allowlist
GET  /health
```

The LoomAI deployment must import only the `loomai-productization` tool profile, not the full internal MCP surface.

Initial AI-visible tool groups should stay focused on productization:

- catalog/service search
- product and package inspection
- workspace inspection
- scanner status and finding inspection
- evidence listing
- milestone evidence review
- confirmed requirement/package/workspace actions where explicitly allowed

Any mutation must require explicit user confirmation, reason, request ID, role context, and idempotency key.

## Owner Journey With LoomAI

### Product Readiness

Owner asks what is blocking the product from production readiness. LoomAI answers from product details, scanner findings, package state, and workspace evidence.

Expected answer quality:

- clear top risks
- evidence-backed reasoning
- next recommended service/package step
- confidence and missing evidence
- no unsupported claims

### Service And Package Planning

Owner asks which lifecycle services should be selected. LoomAI recommends service modules based on diagnosis evidence and service dependency rules.

Expected answer quality:

- recommended services
- why each service matters
- dependencies and conflicts
- expected evidence or acceptance criteria
- budget/timeline caveats if data is incomplete

### Team And Workspace Guidance

Owner asks whether delivery is progressing properly. LoomAI summarizes milestones, blockers, evidence, scanner results, and next decisions.

Expected answer quality:

- status by milestone
- blocker explanations
- evidence gaps
- suggested owner actions
- no autonomous team invite or community action

## Team Journey With LoomAI

### Evidence Clarity

Team asks what evidence is needed for a deliverable or milestone. LoomAI answers from the package, acceptance criteria, scanner requirements, and workspace state.

### Scanner Explanation

Team asks why a finding matters. LoomAI explains the normalized scanner result, risk level, affected area, suggested remediation, and evidence expected after remediation.

### Handoff Readiness

Team asks whether handoff is ready. LoomAI reviews documented deployment, monitoring, backup, known issues, rollback, ownership, and support evidence.

LoomAI may explain readiness, but human platform workflow still controls final approval.

## Admin Journey With LoomAI

Admins need operational control, not just chat.

Required admin capabilities:

- view LoomAI enabled/disabled status
- view configured environment
- preview safe knowledge before sync
- sync safe knowledge to LoomAI
- view sync result and provider trace
- inspect fallback state
- confirm MCP allowlist
- monitor production readiness gaps

The UI should follow the Apple-like design guidance already used in ProdUS: calm white canvas, clear hierarchy, minimal visual noise, rounded cards, precise status labels, and controls that directly map to backend actions.

## Staging Enablement Work Remaining

LoomAI integration team must provide:

- LoomAI staging deployment ID
- LoomAI staging base URL
- LoomAI staging API key or service credential
- confirmed auth header format
- confirmed request/response schemas
- provider request ID field or header
- rate-limit headers and timeout guidance
- data-sync batch and delete endpoint behavior
- retrieval/index namespace naming
- webhook secret if LoomAI webhooks are used

ProdUS team must then configure staging:

- set `LOOMAI_BASE_URL`
- set `LOOMAI_API_KEY`
- set `LOOMAI_ENVIRONMENT=staging`
- set `LOOMAI_ENABLED=true`
- confirm assistant/session/query/suggestion endpoint paths
- run knowledge preview
- run safe knowledge sync
- validate status endpoint
- validate owner/team/admin assistant flows
- validate deterministic fallback by disabling LoomAI again

GitHub/GitLab real provider credentials remain a separate prerequisite for live repository-connected scans. Until those are provided, scanner and connector flows should be validated with configured staging sources, manual imports, and mocked provider tests.

## Staging Acceptance Criteria

Before calling the LoomAI staging integration complete:

- all staging roles can sign in through Supabase
- frontend shows AI enabled/disabled state accurately
- `GET /api/ai/loomai/status` reflects current LoomAI connectivity
- knowledge preview contains only safe records
- knowledge sync writes only approved records to the staging LoomAI deployment
- owner assistant answers product readiness and service/package questions from authorized data
- team assistant answers workspace evidence and scanner questions from authorized data
- admin UI exposes provider trace/status without leaking secrets
- fallback behavior works when LoomAI is disabled or unavailable
- AI does not execute out-of-scope community/profile/team-invite/account actions
- scanner findings are explained from normalized evidence, not raw unredacted artifacts

## Production Readiness Conditions

Production enablement requires:

- separate LoomAI production deployment and credentials
- separate production vector/index namespace
- production-safe rate limits and timeout configuration
- audit export or provider trace retention agreement
- secrets rotation plan
- data deletion/tombstone behavior verified
- Supabase production auth settings confirmed
- object-storage retention and deletion policy verified
- GitHub/GitLab app credentials configured if live repository scans are part of production launch
- security review of MCP allowlist and mutation confirmation policy
- UI review across owner, team, advisor, and admin views
- rollback plan: switch `LOOMAI_ENABLED=false` without breaking productization workflows

## Revenue Model

### LoomAI Earns From ProdUS

LoomAI charges ProdUS for AI runtime usage.

| Service | Pricing Model |
| --- | --- |
| Platform subscription | Monthly fee for staging/production deployments |
| Diagnosis sessions | Per session or tier allocation |
| Governance executions | Per execution or included in tier |
| Assistant queries | Per query or monthly allocation |
| Retrieval/indexing | Per indexed record or storage volume |
| Tool/action orchestration | Per invocation or tier allocation |

### ProdUS Earns From Owners And Teams

ProdUS monetizes the marketplace value built on top of LoomAI:

| Without AI | With LoomAI-Enabled ProdUS |
| --- | --- |
| Generic service catalog | Evidence-backed service recommendations |
| Manual product intake | Paid product readiness diagnosis |
| Commodity team directory | Governed team matching and package fit |
| Subjective milestone review | Evidence-based milestone guidance |
| High dispute risk | Traceable recommendations and scanner evidence |

LoomAI is infrastructure. ProdUS owns the domain logic, marketplace experience, and monetization.

## Why ProdUS Uses LoomAI Instead Of Building AI Infrastructure

| Build In-House AI Runtime | Use LoomAI Deployment |
| --- | --- |
| Months of runtime, RAG, trace, governance, and tool orchestration work | Configure and integrate through controlled backend APIs |
| Requires specialized AI platform team | Lets ProdUS focus on productization workflows |
| Higher risk of unsafe tool access | MCP allowlist and brokered action model |
| Harder to operate consistently | Separate staging/production deployments and provider traces |
| Distracts from marketplace quality | Keeps ProdUS focused on services, packages, evidence, and delivery |

ProdUS competitive advantage is productization domain expertise: service taxonomy, package logic, scanner evidence, team verification, marketplace operations, and user experience.

## Summary

- ProdUS has a live Coolify staging stack with frontend, backend, Postgres, Supabase auth, MinIO storage, and scanner foundations.
- LoomAI is the planned AI runtime, but it is currently disabled on staging until real LoomAI staging credentials are supplied.
- ProdUS backend remains the broker and authorization authority.
- AI support is focused on product, project, package, scanner, evidence, and milestone workflows.
- AI must not operate team creation, invites, solo expert joins, profiles, account settings, community messages, payment actions, or unrestricted admin mutations.
- The next practical step is to configure LoomAI staging credentials, enable `LOOMAI_ENABLED=true`, sync safe knowledge, and validate the role-scoped owner/team/admin journeys.
