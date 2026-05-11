# ProdUS Platform Implementation Sequence

Date: 2026-05-11

## Source Inputs

- `docs/business_plan.docx`
- `docs/implementation_plan.docx`
- `docs/PRODOPS_AI_ENABLEMENT_USING_LOOMAI_DEPLOYMENTS.md`
- `frontend/docs/FORM_QUICK_REFERENCE.md`
- `frontend/docs/FORM_API_REFERENCE.md`

## Product Boundary

ProdUS is a productization collaboration platform, not a software house, generic freelancer board, or AI-only report generator. The platform owns service structure, package composition, collaboration workflow, quality evidence, and reputation signals. Independent teams own delivery.

LoomAI is treated as an optional assistant/runtime provider for diagnosis, recommendations, governance checks, retrieval, and evidence review. The MVP must work without LoomAI by using deterministic rules and auditable recommendation records.

## Production Architecture Decisions

- Database: PostgreSQL in production.
- Auth/users: Supabase JWT auth in production, with local mock auth only for development and tests.
- Backend: Spring Boot API with explicit owner/admin authorization checks, validation, Liquibase migrations, OpenAPI, and stateless security.
- Frontend: Next.js, React, MUI, React Query, Supabase auth context, and the local form patterns documented under `frontend/docs`.
- AI boundary: all AI or assistant outputs are persisted as recommendation/audit records with source entity, confidence, rationale, output payload, and human feedback.

## Backend Sequence

1. Identity and auth foundation
   - Keep Supabase as source of auth identity.
   - Default new Supabase users to `PRODUCT_OWNER`.
   - Use `ADMIN`, `PRODUCT_OWNER`, `TEAM_MANAGER`, `SPECIALIST`, and `ADVISOR` roles.
   - Keep dev/test mock auth isolated to non-production profiles.

2. Service catalog
   - Model categories, modules, and dependencies.
   - Expose read endpoints for owners/teams.
   - Restrict mutation endpoints to admins.
   - Seed first productization categories and modules with Liquibase.

3. Product profiles
   - Let owners create and update product context: stage, stack, URL, repo, and risk profile.
   - Enforce owner-or-admin access for reads and updates.
   - Validate required fields.

4. Requirement intake
   - Capture product goal, current problems, constraints, risk signals, optional requested service, and generated brief.
   - Enforce product ownership before creating or editing requirements.
   - Support submitted intake as the gateway to package generation.

5. Package builder
   - Build deterministic package drafts from requirement intake.
   - Include requested module and required dependencies.
   - Persist package modules with sequence, rationale, deliverables, and acceptance criteria.
   - Persist recommendation audit records even when LoomAI is not used.

6. Team network
   - Store independent team profiles and capability summaries.
   - Allow team managers/admins to create teams.
   - Add deterministic matching against package modules for MVP recommendations.
   - Leave verification and reputation expansion for the next phase.

7. Collaboration workspace
   - Open workspace from a package.
   - Generate initial milestones from package modules.
   - Support manual milestones and deliverables.
   - Track status for workspace, milestones, and deliverables.

8. AI/LoomAI integration path
   - Keep `/api/ai/recommendations` as the audit ledger.
   - Later add provider adapters for LoomAI diagnosis/governance/search.
   - Never make LoomAI a hard dependency for owner workflow completion.

## Frontend Sequence

1. Navigation and shell
   - Keep dashboard, catalog, owner product profiles, owner requirements, packages, teams, workspaces, admin catalog, and AI audit.
   - Remove hidden template/demo routes.

2. Smart owner flow
   - Product profile form.
   - Requirement intake form.
   - Package builder with module detail and rationale.
   - Team recommendation panel.
   - Workspace creation and milestone/deliverable management.

3. Team/admin flow
   - Team profile form.
   - Catalog administration form.
   - Recommendation audit review.

4. UI quality
   - Use MUI surfaces, chips, segmented/status controls, clear empty states, and React Query state handling.
   - Use the documented form hook pattern for production forms.
   - Keep the first screen as the real platform dashboard, not a marketing page.

5. Mockability
   - Frontend API helpers remain thin and mockable.
   - Local dev can use mock auth and H2.
   - Tests should mock network-facing functions and focus on deterministic form/workflow behavior.

## Implementation Status

Current status: completed for the current MVP implementation pass and documented production-hardening sequences.

Completed before this sequence:

- Repo cleanup and rename to ProdUS.
- Base backend domain modules and migrations.
- Base frontend routes and platform feature pages.
- Supabase auth context and mock auth foundation.

Completed implementation pass:

- Harden backend access validation and owner/admin checks.
- Add package recommendation audit and deterministic team matching.
- Generate workspace milestones from package modules.
- Reintroduce the frontend form hook pattern from the UI docs.
- Expand package/workspace/team UI to expose the full owner and team capability workflow.
- Add mock-backed backend and frontend tests.
- Replace direct entity responses with explicit DTOs across the platform API surface.
- Add team membership and workspace participant permissions.
- Expose member and participant management in the frontend Teams and Workspaces pages.
- Add request ID propagation, configurable API rate limiting, security-event logging, and stricter production CORS configuration.
- Add PostgreSQL Testcontainers migration validation in addition to H2 workflow tests.
- Add quote/proposal, contract, invoice, support subscription, and verified reputation modules.
- Expose commerce/trust UI in packages, workspaces, and teams.
- Add optional LoomAI package-governance adapter with timeouts, request ID propagation, audit logging, and deterministic rules fallback.

Verification:

- `mvn clean test` passed.
- `mvn -DskipTests compile` passed after DTO and collaboration-access hardening.
- `mvn test` passed after adding team member and workspace participant access coverage.
- `npm run type-check` passed.
- `npm test -- --runInBand` passed.
- `docker compose -f docker-compose.dev.yml config` passed with expected unset Supabase env warnings.
- `npm run build` passed after adding the project Node 20 wrapper and removing stale CSS imports from removed template dependencies.
- `npm run dev -- --hostname 127.0.0.1 --port 3001` passed and is running at `http://127.0.0.1:3001`.
- Live API smoke passed against `http://127.0.0.1:8080` using mock auth for admin catalog setup, team membership, owner package/workspace flow, workspace participant addition, and specialist deliverable submission.
- Live UI route smoke passed for `http://127.0.0.1:3001/teams` and `http://127.0.0.1:3001/workspaces`.
- Live API security smoke passed with `X-Request-ID`, `X-RateLimit-Limit`, and authenticated workflow verification on the running backend.
- `mvn test` passed after the commerce/trust and LoomAI fallback slices, including Testcontainers migration validation.
- `npm run type-check`, `npm test -- --runInBand`, and `npm run build` passed after commerce/trust UI additions.
- Live API commerce/trust smoke passed with rules fallback audit, proposal acceptance, signed contract, paid invoice, active support subscription, verified reputation, and submitted specialist deliverable.
- Live UI route smoke passed for `http://127.0.0.1:3001/packages`, `/workspaces`, `/teams`, and `/admin/recommendations`.

## Next Production Hardening After MVP

- Current hardening list is complete.
- Future production expansion: payment provider webhooks, e-signature callbacks, dispute workflows, richer support SLA automation, and CI enforcement for the Testcontainers path.
