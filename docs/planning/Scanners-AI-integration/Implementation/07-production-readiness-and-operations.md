# Sequence 07 - Production Readiness And Operations

Date: 2026-05-17

Status: implemented - operational gates, scanner/admin health, and fallback controls

## Objective

Harden the scanner, MCP, and LoomAI-enabled productization flow for production-grade operation, monitoring, security, and rollback.

This sequence is required before enabling real LoomAI or hosted scanner execution for production users.

## BRD Requirements Considered

This sequence operationalizes production requirements from `docs/planning/Scanners-AI-integration/integration_brd.md`.

Primary BRD sections:

- Section 12, operational requirements `FR-SEC-*` and `FR-OP-*`.
- Section 13, non-functional requirements for reliability, scalability, performance, multi-tenancy, auditability, explainability, extensibility, and compliance readiness.
- Section 14, business rules for AI boundaries, runtime authorization, critical finding closure, risk acceptance, and deep scan consent.
- Section 16, token handling, worker isolation, secret redaction, runtime authorization, and retention.
- Section 18, API/UI operational surfaces.
- Section 21, reporting and metrics.
- Section 23, scanner/AI/compute/privacy risks and mitigations.
- Section 24, BRD acceptance criteria for scanner execution, evidence workflow, security, runtime scan, and admin operations.

Design commitment:

- Production rollout is blocked until the scanner/evidence path is observable, auditable, reversible, and privacy-safe.
- Operations metrics must measure productization value, not scanner vanity output alone.
- Release gates must verify BRD acceptance areas before real hosted scanner execution or real LoomAI integration is exposed to production users.

## In Scope

- Production environment configuration.
- Postgres/Supabase path verification.
- MCP production hardening.
- LoomAI production registration.
- Scanner worker operations.
- Observability dashboards.
- Rate limits and abuse controls.
- Retention and deletion controls.
- Release gates and rollback.

Implemented:

- Admin production-readiness API at `/api/admin/production-readiness` reports database, Supabase auth, mock-auth, CORS, rate-limit, scanner worker/tool pack, LoomAI runtime, MCP profile, webhook secrets, and evidence storage gates.
- Admin AI audit UI displays the production gates alongside LoomAI readiness and safe knowledge sync.
- Scanner operations UI displays worker/scheduler state, queue/running counts, configured scanner tool health, recent scanner jobs, retry/cancel actions, and external import health.
- API rate limiting is enabled by default and emits standard rate-limit headers.
- LoomAI can be disabled with deterministic fallback while keeping package and assistant workflows usable.
- MCP supports `PRODUS_MCP_TOOL_PROFILE=loomai-productization` and defaults to auth-required operation.
- Backend controller tests cover admin-only production readiness and avoid returning secret values.

## Out Of Scope

- New product features.
- New scanner tool families beyond approved sequence scope.
- AI actions outside product/project/scanning workflows.

## Production Configuration

Backend:

- PostgreSQL required.
- Supabase auth required.
- Mock auth disabled.
- H2 disabled outside local/test.
- CORS locked to production domains.
- File storage configured with private bucket/object access.
- Webhook secrets configured.
- LoomAI disabled by default until release gate.

MCP:

- `PRODUS_MCP_REQUIRE_AUTH=true`
- locked origin allowlist
- locked host allowlist where supported
- private deployment endpoint where possible
- request ID propagation
- audit enabled

LoomAI:

- environment-specific deployment
- production API key/secret
- approved retrieval sources
- approved action allowlist
- no raw repo/artifact indexing
- fallback configured

Scanner workers:

- isolated runtime
- queue-backed execution
- limited CPU/memory/time
- no broad network access
- temporary clone cleanup
- controlled scanner image versions

## Operational Dashboards

Required dashboards:

- MCP invocation rate, latency, failures, forbidden attempts.
- LoomAI provider success/fallback/timeout rate.
- AI recommendation volume by type/provider/fallback.
- AI recommendation acceptance/rejection rate.
- Retrieval/index freshness and deletion sync status.
- Assistant session bootstrap failures.
- Scan queue depth.
- Scan completion rate.
- Tool run failure rate.
- Average scan duration by depth/tool.
- Findings by severity/status/service category.
- False positive rate.
- Rescan improvement score.
- Package recommendation conversion rate.
- Milestone evidence pass rate.
- Team delivery record quality for project matching credibility.
- Evidence upload failures.
- Worker health and cleanup failures.
- Security audit events.

## Alerts

Required alerts:

- MCP error spike.
- MCP forbidden attempts spike.
- LoomAI timeout/fallback spike.
- LoomAI indexing failure or stale index.
- Retrieval connector authorization failure spike.
- Assistant session bootstrap failure spike.
- Scanner queue stalled.
- Worker cleanup failure.
- Secret redaction failure.
- Artifact upload/download failure.
- Unauthorized access attempts.
- Runtime scan target abuse indicators.

## Security Review

Review areas:

- Auth and role boundaries.
- MCP allowlist and excluded tools.
- Backend authorization for every AI-visible action.
- Scanner authorization and scan depth consent.
- Runtime URL authorization.
- Artifact access and signed URL expiry.
- Secret/token redaction.
- Audit coverage.
- Data retention/deletion.
- Rate limiting.
- CORS/origin settings.
- Webhook signature handling.
- Retrieval source approval and deletion sync.
- Case-pattern anonymization.
- Scanner tool license review.

## Evaluation And Release Scorecards

Before production enablement, create repeatable evaluation fixtures for:

- service recommendation quality
- package dependency completeness
- finding explanation accuracy
- evidence review correctness
- refusal behavior for unsupported or unsafe actions
- excluded-tool enforcement
- secret redaction
- cross-owner data isolation
- fallback behavior when LoomAI is unavailable

Release scorecard must include:

- pass/fail result
- fixture count
- known gaps
- owner approval
- rollback decision

No production LoomAI release should proceed if the assistant can expose another user's data, expose secrets, execute excluded tools, or claim security/compliance certification.

## Data Retention

Define retention for:

- scan runs
- tool runs
- raw artifacts
- normalized findings
- evidence items
- AI recommendations
- MCP invocations
- provider request metadata
- scanner logs
- knowledge sync records
- retrieval evaluation fixtures

Default principles:

- Retain normalized findings while product/workspace is active.
- Retain raw artifacts only as long as needed for evidence and dispute support.
- Delete temporary repo clones immediately after scan.
- Allow product/workspace-level export and deletion paths.
- Delete/update indexed knowledge through data-sync tombstones when source records change or are removed.

## Release Gates

Production release requires:

- Backend tests pass.
- Frontend build passes.
- MCP tests and type-check pass.
- Production-like Docker path verified.
- Postgres migrations verified.
- Supabase auth path verified.
- Mock auth disabled.
- MCP auth required.
- LoomAI allowlist verified.
- Excluded tools verified absent from LoomAI action catalog.
- Retrieval source list verified.
- Knowledge deletion sync verified.
- Evaluation scorecard passed.
- Scanner authorization verified.
- No raw secrets in AI output/audit.
- Scanner tool licensing reviewed for production SaaS use.
- Studio UI reviewed against `docs/planning/Scanners-AI-integration/INTEGRATION_LAYER_UI_DESIGN.md`.
- Apple-like visual quality reviewed against `docs/UI-Design-Prompot.md`.
- Every enabled Studio UI action verified against a real backend route, mutation, modal, or persisted state change.
- Desktop and mobile owner/team/admin scanner flows manually verified.
- Rollback path documented.

Suggested commands:

```bash
cd backend && mvn test
cd frontend && npm run build
cd mcp-server && npm test && npm run type-check && npm run build
docker compose -f docker-compose.prod.yml build
```

## Rollback

Rollback controls:

- Disable LoomAI with `LOOMAI_ENABLED=false`.
- Disable assistant UI feature flag.
- Disable hosted scan submission while preserving evidence read views.
- Keep deterministic package builder active.
- Keep MCP endpoint private/authenticated.
- Revert scanner worker deployment independently from backend API when possible.

## Exit Criteria

- Production-like environment passes release gates.
- LoomAI can be disabled without breaking core workflows.
- Scanner workers can be paused without breaking evidence/project views.
- Dashboards and alerts cover MCP, LoomAI, scanner, evidence, and audit flows.
- Studio UI is attractive, intuitive, responsive, and functional across owner, team, and admin views.
- Security review findings are resolved or explicitly accepted with owner/date.

## Ongoing Operations

Weekly:

- Review scanner failure rates.
- Review LoomAI fallback rates.
- Review MCP forbidden attempts.
- Review critical/high unresolved findings.

Monthly:

- Review retention/deletion compliance.
- Review allowlist changes.
- Review AI recommendation quality.
- Review scanner tool versions.
- Review retrieval source inventory and stale indexed records.
- Review scanner tool licensing changes.

Per release:

- Re-run release gates.
- Re-run AI evaluation scorecard.
- Verify excluded tools remain excluded.
- Verify no new AI action bypasses backend authorization.
