# Scanner Worker Separation Change Plan

Date: 2026-06-17

Status: implemented and deployed to staging

## Decision

ProdUS scanner execution should run outside the public API backend.

The API backend remains the product system of record. It owns users, products, scan sources, scan requests, normalized findings, evidence, services, workspaces, authorization, and audit. The scanner worker owns only heavy scanner execution: cloning authorized sources, running scanner tools, collecting artifacts, redacting output, and writing results back to the shared database/object-storage boundary through existing backend code.

## Why This Matters

Scanner runs are heavier and less predictable than normal product API traffic:

- repository clone can hang or fail;
- ZAP, Lighthouse, Trivy, Checkov, Semgrep, and future tools can consume CPU and memory;
- scanner dependencies bloat the runtime image;
- runtime URL checks need stricter authorization and timeout behavior;
- adding more scanners should not make the main ProdUS API unstable.

Separating the worker gives the product room to add scanner coverage while keeping the owner UI, product workspace, and LoomAI/MCP APIs responsive.

## Target Runtime Shape

```text
Owner UI / API clients
        |
        v
ProdUS API backend
- public API
- auth and authorization
- creates scan runs/jobs
- reads scan status/results
- scanner worker disabled
        |
        v
Shared Postgres queue + object storage
        ^
        |
ProdUS scanner-worker service
- private Coolify service
- built from backend/Dockerfile.scanner
- scanner worker enabled
- no public domain
- polls queued scanner jobs
- runs scanner tools
- writes normalized evidence/results
```

## Deployment Contract

### ProdUS API Backend

Use the normal backend image/Dockerfile.

Required scanner flags:

```bash
APP_SCANNER_WORKER_ENABLED=false
APP_SCANNER_SCHEDULER_ENABLED=false
APP_SCANNER_SEPARATE_WORKER_ENABLED=true
```

Meaning:

- API accepts and queues scan requests.
- API does not execute scanner jobs.
- API readiness/admin UI understands execution is delegated to a separate service.
- API container does not need scanner binaries on `PATH`.

### ProdUS Scanner Worker

Use `backend/Dockerfile.scanner`.

Required scanner flags:

```bash
APP_SCANNER_WORKER_ENABLED=true
APP_SCANNER_SCHEDULER_ENABLED=true
APP_SCANNER_SEPARATE_WORKER_ENABLED=false
APP_SCANNER_REQUIRE_RUNTIME_TOOL_AVAILABILITY=true
SPRING_LIQUIBASE_ENABLED=false
APP_NOTIFICATION_DELIVERY_SCHEDULER_ENABLED=false
APP_SUPPORT_SLA_SCHEDULER_ENABLED=false
LOOMAI_SAFE_KNOWLEDGE_AUTO_SYNC_ENABLED=false
```

Meaning:

- Worker runs scanner jobs only.
- Database migrations stay owned by the API backend deployment.
- Notification, support SLA, and LoomAI safe-knowledge schedulers stay out of the scanner worker.
- Worker image must contain the approved scanner binaries.

The worker must share the same:

- `SPRING_DATASOURCE_*`
- `AWS_S3_*`
- scanner provider secrets when hosted repository scans need them
- Supabase values required for application startup

The worker should not have:

- a public domain;
- browser CORS exposure;
- frontend variables;
- owner-facing route traffic.

## Coolify Staging Sequence

1. Deploy the API backend first.
2. Confirm the API backend has:
   - `APP_SCANNER_WORKER_ENABLED=false`
   - `APP_SCANNER_SCHEDULER_ENABLED=false`
   - `APP_SCANNER_SEPARATE_WORKER_ENABLED=true`
3. Create or update a separate Coolify service named `produs-scanner-worker-staging`.
4. Configure it from the same repository and branch, using:
   - build context: `backend`
   - Dockerfile: `Dockerfile.scanner`
   - no public domain
   - same database and storage env as backend
   - worker flags listed above
5. Deploy scanner worker after the API backend is healthy.
6. Verify that the API still responds quickly while scanner jobs are queued/running.

## Staging Deployment Result

Completed on 2026-06-17 against `origin/main` commit `f0cc4e92ae5304456426a184070b7d58664d4ee2`.

Coolify services:

- API backend: `produs-backend-staging` / `jk3n39yatabf8zc9sn5nknj9`
- Scanner worker: `produs-scanner-worker-staging` / `al1npi3tcu5jusdf9qlw8ub6`
- Frontend: `produs-frontend-staging` / `wfvdve1ezt7vixejye4bhrgl`

Final staging shape:

- Backend app uses `base_directory=/backend` and `dockerfile_location=/Dockerfile`.
- Scanner worker app uses `base_directory=/backend` and `dockerfile_location=/Dockerfile.scanner`.
- Scanner worker has no public FQDN.
- Backend public health is `UP`.
- Scanner worker Coolify status is `running:healthy`.
- Frontend is deployed from the same commit.

## Repo Changes

Implemented in this pass:

- `docker-compose.yml`, `docker-compose.dev.yml`, and `docker-compose.prod.yml` now define an explicit `scanner-worker` service.
- API services now explicitly disable local scanner execution and mark a separate worker as expected.
- Scanner worker services use `backend/Dockerfile.scanner`, enable scanner execution, disable unrelated schedulers, and keep Liquibase disabled.
- Backend scanner properties now include `separate-worker-enabled`.
- Admin readiness now treats the separate worker as a valid scanner execution mode.
- Admin scanner operations now distinguishes local worker execution from separate worker execution, so missing scanner binaries in the API image are not shown as false failures.

## Verification

Local verification:

```bash
docker compose -f docker-compose.prod.yml config
docker compose -f docker-compose.dev.yml config
cd backend && mvn -q -DskipTests compile
cd backend && mvn -q -Dtest=ScannerEvidenceIntegrationTest test
cd frontend && npm run type-check
cd frontend && npm run build
```

Scanner image verification:

```bash
cd backend
DOCKER_CONFIG=/tmp/produs-docker-config DOCKER_BUILDKIT=0 docker build -f Dockerfile.scanner -t produs-scanner-worker:local .
docker run --rm --entrypoint sh produs-scanner-worker:local -lc 'gitleaks version && semgrep --version && osv-scanner --version && trivy --version && checkov --version'
```

Staging verification:

- `GET https://produs-api-staging.46.224.145.148.sslip.io/api/health` returns healthy.
- Admin readiness scanner worker gate says scanner execution is delegated to the separate scanner-worker service.
- Admin scanner operations shows worker mode as `Separate`, not red `Off`.
- Scanner-worker Coolify service is running from `backend/Dockerfile.scanner`.
- Queued scanner jobs move from `QUEUED` to `RUNNING`/terminal state without enabling the API backend worker.

Verified on staging:

- `GET https://produs-api-staging.46.224.145.148.sslip.io/actuator/health` returned `{"status":"UP"}`.
- Coolify API reported backend `running:healthy` from `/Dockerfile`.
- Coolify API reported scanner worker `running:healthy` from `/Dockerfile.scanner` with no FQDN.
- Scanner admin health reported:
  - `schedulerEnabled=false`
  - `workerEnabled=false`
  - `separateWorkerEnabled=true`
  - `executionMode=SEPARATE_SERVICE`
  - `toolAvailabilityAuthoritative=false`
- Coolify env checks confirmed:
  - API has scanner scheduler and worker disabled.
  - API has separate worker mode enabled.
  - Scanner worker has scanner scheduler and worker enabled.
  - Scanner worker has Liquibase disabled.
  - Scanner worker has unrelated notification, support SLA, and safe-knowledge schedulers disabled.

Local scanner image build was not run locally because Docker Desktop was not available in this shell. The remote Coolify scanner-worker deployment built and ran the scanner image successfully.

## Rollback

Fast rollback:

1. Stop the scanner-worker service.
2. Set API backend `APP_SCANNER_SEPARATE_WORKER_ENABLED=false`.
3. Leave `APP_SCANNER_WORKER_ENABLED=false` if hosted scans should pause safely.

Emergency single-container fallback:

1. Set API backend `APP_SCANNER_WORKER_ENABLED=true`.
2. Set `APP_SCANNER_REQUIRE_RUNTIME_TOOL_AVAILABILITY=true`.
3. Only use this if the backend image has scanner binaries available or is temporarily deployed from `backend/Dockerfile.scanner`.

## Open Follow-Ups

- Add a scanner-worker heartbeat table so the API can show last worker poll time and tool versions from the actual worker container.
- Add dead-letter/retry handling for repeated worker failures.
- Add worker resource limits in Coolify: CPU, memory, disk, timeout, and concurrency.
- Add SBOM and vulnerability gate for the scanner-worker image before production.
