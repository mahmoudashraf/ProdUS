# ProdUS Platform Repo Cleanup Plan

Date: 2026-05-11

## Purpose

Prepare the current repo for implementation of the target productization collaboration platform described in `docs/business_plan.docx`, `docs/implementation_plan.docx`, and `docs/PRODOPS_AI_ENABLEMENT_USING_LOOMAI_DEPLOYMENTS.md`.

This is a cleanup and reset plan, not the feature implementation plan. The goal is to keep the useful foundation already present, remove or quarantine template/demo/product residue, align naming, and create a clean base for the first platform build.

## Execution Status

Status: completed on 2026-05-11.

The cleanup plan has been executed against the repo. The implemented baseline now uses:

- Product name: ProdUS Platform.
- Backend namespace: `com.produs`.
- Frontend package: `produs-platform-frontend`.
- Backend API modules: identity/auth, catalog, product profiles, requirements, packages, teams, workspaces, AI recommendation audit, storage, and health/admin shell.
- Frontend routes: dashboard, catalog, owner product profiles, owner requirements, packages, teams, workspaces, admin catalog, admin teams, and admin recommendation audit.
- Database migrations: users plus `V002__platform_core.yaml` for catalog, requirements, packages, teams, workspaces, deliverables, milestones, and recommendation audit records.

Completed cleanup actions:

1. Removed generated build artifacts, stale backup files, and obsolete report files.
2. Removed old ecommerce, profile-generation, and template demo domains.
3. Removed private AI infrastructure dependency usage and old AI/admin pages.
4. Renamed Java packages, Maven metadata, runtime config names, Docker names, mock users, and frontend branding.
5. Reduced the frontend provider tree and navigation to the ProdUS platform surface.
6. Added a first-pass service catalog seed and platform CRUD/shell flows.
7. Updated development scripts and docs that referenced removed modules.

Verification completed:

- `mvn -DskipTests compile`: passed.
- `mvn test`: passed.
- `npm install`: passed with npm audit/engine warnings.
- `npm run type-check`: passed.
- `docker compose -f docker-compose.dev.yml config`: passed with expected missing local env var warnings.
- `npm run build`: blocked by local Node.js `v19.6.0`; Next.js 15 requires `^18.18.0 || ^19.8.0 || >=20.0.0`.

## Target Platform Summary

The target product is an AI-enabled modular productization collaboration platform. The first useful product should be a service catalog, requirement intake, package builder, team directory, and collaboration workspace.

Core roles:

- Product Owner: creates product profiles, requirements, package requests, accepts milestones.
- Team Manager: manages team profile, proposals, capabilities, milestones, delivery updates.
- Specialist / Expert: contributes to assigned package layers.
- Platform Admin: manages service catalog, team verification, templates, disputes, quality signals.
- Advisor / Reviewer: validates requirements, packages, or outcomes.
- AI Assistant: drafts, recommends, summarizes, and explains. It has no final authority.

Core modules from the docs:

- Identity: users, organizations, roles, permissions, invites.
- Product context: product profile, tech stack, business stage, assets, risk profile.
- Service catalog: categories, modules, dependencies, templates, inputs, deliverables, acceptance criteria.
- Requirement intake: dynamic forms, answers, requirement brief, risk signals, missing information.
- Package builder: package templates, package instances, package modules, dependency rules, estimates.
- Team network: team profiles, team members, capabilities, verification, availability, portfolios.
- Collaboration workspace: milestones, deliverables, documents, messages, decisions, handoff, support.
- AI layer: recommendations, prompt versions, traces, confidence, feedback, LoomAI integration boundary.
- Trust and commerce later: reputation events, reviews, quotes, SOWs, invoices, support subscriptions.

Implementation sequencing from the target docs:

1. Manual validation and marketplace-lite.
2. Collaboration workspace.
3. Commerce and trust.
4. AI-enabled orchestration.
5. Mature network platform.

For this repo cleanup, prioritize the first build: catalog, intake, package builder, team directory, workspace shell, Supabase auth, admin review.

## Current Repo Inventory

### Top-level shape

- `frontend/`: Next.js 15, React 19, TypeScript, MUI 7, React Query, Supabase client, many admin template/demo routes.
- `backend/`: Spring Boot 3.3.5, Java 21, Spring Security, JPA, Liquibase, Supabase JWT filter, S3/MinIO service, AI infrastructure dependencies.
- `docs/`: product strategy docs for the new platform. Current docs folder is untracked according to `git status --short`.
- Docker and helper scripts exist at the root for dev/prod deployment.

### Useful foundation to keep

Frontend:

- `frontend/src/lib/supabase.ts`
- `frontend/src/contexts/SupabaseAuthContext.tsx`
- `frontend/src/contexts/AuthProviderWrapper.tsx`
- `frontend/src/lib/api-client.ts`
- `frontend/src/providers/ReactQueryProvider.tsx`
- `frontend/src/themes/*`
- `frontend/src/layout/MainLayout/*`, after renaming and simplifying navigation.
- `frontend/src/layout/MinimalLayout/*`, after updating auth/login copy and branding.
- `frontend/src/components/authentication/auth-forms/*`
- MUI, MUI X Data Grid, React Query, form helpers, validation helpers.

Backend:

- `backend/src/main/java/com/easyluxury/security/SecurityConfig.java`
- `backend/src/main/java/com/easyluxury/security/SupabaseJwtAuthenticationFilter.java`
- `backend/src/main/java/com/easyluxury/controller/UserController.java`
- `backend/src/main/java/com/easyluxury/controller/HealthController.java`
- `backend/src/main/java/com/easyluxury/exception/*`
- `backend/src/main/java/com/easyluxury/config/S3Config.java`
- `backend/src/main/java/com/easyluxury/service/S3Service.java`
- Liquibase setup under `backend/src/main/resources/db/changelog/`
- Supabase user bootstrap pattern in the JWT filter.

DevOps:

- Docker Compose scaffolding.
- MinIO/S3-compatible storage support, if documents and package assets are stored outside Supabase Storage.
- Existing `.env.example` patterns, after renaming and tightening.

### Current residue blocking the new platform

Naming and branding:

- Java package and service names use `com.easyluxury`.
- Spring app class is `EasyLuxuryApplication`.
- Maven artifact is `easyluxury-backend`.
- Frontend package is `kiwi-react-material-next-ts`.
- Metadata says Kiwi admin dashboard.
- Docker containers, network, database, buckets, logs, mock emails, index names use `easyluxury`.
- Login copy says "Welcome to EasyLuxury".

Template/demo features:

- Frontend includes large dashboard template route surface: forms, UI elements, widgets, ecommerce, customer/order/product pages, kanban, mail, chat, pricing, maintenance examples.
- Root layout mounts many global providers for unused demo domains: cart, customer, product, calendar, chat, contact, mail, kanban.
- Menu currently exposes only an admin group but still references `easyluxury` and an AI profile route.
- Backend contains ecommerce-style domain entities and AI wrappers for products/orders/users.

Backend domain mismatch:

- Entities include `Product`, `Order`, `Address`, `UserBehavior`, `AIProfile`.
- AI modules reference product recommendations, order analysis, fraud detection, content generation, luxury categories, and EasyLuxury-specific config.
- Database changelogs only model users, AI profiles, and AI indexing queue. They do not model platform catalog, requirements, packages, teams, or workspaces.

Repo hygiene issues:

- Compiled `.class` files are committed or present under `backend/src/main/java/com/easyluxury/ai/config/`.
- `.DS_Store` files are present at multiple levels.
- Backup/disabled files are present: `application-dev.yml.backup`, `*.java.disabled`, `*.java.backup`.
- `backend/target/` is present.
- `backend/src/main/resources/db/changelog/V003__ai_indexing_queue.yaml` has a stray `*** End Patch` marker at the end and should be fixed before running Liquibase.
- `test-results-before-cleanup.txt` exists at root.

## Naming Decision

The user-facing request says "ProdUS Platform". The business and implementation docs use "ProdOps Network" and "ProdOps". Before broad renames, choose one canonical naming set:

- Product display name: `ProdUS` or `ProdOps Network`.
- Internal code namespace: recommended `produs` if the product is ProdUS, or `prodops` if the docs remain canonical.
- Java package: recommended `com.produs` or `com.prodops`.
- Database name: recommended `produs`.
- Docker network/container prefix: recommended `produs`.
- API service name: recommended `produs-backend`.

Until the naming choice is confirmed, use neutral module names in new planning docs: service catalog, packages, teams, workspaces, AI recommendations.

## Cleanup Strategy

Do not perform the cleanup as one giant delete/rename. Use a sequence that keeps the app buildable between phases.

Recommended branch strategy:

- Create a cleanup branch before implementation.
- Commit the planning doc first.
- Commit repo hygiene fixes separately.
- Commit backend namespace/config rename separately.
- Commit frontend route/provider cleanup separately.
- Commit first domain skeleton separately.

Recommended validation gates after each phase:

- Backend: `mvn test` or at least `mvn -DskipTests compile`.
- Frontend: `npm run type-check`, `npm run lint`, and `npm run build` when route cleanup is complete.
- Docker: `docker compose -f docker-compose.dev.yml config`.
- Liquibase: validate changelog after removing the stray patch marker.

## Phase 0: Baseline And Guardrails

Goal: make the current state explicit and stop generated files from reappearing.

Actions:

- Confirm canonical product name and package namespace.
- Add or update repo-level `.gitignore` for `.DS_Store`, `backend/target/`, `*.class`, Next build output, local env files, logs, and test artifacts.
- Remove generated source pollution:
  - `.DS_Store`
  - `.class` files under backend source
  - `backend/target/`
  - root `test-results-before-cleanup.txt`, if it is no longer needed
- Fix `backend/src/main/resources/db/changelog/V003__ai_indexing_queue.yaml` by removing trailing `*** End Patch`.
- Decide whether backup/disabled files are intentionally retained. If not, remove:
  - `backend/src/main/resources/application-dev.yml.backup`
  - `backend/src/test/java/com/easyluxury/ai/facade/AIFacadeTest.java.disabled`
  - `backend/src/test/java/com/easyluxury/ai/service/AIMonitoringServiceTest.java.disabled`
  - `backend/src/test/java/com/foundation/ai/integration/AIAdvancedRAGIntegrationTest.java.backup`
- Capture current build status before structural renames.

Done when:

- Generated artifacts are gone or ignored.
- Liquibase files are parseable.
- Current build/test failures, if any, are documented before functional changes start.

## Phase 1: Platform Naming And Config Reset

Goal: remove EasyLuxury/Kiwi branding and align runtime configuration with the new platform.

Backend actions:

- Rename Java package from `com.easyluxury` to chosen namespace.
- Rename `EasyLuxuryApplication` to the platform application name.
- Update `backend/pom.xml`:
  - `groupId`
  - `artifactId`
  - `<name>`
  - `<description>`
- Update application configs:
  - `spring.application.name`
  - default database name
  - S3 bucket names
  - CORS defaults
  - log paths
  - AI index names
  - error URLs in `GlobalExceptionHandler`
- Replace EasyLuxury-specific AI config keys with platform-neutral keys.

Frontend actions:

- Rename `frontend/package.json` name.
- Update `frontend/src/app/layout.tsx` metadata.
- Update logo/copy in auth screens and layout shell.
- Rename `frontend/src/menu-items/easyluxury.tsx` to a platform navigation file.
- Replace mock users/emails and visible EasyLuxury copy.

DevOps actions:

- Rename Docker containers, networks, database, bucket defaults, deployment script labels.
- Update `backend/.env.example`, `frontend/env.production`, and README snippets.

Done when:

- `rg "EasyLuxury|easyluxury|kiwi|luxury"` only finds intentional historical docs or removed/archive files.
- The app still compiles after package and import renames.

## Phase 2: Frontend Surface Cleanup

Goal: keep the UI foundation, remove demo route sprawl, and create a platform-first route skeleton.

Keep:

- Auth route group and Supabase auth forms.
- Main dashboard layout, after simplifying menu and providers.
- Theme system and reusable UI components.
- React Query provider and API client.
- Reusable table/form components only where they serve platform features.

Remove or archive:

- Ecommerce routes and views.
- Customer/order/product demo views.
- Widget/demo dashboard pages.
- UI element showcase routes.
- Form showcase routes.
- Pricing template pages unless immediately reused for real billing.
- Migration notes under `frontend/src/migration` after preserving any useful implementation notes in `frontend/docs`.
- Unused providers for cart, product, customer, calendar, chat, contact, mail, and kanban unless a real platform feature needs them immediately.

Create initial route skeleton:

- `/dashboard`: role-aware home.
- `/owner/products`: product profiles.
- `/owner/requirements`: requirement intake list.
- `/catalog`: service catalog.
- `/packages`: package builder and package requests.
- `/teams`: team directory.
- `/workspaces`: collaboration workspace list.
- `/admin/catalog`: service catalog admin.
- `/admin/teams`: team verification admin.
- `/admin/recommendations`: AI recommendation audit/events.

Provider simplification:

- Root layout should mount only platform-wide providers:
  - React Query
  - Config/theme/localization, if still needed
  - Auth
  - Notification/snackbar
  - Menu/navigation
- Feature-specific state should live near feature routes or in React Query.

Done when:

- Navigation reflects the target platform, not an admin template.
- Root provider tree no longer initializes unused demo domains.
- Type-check passes after route removals.

## Phase 3: Backend Domain Reset

Goal: preserve security and infrastructure, replace ecommerce domain objects with platform domain modules.

Keep and adapt:

- User auth bootstrap from Supabase.
- `UserController` as `/api/users/me`.
- Security filter chain and CORS policy.
- Exception handling.
- File/document storage service.
- Health and actuator endpoints.
- Liquibase migration pattern.

Retire or quarantine:

- `Product`, `Order`, `Address`, `UserBehavior` if not repurposed carefully.
- Product/order AI controllers, DTOs, adapters, facades, mappers, and services.
- EasyLuxury-specific AI config and tests.
- `AIProfile` if it only represents the old CV/profile upload flow. Re-evaluate whether it maps to product diagnostic profiles before deleting.

Create first backend modules:

Identity:

- `Organization`
- `OrganizationMember`
- `Role`
- `Invite`
- Roles: `PRODUCT_OWNER`, `TEAM_MANAGER`, `SPECIALIST`, `ADVISOR`, `ADMIN`

Catalog:

- `ServiceCategory`
- `ServiceModule`
- `ServiceDependency`
- `ServiceTemplate`
- `AcceptanceCriterion`

Product context:

- `ProductProfile`
- `TechStackItem`
- `ProductAsset`
- `RiskSignal`

Requirements:

- `RequirementIntake`
- `RequirementQuestion`
- `RequirementAnswer`
- `RequirementBrief`

Packages:

- `PackageTemplate`
- `PackageInstance`
- `PackageModule`
- `PackageDependency`
- `PackageEstimate`

Teams:

- `Team`
- `TeamMember`
- `Capability`
- `TeamVerification`
- `Availability`
- `PortfolioItem`

Workspace:

- `ProjectWorkspace`
- `Milestone`
- `Deliverable`
- `WorkspaceDocument`
- `DecisionRecord`
- `HandoffChecklist`
- `StatusUpdate`

AI:

- `AIRecommendation`
- `AITrace`
- `PromptVersion`
- `ConfidenceSignal`
- `HumanFeedback`

Initial API domains:

- `/api/catalog`
- `/api/products`
- `/api/requirements`
- `/api/packages`
- `/api/teams`
- `/api/workspaces`
- `/api/ai/recommendations`
- `/api/admin/*`

Done when:

- Backend no longer exposes ecommerce/product/order endpoints unless they have been explicitly remapped to platform product profiles and packages.
- New domain migrations exist and match the first feature skeleton.
- `/api/users/me` works with Supabase JWT.

## Phase 4: Data And Migration Plan

Goal: create a clean database path for the new platform without carrying old assumptions.

Recommended approach for pre-production:

- If there is no production data to preserve, create a clean migration baseline after the namespace reset.
- Keep `users` and Supabase identity linkage.
- Replace old AI/ecommerce tables with new platform tables.
- Seed initial service catalog categories from the implementation plan:
  - Validation
  - Code rewrite/refactor
  - Scaling
  - Cloud/DevOps
  - Database
  - Security
  - Launch/GTM readiness
  - Operations/support

Recommended approach if data must be preserved:

- Add migrations instead of rewriting existing ones.
- Create compatibility views or transitional mappers only where needed.
- Document old-to-new entity mapping before touching schema.

Done when:

- Local dev database can be recreated from migrations.
- Seed catalog supports the first package builder flow.

## Phase 5: AI Boundary Cleanup

Goal: align AI code with the target architecture without making AI the first product dependency.

Keep:

- Generic AI infrastructure only if dependencies resolve and compile reliably.
- AI indexing queue if it supports future RAG/recommendation events.
- Existing RAG/search/admin AI UI ideas as references, not as user-facing product features.

Replace:

- Product/order/user recommendation language with service/package/team recommendation language.
- EasyLuxury AI config with platform-neutral AI config.
- Direct "AI owns decisions" behavior with logged recommendation drafts.

Introduce a provider boundary:

- `AIProviderClient` or `LoomAIClient`
- `RecommendationService`
- `AITraceLogger`
- `PromptVersionService`
- Schema validation for AI outputs.

First AI use cases, after catalog/package rules exist:

- Intake missing-field detection.
- Service dependency explanation.
- Package brief draft.
- Team match explanation.
- Milestone and acceptance criteria draft.

Done when:

- AI code speaks in platform concepts.
- AI outputs are stored as auditable recommendations.
- Critical package structure remains rule-driven.

## Phase 6: First Platform Implementation Base

Goal: after cleanup, implement enough vertical skeleton to start real product work.

Backend vertical slice:

- Authenticated user and organization context.
- Service catalog read endpoints.
- Admin catalog create/update endpoints.
- Requirement intake create/read/update.
- Package builder v1 using deterministic dependency rules.
- Team profile read/list.
- Workspace shell create/list.

Frontend vertical slice:

- Login/register with ProdUS branding.
- Role-aware dashboard.
- Service catalog screen.
- Requirement intake form.
- Package recommendation review screen.
- Team directory screen.
- Workspace overview screen.
- Admin catalog management screen.

Done when:

- A product owner can log in, create a product profile, complete intake, receive a rule-based package recommendation, view candidate teams, and open a workspace shell.

## Phase 7: Documentation Cleanup

Goal: make docs match the repo after cleanup.

Actions:

- Convert key `.docx` strategy docs to Markdown or keep them with generated Markdown summaries.
- Add `docs/architecture/` for product architecture decisions.
- Add `docs/domain/` for service catalog, package builder, team network, and workspace models.
- Add `docs/api/` for API contracts.
- Add `docs/runbooks/` for local dev, Supabase setup, and deployment.
- Move old migration/completion notes out of `frontend/src/migration` into docs or remove them.

Done when:

- Engineers can understand the target platform without opening Word documents.
- Repo docs describe the current code, not the old template.

## Proposed Target Repo Shape

Short-term shape:

```text
backend/
  src/main/java/com/<namespace>/
    identity/
    catalog/
    product/
    requirements/
    packages/
    teams/
    workspace/
    ai/
    security/
    storage/
    shared/
  src/main/resources/db/changelog/

frontend/
  src/app/
    (auth)/
    (dashboard)/
      dashboard/
      owner/
      catalog/
      packages/
      teams/
      workspaces/
      admin/
  src/features/
    identity/
    catalog/
    products/
    requirements/
    packages/
    teams/
    workspaces/
    ai/
  src/components/
    common/
    ui-component/
  src/lib/
  src/providers/
  src/themes/

docs/
  architecture/
  domain/
  planning/
    cleanup/
  runbooks/
```

## High-Risk Items

- Broad Java package renames can break tests, component scanning, MapStruct, and generated imports. Do them in one focused commit.
- The backend currently includes many AI infrastructure dependencies that may not exist in public repositories. Confirm local Maven resolution before relying on them.
- Frontend route deletion can leave stale menu links, providers, imports, and tests. Remove routes and provider dependencies together.
- Supabase auth role handling is too narrow for the target platform. The frontend currently has only `ADMIN` in `types/auth.ts`, while backend `UserRole` includes `ADMIN`, `USER`, and `MANAGER`. Replace this with platform roles deliberately.
- `SupabaseJwtAuthenticationFilter` currently defaults newly created users to admin in code comments/behavior. New users should not become admins by default in the platform.
- `V003__ai_indexing_queue.yaml` currently contains a patch marker that can break Liquibase.
- The root `docs/` directory appears untracked. Confirm whether planning docs should be committed.

## Immediate Next Checklist

1. Confirm canonical name: ProdUS vs ProdOps Network.
2. Commit this cleanup plan.
3. Add/update `.gitignore`.
4. Remove generated artifacts and fix the Liquibase patch marker.
5. Run current backend and frontend verification commands.
6. Rename platform/package/config branding.
7. Simplify frontend providers and routes.
8. Reset backend domain modules around identity, catalog, requirements, packages, teams, and workspaces.
9. Seed service catalog categories.
10. Build the first owner flow.
