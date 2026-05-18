# Sequence 08 - BRD Gap Closure, Runtime Connectors, And Schedules

Date: 2026-05-18

Status: implemented for current codebase, with external provider credentials/infrastructure pending

## Objective

Close the practical gaps between `docs/planning/Scanners-AI-integration/integration_brd.md`, `docs/planning/Scanners-AI-integration/INTEGRATION_LAYER_UI_DESIGN.md`, and the current scanner/evidence implementation.

This sequence makes the scanner layer production-directed by adding permission transparency, artifact deletion, persistent schedules, runtime authorization coverage, and Studio UI support. It does not fake external provider credentials or claim GitHub/GitLab app installation flows are complete before the provider applications and secrets exist.

## Source Documents

- `../integration_brd.md`
- `../INTEGRATION_LAYER_UI_DESIGN.md`
- `./04-scanner-evidence-foundation.md`
- `./05-scanner-execution-and-normalization.md`
- `./05a-external-imports-and-ci-templates.md`
- `./05b-studio-integration-ui-and-usability.md`
- `./07-production-readiness-and-operations.md`

## Implemented Backend Work

### Connector Permission Visibility

Implemented:

- `GET /api/scanner/connector-permissions`
- provider permission metadata for:
  - GitHub
  - GitLab
  - Runtime URL
  - CI upload
  - External tool import

Purpose:

- Show the owner exactly what each connector needs and why.
- Keep repository, runtime, CI, and external tool modes understandable before authorization.
- Support the UI design requirement that source connection flows explain privacy and permission scope.

### Disconnect With Artifact Deletion

Implemented:

- `POST /api/scanner/sources/{sourceId}/disconnect`
- request field: `deleteArtifacts`
- storage deletion through the existing object-store abstraction
- clearing raw artifact refs and storage keys from related scanner records
- marking scanner evidence as sensitive hidden after deletion
- audit event: `SCANNER_SOURCE_ARTIFACTS_DELETED`

Purpose:

- Satisfy BRD requirements for integration disconnect and deletion controls.
- Give owners a concrete data-control path instead of only disconnecting future scans.
- Avoid leaving stale raw scanner artifacts attached to disconnected sources.

### Persistent Scanner Schedules

Implemented:

- `scanner_schedules` table
- `ScannerSchedule` entity and repository
- `POST /api/scanner/schedules`
- `GET /api/scanner/schedules`
- `PATCH /api/scanner/schedules/{scheduleId}`
- scheduler pickup through `ScannerJobScheduler`
- automatic hosted scan enqueue for due active schedules
- pause/resume/update support

Schedule fields:

- product
- workspace
- source
- creator
- depth
- tool keys
- branch ref
- runtime target URL
- container image ref
- interval days
- next run
- last run
- last scan run
- active state
- audit reason

Purpose:

- Support recurring evidence refresh for active workspaces and support plans.
- Keep operations evidence current without requiring the owner to remember manual rescans.
- Prepare for support-package scanner operations and production-readiness monitoring.

### Runtime Authorization Enforcement

Implemented and tested:

- runtime URL source type support
- explicit runtime scan authorization confirmation requirement
- Lighthouse runtime command path
- normalized runtime finding creation from scanner output

Purpose:

- Satisfy runtime scan requirements without enabling arbitrary third-party scanning.
- Keep dynamic checks passive/authorized by default.

## Implemented Frontend Work

Implemented in the Studio owner productization workspace:

- connector permission explanation panel during source setup
- disconnect option with explicit "delete stored scanner artifacts" checkbox
- scheduled evidence refresh form
- schedule list with active/paused status
- pause/resume schedule action
- scanner workflow loading state tied to schedule and disconnect operations

UI behavior follows the integration UI design guide:

- owner sees the evidence chain rather than raw scanner internals first
- enabled controls call backend actions
- blocked schedule creation explains missing product/source/authorization/interval
- destructive deletion is explicit and visually distinct
- scan schedules appear near scanner sources and evidence context

## Data And Migration

Added migration:

- `backend/src/main/resources/db/changelog/V019__scanner_schedules_and_artifact_deletion.yaml`

Updated migration index:

- `backend/src/main/resources/db/changelog/db.changelog-master.yaml`

New physical table:

- `scanner_schedules`

Repository additions:

- scan runs by source
- tool runs by scan runs
- evidence by scan runs

These repository paths support artifact deletion across all raw outputs attached to a disconnected source.

## Test Coverage

Verified with:

```bash
cd backend && mvn -Dtest=ScannerEvidenceIntegrationTest test
cd frontend && npm run type-check
cd frontend && npm run build
```

Backend integration coverage includes:

- connector permissions endpoint
- runtime scan authorization rejection when confirmation is missing
- authorized runtime scan execution and normalization
- schedule create/pause/product-summary visibility
- disconnect with stored artifact deletion
- CI upload and external import paths already covered by the existing scanner suite

Frontend verification:

- TypeScript compile passes for scanner permission, schedule, disconnect, and summary types.
- Next.js production build passes.

## Remaining External Dependencies

These are intentionally not marked done because they require real external configuration or production infrastructure:

| Area | Required Before Production |
|---|---|
| GitHub App | App registration, installation callback, installation token minting, repo picker, webhook signature verification, permission review. |
| GitLab App/OAuth | App registration, project picker, token storage, webhook/event handling, GitLab security report import credentials. |
| Scanner runtime image | Production image with approved scanner binaries, version pinning, SBOM, non-root execution, resource limits, and network policy. |
| Object storage | Production bucket, KMS/encryption policy, retention windows, deletion SLA verification, evidence export path. |
| LoomAI | Staging/production deployment credentials, MCP endpoint registration, telemetry, evaluation gates, fallback runbook. |
| Scheduled operations | Production scheduler cadence, dead-letter handling, alerting, retry budget, and support-plan rate limits. |

## Exit Criteria

Completed:

- Permission visibility exists in API and Studio UI.
- Disconnect can delete stored scanner artifacts and audit the action.
- Scanner schedules are persistent and actionable.
- Runtime URL scanning requires explicit authorization.
- Product scanner summary includes schedules.
- Studio UI shows and controls schedules.
- Backend scanner integration tests pass.
- Frontend type-check passes.
- Frontend production build passes.

Pending for production:

- provider-native GitHub/GitLab app install flows
- hardened scanner worker runtime
- retention/export operations
- real LoomAI staging/production deployment
