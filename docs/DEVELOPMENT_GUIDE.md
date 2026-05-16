# ProdUS Development Guide

Date: 2026-05-12

This guide describes the current ProdUS codebase as implemented today: Spring Boot backend, Next.js frontend, PostgreSQL production path, Supabase auth path, local mock auth, MinIO-compatible file storage, notification/provider integrations, and the MCP gateway for AI assistants.

## Current Platform Shape

ProdUS productizes a product idea or prototype through a governed workflow:

1. Product owner creates a product profile.
2. Owner submits requirement intake.
3. Platform composes a service package from the catalog and dependency graph.
4. Platform records an auditable recommendation.
5. Owner reviews service modules, matched teams, shortlists teams, and accepts proposals.
6. Platform opens a workspace with milestones, deliverables, participants, evidence, support, disputes, and notifications.
7. Team managers and specialists deliver work against milestones and evidence requirements.
8. Admins manage catalog, recommendation audit, SLA scans, notification delivery, and platform operations.
9. AI assistants can use the MCP gateway to read platform context and execute confirmed backend-backed actions.

LoomAI remains optional. The platform has deterministic recommendation and package composition paths and does not depend on LoomAI for the main workflow.

## Repository Layout

```text
backend/       Spring Boot API, domain modules, Liquibase migrations, tests.
frontend/      Next.js 15 / React 19 / MUI web app.
mcp-server/    TypeScript Model Context Protocol gateway over the backend API.
docs/          Planning, implementation status, UI guidance, and this guide.
railway/       Railway deployment variable/config templates.
docker-compose*.yml
               Local/dev/prod container orchestration.
```

Key backend modules:

```text
backend/src/main/java/com/produs/catalog        Service categories, modules, dependencies.
backend/src/main/java/com/produs/product        Product profiles.
backend/src/main/java/com/produs/requirements   Requirement intake.
backend/src/main/java/com/produs/packages       Package instances, modules, team recommendations.
backend/src/main/java/com/produs/shortlist      Owner team shortlists.
backend/src/main/java/com/produs/teams          Team profiles, members, capabilities, reputation.
backend/src/main/java/com/produs/workspace      Workspaces, milestones, deliverables, participants, support, disputes.
backend/src/main/java/com/produs/attachments    Evidence attachments and signed download URLs.
backend/src/main/java/com/produs/commerce       Proposals, contracts, invoices, support subscriptions.
backend/src/main/java/com/produs/notifications  Notification center, SLA scans, delivery outbox/providers.
backend/src/main/java/com/produs/ai             Recommendation audit and optional LoomAI adapter.
backend/src/main/java/com/produs/mcp            MCP invocation audit API.
```

Key frontend areas:

```text
frontend/src/features/platform                  Main ProdUS product UI.
frontend/src/features/platform/api.ts           Backend API client wrappers.
frontend/src/features/platform/types.ts         Platform DTO types.
frontend/src/components/ui-component            Existing UI component library.
frontend/src/components/common                  Shared error/loading/security wrappers.
frontend/src/data/mockUsers.ts                  Local mock user credentials.
frontend/src/app/(dashboard)                    Authenticated app routes.
frontend/src/features/landing                   Public landing experience.
```

## Prerequisites

Use these versions unless a future upgrade explicitly changes them:

- Java 21
- Maven 3.8+
- Node 20+
- npm 10+
- Docker Desktop or compatible Docker engine for Postgres, MinIO, Docker image checks, and Compose

The frontend scripts wrap Node through `frontend/scripts/with-node20.sh`. The repo also includes `.nvmrc`.

## Local Development Modes

### Fast Mocked Mode

Use this for normal UI/API development. It uses:

- H2 in-memory database
- Mock users
- Mock/local AI paths
- MinIO for attachment storage

```bash
./dev-mocked.sh
```

Access points:

```text
Frontend:      http://localhost:3000
Backend API:   http://localhost:8080
Swagger UI:    http://localhost:8080/swagger-ui.html
Health:        http://localhost:8080/api/health
H2 Console:    http://localhost:8080/h2-console
MinIO API:     http://localhost:9000
MinIO Console: http://localhost:9001
```

Stop background services:

```bash
./stop.sh
```

### Manual Mocked Mode

Use this when you want separate terminals and tighter control.

Terminal 1, backend:

```bash
cd backend
SPRING_PROFILES_ACTIVE=dev \
APP_MOCK_AUTH_ENABLED=true \
APP_RATE_LIMIT_ENABLED=false \
APP_NOTIFICATION_DELIVERY_SCHEDULER_ENABLED=false \
APP_SUPPORT_SLA_SCHEDULER_ENABLED=false \
mvn spring-boot:run
```

Terminal 2, frontend:

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8080/api \
NEXT_PUBLIC_MOCK_AUTH_ENABLED=true \
NEXT_PUBLIC_ENABLE_MOCK_USER_TESTER=true \
npm run dev -- --hostname 127.0.0.1 --port 3001
```

Terminal 3, optional MCP gateway:

```bash
cd mcp-server
npm install
npm run build
PRODUS_API_BASE_URL=http://127.0.0.1:8080/api \
PRODUS_MCP_ALLOWED_ORIGINS=http://127.0.0.1:3001,http://localhost:3001 \
PRODUS_MCP_HOST=127.0.0.1 \
PRODUS_MCP_PORT=8081 \
npm start
```

### Docker Compose Mode

Use this for container and service-boundary checks.

```bash
docker compose -f docker-compose.dev.yml up --build
```

Default dev ports:

```text
Frontend:      http://localhost:3001
Backend API:   http://localhost:8080/api
MCP gateway:   http://localhost:8081/mcp
Postgres:      localhost:5433 -> container 5432
MinIO API:     http://localhost:9000
MinIO Console: http://localhost:9001
```

Validate Compose files without starting services:

```bash
docker compose -f docker-compose.dev.yml config
docker compose -f docker-compose.yml config
docker compose -f docker-compose.prod.yml config
```

## Mock Users

Mock auth is dev-only and is enabled by the `dev` Spring profile plus frontend `NEXT_PUBLIC_MOCK_AUTH_ENABLED=true`.

| Role | Email | Password | Purpose |
| --- | --- | --- | --- |
| Admin | `admin@produs.com` | `admin123` | Catalog, operations, audit, SLA, notification delivery. |
| Product owner | `owner@produs.com` | `owner123` | Product profile, requirements, packages, shortlist, workspace ownership. |
| Team manager | `team@produs.com` | `team123` | Team profile, proposals, support status, team delivery. |
| Specialist | `specialist@produs.com` | `specialist123` | Assigned deliverable execution and evidence. |
| Advisor | `advisor@produs.com` | `advisor123` | Recommendation/advisory review where allowed. |

Useful mock endpoints:

```bash
curl http://localhost:8080/api/mock/auth/credentials
curl -X POST http://localhost:8080/api/mock/auth/login-as/PRODUCT_OWNER
curl -X POST http://localhost:8080/api/mock/feed/users
curl -X POST http://localhost:8080/api/mock/feed/platform-demo
curl http://localhost:8080/api/mock/feed/status
```

The platform demo feed creates realistic service catalog data, product/package/workspace examples, team capabilities, milestones, deliverables, commerce records, support records, and notification context.

## Environment Configuration

Backend common variables:

```text
PORT=8080
SPRING_PROFILES_ACTIVE=dev|prod|test
DATABASE_URL=jdbc:postgresql://...
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=...
SUPABASE_URL=https://...
SUPABASE_API_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
APP_MOCK_AUTH_ENABLED=false
APP_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
APP_RATE_LIMIT_ENABLED=true
AWS_S3_ENDPOINT=http://localhost:9000
AWS_S3_BUCKET=produs
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
LOOMAI_ENABLED=false
LOOMAI_BASE_URL=
LOOMAI_API_KEY=
```

Frontend common variables:

```text
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_MOCK_AUTH_ENABLED=true|false
NEXT_PUBLIC_ENABLE_MOCK_USER_TESTER=true|false
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_ENVIRONMENT=development|production
```

MCP gateway variables:

```text
PRODUS_API_BASE_URL=http://localhost:8080/api
PRODUS_MCP_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
PRODUS_MCP_ALLOWED_HOSTS=
PRODUS_MCP_REQUIRE_AUTH=true
PRODUS_MCP_LOG_LEVEL=info
PRODUS_MCP_HOST=127.0.0.1
PRODUS_MCP_PORT=8081
```

Production must use PostgreSQL and Supabase auth. Mock auth and H2 are only local/test conveniences.

## Backend Development

Run from `backend/` unless noted.

```bash
mvn -DskipTests compile
mvn test
mvn clean test
mvn spring-boot:run
```

Important backend rules:

- Keep controllers thin. Put business rules in services/facades.
- Expose DTOs, not JPA entities.
- Preserve backend authorization even when a frontend page or MCP tool already hides an action.
- Use Liquibase for schema changes under `backend/src/main/resources/db/changelog/`.
- Add every migration to `db.changelog-master.yaml`.
- Keep request validation explicit with Bean Validation where possible.
- Preserve `X-Request-ID` propagation and Problem Details behavior.
- Do not store secrets, raw tokens, webhook payload secrets, or private file URLs in audit rows.

Schema change checklist:

1. Add entity/repository/service changes.
2. Add a new Liquibase YAML migration.
3. Include it in `db.changelog-master.yaml`.
4. Add or update `PostgresLiquibaseContainerTest` coverage when a new table matters.
5. Run `mvn clean test`.

## Frontend Development

Run from `frontend/`.

```bash
npm install
npm run dev
npm run type-check
npm test -- --runInBand
npm run build
npm audit --omit=dev
```

Frontend implementation rules:

- Prefer existing MUI and `frontend/src/components/ui-component` components before adding new UI primitives.
- Keep role-specific flows tailored:
  - Owner: product-centered lifecycle, service package, team shortlist/compare, unified workspace state.
  - Team manager: opportunities, proposals, active projects, team profile, reputation.
  - Specialist: assigned deliverables, evidence, support/dispute work.
  - Admin: catalog, operations, recommendation audit, SLA scans, notification delivery.
- Every visible button should either perform a backend-backed action, navigate intentionally, or be explicitly disabled until implemented.
- Keep API calls in `frontend/src/features/platform/api.ts` or a local feature API module that follows the same pattern.
- Keep DTO types in `frontend/src/features/platform/types.ts`.
- Use React Query keys that include IDs and filters to avoid stale cross-entity data.
- Avoid relying only on frontend guards for security. Backend role checks are authoritative.

Useful routes:

```text
/                         Landing page.
/dashboard                Role-aware dashboard.
/catalog                  Service catalog alias.
/services                 Lifecycle service catalog.
/products                 Owner product profiles.
/products/new             Guided product creation.
/owner/project-cart       Draft cart for services and delivery talent.
/owner/requirements       Requirement intake.
/packages                 Service plan builder/details and commerce.
/packages/new             Service plan creation entry point.
/teams                    Team matching and team management.
/solo-experts             Solo expert discovery and profiles.
/workspaces               Unified workspace/delivery surface.
/admin/catalog            Admin catalog management.
/admin/recommendations    AI recommendation audit.
```

## MCP Gateway Development

The MCP gateway lives in `mcp-server/` and uses the official MCP SDK over Streamable HTTP.

```bash
cd mcp-server
npm install
npm run type-check
npm test
npm run build
npm start
```

Current MCP surface:

- Resources: catalog categories/modules, products, packages, team recommendations, workspaces, notification summary, admin operations.
- Prompts: owner productization, package review, team match explanation, workspace risk, support response, admin platform review.
- Tools: 23 backend-backed tools across catalog reads, owner workflow, team workflow, support/dispute workflow, and admin operations.

MCP security rules:

- The MCP gateway never reads PostgreSQL directly.
- It forwards the end-user bearer token to the backend.
- Backend authorization remains authoritative.
- Mutating tools require `confirm: true` and `reason`.
- Input hashes are stable and redact token/secret keys.
- Tool invocations are audited through `/api/mcp/invocations`.
- Keep production MCP endpoints private and authenticated.

Basic mocked token for MCP smoke:

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/mock/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"owner@produs.com","password":"owner123"}' \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>console.log(JSON.parse(d).token))')
```

Then connect an MCP-capable client to:

```text
http://127.0.0.1:8081/mcp
Authorization: Bearer <token>
```

When adding a new MCP tool:

1. Confirm a backend API already enforces authorization and validation.
2. Add the input schema in `mcp-server/src/mcpServer.ts`.
3. Require confirmation for mutations.
4. Forward request ID and idempotency key where relevant.
5. Add audit success/failure/forbidden behavior.
6. Add tests for validation, header forwarding, and error mapping.
7. Update `docs/planning/implementation/2026-05-12-mcp-server-ai-integration.md` if the production contract changes.

## Productization Workflow Development

The main workflow should remain coherent as one product lifecycle rather than scattered pages.

Backend data flow:

```text
ProductProfile
  -> RequirementIntake
  -> PackageInstance + PackageModule
  -> TeamRecommendation / Shortlist
  -> QuoteProposal / ContractAgreement / InvoiceRecord
  -> Workspace
  -> Milestone / Deliverable / EvidenceAttachment
  -> SupportSubscription / SupportRequest / DisputeCase
  -> Notification / DeliveryOutbox / Audit records
```

When adding a new workflow capability:

1. Decide the user role and lifecycle point first.
2. Add the backend model/service/API with role checks.
3. Add DTO tests and integration coverage using mock users.
4. Add frontend UI in the relevant role surface.
5. Make every button call the real API.
6. Add notification/audit behavior if the action affects another actor.
7. Add MCP exposure only if it is useful and safe for an AI assistant.
8. Run backend, frontend, and MCP checks as appropriate.

## Testing Matrix

Backend:

```bash
cd backend
mvn -DskipTests compile
mvn test
mvn clean test
```

Frontend:

```bash
cd frontend
npm run type-check
npm test -- --runInBand
npm run build
npm audit --omit=dev
```

MCP gateway:

```bash
cd mcp-server
npm run type-check
npm test
npm run build
npm audit --omit=dev
```

Docker readiness:

```bash
docker compose -f docker-compose.dev.yml config
docker compose -f docker-compose.yml config
docker compose -f docker-compose.prod.yml config
docker build -t produs-backend:local ./backend
docker build -t produs-frontend:local ./frontend
docker build -t produs-mcp-server:local ./mcp-server
```

Live smoke minimum:

1. Start backend and frontend.
2. Login as owner.
3. Create or inspect a product.
4. Submit requirements.
5. Build/inspect a package.
6. Shortlist a team or inspect recommendations.
7. Create/open a workspace.
8. Upload/list evidence if MinIO is running.
9. Confirm notifications render and mark-read works.
10. If MCP is in scope, connect with a mock token and run a read tool plus one confirmed low-risk mutation.

## Docker And Production Path

Production assumptions:

- PostgreSQL is the database.
- Supabase is the auth/users provider.
- Mock auth is disabled.
- H2 is disabled.
- File storage uses S3-compatible storage.
- Backend CORS is explicit through `APP_CORS_ALLOWED_ORIGINS`.
- MCP requires bearer auth and a locked-down origin/host allowlist.
- Notification providers are configured intentionally; audit-log provider is safe for local/dev.

Build images:

```bash
docker build -t produs-backend:local ./backend
docker build -t produs-frontend:local ./frontend
docker build -t produs-mcp-server:local ./mcp-server
```

Do not deploy with placeholder Supabase values, mock auth, dev webhook secrets, or public MinIO credentials.

## Common Troubleshooting

Port already in use:

```bash
lsof -tiTCP:8080 -sTCP:LISTEN | xargs -r kill
lsof -tiTCP:3000 -sTCP:LISTEN | xargs -r kill
lsof -tiTCP:8081 -sTCP:LISTEN | xargs -r kill
```

Frontend shows Supabase configuration warning:

- For local mock mode, ensure `NEXT_PUBLIC_MOCK_AUTH_ENABLED=true`.
- For production-like mode, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Backend rejects frontend requests:

- Check `APP_CORS_ALLOWED_ORIGINS`.
- Check the frontend `NEXT_PUBLIC_API_URL`.
- Check whether mock auth is enabled on both backend and frontend.

Catalog or workspace appears empty in dev:

```bash
curl -X POST http://localhost:8080/api/mock/feed/platform-demo
```

MCP returns 401:

- Send `Authorization: Bearer <token>`.
- Ensure `PRODUS_MCP_REQUIRE_AUTH=true` in production and use a real Supabase JWT there.
- In dev, get a token from `/api/mock/auth/login`.

MCP returns origin forbidden:

- Add the UI or client origin to `PRODUS_MCP_ALLOWED_ORIGINS`.

Docker frontend cannot reach backend:

- Browser requests use `NEXT_PUBLIC_API_URL`, so this must be a URL reachable from the browser, usually `http://localhost:8080/api` for local Compose.

## Commit Discipline

- Keep generated `node_modules/`, `dist/`, `target/`, `.next/`, logs, and local env files out of commits.
- Commit migrations with the code that uses them.
- Do not commit real Supabase keys, webhook secrets, Railway tokens, API tokens, or MinIO production credentials.
- Before pushing a functional slice, run the smallest credible verification set and document any skipped checks in the final handoff.
