# Scanner, Connector, Storage, And LoomAI Production Readiness Plan

Date: 2026-05-18

Status: partially implemented - live provider material, SBOM/image vulnerability gate, and production storage validation remain

Owner: ProdUS Platform

Source documents:

- `docs/planning/Scanners-AI-integration/integration_brd.md`
- `docs/planning/Scanners-AI-integration/INTEGRATION_LAYER_UI_DESIGN.md`
- `docs/planning/Scanners-AI-integration/Implementation/07-production-readiness-and-operations.md`
- `docs/planning/Scanners-AI-integration/Implementation/08-brd-gap-closure-runtime-connectors-and-schedules.md`
- `docs/planning/Scanners-AI-integration/LOOMAI_DEPLOYMENT_CONFIGURATION_BRD.md`

## Purpose

This plan turns the remaining production dependencies into implementation-ready work. The current code already supports scanner sources, hosted scans, CI uploads, external imports, runtime authorization, scanner schedules, evidence summaries, artifact deletion on disconnect, Studio owner UI, and admin scanner operations.

The remaining work is not feature ideation. It is production hardening, real provider integration, and staging validation:

- GitHub App connector exists in code; real GitHub App credentials, installation, repository picker validation, webhook events, and hosted scan validation remain.
- GitLab connector exists in code; real GitLab app/OAuth credentials, project picker validation, webhook events, and GitLab SAST import validation remain.
- scanner worker Dockerfile exists with pinned scanner tools, non-root runtime, writable scanner cache/home, and verified local image/tool execution from the `backend/` context.
- object-storage retention, signed artifact URL, export bundle, and deletion ledger structures exist in code; production bucket/KMS/block-public-access validation remains.
- LoomAI staging wiring and fallback tests exist; real LoomAI staging/production deployment configuration and live allowlist validation remain.

## Current Implementation Status

Implemented and pushed in commit `d6861e8`:

- `backend/Dockerfile.scanner` hardened scanner worker image definition.
- Scanner runtime readiness gates in admin production readiness.
- GitHub connector models, callback endpoints, source creation, webhook signature verification, and token service boundaries.
- GitLab connector models, callback endpoints, source creation, webhook token verification, and token service boundaries.
- Object-storage governance endpoints for signed artifact URLs, export bundles, retention dry-runs/execution, and artifact deletion ledgers.
- Studio owner UI for GitHub/GitLab connections, repository source creation, signed artifact access, and evidence export.
- Admin scanner operations UI for provider status, connector configuration, storage retention, and cleanup controls.
- LoomAI staging/mock endpoint tests and deterministic fallback coverage.

Verified after implementation:

```bash
cd backend && mvn -q -DskipTests compile
cd backend && mvn -q -Dtest=ScannerEvidenceIntegrationTest,LoomAIIntegrationControllerTest,LoomAIStagingIntegrationTest -Dlogging.level.org.hibernate.SQL=OFF -Dlogging.level.org.hibernate.orm.jdbc.bind=OFF test
cd frontend && npm run type-check
cd frontend && npm run build
```

Docker cleanup notes on 2026-05-18:

- `docker info` succeeds and Docker Desktop is running.
- local cached images run successfully.
- using the repo root as Docker build context sent about 1.6 GB and was incorrect for this Dockerfile.
- the correct scanner build command is `cd backend && docker build -f Dockerfile.scanner -t produs-scanner-worker:local .`.
- the local Docker credential helper path hung on public pulls; a clean Docker config without `credsStore` worked for verification.
- the verified local build command was `cd backend && DOCKER_CONFIG=/tmp/produs-docker-config DOCKER_BUILDKIT=0 docker build -f Dockerfile.scanner -t produs-scanner-worker:local .`.
- `produs-scanner-worker:local` built successfully as image `93ebe5a6c1d5`.
- container runtime verification passed as non-root `produs` user with writable `HOME=/home/produs`.
- verified scanner tools inside the image: Java 21, Gitleaks 8.24.3, Semgrep 1.106.0, OSV-Scanner 2.0.3, Trivy 0.70.0, Checkov 3.2.337, Syft 1.18.1, Grype 0.85.0, Hadolint 2.12.0, and Lighthouse 12.3.0.
- `hadolint /tmp/Dockerfile.scanner` passed against the final Dockerfile.
- Docker containers/images were pruned after verification; no application containers are currently running.

ProdUS remains the system of record. External providers and LoomAI must not own ProdUS authorization, scanner execution policy, evidence retention, package approval, milestone approval, or customer data boundaries.

## Production Readiness Principles

- Every connector must be least-privilege and explain permissions before authorization.
- Every source connection, scan, import, schedule, webhook event, token use, artifact deletion, and AI action must be auditable.
- Scanner execution must be isolated, resource-limited, observable, and reversible.
- Raw source code must not be retained as a product feature.
- Raw scanner artifacts must have retention, deletion, and export controls.
- Runtime scanning must require explicit target authorization.
- AI must support product, project, scanner, package, evidence, milestone, and handoff workflows only.
- AI must not create teams, invite experts, edit profiles, manage accounts, certify security/compliance, approve releases, or release payments.
- The Studio UI must stay Apple-like, clear, productization-focused, and backed by real backend actions.

## Readiness Tracks

### Track 1 - GitHub App Connector

Status: code implemented; live GitHub App credentials, repository picker validation, event processing validation, and hosted scan validation remain.

Goal:

Make GitHub repository authorization production-grade instead of manually created scanner sources.

Backend work:

- Add GitHub App configuration properties:
  - app ID
  - client ID
  - client secret
  - private key
  - webhook secret
  - callback URL
  - allowed organization policy
- Add installation callback endpoint.
- Verify GitHub state/CSRF token for install callback.
- Store installation metadata without storing raw private keys in the database.
- Mint short-lived installation tokens server-side.
- Add repository picker endpoint scoped to authorized installations.
- Create `scan_sources` from selected installation/repository/branch.
- Add webhook receiver with signature verification.
- Process installation, push, pull request, workflow run, and repository events.
- Enqueue optional evidence refresh when relevant events arrive.
- Revoke or mark disconnected sources when GitHub installation is removed.

Frontend work:

- Add "Connect GitHub" action to Studio source setup.
- Add install/callback state handling.
- Add organization/repository/branch picker.
- Show GitHub App permissions and why each permission is needed.
- Show connected installation status and last webhook event.
- Keep manual source creation available only as a local/admin fallback where appropriate.

Security and operations:

- Never expose installation tokens to the browser.
- Do not log token values.
- Verify webhook signatures before parsing payloads.
- Rate-limit callback and webhook endpoints.
- Audit installation, token mint, repo selection, webhook processing, source disconnect, and revocation.

Acceptance criteria:

- Owner can install the GitHub App, select a repository/branch, and create an authorized scanner source.
- Backend can mint an installation token and use it only server-side.
- Webhook signature verification rejects invalid signatures.
- Uninstalled GitHub App marks linked sources disconnected.
- Hosted scan can run from a GitHub-backed source in a production-like environment.
- UI shows requested permissions and connected repository state.

Verification:

```bash
cd backend && mvn -Dtest=*GitHub* test
cd frontend && npm run type-check && npm run build
```

Manual verification:

- GitHub App install callback.
- Repository picker.
- Valid webhook event.
- Invalid webhook signature.
- App uninstall event.
- Scan from selected repository.

### Track 2 - Hardened Scanner Worker Image And Runtime

Status: Dockerfile, backend readiness checks, local image build, and scanner tool verification implemented; SBOM generation and image vulnerability gate remain.

Goal:

Run scanners in a production-safe worker environment with pinned tools, controlled resources, and clear operational behavior.

Runtime work:

- Build a dedicated scanner worker Docker image.
- Pin versions for approved scanner tools:
  - Gitleaks
  - Semgrep CLI
  - OSV-Scanner
  - Trivy
  - Checkov
  - Hadolint
  - Lighthouse
  - OWASP ZAP baseline when policy allows it
- Run as non-root user.
- Use read-only filesystem where possible.
- Mount only temporary scan workspace and output directories.
- Enforce CPU, memory, disk, and timeout limits.
- Clean temporary clone/workspace on success, failure, timeout, and cancellation.
- Produce image SBOM.
- Scan the worker image before release.
- Expose scanner tool versions through admin health.

Backend work:

- Split scanner command configuration by environment.
- Add worker runtime readiness checks to admin production readiness.
- Make missing scanner binaries a release-blocking production gate.
- Add queue dead-letter handling for repeated scanner failures.
- Add scheduler and worker lock ownership visibility.
- Add cleanup-failure audit events and alert hooks.

Security and operations:

- Default L1 scans must not execute project install/build/test scripts.
- Runtime scans must have explicit URL authorization.
- Egress must be restricted by scan depth and tool requirement.
- Tool license review must be completed before production use.

Acceptance criteria:

- Docker scanner image builds reproducibly.
- Scanner tool versions pass inside the image as the non-root runtime user.
- Admin scanner health shows every approved tool and version.
- Backend production readiness fails if required tool binaries are missing.
- Failed, timed-out, and canceled jobs clean the workspace.
- Logs redact secrets and tokens.
- Worker image passes its own vulnerability scan gate or has accepted risk.

Verification:

```bash
cd backend && docker build -f Dockerfile.scanner -t produs-scanner-worker:local .
docker run --rm --entrypoint sh produs-scanner-worker:local -lc 'gitleaks version'
docker run --rm --entrypoint sh produs-scanner-worker:local -lc 'semgrep --version'
docker run --rm --entrypoint sh produs-scanner-worker:local -lc 'osv-scanner --version'
docker run --rm --entrypoint sh produs-scanner-worker:local -lc 'trivy --version'
docker run --rm --entrypoint sh produs-scanner-worker:local -lc 'checkov --version'
cd backend && mvn -Dtest=ScannerEvidenceIntegrationTest test
```

Manual verification:

- Scan small repository.
- Scan repository with intentional secret fixture.
- Cancel queued scan.
- Cancel running scan.
- Force scanner timeout.
- Confirm workspace cleanup after each case.

### Track 3 - Production Object Storage, Retention, Export, And Deletion

Status: backend structures and UI controls implemented; real object storage bucket/KMS/retention validation remains.

Goal:

Make scanner artifacts and evidence storage production-grade, private, auditable, exportable, and deletable.

Backend work:

- Configure production S3-compatible bucket.
- Require private object access.
- Add signed URL generation with short expiry for artifact viewing.
- Add object key naming standard:
  - tenant/product/workspace scope
  - scan run ID
  - tool run ID
  - evidence item ID where applicable
- Add retention policy configuration:
  - raw scanner artifacts
  - evidence artifacts
  - import payloads
  - AI prompt/output traces
  - audit logs
- Add scheduled retention cleanup job.
- Add export bundle creation for product/workspace evidence.
- Add deletion ledger for disconnect and retention cleanup.
- Add deletion verification status and retry handling.

Frontend work:

- Show retention/deletion status in admin operations.
- Show artifact access expiry where relevant.
- Provide "request/export evidence bundle" action for product/workspace owners when backend is ready.
- Keep artifact delete controls explicit and destructive.

Security and operations:

- KMS or provider-managed encryption must be enabled.
- Bucket must block public access.
- Signed URLs must not be persisted in database as durable links.
- Deletion must be auditable and retryable.
- Export bundles must only include authorized tenant/product/workspace data.

Acceptance criteria:

- Raw artifacts are private and only accessed through authorized signed URLs.
- Disconnect/delete removes or redacts stored artifact references and records deletion events.
- Retention cleanup deletes expired raw artifacts and records results.
- Export bundle includes evidence metadata, normalized findings, tool run summaries, and allowed artifacts.
- Cross-tenant artifact access tests fail safely.

Verification:

```bash
cd backend && mvn -Dtest=*Storage* test
cd backend && mvn -Dtest=ScannerEvidenceIntegrationTest test
```

Manual verification:

- Upload CI evidence.
- Open artifact through signed URL.
- Attempt expired signed URL.
- Disconnect source with artifact deletion.
- Run retention cleanup dry run.
- Generate evidence export bundle.

### Track 4 - GitLab Connector

Status: code implemented; live GitLab app/OAuth credentials, project picker validation, webhook validation, and GitLab report import validation remain.

Goal:

Support production GitLab repository authorization, project selection, CI evidence, and security report imports.

Backend work:

- Add GitLab OAuth/app configuration.
- Add GitLab callback endpoint.
- Store GitLab connection metadata safely.
- Add project picker endpoint.
- Create GitLab-backed scan sources.
- Support branch selection.
- Verify GitLab webhook secret/token.
- Import GitLab SAST/security reports where available.
- Support GitLab CI template generation with project-scoped upload token.

Frontend work:

- Add "Connect GitLab" source path.
- Add project/branch picker.
- Display GitLab permissions and limitations.
- Show GitLab CI template action.

Security and operations:

- Prefer project-scoped access.
- Never expose access tokens to browser.
- Audit token use, project selection, webhook events, imports, and disconnect.

Acceptance criteria:

- Owner can connect GitLab, choose project/branch, and create source.
- GitLab webhook validation rejects invalid requests.
- GitLab CI evidence upload works from generated template.
- GitLab SAST payload import normalizes findings.

Verification:

```bash
cd backend && mvn -Dtest=*GitLab* test
cd frontend && npm run type-check && npm run build
```

Manual verification:

- GitLab app/OAuth callback.
- Project picker.
- Generated GitLab CI template.
- GitLab SAST import.

### Track 5 - LoomAI Staging And Production Integration

Status: staging wiring and fallback tests implemented; live LoomAI staging/production deployment configuration and allowlist validation remain.

Goal:

Enable real LoomAI only for governed product/project/scanner workflows while preserving deterministic fallback.

Backend and MCP work:

- Configure staging LoomAI deployment from `LOOMAI_DEPLOYMENT_CONFIGURATION_BRD.md`.
- Configure production LoomAI deployment only after staging passes.
- Register only `PRODUS_MCP_TOOL_PROFILE=loomai-productization`.
- Verify MCP allowlist excludes:
  - team creation
  - solo expert invitations
  - team join requests
  - profile edits
  - account settings
  - community messages
  - payment/commercial actions
- Add provider request tracing and timeout metrics.
- Validate knowledge sync and deletion tombstones.
- Validate fallback when LoomAI is disabled, unavailable, slow, or invalid.

Frontend work:

- Keep AI assistance inside product/project/scanner/evidence/milestone contexts.
- Show evidence basis and confidence.
- Show fallback state clearly.
- Disable AI actions that require missing confirmation.

Security and operations:

- Do not send raw repository dumps, secrets, bearer tokens, private artifact URLs, or customer credentials to LoomAI.
- Do not index customer-owned private product data unless explicitly approved and sanitized.
- Keep live customer context behind authorized ProdUS API/MCP reads.
- Audit provider request ID, input hash, output metadata, fallback state, and user action.

Acceptance criteria:

- Staging LoomAI deployment answers grounded product/scanner/package/evidence questions.
- Disallowed actions are unavailable from the LoomAI action catalog.
- Mutations require explicit confirmation and reason.
- Fallback works without breaking package, scanner, or workspace workflows.
- Admin status shows environment, enabled state, latency, fallback rate, and knowledge sync status.

Verification:

```bash
cd mcp-server && npm test && npm run type-check && npm run build
cd backend && mvn -Dtest=LoomAIIntegrationControllerTest test
cd frontend && npm run type-check && npm run build
```

Manual verification:

- Assistant product readiness question.
- Scanner finding explanation.
- Package recommendation from finding.
- Evidence gap question.
- Disallowed team/profile/community action request.
- LoomAI timeout/fallback path.

## Cross-Track Release Gates

No production rollout until all applicable gates pass:

- backend tests pass
- frontend build passes
- MCP tests/type-check/build pass
- Docker scanner image builds
- required scanner tools are present and versioned
- scanner tool versions pass inside the image as the non-root runtime user
- worker image SBOM and vulnerability scan are completed or approved through accepted risk
- production database migrations apply cleanly
- Supabase auth path works and mock auth is disabled
- CORS is locked to production domains
- webhook secrets are configured
- object storage is private and encrypted
- retention/deletion/export controls are verified
- GitHub webhook signature verification passes
- GitLab webhook verification passes when GitLab is enabled
- runtime scan authorization is enforced
- scanner queue, scheduler, worker, and cleanup alerts are active
- LoomAI allowlist is verified
- disallowed AI tools are absent
- fallback path is tested
- Studio UI is manually verified on desktop and mobile
- every enabled Studio action maps to a backend route, route transition, modal, or persisted state change
- rollback toggles are documented and tested

## Rollout Order

1. Generate SBOM for `produs-scanner-worker:local` and run image vulnerability scan.
2. Configure real object storage in staging and validate signed URL, retention, export, and deletion flows.
3. Configure real GitHub App credentials in staging and validate install, repository picker, webhook, token-backed hosted scan, disconnect, and audit events.
4. Configure real LoomAI staging and validate the productization MCP allowlist, fallback, tracing, and disallowed action boundaries.
5. Run production-readiness scorecard across scanner, storage, MCP, connectors, and LoomAI.
6. Deploy scanner worker and GitHub connector to production behind feature flags.
7. Enable LoomAI production after staging evaluation and fallback verification.
8. Validate GitLab with real app/OAuth credentials when GitLab is required for a customer path.

## Feature Flags And Kill Switches

Required controls:

- disable hosted scan submission
- disable scheduled scanner execution
- disable runtime URL scanning
- disable GitHub provider callbacks/webhook processing
- disable GitLab provider callbacks/webhook processing
- disable external import processing
- disable LoomAI provider while preserving deterministic fallback
- disable AI action execution while preserving read-only assistant answers

## Open Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Scanner worker deployment target | Railway worker, container service, Kubernetes job, cloud batch worker | Use the current deployment platform first if it supports isolated workers and resource limits; move to dedicated worker infrastructure when scan volume increases. |
| GitHub repo clone strategy | direct clone with installation token, archive download, customer CI only | Use installation-token clone for authorized hosted scans; keep CI upload as privacy-sensitive option. |
| Raw artifact retention | fixed global window, plan-based window, workspace-specific window | Start with plan-based defaults and allow workspace-level overrides later. |
| LoomAI data indexing | index safe catalog/templates only, include sanitized case patterns, include private product data | Index safe catalog/templates first; fetch private product context live through authorized APIs/MCP. |
| GitLab priority | before LoomAI, after LoomAI | After GitHub and scanner/storage hardening unless a committed customer requires GitLab first. |

## Completion Definition

This production-readiness plan is complete when:

- GitHub-backed scanner sources work end to end in production.
- Scanner workers run from a hardened, versioned image.
- Storage deletion, retention, and export controls are verified.
- GitLab connector is available or formally deferred with customer-facing scope.
- LoomAI staging and production are configured through the approved allowlist.
- Admin production-readiness gates report pass or documented accepted risk.
- Studio owner/admin flows are manually verified and remain clear, Apple-like, and functional.
